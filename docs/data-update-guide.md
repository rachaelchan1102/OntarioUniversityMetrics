# Admissions Data Update Guide

**THIS GUIDE IS FOR COPILOT TO FOLLOW** when the user says "follow the data update guide" or "update the admissions data". (cuz who wants to do this thing themselves guys)

---

## ⚠️ CRITICAL: The Attached HTML File is NOT the Data

When the user attaches an HTML file from Google Sheets, it's just a **wrapper page**. The actual spreadsheet data is in a file called `sheet.html` located in a `_files` folder in their Downloads.

**DO NOT try to parse the attached HTML file directly.**

---

## Step-by-Step Process (For Copilot)

### Step 1: Find the sheet.html File

The user saved a Google Sheet as "Webpage, Complete". This creates:
- `SomeName.htm` (wrapper - this is what they might attach, IGNORE IT)
- `SomeName_files/sheet.html` (ACTUAL DATA - use this)

**Run this command to find the most recent sheet.html:**
```bash
ls -lt ~/Downloads/*_files/sheet.html 2>/dev/null | head -5
```

Or search for files containing "University Applications":
```bash
ls -la ~/Downloads/ | grep -i "university.*applications.*_files"
```

### Step 2: Copy sheet.html to Project

```bash
cp ~/Downloads/"FOLDER_NAME_files/sheet.html" /Users/rachaelhychan/AdmissionsAverageProject/data/sheet.html
```

**Common folder name:**
```bash
cp ~/Downloads/"2025-2026 University Applications (offers, rejections, deferals) (Responses) - Google Drive_files/sheet.html" /Users/rachaelhychan/AdmissionsAverageProject/data/sheet.html
```

### Step 3: Convert HTML → CSV

```bash
cd /Users/rachaelhychan/AdmissionsAverageProject && node scripts/html-to-csv.js
```

**Expected output:** `CSV extraction complete. Rows: XXXX`

### Step 4: Import CSV → Database

⚠️ **USE `tsx` NOT `ts-node`** (ts-node fails with ESM error)

```bash
cd /Users/rachaelhychan/AdmissionsAverageProject && npx tsx scripts/import-csv.ts --rebuild
```

**Expected output:** `Database rebuilt and all CSVs imported.`

### Step 5: Verify the Import

```bash
cat /Users/rachaelhychan/AdmissionsAverageProject/data/import_logs/import_summary.json
```

### Step 6: Start the Dev Server

⚠️ **Kill existing processes first** to avoid port conflicts:

```bash
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null
```

Then start the server:
```bash
cd /Users/rachaelhychan/AdmissionsAverageProject && npm run dev
```

Run as **background process** (`isBackground: true`) so it doesn't block.

**Expected:** Server runs on http://localhost:3000

---

## Errors I've Encountered (And How to Fix Them)

### Error 1: "Unknown file extension .ts" with ts-node
```
TypeError: Unknown file extension ".ts"
```
**Fix:** Use `npx tsx` instead of `npx ts-node`:
```bash
npx tsx scripts/import-csv.ts --rebuild
```

### Error 2: "Port 3000 is in use"
```
⚠ Port 3000 is in use, trying 3001 instead.
```
**Fix:** Kill existing processes before starting:
```bash
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null
```

### Error 3: Server Started But User Can't Access It
When using `run_task` to start the server, it may not fully initialize.
**Fix:** Use `run_in_terminal` with `isBackground: true` instead:
```bash
npm run dev
```

### Error 4: Attached HTML File Has No Data
The user attached a `.htm` file but it only contains wrapper HTML with an iframe.
**Fix:** Don't parse the attached file. Find `sheet.html` in the `_files` folder in Downloads.

### Error 5: Can't Find the _files Folder
**Fix:** Ask user to confirm they saved as "Webpage, Complete" (not just "Webpage, HTML Only"). Then search:
```bash
ls -la ~/Downloads/ | grep "_files"
```

---

## Quick Copy-Paste Block (All Commands)

```bash
# 1. Find the _files folder
ls -la ~/Downloads/ | grep -i "university.*_files"

# 2. Copy sheet.html (UPDATE THE FOLDER NAME)
cp ~/Downloads/"2025-2026 University Applications (offers, rejections, deferals) (Responses) - Google Drive_files/sheet.html" /Users/rachaelhychan/AdmissionsAverageProject/data/sheet.html

# 3. Convert to CSV
cd /Users/rachaelhychan/AdmissionsAverageProject && node scripts/html-to-csv.js

# 4. Import to database (USE tsx NOT ts-node!)
npx tsx scripts/import-csv.ts --rebuild

# 5. Verify
cat data/import_logs/import_summary.json

# 6. Kill old servers and start fresh
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null && npm run dev
```

---

## Technical Reference

### Data Flow

```
Google Sheets
     ↓ (User saves as "Webpage, Complete")
~/Downloads/SomeName_files/sheet.html
     ↓ (cp to project)
data/sheet.html
     ↓ (node scripts/html-to-csv.js)
data/csv/2025-2026.csv
     ↓ (npx tsx scripts/import-csv.ts --rebuild)
SQLite Database
     ↓ (npm run dev)
Website at localhost:3000
```

### CSV Column Mapping (from html-to-csv.js)

| CSV Column           | HTML Table Column Index |
|---------------------|------------------------|
| university          | 0                      |
| ouac_code           | 1                      |
| program_name        | 2                      |
| status              | 3                      |
| admission_grade     | 4                      |
| admission_date      | 6 (skips column 5)     |
| supplemental_required | (empty)              |

### Spreadsheet Columns (Full List)

1. University
2. OUAC Code
3. Program Name
4. Status
5. Admission Grade
6. Application Sent Date (SKIPPED)
7. **Response Date** ← becomes `admission_date`
8. Group (A/B)
9. Citizenship
10. Province
11+ Additional columns (notes, etc.)

---

*Last updated: March 9, 2026*
