import { query, queryOne } from '../db/client-postgres';

export interface AdmissionRow {
	id: number;
	academic_year: string;
	university: string;
	university_norm: string;
	program_name: string;
	program_name_norm: string;
	ouac_code: string | null;
	admission_grade: number;
	admission_date_raw: string | null;
	admission_date_iso: string | null;
	admission_month_iso: string | null;
	admission_month_label: string | null;
	round_label: string | null;
	supplemental_required: number;
	status_normalized: string;
}

export interface ProgramIdentifier {
	university_norm: string;
	program_name_norm: string;
	ouac_code: string | null;
}

// two slug formats:
//   OUAC:   "{CODE}--{university_norm}"  e.g. "WCS--university of waterloo"
//           detected because the first segment is all uppercase letters/digits
//   Legacy: "{university_norm}--{program_name_norm}"  (lowercase, may contain spaces)
function parseSlug(slug: string): { type: 'ouac'; code: string; university_norm: string } | { type: 'legacy'; university_norm: string; program_name_norm: string } {
	const sep = slug.indexOf('--');
	const first = sep >= 0 ? slug.slice(0, sep) : slug;
	const rest  = sep >= 0 ? slug.slice(sep + 2) : '';
	// OUAC codes are 1-6 uppercase letters/digits, university_norm is always lowercase
	if (/^[A-Z][A-Z0-9]{0,5}$/.test(first)) {
		return { type: 'ouac', code: first, university_norm: rest };
	}
	return { type: 'legacy', university_norm: first, program_name_norm: rest };
}

/**
 * Get program rows (matching existing API signature)
 */
export async function getProgramRows(slug: string, year: string): Promise<AdmissionRow[]> {
	const parsed = parseSlug(slug);

	if (parsed.type === 'ouac') {
		const { code, university_norm } = parsed;
		if (year === 'ALL') {
			return query<AdmissionRow>(`
				SELECT * FROM admissions
				WHERE ouac_code = $1 AND university_norm = $2
				ORDER BY academic_year DESC, admission_grade DESC
			`, [code, university_norm]);
		}
		return query<AdmissionRow>(`
			SELECT * FROM admissions
			WHERE ouac_code = $1 AND university_norm = $2 AND academic_year = $3
			ORDER BY admission_grade DESC
		`, [code, university_norm, year]);
	}

	// Legacy slug fallback
	const { university_norm, program_name_norm } = parsed;
	if (year === 'ALL') {
		return query<AdmissionRow>(`
			SELECT * FROM admissions
			WHERE university_norm = $1 AND program_name_norm = $2
			ORDER BY academic_year DESC, admission_grade DESC
		`, [university_norm, program_name_norm]);
	}
	return query<AdmissionRow>(`
		SELECT * FROM admissions
		WHERE university_norm = $1 AND program_name_norm = $2 AND academic_year = $3
		ORDER BY admission_grade DESC
	`, [university_norm, program_name_norm, year]);
}
