// Date normalization logic
import { parse, isValid, format } from 'date-fns';

const MONTHS = [
	'jan', 'feb', 'mar', 'apr', 'may', 'jun',
	'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const MONTH_FULL: Record<string, string> = {
	january: 'jan', february: 'feb', march: 'mar', april: 'apr',
	may: 'may', june: 'jun', july: 'jul', august: 'aug',
	september: 'sep', october: 'oct', november: 'nov', december: 'dec',
};

/** Strip ordinal suffixes: "16th" → "16", "2nd" → "2" */
function stripOrdinal(s: string): string {
	return s.replace(/(\d+)(?:st|nd|rd|th)\b/gi, '$1');
}

function parseDate(raw: string): Date | null {
	if (!raw) return null;

	// Pre-process: strip leading weekday like "Tue, " or "Tue " and ordinals
	let s = raw.trim();
	s = s.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*[,.\s]+/i, '');
	s = stripOrdinal(s).trim();

	const formats = [
		// ISO / numeric
		'yyyy-MM-dd',
		'yyyy/MM/dd',
		'MM/dd/yyyy',
		'dd/MM/yyyy',
		'M/d/yy',       // "12/07/22", "2/16/23"
		'MM-dd-yyyy',   // "02-18-2023"
		'M/d',          // "2/16" — day/month with no year (handled below)
		// Named month, full date
		'd MMM yyyy',   // "29 Dec 2022", "2 Feb 2023"
		'MMM d yyyy',   // "Dec 29 2022"
		'd MMMM yyyy',  // "16 December 2022"
		'MMMM d yyyy',  // "December 16 2022"
		'MMMM d, yyyy', // "February 16, 2023"
		'd MMMM, yyyy', // "16 February, 2023"
		'MMM d, yyyy',  // "Feb 16, 2023"
		// Named month + day only (no year — year inferred later)
		'd MMM',        // "15 Jan", "14 Dec"
		'MMM d',        // "Jan 15"
		// Month + year only
		'MMMM yyyy',
		'MMM yyyy',
		'yyyy-MM',
		// Month only
		'MMM',
		'MMMM',
	];

	for (const fmt of formats) {
		const d = parse(s, fmt, new Date());
		if (isValid(d)) return d;
	}
	return null;
}

function inferYearFromMonth(month: string, academicYear: string): number | null {
	// academicYear: "2022-2023"
	const [start, end] = academicYear.split('-').map(Number);
	if (!start || !end) return null;
	const m = month.toLowerCase().slice(0, 3);
	const idx = MONTHS.indexOf(m);
	if (idx === -1) return null;
	// Sep–Dec -> first year, Jan–Aug -> second year
	if (idx >= 8) return start;
	return end;
}

/** Extract the first recognizable month name (full or abbreviated) from a fuzzy string */
function extractMonth(raw: string): string | null {
	const lower = raw.toLowerCase();
	// Full names first (longest match wins)
	for (const [full, abbr] of Object.entries(MONTH_FULL)) {
		if (lower.includes(full)) return abbr;
	}
	// Abbreviated
	for (const abbr of MONTHS) {
		if (lower.includes(abbr)) return abbr;
	}
	return null;
}

export function normalizeDateFields(raw: string, academicYear: string) {
	let admission_date_iso: string | null = null;
	let admission_month_iso: string | null = null;
	let admission_month_label: string | null = null;
	let admission_year: number | null = null;
	let round_label: string | null = null;
	let round_order: number | null = null;

	if (!raw) return { admission_date_iso, admission_month_iso, admission_month_label, admission_year, round_label, round_order };

	const date = parseDate(raw);
	if (date) {
		// Only trust the full ISO date if the year looks sane (>= 2000).
		// date-fns defaults missing years to the reference date (current year),
		// which can produce wrong results for day-only strings.
		const year = date.getFullYear();
		if (year >= 2000) {
			admission_date_iso = format(date, 'yyyy-MM-dd');
			admission_month_iso = format(date, 'yyyy-MM');
			admission_month_label = format(date, 'MMM');
			admission_year = year;
			return { admission_date_iso, admission_month_iso, admission_month_label, admission_year, round_label, round_order };
		}
		// Year looks wrong — fall through to month-only extraction
	}

	// Round fallback ("Round 1", "round 2")
	const roundMatch = raw.match(/round\s*(\d+)/i);
	if (roundMatch) {
		round_label = `Round ${roundMatch[1]}`;
		round_order = parseInt(roundMatch[1], 10);
		return { admission_date_iso, admission_month_iso, admission_month_label, admission_year, round_label, round_order };
	}

	// Fuzzy month extraction — handles "early december", "Late Nov", "mid jan", "first week december", etc.
	const monthAbbr = extractMonth(raw);
	if (monthAbbr) {
		admission_month_label = monthAbbr.charAt(0).toUpperCase() + monthAbbr.slice(1);
		admission_year = inferYearFromMonth(monthAbbr, academicYear);
		if (admission_year) {
			admission_month_iso = `${admission_year}-${(MONTHS.indexOf(monthAbbr) + 1).toString().padStart(2, '0')}`;
		}
		return { admission_date_iso, admission_month_iso, admission_month_label, admission_year, round_label, round_order };
	}

	// Unknown
	return { admission_date_iso, admission_month_iso, admission_month_label, admission_year, round_label, round_order };
}

