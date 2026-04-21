# Ontario University Metrics - Complete Architecture Documentation

> **Author's Reference Guide** — This document explains every part of the codebase in detail.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Architecture](#4-database-architecture)
5. [ETL Pipeline (Data Import)](#5-etl-pipeline-data-import)
6. [API Routes](#6-api-routes)
7. [Frontend Components](#7-frontend-components)
8. [Data Flow](#8-data-flow)
9. [Deployment](#9-deployment)
10. [Environment Variables](#10-environment-variables)

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

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 15.5 | React framework with App Router, SSR, API routes |
| **Language** | TypeScript | Type safety across frontend and backend |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Charts** | Recharts | Data visualization (line charts, histograms, box plots) |
| **Database** | Neon Postgres | Serverless PostgreSQL (cloud-hosted) |
| **DB Client** | @neondatabase/serverless | HTTP-based Postgres driver for serverless |
| **Deployment** | Vercel | Hosting, CI/CD, edge functions |
| **Domain** | ontariouniversitymetrics.com | Custom domain via DNS |

---

## 3. Project Structure

```
AdmissionsAverageProject/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (theme provider, global styles)
│   ├── page.tsx                 # Homepage (stats, search, carousel)
│   ├── api/                     # API routes (serverless functions)
│   │   ├── stats/route.ts       # GET /api/stats - aggregate statistics
│   │   ├── search/route.ts      # GET /api/search?q=... - program search
│   │   ├── program/route.ts     # GET /api/program?slug=... - program details
│   │   └── years/route.ts       # GET /api/years - list of academic years
│   └── program/
│       └── [slug]/page.tsx      # Dynamic program detail page
│
├── components/                   # React UI components
│   ├── SearchBar.tsx            # Search input with dropdown results
│   ├── SearchResultsDropdown.tsx # Dropdown list of search results
│   ├── YearFilter.tsx           # Year filter buttons
│   ├── StatCard.tsx             # KPI stat card component
│   ├── ChartCard.tsx            # Wrapper for chart sections
│   ├── TrendLineChart.tsx       # Line chart for trends
│   ├── HistogramChart.tsx       # Histogram for grade distribution
│   ├── BoxWhiskerChart.tsx      # Box-and-whisker plot
│   ├── AvgByMonthChart.tsx      # Bar chart by admission month/round
│   ├── DataTable.tsx            # Tabular data display
│   ├── KPIGrid.tsx              # Grid of KPI cards
│   ├── HorizontalCarousel.tsx   # Swipeable carousel
│   ├── NotesDropdown.tsx        # Expandable notes/disclaimers
│   ├── EmptyState.tsx           # "No data" placeholder
│   ├── ThemeToggle.tsx          # Dark/light mode toggle
│   ├── ThemeProvider.tsx        # Theme context provider
│   └── Skeletons.tsx            # Loading skeleton components
│
├── lib/                          # Backend logic
│   ├── db/                      # Database layer
│   │   ├── client-postgres.ts   # Neon Postgres connection + query helpers
│   │   └── schema-postgres.ts   # Table creation + migrations
│   │
│   ├── queries/                 # SQL query functions
│   │   ├── program-postgres.ts  # Get program rows by slug
│   │   ├── search-postgres.ts   # Search programs by query
│   │   └── years-postgres.ts    # Get distinct years
│   │
│   ├── etl/                     # Extract-Transform-Load pipeline
│   │   ├── importCsvPostgres.ts # Main import logic
│   │   ├── columnMapping.ts     # Map CSV headers to fields
│   │   ├── normalize.ts         # Normalize university/program names
│   │   ├── normalizeDates.ts    # Parse dates, extract months/rounds
│   │   ├── normalizeStatus.ts   # Normalize "accepted"/"rejected"/etc.
│   │   ├── ouacValidation.ts    # Match to official OUAC codes
│   │   ├── ouacBackfill.ts      # Backfill missing OUAC codes
│   │   ├── ouacPrograms.json    # Scraped OUAC program database (~1400 programs)
│   │   ├── similarity.ts        # Fuzzy string matching (Jaccard/Levenshtein)
│   │   ├── supplementalCodes.ts # Programs requiring supplemental apps
│   │   ├── admissionAverages.ts # Published university admission averages
│   │   └── logs.ts              # Import logging utilities
│   │
│   └── stats/                   # Statistics computation
│       ├── compute.ts           # Mean, median, std dev, YoY change
│       ├── histogram.ts         # Bin grades into histogram
│       └── percentiles.ts       # Percentile calculations
│
├── data/                         # Data files
│   ├── csv/                     # Raw CSV data by year
│   │   ├── 2022-2023.csv
│   │   ├── 2023-2024.csv
│   │   ├── 2024-2025.csv
│   │   └── 2025-2026.csv
│   └── import_logs/             # Import summaries (gitignored)
│
├── scripts/                      # CLI scripts
│   ├── import-csv-postgres.ts   # Main import script
│   ├── html-to-csv.ts           # Convert HTML tables to CSV
│   └── scrape-ouac.py           # Scrape OUAC program data
│
├── public/                       # Static assets
├── styles/
│   └── globals.css              # Global styles + Tailwind imports
│
├── .env.local                    # Environment variables (gitignored)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
└── vercel.json                   # Vercel deployment configuration
```

---

## 4. Database Architecture

### Connection Setup (`lib/db/client-postgres.ts`)

```typescript
import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    pool = new Pool({ connectionString });
  }
  return pool;
}

// Query helper - returns array of rows
export async function query<T>(sql: string, params: any[]): Promise<T[]> {
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}

// Single row helper
export async function queryOne<T>(sql: string, params: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}
```

**Key points:**
- Uses `@neondatabase/serverless` which works over HTTP (no persistent connections)
- Lazy-initializes the pool on first query
- Connection string from `POSTGRES_URL` environment variable

### Schema (`lib/db/schema-postgres.ts`)

```sql
CREATE TABLE IF NOT EXISTS admissions (
  id SERIAL PRIMARY KEY,
  row_hash TEXT UNIQUE,              -- SHA256 hash for deduplication
  academic_year TEXT NOT NULL,        -- "2024-2025"
  
  -- University info
  university TEXT NOT NULL,           -- Original input: "UofT", "Waterloo"
  university_norm TEXT NOT NULL,      -- Normalized: "university of toronto"
  
  -- Program info  
  program_name TEXT NOT NULL,         -- Original: "Computer Science (Co-op)"
  program_name_norm TEXT NOT NULL,    -- Normalized: "computer science"
  ouac_code TEXT,                     -- Official code: "WCS", "TAD"
  
  -- Admission data
  admission_grade REAL NOT NULL,      -- 60.0 - 100.0
  admission_date_raw TEXT,            -- Original: "Feb 16, 2024"
  admission_date_iso TEXT,            -- Parsed: "2024-02-16"
  admission_month_iso TEXT,           -- "2024-02"
  admission_month_label TEXT,         -- "February"
  admission_year INTEGER,             -- 2024
  round_label TEXT,                   -- "Early", "Regular", "May Round"
  round_order INTEGER,                -- 1, 2, 3 (for sorting)
  
  -- Metadata
  supplemental_required INTEGER DEFAULT 0,  -- 1 if supp app needed
  status_normalized TEXT NOT NULL,    -- "accepted" (others filtered out)
  source_file TEXT NOT NULL,          -- "2024-2025.csv"
  imported_at TEXT NOT NULL           -- ISO timestamp
)
```

**Indexes for performance:**
```sql
CREATE INDEX idx_program_lookup ON admissions (university_norm, program_name_norm);
CREATE INDEX idx_ouac_lookup ON admissions (university_norm, ouac_code);
CREATE INDEX idx_academic_year ON admissions (academic_year);
CREATE INDEX idx_ouac_code ON admissions (ouac_code);
```

### Row Deduplication

Each row gets a SHA256 hash of its key fields:
```typescript
const row_hash = sha256(
  academic_year + university_norm + program_name_norm + 
  ouac_code + admission_month_iso + round_label + admission_grade
);
```

On insert: `ON CONFLICT (row_hash) DO NOTHING` — duplicates are silently skipped.

---

## 5. ETL Pipeline (Data Import)

### Overview

The ETL (Extract-Transform-Load) pipeline converts messy CSV data into clean database records:

```
CSV Files → Column Mapping → Normalization → OUAC Matching → Database Insert
```

### Step 1: Column Mapping (`lib/etl/columnMapping.ts`)

CSV files have inconsistent headers (Google Forms exports, manual exports, etc.). The column mapper identifies which column contains which data.

**Example mappings:**
```typescript
const FIELD_ALIASES = {
  university: ['university', 'school', 'which university', 'uni'],
  program_name: ['program', 'major', 'what program'],
  admission_grade: ['acceptance average', 'admission avg', 'average when accepted'],
  admission_date: ['date received', 'offer date', 'when did you get accepted'],
  status: ['accepted rejected waitlisted', 'admission status'],
  ouac_code: ['ouac code', 'program code', 'ouac'],
};
```

**Matching logic:**
1. Try exact match (header == alias)
2. Try substring match (header contains alias)
3. Longer aliases tried first (more specific wins)

### Step 2: Normalization

#### University Normalization (`lib/etl/normalize.ts`)

Converts various inputs to canonical names:

| Input | Output |
|-------|--------|
| `UofT`, `u of t`, `utoronto` | `university of toronto` |
| `UW`, `Waterloo`, `uwaterloo` | `university of waterloo` |
| `Mac`, `McMaster` | `mcmaster university` |
| `Queen's`, `Queens`, `queen s` | `queens university` |
| `TMU`, `Ryerson` | `toronto metropolitan university` |

```typescript
export function normalizeUniversity(raw: string): string {
  const cleaned = raw.trim().toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // Remove special chars
    .replace(/\s+/g, ' ')          // Collapse spaces
    .trim();
  return UNIVERSITY_CANONICAL[cleaned] || cleaned;
}
```

#### Program Normalization

Strips noise like:
- Degree types: "Honours", "B.Sc.", "Bachelor of"
- Co-op indicators: "(Co-op)", "co-operative"
- Campus: "(St. George)", "(Mississauga)"

```typescript
// "Computer Science Honours (Co-op) - St. George" → "computer science"
```

#### Date Normalization (`lib/etl/normalizeDates.ts`)

Parses various date formats:
```
"Feb 16, 2024" → { admission_date_iso: "2024-02-16", admission_month_label: "February" }
"March" → { admission_month_label: "March", round_label: "March Round" }
"Early round" → { round_label: "Early", round_order: 1 }
```

#### Status Normalization (`lib/etl/normalizeStatus.ts`)

Only "accepted" records are kept:
```typescript
const ACCEPTED_VALUES = ['accepted', 'admitted', 'offer', 'yes', 'enrolled'];
const REJECTED_VALUES = ['rejected', 'denied', 'no'];
const WAITLISTED_VALUES = ['waitlisted', 'deferred', 'pending'];
```

Non-accepted records are dropped during import.

### Step 3: OUAC Code Matching (`lib/etl/ouacValidation.ts`)

Programs are matched to official OUAC codes from `ouacPrograms.json` (~1400 programs scraped from ouinfo.ca).

**Matching order:**
1. **Exact code match** — CSV has valid OUAC code → use it
2. **Fuzzy match** — Program name + university matches OUAC entry
3. **Manual override** — Known abbreviations (e.g., "iBioMed" → MEH)
4. **No match** — Keep raw normalized names

**Fuzzy matching uses:**
- Token set similarity (Jaccard index)
- Levenshtein distance for typos
- University-constrained search (only match within same university)

```typescript
// Manual overrides for common abbreviations
const MANUAL_OVERRIDES = {
  'cs bba::university of waterloo': 'WBC',  // CS/BBA double degree
  'afm::university of waterloo': 'WXY',     // Accounting & Financial Management
  'ibiomed::mcmaster university': 'MEH',    // iBioMed
  'life sci::university of toronto': 'TML',
};
```

### Step 4: Database Insert

Records are inserted in batches of 100:
```typescript
INSERT INTO admissions (...) VALUES (...)
ON CONFLICT (row_hash) DO NOTHING
```

### Running the Import

```bash
# Rebuild (delete all existing data, reimport)
npm run db:rebuild

# Or run directly
npx tsx scripts/import-csv-postgres.ts --rebuild
```

---

## 6. API Routes

### GET `/api/stats`

Returns aggregate statistics for the homepage.

**Response:**
```json
{
  "total_records": 6562,
  "total_programs": 614,
  "total_universities": 21,
  "min_year": "2022-2023",
  "max_year": "2025-2026",
  "overall_avg": 92.1,
  "yearly_averages": [
    { "academic_year": "2022-2023", "avg_grade": 91.8, "n": 1200 },
    { "academic_year": "2023-2024", "avg_grade": 92.0, "n": 1500 },
    ...
  ],
  "university_averages": [
    { "university": "university of waterloo", "avg_grade": 94.2, "n": 800 },
    ...
  ],
  "last_updated": "2026-03-09T02:55:00.000Z"
}
```

### GET `/api/search?q=...`

Searches programs by name, university, or OUAC code.

**Query params:**
- `q` — Search query (required)

**Response:**
```json
{
  "results": [
    {
      "slug": "WCS--university of waterloo",
      "program_name": "Computer Science",
      "university": "University of Waterloo",
      "ouac_code": "WCS",
      "n_total": 150
    },
    ...
  ]
}
```

**Slug format:**
- OUAC-matched: `{CODE}--{university_norm}` e.g., `WCS--university of waterloo`
- Unmatched: `{university_norm}--{program_name_norm}`

### GET `/api/program?slug=...&year=...`

Returns all admission records for a specific program.

**Query params:**
- `slug` — Program identifier (required)
- `year` — Academic year filter, or "ALL" (optional)

**Response:**
```json
{
  "program": {
    "program_name": "Computer Science",
    "university": "University of Waterloo",
    "ouac_code": "WCS",
    "years": ["2025-2026", "2024-2025", "2023-2024"],
    "requires_supplemental": true,
    "published_average": "90-95%"
  },
  "rows": [
    {
      "id": 1234,
      "academic_year": "2024-2025",
      "admission_grade": 95.5,
      "admission_month_label": "February",
      ...
    },
    ...
  ]
}
```

### GET `/api/years`

Returns list of distinct academic years.

**Response:**
```json
{
  "years": ["2025-2026", "2024-2025", "2023-2024", "2022-2023"]
}
```

---

## 7. Frontend Components

### Homepage (`app/page.tsx`)

**Layout:**
1. Title + subtitle
2. Carousel (3 slides):
   - Line chart: Average grade by year
   - Top 5 universities (highest)
   - Top 5 universities (lowest)
3. KPI cards (4):
   - Admission Records
   - Programs Tracked
   - Universities Tracked
   - Year Coverage
4. Search bar
5. Notes & Disclaimers dropdown
6. Last updated date

**State:**
```typescript
const [stats, setStats] = useState<Stats | null>(null);
const [trend, setTrend] = useState<number | null>(null);
const [yearRange, setYearRange] = useState<string | null>(null);
```

**Data fetching:**
```typescript
useEffect(() => {
  fetch('/api/stats').then(res => res.json()).then(setStats);
}, []);
```

### Program Page (`app/program/[slug]/page.tsx`)

**Layout:**
1. Back button + search bar
2. Program header:
   - Name, university, OUAC code
   - Badges (supplemental required, published average)
   - KPIs: Avg, Median, Count, Range
3. Year filter buttons
4. Charts row:
   - Average by month/round (bar chart)
   - Grade distribution (histogram)
5. Stats row:
   - Grade inflation (YoY change)
   - Standard deviation
   - Above 95% percentage
6. Box-and-whisker plot
7. Data table

**KPI Computation (`lib/stats/compute.ts`):**
```typescript
function computeKPIs(rows) {
  const grades = rows.map(r => r.admission_grade);
  return {
    n: grades.length,
    mean: average(grades),
    median: median(grades),
    min: Math.min(...grades),
    max: Math.max(...grades),
    std: standardDeviation(grades),
    pct90: percentAbove(grades, 90),
    pct95: percentAbove(grades, 95),
    q1: percentile(grades, 0.25),
    q3: percentile(grades, 0.75),
  };
}
```

### Key Components

#### SearchBar
- Debounced input (300ms delay)
- Fetches `/api/search?q=...` on change
- Shows dropdown with results
- Navigates to `/program/[slug]` on selection

#### YearFilter
- Button group for year selection
- "All Years" + individual years
- Updates URL query param `?year=...`

#### Charts (Recharts)
- `TrendLineChart` — Line chart with gradient fill
- `HistogramChart` — Bar chart with 2% bin width
- `BoxWhiskerChart` — Shows Q1, median, Q3, whiskers
- `AvgByMonthChart` — Bar chart grouped by admission month/round

---

## 8. Data Flow

### Search Flow
```
User types "waterloo computer" in SearchBar
  ↓
SearchBar debounces (300ms), calls /api/search?q=waterloo%20computer
  ↓
search/route.ts calls searchPrograms("waterloo computer")
  ↓
search-postgres.ts builds SQL with LIKE clauses for each word
  ↓
SQL query runs against Postgres, returns matching programs
  ↓
Results mapped to canonical names via ouacValidation.ts
  ↓
SearchResultsDropdown shows results
  ↓
User clicks result → navigates to /program/WCS--university%20of%20waterloo
```

### Program Page Flow
```
User visits /program/WCS--university%20of%20waterloo?year=2024-2025
  ↓
page.tsx extracts slug from params, year from searchParams
  ↓
Fetches /api/program?slug=WCS--university%20of%20waterloo&year=2024-2025
  ↓
program/route.ts calls getProgramRows(slug, year)
  ↓
program-postgres.ts parses slug → detects OUAC format
  ↓
SQL: SELECT * FROM admissions WHERE ouac_code = 'WCS' AND university_norm = 'university of waterloo'
  ↓
Rows returned, metadata enriched (canonical names, supplemental flag, published avg)
  ↓
page.tsx computes KPIs from rows
  ↓
Charts rendered with row data
```

---

## 9. Deployment

### Vercel Configuration (`vercel.json`)

```json
{
  "installCommand": "npm install --omit=dev",
  "framework": "nextjs"
}
```

**Why `--omit=dev`?**
- Skips devDependencies (eslint, prettier, etc.)
- Faster installs, smaller deployment
- Build-critical packages (tailwindcss, typescript) moved to dependencies

### Build Process

```bash
npm run build
# Compiles TypeScript
# Builds Next.js static + dynamic pages
# Generates .next/ directory
```

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

## 10. Environment Variables

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

### How They're Used

```typescript
// lib/db/client-postgres.ts
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('POSTGRES_URL or DATABASE_URL environment variable is required');
}
```

---

## Appendix: Key Files Reference

| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage UI |
| `app/program/[slug]/page.tsx` | Program detail page |
| `app/api/stats/route.ts` | Stats API endpoint |
| `app/api/search/route.ts` | Search API endpoint |
| `app/api/program/route.ts` | Program API endpoint |
| `lib/db/client-postgres.ts` | Database connection |
| `lib/db/schema-postgres.ts` | Table schema |
| `lib/etl/importCsvPostgres.ts` | CSV import logic |
| `lib/etl/normalize.ts` | Name normalization |
| `lib/etl/ouacValidation.ts` | OUAC matching |
| `lib/queries/search-postgres.ts` | Search SQL |
| `lib/queries/program-postgres.ts` | Program SQL |
| `lib/stats/compute.ts` | Statistics functions |
| `components/SearchBar.tsx` | Search input |
| `components/HistogramChart.tsx` | Grade histogram |

---

## Glossary

| Term | Definition |
|------|------------|
| **OUAC** | Ontario Universities' Application Centre — assigns codes to programs (e.g., WCS = Waterloo CS) |
| **Slug** | URL-safe identifier for a program (e.g., `WCS--university%20of%20waterloo`) |
| **Normalized** | Cleaned/standardized version of user input |
| **ETL** | Extract-Transform-Load — data processing pipeline |
| **Neon** | Serverless Postgres provider |
| **Vercel** | Hosting platform for Next.js |

