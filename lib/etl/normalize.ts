// General normalization logic

// ─── University normalization ───────────────────────────────────────────────

const UNIVERSITY_CANONICAL: Record<string, string> = {
	// University of Toronto
	'uoft': 'university of toronto',
	'u of t': 'university of toronto',
	'utoronto': 'university of toronto',
	'utsg': 'university of toronto',
	'uoft st george': 'university of toronto',
	'university of toronto st george': 'university of toronto',
	'university of toronto st. george': 'university of toronto',
	// UofT Mississauga
	'utm': 'university of toronto mississauga',
	'uoft mississauga': 'university of toronto mississauga',
	'uoft missisuaga': 'university of toronto mississauga',
	'u of t mississauga': 'university of toronto mississauga',
	'university of toronto mississauga': 'university of toronto mississauga',
	'university of toronto-mississauga': 'university of toronto mississauga',
	'uoft missisauga': 'university of toronto mississauga',
	'mississauga': 'university of toronto mississauga',
	// UofT Scarborough
	'utsc': 'university of toronto scarborough',
	'uoft scarborough': 'university of toronto scarborough',
	'university of toronto scarborough': 'university of toronto scarborough',
	// University of Waterloo
	'uw': 'university of waterloo',
	'uwaterloo': 'university of waterloo',
	'waterloo': 'university of waterloo',
	'university of waterloo': 'university of waterloo',
	'university of waterloo ': 'university of waterloo',
	// Wilfrid Laurier
	'wlu': 'wilfrid laurier university',
	'laurier': 'wilfrid laurier university',
	'wilfrid laurier': 'wilfrid laurier university',
	// Toronto Metropolitan (was Ryerson)
	'tmu': 'toronto metropolitan university',
	'ryerson': 'toronto metropolitan university',
	'ryerson university': 'toronto metropolitan university',
	'toronto met': 'toronto metropolitan university',
	'toronto metropolitan': 'toronto metropolitan university',
	// McMaster
	'mac': 'mcmaster university',
	'mcmaster': 'mcmaster university',
	// Queens
	'queens': "queens university",
	"queen's": "queens university",
	"queen s": "queens university",
	"queens university": "queens university",
	"queen s university": "queens university",
	"queen's university": "queens university",
	// University of Ottawa
	'uottawa': 'university of ottawa',
	'u of ottawa': 'university of ottawa',
	'ottawa u': 'university of ottawa',
	// Western
	'western': 'western university',
	'uwo': 'western university',
	// York
	'york': 'york university',
	// Carleton
	'carleton': 'carleton university',
	// University of Guelph
	'guelph': 'university of guelph',
	'uoguelph': 'university of guelph',
	// UBC
	'ubc': 'university of british columbia',
	// Brock
	'brock': 'brock university',
	// Ontario Tech
	'ontario tech': 'ontario tech university',
	'oit': 'ontario tech university',
	// Trent
	'trent': 'trent university',
	// McGill
	'mcgill': 'mcgill university',
	// Dalhousie
	'dal': 'dalhousie university',
	'dalhousie': 'dalhousie university',
	// Others
	'33': 'unknown',
};

export function normalizeUniversity(raw: string): string {
	if (!raw) return '';
	const cleaned = raw.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
	// Direct match
	if (UNIVERSITY_CANONICAL[cleaned]) return UNIVERSITY_CANONICAL[cleaned];
	// Try stripping trailing spaces / punctuation variants
	for (const [alias, canonical] of Object.entries(UNIVERSITY_CANONICAL)) {
		if (cleaned === alias.trim()) return canonical;
	}
	// Return cleaned (no special chars, lowercase, collapsed spaces)
	return cleaned;
}

// ─── Program name normalization ──────────────────────────────────────────────

