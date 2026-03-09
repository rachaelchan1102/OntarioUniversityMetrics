// Postgres schema migration
import { query } from './client-postgres';

export async function ensureSchema() {
	await query(`
		CREATE TABLE IF NOT EXISTS admissions (
			id SERIAL PRIMARY KEY,
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
		)
	`);

	// Create indexes (Postgres syntax)
	await query(`CREATE INDEX IF NOT EXISTS idx_program_lookup ON admissions (university_norm, program_name_norm)`);
	await query(`CREATE INDEX IF NOT EXISTS idx_ouac_lookup ON admissions (university_norm, ouac_code)`);
	await query(`CREATE INDEX IF NOT EXISTS idx_academic_year ON admissions (academic_year)`);
	await query(`CREATE INDEX IF NOT EXISTS idx_admission_month_iso ON admissions (admission_month_iso)`);
	await query(`CREATE INDEX IF NOT EXISTS idx_program_name_norm ON admissions (program_name_norm)`);
	await query(`CREATE INDEX IF NOT EXISTS idx_university_norm ON admissions (university_norm)`);
	await query(`CREATE INDEX IF NOT EXISTS idx_ouac_code ON admissions (ouac_code)`);
}

export async function migrate() {
	await ensureSchema();
	// Add future migrations here
}
