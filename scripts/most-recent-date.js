// Find the most recent admission_date in data/csv/2025-2026.csv
const fs = require('fs');
const path = 'data/csv/2025-2026.csv';
const lines = fs.readFileSync(path, 'utf8').split('\n');

function parseDate(s) {
  // Accepts MM/DD/YYYY or M/D/YYYY
  if (!s) return null;
  const [m, d, y] = s.split('/').map(Number);
  if (!m || !d || !y) return null;
  return new Date(y, m - 1, d);
}

let mostRecent = null;
for (let i = 1; i < lines.length; ++i) {
  const cols = lines[i].split(',');
  if (cols.length < 6) continue;
  const dateStr = cols[5].replace(/"/g, '').trim();
  const dt = parseDate(dateStr);
  if (dt && (!mostRecent || dt > mostRecent)) mostRecent = dt;
}
if (mostRecent) {
  console.log('Most recent admission_date:', mostRecent.toLocaleDateString('en-CA'));
} else {
  console.log('No valid dates found.');
}
