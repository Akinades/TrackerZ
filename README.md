# TrackerZ

A web app for tracking investment portfolios — log buy/sell trades, update current prices, and see allocation and P/L at a glance.

**Live:** https://trackerz.site/

> *"If you can't measure it, you can't improve it."*

---

## What it does

TrackerZ helps you keep a clean trade log and understand how your portfolio is doing without spreadsheet gymnastics. Record transactions (price, quantity, fees), and the app handles average cost, realized/unrealized P/L, and charts — stocks, crypto, forex, gold, and more in one place.

Works on desktop and mobile. Data is stored in MongoDB via a separate backend API, so your portfolio follows you across devices.

## Features

- **Transactions** — add, edit, delete trades; filter by date range; bulk import
- **Average cost** — per-asset cost basis with fees included
- **Dashboard** — portfolio value, ROI, allocation pie chart, P/L bar chart
- **Asset timeline** — value over time
- **i18n** — Thai and English

## Prerequisites

- Node.js 20+
- Backend API running (default: `http://localhost:4000`) — this repo is the Next.js frontend

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Environment variables

Optional — defaults work for local dev with the backend on port 4000.

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` | Backend API URL |
| `APP_BASE_URL` / `NEXT_PUBLIC_APP_BASE_URL` | App URL (cookie settings) |
| `AUTH_COOKIE_MAX_AGE_DAYS` | Session cookie lifetime in days |
| `NEXT_PUBLIC_FEEDBACK_EMAIL` | Contact email for feedback |

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing |
| `/register`, `/login` | Auth |
| `/dashboard` | Portfolio overview |
| `/transactions` | Trade log |
| `/assets` | Asset charts |
| `/account`, `/settings` | Profile and preferences |
| `/support` | Support page |

## Scripts

```bash
npm run dev                 # development server
npm run build               # production build
npm run start               # production server
npm run lint                # ESLint
npm run fetch:stock-icons     # fetch stock icons
npm run fetch:stock-logos     # fetch stock logos
```

## Docker

```bash
docker build -t trackerz .
docker run -p 3000:3000 trackerz
```

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Redux Toolkit · ECharts / Recharts · Docker

## License

Private — © 2026 TrackerZ
