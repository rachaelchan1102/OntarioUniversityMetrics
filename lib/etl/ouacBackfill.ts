// OUAC backfill logic
import { tokenSetSimilarity } from './similarity';

export interface ProgramRow {
	university_norm: string;
	program_name_norm: string;
	ouac_code: string | null;
}

export function buildOuacMap(rows: ProgramRow[]): Record<string, string> {
	// (university_norm + program_name_norm) -> ouac_code
	const map: Record<string, string> = {};
	for (const row of rows) {
		if (row.ouac_code) {
			const key = `${row.university_norm}|${row.program_name_norm}`;
			map[key] = row.ouac_code;
		}
	}
	return map;
}

export function backfillOuac(
	missingRows: ProgramRow[],
	ouacMap: Record<string, string>,
	allRows: ProgramRow[],
	logUnmatched: (list: any) => void
): { updated: ProgramRow[]; unmatched: any[] } {
	const unmatched: any[] = [];
	const updated = missingRows.map(row => {
		// Find candidates in same university
		const candidates = allRows.filter(r =>
			r.university_norm === row.university_norm && r.ouac_code
		);
		let bestScore = 0;
		let best: ProgramRow | null = null;
		let secondBestScore = 0;
		const scored = candidates.map(c => {
			const score = tokenSetSimilarity(row.program_name_norm, c.program_name_norm);
			if (score > bestScore) {
				secondBestScore = bestScore;
				bestScore = score;
				best = c;
			} else if (score > secondBestScore) {
				secondBestScore = score;
			}
			return { ...c, score };
		});
		// Only backfill if similarity >= 0.92 and unique best match or large margin
		if (best && bestScore >= 0.92 && bestScore - secondBestScore > 0.05) {
			return { ...row, ouac_code: best.ouac_code };
		} else {
			unmatched.push({
				row,
				candidates: scored.sort((a, b) => b.score - a.score).slice(0, 3)
			});
			return row;
		}
	});
	if (unmatched.length) logUnmatched(unmatched);
	return { updated, unmatched };
}
