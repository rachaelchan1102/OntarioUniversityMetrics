// Stats summary API route
import { getDb } from '../../../lib/db/client';

export async function GET() {
  const db = getDb();

  const { total_records, min_year, max_year } = db.prepare(`
    SELECT
      COUNT(*) AS total_records,
      MIN(academic_year) AS min_year,
      MAX(academic_year) AS max_year
    FROM admissions
  `).get() as any;

  const { total_programs } = db.prepare(`
    SELECT COUNT(DISTINCT ouac_code) AS total_programs
    FROM admissions
    WHERE ouac_code IS NOT NULL
  `).get() as any;

  // Count universities only from OUAC-matched rows — those have canonical
  // university_norm values (no user-typed garbage like 'ubcv', 'harvard', etc.)
  const { total_universities } = db.prepare(`
    SELECT COUNT(DISTINCT university_norm) AS total_universities
    FROM admissions
    WHERE ouac_code IS NOT NULL
  `).get() as any;

  return new Response(
    JSON.stringify({ total_records, total_programs, total_universities, min_year, max_year }),
    { status: 200 }
  );
}