// Removes noise like co-op, honours, degree type, campus, university name prefix
// so that "Computer Science (Co-op)", "Computer Science Honours Co-op",
// "B. Computer Science Honours" all become "computer science"
export function normalizeProgram(rawProgram: string, rawUniversity: string): string {
	if (!rawProgram) return '';
	let p = rawProgram.trim();

	// 1. Strip university-name prefix if it appears at the start
	//    e.g. "Carleton University - B. Computer Science Honours" → "B. Computer Science Honours"
	//    e.g. "Toronto Metropolitan University - Computer Engineering" → "Computer Engineering"
	const uniVariants = buildUniVariants(rawUniversity);
	for (const variant of uniVariants) {
		const varNorm = variant.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
		const pTest = p.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
		if (varNorm.length > 3 && pTest.startsWith(varNorm)) {
			p = p.slice(variant.length).replace(/^[\s\-–:,/()]+/, '').trim();
			break;
		}
	}

	// 2. Strip leading degree-type qualifiers
	p = p.replace(/^(bachelor\s+of\s+(applied\s+)?science\s+|bachelor\s+of\s+|b\.(sc\.|a\.|eng\.|comp\.)?\s*|bsc\s+|ba\s+|beng\s+|bas\s+|honours\s+|honors\s+|hons\.\s+)/i, '').trim();

	// 2b. Strip leading program-code prefixes like "MN: ", "MN ", "WMF: "
	p = p.replace(/^[A-Z]{1,4}:\s+/, '').trim();

	// 3. Strip ALL parenthesized noise blocks — run multiple passes
	//    Catches: (Co-op), (Honours), (BSc), (BSc, iBSc), (PEY Co-op), (including PEY Co-op option), (St. George Campus) etc.
	const PAREN_NOISE = /\s*\([^)]*\b(co[-\s]?op|coop|co\s*operative|pey|regular|honours?|hons|bsc|ibsc|b\.sc|ba|beng|campus|mississauga|scarborough|st\.?\s*george|utsg|utm|utsc|waterloo|milton|ivey|aeo|non\s*co[-\s]?op|4[-\s]?year|direct\s*entry|including|with\s+co|[a-z]{2,5}\d)\b[^)]*\)/gi;
	for (let i = 0; i < 5; i++) p = p.replace(PAREN_NOISE, '').trim();

	// 4. Strip inline co-op/honours tokens after separators (–, -, +, ,, /)
	p = p.replace(/[\s,\-–+/|]+\(?(co[-\s]?op(erative)?|coop|pey\s*co[-\s]?op|pey|with\s+co[-\s]?op|including\s+co[-\s]?op|and\s+regular|non[-\s]?co[-\s]?op|regular|honours?\s+co[-\s]?op|honours?|honors?|hons)\)?(\s+only)?$/gi, '').trim();

	// 5. Strip trailing campus/location tokens
	p = p.replace(/[\s,\-–]+\(?(st\.?\s*george(\s+campus)?|utm|utsc|utsg|scarborough|mississauga|waterloo\s+campus|main\s+campus)\)?$/gi, '').trim();

	// 6. Strip trailing degree suffixes
	p = p.replace(/[\s,]+(bsc|b\.sc\.?|ba|b\.a\.?|beng|b\.eng\.?|ibsc|bsc\s+ibsc)$/gi, '').trim();

	// 7. Strip trailing ordinal / program number (e.g. "Engineering 1", "Engineering I")
	p = p.replace(/\s+(i{1,3}|iv|v|1|2|3|4|5)(\s*[-–(].+)?$/i, '').trim();

	// 8. Strip trailing short program codes in parens like (CMP1), (WMF)
	p = p.replace(/\s*\([A-Z][A-Z0-9]{1,5}\)$/, '').trim();

	// 9. Strip trailing year indicators
	p = p.replace(/\s*\(?\d\s*[-–]?\s*years?\)?$/i, '').trim();

	// 10. Final: lowercase + collapse special chars to spaces
	return p.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildUniVariants(rawUniversity: string): string[] {
	if (!rawUniversity) return [];
	const base = rawUniversity.trim();
	const variants: string[] = [base];
	// Add version without "University" suffix if present
	const withoutUni = base.replace(/\s+university\s*$/i, '').trim();
	if (withoutUni !== base) variants.push(withoutUni);
	// Add normalized canonical name
	const canonical = normalizeUniversity(base);
	if (canonical && canonical !== base.toLowerCase()) variants.push(canonical);
	// Add common abbreviations that appear at the start of program name strings
	const abbrevMap: Record<string, string[]> = {
		'university of toronto': ['UofT', 'U of T', 'UTSG', 'UTM', 'UTSC', 'UofT (St George)', 'UofT (St. George)'],
		'university of waterloo': ['UW', 'Waterloo'],
		'wilfrid laurier university': ['WLU', 'Laurier'],
		'toronto metropolitan university': ['TMU', 'Ryerson'],
		'mcmaster university': ['Mac', 'McMaster'],
		'western university': ['Western', 'UWO'],
	};
	const canonLower = canonical.toLowerCase();
	for (const [key, abbrevs] of Object.entries(abbrevMap)) {
		if (canonLower === key) variants.push(...abbrevs);
	}
	return variants.filter(v => v.length > 2);
}

export function normalizeGrade(raw: string | number): number | null {
	if (typeof raw === 'number') {
		if (raw >= 0 && raw <= 100) return raw;
		return null;
	}
	if (!raw) return null;
	let str = String(raw).trim();
	if (str.endsWith('%')) str = str.slice(0, -1);
	const num = parseFloat(str);
	if (isNaN(num) || num < 0 || num > 100) return null;
	return num;
}
