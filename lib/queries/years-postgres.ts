import { query } from '../db/client-postgres';

/**
 * Get all distinct academic years from the database
 */
export async function getDistinctYears(): Promise<string[]> {
	const rows = await query<{ academic_year: string }>(
		`SELECT DISTINCT academic_year FROM admissions ORDER BY academic_year DESC`,
		[]
	);
	return rows.map((r) => r.academic_year);
}
