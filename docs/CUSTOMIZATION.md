# How to change Octave later

You should not need to rewrite the app. Most product decisions are env vars, the Profile page, or one file.

## Change the 8/10 bar

On **Profile**, set “Minimum fit to auto-apply”. That value is stored on `Profile.minFitScore` and is what the apply pipeline reads.

The env `MIN_FIT_SCORE` is only a default for new profiles / display on Settings.

To change the recommendation labels, edit `src/lib/fitment.ts` (`apply` / `review` / `skip` cutoffs).

## Turn auto-apply on or off

Profile checkbox **Enable auto-apply**. Dashboard button “Auto-apply ≥ 8/10” still respects that flag (`autoApplyEligible` returns early if it is off).

## Change the AI vendor

Edit `.env` only:

```
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=gsk_...
AI_MODEL=llama-3.3-70b-versatile
```

Octave talks to `POST {AI_BASE_URL}/chat/completions`. Any OpenAI-compatible host works. Prompts live in `src/lib/fitment.ts` and `src/lib/ats.ts`.

## Stop the model from being too generous

In `src/lib/fitment.ts`, the system prompt already forbids fabrication and reserves `apply` for score ≥ 8. Tighten by:

- lowering temperature in `src/lib/ai.ts`
- adding “If a required skill is missing, cap score at 7.4” to the system prompt

## Add a job board

1. Create `src/lib/jobs/providers/myboard.ts` implementing `JobProvider` from `src/lib/jobs/types.ts`.
2. Register it in `src/lib/jobs/search.ts` `providers` array.
3. Gate `enabled()` on an env var.

Keep returning `JobListing` with a stable `externalId` so upserts do not duplicate.

Greenhouse: set `GREENHOUSE_BOARDS=your-company-slug` for any company that uses a public Greenhouse board.

## Add an apply adapter

`src/lib/apply.ts` `applyWithAdapters` is the hook. Today:

- email via SMTP
- stored packet + original URL

A future adapter (for example a Greenhouse Job Board application POST, if the board allows unauthenticated submits) should:

- take `ApplyPacket`
- return `{ channel, ok, message }`
- never send skills that are not in `resumeText`

Do not add Playwright logins to LinkedIn/Workday here unless you have explicit permission and accept the ToS risk. Prefer official APIs.

## Change branding / name

- `NEXT_PUBLIC_APP_NAME` in `.env`
- Copy in `src/components/Nav.tsx` and `src/app/layout.tsx` metadata
- Colors: `src/app/globals.css` CSS variables (`--gold`, `--bg`, …)

## Add fields to the profile

1. Add columns in `prisma/schema.prisma`.
2. `npx prisma db push`
3. Include them in `src/app/api/profile/route.ts` PUT/GET.
4. Add inputs on `src/app/profile/page.tsx`.
5. If they should affect scoring or the resume, thread them through `src/lib/profile-text.ts`.

## Application statuses

The tracker list is in `src/app/applications/page.tsx` (`STATUSES`). Add a value there; the database stores status as a string, so no migration is required.

## Database location

SQLite path is `DATABASE_URL` in `.env`. Back up by copying `prisma/dev.db`.

## Tests you can add later

This first version has no test runner wired. A thin path:

- `vitest` for `fitment` heuristic and `buildAtsResume`
- Playwright for Profile save → Job paste → Score

## Common edits cheat sheet

| I want to… | Edit |
|---|---|
| Search different default country | `ADZUNA_COUNTRY` |
| Disable Remotive | `REMOTIVE_ENABLED=false` |
| Longer job descriptions to the model | slice lengths in `fitment.ts` / `ats.ts` |
| Always force a master ATS resume | `POST /api/resume` with no `jobId` |
| Hide gold / jazz styling | `globals.css` and `Nav` |
