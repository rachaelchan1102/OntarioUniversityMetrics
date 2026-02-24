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

  const yearly_averages = db.prepare(`
    SELECT academic_year,
           ROUND(AVG(admission_grade), 1) AS avg_grade,
           COUNT(*) AS n
    FROM admissions
    WHERE admission_grade IS NOT NULL
    GROUP BY academic_year
    ORDER BY academic_year ASC
  `).all() as { academic_year: string; avg_grade: number; n: number }[];

  const { overall_avg } = db.prepare(`
    SELECT ROUND(AVG(admission_grade), 1) AS overall_avg
    FROM admissions
    WHERE admission_grade IS NOT NULL
  `).get() as any;

  const university_averages = db.prepare(`
    SELECT university_norm AS university,
           ROUND(AVG(admission_grade), 1) AS avg_grade,
           COUNT(*) AS n
    FROM admissions
    WHERE admission_grade IS NOT NULL AND ouac_code IS NOT NULL
    GROUP BY university_norm
    HAVING n >= 5
    ORDER BY avg_grade DESC
  `).all() as { university: string; avg_grade: number; n: number }[];

  return new Response(
    JSON.stringify({ total_records, total_programs, total_universities, min_year, max_year, yearly_averages, overall_avg, university_averages }),
    { status: 200 }
  );
}
