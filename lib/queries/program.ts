// Program query logic
import { getDb } from '../db/client';

/**
 * Slug formats:
 *   OUAC:  "{CODE}--{university_norm}"  e.g. "WCS--university of waterloo"
 *          Detected by: first segment before "--" is all uppercase letters/digits
 *   Legacy: "{university_norm}--{program_name_norm}"  (lowercase, may contain spaces)
 */
function parseSlug(slug: string): { type: 'ouac'; code: string; university_norm: string } | { type: 'legacy'; university_norm: string; program_name_norm: string } {
	const sep = slug.indexOf('--');
	const first = sep >= 0 ? slug.slice(0, sep) : slug;
	const rest  = sep >= 0 ? slug.slice(sep + 2) : '';
	// OUAC codes are 1–6 uppercase letters/digits, university_norm is always lowercase
	if (/^[A-Z][A-Z0-9]{0,5}$/.test(first)) {
		return { type: 'ouac', code: first, university_norm: rest };
	}
	return { type: 'legacy', university_norm: first, program_name_norm: rest };
}

export function getProgramRows(slug: string, year: string) {
	const db = getDb();
	const parsed = parseSlug(slug);

	if (parsed.type === 'ouac') {
		const { code, university_norm } = parsed;
		if (year === 'ALL') {
			return db.prepare(`
				SELECT * FROM admissions
				WHERE ouac_code = ? AND university_norm = ?
				ORDER BY academic_year DESC, admission_grade DESC
			`).all(code, university_norm);
		}
		return db.prepare(`
			SELECT * FROM admissions
			WHERE ouac_code = ? AND university_norm = ? AND academic_year = ?
			ORDER BY admission_grade DESC
		`).all(code, university_norm, year);
	}

	// Legacy slug fallback
	const { university_norm, program_name_norm } = parsed;
	if (year === 'ALL') {
		return db.prepare(`
			SELECT * FROM admissions
			WHERE university_norm = ? AND program_name_norm = ?
			ORDER BY academic_year DESC, admission_grade DESC
		`).all(university_norm, program_name_norm);
	}
	return db.prepare(`
		SELECT * FROM admissions
		WHERE university_norm = ? AND program_name_norm = ? AND academic_year = ?
		ORDER BY admission_grade DESC
	`).all(university_norm, program_name_norm, year);
}
