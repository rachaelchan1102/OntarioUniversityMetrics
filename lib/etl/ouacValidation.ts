/**
 * OUAC-authoritative validation and matching.
 *
 * Provides a lookup table of all Ontario university programs sourced from
 * ouinfo.ca (1408 programs). Used by the ETL pipeline to canonicalize
 * program+university groupings.
 *
 * Matching priority (per user spec):
 *   1. Raw OUAC code from CSV is valid  → use it as canonical grouping key
 *   2. Program name + university fuzzy-matches an OUAC entry → use that match
 *   3. Program name alone matches with high confidence → use it
 *   4. No match → keep raw normalized names as-is
 */
import path from 'path';
import fs from 'fs';
import { normalizeProgram, normalizeUniversity } from './normalize';
import { tokenSetSimilarity } from './similarity';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OuacProgram {
  /** Uppercase OUAC code, e.g. "WCS" */
  code: string;
  /** Original program name from ouinfo.ca */
  programName: string;
  /** normalizeProgram() result — used for fuzzy matching */
  programNorm: string;
  /** University slug from ouinfo.ca, e.g. "waterloo" */
  universitySlug: string;
  /** Canonical university name, e.g. "University of Waterloo" */
  university: string;
  /** normalizeUniversity() result — used for fuzzy matching */
  universityNorm: string;
}

// ─── Load and index data ──────────────────────────────────────────────────────

const DATA_PATH = path.join(process.cwd(), 'lib', 'etl', 'ouacPrograms.json');

interface RawEntry {
  code: string;
  programName: string;
  universitySlug: string;
  university: string;
}

