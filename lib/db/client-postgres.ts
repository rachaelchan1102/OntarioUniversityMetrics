// Neon Postgres DB client setup
import { Pool } from '@neondatabase/serverless';

// Lazy-initialize pool to avoid build-time errors when env vars aren't available
let pool: Pool | null = null;

function getPool(): Pool {
	if (!pool) {
		const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
		}
		pool = new Pool({ connectionString });
	}
	return pool;
}

// Helper for queries that return rows
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
	const result = await getPool().query(queryString, params);
	return result.rows as T[];
}

// Helper for single row queries
export async function queryOne<T = any>(queryString: string, params: any[] = []): Promise<T | null> {
	const rows = await query<T>(queryString, params);
	return rows[0] || null;
}

// Export the getPool function for direct access if needed
export { getPool as pool };
