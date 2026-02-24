// OUAC codes for programs that require a supplemental application
// (AIF, portfolio, personal statement, etc.) on top of the OUAC form.
//
// Sources:
//   Waterloo: https://uwaterloo.ca/future-students/admissions/admission-information-form
//     - all Engineering (except Architecture), all Math faculty, CFM, Geography & Aviation, Science & Aviation
//   McMaster: Health Sciences (MNS), iBioMed (MEH/MEI), Integrated Science (MIS), Arts & Science (MX)
//   UofT Engineering: all Faculty of Applied Science & Engineering programs
//   UofT Rotman Commerce (TAC) and Computer Science (TAD): supplemental assessment
//   Queen's: Commerce (QC), Health Sciences (QH)
//   Western: Ivey AEO (WIVEY), Medical Sciences (ESM)
//   Schulich/York: BBA (YBA)
//   Laurier double-degree programs (Waterloo AIF required): UWB, UWW, UXA
//   Concurrent Education (York, Brock, Lakehead, etc.): additional assessment
export const SUPPLEMENTAL_CODES = new Set<string>([
  // University of Waterloo
  // Engineering (AIF required for all except Architecture WR)
  'WBM', // Biomedical Engineering
  'WC',  // Chemical Engineering
  'WD',  // Systems Design Engineering
  'WE',  // Civil Engineering
  'WEE', // Environmental Engineering
  'WEM', // Management Engineering
  'WMT', // Mechatronics Engineering
  'WNT', // Nanotechnology Engineering
  'WSO', // Software Engineering
  'WWF', // Electrical Engineering
  'WWH', // Mechanical Engineering
  'WWJ', // Computer Engineering
  // Math faculty (AIF required for all)
  'WBC', // CS/BBA Double Degree (Waterloo/Laurier)
  'WCF', // Computing and Financial Management
  'WCS', // Computer Science
  'WM',  // Mathematics
  'WMF', // Mathematics / Financial Analysis & Risk Management
  'WN',  // Mathematics / CPA
  'WSF', // Sustainability and Financial Management
  'WXY', // Accounting and Financial Management (AFM)
  // Other Waterloo programs that require supplementary forms
  'WEV', // Geography and Aviation
  'WSV', // Science and Aviation

  // McMaster University
  'MNS', // Health Sciences — portfolio required
  'MEH', // iBioMed (Integrated Biomedical Engineering & Health Sciences) — supplemental
  'MEI', // iBioMed (co-op) — supplemental
  'MIS', // Integrated Science — supplemental
  'MX',  // Arts & Science — supplemental

  // University of Toronto
  // Engineering (AIF required for all Faculty of Applied Science & Engineering)
  'TB',  // Chemical Engineering
  'TCS', // Computer Engineering
  'TE',  // Electrical Engineering
  'TEO', // TrackOne (Undeclared) Engineering
  'TI',  // Industrial Engineering
  'TK',  // Engineering Science
  'TM',  // Mechanical Engineering
  'TTM', // Materials Engineering
  'TV',  // Civil Engineering
  // Commerce
  'TAC', // Rotman Commerce (St. George) — supplemental assessment required
  'TAD', // Computer Science (Arts & Science) — supplemental required

  // Queen's University
  'QC',  // Commerce — supplemental
  'QH',  // Health Sciences — supplemental required

  // Western University
  'WIVEY', // Ivey Advanced Entry Opportunity — supplemental required
  'ESM',   // Medical Sciences — SWOMEN supplemental consideration

  // York University / Schulich
  'YBA', // Schulich School of Business BBA — supplemental required
  'YFK', // Concurrent Education (Liberal Arts/Prof Studies) — additional assessment
  'YQ',  // Concurrent Education (Arts, Media, Performance & Design) — additional assessment

  // Wilfrid Laurier University
  // double-degree programs with Waterloo require an AIF for the Waterloo component
  'UWB', // BBA/CS (Laurier+Waterloo)
  'UWW', // BBA/Mathematics (Laurier+Waterloo)
  'UXA', // BBA/CS (Laurier only stream)

  // Brock University
  'BAI', // Concurrent BA/BEd — additional assessment
  'BII', // Concurrent BSc/BEd — additional assessment
  'BNS', // Nursing — supplemental

  // Lakehead University
  'AL',  // Concurrent Education Intermediate/Senior — additional assessment
]);

// checks if a given OUAC code requires a supplemental application
export function requiresSupplemental(ouacCode: string | null | undefined): boolean {
  if (!ouacCode) return false;
  return SUPPLEMENTAL_CODES.has(ouacCode.toUpperCase());
}
