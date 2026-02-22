// Years query logic
import { getDb } from '../db/client';

export function getDistinctYears(): string[] {
	const db = getDb();
	const rows = db.prepare('SELECT DISTINCT academic_year FROM admissions ORDER BY academic_year DESC').all();
	return rows.map((r: any) => r.academic_year);
}
