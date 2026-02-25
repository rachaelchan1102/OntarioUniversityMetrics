// This script extracts the main table from data/sheet.html and writes it as CSV to data/csv/2025-2026.csv
// It matches the format of 2024-2025.csv: university,ouac_code,program_name,status,admission_grade,admission_date,supplemental_required

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
  'supplemental_required'
];

const rows = [];

$('table.waffle > tbody > tr').each((i, tr) => {
  // Skip header and non-data rows
  if (i === 0) return;
  const tds = $(tr).find('td');
  if (tds.length < 7) return;
  // Extract and clean text for each column
  const row = [
    $(tds[0]).text().trim(), // university
    $(tds[1]).text().trim(), // ouac_code
    $(tds[2]).text().trim(), // program_name
    $(tds[3]).text().trim(), // status
    $(tds[4]).text().trim(), // admission_grade
    $(tds[6]).text().trim(), // admission_date (should be the 7th column)
    '' // supplemental_required (should be empty)
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
