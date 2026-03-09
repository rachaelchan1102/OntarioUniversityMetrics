// Years API route
import { getDistinctYears } from '../../../lib/queries/years-postgres';

export async function GET() {
  const years = await getDistinctYears();
  return new Response(JSON.stringify({ years }), { status: 200 });
}
