// Program API route
import { getProgramRows } from '../../../lib/queries/program-postgres';
import { getCanonicalNames } from '../../../lib/etl/ouacValidation';
import { requiresSupplemental } from '../../../lib/etl/supplementalCodes';
import { getPublishedAverage } from '../../../lib/etl/admissionAverages';
import { displayUniversity } from '../../../lib/format/universityNames';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const year = searchParams.get('year') || 'ALL';
  if (!slug) {
    return new Response(JSON.stringify({ program: null }), { status: 400 });
  }
  // Always fetch all years for this program for stats, but filter on client for display
  const rows = await getProgramRows(slug, 'ALL') as any[];
  if (!rows.length) {
    return new Response(JSON.stringify({ program: null }), { status: 404 });
  }
  // Basic metadata — prefer canonical OUAC names over raw CSV values
  const canonical = rows[0].ouac_code
    ? getCanonicalNames(rows[0].ouac_code as string, rows[0].university_norm as string)
    : null;
  const meta = {
    program_name: canonical?.programName ?? rows[0].program_name,
    university: canonical?.university ?? displayUniversity(rows[0].university_norm as string, rows[0].university as string),
    ouac_code: rows[0].ouac_code,
    years: Array.from(new Set(rows.map((r: any) => r.academic_year))).sort().reverse(),
    requires_supplemental: requiresSupplemental(rows[0].ouac_code as string | null),
    published_average: getPublishedAverage(rows[0].ouac_code as string | null),
  };
  return new Response(JSON.stringify({ program: meta, rows }), { status: 200 });
}
