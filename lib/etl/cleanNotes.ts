// Normalizes the free-text columns from the source spreadsheet
// ("Notable info from supp app" and "Comments") into something presentable.
//
// Rule-based rather than LLM-based on purpose: this runs on every import, so it
// has to be deterministic, free, and produce identical output for identical
// input. An LLM pass could layer on top later for the long rambling entries,
// but the bulk of the mess here is mechanical.
//
// Profiled against the 2025-2026 sheet (5,653 rows):
//   col 11 "Notable info from supp app" — 1,494 filled, median 67 chars, max 2,412
//   col 12 "Comments"                   — 1,954 filled, median 36 chars, max 863

/**
 * Supplemental-assessment quartile.
 *
 * 164 rows record a bare "Q1"–"Q4" here, and they are NOT noise — every one
 * belongs to a program with a scored supplemental: McMaster Nursing and Western
 * Nursing (CASPer) and Western Engineering (their SPF). A handful of rows spell
 * it out instead ("4th quartile", "Quartile 1", "casper 1st Quartile").
 *
 * Named generically rather than `casper_quartile` because Western Engineering's
 * assessment isn't CASPer.
 */
const QUARTILE_PATTERNS: RegExp[] = [
	/\bq\s*([1-4])\b/i,                                  // Q4, q2, "Q4 casper"
	/\bquartile\s*([1-4])\b/i,                           // "Quartile 1"
	/\b([1-4])\s*(?:st|nd|rd|th)\s*(?:quartile|q)\b/i,   // "4th quartile", "casper 4th Q"
];

/** Returns 1–4 when a supplemental quartile is stated, else null. */
export function extractQuartile(raw: string | null | undefined): number | null {
	if (raw == null) return null;
	const s = String(raw);
	for (const re of QUARTILE_PATTERNS) {
		const m = s.match(re);
		if (m) {
			const n = Number(m[1]);
			if (n >= 1 && n <= 4) return n;
		}
	}
	return null;
}

/** Removes the quartile token once it's been captured into its own column. */
function stripQuartile(s: string): string {
	let out = s;
	for (const re of QUARTILE_PATTERNS) {
		out = out.replace(new RegExp(re.source, 'gi'), ' ');
	}
	return out.replace(/\s+/g, ' ').replace(/^[\s,;.]+|[\s,;.]+$/g, '').trim();
}

/**
 * Values that carry no information. Anchored to match the WHOLE segment, not
 * merely its start — an early version dropped
 * "Didn't do optional supp app; $1000 entrance scholarship; 70%" wholesale
 * because it began with a negation.
 */
