# ChemE Process Simulation Suite (CPSS)

CPSS is a production-ready, enterprise-style 8-in-1 Chemical Engineering SaaS simulation platform with:

- **Backend:** Node.js + Express + MySQL (`mysql2/promise`)
- **Auth:** JWT + bcrypt
- **Frontend:** React (Vite) + Tailwind + lucide-react
- **Design:** Scientific glassmorphism dark interface
- **Modules:** Plume, Heat Exchanger, Pipe Flow, CSTR, Flash, Ergun, Fenske, PID
- **Resilience:** Automatic local math fallback when backend is unreachable

## Project Structure

```text
cpss1-project/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 1) Prerequisites

- Node.js 18+
- MySQL 8+

## 2) Database Setup

Create the DB once in MySQL (name can be changed through env):

```sql
CREATE DATABASE cpss1;
```

`backend/server.js` auto-creates:

- `users` table
- `simulations` table with JSON columns

## 3) Backend Setup

```bash
cd backend
npm install
```

Create `.env` in `backend/`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cpss1
JWT_SECRET=replace_with_long_random_secret
```

Run backend:

```bash
npm run dev
```

## 4) Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Vite default URL is usually `http://localhost:5173`.

The frontend expects backend at:

- `http://localhost:5000`

If needed, update `API_BASE` in `frontend/src/App.jsx`.

## 5) API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Protected Simulation Routes

- `POST /api/plume`
- `POST /api/heatexchanger`
- `POST /api/pipeflow`
- `POST /api/cstr`
- `POST /api/flash`
- `POST /api/ergun`
- `POST /api/fenske`
- `POST /api/pid`

### User History

- `GET /api/history` (returns last 20 simulations for logged-in user)

## 6) Local Fallback Mode

Every frontend `fetch` call is wrapped with `try/catch`.

If backend calls fail:

- Calculations run locally in JavaScript using the same formulas.
- Results are still shown to the user.
- Badge appears: **Local Fallback Mode: Backend Unreachable. Results not saved.**

## 7) Production Notes

- Move secrets to secure secret manager or deployment env vars.
- Put backend behind HTTPS reverse proxy (Nginx/Cloud LB).
- Restrict CORS origins in `backend/server.js`.
- Add rate limiting and request validation for public deployments.
- Add CI/CD checks and integration tests before release.
