// String similarity logic
import levenshtein from 'fast-levenshtein';

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

export function levenshteinSimilarity(a: string, b: string): number {
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	const dist = levenshtein.get(a, b);
	return 1 - dist / maxLen;
}
