# Fovea

Weekly brain-map project manager. Tasks live on an idea map, each task belongs to a channel, and **This Week** is a brain map centered on the highest-priority work — the fovea.

## Run locally

```bash
cp .env.example .env
npm install
npm run install:all
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Local mode uses **SQLite** (`node:sqlite`) at `server/data/fovea.db`. Production uses **Postgres** when `DATABASE_URL` is set. Google OAuth is optional; if the client id/secret are empty, use **Continue locally**.

## Google login

1. Create an OAuth client in Google Cloud.
2. Authorized redirect URI: `http://localhost:3001/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` in `.env`.

## Production database

Leave `DATABASE_URL` unset for SQLite.

In production, set a Postgres URL:

```bash
DATABASE_URL=postgres://user:pass@host:5432/fovea
```

The same schema is applied on boot to whichever engine is configured.

## Screens

- **This week** — brain silhouette, radial mind map around the most important task
- **Map** — infinite idea map; double-click to add, promote ideas to tasks, set channel and priority
- **Channels** — create, rename, archive workstreams; filter the map from a channel
