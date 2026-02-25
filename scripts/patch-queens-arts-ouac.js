// Script to update Queen's University Arts-related records to OUAC code QA, except for concurrent education
const fs = require('fs');
const path = 'data/csv/2022-2023.csv';
const outPath = 'data/csv/2022-2023-patched.csv';

const lines = fs.readFileSync(path, 'utf8').split('\n');
const header = lines[0].split(',');
const uniIdx = header.findIndex(h => h.toLowerCase().includes('university'));
const progIdx = header.findIndex(h => h.toLowerCase().includes('program'));
const ouacIdx = header.findIndex(h => h.toLowerCase().includes('ouac_code'));

function isArtsOrPsych(prog) {
  const p = prog.toLowerCase();
  return (
    (p.includes('arts') || p.includes('psychology')) &&
    !p.includes('concurrent') &&
    !p.includes('education')
  );
}

const patched = [lines[0]];
for (let i = 1; i < lines.length; ++i) {
  if (!lines[i].trim()) continue;
  const cols = lines[i].split(',');
  if (
    cols[uniIdx] && cols[uniIdx].toLowerCase().includes("queen") &&
    isArtsOrPsych(cols[progIdx])
  ) {
    cols[ouacIdx] = 'QA';
  }
  patched.push(cols.join(','));
}
fs.writeFileSync(outPath, patched.join('\n'));
console.log('Patched file written:', outPath);
