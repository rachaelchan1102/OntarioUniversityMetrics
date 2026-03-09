// Stats summary API route
import { queryOne, query } from '../../../lib/db/client-postgres';

export async function GET() {
  const basicStats = await queryOne<{ total_records: number; min_year: string; max_year: string }>(`
    SELECT
      COUNT(*) AS total_records,
      MIN(academic_year) AS min_year,
      MAX(academic_year) AS max_year
    FROM admissions
  `, []);

  const { total_records, min_year, max_year } = basicStats || { total_records: 0, min_year: null, max_year: null };

  const programStats = await queryOne<{ total_programs: number }>(`
    SELECT COUNT(DISTINCT ouac_code) AS total_programs
    FROM admissions
    WHERE ouac_code IS NOT NULL
  `, []);
  const total_programs = programStats?.total_programs || 0;

  // Count universities only from OUAC-matched rows — those have canonical
  // university_norm values (no user-typed garbage like 'ubcv', 'harvard', etc.)
  const uniStats = await queryOne<{ total_universities: number }>(`
    SELECT COUNT(DISTINCT university_norm) AS total_universities
    FROM admissions
    WHERE ouac_code IS NOT NULL
  `, []);
  const total_universities = uniStats?.total_universities || 0;

  const yearly_averages = await query<{ academic_year: string; avg_grade: number; n: number }>(`
    SELECT academic_year,
           ROUND(AVG(admission_grade)::numeric, 1) AS avg_grade,
           COUNT(*) AS n
    FROM admissions
    WHERE admission_grade IS NOT NULL
    GROUP BY academic_year
    ORDER BY academic_year ASC
  `, []);

  const overallStats = await queryOne<{ overall_avg: number }>(`
    SELECT ROUND(AVG(admission_grade)::numeric, 1) AS overall_avg
    FROM admissions
    WHERE admission_grade IS NOT NULL
  `, []);
  const overall_avg = overallStats?.overall_avg || 0;

  const university_averages = await query<{ university: string; avg_grade: number; n: number }>(`
    SELECT university_norm AS university,
           ROUND(AVG(admission_grade)::numeric, 1) AS avg_grade,
           COUNT(*) AS n
    FROM admissions
    WHERE admission_grade IS NOT NULL AND ouac_code IS NOT NULL
    GROUP BY university_norm
    HAVING COUNT(*) >= 5
    ORDER BY avg_grade DESC
  `, []);

  // Get the most recent import date
  const lastUpdatedResult = await queryOne<{ last_updated: string }>(`
    SELECT MAX(imported_at) AS last_updated
    FROM admissions
  `, []);
  const last_updated = lastUpdatedResult?.last_updated || null;

  return new Response(
    JSON.stringify({ total_records, total_programs, total_universities, min_year, max_year, yearly_averages, overall_avg, university_averages, last_updated }),
    { status: 200 }
  );
}
