// Histogram logic
export function computeHistogram(grades: number[], binStart = 60, binEnd = 100, binSize = 5) {
	const bins = [];
	for (let b = binStart; b < binEnd; b += binSize) {
		bins.push({
			bin: `${b}-${b + binSize - 1}`,
			count: 0
		});
	}
	for (const g of grades) {
		for (const bin of bins) {
			const [start, end] = bin.bin.split('-').map(Number);
			if (g >= start && g < end + 1) {
				bin.count++;
				break;
			}
		}
	}
	const total = grades.length;
	for (const bin of bins) {
		bin.pct = total ? (bin.count / total) * 100 : 0;
	}
	return bins;
}
