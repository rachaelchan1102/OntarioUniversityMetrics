// String similarity for fuzzy program/university matching.
// Token-set (Jaccard) overlap is used rather than edit distance because program
// names differ by word order and extra qualifiers far more often than by typos.
function normalize(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function tokenSetSimilarity(a: string, b: string): number {
	const setA = new Set(normalize(a).split(' '));
	const setB = new Set(normalize(b).split(' '));
	const intersection = new Set([...setA].filter(x => setB.has(x)));
	const union = new Set([...setA, ...setB]);
	if (union.size === 0) return 1;
	return intersection.size / union.size;
}
