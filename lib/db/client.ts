// SQLite DB client setup
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'admissions.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (!db) {
		db = new Database(DB_PATH);
	}
	return db;
}
