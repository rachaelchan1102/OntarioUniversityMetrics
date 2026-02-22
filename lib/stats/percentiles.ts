// Percentiles logic
export function computePercentiles(arr: number[], percentiles: number[]) {
	if (!arr.length) return percentiles.map(() => null);
	const sorted = [...arr].sort((a, b) => a - b);
	return percentiles.map(p => {
		if (p <= 0) return sorted[0];
		if (p >= 1) return sorted[sorted.length - 1];
		const idx = p * (sorted.length - 1);
		const lower = Math.floor(idx);
		const upper = Math.ceil(idx);
		if (lower === upper) return sorted[lower];
		return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
	});
}
