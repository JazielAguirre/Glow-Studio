# Glow Studio — Backend

Node.js + Express + PostgreSQL API for the Glow Studio platform.

## Requirements

- Node.js 18+
- PostgreSQL 13+

## Install

```bash
cd backend
npm install
```

## Configure

```bash
cp .env.example .env
# Edit .env with your local PostgreSQL credentials
```

## Database setup

See `../database/README.md` for full details. Briefly:

```bash
createdb glow_studio
psql -d glow_studio -f ../database/migrations/001_schema.sql
psql -d glow_studio -f ../database/migrations/002_triggers.sql
psql -d glow_studio -f ../database/migrations/003_seeds.sql
```

The server still starts even if the database is unreachable (a warning is logged) — useful while bootstrapping.

## Run

```bash
npm run dev      # nodemon, restarts on changes
npm start        # plain node
```

Server listens on `http://localhost:3000` by default. Override with `PORT` in `.env`.

## Endpoints

| Method | Path           | Response                                                   |
|--------|----------------|------------------------------------------------------------|
| GET    | `/api/health`  | `{ "ok": true, "message": "Glow Studio API running" }`     |

## Project structure

```
backend/
├── src/
│   ├── server.js               # entrypoint: dotenv + DB ping + app.listen()
│   ├── app.js                  # Express middleware + routes (exported)
│   ├── config/db.js            # pg.Pool + ping() helper
│   ├── routes/                 # route definitions
│   ├── controllers/            # request handlers
│   ├── middleware/             # 404 + error handler
│   ├── services/               # (reserved for business logic)
│   └── utils/                  # (reserved for shared helpers)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```
