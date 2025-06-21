# Trading Dashboard

This dashboard visualizes trading data stored in a Google Sheet. Data is fetched from a CSV export of the sheet and displayed with summary metrics, filters, tables, and charts.

## Setup

1. Ensure your Google Sheet is published to the web or accessible via a CSV link.
2. Copy the CSV URL and create an `.env` file in this directory containing:

```
VITE_SHEET_CSV_URL=<your csv url>
```

When deploying to Vercel, add this variable to the project **Environment Variables** settings so the dashboard can fetch your sheet data.


3. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

## Features

- Overview metrics: total trades, win rate, ROI, profit, trade duration
- Filterable trade table with search
- Drilldown modal with trade details
- Charts for ROI and profit
