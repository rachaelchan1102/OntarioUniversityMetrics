// ETL logging logic
import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'data', 'import_logs');

export function logImportSummary(summary: any) {
	fs.mkdirSync(LOG_DIR, { recursive: true });
	fs.writeFileSync(path.join(LOG_DIR, 'import_summary.json'), JSON.stringify(summary, null, 2));
}

export function logUnmatchedOUAC(list: any) {
	fs.mkdirSync(LOG_DIR, { recursive: true });
	fs.writeFileSync(path.join(LOG_DIR, 'unmatched_ouac.json'), JSON.stringify(list, null, 2));
}
