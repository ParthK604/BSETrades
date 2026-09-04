# BSE Trade Dashboard

Real-time trade data dashboard that streams live trades from a mock BSE Exchange API using **Server Sent Events (SSE)** — no polling, no page refresh, no cron jobs.

---

## The Problem

The BSE pull takes up to **15 minutes** to complete. But the network kills any HTTP connection held open longer than **30 seconds**.

A standard GET request fails — the client would have to wait 15 minutes for a response that never comes (connection dies at 30s).

---

## The Solution — Server Sent Events (SSE)

Instead of the client waiting for a response, the client opens **one persistent SSE connection** to the backend. The backend pulls from BSE independently in the background and **pushes** each batch of trades to the frontend as they arrive.

```
[React Dashboard]
      |
      | EventSource — one persistent SSE connection
      |
[Express Backend] ←—— stores trades in memory as they arrive
      |
      | axios streaming GET /getTrades (background, independent of client)
      |
[Mock BSE API] ——— streams 3000 trade records with configurable delay
```

### Why SSE over WebSockets?
Data only flows **one way** — server to client. SSE is built for this exact use case. WebSockets are bidirectional and overkill here. SSE is simpler, natively supported by browsers via `EventSource`, and requires no extra libraries on the frontend.

### Why not polling?
The assignment explicitly rules it out — and rightly so. Polling every few seconds creates hundreds of unnecessary requests over a 15-minute pull. SSE uses a single connection for the entire duration.

### Why not a cron job?
Cron jobs run on a schedule, not on demand. The pull needs to be user-triggered and the dashboard needs to update instantly when data arrives — not on the next scheduled tick.

---

## Architecture

```
bse-trades/
├── mock-bse/                        # Fake BSE Exchange API (port 4000)
│   ├── index.js                     # GET /getTrades — streams batches with delay
│   └── seedData.js                  # Generates 3000 fake trade records
│
├── backend/                         # Main Express server (port 3000)
│   ├── index.js                     # App entry, CORS, routes
│   ├── routes/
│   │   ├── trades.js                # GET /api/trades/stream — SSE endpoint
│   │   └── pull.js                  # POST /api/pull — triggers BSE pull
│   └── services/
│       └── bsePuller.js             # Pulls from BSE, stores trades, broadcasts via SSE
│
├── frontend/                        # React dashboard (port 5173)
│   └── src/
│       ├── App.jsx
│       └── components/
│           └── TradesDashboard.jsx  # EventSource connection, live table
│
├── .gitignore
└── README.md
```

---

## How It Works — Step by Step

**1. Dashboard loads**
React connects to `GET /api/trades/stream` via `EventSource`. If trades were already pulled, they appear immediately. Connection stays open.

**2. User clicks "Start BSE Pull"**
React calls `POST /api/pull`. Backend triggers `pullFromBSE()` in the background and responds immediately — the HTTP request doesn't wait for the pull to finish.

**3. Pull runs in background**
`bsePuller.js` makes a streaming axios request to the mock BSE API. Trades arrive in batches of 50 with a configurable delay between each batch.

**4. Trades broadcast in real time**
Every batch that arrives from BSE is immediately broadcast to all connected SSE clients. The dashboard table updates live — no refresh, no polling.

**5. Pull completes**
A `{ pullComplete: true }` signal is sent via SSE. Dashboard status updates to "Pull Complete."

---

## Tech Stack

| Part | Technology |
|---|---|
| Mock BSE API | Node.js, Express |
| Backend | Node.js, Express, axios |
| Real-time | Server Sent Events (SSE) |
| Frontend | React, Vite |
| Styling | Inline styles, dark theme |

---

## Setup and Running

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd bse-trades
```

### 2. Install dependencies

```bash
# Mock BSE API
cd mock-bse
npm install

# Backend
cd ../backend
npm install

# Frontend
cd ../frontend/my-app
npm install
```

### 3. Run all three servers

Open **three separate terminals** —

**Terminal 1 — Mock BSE API**
```bash
cd mock-bse
node index.js
# Running on http://localhost:4000
```

**Terminal 2 — Backend**
```bash
cd backend
node index.js
# Running on http://localhost:3000
```

**Terminal 3 — Frontend**
```bash
cd frontend/my-app
npm run dev
# Running on http://localhost:5173
```

### 4. Open the dashboard

Go to `http://localhost:5173` in your browser.

Click **"Start BSE Pull"** and watch trades stream in live.

---

## Configurable Delay

The mock BSE API delay between batches is configurable via environment variable.

```bash
# Fast — for testing (500ms between batches)
DELAY_MS=500 node index.js

# Slow — simulates real 15 min pull
DELAY_MS=30000 node index.js
```

Default is 500ms for easy demonstration.

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/getTrades` | Mock BSE — returns seeded trades in batches |
| POST | `/api/pull` | Triggers background BSE pull |
| GET | `/api/trades/stream` | SSE endpoint — push trades to connected clients |

---

## Dashboard Features

- Live trade table with real-time updates
- Stats bar — total trades, unique symbols, total volume, pull status
- Connection status indicator
- Auto-scroll to latest trades
- Symbol colour coding
- Instant load — shows existing trades on connect even if pull is mid-way

---

Built by **Parth Kamath** — Third Year Computer Engineering, TSEC Mumbai
