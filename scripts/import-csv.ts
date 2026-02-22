// CLI entrypoint for CSV import (TypeScript ESM)
import { migrate } from '../lib/db/migrate';
import { importAllCSVs } from '../lib/etl/importCsv';

async function main() {
	const args = process.argv.slice(2);
	migrate();
	if (args.includes('--rebuild')) {
		await importAllCSVs({ rebuild: true });
		console.log('Database rebuilt and all CSVs imported.');
	} else if (args.includes('--update')) {
		await importAllCSVs({ rebuild: false });
		console.log('Database updated with new CSVs.');
	} else {
		console.log('Usage: ts-node scripts/import-csv.ts --rebuild | --update');
	}
}

main();
