# Octave

Personal AI job assistant: **search → fitment → ATS resume → apply packet → tracker**.

Octave is a local app that works like a retained headhunter who reports only to you. It scores each posting against your stored dossier. Roles at **8/10 or higher** can be auto-queued. Everything else stays in review.

This repository is yours. It is designed to run on a laptop with open-source defaults (Next.js, Prisma, SQLite, Tailwind) and an optional OpenAI-compatible model.

## What it does

1. Stores a detailed profile (identity, experience, skills, education, resume paste, targets).
2. Searches public job APIs (Remotive by default; Adzuna, JSearch, Greenhouse boards when keyed).
3. Lets you paste any posting (LinkedIn, Workday, company career page).
4. Scores fit 0–10 with a breakdown (skills, experience, domain, seniority, logistics).
5. Rewrites a **single-column ATS-friendly resume** and a cover letter from facts you actually have — it will not invent employers or skills.
6. Prepares an application packet. If the job lists an email and you configured SMTP, it can send. Otherwise you paste the packet on the employer site.
7. Tracks status on a dashboard: queued → ready → applied → interview → offer / rejected.

## What it will not do

It will not log into LinkedIn, Greenhouse, Lever, or Workday as you, and it will not drive a headless browser against those sites. That usually violates their terms and is brittle. Octave’s job is the **intelligence and the paperwork**; you (or a future adapter you add) submit on the official form.

## Stack

| Layer | Choice | Why |
|---|---|---|
| UI | Next.js 15 App Router, React 19, TypeScript | Widely used, one repo for UI + API |
| Styling | Tailwind CSS 4 | Fast to restyle later |
| Data | Prisma + SQLite | Zero-ops local start; switch URL to Postgres when you want |
| AI | OpenAI-compatible `/v1/chat/completions` | Works with OpenAI, Groq, Together, Azure, Ollama |
| Jobs | Remotive, Adzuna, JSearch, Greenhouse Job Board API | Public APIs, pluggable |
| Email apply | Nodemailer / SMTP | Optional |

## Quick start

You need **Node.js 20+** and **Git**. On Windows, install them from [nodejs.org](https://nodejs.org/) and [git-scm.com](https://git-scm.com/), then reopen the terminal.

```bash
cd octave
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Fill **Profile** and save. Turn auto-apply on only after you have reviewed the dossier.
2. On **Jobs**, search or paste a description.
3. Open a job → **Run fitment**.
4. If the score is ≥ 8, **ATS packet + apply**.
5. Watch **Applications** and the dashboard.

### AI (optional but better)

In `.env`:

```
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

Without a key, Octave still scores with a keyword/heuristic model so you can use the product offline.

Local models via Ollama:

```
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_API_KEY=ollama
AI_MODEL=llama3.1
```

## Git

This folder is the project. After Git is installed:

```bash
cd octave
git init
git add .
git commit -m "Initial commit: Octave personal job assistant"
```

To put it on GitHub (after installing [GitHub CLI](https://cli.github.com/)):

```bash
gh repo create octave --private --source=. --remote=origin --push
```

Do **not** commit `.env`. It is gitignored.

## Docs in this repo

- [docs/SETUP.md](docs/SETUP.md) — install, env vars, first run, Postgres switch
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how search, fitment, ATS, and apply work
- [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md) — change the 8/10 bar, add a job board, change the model, restyle

## License

Private personal project unless you add a license file later.
