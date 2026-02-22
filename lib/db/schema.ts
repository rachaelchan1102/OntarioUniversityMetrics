// SQLite DB schema definition
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'admissions.db');

export function getDb() {
	return new Database(DB_PATH);
}

export function ensureSchema() {
	const db = getDb();
	db.exec(`
		CREATE TABLE IF NOT EXISTS admissions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			row_hash TEXT UNIQUE,
			academic_year TEXT NOT NULL,
			university TEXT NOT NULL,
			university_norm TEXT NOT NULL,
			program_name TEXT NOT NULL,
			program_name_norm TEXT NOT NULL,
			ouac_code TEXT,
			admission_grade REAL NOT NULL,
			admission_date_raw TEXT,
			admission_date_iso TEXT,
			admission_month_iso TEXT,
			admission_month_label TEXT,
			admission_year INTEGER,
			round_label TEXT,
			round_order INTEGER,
			supplemental_required INTEGER NOT NULL DEFAULT 0,
			status_normalized TEXT NOT NULL,
			source_file TEXT NOT NULL,
			imported_at TEXT NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_program_lookup ON admissions (university_norm, program_name_norm);
		CREATE INDEX IF NOT EXISTS idx_ouac_lookup ON admissions (university_norm, ouac_code);
		CREATE INDEX IF NOT EXISTS idx_academic_year ON admissions (academic_year);
		CREATE INDEX IF NOT EXISTS idx_admission_month_iso ON admissions (admission_month_iso);
		CREATE INDEX IF NOT EXISTS idx_program_name_norm ON admissions (program_name_norm);
		CREATE INDEX IF NOT EXISTS idx_university_norm ON admissions (university_norm);
		CREATE INDEX IF NOT EXISTS idx_ouac_code ON admissions (ouac_code);
	`);
	db.close();
}
