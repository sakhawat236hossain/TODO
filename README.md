# ClientNest — Client Hunt CRM & Task Tracker

A personal CRM for tracking clients you hunt on Facebook/social media, meetings,
and daily todos (with a "Do Now / Do Later" planner).

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** MongoDB using the native `mongodb` driver (no Mongoose)

## Project structure

```
project/
├── app/            # Next.js pages (dashboard, clients, meetings, todos)
├── components/     # UI components, dialogs
├── lib/            # api.ts (REST client), types.ts, stats.ts, constants.ts
├── backend/        # Express + MongoDB API server
│   └── src/
│       ├── server.js
│       ├── db.js
│       └── routes/ (clients, meetings, todos, stats)
└── .env            # frontend env (NEXT_PUBLIC_API_URL)
```

## Setup

### 1. Backend (Express + MongoDB)

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```
MONGODB_URI=your-mongodb-connection-string
DB_NAME=clientnest
PORT=5000
```

Use a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster, or a
local `mongodb://localhost:27017` if you have MongoDB installed.

```bash
npm install
npm run dev
```

The API will run at `http://localhost:5000`. Check `http://localhost:5000/health`
to confirm it's connected.

### 2. Frontend (Next.js)

In the project root:

```bash
npm install
npm run dev
```

`.env` already points to `NEXT_PUBLIC_API_URL=http://localhost:5000` — change
this only if you run the backend on a different port/host (e.g. after deploying).

Open `http://localhost:3000`.

## Notes

- No authentication/login — this is a single-user internal tool.
- Deleting a client also deletes its linked meetings and todos (cascade delete).
- The "Do Now / Do Later" toggle on todos powers the "Today's Plan" section on
  the dashboard — mark what you're focused on right now vs queued for later.
- WhatsApp number is separate from phone; client cards show one-tap Call and
  WhatsApp buttons when set.

## Deploying

- Backend: any Node host (Render, Railway, Fly.io) — set `MONGODB_URI` and `DB_NAME`.
- Frontend: Vercel/Netlify — set `NEXT_PUBLIC_API_URL` to your deployed backend URL.
