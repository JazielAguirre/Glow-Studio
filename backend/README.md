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
<<<<<<< ours
# Edit .env with your local PostgreSQL credentials
=======
# Edit .env with your local PostgreSQL credentials and JWT secret
>>>>>>> theirs
```

## Database setup

<<<<<<< ours
See `../database/README.md` for full details. Briefly:
=======
See `../database/README.md` for migration steps. Briefly:
>>>>>>> theirs

```bash
createdb glow_studio
psql -d glow_studio -f ../database/migrations/001_schema.sql
psql -d glow_studio -f ../database/migrations/002_triggers.sql
psql -d glow_studio -f ../database/migrations/003_seeds.sql
```

<<<<<<< ours
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
=======
## Run

```bash
npm run dev      # nodemon (auto-restart on changes)
npm start        # plain node
```

Server listens on `http://localhost:3000` by default (change `PORT` in `.env`).

## Endpoints

| Method | Path                  | Auth required | Description           |
|--------|-----------------------|---------------|-----------------------|
| GET    | `/api/health`         | No            | Liveness check        |
| POST   | `/api/auth/register`  | No            | Create account        |
| POST   | `/api/auth/login`     | No            | Get JWT token         |
| GET    | `/api/auth/me`        | Bearer token  | Get current user      |
>>>>>>> theirs

## Project structure

```
backend/
├── src/
│   ├── server.js               # entrypoint: dotenv + DB ping + app.listen()
<<<<<<< ours
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
=======
│   ├── app.js                  # Express middleware + routes
│   ├── config/db.js            # pg.Pool + ping() helper
│   ├── routes/                 # route definitions
│   ├── controllers/            # request handlers
│   ├── middleware/             # auth guard + error handler
│   ├── services/               # business logic (auth, future features)
│   └── utils/                  # shared helpers
├── package.json
├── .env.example
>>>>>>> theirs
└── README.md
```
