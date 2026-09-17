# LiteLLM-Style UI Overhaul — Full File Map

11 files total: 2 backend, 9 frontend. Nothing in `docs/page.js` is
touched — it stays exactly as the reverted redirect-to-first-article
version from before.

## What you're getting

1. Public landing page (`/`) — mirrors litellm.ai/ai-gateway's real
   structure: sticky nav, bold hero, 3-column feature categorization
   (Providers / Controls / Operations), an App-to-Gateway-to-Providers
   diagram, a stats row, and a closing CTA. Every number and feature
   listed is real — no fabricated testimonials, GitHub stars, or
   competitor benchmarks like the actual LiteLLM page has.
2. Categorized sidebar — grouped like LiteLLM's (AI Gateway /
   Observability / Developer Tools). Deliberately has NO "Access
   Control" category — Aegis doesn't have real multi-user/team
   management yet, and a fake category with nothing behind it would be
   worse than not having one.
3. Playground (`/playground`) — your test console, promoted to its own
   page (previously buried inside one app's analytics tab) — matches
   LiteLLM's separate Playground concept.
4. Logs (`/logs`) — NEW backend endpoint + page: raw, per-request audit
   trail across all applications. This data already existed in your
   AuditLog table; there was just no UI to see individual rows before,
   only aggregates.
5. Docs — full treatment: a search box that filters the doc list, and
   collapsible sections (matches LiteLLM's nested tree, right-sized for
   our 7 real pages rather than fabricating extra depth), plus an
   auto-generated right-side "on this page" table of contents per article.

## Backend — 2 files

| File | Change |
|---|---|
| backend/src/controllers/application.controller.js | OVERWRITE — adds listAuditLogs |
| backend/src/routes/application.routes.js | OVERWRITE — adds GET /applications/:id/logs |

No database migration needed — this reads the existing AuditLog table.

## Frontend — 9 files

| File | Change |
|---|---|
| frontend/app/page.js | OVERWRITE — new public landing page |
| frontend/app/lib/api.js | OVERWRITE — adds listAuditLogs (keeps everything else) |
| frontend/app/components/Shell.js | OVERWRITE — categorized sidebar |
| frontend/app/components/icons.js | OVERWRITE — adds Playground/Logs/Search/Chevron icons |
| frontend/app/components/TestConsole.js | NEW — extracted test console |
| frontend/app/playground/page.js | NEW |
| frontend/app/logs/page.js | NEW |
| frontend/app/dashboard/[id]/page.js | OVERWRITE — test console removed (now a link to Playground), charts unchanged |
| frontend/app/docs/docsContent.js | OVERWRITE — adds DOC_HEADINGS + slugify for the TOC |
| frontend/app/docs/DocsNav.js | OVERWRITE — adds search + collapsible sections |
| frontend/app/docs/[slug]/page.js | OVERWRITE — adds right-side TOC column |

NOT touched: frontend/app/docs/page.js, frontend/app/home/page.js,
frontend/app/dashboard/page.js, frontend/app/keys/page.js,
frontend/app/usage/page.js — all stay exactly as they were.

## Test checklist

1. Restart backend and frontend.
2. Log out (or incognito) then visit "/" — new landing page, "Get
   Started" goes to /login.
3. Log in — sidebar now shows 3 grouped categories with Playground and
   Logs as new items.
4. Click Playground — same test console as before, now standalone.
5. Click Logs — table of recent requests across all your apps — should
   include entries from any testing you've already done.
6. Open any app's Analytics page — test console is gone, replaced by a
   "Try in Playground" button.
7. Click Docs — try the search box (type "cache", should filter to just
   Semantic Caching), click a section header to collapse/expand it, open
   an article and confirm the right-side "On this page" links jump to the
   correct heading.

## Known, deliberate gaps (say this if asked)

- No Teams/Organizations/multi-user management UI — the schema has a
  Role enum (Admin/Developer/Viewer) but no page manages it yet.
- No live model/provider management UI — models are defined in the
  pricing table and routed by name prefix, not configured through the UI.
- Docs search is a simple title filter, not full-text search across
  article content — a reasonable scope for 7 pages; would need a proper
  search index for a much larger docs set.
