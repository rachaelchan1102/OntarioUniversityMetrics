// Column mapping logic
// Maps messy CSV headers (including long Google Form question strings) to normalized field names
const FIELD_ALIASES: Record<string, string[]> = {
	university: [
		'university', 'school', 'institution', 'uni', 'college',
		'which university', 'what university', 'university was this',
	],
	program_name: [
		'program name', 'program_title',
		// NOTE: "which program" intentionally omitted — false-positives on
		// "...to which program" text inside status/comments columns
		'what program',
		'program', 'major', 'plan', 'specialization',
	],
	ouac_code: [
		'ouac code', 'ouac_code', 'ouac program code', 'ouacprogramcode',
		'program code', 'ouac', 'code',
	],
	admission_grade: [
		'acceptance average', 'admission average', 'admission avg',
		'average when accepted', 'what was your average',
		'final average', 'final avg', 'admission_grade',
		'avg', 'average', 'cutoff', 'grade',
	],
	admission_date: [
		'what date did you receive', 'what date was the offer',
		'date of offer', 'offer date', 'date received',
		'date admitted', 'date offered', 'decision date',
		'admission date', 'admit date', 'admission_date', 'decision_date',
		'month', 'round', 'date',
	],
	status: [
		'accepted rejected waitlisted', 'were you accepted',
		'accepted waitlisted deferred', 'offer rejection deferral',
		'admission status', 'offer status', 'admit_status', 'admission_decision',
		'status', 'decision', 'result',
	],
	supplemental_required: [
		'supplemental required', 'supplemental_required', 'supplemental req',
		'supplemental application', 'supplemental_app', 'supplemental requirement',
		'supplemental',
	],
};

function normalizeHeader(header: string): string {
	return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function mapColumns(headers: string[]): Record<string, string | null> {
	const mapping: Record<string, string | null> = {};
	const claimed = new Set<string>(); // prevent a header being claimed by multiple fields

	for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
		let found: string | null = null;
		const available = headers.filter(h => !claimed.has(h));

		// Pass 1: exact match on unclaimed headers
		for (const alias of aliases) {
			const normAlias = normalizeHeader(alias);
			const match = available.find(h => normalizeHeader(h) === normAlias);
			if (match) { found = match; break; }
		}

		// Pass 2: substring match — longer (more specific) aliases tried first
		if (!found) {
			const sorted = [...aliases].sort((a, b) => b.length - a.length);
			for (const alias of sorted) {
				const normAlias = normalizeHeader(alias);
				if (normAlias.length < 4) continue;
				const match = available.find(h => normalizeHeader(h).includes(normAlias));
				if (match) { found = match; break; }
			}
		}

		if (found) claimed.add(found);
		mapping[field] = found;
	}
	return mapping;
}

export { FIELD_ALIASES, normalizeHeader };
