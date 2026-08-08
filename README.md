# Puzzle Press

A retro digital magazine MVP with a Vite React frontend and an Express/PostgreSQL backend.

## Structure

- `frontend/` - public magazine site and simple admin dashboard.
- `backend/` - Express API, Prisma schema, AI draft helpers, and issue email sending.

## Frontend

```bash
cd frontend
bun install
bun run dev
```

Set `VITE_API_BASE_URL` if the backend is not running on `http://localhost:4000`.

## Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Required for a deployed backend:

- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAILS`
- `PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `TRUST_PROXY` (number of reverse proxy hops; required for the signup rate limit to see real client IPs)

For Neon, use the pooled connection string for `DATABASE_URL` and the direct connection string for `DIRECT_URL`. Prisma migrations live in `backend/prisma/migrations/` and can be applied with:

```bash
cd backend
npx prisma migrate deploy
```

`ADMIN_EMAILS` is a comma-separated allowlist of Google accounts permitted to reach `/api/admin`. Logging in with Google is not enough on its own, and an empty list locks out everyone.

Gemini and Resend are optional during local UI/API development. Without those keys, generation returns reviewable placeholder drafts and publish skips email delivery while still recording issue state. Every generate response reports `source: "gemini" | "fallback"`, so a placeholder can never be mistaken for real model output.

### Generation

All LLM calls go through Gemini (`@google/genai`). `GEMINI_MODEL` is a comma-separated chain tried in order:

```
GEMINI_MODEL="gemini-2.0-flash-lite,gemini-2.0-flash,gemini-2.5-flash"
```

The first is fast and cheap; the rest are the safety net. A model is abandoned for the next one when the API rejects the call (rate limit, retired id, quota) or when two attempts in a row fail validation. Only when the whole chain is exhausted does the request fail, and the 502 names what each model did.

Confirm the key and compare models with:

```bash
cd backend
npm run ai:check                                    # the configured chain
npm run ai:check -- gemini-2.0-flash gemini-2.5-flash   # specific ids
```

That checks the key, warns about ids the key cannot use, then generates every section against every model and prints a pass count and median latency per model. Exits non-zero if any section fails, so it works as a smoke test.

Puzzle types: `crossword`, `maze`, `word-search`, `spelling-bee`, `connections`, `trivia`, `logic`, `reasoning`. Adding one means an entry in `src/services/defaultPuzzles.js`, a shape in `src/services/aiService.js`, and a prompt row in `prisma/seed.js`. No migration: `Puzzle.type` is a plain string.

Every draft is validated before it is stored, and the checks are strongest where a model reliably slips:

- **spelling-bee** - seven distinct letters, the centre among them, every word at least four letters, containing the centre, and spellable from the seven with nothing borrowed. At least one word must use all seven.
- **connections** - exactly four groups of four, with all sixteen words distinct.
- **trivia / reasoning / logic** - the answer must be one of the options offered.
- **article** - a title and a body, both non-empty.

Gemini gets one retry with the exact validation error, then the request fails with a 502 rather than saving an unusable puzzle. A rejected API key or unknown model id also surfaces as a 502 naming the model, not a generic 500.

`theme` is optional. Leave it out and the issue runs untitled, with prompts told to pick their own subject matter. `sourceStory` on an issue is your own material: the article prompt retells it with every real name and identifying detail replaced.

### Tests

```bash
cd backend
npm test
```

Runs on node's built-in test runner. No database or API key required.
