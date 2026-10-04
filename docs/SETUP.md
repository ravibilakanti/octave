# Setup

## Prerequisites

- Node.js 20 or newer (`node -v`)
- npm (comes with Node)
- Git (only needed to version the repo)
- Optional: an OpenAI-compatible API key
- Optional: Adzuna / RapidAPI JSearch keys for broader search
- Optional: SMTP credentials for email applications

Windows: download Node LTS from https://nodejs.org and Git from https://git-scm.com. Close and reopen Cursor’s terminal after install so `node` and `git` appear on PATH.

## First run

From the project root (`C:\Users\ravib\octave`):

```powershell
copy .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

The SQLite file is created at `prisma/dev.db`. It is gitignored.

## Environment variables

All keys are in `.env`. Restart `npm run dev` after edits.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection. Default `file:./dev.db` (relative to `prisma/`) |
| `AI_BASE_URL` | Chat completions host |
| `AI_API_KEY` | Secret for that host |
| `AI_MODEL` | Model id |
| `MIN_FIT_SCORE` | Env default; the Profile page value wins at apply time |
| `AUTO_APPLY_ENABLED` | Unused by the UI path — use the Profile checkbox |
| `APPLY_FROM_EMAIL` | From address for SMTP |
| `SMTP_*` | Nodemailer SMTP |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` / `ADZUNA_COUNTRY` | Adzuna jobs |
| `JSEARCH_API_KEY` | RapidAPI JSearch |
| `REMOTIVE_ENABLED` | `true`/`false` |
| `GREENHOUSE_BOARDS` | Comma-separated board tokens (`stripe`, `airbnb`, …) |

Get Adzuna keys at https://developer.adzuna.com/. JSearch is listed on RapidAPI.

## Switch to PostgreSQL later

1. Create a database.
2. In `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`.
3. Set `DATABASE_URL="postgresql://USER:PASS@HOST:5432/octave"`.
4. Run `npx prisma db push` (or `npx prisma migrate dev --name postgres`).

No application code other than the Prisma datasource needs to change.

## Production build

```powershell
npx prisma generate
npm run build
npm start
```

Keep this app private. It stores your resume, email, and phone in the local database.

## Reset local data

```powershell
Remove-Item prisma/dev.db -ErrorAction SilentlyContinue
npx prisma db push
npm run db:seed
```
