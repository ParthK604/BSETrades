# BSETrades

bse-trades/
├── mock-bse/
│   ├── index.js          # Mock BSE API, GET /getTrades
│   └── seedData.js       # Generate fake trade records
│
├── backend/
│   ├── index.js          # Express server
│   ├── routes/
│   │   ├── trades.js     # /api/trades/stream SSE endpoint
│   │   └── pull.js       # /api/pull trigger endpoint
│   └── services/
│       └── bsePuller.js  # pulls from mock BSE, broadcasts
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       └── TradesDashboard.jsx
│   └── package.json
│
├── README.md
└── architecture.md