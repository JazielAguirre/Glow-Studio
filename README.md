# Glow Studio

Academic web project for a boutique fitness studio. Allows users to register, acquire class packages, reserve classes, manage reservations, and contact the studio. Includes a full admin dashboard with class and package catalogue management, and a demo password reset flow.

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
psql -d glow_studio -f migrations/001_schema.sql              # tables and constraints
psql -d glow_studio -f migrations/002_triggers.sql             # business rule triggers
psql -d glow_studio -f migrations/003_seeds.sql                # class types and package catalog
psql -d glow_studio -f migrations/004_clases_seed.sql          # sample class schedule
psql -d glow_studio -f migrations/006_contactos.sql            # contact form table + grants
psql -d glow_studio -f migrations/007_roles.sql                # normalize tipo_usuario to usuario/admin
psql -d glow_studio -f migrations/008_clases_demo_future_seed.sql  # refresh demo class schedule
psql -d glow_studio -f migrations/010_password_reset_tokens.sql    # password reset token table
```

If your database requires credentials:

```bash
PGPASSWORD=yourpassword psql -h localhost -p 5432 -U youruser -d glow_studio -f migrations/001_schema.sql
# repeat for 002, 003, 004, 006, 007, 008, 010
```

> **Note:** Migrations 006, 007, and 010 use DDL (`CREATE TABLE`, `ALTER TABLE`) and must be run as a superuser (e.g. `postgres`). Migration 006 also grants INSERT/SELECT/UPDATE to `glow_user` automatically if that role exists.

### 4b. Promote a user to admin (optional)

After registering through the app, promote a user to admin via SQL:

```sql
UPDATE usuarios SET tipo_usuario = 'admin' WHERE email = 'your@email.com';
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
| Disciplines | http://127.0.0.1:8765/html/disciplinas.html |
| Contact | http://127.0.0.1:8765/html/contacto.html |
| Login | http://127.0.0.1:8765/html/login.html |
| Register | http://127.0.0.1:8765/html/registro.html |
| Forgot password | http://127.0.0.1:8765/html/forgot-password.html |
| Reset password | http://127.0.0.1:8765/html/reset-password.html?token=... |
| My Reservations | http://127.0.0.1:8765/html/mis-reservas.html |
| Admin Panel | http://127.0.0.1:8765/html/admin.html *(admin role required)* |

---

## Demo flow

### User flow
1. **Register** at `/html/registro.html`
2. **Log in** at `/html/login.html`
3. **Acquire a package** at `/html/paquetes.html` — click "Adquirir paquete"
4. **Reserve a class** at `/html/clases.html` — click "Reservar"
5. **View and cancel reservations** at `/html/mis-reservas.html`
6. **Send a contact message** at `/html/contacto.html`

> **First-time testing without purchasing:** apply the optional dev seed after registering:
> ```bash
> psql -d glow_studio -f database/migrations/005_dev_test_paquete.sql
> ```
> This gives the first registered user a 5-class demo package. Do not use in production.

### Password reset flow (demo)
1. **Go to** `/html/forgot-password.html` (or use the link on the login page)
2. **Enter your email** — always returns a generic message (no email existence leak)
3. If the email exists, the API response includes a `demo_reset_url` (local dev only — no real email is sent)
4. **Open the demo reset URL** — enter and confirm your new password
5. **Log in** with the new password — old password is invalidated immediately
6. Reset tokens expire in 30 minutes and are single-use

### Admin flow
1. **Promote a user to admin** (one-time DB command — see step 4b above)
2. **Log in** as admin at `/html/login.html`
3. The nav shows an **"Admin"** link after login
4. **Open** `/html/admin.html` — the dashboard loads automatically
5. Review **metrics**: total users, active packages, estimated revenue, reservations, contact messages
6. **Gestión de clases**: create, edit, disable, and reactivate scheduled classes
7. **Gestión de paquetes**: create, edit, disable, and reactivate package catalogue entries
8. Browse **report tables**: users, acquired packages, reservations, class occupancy, contacts
9. **Filter tables** using the search bar and status dropdowns
10. **Mark contacts as reviewed** with the inline button (updates status without reload)

---

## API endpoints

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Request password reset (demo token in response) |
| POST | `/api/auth/reset-password` | Reset password with valid token |
| GET | `/api/clases` | Upcoming active classes with capacity |
| GET | `/api/paquetes` | Active package catalog |
| POST | `/api/contacto` | Submit contact form message |

### Authenticated (JWT required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/me` | Current user info + role |
| POST | `/api/paquetes/:id/comprar` | Acquire a package |
| GET | `/api/usuario-paquetes` | User's active packages |
| GET | `/api/reservas` | User's reservations |
| POST | `/api/reservas` | Create reservation |
| PATCH | `/api/reservas/:id/cancelar` | Cancel reservation |

### Admin only (JWT + `tipo_usuario: admin`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Aggregated studio metrics |
| GET | `/api/admin/usuarios` | All registered users |
| GET | `/api/admin/paquetes` | All acquired packages (purchase history) |
| GET | `/api/admin/reservas` | All reservations |
| GET | `/api/admin/clases-ocupacion` | Class occupancy rates |
| GET | `/api/admin/contactos` | Contact form messages |
| PATCH | `/api/admin/contactos/:id/revisar` | Mark contact as reviewed |
| GET | `/api/admin/tipos-clase` | Class discipline types |
| GET | `/api/admin/clases` | All classes (active + inactive) |
| POST | `/api/admin/clases` | Create a class |
| PATCH | `/api/admin/clases/:id` | Update a class |
| PATCH | `/api/admin/clases/:id/deshabilitar` | Disable a class |
| PATCH | `/api/admin/clases/:id/reactivar` | Reactivate a class |
| GET | `/api/admin/paquetes-catalogo` | Full package catalogue (active + inactive) with sales data |
| POST | `/api/admin/paquetes-catalogo` | Create a catalogue package |
| PATCH | `/api/admin/paquetes-catalogo/:id` | Update a catalogue package |
| PATCH | `/api/admin/paquetes-catalogo/:id/deshabilitar` | Disable a catalogue package |
| PATCH | `/api/admin/paquetes-catalogo/:id/reactivar` | Reactivate a catalogue package |

---

## Known limitations

- No real payment flow — package acquisition is demo-only.
- A cancelled reservation cannot be re-booked for the same class (schema constraint).
- Password reset sends no real email — the reset link is returned directly in the API response (demo/local only).
- No pagination in admin report tables.
- User role promotion (`usuario` → `admin`) requires a direct database UPDATE; there is no UI for it.
- Contact form messages are stored in the database but no email is sent.
