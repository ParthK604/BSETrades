# TradeStream — Real-Time BSE Trade Analytics Platform

A real-time trade data dashboard that streams live trades from a mock BSE Exchange API using **Server Sent Events (SSE)**, with **Redis caching** and full **Docker** containerization.

No polling. No page refresh. No cron jobs.

---

## The Problem

The BSE pull takes up to **15 minutes** to complete. The network kills any HTTP connection held open longer than **30 seconds**.

A standard GET request fails — the client waits 15 minutes for a response that never arrives (connection dies at 30s).

---

## The Solution

Three architectural decisions solve this cleanly —

**1. Server Sent Events (SSE)**
Client opens one persistent connection to the backend. Backend pulls from BSE independently in the background and pushes each batch of trades to the frontend as they arrive. No timeout. No polling.

**2. Redis Caching**
When a pull completes, all 3000 trades are cached in Redis with a 1 hour TTL. Any new client connecting after the pull gets data instantly from Redis — no re-pull needed.

**3. Docker Compose**
All backend services — mock BSE API, Express backend, Redis — run with a single command. No manual setup.

---

## Architecture

```
[React Dashboard]
      |
      | EventSource — one persistent SSE connection
      |
[Express Backend] ←—— Redis cache (1hr TTL)
      |
      | axios streaming GET /getTrades (background)
      |
[Mock BSE API] ——— streams 3000 trades in batches
```

### Why SSE over WebSockets?
Data flows one way — server to client. SSE is purpose built for this. WebSockets are bidirectional and overkill here. EventSource is natively supported by all browsers with no extra libraries.

### Why not polling?
Polling every few seconds creates hundreds of unnecessary requests over a 15-minute pull. SSE uses one connection for the entire duration.

### Why Redis?
Without caching, every new client connecting after a pull would either see no data or trigger a full 15-minute re-pull. Redis serves previously pulled trades instantly to late-joining clients.

### Why Docker Compose?
Three services need to talk to each other — Redis, mock BSE API, and the backend. Docker Compose wires them together with correct networking and startup order automatically.

---

## Data Flow

```
DURING PULL
User hits "Start BSE Pull"
        ↓
POST /api/pull → pull runs in background, returns immediately
        ↓
mock BSE streams 3000 trades in batches of 50
        ↓
Each batch broadcast via SSE to all connected clients
        ↓
Dashboard table updates live
        ↓
Pull complete → all trades saved to Redis (1hr TTL)

NEW CLIENT AFTER PULL
Client connects to SSE stream
        ↓
Backend checks Redis
        ↓
Cache HIT → sends all trades instantly
Cache MISS → sends empty, waits for next pull
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Real-time | Server Sent Events (SSE) |
| Backend | Node.js, Express |
| Caching | Redis |
| Mock API | Node.js, Express |
| Containerization | Docker, Docker Compose |

---

## Project Structure

```
BSETrades/
├── mock-BSE/
│   ├── index.js           # GET /getTrades — streams batches with delay
│   ├── seedData.js        # Generates 3000 fake trade records
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── index.js           # Express app entry, CORS
│   ├── routes/
│   │   ├── trades.js      # GET /api/trades/stream — SSE endpoint
│   │   └── pull.js        # POST /api/pull — triggers BSE pull
│   ├── services/
│   │   └── bsePuller.js   # Pull logic, Redis cache, SSE broadcast
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           └── TradesDashboard.jsx
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Setup and Running

### Prerequisites
- Node.js v18+
- Docker and Docker Compose

### Option 1 — Docker (Recommended)

```bash
git clone <your-repo-url>
cd BSETrades

docker-compose up --build
```

This starts Redis, mock BSE API, and backend together. Then run frontend separately —

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

### Option 2 — Run Locally Without Docker

**Terminal 1 — Redis**
```bash
# Make sure Redis is installed and running
redis-server
```

**Terminal 2 — Mock BSE API**
```bash
cd mock-BSE
npm install
node index.js
# Running on http://localhost:4000
```

**Terminal 3 — Backend**
```bash
cd backend
npm install
node index.js
# Running on http://localhost:3000
```

**Terminal 4 — Frontend**
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/getTrades` | Mock BSE — streams seeded trades in batches |
| POST | `/api/pull` | Triggers background BSE pull |
| GET | `/api/trades/stream` | SSE endpoint — pushes trades to connected clients |

---

## Configurable Delay

Control pull speed via environment variable —

```bash
# Fast — for testing (default)
DELAY_MS=500 node index.js

# Slow — simulates real 15 min BSE pull
DELAY_MS=30000 node index.js
```

---

## Dashboard Features

- Live trade table — updates without any page refresh
- Stats bar — total trades, unique symbols, total volume, pull status
- Connection status indicator — shows SSE connection state
- Redis cache indicator — shows when data is served from cache
- Auto-scroll to latest trades
- Symbol colour coding per stock

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Real-time protocol | SSE over WebSockets | One-way data flow, simpler, native browser support |
| Caching | Redis | Instant data for late-joining clients, configurable TTL |
| Pull trigger | Manual POST | User controlled, pull independent of client connection |
| Containerization | Docker Compose | Single command startup, correct service networking |
| Data storage | In-memory + Redis | No DB needed — trades are session data |

---

Built by **Parth Kamath** — Third Year Computer Engineering, TSEC Mumbai