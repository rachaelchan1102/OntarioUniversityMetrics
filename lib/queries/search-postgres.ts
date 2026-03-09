import { query } from '../db/client-postgres';
import { getCanonicalNames, isValidOuacCode } from '../etl/ouacValidation';

function titleCase(s: string): string {
	return s.replace(/\b\w/g, c => c.toUpperCase());
}

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

export interface SearchResult {
	slug: string;
	program_name: string;
	university: string;
	ouac_code: string | null;
	n_total: number;
}

/**
 * Search for programs by query string
 * Returns aggregated results with count
 */
export async function searchPrograms(q: string, limit = 20): Promise<SearchResult[]> {
	const qLower = q.toLowerCase().trim();
	const qUpper = q.toUpperCase().trim();
	const words = qLower.split(/\s+/).filter(Boolean);
	
	// Build WHERE clause for each word
	const wordConditions = words
		.map((_, i) => `(university_norm LIKE $${i * 3 + 1} OR program_name_norm LIKE $${i * 3 + 2} OR LOWER(COALESCE(ouac_code,'')) LIKE $${i * 3 + 3})`)
		.join(' AND ');
	
	const wordParams = words.flatMap(w => [`%${w}%`, `%${w}%`, `%${w}%`]);
	const fullPattern = `%${qLower}%`;
	
	// Parameter positions after word params
	const nextParam = wordParams.length + 1;

	const rows = await query<{
		ouac_code: string | null;
		university_norm: string;
		program_name_norm: string;
		n_total: string;
	}>(
		`SELECT
			MAX(ouac_code) AS ouac_code,
			university_norm,
			MIN(program_name_norm) AS program_name_norm,
			COUNT(*) AS n_total
		FROM admissions
		WHERE ${wordConditions}
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
		HAVING MAX(ouac_code) IS NOT NULL OR COUNT(*) >= 2
		ORDER BY
			CASE WHEN MAX(ouac_code) = $${nextParam} THEN 0 ELSE 1 END,
			CASE WHEN MIN(program_name_norm) = $${nextParam + 1} THEN 0 ELSE 1 END,
			CASE WHEN MIN(program_name_norm) LIKE $${nextParam + 2} THEN 0 ELSE 1 END,
			CASE WHEN university_norm LIKE $${nextParam + 3} THEN 0 ELSE 1 END,
			n_total DESC
		LIMIT $${nextParam + 4}`,
		[...wordParams, qUpper, qLower, fullPattern, fullPattern, limit]
	);

	return rows.map((r) => {
		const validCode = r.ouac_code && isValidOuacCode(r.ouac_code) ? r.ouac_code : null;
		const canonical = validCode
			? getCanonicalNames(validCode, r.university_norm)
			: null;
		// OUAC-matched: slug is "CODE--university_norm"
		// Unmatched: slug is "university_norm--program_name_norm"
		const slug = validCode
			? `${validCode}--${r.university_norm}`
			: `${r.university_norm}--${r.program_name_norm}`;
		return {
			slug,
			program_name: canonical?.programName ?? titleCase(r.program_name_norm),
			university: canonical?.university ?? displayUniversity(r.university_norm),
			ouac_code: validCode,
			n_total: Number(r.n_total),
		};
	});
}
