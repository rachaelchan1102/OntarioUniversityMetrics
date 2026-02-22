// CSV import logic
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';
import { mapColumns } from './columnMapping';
import { normalizeStatus } from './normalizeStatus';
import { normalizeGrade, normalizeUniversity, normalizeProgram } from './normalize';
import { normalizeDateFields } from './normalizeDates';
import { buildOuacMap, backfillOuac } from './ouacBackfill';
import { matchToOuac } from './ouacValidation';
import { logImportSummary, logUnmatchedOUAC } from './logs';
import { getDb } from '../db/client';

const DATA_DIR = path.join(process.cwd(), 'data', 'csv');

function sha256(str: string) {
	return crypto.createHash('sha256').update(str).digest('hex');
}


export async function importAllCSVs({ rebuild = false } = {}) {
	const db = getDb();
	if (rebuild) {
		db.exec('DELETE FROM admissions');
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
		for (const rec of records) {
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
			// OUAC code — validate and canonicalize via OUAC authority.
			// If matchToOuac() can't verify the user-supplied code, store NULL so
			// garbage strings like "idk", "n/a", "ouac" never pollute grouping.
			const rawOuacCode = mapping.ouac_code ? rec[mapping.ouac_code] || null : null;
			let ouac_code: string | null = null;
			let canonical_program_norm = program_name_norm;
			let canonical_university_norm = university_norm;
			const ouacMatch = matchToOuac(rawOuacCode, program_name_norm, university_norm);
			if (ouacMatch) {
				ouac_code = ouacMatch.code;
				canonical_program_norm = ouacMatch.programNorm;
				canonical_university_norm = ouacMatch.universityNorm;
			}
			// Row hash — keyed on canonical values for consistent cross-year deduplication
			const row_hash = sha256(
				academic_year + canonical_university_norm + canonical_program_norm + (ouac_code || '') + (dateFields.admission_month_iso || '') + (dateFields.round_label || '') + admission_grade
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
				status_normalized: statusNorm,
				source_file: file,
				imported_at: new Date().toISOString(),
				row_hash
			});
			acceptedRows++;
		}
	}
	// OUAC backfill for missing codes (esp 2022-2023)
	const ouacMap = buildOuacMap(allRows.filter(r => r.ouac_code));
	const missingOuacRows = allRows.filter(r => !r.ouac_code);
	if (missingOuacRows.length) {
		const { updated, unmatched } = backfillOuac(missingOuacRows, ouacMap, allRows, logUnmatchedOUAC);
		// Update allRows with backfilled codes
		for (let i = 0; i < allRows.length; ++i) {
			if (!allRows[i].ouac_code) {
				allRows[i].ouac_code = updated.shift()?.ouac_code || null;
			}
		}
	}
	// Insert rows
	const insert = db.prepare(`
		INSERT OR IGNORE INTO admissions (
			row_hash, academic_year, university, university_norm, program_name, program_name_norm, ouac_code, admission_grade, admission_date_raw, admission_date_iso, admission_month_iso, admission_month_label, admission_year, round_label, round_order, supplemental_required, status_normalized, source_file, imported_at
		) VALUES (
			@row_hash, @academic_year, @university, @university_norm, @program_name, @program_name_norm, @ouac_code, @admission_grade, @admission_date_raw, @admission_date_iso, @admission_month_iso, @admission_month_label, @admission_year, @round_label, @round_order, @supplemental_required, @status_normalized, @source_file, @imported_at
		)
	`);
	db.transaction(() => {
		for (const row of allRows) {
			insert.run(row);
		}
	})();
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
