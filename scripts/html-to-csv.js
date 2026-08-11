// Extracts the main table from data/sheet.html and writes it as CSV to
// data/csv/2025-2026.csv.
//
// Source spreadsheet column order (indices are hardcoded below — update them if
// the sheet layout changes):
//   0 University            5 Application date       10 Supp App?
//   1 OUAC Code             6 Date of decision       11 Notable info from supp app
//   2 Program name          7 Group A or B?          12 Comments
//   3 Decision              8 Citizenship
//   4 Top 6 Average         9 Province

const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('data/sheet.html', 'utf8');
const $ = cheerio.load(html);

const headers = [
  'university',
  'ouac_code',
  'program_name',
  'status',
  'admission_grade',
  'admission_date',
  'supplemental_required',
  // Free-text columns. The ETL cleans these (lib/etl/cleanNotes.ts) and pulls
  // the supplemental-assessment quartile out of supp_notes into its own field.
  'supp_notes',
  'comments',
];

const rows = [];

$('table.waffle > tbody > tr').each((i, tr) => {
  // Skip header and non-data rows
  if (i === 0) return;
  const tds = $(tr).find('td');
  if (tds.length < 7) return;
  const txt = (n) => (tds[n] ? $(tds[n]).text().trim() : '');
  const row = [
    txt(0),  // university
    txt(1),  // ouac_code
    txt(2),  // program_name
    txt(3),  // status
    txt(4),  // admission_grade
    txt(6),  // admission_date  (col 5 is the application date — not the decision date)
    '',      // supplemental_required — derived by the ETL from the OUAC code
    txt(11), // supp_notes
    txt(12), // comments
  ];
  // Only add if at least university and program_name are present
  if (row[0] && row[2]) rows.push(row);
});

function csvEscape(val) {
  if (val == null) return '';
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"';
  }
  return val;
}

const csv = [headers.join(',')]
  .concat(rows.map(row => row.map(csvEscape).join(',')))
  .join('\n');

fs.writeFileSync('data/csv/2025-2026.csv', csv);
console.log('CSV extraction complete. Rows:', rows.length);