const NOISE_FULL: RegExp[] = [
	/^(n\/?a|none|no|nil|nothing|unknown|idk|tbd|same as above)\.?$/i,
	/^[-–—.,/\s]*$/,
	// Bare yes/no answers to the form question — they confirm nothing useful.
	/^(nope|nah|nvm|yep|yeah|yes|no)[!.]*$/i,
	/^nothing\s+(much|really|special|major|notable)[!.]*$/i,
	/^not\s+really[!.]*$/i,
	// "N/A", "N/a no aif", "no AIF" — AIF is Waterloo's supplemental form.
	/^n\/?a[\s,]*(no\s+(su+p+(\s+app)?|aif|spf))?[!.]*$/i,
	/^(no|not)\s+(aif|spf)[!.]*$/i,
	// Sign-offs and pleasantries.
	/^good\s*luck\b.{0,25}$/i,
	/^(thanks|thank you|ty)\b.{0,15}$/i,
	// short, self-contained negations ("didn't do it", "didnt do the optional supplement")
	/^did\s*n[o'’]?t\s*(do|complete|submit|apply|fill(\s*out)?)\b.{0,40}$/i,
	// "no supp", "No sup app" — the p count varies.
	/^(no|not)\s+su+p+(lemental)?(\s+app)?\.?$/i,
	/^supp(lemental)?\s*app\s*(was)?\s*(not|n[o'’]t)\s*(required|needed|applicable|done|completed?)\.?$/i,
	/^not\s+(required|needed|applicable|completed?|submitted|done)\.?$/i,
];

function isNoise(s: string): boolean {
	return NOISE_FULL.some(re => re.test(s));
}

/**
 * Scholarship amounts appear in many spellings — "3k scholarship",
 * "3000 scholarship", "$3,000 entrance scholarship". Normalize the figure only
 * where it's unambiguously money: it either carries a "$", or it directly
 * precedes an award word. Bare numbers elsewhere (grades, hours, years, course
 * codes) are left alone.
 */
function normalizeMoney(s: string): string {
	// Explicit currency marker.
	s = s.replace(/\$\s*(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(\s*k\b)?/gi, (m, num: string, k?: string) => {
		let v = Number(num.replace(/,/g, ''));
		if (!isFinite(v)) return m;
		if (k) v *= 1000;
		return '$' + v.toLocaleString('en-US');
	});

	// No "$", but immediately followed by an award word. The lookahead keeps the
	// following whitespace intact — consuming it was what produced
	// "$3,000Scholarship". The lookbehind stops this pass re-matching a figure
	// the pass above already prefixed, which produced "$$3,000".
	s = s.replace(
		/(?<![$\d,.])\b(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(k)?(?=\s+(entrance\s+|renewable\s+)?(scholarship|award|bursary|grant)\b)/gi,
		(m, num: string, k?: string) => {
			let v = Number(num.replace(/,/g, ''));
			if (!isFinite(v)) return m;
			if (k) v *= 1000;
			if (v < 100) return m;
			return '$' + v.toLocaleString('en-US');
		}
	);

	return s;
}

/**
 * Uppercase the leading character only when the value actually starts with a
 * lowercase letter. Searching for the first letter anywhere turned
 * "12 years of volunteer work" into "12 Years of volunteer work" and
 * "$7,000 scholarship" into "$7,000 Scholarship".
 */
function capitalizeFirst(s: string): string {
	if (!s) return s;
	const c = s[0];
	return c >= 'a' && c <= 'z' ? c.toUpperCase() + s.slice(1) : s;
}

function cleanSegment(seg: string): string | null {
	let s = seg.replace(/\s+/g, ' ').trim();
	s = s.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').trim();
	if (!s || isNoise(s)) return null;

	s = normalizeMoney(s);
	s = s.replace(/\s+([,.;:!?])/g, '$1');
	s = s.replace(/\s*\/\s*/g, '/');
	s = s.replace(/[,;]\s*$/, '');
	s = capitalizeFirst(s).trim();

	// Drop values with no letter or digit in any script — emoji-only and
	// punctuation-only entries (":)", "💀💀💀", "☠️"). Deliberately Unicode-aware
	// rather than /[A-Za-z0-9]/, which would also have deleted legitimate
	// non-Latin entries; the data contains a couple of Chinese comments.
	if (!/[\p{L}\p{N}]/u.test(s)) return null;

	return s.length < 2 ? null : s;
}

/**
 * Clean one free-text cell. Semicolon-separated segments are cleaned
 * individually so a leading "didn't do the supp app;" doesn't discard the real
 * information that follows it.
 *
 * Returns null when nothing of value survives, so the caller stores NULL rather
 * than an empty string.
 */
export function cleanNote(
	raw: string | null | undefined,
	{ removeQuartile = false }: { removeQuartile?: boolean } = {}
): string | null {
	if (raw == null) return null;
	let flat = String(raw).replace(/\s+/g, ' ').trim();
	if (!flat) return null;

	// The quartile is stored in its own column, so drop the token from the prose
	// to avoid showing it twice. Anything else in the cell is preserved.
	if (removeQuartile) {
		flat = stripQuartile(flat);
		if (!flat) return null;
	}

	const kept = flat
		.split(';')
		.map(cleanSegment)
		.filter((x): x is string => x !== null);

	if (!kept.length) return null;
	return capitalizeFirst(kept.join('; '));
}
