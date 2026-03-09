// Search API route
import { searchPrograms } from '../../../lib/queries/search-postgres';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  if (!q) {
    return new Response(JSON.stringify({ results: [] }), { status: 200 });
  }
  const results = await searchPrograms(q, 20);
  return new Response(JSON.stringify({ results }), { status: 200 });
}
