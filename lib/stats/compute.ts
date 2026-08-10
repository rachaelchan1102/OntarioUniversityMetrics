// Stats compute logic
import { computePercentiles } from './percentiles';

export function computeKPIs(rows: any[]) {
	if (!rows.length) return null;
	const grades = rows.map(r => r.admission_grade).filter((g: number) => typeof g === 'number');
	const n = grades.length;
	if (n === 0) return null;
	const mean = grades.reduce((a, b) => a + b, 0) / n;
	const sorted = [...grades].sort((a, b) => a - b);
	const median = n % 2 === 0 ? (sorted[n/2-1] + sorted[n/2])/2 : sorted[Math.floor(n/2)];
	const min = sorted[0];
	const max = sorted[n-1];
	const std = n < 3 ? null : Math.sqrt(grades.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
	const pct90 = grades.filter(g => g >= 90).length / n * 100;
	const pct95 = grades.filter(g => g >= 95).length / n * 100;
	const [q1, q3] = computePercentiles(grades, [0.25, 0.75]) as [number, number];
	return { n, mean, median, min, max, std, pct90, pct95, q1, q3 };
}

export function computeYoY(rows: any[]): number | null {
	const byYear: Record<string, number[]> = {};
	for (const r of rows) {
		const yr = r.academic_year;
		if (!yr) continue;
		if (!byYear[yr]) byYear[yr] = [];
		byYear[yr].push(r.admission_grade);
	}
	const years = Object.keys(byYear).sort();
	if (years.length < 2) return null;
	const means = years.map(yr => byYear[yr].reduce((a: number, b: number) => a + b, 0) / byYear[yr].length);
	const deltas = means.slice(1).map((m, i) => m - means[i]);
	return deltas.reduce((a, b) => a + b, 0) / deltas.length;
}
