# Glow Studio

Academic web project for a boutique fitness studio. Allows users to register, acquire class packages, reserve classes, and manage reservations.

**Stack:** Node.js · Express · PostgreSQL · Vanilla JS · HTML/CSS

---

## Requirements

- Node.js 18 or higher
- PostgreSQL (standard port 5432; see note below if yours runs on a different port)

---

## Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set your values:

```
PORT=3010
DB_HOST=localhost
DB_PORT=5432        # change to 5433 (or your port) if needed
DB_NAME=glow_studio
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
```

> If your PostgreSQL runs on a non-standard port (e.g. 5433), set `DB_PORT=5433` in `backend/.env`.

### 3. Create the database

```bash
createdb glow_studio
```

### 4. Apply migrations in order

```bash
cd database
psql -d glow_studio -f migrations/001_schema.sql
psql -d glow_studio -f migrations/002_triggers.sql
psql -d glow_studio -f migrations/003_seeds.sql
psql -d glow_studio -f migrations/004_clases_seed.sql
```

If your database requires credentials:

```bash
PGPASSWORD=yourpassword psql -h localhost -p 5432 -U youruser -d glow_studio -f migrations/001_schema.sql
# repeat for 002, 003, 004
```

### 5. Start the backend

```bash
cd backend
npm run dev       # development (auto-restart on changes)
# or
npm start         # production
```

Expected output:
```
[db] Connection OK
[server] Glow Studio API listening on http://localhost:3010
```

### 6. Start the frontend

From the project root:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

---

## App URLs

| Page | URL |
|---|---|
| Home | http://127.0.0.1:8765/html/index.html |
| Classes | http://127.0.0.1:8765/html/clases.html |
| Packages | http://127.0.0.1:8765/html/paquetes.html |
| Login | http://127.0.0.1:8765/html/login.html |
| Register | http://127.0.0.1:8765/html/registro.html |
| My Reservations | http://127.0.0.1:8765/html/mis-reservas.html |

---

## Demo flow

1. **Register** at `/html/registro.html`
2. **Log in** at `/html/login.html`
3. **Acquire a package** at `/html/paquetes.html` — click "Adquirir paquete"
4. **Reserve a class** at `/html/clases.html` — click "Reservar"
5. **View and cancel reservations** at `/html/mis-reservas.html`

> **First-time testing without purchasing:** apply the optional dev seed after registering:
> ```bash
> psql -d glow_studio -f database/migrations/005_dev_test_paquete.sql
> ```
> This gives the first registered user a 5-class demo package. Do not use in production.

---

## API endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Current user info |
| GET | `/api/clases` | No | Upcoming classes with capacity |
| GET | `/api/paquetes` | No | Package catalog |
| POST | `/api/paquetes/:id/comprar` | Yes | Acquire a package |
| GET | `/api/usuario-paquetes` | Yes | User's active packages |
| GET | `/api/reservas` | Yes | User's reservations |
| POST | `/api/reservas` | Yes | Create reservation |
| PATCH | `/api/reservas/:id/cancelar` | Yes | Cancel reservation |

---

## Known limitations

- No real payment flow — package acquisition is demo-only.
- A cancelled reservation cannot be re-booked for the same class (schema constraint).
- No password reset flow.
- No admin panel.