function loadPrograms(): OuacProgram[] {
  if (!fs.existsSync(DATA_PATH)) {
    console.warn('[ouacValidation] ouacPrograms.json not found. Run scripts/scrape-ouac.py first.');
    return [];
  }
  const raw: RawEntry[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  return raw.map(r => ({
    code: r.code.toUpperCase(),
    programName: r.programName,
    programNorm: normalizeProgram(r.programName, r.university),
    universitySlug: r.universitySlug,
    university: r.university,
    universityNorm: normalizeUniversity(r.university),
  }));
}

// Indexed at module load time (singleton)
let _programs: OuacProgram[] | null = null;
function getPrograms(): OuacProgram[] {
  if (!_programs) _programs = loadPrograms();
  return _programs;
}

/** code → list of programs (may be multiple universities with the same code) */
let _byCode: Map<string, OuacProgram[]> | null = null;
function getByCode(): Map<string, OuacProgram[]> {
  if (!_byCode) {
    _byCode = new Map();
    for (const p of getPrograms()) {
      const list = _byCode.get(p.code) ?? [];
      list.push(p);
      _byCode.set(p.code, list);
    }
  }
  return _byCode;
}

/** universityNorm → list of programs at that university */
let _byUni: Map<string, OuacProgram[]> | null = null;
function getByUni(): Map<string, OuacProgram[]> {
  if (!_byUni) {
    _byUni = new Map();
    for (const p of getPrograms()) {
      const list = _byUni.get(p.universityNorm) ?? [];
      list.push(p);
      _byUni.set(p.universityNorm, list);
    }
  }
  return _byUni;
}

// ─── Manual overrides ────────────────────────────────────────────────────────
//
// Abbreviations and brand names that produce normalized forms with no token
// overlap to their OUAC counterparts (fuzzy matching cannot help them).
//
// Key format: `${programNorm}::${universityNorm}`
// Value: canonical OUAC code
//
const MANUAL_OVERRIDES: Record<string, string> = {
  // ── McMaster ─────────────────────────────────────────────────────────────
  'ibiomed::mcmaster university': 'MEH',       // iBioMed → Integrated Biomedical Engineering & Health Sciences
  'life sci::mcmaster university': 'MLS',
  'life science::mcmaster university': 'MLS',
  'life sciences::mcmaster university': 'MLS',
  'health science::mcmaster university': 'MNS', // Honours Health Sciences

  // ── University of Waterloo ────────────────────────────────────────────────
  'cs bba::university of waterloo': 'WBC',     // CS/BBA double degree
  'afm::university of waterloo': 'WXY',        // Accounting & Financial Management
  'health science::university of waterloo': 'WF',
  'life sci::university of waterloo': 'WLS',
  'life science::university of waterloo': 'WLS',

  // ── University of Toronto ────────────────────────────────────────────────
  'life sci::university of toronto': 'TML',
  'life science::university of toronto': 'TML',
  'life sci neuroscience0::university of toronto': 'TML', // typo in original data
  'life sci and physical sciences::university of toronto': 'TML',
  'life science::university of toronto st g': 'TML',
  'life science::university of toronto mississauga': 'TML',

  // ── Western University ───────────────────────────────────────────────────
  'bmos::western university': 'ED',
  'general science::western university': 'ES',
  'health sci::western university': 'EW',
  'health science::western university': 'EW',
  'social science psychology::western university': 'EO',
  'management organizational studies::western university': 'ED',
  // Ivey AEO — not a real OUAC admission program; grouped under custom code WIVEY
  'ivey advanced entry opportunity::western university': 'WIVEY',
  'ivey aeo::western university': 'WIVEY',
  'ivey aeo bmos::western university': 'WIVEY',
  'ivey aeo w bmos and econ::western university': 'WIVEY',
  'ivey aeo w social science::western university': 'WIVEY',
  'ivey hba::western university': 'WIVEY',
  'management and ivey::western university': 'WIVEY',
  'social sciences ivey aeo::western university': 'WIVEY',
  'bmos and ivey aeo::western university': 'WIVEY',
  'bmos ivey::western university': 'WIVEY',

  // ── Queen's University ───────────────────────────────────────────────────
  'engineering::queens university': 'QE',
  'applied science engineering::queens university': 'QE',
  'applied science general eng::queens university': 'QE',
  'electrical and computer engineering::queens university': 'QE',
  'queen s university computer engineering or electrical engineering innovation including optional internship basc::queens university': 'QE',
  'health science::queens university': 'QH',
  'health sciences::queens university': 'QH',
  'mechatronics and robotics engineering::queens university': 'QEM',

  // ── York University ──────────────────────────────────────────────────────
  'schulich bba::york university': 'YBA',      // Business Administration (BBA)

  // ── Toronto Metropolitan University ─────────────────────────────────────
  'undeclared engineering::toronto metropolitan university': 'SEU',
  'biomedical science::toronto metropolitan university': 'SBS',

  // ── University of Ottawa ─────────────────────────────────────────────────
  'biomedical science::university of ottawa': 'OUN',
  'computer science::university of ottawa': 'ORC',
  'health sci::university of ottawa': 'OKC',
  'health science::university of ottawa': 'OKC',
  'health sciences::university of ottawa': 'OKC',
  'political science::university of ottawa': 'OXL',

  // ── Wilfrid Laurier University ───────────────────────────────────────────
  'bba::wilfrid laurier university': 'UB',
  'cs::wilfrid laurier university': 'UT',
  'health sci::wilfrid laurier university': 'UZK',
  'health science::wilfrid laurier university': 'UZK',
  'bba cs dd wl only::wilfrid laurier university': 'UWB',
  'bba fmath laurier bba::wilfrid laurier university': 'UBF',
  'business administration bba financial mathematics::wilfrid laurier university': 'UBF',

  // ── Carleton University ──────────────────────────────────────────────────
  'softeng::carleton university': 'CES',
  'software eng::carleton university': 'CES',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns true if `code` (case-insensitive) is a valid OUAC code in the database. */
export function isValidOuacCode(code: string): boolean {
  if (!code) return false;
  return getByCode().has(code.trim().toUpperCase());
}

/**
 * Looks up programs by exact OUAC code.
 * Returns null if code is not in the database.
 */
export function lookupByCode(code: string): OuacProgram[] | null {
  if (!code) return null;
  return getByCode().get(code.trim().toUpperCase()) ?? null;
}

/**
 * Returns the best-matching OuacProgram for the given row, using a
 * three-tier strategy:
 *
 *  Tier 1 — exact code match (+ optional university check)
 *  Tier 2 — fuzzy program+university match within same university
 *  Tier 3 — fuzzy program-name-only match across all universities
 *
 * Returns null when no match is found above the confidence threshold.
 */
export function matchToOuac(
  rawCode: string | null | undefined,
  programNorm: string,
  universityNorm: string,
  options: { minScore?: number } = {}
): OuacProgram | null {
  const minScore = options.minScore ?? 0.80;

  // ── Tier 0: manual overrides for abbreviations / brand names ───────────────
  const overrideCode = MANUAL_OVERRIDES[`${programNorm}::${universityNorm}`];
  if (overrideCode) {
    const hits = getByCode().get(overrideCode);
    if (hits && hits.length > 0) {
      return hits.find(h => h.universityNorm === universityNorm) ?? hits[0];
    }
  }

  // ── Tier 1: valid OUAC code ─────────────────────────────────────────────
  if (rawCode) {
    const code = rawCode.trim().toUpperCase();
    const hits = getByCode().get(code);
    if (hits && hits.length > 0) {
      if (hits.length === 1) return hits[0];
      // Multiple universities share the code — pick by university similarity
      const uniScored = hits.map(h => ({
        h,
        score: tokenSetSimilarity(universityNorm, h.universityNorm),
      })).sort((a, b) => b.score - a.score);
      // If best university score is good enough, use it; otherwise default to first
      return uniScored[0].score >= 0.6 ? uniScored[0].h : hits[0];
    }
  }

  // ── Tier 2: fuzzy match within same university ──────────────────────────
  // Find the university in our index that best matches
  let bestUniScore = 0;
  let bestUniKey = '';
  for (const key of getByUni().keys()) {
    const s = tokenSetSimilarity(universityNorm, key);
    if (s > bestUniScore) {
      bestUniScore = s;
      bestUniKey = key;
    }
  }

  if (bestUniScore >= 0.6 && bestUniKey) {
    const candidates = getByUni().get(bestUniKey) ?? [];
    const scored = candidates.map(c => ({
      c,
      score: tokenSetSimilarity(programNorm, c.programNorm),
    })).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const best = scored[0];
      const second = scored[1]?.score ?? 0;
      // Require a good score AND a clear margin over the second-best
      if (best.score >= minScore && best.score - second > 0.08) {
        return best.c;
      }
      // Allow a slightly lower bar if the top score is very high
      if (best.score >= 0.92) return best.c;
    }
  }

  // ── Tier 3: fuzzy match across all programs (program name only) ─────────
  const HIGH_CONFIDENCE = 0.92;
  const allScored = getPrograms().map(c => ({
    c,
    score: tokenSetSimilarity(programNorm, c.programNorm),
  })).sort((a, b) => b.score - a.score);

  if (allScored.length > 0) {
    const best = allScored[0];
    const second = allScored[1]?.score ?? 0;
    if (best.score >= HIGH_CONFIDENCE && best.score - second > 0.08) {
      return best.c;
    }
  }

  return null;
}

/**
 * Returns the canonical OUAC group key for a row.
 * This is what we use as the grouping key in the database instead of
 * raw program name / university strings.
 *
 * Format: "{code}:{universitySlug}" when matched, e.g. "WCS:waterloo"
 * Falls back to null when no OUAC match is found.
 */
export function getOuacGroupKey(match: OuacProgram): string {
  return `${match.code}:${match.universitySlug}`;
}

/**
 * Returns the official OUAC program name and university name for a given
 * code + universityNorm pair. Used by search / program queries for display.
 */
export function getCanonicalNames(
  code: string,
  universityNorm: string
): { programName: string; university: string } | null {
  if (!code) return null;
  const hits = getByCode().get(code.trim().toUpperCase());
  if (!hits || hits.length === 0) return null;
  const hit = hits.find(h => h.universityNorm === universityNorm) ?? hits[0];
  return { programName: hit.programName, university: hit.university };
}
