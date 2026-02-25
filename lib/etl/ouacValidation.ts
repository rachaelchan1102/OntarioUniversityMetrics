// Validates and matches CSV rows against official OUAC program data from ouinfo.ca (~1408 programs).
// Used during import to normalize program + university names into consistent grouping keys.
//
// Matching order:
//   1. Raw OUAC code from the CSV is valid → use it directly
//   2. Program name + university fuzzy-matches an OUAC entry → use that
//   3. Program name alone matches with high confidence → use it
//   4. Nothing matches → keep the raw normalized names
import path from 'path';
import fs from 'fs';
import { normalizeProgram, normalizeUniversity } from './normalize';
import { tokenSetSimilarity } from './similarity';

// Types

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

// Load and index data

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

let _programs: OuacProgram[] | null = null;
function getPrograms(): OuacProgram[] {
  if (!_programs) _programs = loadPrograms();
  return _programs;
}

// some codes appear at multiple universities (e.g. same code, different school)
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

// index by university for faster fuzzy matching
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

// Manual overrides for abbreviations/brand names that fuzzy matching can't resolve.
// These have no token overlap with the official OUAC name so they'd never match automatically.
// Key: `${programNorm}::${universityNorm}`, Value: OUAC code
//
// Additionally, if a record has a valid OUAC code (even if not matched by fuzzy logic),
// map it to the corresponding program in ouacPrograms.json.
const MANUAL_OVERRIDES: Record<string, string> = {
    // User-confirmed manual mappings (Feb 2026)
    'physical and mathematical sciences::university of waterloo': 'WPS',
    'engineering direct entry electrical and computer::queens university': 'QEC',
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


// Helper: If a record has a valid OUAC code, return the canonical code for that university if possible
export function autoMapValidOuacCode(rawCode: string | null | undefined, universityNorm: string): string | null {
  if (!rawCode) return null;
  const code = rawCode.trim().toUpperCase();
  const hits = getByCode().get(code);
  if (hits && hits.length > 0) {
    // If only one university uses this code, return it
    if (hits.length === 1) return hits[0].code;
    // Otherwise, try to match university
    const uniMatch = hits.find(h => h.universityNorm === universityNorm);
    if (uniMatch) return uniMatch.code;
    // Fallback: return the first
    return hits[0].code;
  }
  return null;
}

// Patch: In matchToOuac, if nothing else matches but the rawCode is valid, use it

// checks if a code exists in the OUAC database (case-insensitive)
export function isValidOuacCode(code: string): boolean {
  if (!code) return false;
  return getByCode().has(code.trim().toUpperCase());
}

// exact code lookup — returns null if not found
export function lookupByCode(code: string): OuacProgram[] | null {
  if (!code) return null;
  return getByCode().get(code.trim().toUpperCase()) ?? null;
}

// tries to find the best OUAC match for a row using a tiered approach:
//   tier 1 — exact code match
//   tier 2 — fuzzy match within the same university
//   tier 3 — fuzzy match across all programs
// returns null if nothing clears the confidence threshold
export function matchToOuac(
  rawCode: string | null | undefined,
  programNorm: string,
  universityNorm: string,
  options: { minScore?: number } = {}
): OuacProgram | null {
  const minScore = options.minScore ?? 0.80;

  // tier 0: check manual overrides first (abbreviations, brand names, etc.)
  const overrideCode = MANUAL_OVERRIDES[`${programNorm}::${universityNorm}`];
  if (overrideCode) {
    const hits = getByCode().get(overrideCode);
    if (hits && hits.length > 0) {
      return hits.find(h => h.universityNorm === universityNorm) ?? hits[0];
    }
  }

  // tier 1: if there's a valid OUAC code in the CSV, use it
  if (rawCode) {
    const code = rawCode.trim().toUpperCase();
    const hits = getByCode().get(code);
    if (hits && hits.length > 0) {
      if (hits.length === 1) return hits[0];
      // multiple universities share this code — pick the best university match
      const uniScored = hits.map(h => ({
        h,
        score: tokenSetSimilarity(universityNorm, h.universityNorm),
      })).sort((a, b) => b.score - a.score);
      // fall back to first if we can't confidently distinguish
      return uniScored[0].score >= 0.6 ? uniScored[0].h : hits[0];
    }
  }

  // tier 2: fuzzy match within the same university
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
      if (best.score >= minScore && best.score - second > 0.08) {
        return best.c;
      }
      if (best.score >= 0.92) return best.c;
    }
  }

  // tier 3: last resort — match by program name across all universities
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

  // FINAL PATCH: If the rawCode is a valid OUAC code, map to the canonical program for that code
  const autoCode = autoMapValidOuacCode(rawCode, universityNorm);
  if (autoCode) {
    const hits = getByCode().get(autoCode);
    if (hits && hits.length > 0) {
      return hits.find(h => h.universityNorm === universityNorm) ?? hits[0];
    }
  }

  return null;
}

// builds the grouping key we store in the DB, e.g. "WCS:waterloo"
// used instead of raw program/university strings so everything is consistent
export function getOuacGroupKey(match: OuacProgram): string {
  return `${match.code}:${match.universitySlug}`;
}

// gets the official display names for a matched OUAC program (used in search results and program pages)
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
