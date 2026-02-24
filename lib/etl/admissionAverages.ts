// Published admission averages by OUAC code.
// Only includes ranges/averages that universities have explicitly stated on their official pages.
//
// Sources:
//   Waterloo:  https://uwaterloo.ca/future-students/programs/<slug> — "Admission averages" section
//   UofT Eng:  "Characteristics of the First Year Class 2025" — Mean OSS Avg column
//   UofT other: UofT 2025–26 Undergraduate Admissions Bulletin — "Approx. grade requirement"
//   McMaster:  https://future.mcmaster.ca/programs/<slug> — "Anticipated Admission Average"
//   Western:   https://welcome.uwo.ca/next-steps/requirements/canadian-high-school/ — "Admission Average Range"
//   Queen's:   https://www.queensu.ca/admission/applying/competitive-average
//   York:      https://futurestudents.yorku.ca/program/<slug>
//   TMU:       https://www.torontomu.ca/admissions/

export const ADMISSION_AVERAGES: Record<string, string> = {

  // University of Waterloo
  // Engineering — all use holistic "Individual selection" review
  'WBM': 'Individual selection from the high 80s to low 90s',  // Biomedical Engineering
  'WC':  'Individual selection from the mid- to high 80s',     // Chemical Engineering
  'WD':  'Individual selection from the high 80s to low 90s',  // Systems Design Engineering
  'WE':  'Individual selection from the mid- to high 80s',     // Civil Engineering
  'WEE': 'Individual selection from the mid- to high 80s',     // Environmental Engineering
  'WEM': 'Individual selection from the mid- to high 80s',     // Management Engineering
  'WMT': 'Individual selection from the high 80s to low 90s',  // Mechatronics Engineering
  'WNT': 'Individual selection from the mid- to high 80s',     // Nanotechnology Engineering
  'WSO': 'Individual selection from the low to mid-90s',       // Software Engineering
  'WWF': 'Individual selection from the high 80s to low 90s',  // Electrical Engineering
  'WWH': 'Individual selection from the high 80s to low 90s',  // Mechanical Engineering
  'WWJ': 'Individual selection from the high 80s to low 90s',  // Computer Engineering
  // Architecture (Engineering faculty, separate school)
  'WR':  'Individual selection from the mid-80s',              // Architecture

  // Math faculty — also holistic
  'WBC': 'Individual selection from the low to mid-90s',       // CS/BBA Double Degree (Waterloo/Laurier)
  'WCF': 'Individual selection from the low to mid-90s',       // Computing and Financial Management
  'WCS': 'Individual selection from the low to mid-90s',       // Computer Science
  'WM':  'Individual selection from the mid-80s',              // Mathematics
  'WMF': 'Individual selection from the mid-80s',              // Mathematics / Financial Analysis & Risk Management
  'WN':  'Individual selection from the mid-80s',              // Mathematics / CPA
  'WXY': 'Mid-80s',                                           // Accounting and Financial Management (AFM)

  // School of Accounting and Finance (SAF)
  'WSF': 'Mid-80s',                                           // Sustainability and Financial Management

  // Environment faculty
  'WEV': 'Mid-80s',                                           // Geography and Aviation
  'WGM': 'High 70s',                                          // Geomatics
  'WP':  'Low 80s',                                           // Planning

  // Science faculty
  'WLS': 'Low 80s',                                           // Life Sciences
  'WPS': 'Low 80s',                                           // Physical Sciences
  'WS':  'Low 80s',                                           // Honours Science
  'WSB': 'Low 80s',                                           // Science and Business
  'WSE': 'Low 80s',                                           // Environmental Sciences
  'WSV': 'Mid-80s',                                           // Science and Aviation

  // Health faculty
  'WF':  'Mid-80s (regular) / High 80s (co-op)',              // Health Sciences
  'WK':  'Low 80s (regular) / Mid-80s (co-op)',               // Kinesiology
  'WHE': 'Low 80s (regular) / Mid-80s (co-op)',               // Public Health

  // Arts faculty
  'WA':  'Low 80s',                                           // Honours Arts
  'WAB': 'Low 80s',                                           // Honours Arts and Business
  'WGB': 'Low 80s',                                           // Global Business and Digital Arts

  // University of Toronto — Engineering
  // from the official "Characteristics of the First Year Class 2025" report
  // "Mean OSS Avg" = mean Ontario Secondary School average of the entering class
  'TB':  'Class of 2025 entering class mean: 94.6%',          // Chemical Engineering
  'TV':  'Class of 2025 entering class mean: 94.0%',          // Civil Engineering
  'TCS': 'Class of 2025 entering class mean: 96.3%',          // Computer Engineering
  'TE':  'Class of 2025 entering class mean: 96.3%',          // Electrical Engineering
  'TK':  'Class of 2025 entering class mean: 97.2%',          // Engineering Science
  'TI':  'Class of 2025 entering class mean: 95.7%',          // Industrial Engineering
  'TTM': 'Class of 2025 entering class mean: 94.1%',          // Materials Engineering
  'TM':  'Class of 2025 entering class mean: 96.0%',          // Mechanical Engineering
  'TEO': 'Class of 2025 entering class mean: 96.4% / Approx. grade requirement: low to mid-90s',  // TrackOne

  // University of Toronto — other faculties
  // from the UofT 2025–26 Undergraduate Admissions Bulletin
  'TAD': 'Approx. grade requirement: low 90s',                // Computer Science (Arts & Science)
  'TAC': 'Approx. grade requirement: mid to high 80s',        // Rotman Commerce

  // McMaster University — https://future.mcmaster.ca/programs/
  'MLS': 'Anticipated admission average: low 90s',            // Life Sciences Gateway
  'MEH': 'Minimum 90% for consideration',                     // Integrated Biomedical Engineering & Health Sciences (iBioMed)
  'MEI': 'Minimum 90% for consideration',                     // Integrated Biomedical Engineering & Health Sciences Co-op
  'MNS': 'Anticipated admission average: low 90s',            // Honours Health Sciences
  'MPS': 'Anticipated admission average: mid-80s',            // Chemical & Physical Sciences Gateway
  'MIS': 'Anticipated admission average: high 80s (minimum)', // Honours Integrated Science (iSci)
  'ME':  'Minimum 87% for consideration',                     // Engineering I
  'MEC': 'Minimum 87% for consideration',                     // Engineering Co-op I

  // Western University — https://welcome.uwo.ca/next-steps/requirements/canadian-high-school/
  'ECS': 'Admission average range: low to mid-80s',           // Computer Science
  'EE':  'Admission average range: high 80s to low 90s',      // Engineering
  'EW':  'Admission average range: high 80s to low 90s',      // Health Sciences
  'ENW': 'Admission average range: high 80s to low 90s',      // Nursing

  // Queen's University — https://www.queensu.ca/admission/applying/competitive-average
  'QC':  'Competitive average: 90+',                          // Smith Commerce
  'QD':  'Competitive average: mid-80s',                      // Computing
  'QA':  'Competitive average: low 80s',                      // Arts
  'QS':  'Competitive average: low 80s',                      // Science
  'QE':  'Competitive average: high 80s',                     // Smith Engineering (Common First Year)
  'QEC': 'Competitive average: high 80s',                     // Smith Engineering Direct Entry — Electrical & Computer
  'QEM': 'Competitive average: high 80s',                     // Smith Engineering Direct Entry — Mechatronics & Robotics

  // York University — https://futurestudents.yorku.ca/program/
  'YBA': 'Academic average should be in the low 90s',         // Business Administration (BBA) / Schulich iBBA

  // Toronto Metropolitan University — https://www.torontomu.ca/admissions/
  'SEU': 'Grade range: low 80s',                              // Undeclared Engineering

};

// looks up the officially published admission average for a given OUAC code
// returns null if nothing is on file for that program
export function getPublishedAverage(ouacCode: string | null | undefined): string | null {
  if (!ouacCode) return null;
  return ADMISSION_AVERAGES[ouacCode.toUpperCase()] ?? null;
}
