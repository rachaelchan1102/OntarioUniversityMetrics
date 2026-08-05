# Ontario University Metrics

A data-driven dashboard for exploring Ontario university admission averages, because anecdotal Reddit comments aren’t a reliable way to understand how competitive a program really is. Instead of scrolling through messy, multi-year spreadsheets or relying on one-off stories, the platform aggregates publicly shared admissions data into a structured, searchable, and visual tool.

**Live site:** [ontariouniversitymetrics.com](https://www.ontariouniversitymetrics.com/)

**Video Demo:** 

https://github.com/user-attachments/assets/cb1273b5-c0bc-4a9c-8ca3-1f60f9b127a4

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
- PostgreSQL database (or [Neon](https://neon.tech/) serverless Postgres)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file with your PostgreSQL connection string:

```bash
POSTGRES_URL=your_postgres_connection_string_here
```

### Database Setup

Import the CSV data into your database:

```bash
npx ts-node scripts/import-csv-postgres.ts
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
- [Neon Postgres](https://neon.tech/) — Serverless PostgreSQL database
- [Vercel](https://vercel.com/) — Deployment

---

## Feedback

If you have suggestions or find issues, feel free to open an issue or reach out. Note that a Claude agent is now in charge of updating the data.

