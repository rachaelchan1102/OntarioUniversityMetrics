# Ontario University Metrics

A data-driven dashboard for exploring Ontario university admission averages, because anecdotal Reddit comments aren’t a reliable way to understand how competitive a program really is. Instead of scrolling through messy, multi-year spreadsheets or relying on one-off stories, the platform aggregates publicly shared admissions data into a structured, searchable, and visual tool.

**Live site:** [ontariouniversitymetrics.com](https://www.ontariouniversitymetrics.com/)

**Video Demo:** 

https://github.com/user-attachments/assets/cb1273b5-c0bc-4a9c-8ca3-1f60f9b127a4



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

Data is sourced from publicly shared Ontario university admissions spreadsheets. It is **self-reported** and represents a subset of admitted students. Results should be interpreted accordingly. Data is often skewed upwards.

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

