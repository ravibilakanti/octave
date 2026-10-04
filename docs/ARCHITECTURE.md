# Architecture

```
Browser (Next.js pages)
        │
        ▼
  Route handlers under src/app/api
        │
        ├─ Profile  → Prisma SQLite
        ├─ Jobs     → providers → upsert Job rows
        ├─ Fitment  → heuristic and/or AI JSON
        ├─ ATS      → plain-text resume + cover letter
        └─ Apply    → adapters (SMTP email, stored packet) → Application + events
```

## Data model

Defined in `prisma/schema.prisma`:

- `Profile` — single row id `me`
- `Experience`, `Education`, `Skill`, `Certification`, `Project`
- `Job` — unique on `(provider, externalId)`
- `Fitment` — append-only scores per job
- `Application` — one packet/attempt with `ApplicationEvent` history
- `ResumeVersion` — generated ATS text, optionally tied to a job

## Job providers

`src/lib/jobs/search.ts` calls every provider whose `enabled()` is true.

| File | Source |
|---|---|
| `providers/remotive.ts` | Public Remotive remote jobs API |
| `providers/adzuna.ts` | Adzuna REST |
| `providers/jsearch.ts` | RapidAPI JSearch |
| `providers/greenhouse.ts` | Greenhouse Job Board API |

Add a new board by copying a provider file, implementing `JobProvider`, and appending it to the `providers` array. No UI change required.

## Fitment

`src/lib/fitment.ts`

1. Always compute a heuristic score from skill overlap, title match, token overlap, seniority language, and remote preference.
2. If `AI_API_KEY` is set, ask the model for JSON with the same shape. On failure, keep the heuristic.

Recommendation:

- `apply` — score ≥ 8
- `review` — 6–8
- `skip` — below 6

The model is instructed never to fabricate experience. The apply pipeline still uses **your** profile text as the only source for the resume.

## ATS rewrite

`src/lib/ats.ts`

- `buildAtsResume` — deterministic single-column text (ATS-safe: no tables, no columns, standard headings).
- `tailorAtsResume` — LLM rewrite that may only emphasize keywords already evidenced in the profile.
- `writeCoverLetter` — short letter or a template fallback.

## Apply pipeline

`src/lib/pipeline.ts` → `prepareAndApply`

1. Load profile + job.
2. Score if missing.
3. Refuse if score < `profile.minFitScore` unless `force` is true.
4. Generate ATS resume + cover letter; store `ResumeVersion`.
5. Create `Application` (`preparing`).
6. `applyWithAdapters` in `src/lib/apply.ts`:
   - SMTP send when `applyEmail` + SMTP env exist
   - Always store a packet (`ready`) with the employer URL in notes
7. Auto-apply (`autoApplyEligible`) only if Profile `autoApply` is on, and only for jobs with a latest score ≥ the bar and no existing application.

## UI map

| Route | Role |
|---|---|
| `/` | Dashboard counts, top fits, recent apps |
| `/profile` | Dossier editor |
| `/jobs` | Search + paste |
| `/jobs/[id]` | Fitment + packet |
| `/applications` | Kanban-style status tracker |
| `/settings` | Live env readout |

## Trust boundary

Treat the machine this runs on as the vault. API keys and PII stay in `.env` and SQLite. Do not deploy this to a public URL without adding real authentication.
