# Ontario University Metrics - Complete Architecture Documentation

> **Author's Reference Guide** — This document explains every part of the codebase in detail.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Architecture](#4-database-architecture)
5. [ETL Pipeline (Data Import)](#5-etl-pipeline-data-import)
6. [Slugs — Program Identity](#6-slugs--program-identity)
7. [API Routes](#7-api-routes)
8. [Frontend Components](#8-frontend-components)
9. [Data Flow](#9-data-flow)
10. [Refreshing the Data](#10-refreshing-the-data)
11. [Deployment](#11-deployment)
12. [Environment Variables](#12-environment-variables)
13. [Known Issues & Gotchas](#13-known-issues--gotchas)

---

## 1. Project Overview

**Purpose:** A dashboard for exploring Ontario university admission averages based on self-reported data from publicly shared spreadsheets.

**What it does:**
- Aggregates admission data from multiple CSV files (by academic year)
- Normalizes messy user-submitted data into clean, queryable records
- Matches programs to official OUAC codes for consistent grouping
- Provides search, filtering, and visualization of admission statistics

**Data characteristics:**
- Self-reported (from Reddit/Discord spreadsheets)
- Tends to skew upward (people with higher grades are more likely to share)
- Covers academic years 2022-2023 through 2025-2026
- **Accepted offers only** — rejections and waitlists are dropped at import time

**Where the complexity actually lives.** The frontend is conventional React + Recharts and the
database is a single table. Nearly all of the difficulty is in the ETL layer, because the input is
free-text typed by humans into a spreadsheet. The entire value of the site depends on grouping
"UofT CS", "u of t comp sci", and "Computer Science (St. George)" into one bucket. Sections
[5](#5-etl-pipeline-data-import) and [6](#6-slugs--program-identity) are the important ones.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 15.5 | React framework with App Router, API routes |
| **Language** | TypeScript | Type safety across frontend and backend |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Charts** | Recharts | Data visualization (line charts, histograms, box plots) |
| **Database** | Neon Postgres | Serverless PostgreSQL (cloud-hosted) |
| **DB Client** | @neondatabase/serverless | HTTP/WebSocket Postgres driver for serverless |
| **CSV parsing** | csv-parse | Reads `data/csv/*.csv` during import |
| **HTML scraping** | cheerio | Extracts the sheet table in `scripts/html-to-csv.js` |
| **Date parsing** | date-fns | Multi-format date parsing in the ETL |
| **Deployment** | Vercel | Hosting, CI/CD, serverless functions |
| **Domain** | ontariouniversitymetrics.com | Custom domain via DNS |

There is no ORM, no state-management library, and no test framework. `railway.json` exists as an
alternate deploy target but Vercel is what's live.

Fuzzy matching uses a hand-written Jaccard token-set score (`lib/etl/similarity.ts`) rather than
an edit-distance library — see §5 for why.

---

## 3. Project Structure

```
OntarioUniversityMetrics/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (theme provider, global styles)
│   ├── page.tsx                 # Homepage (stats, carousel, KPIs, search)
│   ├── api/                     # API routes (serverless functions)
│   │   ├── stats/route.ts       # GET /api/stats - aggregate statistics
│   │   ├── search/route.ts      # GET /api/search?q=... - program search
│   │   ├── program/route.ts     # GET /api/program?slug=... - program details
│   │   └── years/route.ts       # GET /api/years - list of academic years
│   └── program/
│       └── [slug]/page.tsx      # Dynamic program detail page
│
├── components/                   # React UI components (all client components)
│   ├── charts/                  # Recharts wrappers — all read theme via useTheme()
│   │   ├── TrendLineChart.tsx   # Line chart for trends
│   │   ├── HistogramChart.tsx   # Grade distribution (5-point bins)
│   │   ├── BoxWhiskerChart.tsx  # Box-and-whisker plot
│   │   ├── AvgByMonthChart.tsx  # Bar chart by admission month/round
│   │   └── ChartCard.tsx        # Wrapper/frame for chart sections
│   ├── search/
│   │   ├── SearchBar.tsx        # Search input (250 ms debounce)
│   │   └── SearchResultsDropdown.tsx # Dropdown list of results
│   ├── theme/
│   │   ├── ThemeProvider.tsx    # Theme context provider
│   │   └── ThemeToggle.tsx      # Dark/light mode toggle
│   └── ui/                      # Generic presentational pieces
│       ├── StatCard.tsx         # KPI stat card
│       ├── DataTable.tsx        # Tabular data display
│       ├── YearFilter.tsx       # Year filter buttons
│       ├── HorizontalCarousel.tsx # Swipeable carousel (homepage slides)
│       ├── NotesDropdown.tsx    # Expandable notes/disclaimers
│       └── EmptyState.tsx       # "No data" placeholder
│
├── lib/                          # Backend logic
│   ├── db/                      # Database layer
│   │   ├── client-postgres.ts   # Neon Postgres connection + query helpers
│   │   └── schema-postgres.ts   # Table creation + indexes + migrations
│   │
│   ├── queries/                 # SQL query functions
│   │   ├── program-postgres.ts  # Get program rows by slug
│   │   ├── search-postgres.ts   # Search + grouping SQL
│   │   └── years-postgres.ts    # Get distinct years
│   │
│   ├── etl/                     # Extract-Transform-Load pipeline
│   │   ├── importCsvPostgres.ts # Main import orchestration
│   │   ├── columnMapping.ts     # Map messy CSV headers to fields
│   │   ├── normalize.ts         # Normalize university/program names, grades
│   │   ├── normalizeDates.ts    # Parse dates, extract months/rounds
│   │   ├── normalizeStatus.ts   # Normalize "accepted"/"rejected"/etc.
│   │   ├── ouacValidation.ts    # Match to official OUAC codes (tiered)
│   │   ├── ouacBackfill.ts      # Backfill missing codes from matched rows
│   │   ├── ouacPrograms.json    # Scraped OUAC program database (1,409 programs)
│   │   ├── similarity.ts        # Jaccard token-set similarity
│   │   ├── supplementalCodes.ts # 52 OUAC codes requiring supplemental apps
│   │   ├── admissionAverages.ts # University-published admission averages
│   │   └── logs.ts              # Import logging utilities
│   │
│   ├── stats/                   # Statistics computation (runs client-side)
│   │   ├── compute.ts           # KPIs, YoY change
│   │   ├── histogram.ts         # Bin grades into histogram
│   │   └── percentiles.ts       # Linear-interpolated percentiles
│   │
│   └── format/                  # Display formatting
│       └── universityNames.ts   # titleCase + displayUniversity (single source of truth)
│
├── data/                         # Data files
│   ├── csv/                     # Extracted CSV data by year
│   │   ├── 2022-2023.csv
│   │   ├── 2023-2024.csv
│   │   ├── 2024-2025.csv
│   │   └── 2025-2026.csv        # Regenerated from sheet.html
│   ├── sheet.html               # Raw Google Sheets export (the real ~4 MB one)
│   └── import_logs/             # Import summaries (gitignored)
│       ├── import_summary.json
│       └── unmatched_ouac.json
│
├── scripts/                      # CLI scripts
│   ├── import-csv-postgres.ts   # Main import entrypoint (loads .env.local)
│   ├── html-to-csv.js           # sheet.html → data/csv/2025-2026.csv (cheerio)
│   ├── scrape-ouac.py           # Scrape ouinfo.ca → ouacPrograms.json
│   └── most-recent-date.js      # Find latest admission_date present in the CSV
│
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   └── data-update-guide.md     # Human-facing data refresh walkthrough
│
├── .claude/skills/
│   └── update-admissions-data/  # Agent skill automating the data refresh
│
├── public/                       # Static assets (logo)
├── styles/
│   └── globals.css              # Global styles + Tailwind imports
│
├── .env.local                    # Environment variables (gitignored)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── next.config.js                # Next.js config (skips eslint during builds)
├── eslint.config.mjs             # ESLint flat config
├── .prettierrc                   # Prettier config (tabs, single quotes)
├── vercel.json                   # Vercel deployment configuration
└── railway.json                  # Alternate Railway deploy config (unused)
```

---

## 4. Database Architecture

### Connection Setup (`lib/db/client-postgres.ts`)

31 lines, no ORM. The whole data-access surface is two functions.

```typescript
import { Pool } from '@neondatabase/serverless';

// Lazy-initialize pool to avoid build-time errors when env vars aren't available
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

// Helper for queries that return rows
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
  const result = await getPool().query(queryString, params);
  return result.rows as T[];
}

// Helper for single row queries
export async function queryOne<T = any>(queryString: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(queryString, params);
  return rows[0] || null;
}

export { getPool as pool };
```

**Key points:**
- `@neondatabase/serverless` works without long-lived TCP connections, which is what makes it
  viable inside Vercel serverless functions
- The pool is lazy-initialized so `next build` doesn't fail when `POSTGRES_URL` is absent
- Falls back to `DATABASE_URL` if `POSTGRES_URL` isn't set
- All queries are parameterized (`$1`, `$2`, …) — no string interpolation into SQL
- CLI scripts must set `neonConfig.webSocketConstructor = ws` before connecting (see
  `scripts/import-csv-postgres.ts`); Node has no built-in WebSocket in this path

### Schema (`lib/db/schema-postgres.ts`)

One table, one row per reported offer. No joins anywhere in the app.

```sql
CREATE TABLE IF NOT EXISTS admissions (
  id SERIAL PRIMARY KEY,
  row_hash TEXT UNIQUE,              -- SHA256 hash for deduplication
  academic_year TEXT NOT NULL,        -- "2024-2025" (parsed from filename)

  -- University info
  university TEXT NOT NULL,           -- Original input: "UofT", "Waterloo"
  university_norm TEXT NOT NULL,      -- Canonical: "university of toronto"

  -- Program info
  program_name TEXT NOT NULL,         -- Original: "Computer Science (Co-op)"
  program_name_norm TEXT NOT NULL,    -- Canonical: "computer science"
  ouac_code TEXT,                     -- Official code: "WCS", "TAD" (nullable)

  -- Admission data
  admission_grade REAL NOT NULL,      -- 60.0 - 100.0
  admission_date_raw TEXT,            -- Original: "Feb 16, 2024"
  admission_date_iso TEXT,            -- Parsed: "2024-02-16"
  admission_month_iso TEXT,           -- "2024-02"
  admission_month_label TEXT,         -- "Feb"  (abbreviated, date-fns 'MMM')
  admission_year INTEGER,             -- 2024
  round_label TEXT,                   -- "Round 1", "Round 2"
  round_order INTEGER,                -- 1, 2, 3 (for sorting)

  -- Metadata
  supplemental_required INTEGER NOT NULL DEFAULT 0,  -- 1 if supp app needed
  status_normalized TEXT NOT NULL,    -- always "accepted" in practice
  source_file TEXT NOT NULL,          -- "2024-2025.csv"
  imported_at TEXT NOT NULL           -- ISO timestamp (drives "last updated")
)
```

**The central design choice:** every messy field is stored **twice** — the raw value for display
and auditing, and a `_norm` value that every query groups and filters on. Normalization is
lossy and occasionally wrong, so keeping the original means a bad normalization rule can always
be diagnosed and re-run without re-downloading the source.

**Indexes** (seven, created idempotently by `ensureSchema()`):

```sql
CREATE INDEX IF NOT EXISTS idx_program_lookup      ON admissions (university_norm, program_name_norm);
CREATE INDEX IF NOT EXISTS idx_ouac_lookup         ON admissions (university_norm, ouac_code);
CREATE INDEX IF NOT EXISTS idx_academic_year       ON admissions (academic_year);
CREATE INDEX IF NOT EXISTS idx_admission_month_iso ON admissions (admission_month_iso);
CREATE INDEX IF NOT EXISTS idx_program_name_norm   ON admissions (program_name_norm);
CREATE INDEX IF NOT EXISTS idx_university_norm     ON admissions (university_norm);
CREATE INDEX IF NOT EXISTS idx_ouac_code           ON admissions (ouac_code);
```

The first two composites cover the two program-page lookup paths (OUAC slug and legacy slug).

`migrate()` just calls `ensureSchema()`; there is no versioned migration history. Schema changes
are made by editing the `CREATE TABLE` and rebuilding from CSV.

### Row Deduplication

Each row gets a SHA-256 hash, and inserts use `ON CONFLICT (row_hash) DO NOTHING`.

```typescript
const row_hash = sha256(JSON.stringify({
  academic_year,
  source_file: file,
  row_index: rowIndex,        // position in the source CSV
  raw_record: rec,            // the entire untouched CSV row
  canonical_university_norm,
  canonical_program_norm,
  ouac_code,
  admission_grade,
  admission_date_raw: dateRaw,
  admission_month_iso: dateFields.admission_month_iso,
  round_label: dateFields.round_label
}));
```

**This deliberately hashes the full raw row plus its index.** An earlier version hashed only
`year + program + month/round + grade`, which silently collapsed genuinely distinct students who
happened to report the same grade in the same month — a real data-loss bug. Including
`raw_record` and `row_index` means only byte-identical rows at the same position dedupe, so the
constraint now protects against *re-running an import*, not against legitimate duplicates in the
data. See the comment at `importCsvPostgres.ts:130`.

Note the consequence: because `row_index` is part of the hash, inserting a row in the middle of
the source spreadsheet shifts every subsequent row's hash. Append-mode imports on a reordered
sheet will therefore duplicate rows — which is why the refresh procedure always uses
`--rebuild`.

---

## 5. ETL Pipeline (Data Import)

### Overview

```
data/csv/*.csv
  → Column Mapping        (which column is which?)
  → Status filter         (accepted only)
  → Normalization         (university, program, grade, date)
  → OUAC Matching         (tiered, per row)
  → OUAC Backfill         (second pass, across all rows)
  → Insert                (ON CONFLICT DO NOTHING)
  → Log summary
```

Orchestrated by `importAllCSVsPostgres()` in `lib/etl/importCsvPostgres.ts`. It reads every
`.csv` in `data/csv/`, derives `academic_year` from the filename via `/\d{4}-\d{4}/`, and
accumulates all rows in memory (`allRows`) before inserting — because the backfill step needs
the full set.

### Step 1: Column Mapping (`lib/etl/columnMapping.ts`)

Headers differ every year. Google Forms exports produce headers like *"What date did you receive
your offer of admission?"*, while hand-maintained sheets use `admission_date`. `mapColumns()`
resolves a header for each of seven logical fields.

```typescript
const FIELD_ALIASES = {
  university:  ['university', 'school', 'institution', 'uni', 'college', 'which university', ...],
  program_name:['program name', 'program_title', 'what program', 'program', 'major', ...],
  ouac_code:   ['ouac code', 'ouac_code', 'ouac program code', 'program code', 'ouac', 'code'],
  admission_grade: ['acceptance average', 'admission average', 'average when accepted', ...],
  admission_date:  ['what date did you receive', 'date of offer', 'offer date', 'month', ...],
  status:      ['accepted rejected waitlisted', 'were you accepted', 'admission status', ...],
  supplemental_required: ['supplemental required', 'supplemental application', 'supplemental'],
};
```

**Matching logic:**
1. Headers are normalized to bare alphanumerics (`normalizeHeader`: lowercase, strip everything
   that isn't `a-z0-9`)
2. **Pass 1** — exact match against unclaimed headers
3. **Pass 2** — substring match, longest aliases first so the most specific wins; aliases under
   4 characters are skipped in this pass to avoid absurd matches
4. A `claimed` set prevents one header from being assigned to two different fields

The alias lists are ordered generic-last on purpose: `'program'` and `'grade'` sit at the end so
`'program name'` and `'acceptance average'` get first refusal.

**Watch out:** `"which program"` was deliberately *removed* as a `program_name` alias
(`columnMapping.ts:10`) because it false-positived on long status/comment headers containing
"…to which program". Adding short generic aliases here is the single easiest way to silently
corrupt an import.

### Step 2: Status Filtering (`lib/etl/normalizeStatus.ts`)

`normalizeStatus()` maps a raw value to `'accepted' | 'rejected' | 'waitlisted' | 'unknown'`
using **exact** membership in three word lists (not substring matching).

```typescript
const ACCEPTED_VALUES   = ['accepted', 'admitted', 'offer accepted', 'admit', 'yes',
                           'confirmed', 'accept', 'offered', 'admission', 'enrolled', 'offer'];
const REJECTED_VALUES   = ['rejected', 'denied', 'declined', 'no', 'not admitted', ...];
const WAITLISTED_VALUES = ['waitlisted', 'wait list', 'wait-list', 'wait', 'pending',
                           'deferred', 'hold'];
```

Rows that don't normalize to `accepted` are dropped. Because matching is exact, an unrecognized
phrasing becomes `unknown` and is also dropped — conservative by design, but it means new
free-text status values silently reduce the row count rather than polluting the data.

**When there is no status column at all**, the importer checks whether the filename or any
header contains "accepted". If so, the file is treated as accepted-only; otherwise every row is
dropped and counted in `missingStatus`.

### Step 3: Normalization

#### University (`normalizeUniversity`)

Lowercases, replaces non-alphanumerics with spaces, collapses whitespace, then looks the result
up in a hand-maintained `UNIVERSITY_CANONICAL` table. Unmatched values pass through cleaned.

| Input | Output |
|-------|--------|
| `UofT`, `u of t`, `utoronto`, `UTSG` | `university of toronto` |
| `UTM`, `uoft mississauga`, `Mississauga` | `university of toronto mississauga` |
| `UW`, `Waterloo`, `uwaterloo` | `university of waterloo` |
| `Mac`, `McMaster` | `mcmaster university` |
| `Queen's`, `Queens`, `queen s` | `queens university` |
| `TMU`, `Ryerson` | `toronto metropolitan university` |

Two judgment calls worth knowing:
- **UTM and UTSC stay separate from St. George.** Program competitiveness differs materially by
  campus, so they are distinct universities in this dataset.
- The table includes out-of-province schools (UBC, McGill, Dalhousie) because people submit
  them. They survive normalization but are excluded from most homepage stats, which filter on
  `ouac_code IS NOT NULL`.

#### Program (`normalizeProgram(rawProgram, rawUniversity)`)

A ten-stage strip. Takes the university too, so it can remove a leading school name.

1. Strip a leading university-name prefix (`"Carleton University - B. Computer Science Honours"`),
   trying full name, name minus "University", canonical form, and known abbreviations
2. Strip leading degree qualifiers (`bachelor of`, `b.sc.`, `beng`, `honours`, `hons.`, …)
3. Strip leading program-code prefixes (`"MN: "`, `"WMF: "`)
4. Strip **all** parenthesized noise blocks — `(Co-op)`, `(PEY Co-op)`, `(BSc, iBSc)`,
   `(St. George Campus)` — looping five times to catch nested/multiple groups
5. Strip inline co-op/honours tokens after separators (`–`, `-`, `+`, `,`, `/`)
6. Strip trailing campus tokens
7. Strip trailing degree suffixes
8. Strip trailing ordinals (`"Engineering 1"`, `"Engineering I"`)
9. Strip trailing short codes in parens (`(CMP1)`)
10. Strip trailing year indicators, then lowercase and collapse to single spaces

```typescript
// "Computer Science Honours (Co-op) - St. George" → "computer science"
```

#### Grade (`normalizeGrade`)

Strips a trailing `%`, `parseFloat`s, rejects `NaN` and anything outside 0–100. The importer
then **additionally drops anything below 60** (`importCsvPostgres.ts:92`) as implausible for a
reported offer. Both rejections increment `gradeDropped`.

#### Date (`lib/etl/normalizeDates.ts`)

Tries, in order:

1. **Full parse** against ~22 `date-fns` format strings (ISO, `M/d/yy`, `MMM d, yyyy`,
   `d MMMM yyyy`, month-only, …), after stripping a leading weekday and ordinal suffixes
   (`16th` → `16`). The parsed year is only trusted if `>= 2000` — `date-fns` fills missing
   years with *today's*, which would silently mis-year every day-only string.
2. **Round fallback** — `/round\s*(\d+)/i` → `round_label: "Round 2"`, `round_order: 2`
3. **Fuzzy month extraction** — finds any month name anywhere in the string, so
   `"early december"`, `"Late Nov"`, `"first week december"` all yield a month. The year is
   then inferred from the academic year: Sep–Dec → first year, Jan–Aug → second year.

```
"Feb 16, 2024"        → { date_iso: "2024-02-16", month_iso: "2024-02", month_label: "Feb" }
"early december"      → { month_iso: "2023-12", month_label: "Dec", admission_year: 2023 }
"Round 2"             → { round_label: "Round 2", round_order: 2 }
```

Rows where nothing resolves increment `unknownDate` but are still imported — they just don't
appear in the by-month chart.

### Step 4: OUAC Code Matching (`lib/etl/ouacValidation.ts`)

OUAC codes are the canonical grouping key. `ouacPrograms.json` holds **1,409 real programs
across 22 universities**, scraped from ouinfo.ca by `scripts/scrape-ouac.py`. On first use the
file is loaded and indexed three ways (by code, by university, flat list), with each entry's
`programName` run through the same `normalizeProgram` used on CSV rows so both sides of a
comparison are normalized identically.

`matchToOuac(rawCode, programNorm, universityNorm)` is tiered, **most-trustworthy first**:

- **Tier 0 — manual overrides.** ~60 hardcoded `programNorm::universityNorm → code` entries,
  checked *before* everything else. These exist for names with literally zero token overlap with
  the official title, which fuzzy matching structurally cannot resolve:

  ```typescript
  'ibiomed::mcmaster university': 'MEH',   // → Integrated Biomedical Engineering & Health Sciences
  'afm::university of waterloo':  'WXY',   // → Accounting & Financial Management
  'cs bba::university of waterloo':'WBC',  // CS/BBA double degree
  'life sci::university of toronto':'TML',
  'ivey aeo::western university':  'WIVEY',// invented code — AEO isn't a real OUAC program
  ```

  All Ivey AEO/HBA variants collapse into the synthetic `WIVEY` code. There's also an entry for
  a known typo in the source data (`'life sci neuroscience0::…'`).

- **Tier 1 — trust the CSV's own code.** If `rawCode` exists in the OUAC database, use it. When
  a code is used by multiple schools, disambiguate by university token similarity (≥0.6),
  falling back to the first hit.

- **Tier 2 — fuzzy match within one university.** Find the best-matching university (≥0.6), then
  score `programNorm` against only that school's programs. Accept if score ≥ 0.80 **and** it
  beats the runner-up by more than 0.08, or if score ≥ 0.92 outright. Constraining to one
  university is what stops Waterloo's "Computer Science" from matching Carleton's.

- **Tier 3 — global fuzzy match.** Last resort across all 1,409 programs, requiring ≥0.92 and a
  >0.08 gap over second place.

- **Final fallback** — `autoMapValidOuacCode()`, one more attempt to canonicalize a valid-looking
  raw code.

- **No match** → `ouac_code` stays `null` and the row groups by its raw normalized names.

The runner-up gap requirement is the important safety property: when two candidates score
similarly the matcher **rejects both** rather than guessing. Unmatched rows are still queryable
via legacy slugs, so a miss degrades gracefully; a wrong match silently pollutes a program's
statistics.

**Similarity (`lib/etl/similarity.ts`)** is Jaccard token-set overlap — `|A∩B| / |A∪B|` over
word sets — so it's word-order independent ("Science Computer" matches "Computer Science") and
insensitive to punctuation. There is deliberately no edit-distance fallback: single-character
typos inside a word are **not** tolerated, only reordering and extra/missing words. (A
`levenshteinSimilarity` helper used to exist here but was never wired into the matcher, so it
was removed.)

**Special case: Queen's Arts/Psychology.** `queensArtsOverride()` in `ouacValidation.ts` forces
any Queen's program containing "arts" or "psychology" (excluding concurrent/education) to code
`QA` and program `arts`, because Queen's admits these under one code. It's checked before
`matchToOuac` and can't live in `MANUAL_OVERRIDES` because it matches on a substring rather than
an exact normalized name.

> ⚠️ **This override currently never fires.** It compares against the *raw* university string,
> and every Queen's row in the CSVs has `university` = `"Queen's"` (718 rows), which strips to
> `"queens"` — never containing `"queensuniversity"`. Verified against all 10,103 rows: zero
> matches. That is why a one-off `patch-queens-arts-ouac.js` script had to exist to fix the
> database after the fact. Passing `university_norm` ("queens university") instead of the raw
> value would activate it and reclassify **53 rows** to `QA`/"arts" — a deliberate data change,
> so it has been left alone rather than fixed silently.

### Step 5: OUAC Backfill (`lib/etl/ouacBackfill.ts`)

A second pass after all rows are in memory, aimed mainly at 2022-2023 (which predates the
spreadsheet having an OUAC column). For each row still missing a code, it scores that row's
`program_name_norm` against every *matched* row at the same university and adopts the code only
at similarity ≥ 0.92 with a >0.05 gap over second place.

In effect the cleaner recent years teach the older years their codes. Rows that still don't
match are written to `data/import_logs/unmatched_ouac.json` with their top 3 candidates — this
file is the primary tool for finding new `MANUAL_OVERRIDES` entries worth adding.

### Step 6: Database Insert

```typescript
INSERT INTO admissions (...) VALUES ($1, …, $19)
ON CONFLICT (row_hash) DO NOTHING
```

Rows are inserted in genuinely batched multi-row statements: 100 rows per `INSERT`, built as
`($1..$19), ($20..$38), …` with 1,900 bound parameters per statement (well under Postgres's
65,535 limit). Duplicate `row_hash` values are filtered out in JS beforehand, so a multi-row
statement can never conflict with itself.

This previously sliced into batches of 100 but then issued **one `INSERT` per row** inside each
slice — `BATCH_SIZE` only controlled log frequency — meaning ~6,500 sequential round-trips to
Neon over HTTP. That was the reason a rebuild took minutes and had to not be interrupted.

### Step 7: Logging (`lib/etl/logs.ts`)

Writes two gitignored files under `data/import_logs/`:

| File | Contents |
|---|---|
| `import_summary.json` | `totalRows`, `acceptedRows`, `droppedRows`, `missingStatus`, `unknownDate`, `gradeDropped`, `files` |
| `unmatched_ouac.json` | Rows the backfill couldn't match, with top-3 candidates and scores |

`acceptedRows` in the summary is the count *offered* to the database, not the count inserted —
`ON CONFLICT DO NOTHING` can make the actual table smaller. Compare against
`/api/stats → total_records` after a rebuild.

### Running the Import

```bash
npm run db:rebuild     # DELETE FROM admissions, then reimport everything
npm run db:update      # append only (does not clear existing rows)

# or directly
npx tsx scripts/import-csv-postgres.ts --rebuild
```

Use `tsx`, not `ts-node` (`ts-node` fails with `Unknown file extension ".ts"`). The script loads
`.env.local` **before** importing any module that touches the database, since `client-postgres.ts`
reads `process.env` at pool-construction time.

> `db:update` passes `--update`, but the script only ever checks for `--rebuild`
> (`import-csv-postgres.ts:19`). The flag is inert — it simply means "don't rebuild", i.e.
> append. Combined with `row_index` being part of `row_hash`, append mode duplicates rows if the
> sheet was reordered. **Prefer `db:rebuild`.**

---

## 6. Slugs — Program Identity

There is no `programs` table. A program's identity **is** its URL slug, derived at query time.
Two formats coexist, distinguished by **casing alone** (`program-postgres.ts:31-40`):

| Format | Example | Detected by |
|---|---|---|
| OUAC-matched | `WCS--university of waterloo` | first segment matches `/^[A-Z][A-Z0-9]{0,5}$/` |
| Legacy / unmatched | `york university--kinesiology` | anything else |

This works precisely because `normalizeUniversity` guarantees lowercase output, so an
all-uppercase first segment is unambiguously an OUAC code. It's compact, and it's load-bearing:
loosening the normalizer to preserve capitalization would break slug parsing.

`getProgramRows(slug, year)` parses the slug and issues one of four queries (OUAC vs legacy ×
all-years vs single-year). Both paths are covered by composite indexes.

`searchPrograms()` performs the mirror-image grouping in SQL, using a code that *looks* valid
(uppercase, 2–6 chars, no spaces or slashes) as the group key and falling back to
`program_name_norm`:

```sql
GROUP BY COALESCE(
  CASE WHEN ouac_code IS NOT NULL
        AND ouac_code = UPPER(ouac_code)
        AND LENGTH(TRIM(ouac_code)) BETWEEN 2 AND 6
        AND ouac_code NOT LIKE '% %'
        AND ouac_code NOT LIKE '%/%'
       THEN ouac_code ELSE NULL END,
  program_name_norm
), university_norm
HAVING MAX(ouac_code) IS NOT NULL OR COUNT(*) >= 2
```

The `HAVING` clause hides unmatched one-off rows (typos, joke entries) from search: an unmatched
group needs at least 2 rows to surface, while any OUAC-matched group always does.

---

## 7. API Routes

Four thin handlers. Each calls a query function and `JSON.stringify`s the result — no caching
headers, no revalidation config, no auth.

### GET `/api/stats`

Six aggregate queries for the homepage, all computed **in SQL**.

```json
{
  "total_records": 6562,
  "total_programs": 614,
  "total_universities": 21,
  "min_year": "2022-2023",
  "max_year": "2025-2026",
  "overall_avg": 92.1,
  "yearly_averages": [
    { "academic_year": "2022-2023", "avg_grade": 91.8, "n": 1200 }
  ],
  "university_averages": [
    { "university": "university of waterloo", "avg_grade": 94.2, "n": 800 }
  ],
  "last_updated": "2026-03-09T02:55:00.000Z"
}
```

Details that matter when reading these numbers:
- `total_programs` = `COUNT(DISTINCT ouac_code) WHERE ouac_code IS NOT NULL`
- `total_universities` = `COUNT(DISTINCT university_norm) WHERE ouac_code IS NOT NULL` — the
  OUAC filter is deliberate, to exclude user-typed garbage like `ubcv` or `harvard`
- `university_averages` requires `HAVING COUNT(*) >= 5` and is sorted by average descending, so
  the homepage's top-5 highest is `slice(0, 5)` and lowest is the tail
- `yearly_averages` is ordered ascending, so the client reads "latest" off the end
- `last_updated` is `MAX(imported_at)` — it reflects the last **import**, not the last offer date

### GET `/api/search?q=...`

```json
{
  "results": [
    { "slug": "WCS--university of waterloo", "program_name": "Computer Science",
      "university": "University of Waterloo", "ouac_code": "WCS", "n_total": 150 }
  ]
}
```

Empty `q` short-circuits to `{ results: [] }`. Limit is 20. The query splits `q` on whitespace
and requires **every** word to match `university_norm`, `program_name_norm`, or `ouac_code`
(`AND` of `OR`s), so "waterloo computer" narrows rather than widens. Results are ranked by a
stack of `CASE WHEN` tiebreakers — exact code, exact program name, program prefix, university
match — then by row count. Display names come from `getCanonicalNames()` where a valid code
exists, otherwise title-cased normalized text with a small override map for `Queen's`, `McMaster`,
`OCAD`.

### GET `/api/program?slug=...&year=...`

```json
{
  "program": {
    "program_name": "Computer Science",
    "university": "University of Waterloo",
    "ouac_code": "WCS",
    "years": ["2025-2026", "2024-2025", "2023-2024"],
    "requires_supplemental": true,
    "published_average": "Individual selection from the low to mid-90s"
  },
  "rows": [ { "id": 1234, "academic_year": "2024-2025", "admission_grade": 95.5, "...": "..." } ]
}
```

**The `year` parameter is accepted but intentionally ignored** — the handler always calls
`getProgramRows(slug, 'ALL')` (`program/route.ts:30`) and the client filters in memory. This is
deliberate: year-over-year comparison and the full year-filter button row both need the other
years present, and per-program row counts are small enough (tens to hundreds) that shipping them
all is cheaper than a second round-trip.

Returns `400` with `{ program: null }` if `slug` is missing, `404` if no rows match. Metadata is
enriched from three static sources keyed by OUAC code: `getCanonicalNames()` (official names),
`requiresSupplemental()` (52 codes in `supplementalCodes.ts`), and `getPublishedAverage()`
(`admissionAverages.ts`, sourced from university admissions pages — both files carry source URLs
in their header comments).

### GET `/api/years`

```json
{ "years": ["2025-2026", "2024-2025", "2023-2024", "2022-2023"] }
```

`SELECT DISTINCT academic_year … ORDER BY academic_year DESC`.

---

## 8. Frontend Components

Both pages are `'use client'` with `useEffect` fetches and skeleton loaders. There is no SSR of
data, no `next/cache` usage, and no shared client-side store.

### Homepage (`app/page.tsx`)

**Layout:**
1. Gradient title + subtitle
2. `HorizontalCarousel` with 3 slides — `TrendLineChart` of average by year, top-5 highest
   universities (gradient progress bars), top-5 lowest
3. Four `KPICard`s — Admission Records, Programs Tracked, Universities Tracked, Year Coverage
4. Search bar
5. `NotesDropdown` (disclaimers about self-reported data)
6. Last-updated date

**State:** `stats`, `trend` (latest year minus previous), `yearRange` (e.g. `2022-2026`, built
from `min_year`'s start and `max_year`'s end), `latestAvg`. A single `/api/stats` fetch on mount
populates all four; any failure sets `stats` to `null` and the page renders its empty state.

Title-casing for university names is done locally with a `LOWERCASE_WORDS` set (`of`, `the`,
`and`, …) plus a `UNIVERSITY_NAME_OVERRIDES` map — note this duplicates similar logic in
`search-postgres.ts` and `api/program/route.ts`.

### Program Page (`app/program/[slug]/page.tsx`)

**Layout:**
1. Home link + search bar
2. Program header — name, university, OUAC code, supplemental/published-average badges,
   KPIs (Avg, Median, Count, Range)
3. `YearFilter` buttons
4. Charts row — `AvgByMonthChart`, `HistogramChart`
5. Stats row — grade inflation (YoY), standard deviation, % above 95
6. `BoxWhiskerChart`
7. `DataTable`

Fetches `/api/program` and `/api/years` in parallel, stores every year's rows in `allRows`, and
derives the visible set client-side:

```typescript
const rows = year === 'ALL' ? allRows : allRows.filter(r => r.academic_year === year);
```

Two distinct empty states are tracked, which is the reason `program` is only overwritten when
the response actually contains one:

- `notFound` — the slug itself doesn't exist → `EmptyState`
- `noDataForYear` — program exists but the selected year has no rows → keep the header and year
  filter visible so the user can switch years

YoY is computed two ways: across all years (`computeYoY`, the mean of consecutive per-year
deltas) when `year === 'ALL'`, or as a direct this-year-minus-previous-year difference when a
specific year is selected.

### Statistics (`lib/stats/`)

All program-page stats run **in the browser** on the rows already fetched.

`computeKPIs(rows)` returns `{ n, mean, median, min, max, std, pct90, pct95, q1, q3 }`:
- `std` is the **sample** standard deviation (`n-1` denominator) and returns `null` when `n < 3`,
  so tiny samples don't display a meaningless spread
- `pct90` / `pct95` are the percentage of grades `>= 90` / `>= 95`
- `q1` / `q3` come from `computePercentiles`, which **linearly interpolates** between the two
  nearest sorted values rather than picking a nearest rank

`computeHistogram(grades, binStart = 60, binEnd = 100, binSize = 5)` produces **8 bins of 5
points each**, labelled `"60-64"` … `"95-99"`, with `count` and `pct` per bin. `HistogramChart`
calls it with defaults and plots `pct`, assigning each bin its own pastel colour from a
12-colour palette.

`computeInsights(rows)` builds most/least-competitive-month strings and a supplemental
percentage, but **is not currently rendered anywhere** — see [§13](#13-known-issues--gotchas).

### Key Components

**SearchBar** — controlled input with a **250 ms** debounce (`setTimeout` cleared on each
keystroke), fetches `/api/search`, renders `SearchResultsDropdown`, closes on outside
`mousedown`, and `router.push`es to `/program/${slug}` on select. Used on both pages; takes an
`autoFocus` prop.

**YearFilter** — "All Years" plus one button per year, driving the `?year=` query param.

**ThemeProvider / ThemeToggle** — React context exposing `dark`, consumed by every chart to pick
tick/grid/tooltip colours (Recharts can't read Tailwind's `dark:` classes).

**Charts (Recharts)**
- `TrendLineChart` — average by year, gradient fill
- `HistogramChart` — 5-point bins, per-bin pastel colours
- `BoxWhiskerChart` — Q1, median, Q3, whiskers
- `AvgByMonthChart` — grouped by `admission_month_label` / `round_label`

---

## 9. Data Flow

### Search Flow
```
User types "waterloo computer" in SearchBar
  ↓  debounce 250 ms
GET /api/search?q=waterloo%20computer
  ↓
searchPrograms() → SQL: every word must match uni/program/code, grouped by
                   COALESCE(valid ouac_code, program_name_norm) + university_norm
  ↓
HAVING filters out unmatched single-row groups; CASE WHEN ranking; LIMIT 20
  ↓
Rows mapped to canonical display names via getCanonicalNames()
  ↓
Slug built: "WCS--university of waterloo" (matched) or "uni--program" (unmatched)
  ↓
SearchResultsDropdown → router.push('/program/WCS--university%20of%20waterloo')
```

### Program Page Flow
```
User visits /program/WCS--university%20of%20waterloo?year=2024-2025
  ↓
page.tsx reads slug from params, year from searchParams
  ↓
Parallel: GET /api/program?slug=…&year=…   +   GET /api/years
  ↓
route.ts ignores `year`, calls getProgramRows(slug, 'ALL')
  ↓
parseSlug() sees uppercase first segment → OUAC path
  ↓
SELECT * FROM admissions WHERE ouac_code = 'WCS' AND university_norm = 'university of waterloo'
  ORDER BY academic_year DESC, admission_grade DESC      (idx_ouac_lookup)
  ↓
Metadata enriched: canonical names, requiresSupplemental(), getPublishedAverage()
  ↓
Client stores all rows, filters to the selected year in memory
  ↓
computeKPIs / computeYoY / computeHistogram run in the browser → charts render
```

---

## 10. Refreshing the Data

The source of truth is a public Google Sheet. The refresh path is:

```
Google Sheet
  → save as "Webpage, Complete"  → <name>_files/sheet.html   (~4 MB, the real data)
  → copy to data/sheet.html
  → node scripts/html-to-csv.js → data/csv/2025-2026.csv
  → npx tsx scripts/import-csv-postgres.ts --rebuild → Neon Postgres
  → live site
```

`scripts/html-to-csv.js` loads `data/sheet.html` with cheerio, walks
`table.waffle > tbody > tr` (skipping row 0), and writes seven columns by **hardcoded cell
index**:

| CSV column | HTML `td` index |
|---|---|
| `university` | 0 |
| `ouac_code` | 1 |
| `program_name` | 2 |
| `status` | 3 |
| `admission_grade` | 4 |
| `admission_date` | 6 — *column 5 (application sent date) is skipped* |
| `supplemental_required` | — left empty; filled later from `supplementalCodes.ts` |

Rows with fewer than 7 cells, or missing university/program, are skipped. **If the spreadsheet's
column order changes, these indices must be updated** — nothing detects the drift, the data just
lands in the wrong fields.

**The biggest trap:** saving a Google Sheet as "Webpage, Complete" produces *two* files. The
`<name>.html` at the top level is a ~50 KB `<iframe>` wrapper with no data in it; the real table
is in `<name>_files/sheet.html`. Verify with `grep -o "<tr" data/sheet.html | wc -l` — it should
print thousands.

This whole procedure is automated as an agent skill at
`.claude/skills/update-admissions-data/SKILL.md`, with a human-readable walkthrough in
[data-update-guide.md](./data-update-guide.md). The skill also documents the `.env.local` problem:
because it's gitignored, a fresh clone has no `POSTGRES_URL` and step 5 cannot run there. In
that case steps 1–4 are committed and the import is run on the machine that holds the
credentials.

---

## 11. Deployment

### Vercel Configuration (`vercel.json`)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "npm install --omit=dev",
  "framework": "nextjs"
}
```

**Why `--omit=dev`?** Skips eslint/prettier/tsx and friends for faster, smaller deployments.
This is why build-critical packages (`tailwindcss`, `typescript`, `postcss`, `autoprefixer`,
`@types/*`) live in `dependencies` rather than `devDependencies` — moving them back would break
the Vercel build.

**Two consequences of `--omit=dev` that have already bitten this project:**

1. **ESLint isn't installed on Vercel**, so Next.js aborts the lint step. `next.config.js` sets
   `eslint.ignoreDuringBuilds: true` to skip it deliberately (the build prints
   `Skipping linting`). Lint locally or in CI with `npx next lint`.
2. **`@types/*` in `devDependencies` are absent on Vercel.** A missing type package fails the
   build with `TS7016: Could not find a declaration file for module 'x'` — even though the same
   build passes locally, where devDependencies *are* installed. If you hit this, the choice is
   either move that `@types/*` package into `dependencies`, or keep the file that needs it out of
   the build's type-check scope.

That second point is why **`tsconfig.json` excludes `scripts/`**. The CLI scripts are run with
`tsx` (which transpiles without type-checking) and are never bundled or deployed, so they have no
business gating the app build — `scripts/import-csv-postgres.ts` imports `ws`, and with
`@types/ws` in `devDependencies` that broke deploys. Excluding the directory doesn't affect
running the scripts, since `tsx` ignores `include`/`exclude` and all imports here are relative.
The tradeoff: type errors in `scripts/` won't surface from `npx tsc --noEmit` anymore.

`railway.json` (NIXPACKS + `npm run start`) exists as an alternate target but isn't what serves
the live site.

### Build Process

```bash
npm run build   # tsc + Next.js build → .next/
```

The build never touches the database: `client-postgres.ts` only constructs its pool on first
query, so a missing `POSTGRES_URL` fails at request time rather than build time.

### Deploy Notes

- Data changes require **both** a commit (CSV/sheet) and a database rebuild. Deploying alone
  changes nothing the user sees, because the site reads from Neon, not from `data/csv/`.
- Conversely, a rebuild takes effect immediately without redeploying.

### Environment Variables (Vercel Dashboard)

| Variable | Description |
|----------|-------------|
| `POSTGRES_URL` | Neon database connection string |

### Custom Domain Setup

1. Add domain in Vercel Dashboard → Settings → Domains
2. Configure DNS at registrar:
   - A record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`
3. Wait for DNS propagation (5-30 min)
4. Vercel auto-provisions SSL certificate

---

## 12. Environment Variables

### Local Development (`.env.local`)

```bash
# Neon Postgres connection string
POSTGRES_URL=postgresql://user:password@host.neon.tech:5432/database?sslmode=require
```

### Required Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | Postgres connection string |
| `DATABASE_URL` | No | Alternative name (fallback) |

`.env.local` is gitignored and therefore **never travels with the repo**. It exists only on the
machine where it was created. The value can be recovered from the Neon dashboard or from
Vercel → Settings → Environment Variables.

---

## 13. Known Issues & Gotchas

Real characteristics of the current code, not hypotheticals.

**`total_programs` undercounts.** `/api/stats` counts `DISTINCT ouac_code` globally, but the rest
of the codebase treats `(ouac_code, university_norm)` as a program's identity. Codes shared
across schools collapse into one. Should be `COUNT(DISTINCT (ouac_code, university_norm))`.
Changing it moves a number on the live homepage, so it's a deliberate decision, not a cleanup.

**The Queen's Arts/Psychology override never fires.** It matches on the raw `university` value,
which is always `"Queen's"` in the CSVs, so the intended `QA` grouping has never been applied by
the ETL. Fixing it reclassifies 53 rows — see the callout in [§5](#step-4-ouac-code-matching-libetlouacvalidationts).

**`db:update` is misleading.** The `--update` flag isn't read by the script; it only means "skip
the rebuild". Because `row_index` participates in `row_hash`, appending against a reordered
sheet duplicates rows. Use `db:rebuild`.

**`imported_at` is per-row, set in the build loop.** Harmless today, but it means a very long
import spreads timestamps across its duration. `MAX(imported_at)` (the site's "Last updated")
therefore reports when the import *finished*, roughly.

**No tests.** There is no test framework configured. The ETL's normalization and matching rules
are the highest-value target, since they're pure functions with well-understood inputs —
`normalizeProgram`, `matchToOuac`, and `normalizeDateFields` especially.

**`ws` is a production dependency for a CLI-only need.** `scripts/import-csv-postgres.ts` needs it
for Neon's WebSocket transport, but that script never runs on Vercel. It's in `dependencies` so a
local `--omit=dev` install can still run the import; moving it to `devDependencies` would shrink
the deployed tree slightly at the cost of that guarantee.

### Fixed previously (kept for context)

- **Unbatched inserts** — now genuine multi-row `INSERT`s, ~65× fewer round-trips.
- **Order-dependent backfill** — `backfillOuac` now mutates rows in place instead of the caller
  `.shift()`-ing a parallel array; candidates are snapshotted so results don't depend on
  iteration order.
- **Triplicated title-casing** — consolidated into `lib/format/universityNames.ts`. The three
  copies had drifted, so the same university rendered differently per page.
- **Dead code** — removed `getProgramBySlug`/`getProgramIdentifier`/`getProgramDisplayInfo`,
  `computeInsights`, `levenshteinSimilarity`, four unused components
  (`AlternatingTop5Lists`, `KPIGrid`, `Skeletons`, `VerticalCarousel`), and seven unused
  dependencies.

---

## Appendix: Key Files Reference

| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage UI |
| `app/program/[slug]/page.tsx` | Program detail page |
| `app/api/stats/route.ts` | Aggregate stats endpoint (SQL-computed) |
| `app/api/search/route.ts` | Search endpoint |
| `app/api/program/route.ts` | Program endpoint (always fetches all years) |
| `lib/db/client-postgres.ts` | Database connection + `query`/`queryOne` |
| `lib/db/schema-postgres.ts` | Table schema + indexes |
| `lib/etl/importCsvPostgres.ts` | Import orchestration, row hashing |
| `lib/etl/columnMapping.ts` | Messy-header → field resolution |
| `lib/etl/normalize.ts` | University/program/grade normalization |
| `lib/etl/ouacValidation.ts` | Tiered OUAC matching + manual overrides |
| `lib/etl/ouacBackfill.ts` | Second-pass code backfill |
| `lib/queries/search-postgres.ts` | Search + grouping SQL |
| `lib/queries/program-postgres.ts` | Slug parsing + program SQL |
| `lib/stats/compute.ts` | KPIs, YoY |
| `scripts/html-to-csv.js` | sheet.html → CSV (hardcoded column indices) |
| `lib/format/universityNames.ts` | Display names — single source of truth |
| `scripts/scrape-ouac.py` | Builds `ouacPrograms.json` from ouinfo.ca |
| `components/search/SearchBar.tsx` | Search input (250 ms debounce) |
| `components/charts/HistogramChart.tsx` | Grade histogram (5-point bins) |

---

## Glossary

| Term | Definition |
|------|------------|
| **OUAC** | Ontario Universities' Application Centre — assigns codes to programs (e.g., WCS = Waterloo CS) |
| **OUAC code** | 2–6 uppercase chars identifying a program at a school; the canonical grouping key in this project |
| **Slug** | URL-safe program identifier — `CODE--university_norm` or `university_norm--program_name_norm` |
| **Normalized (`_norm`)** | Cleaned/standardized version of user input; what all queries group and filter on |
| **Canonical** | The official OUAC name/code a row was matched to, as opposed to what the user typed |
| **Tier (0–3)** | The confidence levels in `matchToOuac`, tried most-trustworthy first |
| **Token set similarity** | Jaccard index over word sets — order-independent fuzzy matching |
| **Backfill** | Second pass that infers missing OUAC codes from already-matched rows at the same school |
| **Round** | Fallback grouping when a date can't be parsed (e.g. "Round 2") |
| **AIF** | Admission Information Form — Waterloo's supplemental application |
| **ETL** | Extract-Transform-Load — data processing pipeline |
| **Neon** | Serverless Postgres provider |
| **Vercel** | Hosting platform for Next.js |
