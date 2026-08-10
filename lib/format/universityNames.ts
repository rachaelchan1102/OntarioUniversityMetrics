// Display formatting for normalized university / program names.
//
// The ETL stores lowercase `university_norm` ("queens university") for grouping, so anything
// user-facing has to be turned back into a proper name. This module is the single source of
// truth for that: it previously existed as three separate copies (app/page.tsx,
// lib/queries/search-postgres.ts, app/api/program/route.ts) which had drifted apart, so the
// same university rendered differently depending on which page you were on.

// Words that stay lowercase unless they lead the string.
const LOWERCASE_WORDS = new Set(['of', 'the', 'and', 'at', 'in', 'for', 'a', 'an']);

// Names that plain title-casing gets wrong — apostrophes, internal capitals, acronyms.
// Keyed by the lowercase normalized form.
const UNIVERSITY_OVERRIDES: Record<string, string> = {
	'queens university': "Queen's University",
	'mcmaster university': 'McMaster University',
	'ocad university': 'OCAD University',
	'wilfrid laurier university': 'Wilfrid Laurier University',
	'toronto metropolitan university': 'Toronto Metropolitan University',
	'nipissing': 'Nipissing University',
	'ubc': 'University of British Columbia',
	'tmu': 'Toronto Metropolitan University',
};

/** Title-case a string, keeping small connecting words lowercase unless they lead. */
export function titleCase(str: string): string {
	if (!str) return '';
	return str.replace(/\S+/g, (word, offset) =>
		offset === 0 || !LOWERCASE_WORDS.has(word.toLowerCase())
			? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			: word.toLowerCase()
	);
}

/**
 * Turn a normalized university name into its display form.
 * Falls back to title-casing, or to `rawFallback` (the original user input) when given.
 */
export function displayUniversity(norm: string, rawFallback?: string): string {
	if (!norm) return rawFallback ?? '';
	const override = UNIVERSITY_OVERRIDES[norm.toLowerCase()];
	if (override) return override;
	return rawFallback ?? titleCase(norm);
}
