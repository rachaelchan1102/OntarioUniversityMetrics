// Neon Postgres DB client setup
import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
}

// Create a Pool for connection pooling (recommended for serverless)
const pool = new Pool({ connectionString });

// Helper for queries that return rows
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
	const result = await pool.query(queryString, params);
	return result.rows as T[];
}

// Helper for single row queries
export async function queryOne<T = any>(queryString: string, params: any[] = []): Promise<T | null> {
	const rows = await query<T>(queryString, params);
	return rows[0] || null;
}

// Export the pool for direct access if needed
export { pool };
