// Search query logic
import { getDb } from '../db/client';
import { getCanonicalNames, isValidOuacCode } from '../etl/ouacValidation';

function titleCase(s: string): string {
	return s.replace(/\b\w/g, c => c.toUpperCase());
}

// Universities whose proper display names can't be recovered by simple titleCase
// (e.g. apostrophes, abbreviations, special casing)
const UNIVERSITY_DISPLAY: Record<string, string> = {
	"queens university": "Queen's University",
	"mcmaster university": "McMaster University",
	"ocad university": "OCAD University",
	"ubc": "University of British Columbia",
	"tmu": "Toronto Metropolitan University",
};

function displayUniversity(norm: string): string {
	return UNIVERSITY_DISPLAY[norm.toLowerCase()] ?? titleCase(norm);
}

export function searchPrograms(q: string, limit = 20) {
	const db = getDb();
	const qLower = q.toLowerCase().trim();
	const qUpper = q.toUpperCase().trim();

	// Split into words so "waterloo computer science" matches rows where each
	// word appears somewhere in (university_norm || ' ' || program_name_norm || ' ' || ouac_code).
	// All words must match (AND logic). Single-word queries behave exactly as before.
	const words = qLower.split(/\s+/).filter(Boolean);
	const wordPatterns = words.map(w => `%${w}%`);

	// Build per-word filter: each word must appear in the combined search string
	const wordConditions = words
		.map(() => `(university_norm LIKE ? OR program_name_norm LIKE ? OR LOWER(COALESCE(ouac_code,'')) LIKE ?)`)
		.join(' AND ');

	// Params: for each word, 3 bindings (university_norm, program_name_norm, ouac_code)
	const wordParams = wordPatterns.flatMap(p => [p, p, p]);

	// For ordering — single-query pattern (whole string) still used for ranking
	const fullPattern = `%${qLower}%`;

	// Group by (ouac_code, university_norm) for OUAC-matched programs so that
	// different programs at the same university (TAD=UTSG CS vs TXC=UTSC CS) are
	// always separate results, and co-op/honours variants collapse into one.
	// For unmatched rows fall back to (program_name_norm, university_norm).
	const rows = db.prepare(`
		SELECT
			MAX(ouac_code) AS ouac_code,
			university_norm,
			MIN(program_name_norm) AS program_name_norm,
			COUNT(*) AS n_total
		FROM admissions a
		WHERE ${wordConditions}
		-- Only group by ouac_code when it looks like a real validated code
		-- (all-caps, no spaces/slashes, 2-6 chars). Bogus user strings like
		-- "idk", "n/a", "ouac" fall back to program_name_norm grouping.
		GROUP BY COALESCE(
		  CASE
		    WHEN ouac_code IS NOT NULL
		     AND ouac_code = UPPER(ouac_code)
		     AND LENGTH(TRIM(ouac_code)) BETWEEN 2 AND 6
		     AND ouac_code NOT LIKE '% %'
		     AND ouac_code NOT LIKE '%/%'
		    THEN ouac_code
		    ELSE NULL
		  END,
		  program_name_norm
		), university_norm
		-- Hide noise: single-entry groups with no OUAC match (unverifiable one-offs)
		HAVING MAX(ouac_code) IS NOT NULL OR COUNT(*) >= 2
		ORDER BY
			CASE WHEN MAX(ouac_code) = ? THEN 0 ELSE 1 END,
			CASE WHEN MIN(program_name_norm) = ? THEN 0 ELSE 1 END,
			CASE WHEN MIN(program_name_norm) LIKE ? THEN 0 ELSE 1 END,
			CASE WHEN university_norm LIKE ? THEN 0 ELSE 1 END,
			n_total DESC
		LIMIT ?
	`).all(...wordParams, qUpper, qLower, fullPattern, fullPattern, limit);

	return rows.map((r: any) => {
		const validCode = r.ouac_code && isValidOuacCode(r.ouac_code) ? r.ouac_code : null;
		const canonical = validCode
			? getCanonicalNames(validCode, r.university_norm)
			: null;
		// OUAC-matched: slug is "CODE--university_norm" (all-caps prefix detectable)
		// Unmatched: slug is "university_norm--program_name_norm" (existing format)
		const slug = validCode
			? `${validCode}--${r.university_norm}`
			: `${r.university_norm}--${r.program_name_norm}`;
		return {
			slug,
			program_name: canonical?.programName ?? titleCase(r.program_name_norm),
			university: canonical?.university ?? displayUniversity(r.university_norm),
			ouac_code: validCode,
			n_total: r.n_total,
		};
	});
}
