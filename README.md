# Ontario University Metrics

A data-driven dashboard for exploring Ontario university admission averages, because anecdotal Reddit comments aren't a reliable way to understand how competitive a program actually is. Instead of scrolling through self-reported spreadsheets or guessing from one-off stories, this site aggregates multiple years of publicly shared admission data into a searchable, visual tool that is (probably) more accurate.

**Live site:** [ontariouniversitymetrics.com](https://www.ontariouniversitymetrics.com/)

**Stats:**  
<img width="719" height="415" alt="Screenshot 2026-02-26 at 1 20 55 AM" src="https://github.com/user-attachments/assets/8deecf1b-0c43-4324-93d5-9cfcc93746b9" />


---

## Features

- Search any Ontario university program
- View admitted grade averages and medians
- Explore full grade distributions via histograms
- Compare competitiveness across admission rounds
- Filter by year
- Compare self-reported averages against university-published figures
- Track grade inflation

---

## Data

Data is sourced from publicly shared Ontario university admissions spreadsheets. It is **self-reported** and represents a subset of admitted students. Results should be interpreted accordingly.

---

## Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Installation

```bash
npm install
```

> **Note:** `better-sqlite3` is a native module and must be compiled against the Node.js version you're running. If you see a `NODE_MODULE_VERSION` mismatch error, run:
> ```bash
> npm rebuild better-sqlite3
> ```

### Database Setup

The app uses a local SQLite database. CSV data is included in the repo. Build the database with:

```bash
npm run db:rebuild
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

- [Next.js](https://nextjs.org/) — React framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Recharts](https://recharts.org/) — Data visualization
- [SQLite](https://www.sqlite.org/) (`better-sqlite3`) — Local database

---

## Feedback

If you have suggestions or find issues, feel free to open an issue or reach out.

