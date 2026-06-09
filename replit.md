# TrackOne-Money

A full-stack financial management application (Fintech) for tracking expenses, income, EMIs, goals, and Udhari (debts/loans). Features an AI-driven assistant for financial insights, a history ledger, and offline-first capabilities using IndexedDB and PWA.

## Architecture

- **Frontend**: React + Vite (port 5000) — Tailwind CSS, Redux Toolkit, React Router, Recharts
- **Backend**: Node.js + Express (port 3001) — MongoDB Atlas via Mongoose, JWT auth
- **Database**: MongoDB Atlas (cloud-hosted)

## Workflows

- **Start application** — `cd frontend && npm run dev` (port 5000, webview)
- **Backend API** — `cd backend && npm start` (port 3001, console)

## Environment Variables

- `backend/.env` — `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_*`, `NODE_ENV`
- `frontend/.env` — `VITE_API_BASE_URL` (set to `http://localhost:3001/api/v1`)

## Key Features

- Expense & income tracking
- EMI (installment) tracker
- Goal setting & tracking
- Udhari (debt/loan) management
- AI financial assistant
- History ledger
- Offline-first with IndexedDB + PWA
- Profile photo & receipt uploads

## User Preferences

(none yet)
