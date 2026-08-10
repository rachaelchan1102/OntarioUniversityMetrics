// OUAC backfill: infer missing codes from rows that DID match, at the same university.
// Mainly serves 2022-2023, which predates the source spreadsheet having an OUAC column —
// in effect the cleaner recent years teach the older years their codes.
import { tokenSetSimilarity } from './similarity';

export interface ProgramRow {
	university_norm: string;
	program_name_norm: string;
	ouac_code: string | null;
}

export function buildOuacMap(rows: ProgramRow[]): Record<string, string> {
	// university_norm + program_name_norm -> ouac_code
	const map: Record<string, string> = {};
	for (const row of rows) {
		if (row.ouac_code) {
			const key = `${row.university_norm}|${row.program_name_norm}`;
			map[key] = row.ouac_code;
		}
	}
	return map;
}

/**
 * Fills in `ouac_code` on rows that are missing one, **mutating them in place**.
 *
 * Mutating is deliberate: `missingRows` holds references into the caller's `allRows`, so the
 * codes land on the originals with no re-association step. The previous version returned copies
 * and the caller re-walked `allRows` calling `.shift()` on the result, which was only correct
 * while both arrays stayed in the same order — nothing enforced that.
 *
 * Candidates are snapshotted before any mutation, so a backfilled code can never itself become
 * a match target for a later row (which would make results depend on iteration order).
 */
export function backfillOuac(
	missingRows: ProgramRow[],
	ouacMap: Record<string, string>,
	allRows: ProgramRow[],
	logUnmatched: (list: any) => void
): { updated: ProgramRow[]; unmatched: any[] } {
	const unmatched: any[] = [];

	// Snapshot matched rows grouped by university, once, before mutating anything.
	// (Previously this filtered all of `allRows` for every missing row — O(n^2).)
	const candidatesByUni = new Map<string, ProgramRow[]>();
	for (const r of allRows) {
		if (!r.ouac_code) continue;
		const list = candidatesByUni.get(r.university_norm);
		if (list) list.push(r);
		else candidatesByUni.set(r.university_norm, [r]);
	}

	const updated: ProgramRow[] = [];

	for (const row of missingRows) {
		const candidates = candidatesByUni.get(row.university_norm) ?? [];

		const scored = candidates
			.map(c => ({ ...c, score: tokenSetSimilarity(row.program_name_norm, c.program_name_norm) }))
			.sort((a, b) => b.score - a.score);

		const bestScore = scored[0]?.score ?? 0;
		const secondBestScore = scored[1]?.score ?? 0;

		// only fill in the code if we're very confident (similarity >= 0.92 and a clear gap over second place)
		if (scored.length && bestScore >= 0.92 && bestScore - secondBestScore > 0.05) {
			row.ouac_code = scored[0].ouac_code;
			updated.push(row);
		} else {
			unmatched.push({ row, candidates: scored.slice(0, 3) });
		}
	}

	if (unmatched.length) logUnmatched(unmatched);
	return { updated, unmatched };
}
