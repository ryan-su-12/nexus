# Nexus

AI-powered portfolio intelligence platform that connects to your brokerage accounts and provides real-time insights, performance tracking, and AI-driven analysis of your investments.

## Features

- **Brokerage Sync** — Connect real brokerage accounts via SnapTrade to automatically import holdings
- **Portfolio Dashboard** — Track portfolio value, daily P&L, and performance vs S&P 500 benchmark
- **Sector Heatmap** — Visualize sector exposure with a treemap colored by daily performance
- **Waterfall Chart** — See per-holding contribution to today's portfolio movement
- **AI Daily Summary** — Auto-generated narrative explaining what moved your portfolio and why (powered by Claude)
- **AI Chat** — Ask Axon anything about your portfolio, risk, or market trends
- **MFA Support** — TOTP-based two-factor authentication via Supabase Auth

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python), Pydantic |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + MFA) |
| Charts | Recharts |
| Data Fetching | SWR |
| AI | Anthropic Claude (claude-sonnet-4) |
| Market Data | Finnhub API, Yahoo Finance (fallback) |
| Brokerage | SnapTrade |

## Project Structure

```
nexus/
├── frontend/              Next.js application
│   ├── src/
│   │   ├── app/           Pages (overview, chat, connect, auth flows)
│   │   ├── components/    Shared components (AppShell, PortfolioChart, HeatmapTreemapCard)
│   │   └── lib/           API client, auth context, Supabase client
│   └── public/            Static assets
│
├── backend/               FastAPI application ("Axon")
│   ├── main.py            App entry point, CORS, router registration
│   ├── config.py          Environment settings (pydantic-settings)
│   ├── database.py        Supabase client
│   ├── models.py          Pydantic models
│   └── routes/
│       ├── users.py       User CRUD
│       ├── portfolio.py   Holdings from database
│       ├── market.py      Market data, portfolio history, benchmarks
│       ├── analysis.py    AI summary + chat endpoints
│       └── brokerage.py   SnapTrade connect, accounts, holdings sync
│
└── infrastructure/        (planned)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/users` | Create user |
| GET | `/users/{id}` | Get user |
| GET | `/users/{id}/holdings` | Get holdings |
| GET | `/users/{id}/market` | Market data (prices + news) |
| GET | `/users/{id}/portfolio/history?days=N` | Portfolio value history |
| GET | `/benchmark/history?days=N` | S&P 500 benchmark history |
| GET | `/users/{id}/summary` | AI daily summary |
| POST | `/users/{id}/chat` | AI chat (body: `{ "message": "..." }`) |
| POST | `/users/{id}/brokerage/connect` | Generate SnapTrade connect URL |
| GET | `/users/{id}/brokerage/accounts` | List connected accounts |
| GET | `/users/{id}/brokerage/holdings` | Fetch & sync brokerage holdings |

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- A Supabase project
- API keys for Finnhub, Anthropic, and SnapTrade

### Backend

```bash
cd backend

# Install dependencies
pip install fastapi uvicorn supabase finnhub-python anthropic snaptrade-python-sdk pydantic-settings requests

# Create .env
cat > .env << EOF
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
FINNHUB_API_KEY=your_finnhub_key
ANTHROPIC_API_KEY=your_anthropic_key
SNAPTRADE_CLIENT_ID=your_snaptrade_client_id
SNAPTRADE_CONSUMER_KEY=your_snaptrade_consumer_key
EOF

# Run
uvicorn main:app --reload --port 8080
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8080
EOF

# Run
npm run dev
```

The app will be available at `http://localhost:3000`.

## Database

Nexus uses Supabase with the following tables:

| Table | Purpose |
|-------|---------|
| `users` | User records (id, email) |
| `holdings` | Portfolio holdings (user_id, symbol, quantity, currency, account_id) |
| `snaptrade_users` | SnapTrade credentials (user_id, user_secret) |

Authentication is handled by Supabase Auth (email/password with optional TOTP MFA).



<img width="1172" height="457" alt="image" src="https://github.com/user-attachments/assets/43c691f5-1e90-46fe-a39e-205269f9565d" />
