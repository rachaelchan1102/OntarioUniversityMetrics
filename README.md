# Ontario University Metrics

A data-driven dashboard for exploring Ontario university admission averages, built because anecdotal Reddit comments aren't a reliable way to understand how competitive a program actually is.

Instead of scrolling through self-reported spreadsheets or guessing from one-off stories, this site aggregates multiple years of publicly shared admission data into a searchable, visual tool.

**Live site:** [ontariouniversitymetrics.com](https://www.ontariouniversitymetrics.com/)

---

## Features

- Search any Ontario university program
- View admitted grade averages and medians
- Explore full grade distributions via histograms
- Compare competitiveness across admission rounds
- Filter by year
- Compare self-reported averages against university-published figures

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

