# Puzzle Press — Frontend Redesign & Media Pipeline

Date: 2026-08-08
Status: approved

## Problem

The frontend is a single 540-line `App.jsx` holding the router, four pages, the
admin dashboard, and every puzzle renderer. It has no visual identity, and it has
already drifted from the backend: `SECTIONS` omits `spelling-bee` and
`connections`, and both types fall through to a raw `JSON.stringify` dump.

The owner wants a specific look — gritty, grainy, dotty, desi indie graphic
retro — sourced from five reference posters, plus LLM-generated media.

## Reference reading

Five moodboard images (ROME poster, hand-painted हाथ board, Qutub Minar दिल्ली
poster, सस्ती मस्ती film-grain lettering, Shri Krishna poster) share:

- **Palette** — oxblood/vermilion red, chrome yellow, cream newsprint, ink black,
  magenta and purple duotone
- **Texture** — paper grain, halftone dots, print misregistration, film grain
- **Type** — tall high-contrast display serif; bold Devanagari display; tiny
  all-caps condensed for meta
- **Furniture** — sunburst rays, hairline rules, barcodes, pincodes, credit lines,
  footer info blocks
- **Feel** — screen-printed by hand, slightly off-register

## Decisions

| Question | Decision |
|---|---|
| Poster depth | **Hybrid.** Issue cover and section dividers are full-bleed posters. Puzzle content sits on cream newsprint so grids stay readable and tappable. |
| Media scope | All four: per-issue cover, per-section dividers, one-time brand assets, article illustration. |
| Devanagari | **Decorative only.** Wordmark, section numerals, poster furniture. All puzzle and article content stays English. No backend prompt or validator changes. |
| Refactor depth | Full component split. Not a restyle. |

## Decomposition

Two projects. They are separable because the frontend renders posters CSS-only
and slots images in when media ids are present.

1. **Frontend redesign** — visual system, component split, the two missing puzzle
   renderers. Ships standalone and looks finished.
2. **Media generation pipeline** — backend image generation, storage, admin
   review, serving. Upgrades project 1.

Build order: 1, then 2.

---

## Project 1 — Frontend redesign

### Target structure

```
src/
  App.jsx                  router + shell only, ~60 lines
  lib/
    api.js                 fetchJson / fetchAdmin, moved out of App
    useRoute.js            pushState router hook
    authClient.js          unchanged
  styles/
    tokens.css             colour, type, spacing custom properties
    texture.css            grain / halftone / sunburst / misregistration
    base.css               reset + typography
  components/
    Masthead.jsx
    Poster.jsx             full-bleed cover; generated art when present, CSS-only otherwise
    SectionDivider.jsx     ── ०२ ── THE MAZE ────
    Subscribe.jsx
    Notice.jsx
  pages/
    Home.jsx  Archive.jsx  IssuePage.jsx  About.jsx
    admin/
      AdminPage.jsx        session gate + layout
      IssueList.jsx
      DraftReview.jsx
      GenerateBar.jsx
  puzzles/
    index.js               type -> component registry
    logic.js               pure scoring helpers
    Crossword.jsx  Maze.jsx  WordSearch.jsx  Trivia.jsx  LogicPuzzle.jsx
    SpellingBee.jsx        new
    Connections.jsx        new
```

### Drift fixes

- `Puzzle()`'s `if` chain becomes a registry object in `puzzles/index.js`. An
  unknown type renders a labelled placeholder, never a raw JSON dump.
- The admin's Remake buttons derive from the selected issue's own puzzle list
  instead of a hardcoded `SECTIONS` array, so the frontend cannot drift from
  `puzzleTypes` again.

### Type

Three families, one `<link>`, no npm dependency.

| Role | Face | Rationale |
|---|---|---|
| Display | Rozha One | High-contrast Didone poster face carrying both Latin and Devanagari in one family, so पहेली and PUZZLE PRESS share a skeleton |
| Chrome | Archivo Narrow | Tiny condensed caps for pincodes, barcodes, credit lines, issue numbers |
| Body | Martel | Serif that reads on newsprint; also covers Devanagari |

