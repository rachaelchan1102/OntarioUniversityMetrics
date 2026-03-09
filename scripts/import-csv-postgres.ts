#!/usr/bin/env npx tsx
// Script to import CSV data into Postgres (Neon)

import { config } from 'dotenv';
import path from 'path';

// Load .env.local file BEFORE importing anything else
config({ path: path.join(process.cwd(), '.env.local') });

// Now dynamically import the modules after env is loaded
async function main() {
	const { importAllCSVsPostgres } = await import('../lib/etl/importCsvPostgres');
	
	const args = process.argv.slice(2);
	const rebuild = args.includes('--rebuild');

	console.log('🚀 Starting Postgres import...');
	console.log(`   Mode: ${rebuild ? 'REBUILD (deleting existing data)' : 'APPEND'}`);

	await importAllCSVsPostgres({ rebuild });
	console.log('✅ Import complete!');
}

main().catch((err) => {
	console.error('❌ Import failed:', err);
	process.exit(1);
});
