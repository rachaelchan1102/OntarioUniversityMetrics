// CSV import logic for Postgres
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';
import { mapColumns } from './columnMapping';
import { normalizeStatus } from './normalizeStatus';
import { normalizeGrade, normalizeUniversity, normalizeProgram } from './normalize';
import { normalizeDateFields } from './normalizeDates';
import { buildOuacMap, backfillOuac } from './ouacBackfill';
import { matchToOuac, queensArtsOverride } from './ouacValidation';
import { cleanNote, extractQuartile } from './cleanNotes';
import { logImportSummary, logUnmatchedOUAC } from './logs';
import { query } from '../db/client-postgres';
import { migrate } from '../db/schema-postgres';

const DATA_DIR = path.join(process.cwd(), 'data', 'csv');

function sha256(str: string) {
	return crypto.createHash('sha256').update(str).digest('hex');
}

export async function importAllCSVsPostgres({ rebuild = false } = {}) {
	// Ensure schema exists
	await migrate();

	if (rebuild) {
		await query('DELETE FROM admissions');
	}

	const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.csv'));
	let totalRows = 0, acceptedRows = 0, droppedRows = 0, missingStatus = 0, unknownDate = 0, gradeDropped = 0;
	const allRows: any[] = [];

	for (const file of files) {
		const filePath = path.join(DATA_DIR, file);
		const csv = fs.readFileSync(filePath, 'utf8');
		const records = parse(csv, { columns: true, skip_empty_lines: true });
		const headers = Object.keys(records[0] || {});
		const mapping = mapColumns(headers);
		const academic_year = file.match(/\d{4}-\d{4}/)?.[0] || 'Unknown';

		for (const [rowIndex, rec] of records.entries()) {
			totalRows++;
			// Required fields
			const university = mapping.university ? rec[mapping.university] || '' : '';
			const program_name = mapping.program_name ? rec[mapping.program_name] || '' : '';
			const admission_grade_raw = mapping.admission_grade ? rec[mapping.admission_grade] : undefined;

			if (!university || !program_name || admission_grade_raw === undefined) {
				droppedRows++;
				continue;
			}

			const university_norm = normalizeUniversity(university);
			const program_name_norm = normalizeProgram(program_name, university);

			// Status filtering
			let status = mapping.status ? rec[mapping.status] : null;
			let statusNorm = status ? normalizeStatus(status) : 'unknown';
			if (mapping.status && statusNorm !== 'accepted') {
				droppedRows++;
				continue;
			}
			if (!mapping.status) {
				// If filename or columns imply accepted-only, allow
				const acceptedOnly = /accepted/i.test(file) || headers.some(h => /accepted/i.test(h));
				if (!acceptedOnly) {
					missingStatus++;
					continue;
				}
				statusNorm = 'accepted';
			}

			// Grade normalization
			const admission_grade = normalizeGrade(admission_grade_raw);
			if (admission_grade === null) {
				gradeDropped++;
				continue;
			}
			if (admission_grade < 60) {
				gradeDropped++;
				continue;
			}

			// Date normalization
			const dateRaw = mapping.admission_date ? rec[mapping.admission_date] : '';
			const dateFields = normalizeDateFields(dateRaw, academic_year);
			if (!dateFields.admission_month_iso && !dateFields.round_label) {
				unknownDate++;
			}

			// Supplemental
			let supplemental_required = 0;
			if (mapping.supplemental_required) {
				const val = rec[mapping.supplemental_required];
				supplemental_required = /yes|1|true/i.test(String(val)) ? 1 : 0;
			}

			// Free-text columns. The supplemental-assessment quartile (CASPer for
			// nursing, Western Engineering's SPF) is pulled into its own field and
			// stripped from the prose so it isn't shown twice.
			const suppRaw = mapping.supp_notes ? rec[mapping.supp_notes] : null;
			const supp_quartile = extractQuartile(suppRaw);
			const supp_notes = cleanNote(suppRaw, { removeQuartile: true });
			const comments = cleanNote(mapping.comments ? rec[mapping.comments] : null);

			// validate and canonicalize the OUAC code
			let rawOuacCode = mapping.ouac_code ? rec[mapping.ouac_code] || null : null;
			let ouac_code: string | null = null;
			let canonical_program_norm = program_name_norm;
			let canonical_university_norm = university_norm;

			// Queen's Arts/Psychology collapses to one code — takes precedence over fuzzy matching.
			// Must be passed university_norm, not the raw value (see queensArtsOverride).
			const queensOverride = queensArtsOverride(university_norm, program_name);
			if (queensOverride) {
				ouac_code = queensOverride.code;
				canonical_program_norm = queensOverride.programNorm;
			} else {
				const ouacMatch = matchToOuac(rawOuacCode, program_name_norm, university_norm);
				if (ouacMatch) {
					ouac_code = ouacMatch.code;
					canonical_program_norm = ouacMatch.programNorm;
					canonical_university_norm = ouacMatch.universityNorm;
				}
			}

			// Row hash — based on the full raw row payload so we only dedupe truly identical rows.
			// The previous hash (year + program + month/round + grade) collapsed many distinct submissions
			// that happened to share the same grade in the same month.
			const row_hash = sha256(
				JSON.stringify({
					academic_year,
					source_file: file,
					row_index: rowIndex,
					raw_record: rec,
					canonical_university_norm,
					canonical_program_norm,
					ouac_code,
					admission_grade,
					admission_date_raw: dateRaw,
					admission_month_iso: dateFields.admission_month_iso,
					round_label: dateFields.round_label
				})
			);

			allRows.push({
				academic_year,
				university,
				university_norm: canonical_university_norm,
				program_name,
				program_name_norm: canonical_program_norm,
				ouac_code,
				admission_grade,
				admission_date_raw: dateRaw,
				...dateFields,
				supplemental_required,
				supp_quartile,
				supp_notes,
				comments,
				status_normalized: statusNorm,
				source_file: file,
				imported_at: new Date().toISOString(),
				row_hash
			});
			acceptedRows++;
		}
	}

	// OUAC backfill for missing codes (esp 2022-2023).
	// backfillOuac mutates the rows it's given, and those are references into allRows,
	// so the codes land on the originals without any re-association step.
	const ouacMap = buildOuacMap(allRows.filter(r => r.ouac_code));
	const missingOuacRows = allRows.filter(r => !r.ouac_code);
	if (missingOuacRows.length) {
		const { updated, unmatched } = backfillOuac(missingOuacRows, ouacMap, allRows, logUnmatchedOUAC);
		console.log(`OUAC backfill: filled ${updated.length}, still unmatched ${unmatched.length}`);
	}

	// Insert in genuinely batched multi-row statements. This used to slice into batches but then
	// issue one INSERT per row inside each slice — ~6,500 sequential round-trips to Neon over
	// HTTP, which is why a rebuild took minutes and must not be interrupted.
	const COLUMNS = [
		'row_hash', 'academic_year', 'university', 'university_norm', 'program_name',
		'program_name_norm', 'ouac_code', 'admission_grade', 'admission_date_raw',
		'admission_date_iso', 'admission_month_iso', 'admission_month_label', 'admission_year',
		'round_label', 'round_order', 'supplemental_required', 'supp_quartile',
		'supp_notes', 'comments', 'status_normalized',
		'source_file', 'imported_at'
	] as const;

	// Drop in-batch duplicates up front. ON CONFLICT still guards against re-running an import,
	// but two identical row_hash values inside one multi-row statement are worth avoiding.
	const seenHashes = new Set<string>();
	const rowsToInsert = allRows.filter(r => {
		if (seenHashes.has(r.row_hash)) return false;
		seenHashes.add(r.row_hash);
		return true;
	});
	const dupeCount = allRows.length - rowsToInsert.length;
	if (dupeCount) console.log(`Skipping ${dupeCount} duplicate row_hash values before insert`);

	const BATCH_SIZE = 100;
	console.log(`Inserting ${rowsToInsert.length} rows into Postgres...`);

	for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
		const batch = rowsToInsert.slice(i, i + BATCH_SIZE);

		// ($1..$19), ($20..$38), ...
		const tuples = batch
			.map((_, r) => `(${COLUMNS.map((_c, c) => `$${r * COLUMNS.length + c + 1}`).join(', ')})`)
			.join(', ');
		const params = batch.flatMap(row => COLUMNS.map(c => (row as any)[c] ?? null));

		await query(
			`INSERT INTO admissions (${COLUMNS.join(', ')})
			 VALUES ${tuples}
			 ON CONFLICT (row_hash) DO NOTHING`,
			params
		);

		const done = Math.min(i + BATCH_SIZE, rowsToInsert.length);
		if (done % 500 === 0 || done === rowsToInsert.length) {
			console.log(`  Inserted ${done}/${rowsToInsert.length} rows`);
		}
	}

	// Log summary
	logImportSummary({
		totalRows,
		acceptedRows,
		droppedRows,
		missingStatus,
		unknownDate,
		gradeDropped,
		files
	});
}
