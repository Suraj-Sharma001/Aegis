# Aegis Frontend — Setup

A Next.js dashboard for your Aegis gateway: login/register, application +
API key management, and an analytics view with live charts (Recharts) plus
a built-in test console so you don't need Postman/PowerShell anymore.

## Design direction (for your report, if asked)

This isn't styled like a typical SaaS marketing page — it's meant to read
like a security/infrastructure console: dark navy background, a teal
"verified perimeter" accent (not the default AI-purple or terracotta),
monospace type for anything numeric (keys, costs, latencies) to signal
"this is a data readout, not decoration." The shield mark in the top-left
is built from a hexagonal grid rather than a generic padlock icon, and
pulses when showing a live/verified state.

## Setup

```bash
cd frontend
npm install
```

Set up your environment file:
```bash
cp .env.local.example .env.local
```
The default (`http://localhost:8080`) already matches your backend — no
changes needed unless you run the backend on a different port.

## Run

Make sure your backend, Postgres/Redis, and embedding service are already
running (same 3 things as before), then in a 4th terminal:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## What you'll see

1. **Register** — creates your organization + first admin user (same as
   the `/auth/register` API call you were doing manually)
2. **Dashboard** — list of applications, create new ones, issue gateway
   API keys (shown once, same as before — just in a UI now)
3. **Analytics page** (click "View analytics" on any app):
   - 4 stat cards: total requests, cache hit rate, total spend, money
     saved via caching
   - A donut chart showing cache hits vs. live calls
   - A bar chart showing requests by provider
   - A **test console** — paste in a gateway key, pick a model, type a
     prompt, hit send. You'll see the response, whether it was a cache
     hit, latency, cost, and — if governance blocks it — exactly what was
     flagged. This replaces manually running PowerShell commands.

## Notes

- Auth token is stored in `localStorage` — fine for a student project /
  local dev; a production version would use httpOnly cookies instead.
  Worth mentioning as a known simplification if asked.
- The test console calls your gateway directly using whatever API key you
  paste in — it's not tied to a specific application beyond needing a
  valid key, same as how the gateway itself works.
- If you see a blank page or console errors on first run, it's almost
  always one of the 3 backend services not running — check `docker ps`,
  check the embedding service terminal, check the backend terminal.
