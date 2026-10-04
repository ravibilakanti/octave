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


## Authentication

Octave supports three account options:

- **Google** — configure `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
- **Apple** — configure `AUTH_APPLE_ID` and `AUTH_APPLE_SECRET`.
- **Personal email** — configure `EMAIL_SERVER` and `EMAIL_FROM` for passwordless one-time sign-in links.

Also set a strong random `AUTH_SECRET`. Octave does not receive or store Google/Apple passwords.

For a local-only installation, keep the app bound to your own machine and do not expose the authentication callback endpoints publicly without HTTPS and a production deployment configuration.

## Daily 9 PM job automation (Windows)

After configuring your profile and job providers:

```powershell
.scriptsinstall-windows-schedule.ps1 -ProjectPath "C:Usersaviboctave"
```

This creates a Windows Task Scheduler task named **Octave Daily Job Search** that runs every day at **9:00 PM**.

Test the same workflow manually first:

```powershell
npm run automation:daily
```

The run searches active saved searches (or a profile-based fallback query), stores only jobs belonging to the signed-in profile, analyzes new jobs, and auto-applies only when **Auto Apply** is enabled and the fit score meets the profile threshold. `MAX_AUTO_APPLICATIONS_PER_RUN` limits applications per run.

If automatic email submission is not available for a job, Octave creates a **ready packet** instead of pretending the application was submitted.

## Local authentication configuration

For Google and Apple, create OAuth applications with callback URLs for your local Octave origin and provider requirements. For email magic links, use an SMTP account that can send from the configured `EMAIL_FROM`.

Required authentication variables:

```text
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_APPLE_ID
AUTH_APPLE_SECRET
EMAIL_SERVER
EMAIL_FROM
```

Provider credentials may be left empty for providers you do not intend to enable, but at least one sign-in method should be configured.