### Colour tokens

```
--ink        #14100c   near-black
--paper      #efe7d5   cream newsprint
--paper-2    #e2d6bd   shadowed paper
--red        #8f1d16   oxblood
--vermilion  #d1341f   brighter red
--yellow     #f2c318   chrome yellow
--magenta    #b81e5a   painted-board pink
--violet     #6b2fa0   duotone purple
```

### Texture — CSS/SVG only

Nothing here is a generated raster. A tiled raster texture repeats visibly and
blurs on retina; these do not, and cost zero bytes.

- **Grain** — one inline `feTurbulence` SVG data-URI on a fixed `multiply` overlay
- **Halftone** — `repeating-radial-gradient`
- **Sunburst** — `repeating-conic-gradient`
- **Misregistration** — two-colour offset `text-shadow` on display type

### Devanagari chrome

Wordmark पहेली above PUZZLE PRESS. Section numerals ०१ ०२ ०३. A pincode-style
issue code in the masthead. A `DESIGN BY —` credit line in the footer.

### New renderers

- **SpellingBee** — hex letter cluster, centre letter highlighted, text entry,
  found-word list, pangram callout, progress against `words.length`.
- **Connections** — 4×4 word grid, select four, submit, correct groups lock to a
  coloured band with their category, wrong guesses decrement a mistake counter.

### Testing

No frontend test framework is installed and none is added. Puzzle scoring moves
into `puzzles/logic.js` as pure functions (`scoreBee`, `checkConnectionsGuess`,
`foundWords`), tested with `node --test`, matching the backend's existing setup.
Components stay presentational. No jsdom, no vitest, no new dependency.

---

## Project 2 — Media generation pipeline

### Schema

New Prisma `Media` model:

```
id         String   @id @default(cuid())
issueId    String
kind       String   // 'cover' | 'divider' | 'article'
section    String?  // puzzle type when kind = 'divider'
mimeType   String
bytes      Bytes
prompt     String
createdAt  DateTime @default(now())

@@unique([issueId, kind, section])
```

Stored in the existing Neon database. No new infrastructure.
`ponytail:` moving to R2/S3 is a one-function change if issue count grows; revisit
past roughly 100 issues.

### Generation

`src/services/imageService.js` mirrors `aiService.js` exactly — same model
fallback chain shape, same failure reporting:

```
gemini-3.1-flash-image → gemini-3-pro-image → imagen-4.0-fast-generate-001
```

Image prompts carry the shared style preamble derived from the moodboard so
generated art matches the CSS theme rather than fighting it.

### Endpoints

- `POST /api/admin/issues/:id/generate/media/:kind/:section?` — admin only,
  reuses the existing Remake pattern
- `GET /api/media/:id` — public, `Cache-Control: public, max-age=31536000, immutable`

The public serializer gains `coverMediaId`, `articleMediaId`, and
`puzzle.dividerMediaId`. All are nullable; the frontend falls back to CSS-only
posters when absent.

### Cost control

Cover + 8 dividers + 1 article is **10 images per issue**, and each regenerate
cycle repeats it. Build cover and article first. Dividers are opt-in per issue,
generated on explicit request, never automatically.

### Brand assets

A one-time script writing to `frontend/public/brand/`, committed. Restricted to
what CSS cannot fake — an emblem/mascot, torn-paper edges. Explicitly **not**
grain, halftone, or sunburst; those are CSS.

---

## Out of scope

- Hindi puzzle or article content, and the Devanagari-specific validators it would
  need
- Server-side puzzle scoring. Trivia, reasoning, and logic answers still ship
  inside `puzzle` for client-side scoring, so they are readable in the network
  response. Closing this needs a scoring endpoint and is tracked separately.
- Replacing the hand-rolled pushState router with a routing library.
