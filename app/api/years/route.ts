// Years API route
import { getDistinctYears } from '../../../lib/queries/years';

export async function GET() {
  const years = getDistinctYears();
  return new Response(JSON.stringify({ years }), { status: 200 });
}
