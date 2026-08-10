---
name: update-admissions-data
description: Update the Ontario University Metrics admissions data from a freshly downloaded Google Sheets export. Use when the user says "update the data", "update the 2025-2026 data", "follow the data update guide", or drops a new "University Applications ... Google Drive.html" file into data/. Handles finding the real sheet.html, converting to CSV, importing to Neon Postgres, refreshing the site's "Last updated" date, and committing.
---

# Update Admissions Data

Refresh the site's admissions dataset from a new Google Sheets export. The live site
([ontariouniversitymetrics.com](https://www.ontariouniversitymetrics.com/)) reads from
Neon Postgres, so new data only appears after the DB `--rebuild` import runs.

**The job is not done until the site's "Last updated" date has moved.** That date is the
user-visible proof the refresh landed, and it only changes when the DB import runs — see
[How the "Last updated" date works](#how-the-last-updated-date-works). Always finish with
[step 8](#8-confirm-the-sites-last-updated-date-moved).

## Data flow

```
Google Sheet  --(save as "Webpage, Complete")-->  Downloads/<name>_files/sheet.html
   --(copy)-->  data/sheet.html
   --(node scripts/html-to-csv.js)-->  data/csv/2025-2026.csv
   --(npx tsx scripts/import-csv-postgres.ts --rebuild)-->  Neon Postgres
                                    ^ this step is what refreshes the site's date
   --(npm run dev)-->  website
```

## ⚠️ The attached .html is NOT the data

When the user saves a Google Sheet as **"Webpage, Complete"**, they get two things:
- `<name>.html` — a tiny (~50 KB) wrapper page that's just an `<iframe>`. **Ignore it.** This is
  usually the file they drop into `data/` or open in the editor.
- `<name>_files/sheet.html` — the **real** data (~4 MB, thousands of `<tr>` rows). **Use this.**

Never parse the wrapper. Confirm you have the real one: it should be MBs and
`grep -o "<tr" data/sheet.html | wc -l` should print thousands.

## Steps

### 1. Find the fresh sheet.html in Downloads

The `_files` folder name usually starts with "2025-2026 University Applications". Search the
user's Downloads (this is a Windows machine; use the Bash tool with `/c/Users/<user>/Downloads`):

```bash
ls -lt /c/Users/*/Downloads/*_files/sheet.html 2>/dev/null | head
```

Pick the most recently modified one. Compare its size to the current `data/sheet.html` — a
larger/newer file confirms it's genuinely new data. If nothing is found, the user probably saved
as "Webpage, HTML Only" instead of "Webpage, Complete" — ask them to re-save.

### 2. Copy it into the project

```bash
cp "/c/Users/<user>/Downloads/<FOLDER>_files/sheet.html" data/sheet.html
```

### 3. Make sure dependencies are installed

On a fresh clone `node_modules/` is gitignored and absent, so the converter fails with
`Cannot find module 'cheerio'`. If `node_modules/` is missing, run `npm install` first.

### 4. Convert HTML → CSV

```bash
node scripts/html-to-csv.js
```

Expected: `CSV extraction complete. Rows: XXXX`. This overwrites
[data/csv/2025-2026.csv](../../../data/csv/2025-2026.csv). Sanity-check the row count grew and
spot-check `head data/csv/2025-2026.csv` for clean columns
(university, ouac_code, program_name, status, admission_grade, admission_date, supplemental_required).

### 5. Import CSV → Neon Postgres

Requires `POSTGRES_URL` in a **`.env.local`** file (gitignored — see below). Use `tsx`, not
`ts-node` (ts-node throws `Unknown file extension ".ts"`):

```bash
npx tsx scripts/import-csv-postgres.ts --rebuild
```

Expected: `✅ Import complete!`. **Let the rebuild finish** — interrupting it leaves the DB
partially filled and the site shows fewer rows than expected.

### 6. Verify the import

```bash
cat data/import_logs/import_summary.json
```

If the API later returns fewer rows than the import summary reported (e.g. ~5k instead of the
full count), the rebuild stopped early or deduplication collapsed rows — rerun `--rebuild` and
let it finish.

### 7. Start the dev server (optional, to eyeball it)

Kill anything already on the dev ports first, then start the server as a background process so it
doesn't block:

```bash
# macOS/Linux: lsof -ti:3000,3001 | xargs kill -9 2>/dev/null
# Windows (PowerShell): npx kill-port 3000 3001   (or close the other terminal)
npm run dev
```

Server runs on http://localhost:3000. Confirm the row count **and the date** via the API:

```bash
node -e "fetch('http://localhost:3000/api/stats').then(r=>r.json()).then(j=>console.log('rows:',j.total_records,'| last_updated:',j.last_updated))"
```

### 8. Confirm the site's "Last updated" date moved

**Do not skip this** — it's the only check the user can see from the outside.

`last_updated` must be today (the moment the import ran). If it still shows the previous refresh,
the import didn't actually touch the database and the update is incomplete, no matter how clean
the CSV looks.

```bash
# Local (dev server running)
node -e "fetch('http://localhost:3000/api/stats').then(r=>r.json()).then(j=>console.log('local :',j.last_updated))"

# Live site — the real check, once the import has run against the shared Neon DB
node -e "fetch('https://www.ontariouniversitymetrics.com/api/stats').then(r=>r.json()).then(j=>console.log('live  :',j.last_updated,'\nrows  :',j.total_records))"
```

The live check needs **no deploy** — the site reads Neon at request time, so a successful import
shows up immediately on production. Conversely, deploying/pushing alone will *never* move the
date.

Report the before/after date to the user explicitly, e.g.
`Last updated: March 9, 2026 → August 5, 2026 (5,638 rows)`.

## How the "Last updated" date works

There is **no hardcoded date anywhere** — nothing to hand-edit, and no config to bump. The chain is:

```
ETL sets imported_at = new Date().toISOString() on every row     (lib/etl/importCsvPostgres.ts)
  -> /api/stats returns last_updated = MAX(imported_at)          (app/api/stats/route.ts)
  -> homepage renders "Last updated: <that date>"                (app/page.tsx, bottom of page)
```

Consequences worth internalizing:

- **Only the DB import moves the date.** Regenerating the CSV, committing, pushing, and
  redeploying all leave it untouched, because it lives in Postgres, not in the repo.
- **`--rebuild` always sets it to now**, since every row is deleted and reinserted with a fresh
  `imported_at`. Append mode (`db:update`) also moves it, because `MAX()` picks up the new rows.
- **It reflects import time, not data recency.** It answers "when was the site last refreshed",
  not "how recent is the newest offer in the sheet". If the user wants the latter, that's
  `node scripts/most-recent-date.js`, which reports the most recent `admission_date` in
  `data/csv/2025-2026.csv` — a different number, not displayed on the site.
- **A stale date after a "successful" update means the import didn't run.** That is the single
  most likely failure, and it is silent — see the `.env.local` gotcha below.

## The `.env.local` gotcha (why the import may not run "here")

`.env.local` holds `POSTGRES_URL` and is in `.gitignore`, so it **never travels with the repo**.
It only exists on the machine where it was created. On a fresh clone (e.g. a different computer)
there's no `.env.local`, so step 5 can't connect to the database.

If `.env.local` / `POSTGRES_URL` is missing, do NOT invent credentials. Instead:
1. Finish steps 1–4 (they don't need the DB).
2. Commit the updated `data/sheet.html` + `data/csv/2025-2026.csv`.
3. Tell the user to run the import on the machine that has `.env.local`, or paste the
   `POSTGRES_URL` (grab it from the Neon dashboard or Vercel → Settings → Environment Variables)
   so you can create `.env.local` and run it here.

The connection string is also available as an env var fallback (`DATABASE_URL`).

**Say this out loud to the user when the import is skipped:** the site's data *and* its
"Last updated" date will both stay stale until someone runs the import — committing and pushing
does not refresh either. Don't report the update as finished; report it as "CSV ready, import
pending", and state which date the site is still showing.

## Committing

Stage only the CSV — not `package-lock.json` (npm install may churn it):

```bash
git add data/csv/2025-2026.csv
```

`data/sheet.html` and the `*Google Drive.html` wrapper are **gitignored**. The raw export is ~4 MB
per refresh and regenerable from the source sheet, so only the derived CSV is tracked. Don't try
to `git add -f` it.

If the import was skipped on this machine, put the remaining steps in the commit body so the
person on the machine-with-credentials knows what to run:

```
Update 2025-2026 admissions data (OLD -> NEW rows)

DB import NOT run here (no .env.local), so the live site still shows the old
data and the old "Last updated" date. To finish on the machine with credentials:
  1. git pull
  2. npx tsx scripts/import-csv-postgres.ts --rebuild
  3. cat data/import_logs/import_summary.json
  4. Confirm the date moved:
     node -e "fetch('https://www.ontariouniversitymetrics.com/api/stats').then(r=>r.json()).then(j=>console.log(j.last_updated,j.total_records))"
```

**Identity note:** on a machine that isn't the owner's usual one, git may auto-detect the wrong
name/email for the author. Confirm the intended identity with the user before pushing (set it
per-repo with `git config --local user.name` / `user.email`), and amend a wrong author with
`git commit --amend --reset-author --no-edit`. Only push when the user explicitly says to.

## Common errors

| Symptom | Fix |
|---|---|
| `Cannot find module 'cheerio'` | `npm install` (node_modules missing on fresh clone) |
| `Unknown file extension ".ts"` | Use `npx tsx`, not `ts-node` |
| Attached `.html` has no data | It's the wrapper — use `<name>_files/sheet.html` instead |
| Site shows fewer rows than the summary | Rebuild was interrupted or rows deduped — rerun `--rebuild` and let it finish |
| Can't find `_files` folder | User saved "Webpage, HTML Only" — ask them to re-save as "Webpage, Complete" |
| Import can't connect / no `POSTGRES_URL` | No `.env.local` on this machine — see the `.env.local` gotcha above |
| Port 3000 in use | Kill the old dev server (see step 7) before starting a new one |
| **Site's "Last updated" date didn't change** | The import never ran (or failed partway). It's `MAX(imported_at)` from Postgres — pushing/deploying can't move it. Rerun `--rebuild` and recheck step 8 |
| `last_updated` is `null` | The `admissions` table is empty — the rebuild deleted rows then failed before inserting. Rerun `--rebuild` |
| Live date differs from local date | Both read the same Neon DB, so they can't genuinely disagree — you're looking at a cached page. Hard-refresh, or trust the `/api/stats` output over the rendered page |

## Reference: how the CSV maps to the spreadsheet

`scripts/html-to-csv.js` reads `table.waffle` rows from `data/sheet.html` and writes these seven
columns to `data/csv/2025-2026.csv`:

| CSV column | Source (HTML table column index) |
|---|---|
| `university` | 0 |
| `ouac_code` | 1 |
| `program_name` | 2 |
| `status` | 3 |
| `admission_grade` | 4 |
| `admission_date` | 6 (column 5 is skipped) |
| `supplemental_required` | (left empty; filled later by the ETL) |

Full spreadsheet column order (for reference when the layout changes):

1. University
2. OUAC Code
3. Program Name
4. Status
5. Admission Grade
6. Application Sent Date *(skipped)*
7. **Response Date** → becomes `admission_date`
8. Group (A/B)
9. Citizenship
10. Province
11. + additional columns (notes, etc.)

If the source spreadsheet's column order changes, update the `tds[...]` indices in
`scripts/html-to-csv.js` to match.
