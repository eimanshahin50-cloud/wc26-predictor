# WC26 Predictor — Amateur vs nxtmv

A private FIFA World Cup 2026 prediction duel. Next.js 14 (App Router) · TypeScript ·
Tailwind · Prisma · PostgreSQL · NextAuth · API-Football.

> **Read this honestly before you deploy:** this is a deployable scaffold, not a magic box.
> The scoring engine is unit-tested (`npm run test:scoring`). The full app has **not** been
> through a production `next build` on your machine yet — run it locally first.

---

## What works out of the box
- Two-player auth (Amateur, nxtmv) — credentials, server-validated, bcrypt-hashed.
- Provider-agnostic football layer. **Your API key lives in exactly one place:**
  `src/lib/football/api-football.ts` (read from `FOOTBALL_API_KEY`).
- Predictions: exact score, derived outcome, and goalscorers — **locked server-side at kickoff**.
- Tested scoring engine with every ambiguous rule exposed as a flag in `src/lib/scoring.ts`.
- Live leaderboard, fixtures list, match pages, dark/glass UI.
- Idempotent sync + scoring, driven by **Vercel Cron** every 10 minutes.

## The 3 things you must decide / watch
1. **Scoring rules** — open `src/lib/scoring.ts`. Defaults: exact = 5 (does *not* stack with
   the 3-pt outcome), 2 pts per correct goalscorer, **max 3 goalscorer picks** (anti-farming),
   own goals excluded. Change any of these in `SCORING_RULES`.
2. **API quota** — API-Football free tier = **100 requests/day**. A 10-min cron during a
   busy matchday can exceed that. Options: paid tier, widen the cron interval, or cache harder
   (`next: { revalidate }` in `api-football.ts`). This is the real constraint, not the code.
3. **League/season IDs** — `FOOTBALL_LEAGUE_ID` (World Cup) and `FOOTBALL_SEASON` (2026).
   Verify against your account's `/leagues` response; provider IDs drift.

---

## Local setup
```bash
npm install
cp .env.example .env        # then fill it in (see below)
npm run db:push             # create tables from the Prisma schema
npm run db:seed             # create the two users
npm run sync                # first fixture pull (tests your API key)
npm run dev                 # http://localhost:3000
```

### Environment variables (`.env`)
| var | what |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Postgres (Supabase/Neon/Vercel Postgres). Direct URL is for migrations. |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally, your domain in prod |
| `AMATEUR_PASSWORD` / `NXTMV_PASSWORD` | seeded login passwords |
| `FOOTBALL_API_KEY` | your API-Football key — **the only place it goes** |
| `FOOTBALL_LEAGUE_ID` / `FOOTBALL_SEASON` | `1` / `2026` (verify) |
| `CRON_SECRET` | `openssl rand -hex 16` |

Sign in at `/login` as `Amateur` or `nxtmv` with the passwords you seeded.

---

## Deploy to Vercel
1. Push this repo to GitHub and import it in Vercel.
2. Create a Postgres DB (Supabase free tier or Vercel Postgres). Copy both connection strings.
3. In Vercel → Project → Settings → Environment Variables, add **every** var from the table.
   Set `NEXTAUTH_URL` to your real domain.
4. Build command is `prisma generate && next build` (already in `package.json`).
5. First deploy will run the build. Then run schema push + seed against prod once:
   - locally with prod `DATABASE_URL`: `npm run db:push && npm run db:seed`, **or**
   - add them as a one-off via Vercel CLI.
6. The cron in `vercel.json` (`*/10 * * * *`) auto-calls `/api/cron/sync`. Vercel sends
   `Authorization: Bearer $CRON_SECRET` — the route rejects anything else.
7. Trigger the first sync manually if impatient: `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/sync`.

> Vercel Cron needs the Pro plan for sub-daily schedules. On Hobby, use an external
> pinger (cron-job.org) hitting `/api/cron/sync` with the Bearer header instead.

---

## How scoring runs (so "automatic" isn't a mystery)
There is no background worker. The cron calls `runFullSync()`, which:
1. upserts fixtures + live scores, 2. pulls goal events for live/finished matches,
3. scores **finished, not-yet-scored** matches once (guarded by `Fixture.pointsAwarded`),
4. writes points onto each `Prediction`. The leaderboard sums `scored` predictions live.

## Project structure
```
prisma/schema.prisma        DB schema (User, Team, Fixture, Goal, Prediction)
prisma/seed.ts              creates the two users
src/lib/scoring.ts          tested scoring engine + all rule flags
src/lib/football/           provider-agnostic layer (swap providers here only)
src/lib/auth.ts             NextAuth credentials config
src/app/api/cron/sync       the scheduled sync+score endpoint
src/app/api/predictions     create/update prediction (server-side lock)
src/app/page.tsx            leaderboard + fixtures
src/app/match/[id]          match page + prediction form
src/components/             UI (Leaderboard, FixtureCard, PredictionForm, Flag, ui/*)
scoring.test.mjs            run with `npm run test:scoring`
```

## Swapping the football provider
Implement the `FootballProvider` interface (`src/lib/football/types.ts`) in a new file and
export it as `provider`. Nothing else in the app touches raw provider JSON.
