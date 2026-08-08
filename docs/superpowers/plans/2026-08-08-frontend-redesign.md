# Puzzle Press Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single 540-line `App.jsx` with a properly decomposed React app wearing a desi indie retro poster identity, and add the two puzzle renderers that are currently missing.

**Architecture:** `App.jsx` shrinks to a router and page shell. Pages, shared chrome, and puzzle renderers become their own files. All puzzle scoring moves into one pure module (`src/puzzles/logic.js`) that runs under `node --test` with no DOM and no test framework. Visual identity lives in three CSS files of custom properties and CSS-only texture — no generated raster, no CSS framework, no new npm dependency.

**Tech Stack:** React 19, Vite 8, plain CSS with custom properties, Google Fonts via `<link>`, `node --test` for the logic module.

## Global Constraints

- **No new npm dependencies.** Not for routing, not for styling, not for testing.
- **No backend changes in this plan.** Project 2 (media pipeline) is a separate plan.
- **Devanagari is decorative only.** Wordmark, numerals, poster furniture. All puzzle and article content stays English.
- **Texture is CSS/SVG only.** Grain, halftone, sunburst, and misregistration are never generated raster images.
- **Colour tokens** (exact values, use the custom property, never the literal):
  `--ink #14100c`, `--paper #efe7d5`, `--paper-2 #e2d6bd`, `--red #8f1d16`, `--vermilion #d1341f`, `--yellow #f2c318`, `--magenta #b81e5a`, `--violet #6b2fa0`
- **Type roles:** display = `Rozha One`, chrome = `Archivo Narrow`, body = `Martel`.
- **Media is optional everywhere.** Every component that can show a generated image must render a complete CSS-only fallback when the image is absent. Project 2 supplies the images later.
- **Working directory** for all commands is `frontend/` unless stated otherwise.

---

### Task 0: Initialise the repository

The project has a `.gitignore` but no `.git`. Every later task ends in a commit, so this has to exist first. Skip this task only if you intend to skip all commits.

**Files:**
- Modify: `.gitignore` (repo root) — verify only

- [ ] **Step 1: Confirm there is no repository**

Run from the project root (`puzzle press/`):

```bash
git rev-parse --is-inside-work-tree
```

Expected: `fatal: not a git repository`

- [ ] **Step 2: Confirm .gitignore already excludes secrets and build output**

```bash
cat .gitignore
```

Expected: it lists `.env`, `.env.*`, `!.env.example`, and `node_modules`. If `node_modules` or `dist` are missing, append them:

```bash
printf '\nnode_modules/\ndist/\n' >> .gitignore
```

- [ ] **Step 3: Initialise and make the baseline commit**

```bash
git init
git add -A
git commit -m "chore: baseline before frontend redesign"
```

- [ ] **Step 4: Verify secrets did not get committed**

```bash
git ls-files | grep -E '(^|/)\.env$' && echo "LEAK" || echo "clean"
```

Expected: `clean`

---

### Task 1: Design tokens, texture, and base styles

**Files:**
- Create: `frontend/src/styles/tokens.css`
- Create: `frontend/src/styles/texture.css`
- Create: `frontend/src/styles/base.css`
- Modify: `frontend/index.html` (add font links, update `<title>`)
- Modify: `frontend/src/main.jsx` (import the three stylesheets)
- Modify: `frontend/src/index.css` (replace entirely)

**Interfaces:**
- Consumes: nothing
- Produces: CSS custom properties `--ink --ink-soft --paper --paper-2 --paper-3 --red --vermilion --yellow --magenta --violet --display --chrome --body --gap --rule --page`, and utility classes `.grain .halftone .sunburst .misprint .rule-heavy .chrome-line`

- [ ] **Step 1: Create the token sheet**

Create `frontend/src/styles/tokens.css`:

```css
/* Palette sampled from the five reference posters: oxblood and vermilion reds,
   chrome yellow, cream newsprint, ink black, plus the magenta/violet duotone. */
:root {
  --ink: #14100c;
  --ink-soft: #4a3f33;

  --paper: #efe7d5;
  --paper-2: #e2d6bd;
  --paper-3: #d6c7a8;

  --red: #8f1d16;
  --vermilion: #d1341f;
  --yellow: #f2c318;
  --magenta: #b81e5a;
  --violet: #6b2fa0;

  --display: 'Rozha One', Georgia, 'Times New Roman', serif;
  --chrome: 'Archivo Narrow', 'Arial Narrow', Arial, sans-serif;
  --body: 'Martel', Georgia, 'Times New Roman', serif;

  --gap: 1rem;
  --rule: 2px solid var(--ink);
  --rule-thin: 1px solid var(--ink);
  --page: 68rem;
}
```

- [ ] **Step 2: Create the texture sheet**

Create `frontend/src/styles/texture.css`. Every effect here is CSS or an inline SVG data-URI. A tiled raster grain repeats visibly and blurs on retina; these do not.

```css
/* Paper grain. One inline feTurbulence, fixed to the viewport, multiplied over
   everything. Zero network bytes, sharp at any pixel density. */
.grain::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9000;
  pointer-events: none;
  opacity: 0.3;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
}

/* Halftone dot screen. radial-gradient plus background-size tiles a real dot
   grid; repeating-radial-gradient would draw concentric rings instead. */
.halftone {
  background-image: radial-gradient(var(--dot, var(--ink)) 1.1px, transparent 1.3px);
  background-size: 6px 6px;
}

/* Sunburst rays, as on the Qutub Minar poster. */
.sunburst {
  background-image: repeating-conic-gradient(
    from 0deg,
    var(--ray, var(--red)) 0deg 5deg,
    transparent 5deg 11deg
  );
}

/* Off-register screen printing: the same word printed twice, slightly missed. */
.misprint {
  text-shadow:
    0.035em 0.03em 0 var(--mis-a, var(--vermilion)),
    -0.028em -0.022em 0 var(--mis-b, var(--yellow));
}

.rule-heavy {
  border-top: 6px double var(--ink);
}

/* Tiny condensed caps used for pincodes, issue codes, credits. */
.chrome-line {
  font-family: var(--chrome);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-soft);
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: Create the base sheet**

Create `frontend/src/styles/base.css`:

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 320px;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, h2, h3 {
  font-family: var(--display);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: 0.01em;
  margin: 0 0 0.4em;
}

h1 { font-size: clamp(2.6rem, 9vw, 6rem); }
h2 { font-size: clamp(1.7rem, 4.5vw, 2.8rem); }
h3 { font-size: clamp(1.2rem, 3vw, 1.6rem); }

p { margin: 0 0 1em; }

a { color: var(--red); }

button, input, textarea {
  font: inherit;
  color: inherit;
}

button { cursor: pointer; }

button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--violet);
  outline-offset: 2px;
}

/* Every interactive puzzle cell and pill shares this printed-button look. */
.ink-button {
  font-family: var(--chrome);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  background: var(--paper);
  border: var(--rule);
  padding: 0.5rem 0.9rem;
  box-shadow: 3px 3px 0 var(--ink);
  transition: transform 80ms, box-shadow 80ms;
}

.ink-button:hover:not(:disabled) { transform: translate(1px, 1px); box-shadow: 2px 2px 0 var(--ink); }
.ink-button:active:not(:disabled) { transform: translate(3px, 3px); box-shadow: none; }
.ink-button:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

.ink-button.is-on {
  background: var(--red);
  color: var(--paper);
}

.page-width {
  max-width: var(--page);
  margin: 0 auto;
  padding: 0 1.25rem;
}
```

- [ ] **Step 4: Replace index.css**

Overwrite `frontend/src/index.css` with a single line — the old `PressStart` face and gold background are gone:

```css
/* Superseded by styles/tokens.css, styles/base.css, styles/texture.css. */
```

- [ ] **Step 5: Load the fonts**

In `frontend/index.html`, add inside `<head>` above the existing script tag, and change the `<title>`:

```html
    <title>पहेली · Puzzle Press</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Rozha+One&family=Archivo+Narrow:wght@400;700&family=Martel:wght@400;700&display=swap"
      rel="stylesheet"
    />
```

Rozha One carries both Latin and Devanagari, so पहेली and PUZZLE PRESS share one skeleton. Google's `css2` endpoint serves the Devanagari subset automatically via `unicode-range`.

- [ ] **Step 6: Import the sheets**

Replace `frontend/src/main.jsx` entirely:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import './styles/texture.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Verify it builds and the tokens resolve**

```bash
npm run build
```

Expected: build succeeds. Then:

```bash
grep -c '#efe7d5' dist/assets/*.css
```

Expected: at least `1` — the paper token made it into the bundle.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/styles frontend/src/index.css frontend/src/main.jsx frontend/index.html
git commit -m "feat(ui): add desi retro design tokens, CSS texture, base styles"
```

---

### Task 2: Extract the API client and router hook

Extraction, so later tasks can import these instead of reaching into `App.jsx`. Behaviour is preserved with one deliberate exception: `fetchJson` now throws `Request failed: <status>` instead of a bare `Request failed`. No caller reads `error.message` — every call site either swallows the error or substitutes its own notice text — so this is observable only in a debugger, where the status code is worth having.

**Files:**
- Create: `frontend/src/lib/api.js`
- Create: `frontend/src/lib/useRoute.js`
- Modify: `frontend/src/App.jsx:526-538` (delete the moved functions), `frontend/src/App.jsx:87,94-98,123-127` (use the hook)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `fetchJson(path, options?) => Promise<object>`
  - `fetchAdmin(path, options?) => Promise<object>` — same as `fetchJson` with `credentials: 'include'`
  - `useRoute() => { route: string, navigate(path: string): void }`

- [ ] **Step 1: Create the API client**

Create `frontend/src/lib/api.js`:

```js
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: options.credentials ?? 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json()
}

// Admin routes need the better-auth session cookie, which is on a different origin.
export function fetchAdmin(path, options = {}) {
  return fetchJson(path, { ...options, credentials: 'include' })
}
```

- [ ] **Step 2: Create the router hook**

Create `frontend/src/lib/useRoute.js`:

```js
import { useCallback, useEffect, useState } from 'react'

// ponytail: hand-rolled pushState routing. Four static paths and one slug do not
// justify a router dependency. Add one when nested or parameterised routes appear.
export function useRoute() {
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { route, navigate }
}
```

- [ ] **Step 3: Point App.jsx at them**

In `frontend/src/App.jsx`: delete the `fetchJson` and `fetchAdmin` definitions at the bottom of the file (lines 526–538), delete the `API_BASE` constant (line 5), delete the `route` state, the `popstate` effect, and the `navigate` function inside `App`, then add at the top:

```jsx
import { fetchJson, fetchAdmin } from './lib/api'
import { useRoute } from './lib/useRoute'
```

and inside `App`, replace the deleted state/effect/function with:

```jsx
  const { route, navigate } = useRoute()
```

- [ ] **Step 4: Verify nothing broke**

```bash
npm run build && npm run lint
```

Expected: both succeed with no errors. The app still renders exactly as before.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib frontend/src/App.jsx
git commit -m "refactor(ui): extract api client and route hook from App"
```

---

### Task 3: Pure puzzle logic module, test-first

This is the only real logic in the frontend, so it is the only thing that gets tested. It has no React import and no DOM, so `node --test` runs it directly — `frontend/package.json` already has `"type": "module"`.

**Files:**
- Create: `frontend/test/logic.test.js`
- Create: `frontend/src/puzzles/logic.js`
- Create: `frontend/src/lib/devanagari.js`
- Modify: `frontend/package.json` (add the `test` script)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `toggleFound(found: string[], word: string) => string[]`
  - `scoreQuestions(questions: {answer: string}[], answers: Record<number, string>) => number`
  - `checkBeeWord(raw: string, puzzle, found: string[]) => { status, word, pangram? }` where `status` is one of `'empty' | 'short' | 'no-center' | 'bad-letter' | 'already' | 'unknown' | 'ok'`
  - `beeProgress(found: string[], puzzle) => { found, total, pangramsFound, pangramsTotal, percent }`
  - `toggleSelection(selection: string[], word: string, max?: number) => string[]`
  - `checkConnectionsGuess(groups, selection: string[]) => { correct: boolean, category: string|null, words: string[]|null }`
  - `connectionsNearMiss(groups, selection: string[]) => boolean`
  - `shuffle(items: T[], seed?: number) => T[]`
  - `devanagariNumber(n: number|string) => string`
  - `SECTION_LABELS: Record<string, string>`

- [ ] **Step 1: Add the test script**

In `frontend/package.json`, add to `"scripts"`:

```json
    "test": "node --test test/*.test.js"
```

- [ ] **Step 2: Write the failing tests**

Create `frontend/test/logic.test.js`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  toggleFound,
  scoreQuestions,
  checkBeeWord,
  beeProgress,
  toggleSelection,
  checkConnectionsGuess,
  connectionsNearMiss,
  shuffle,
} from '../src/puzzles/logic.js'
import { devanagariNumber } from '../src/lib/devanagari.js'

const bee = {
  letters: ['A', 'C', 'D', 'E', 'O', 'R', 'T'],
  center: 'R',
  minLength: 4,
  words: ['DECORATE', 'CRATE', 'TRACE', 'CARROT', 'ORATE'],
  pangrams: ['DECORATE'],
}

const groups = [
  { category: 'Chess pieces', words: ['ROOK', 'KNIGHT', 'BISHOP', 'PAWN'] },
  { category: 'Card games', words: ['RUMMY', 'BRIDGE', 'HEARTS', 'SPADES'] },
  { category: 'Arcade parts', words: ['JOYSTICK', 'COIN', 'SCREEN', 'BUTTON'] },
  { category: 'Board games', words: ['LUDO', 'CHESS', 'SNAKES', 'CAROM'] },
]

test('toggleFound adds then removes', () => {
  assert.deepEqual(toggleFound([], 'PIXEL'), ['PIXEL'])
  assert.deepEqual(toggleFound(['PIXEL'], 'PIXEL'), [])
})

test('scoreQuestions counts only exact matches', () => {
  const questions = [{ answer: 'A' }, { answer: 'B' }, { answer: 'C' }]
  assert.equal(scoreQuestions(questions, { 0: 'A', 1: 'X', 2: 'C' }), 2)
  assert.equal(scoreQuestions(questions, {}), 0)
  assert.equal(scoreQuestions(undefined, {}), 0)
})

test('checkBeeWord rejects in priority order', () => {
  assert.equal(checkBeeWord('', bee, []).status, 'empty')
  assert.equal(checkBeeWord('rat', bee, []).status, 'short')
  assert.equal(checkBeeWord('DATE', bee, []).status, 'no-center')
  assert.equal(checkBeeWord('GRATE', bee, []).status, 'bad-letter')
  assert.equal(checkBeeWord('RATED', bee, []).status, 'unknown')
  assert.equal(checkBeeWord('CRATE', bee, ['CRATE']).status, 'already')
})

test('checkBeeWord accepts a listed word and flags the pangram', () => {
  assert.deepEqual(checkBeeWord(' crate ', bee, []), { status: 'ok', word: 'CRATE', pangram: false })
  assert.equal(checkBeeWord('decorate', bee, []).pangram, true)
})

test('beeProgress reports counts and percent', () => {
  assert.deepEqual(beeProgress(['CRATE', 'DECORATE'], bee), {
    found: 2, total: 5, pangramsFound: 1, pangramsTotal: 1, percent: 40,
  })
  assert.equal(beeProgress([], { words: [] }).percent, 0)
})

test('toggleSelection caps at four', () => {
  const four = ['A', 'B', 'C', 'D']
  assert.deepEqual(toggleSelection(four, 'E'), four)
  assert.deepEqual(toggleSelection(four, 'B'), ['A', 'C', 'D'])
})

test('checkConnectionsGuess needs all four of one group', () => {
  const hit = checkConnectionsGuess(groups, ['PAWN', 'ROOK', 'BISHOP', 'KNIGHT'])
  assert.equal(hit.correct, true)
  assert.equal(hit.category, 'Chess pieces')

  assert.equal(checkConnectionsGuess(groups, ['ROOK', 'KNIGHT', 'BISHOP', 'LUDO']).correct, false)
  assert.equal(checkConnectionsGuess(groups, ['ROOK', 'KNIGHT']).correct, false)
})

test('connectionsNearMiss fires on exactly three of a group', () => {
  assert.equal(connectionsNearMiss(groups, ['ROOK', 'KNIGHT', 'BISHOP', 'LUDO']), true)
  assert.equal(connectionsNearMiss(groups, ['ROOK', 'KNIGHT', 'RUMMY', 'LUDO']), false)
})

test('shuffle is deterministic for a seed and keeps every item', () => {
  const items = ['A', 'B', 'C', 'D', 'E', 'F']
  assert.deepEqual(shuffle(items, 7), shuffle(items, 7))
  assert.notDeepEqual(shuffle(items, 7), items)
  assert.deepEqual([...shuffle(items, 7)].sort(), [...items].sort())
  assert.deepEqual(items, ['A', 'B', 'C', 'D', 'E', 'F'])
})

test('devanagariNumber converts digits', () => {
  assert.equal(devanagariNumber(1), '१')
  assert.equal(devanagariNumber('007'), '००७')
  assert.equal(devanagariNumber(2026), '२०२६')
})
```

- [ ] **Step 3: Run the tests and confirm they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '.../src/puzzles/logic.js'`

- [ ] **Step 4: Write the Devanagari helper**

Create `frontend/src/lib/devanagari.js`:

```js
const DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

// Devanagari numerals are decoration only — issue numbers, section counters.
export function devanagariNumber(value) {
  return String(value)
    .split('')
    .map((char) => (char >= '0' && char <= '9' ? DIGITS[Number(char)] : char))
    .join('')
}
```

- [ ] **Step 5: Write the logic module**

Create `frontend/src/puzzles/logic.js`:

```js
export const SECTION_LABELS = {
  // editorNote and teaser are camelCase to match the issue record's own field names;
  // the puzzle keys stay kebab-case because they mirror the backend's `type` strings.
  editorNote: "Editor's Note",
  article: 'The Article',
  crossword: 'Crossword',
  maze: 'The Maze',
  'word-search': 'Word Search',
  'spelling-bee': 'Spelling Bee',
  connections: 'Connections',
  trivia: 'Trivia',
  logic: 'Logic',
  reasoning: 'Reasoning',
  teaser: 'Next Issue',
}

export function toggleFound(found, word) {
  return found.includes(word) ? found.filter((item) => item !== word) : [...found, word]
}

export function scoreQuestions(questions, answers) {
  return (questions ?? []).filter((question, index) => answers[index] === question.answer).length
}

// Order matters: report the first rule the word breaks, so the reader gets one
// actionable message instead of a list.
export function checkBeeWord(raw, puzzle, found = []) {
  const word = String(raw ?? '').trim().toUpperCase()
  const letters = new Set((puzzle.letters ?? []).map((letter) => letter.toUpperCase()))
  const center = String(puzzle.center ?? '').toUpperCase()
  const minLength = puzzle.minLength ?? 4
  const listed = new Set((puzzle.words ?? []).map((item) => item.toUpperCase()))

  if (!word) return { status: 'empty', word }
  if (word.length < minLength) return { status: 'short', word }
  if (center && !word.includes(center)) return { status: 'no-center', word }
  if ([...word].some((char) => !letters.has(char))) return { status: 'bad-letter', word }
  if (found.includes(word)) return { status: 'already', word }
  if (!listed.has(word)) return { status: 'unknown', word }
  return { status: 'ok', word, pangram: new Set(word).size === letters.size }
}

export function beeProgress(found, puzzle) {
  const total = (puzzle.words ?? []).length
  const pangrams = new Set((puzzle.pangrams ?? []).map((item) => item.toUpperCase()))
  return {
    found: found.length,
    total,
    pangramsFound: found.filter((word) => pangrams.has(word)).length,
    pangramsTotal: pangrams.size,
    percent: total ? Math.round((found.length / total) * 100) : 0,
  }
}

export function toggleSelection(selection, word, max = 4) {
  if (selection.includes(word)) return selection.filter((item) => item !== word)
  return selection.length >= max ? selection : [...selection, word]
}

export function checkConnectionsGuess(groups, selection) {
  if (selection.length !== 4) return { correct: false, category: null, words: null }
  const picked = new Set(selection)
  const hit = (groups ?? []).find(
    (group) => group.words?.length === 4 && group.words.every((word) => picked.has(word)),
  )
  return hit
    ? { correct: true, category: hit.category, words: hit.words }
    : { correct: false, category: null, words: null }
}

// "One away" is what makes Connections feel like Connections.
export function connectionsNearMiss(groups, selection) {
  return (groups ?? []).some(
    (group) => (group.words ?? []).filter((word) => selection.includes(word)).length === 3,
  )
}

// Seeded so the board is stable across re-renders and assertable in a test.
export function shuffle(items, seed = 1) {
  const out = [...items]
  let state = seed
  for (let index = out.length - 1; index > 0; index -= 1) {
    state = (state * 1103515245 + 12345) % 2147483648
    const swap = state % (index + 1)
    ;[out[index], out[swap]] = [out[swap], out[index]]
  }
  return out
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

```bash
npm test
```

Expected: `pass 10`, `fail 0`

- [ ] **Step 7: Commit**

```bash
git add frontend/src/puzzles/logic.js frontend/src/lib/devanagari.js frontend/test frontend/package.json
git commit -m "feat(ui): add pure puzzle logic module with node --test coverage"
```

---

### Task 4: Shared chrome components

**Files:**
- Create: `frontend/src/components/Masthead.jsx`
- Create: `frontend/src/components/Poster.jsx`
- Create: `frontend/src/components/SectionDivider.jsx`
- Create: `frontend/src/components/Subscribe.jsx`
- Create: `frontend/src/components/Notice.jsx`
- Create: `frontend/src/components/components.css`

**Interfaces:**
- Consumes: `devanagariNumber` from `lib/devanagari.js`, `SECTION_LABELS` from `puzzles/logic.js`, `fetchJson` from `lib/api.js`
- Produces:
  - `<Masthead navigate={fn} />`
  - `<Poster issue={issue} mediaUrl={string|null} kicker={string} action={ReactNode} />`
  - `<SectionDivider index={number} type={string} title={string} mediaUrl={string|null} />`
  - `<Subscribe setNotice={fn} />`
  - `<Notice message={string} onDismiss={fn} />`

- [ ] **Step 1: Write the masthead**

Create `frontend/src/components/Masthead.jsx`:

```jsx
import { devanagariNumber } from '../lib/devanagari'
import './components.css'

export function Masthead({ navigate, issueNumber = 1 }) {
  return (
    <header className="masthead">
      <div className="masthead-top page-width">
        <span className="chrome-line">Est. 2026 · New Delhi 110030</span>
        <span className="chrome-line">अंक {devanagariNumber(String(issueNumber).padStart(3, '0'))}</span>
      </div>

      <button className="wordmark" onClick={() => navigate('/')}>
        <span className="wordmark-dev misprint">पहेली</span>
        <span className="wordmark-latin">PUZZLE PRESS</span>
      </button>

      <nav className="masthead-nav page-width">
        <button className="ink-button" onClick={() => navigate('/issues')}>Archive</button>
        <button className="ink-button" onClick={() => navigate('/about')}>About</button>
        <button className="ink-button" onClick={() => navigate('/admin')}>Desk</button>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Write the poster**

Create `frontend/src/components/Poster.jsx`. `mediaUrl` is always optional — the CSS-only branch is the one that ships today.

```jsx
import { devanagariNumber } from '../lib/devanagari'
import './components.css'

export function Poster({ issue, mediaUrl = null, kicker = 'Fresh off the press', action = null }) {
  const number = String(issue?.number ?? 1).padStart(3, '0')

  return (
    <section className="poster">
      <div className="poster-rays sunburst" aria-hidden="true" />
      {mediaUrl && <img className="poster-art" src={mediaUrl} alt="" />}
      <div className="poster-grid halftone" aria-hidden="true" />

      <div className="poster-body page-width">
        <p className="chrome-line poster-kicker">{kicker}</p>
        <p className="poster-number">{devanagariNumber(number)}</p>
        <h1 className="poster-title misprint">{issue?.theme ?? issue?.title ?? 'Puzzle Press'}</h1>
        <p className="poster-sub">Issue #{number} · {issue?.title}</p>
        {action}
      </div>

      <p className="chrome-line poster-credit">पहेली प्रेस · Design by Krash</p>
    </section>
  )
}
```

- [ ] **Step 3: Write the section divider**

Create `frontend/src/components/SectionDivider.jsx`:

```jsx
import { devanagariNumber } from '../lib/devanagari'
import { SECTION_LABELS } from '../puzzles/logic'
import './components.css'

export function SectionDivider({ index, type, title, mediaUrl = null }) {
  return (
    <div className="divider">
      <span className="divider-number">{devanagariNumber(String(index).padStart(2, '0'))}</span>
      <span className="divider-label chrome-line">{SECTION_LABELS[type] ?? type}</span>
      <span className="divider-rule" aria-hidden="true" />
      {mediaUrl
        ? <img className="divider-art" src={mediaUrl} alt="" />
        : <span className="divider-art divider-art-fallback halftone" aria-hidden="true" />}
      <h2 className="divider-title">{title}</h2>
    </div>
  )
}
```

- [ ] **Step 4: Write Subscribe and Notice**

Create `frontend/src/components/Subscribe.jsx`:

```jsx
import { useState } from 'react'
import { fetchJson } from '../lib/api'
import './components.css'

export function Subscribe({ setNotice }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await fetchJson('/api/subscribers', { method: 'POST', body: JSON.stringify({ email }) })
      setEmail('')
      setNotice('Subscribed. New issues will arrive by email.')
    } catch {
      setNotice('Subscription failed. Check the address and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="subscribe" onSubmit={submit}>
      <h3>Get the next issue</h3>
      <p className="chrome-line">One email per issue. Unsubscribe in one click.</p>
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="reader@example.com"
        type="email"
        required
        aria-label="Email address"
      />
      <button className="ink-button" disabled={busy}>{busy ? 'Sending…' : 'Subscribe'}</button>
    </form>
  )
}
```

Create `frontend/src/components/Notice.jsx`:

```jsx
import './components.css'

export function Notice({ message, onDismiss }) {
  if (!message) return null
  return (
    <button className="notice" onClick={onDismiss} aria-live="polite">
      {message}
      <span className="chrome-line notice-close">dismiss ×</span>
    </button>
  )
}
```

- [ ] **Step 5: Style them**

Create `frontend/src/components/components.css`:

```css
/* ---- masthead ---- */
.masthead { border-bottom: 6px double var(--ink); background: var(--paper-2); }

.masthead-top {
  display: flex;
  justify-content: space-between;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: var(--rule-thin);
}

.wordmark {
  display: block;
  width: 100%;
  background: none;
  border: 0;
  padding: 1.2rem 0 0.6rem;
  text-align: center;
}

.wordmark-dev {
  display: block;
  font-family: var(--display);
  font-size: clamp(3rem, 12vw, 7rem);
  line-height: 0.85;
  color: var(--red);
}

.wordmark-latin {
  display: block;
  font-family: var(--chrome);
  font-weight: 700;
  font-size: clamp(0.8rem, 2.4vw, 1.2rem);
  letter-spacing: 0.55em;
  text-indent: 0.55em;
  color: var(--ink);
}

.masthead-nav {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
  flex-wrap: wrap;
  padding-bottom: 1.1rem;
}

/* ---- poster ---- */
.poster {
  position: relative;
  overflow: hidden;
  background: var(--red);
  color: var(--paper);
  padding: clamp(3rem, 9vw, 7rem) 0 1rem;
  isolation: isolate;
}

.poster-rays {
  position: absolute;
  inset: -60% -20%;
  --ray: rgba(0, 0, 0, 0.16);
  z-index: 0;
}

.poster-art {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  mix-blend-mode: luminosity;
  opacity: 0.55;
}

.poster-grid {
  position: absolute;
  inset: 0;
  z-index: 2;
  --dot: rgba(0, 0, 0, 0.28);
  opacity: 0.5;
}

.poster-body { position: relative; z-index: 3; }

.poster-kicker { color: var(--yellow); }

.poster-number {
  font-family: var(--display);
  font-size: clamp(4rem, 18vw, 12rem);
  line-height: 0.8;
  color: var(--yellow);
  margin: 0;
  opacity: 0.9;
}

.poster-title {
  --mis-a: var(--yellow);
  --mis-b: var(--magenta);
  margin: 0.1em 0 0.2em;
  text-transform: uppercase;
}

.poster-sub { font-family: var(--chrome); letter-spacing: 0.18em; text-transform: uppercase; font-size: 0.85rem; }

.poster-credit {
  position: relative;
  z-index: 3;
  text-align: center;
  color: rgba(239, 231, 213, 0.6);
  margin: 2rem 0 0;
}

/* ---- divider ---- */
.divider {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  margin: 3.5rem 0 1.25rem;
  padding-top: 0.75rem;
  border-top: 6px double var(--ink);
}

.divider-number { font-family: var(--display); font-size: 2.4rem; line-height: 1; color: var(--red); }
.divider-label { white-space: nowrap; }
.divider-rule { height: 0; border-top: var(--rule-thin); }

.divider-art {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: cover;
  border: var(--rule);
}

.divider-art-fallback { --dot: var(--red); background-color: var(--yellow); }

.divider-title { grid-column: 1 / -1; margin: 0.2rem 0 0; text-transform: uppercase; }

/* ---- subscribe & notice ---- */
.subscribe {
  border: var(--rule);
  box-shadow: 6px 6px 0 var(--red);
  background: var(--paper-2);
  padding: 1.25rem;
  display: grid;
  gap: 0.6rem;
  align-content: start;
}

.subscribe input { border: var(--rule); background: var(--paper); padding: 0.55rem 0.7rem; }

.notice {
  position: fixed;
  left: 50%;
  bottom: 1.25rem;
  transform: translateX(-50%);
  z-index: 9500;
  max-width: min(38rem, 92vw);
  display: grid;
  gap: 0.35rem;
  background: var(--ink);
  color: var(--paper);
  border: 0;
  padding: 0.85rem 1.1rem;
  box-shadow: 5px 5px 0 var(--vermilion);
  text-align: left;
}

.notice-close { color: var(--yellow); }

@media (max-width: 640px) {
  .divider { grid-template-columns: auto 1fr auto; }
  .divider-label { grid-column: 1 / -1; }
}
```

- [ ] **Step 6: Verify**

```bash
npm run build && npm run lint
```

Expected: both succeed. These components are not wired into a page yet; the build proves they compile.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components
git commit -m "feat(ui): add masthead, poster, divider, subscribe, notice components"
```

---

### Task 5: Move the five existing puzzle renderers into their own files

Behaviour is preserved; the markup gains theme classes and the scoring calls move to `logic.js`. `MagazineSection` becomes `PuzzleFrame`.

**Files:**
- Create: `frontend/src/puzzles/PuzzleFrame.jsx`, `Crossword.jsx`, `Maze.jsx`, `WordSearch.jsx`, `Trivia.jsx`, `LogicPuzzle.jsx`, `puzzles.css`
- Modify: `frontend/src/App.jsx` (delete lines 243–341, the moved components)

**Interfaces:**
- Consumes: `scoreQuestions`, `toggleFound` from `puzzles/logic.js`
- Produces: `<PuzzleFrame title children />`, and `<Crossword puzzle />`, `<Maze puzzle />`, `<WordSearch puzzle />`, `<Trivia puzzle />`, `<LogicPuzzle puzzle />` — each taking the full puzzle record (`{ type, title, puzzle, hints }`)

- [ ] **Step 1: Write the frame**

Create `frontend/src/puzzles/PuzzleFrame.jsx`:

```jsx
import './puzzles.css'

export function PuzzleFrame({ title, note, children }) {
  return (
    <section className="puzzle-frame">
      {title && <h3 className="puzzle-title">{title}</h3>}
      {note && <p className="chrome-line">{note}</p>}
      {children}
    </section>
  )
}
```

- [ ] **Step 2: Write Crossword and Maze**

Create `frontend/src/puzzles/Crossword.jsx`:

```jsx
import { PuzzleFrame } from './PuzzleFrame'

export function Crossword({ puzzle }) {
  const entries = puzzle.puzzle?.entries ?? []
  const size = puzzle.puzzle?.size ?? 7

  return (
    <PuzzleFrame title={puzzle.title}>
      <div className="grid-ink crossword-grid" style={{ '--size': size }}>
        {Array.from({ length: size * size }).map((_, index) => (
          <input key={index} maxLength="1" aria-label={`Cell ${index + 1}`} />
        ))}
      </div>
      <ol className="clues">
        {entries.map((entry, index) => (
          <li key={`${entry.direction}-${entry.row}-${entry.col}-${index}`}>
            <span className="chrome-line">{entry.direction}</span> {entry.clue}
          </li>
        ))}
      </ol>
    </PuzzleFrame>
  )
}
```

Create `frontend/src/puzzles/Maze.jsx`:

```jsx
import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'

export function Maze({ puzzle }) {
  const data = puzzle.puzzle ?? {}
  const rows = data.rows ?? 7
  const cols = data.cols ?? 7
  const walls = new Set((data.walls ?? []).map((cell) => cell.join(',')))
  const start = (data.start ?? [0, 0]).join(',')
  const finish = (data.finish ?? [rows - 1, cols - 1]).join(',')
  const [marked, setMarked] = useState(() => new Set())

  function mark(key) {
    setMarked((old) => {
      const next = new Set(old)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <PuzzleFrame title={puzzle.title} note="Tap cells to trace your route.">
      <div className="grid-ink maze-grid" style={{ '--size': cols }}>
        {Array.from({ length: rows * cols }).map((_, index) => {
          const key = `${Math.floor(index / cols)},${index % cols}`
          const isWall = walls.has(key)
          return (
            <button
              key={key}
              disabled={isWall}
              aria-label={`Cell ${key}`}
              className={`cell ${isWall ? 'is-wall' : ''} ${marked.has(key) ? 'is-marked' : ''}`}
              onClick={() => mark(key)}
            >
              {key === start ? 'S' : key === finish ? 'F' : ''}
            </button>
          )
        })}
      </div>
    </PuzzleFrame>
  )
}
```

- [ ] **Step 3: Write WordSearch, Trivia, LogicPuzzle**

Create `frontend/src/puzzles/WordSearch.jsx`:

```jsx
import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { toggleFound } from './logic'

export function WordSearch({ puzzle }) {
  const grid = puzzle.puzzle?.grid ?? []
  const words = puzzle.puzzle?.words ?? []
  const cols = grid[0]?.length ?? 7
  const [found, setFound] = useState([])

  return (
    <PuzzleFrame title={puzzle.title} note={`${found.length} of ${words.length} struck off`}>
      <div className="grid-ink word-grid" style={{ '--size': cols }}>
        {grid.flatMap((row, rowIndex) =>
          row.split('').map((letter, colIndex) => (
            <span className="cell is-static" key={`${rowIndex}-${colIndex}`}>{letter}</span>
          )),
        )}
      </div>
      <div className="pill-row">
        {words.map((word) => (
          <button
            key={word}
            className={`ink-button ${found.includes(word) ? 'is-struck' : ''}`}
            onClick={() => setFound((old) => toggleFound(old, word))}
          >
            {word}
          </button>
        ))}
      </div>
    </PuzzleFrame>
  )
}
```

Create `frontend/src/puzzles/Trivia.jsx` — this serves both `trivia` and `reasoning`:

```jsx
import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { scoreQuestions } from './logic'

export function Trivia({ puzzle }) {
  const questions = puzzle.puzzle?.questions ?? []
  const [answers, setAnswers] = useState({})
  const score = scoreQuestions(questions, answers)

  return (
    <PuzzleFrame title={puzzle.title} note={`Score ${score} / ${questions.length}`}>
      {questions.map((question, index) => {
        const picked = answers[index]
        return (
          <div className="quiz" key={`${index}-${question.question}`}>
            <p className="quiz-ask">
              {question.difficulty && <span className="tag">{question.difficulty}</span>}
              {question.question}
            </p>
            <div className="pill-row">
              {(question.options ?? []).map((option) => (
                <button
                  key={option}
                  className={`ink-button ${picked === option ? 'is-on' : ''}`}
                  onClick={() => setAnswers({ ...answers, [index]: option })}
                >
                  {option}
                </button>
              ))}
            </div>
            {picked && (
              <p className={picked === question.answer ? 'verdict is-right' : 'verdict is-wrong'}>
                {picked === question.answer ? 'Correct.' : `Not quite — ${question.answer}.`}
                {question.explanation ? ` ${question.explanation}` : ''}
              </p>
            )}
          </div>
        )
      })}
    </PuzzleFrame>
  )
}
```

Create `frontend/src/puzzles/LogicPuzzle.jsx`:

```jsx
import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'

export function LogicPuzzle({ puzzle }) {
  const data = puzzle.puzzle ?? {}
  const [choice, setChoice] = useState('')

  return (
    <PuzzleFrame title={puzzle.title}>
      <p className="logic-setup">{data.setup}</p>
      <div className="pill-row">
        {(data.choices ?? []).map((option) => (
          <button
            key={option}
            className={`ink-button ${choice === option ? 'is-on' : ''}`}
            onClick={() => setChoice(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {choice && (
        <p className={choice === data.answer ? 'verdict is-right' : 'verdict is-wrong'}>
          {choice === data.answer ? 'Correct.' : 'Not quite.'}
        </p>
      )}
    </PuzzleFrame>
  )
}
```

- [ ] **Step 4: Style the puzzles**

Create `frontend/src/puzzles/puzzles.css`:

```css
.puzzle-frame {
  border: var(--rule);
  background: var(--paper);
  box-shadow: 7px 7px 0 var(--ink);
  padding: 1.5rem;
  margin-bottom: 2.5rem;
}

.puzzle-title { text-transform: uppercase; color: var(--red); }

/* One grid rule for every square-cell puzzle. --size is the column count. */
.grid-ink {
  display: grid;
  grid-template-columns: repeat(var(--size, 7), minmax(0, 1fr));
  gap: 2px;
  background: var(--ink);
  border: var(--rule);
  max-width: 32rem;
  margin: 1rem 0;
}

.grid-ink .cell,
.grid-ink input {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  width: 100%;
  border: 0;
  background: var(--paper);
  font-family: var(--chrome);
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  padding: 0;
}

.grid-ink .cell.is-static { cursor: default; }
.grid-ink .cell.is-wall { background: var(--ink); }
.grid-ink .cell.is-marked { background: var(--yellow); }

.clues { font-family: var(--body); padding-left: 1.2rem; }
.clues .chrome-line { color: var(--red); }

.pill-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0; }

.ink-button.is-struck { text-decoration: line-through; opacity: 0.5; }

.quiz { border-top: var(--rule-thin); padding-top: 1rem; margin-top: 1rem; }
.quiz-ask { font-weight: 700; }

.tag {
  display: inline-block;
  font-family: var(--chrome);
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  background: var(--yellow);
  border: var(--rule-thin);
  padding: 0.1rem 0.4rem;
  margin-right: 0.5rem;
}

.verdict { font-family: var(--chrome); letter-spacing: 0.06em; }
.verdict.is-right { color: var(--red); }
.verdict.is-wrong { color: var(--ink-soft); }

.logic-setup { font-size: 1.1rem; }
```

- [ ] **Step 5: Delete the old copies from App.jsx**

Remove `MagazineSection`, `Crossword`, `Maze`, `WordSearch`, `Trivia`, and `LogicPuzzle` from `frontend/src/App.jsx` (originally lines 243–341). Leave the `Puzzle` dispatcher alone for now — Task 8 replaces it.

- [ ] **Step 6: Verify**

```bash
npm run build
```

Expected: build fails with unresolved references to the deleted components inside `App.jsx`'s `Puzzle` and `Issue` functions. That is expected and Task 8 fixes it. To keep the tree green now, temporarily import them at the top of `App.jsx`:

```jsx
import { PuzzleFrame } from './puzzles/PuzzleFrame'
import { Crossword } from './puzzles/Crossword'
import { Maze } from './puzzles/Maze'
import { WordSearch } from './puzzles/WordSearch'
import { Trivia } from './puzzles/Trivia'
import { LogicPuzzle } from './puzzles/LogicPuzzle'
```

and change `MagazineSection` call sites to `PuzzleFrame`. Re-run:

```bash
npm run build && npm test
```

Expected: build succeeds, `pass 10`, `fail 0`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/puzzles frontend/src/App.jsx
git commit -m "refactor(ui): move existing puzzle renderers into their own files"
```

---

### Task 6: SpellingBee renderer

New. The backend already produces `spelling-bee`; the frontend has been dumping it as JSON.

**Files:**
- Create: `frontend/src/puzzles/SpellingBee.jsx`
- Modify: `frontend/src/puzzles/puzzles.css` (append)

**Interfaces:**
- Consumes: `checkBeeWord`, `beeProgress`, `shuffle` from `puzzles/logic.js`; `PuzzleFrame`
- Produces: `<SpellingBee puzzle />` where `puzzle.puzzle` is `{ letters: string[7], center: string, minLength: number, words: string[], pangrams: string[] }`

- [ ] **Step 1: Write the component**

Create `frontend/src/puzzles/SpellingBee.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { beeProgress, checkBeeWord, shuffle } from './logic'

const MESSAGES = {
  empty: 'Type a word first.',
  short: (data) => `Too short — ${data.minLength ?? 4} letters minimum.`,
  'no-center': (data) => `Every word must use ${data.center}.`,
  'bad-letter': 'That uses a letter outside the seven.',
  already: 'Already found.',
  unknown: 'Not on this list.',
}

export function SpellingBee({ puzzle }) {
  const data = puzzle.puzzle ?? {}
  const center = String(data.center ?? '').toUpperCase()
  const letters = (data.letters ?? []).map((letter) => letter.toUpperCase())
  const outer = useMemo(
    () => shuffle(letters.filter((letter) => letter !== center), letters.length || 1),
    [letters, center],
  )

  const [entry, setEntry] = useState('')
  const [found, setFound] = useState([])
  const [message, setMessage] = useState('')
  const progress = beeProgress(found, data)

  function submit(event) {
    event.preventDefault()
    const result = checkBeeWord(entry, data, found)
    if (result.status === 'ok') {
      setFound((old) => [...old, result.word].sort())
      setMessage(result.pangram ? `Pangram! ${result.word}` : `Good — ${result.word}`)
      setEntry('')
      return
    }
    const template = MESSAGES[result.status]
    setMessage(typeof template === 'function' ? template(data) : template)
  }

  return (
    <PuzzleFrame
      title={puzzle.title}
      note={`${progress.found} of ${progress.total} words · ${progress.pangramsFound}/${progress.pangramsTotal} pangrams`}
    >
      <div className="bee">
        <ul className="bee-hive">
          <li><button type="button" className="bee-cell is-center" onClick={() => setEntry((old) => old + center)}>{center}</button></li>
          {outer.map((letter) => (
            <li key={letter}>
              <button type="button" className="bee-cell" onClick={() => setEntry((old) => old + letter)}>{letter}</button>
            </li>
          ))}
        </ul>

        <form className="bee-form" onSubmit={submit}>
          <input
            value={entry}
            onChange={(event) => setEntry(event.target.value.toUpperCase())}
            placeholder="TYPE A WORD"
            aria-label="Your word"
            autoComplete="off"
          />
          <button className="ink-button">Enter</button>
          <button className="ink-button" type="button" onClick={() => setEntry('')}>Clear</button>
        </form>

        {message && <p className="verdict">{message}</p>}

        <div className="bee-bar" aria-hidden="true"><span style={{ width: `${progress.percent}%` }} /></div>

        <div className="pill-row">
          {found.map((word) => <span key={word} className="ink-button is-found">{word}</span>)}
        </div>
      </div>
    </PuzzleFrame>
  )
}
```

- [ ] **Step 2: Style it**

Append to `frontend/src/puzzles/puzzles.css`:

```css
.bee-hive {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 1rem 0;
  max-width: 22rem;
}

.bee-cell {
  width: 100%;
  aspect-ratio: 1;
  border: var(--rule);
  background: var(--paper-2);
  box-shadow: 3px 3px 0 var(--ink);
  font-family: var(--display);
  font-size: 1.8rem;
  clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
}

.bee-cell.is-center { background: var(--yellow); color: var(--ink); }

.bee-form { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }

.bee-form input {
  flex: 1 1 12rem;
  border: var(--rule);
  background: var(--paper);
  padding: 0.55rem 0.7rem;
  font-family: var(--chrome);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.bee-bar { height: 10px; border: var(--rule); background: var(--paper-2); margin: 0.75rem 0; }
.bee-bar span { display: block; height: 100%; background: var(--red); transition: width 160ms; }

.ink-button.is-found { background: var(--paper-2); box-shadow: none; cursor: default; }
```

- [ ] **Step 3: Verify**

```bash
npm run build && npm test
```

Expected: build succeeds, `pass 10`, `fail 0`. The scoring rules this component depends on are already covered by the `checkBeeWord` and `beeProgress` tests from Task 3.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/puzzles
git commit -m "feat(ui): add spelling bee renderer"
```

---

### Task 7: Connections renderer

**Files:**
- Create: `frontend/src/puzzles/Connections.jsx`
- Modify: `frontend/src/puzzles/puzzles.css` (append)

**Interfaces:**
- Consumes: `toggleSelection`, `checkConnectionsGuess`, `connectionsNearMiss`, `shuffle` from `puzzles/logic.js`; `PuzzleFrame`
- Produces: `<Connections puzzle />` where `puzzle.puzzle` is `{ groups: [{ category: string, words: string[4] }] }`

- [ ] **Step 1: Write the component**

Create `frontend/src/puzzles/Connections.jsx`:

```jsx
import { useMemo, useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { checkConnectionsGuess, connectionsNearMiss, shuffle, toggleSelection } from './logic'

const BANDS = ['var(--yellow)', 'var(--vermilion)', 'var(--violet)', 'var(--magenta)']
const MISTAKE_LIMIT = 4

export function Connections({ puzzle }) {
  const groups = puzzle.puzzle?.groups ?? []
  const board = useMemo(
    () => shuffle(groups.flatMap((group) => group.words ?? []), groups.length + 11),
    [groups],
  )

  const [selection, setSelection] = useState([])
  const [solved, setSolved] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [message, setMessage] = useState('')

  const locked = new Set(solved.flatMap((group) => group.words))
  const remaining = board.filter((word) => !locked.has(word))
  const over = mistakes >= MISTAKE_LIMIT
  const won = solved.length === groups.length && groups.length > 0

  function submit() {
    const result = checkConnectionsGuess(groups, selection)
    if (result.correct) {
      setSolved((old) => [...old, { category: result.category, words: result.words }])
      setSelection([])
      setMessage('')
      return
    }
    setMistakes((old) => old + 1)
    setMessage(connectionsNearMiss(groups, selection) ? 'One away.' : 'Not a group.')
  }

  return (
    <PuzzleFrame
      title={puzzle.title}
      note={`Pick four that belong together · ${MISTAKE_LIMIT - mistakes} mistakes left`}
    >
      {solved.map((group, index) => (
        <div className="conn-band" key={group.category} style={{ '--band': BANDS[index % BANDS.length] }}>
          <strong>{group.category}</strong>
          <span>{group.words.join(' · ')}</span>
        </div>
      ))}

      {!won && !over && (
        <>
          <div className="conn-board">
            {remaining.map((word) => (
              <button
                key={word}
                className={`conn-word ${selection.includes(word) ? 'is-on' : ''}`}
                onClick={() => setSelection((old) => toggleSelection(old, word))}
              >
                {word}
              </button>
            ))}
          </div>

          <div className="pill-row">
            <button className="ink-button" disabled={selection.length !== 4} onClick={submit}>Submit</button>
            <button className="ink-button" onClick={() => setSelection([])}>Deselect</button>
          </div>
        </>
      )}

      {message && !won && <p className="verdict is-wrong">{message}</p>}
      {won && <p className="verdict is-right">All four groups. Cleanly done.</p>}
      {over && !won && (
        <div className="conn-reveal">
          <p className="verdict is-wrong">Out of guesses. The groups were:</p>
          {groups.map((group) => (
            <p key={group.category}><strong>{group.category}</strong> — {group.words.join(' · ')}</p>
          ))}
        </div>
      )}
    </PuzzleFrame>
  )
}
```

- [ ] **Step 2: Style it**

Append to `frontend/src/puzzles/puzzles.css`:

```css
.conn-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
}

.conn-word {
  min-height: 4.2rem;
  border: var(--rule);
  background: var(--paper-2);
  box-shadow: 3px 3px 0 var(--ink);
  font-family: var(--chrome);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.3rem;
  word-break: break-word;
}

.conn-word.is-on { background: var(--ink); color: var(--paper); box-shadow: none; }

.conn-band {
  display: grid;
  gap: 0.2rem;
  background: var(--band, var(--yellow));
  border: var(--rule);
  padding: 0.7rem 0.9rem;
  margin-bottom: 0.5rem;
  font-family: var(--chrome);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.8rem;
}

.conn-reveal { border-top: var(--rule-thin); margin-top: 1rem; padding-top: 1rem; }

@media (max-width: 520px) {
  .conn-board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bee-hive { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
```

- [ ] **Step 3: Verify**

```bash
npm run build && npm test
```

Expected: build succeeds, `pass 10`, `fail 0`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/puzzles
git commit -m "feat(ui): add connections renderer"
```

---

### Task 8: Puzzle registry

Replaces the `if` chain and closes the drift that let `spelling-bee` and `connections` fall through to a JSON dump.

**Files:**
- Create: `frontend/src/puzzles/index.jsx` — the `.jsx` extension matters: Vite's React plugin only transforms `.jsx`, and this file contains JSX. Vite still resolves `import … from './puzzles'` to `index.jsx`.
- Modify: `frontend/src/App.jsx` (delete the `Puzzle` function, originally lines 247–254)

**Interfaces:**
- Consumes: all six renderer components
- Produces:
  - `<PuzzleRenderer puzzle />` — dispatches on `puzzle.type`, renders a labelled placeholder for unknown types

`PUZZLE_RENDERERS` stays module-private. Nothing outside this file consumes it — Tasks 9 and 10 import only `PuzzleRenderer` — and exporting it would trip `react-refresh/only-export-components`, since that rule fires on any exported non-component value sharing a file with an exported component. Keeping it unexported avoids a lint suppression that would exist purely to protect an unused export.

- [ ] **Step 1: Write the registry**

Create `frontend/src/puzzles/index.jsx`:

```jsx
import { Crossword } from './Crossword'
import { Maze } from './Maze'
import { WordSearch } from './WordSearch'
import { SpellingBee } from './SpellingBee'
import { Connections } from './Connections'
import { Trivia } from './Trivia'
import { LogicPuzzle } from './LogicPuzzle'
import { PuzzleFrame } from './PuzzleFrame'
import { SECTION_LABELS } from './logic'

// A lookup table, not a factory. Adding a backend puzzle type means adding one
// line here; anything missing renders a visible placeholder rather than a JSON dump.
// Not exported: nothing outside this file needs it, and exporting it would trip
// react-refresh/only-export-components.
const PUZZLE_RENDERERS = {
  crossword: Crossword,
  maze: Maze,
  'word-search': WordSearch,
  'spelling-bee': SpellingBee,
  connections: Connections,
  trivia: Trivia,
  reasoning: Trivia,
  logic: LogicPuzzle,
}

export function PuzzleRenderer({ puzzle }) {
  const Renderer = PUZZLE_RENDERERS[puzzle.type]
  if (Renderer) return <Renderer puzzle={puzzle} />

  return (
    <PuzzleFrame title={puzzle.title || SECTION_LABELS[puzzle.type] || puzzle.type}>
      <p className="verdict is-wrong">No renderer for “{puzzle.type}” yet.</p>
    </PuzzleFrame>
  )
}
```

- [ ] **Step 2: Point App.jsx at it**

In `frontend/src/App.jsx`, delete the `Puzzle` function, remove **five** of the six per-renderer imports added in Task 5, and add the line below. Keep the `PuzzleFrame` import: `App.jsx` still uses it directly for the Editor's Note, Article, and Teaser blocks, which have nothing to do with puzzle dispatch. Task 9 removes those call sites and the import with them.

```jsx
import { PuzzleRenderer } from './puzzles'
```

Replace both `<Puzzle puzzle={...} />` call sites (in `Issue` and in the admin draft list) with `<PuzzleRenderer puzzle={...} />`.

- [ ] **Step 3: Verify every backend type resolves**

```bash
node -e "
const types = ['crossword','maze','word-search','spelling-bee','connections','trivia','logic','reasoning']
const src = require('fs').readFileSync('src/puzzles/index.jsx','utf8')
const missing = types.filter(t => !src.includes(\`'\${t}'\`) && !src.includes(\`  \${t}:\`))
console.log(missing.length ? 'MISSING: ' + missing.join(', ') : 'all 8 types registered')
"
```

Expected: `all 8 types registered`

- [ ] **Step 4: Build and test**

```bash
npm run build && npm test
```

Expected: build succeeds, `pass 10`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/puzzles frontend/src/App.jsx
git commit -m "feat(ui): replace puzzle if-chain with a registry, wire bee and connections"
```

---

### Task 9: Reader pages

**Files:**
- Create: `frontend/src/pages/Home.jsx`, `Archive.jsx`, `IssuePage.jsx`, `About.jsx`, `pages.css`
- Modify: `frontend/src/App.jsx` (delete `Home`, `Archive`, `Issue`, `About`, `Subscribe`, originally lines 160–245 and 343–371)

**Interfaces:**
- Consumes: `Poster`, `SectionDivider`, `Subscribe` from `components/`; `PuzzleRenderer` from `puzzles/`; `SECTION_LABELS` and `devanagariNumber`
- Produces:
  - `<Home issue issues navigate setNotice />`
  - `<Archive issues navigate />`
  - `<IssuePage issue />`
  - `<About />`

- [ ] **Step 1: Write Home**

Create `frontend/src/pages/Home.jsx`:

```jsx
import { Poster } from '../components/Poster'
import { Subscribe } from '../components/Subscribe'
import { devanagariNumber } from '../lib/devanagari'
import { SECTION_LABELS } from '../puzzles/logic'
import './pages.css'

export function Home({ issue, issues, navigate, setNotice }) {
  return (
    <main>
      <Poster
        issue={issue}
        kicker="Fresh off the press"
        action={
          <button className="ink-button poster-action" onClick={() => navigate(`/issues/${issue.slug}`)}>
            Read this issue
          </button>
        }
      />

      <div className="page-width columns">
        <article className="col-main">
          <p className="chrome-line">This issue's story</p>
          <h2>{issue.articleTitle}</h2>
          <p>{issue.articleBody}</p>
        </article>

        <aside className="col-side">
          <p className="chrome-line">Inside</p>
          <ol className="contents">
            {(issue.puzzles ?? []).map((puzzle, index) => (
              <li key={puzzle.id ?? puzzle.type}>
                <span className="contents-number">{devanagariNumber(String(index + 1).padStart(2, '0'))}</span>
                <span>{puzzle.title || SECTION_LABELS[puzzle.type] || puzzle.type}</span>
              </li>
            ))}
          </ol>
          <Subscribe setNotice={setNotice} />
        </aside>
      </div>

      <section className="page-width back-issues">
        <h2>Back issues</h2>
        <div className="issue-cards">
          {/* The featured issue is already the hero above; listing it again as a back issue reads as a bug. */}
          {issues.filter((old) => old.slug !== issue.slug).map((old) => (
            <button key={old.slug} className="issue-card" onClick={() => navigate(`/issues/${old.slug}`)}>
              <span className="issue-card-number">{devanagariNumber(String(old.number).padStart(3, '0'))}</span>
              <strong>{old.theme ?? old.title}</strong>
              <span className="chrome-line">{old.teaser}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Write IssuePage**

Create `frontend/src/pages/IssuePage.jsx`:

```jsx
import { Poster } from '../components/Poster'
import { SectionDivider } from '../components/SectionDivider'
import { PuzzleRenderer } from '../puzzles'
import { SECTION_LABELS } from '../puzzles/logic'
import './pages.css'

export function IssuePage({ issue }) {
  const date = issue.publishedAt
    ? new Date(issue.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Draft preview'

  return (
    <main>
      <Poster issue={issue} kicker={date} />

      <div className="page-width">
        <SectionDivider index={0} type="editorNote" title="Editor's note" />
        <div className="prose"><p>{issue.editorNote}</p></div>

        <SectionDivider index={1} type="article" title={issue.articleTitle || SECTION_LABELS.article} />
        <div className="prose"><p>{issue.articleBody}</p></div>

        {(issue.puzzles ?? []).map((puzzle, index) => (
          <div key={puzzle.id ?? puzzle.type}>
            <SectionDivider
              index={index + 2}
              type={puzzle.type}
              title={puzzle.title || SECTION_LABELS[puzzle.type] || puzzle.type}
            />
            <PuzzleRenderer puzzle={puzzle} />
          </div>
        ))}

        <SectionDivider index={(issue.puzzles?.length ?? 0) + 2} type="teaser" title="Next issue" />
        <div className="prose"><p>{issue.teaser}</p></div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Write Archive and About**

Create `frontend/src/pages/Archive.jsx`:

```jsx
import { devanagariNumber } from '../lib/devanagari'
import './pages.css'

export function Archive({ issues, navigate }) {
  return (
    <main className="page-width">
      <h1 className="misprint">Archive</h1>
      <p className="chrome-line">Every issue, still playable</p>
      <div className="issue-cards">
        {issues.map((issue) => (
          <button key={issue.slug} className="issue-card" onClick={() => navigate(`/issues/${issue.slug}`)}>
            <span className="issue-card-number">{devanagariNumber(String(issue.number).padStart(3, '0'))}</span>
            <strong>{issue.theme ?? issue.title}</strong>
            <span className="chrome-line">{issue.teaser}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
```

Create `frontend/src/pages/About.jsx`:

```jsx
import './pages.css'

export function About() {
  return (
    <main className="page-width">
      <h1 className="misprint">About</h1>
      <div className="prose">
        <p>
          Puzzle Press is a human-reviewed, AI-assisted retro magazine. Every few days a themed
          issue collects a short article and a stack of playable puzzles into one paper-like web
          edition — crossword, maze, word search, spelling bee, connections, trivia, logic, and
          reasoning.
        </p>
        <p>Nothing publishes until a person has read it, solved it, and approved it.</p>
      </div>
      <p className="chrome-line">पहेली प्रेस · 110030</p>
    </main>
  )
}
```

- [ ] **Step 4: Style the pages**

Create `frontend/src/pages/pages.css`:

```css
.poster-action { background: var(--yellow); margin-top: 1.25rem; }

.columns {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 2.5rem;
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
}

.col-main { border-right: var(--rule-thin); padding-right: 2.5rem; }
.col-main h2 { text-transform: uppercase; }
.col-side { display: grid; gap: 1.25rem; align-content: start; }

.contents { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.35rem; }

.contents li {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  border-bottom: 1px dotted var(--ink-soft);
  padding-bottom: 0.3rem;
}

.contents-number { font-family: var(--display); color: var(--red); font-size: 1.15rem; }

.prose { max-width: 42rem; font-size: 1.05rem; }

.back-issues { padding-bottom: 4rem; }
.back-issues h2 { text-transform: uppercase; border-top: 6px double var(--ink); padding-top: 0.75rem; }

.issue-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 3rem;
}

.issue-card {
  display: grid;
  gap: 0.35rem;
  text-align: left;
  border: var(--rule);
  background: var(--paper-2);
  box-shadow: 6px 6px 0 var(--red);
  padding: 1rem;
}

.issue-card:hover { box-shadow: 3px 3px 0 var(--red); transform: translate(3px, 3px); }
.issue-card-number { font-family: var(--display); font-size: 2.2rem; line-height: 1; color: var(--red); }
.issue-card strong { font-family: var(--display); font-size: 1.3rem; font-weight: 400; }

@media (max-width: 860px) {
  .columns { grid-template-columns: 1fr; }
  .col-main { border-right: 0; padding-right: 0; }
}
```

- [ ] **Step 5: Verify**

```bash
npm run build
```

Expected: build fails on the now-duplicated definitions still inside `App.jsx`. Delete `Home`, `Archive`, `Issue`, `About`, and `Subscribe` from `App.jsx` and import the new ones:

```jsx
import { Home } from './pages/Home'
import { Archive } from './pages/Archive'
import { IssuePage } from './pages/IssuePage'
import { About } from './pages/About'
```

Change the `{route.startsWith('/issues/') && <Issue issue={currentIssue} />}` line to use `<IssuePage issue={currentIssue} />`. Re-run:

```bash
npm run build && npm test
```

Expected: build succeeds, `pass 10`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages frontend/src/App.jsx
git commit -m "feat(ui): split reader pages out of App and restyle as newsprint magazine"
```

---

### Task 10: Admin desk split and drift fix

The admin's `SECTIONS` array is hardcoded and already missing `spelling-bee` and `connections`. Deriving the buttons from the issue's own puzzle list means it can never drift from the backend's `puzzleTypes` again.

**Files:**
- Create: `frontend/src/pages/admin/AdminPage.jsx`, `IssueList.jsx`, `DraftReview.jsx`, `GenerateBar.jsx`, `admin.css`
- Modify: `frontend/src/App.jsx` (delete `Admin`, originally lines 373–524, and the `SECTIONS` constant, line 7)

**Interfaces:**
- Consumes: `fetchAdmin` from `lib/api.js`, `authClient`, `PuzzleRenderer`, `SECTION_LABELS`
- Produces:
  - `<AdminPage issues setIssues selectedIssueId setSelectedIssueId setNotice />`
  - `<IssueList issues selectedIssueId onSelect />`
  - `<GenerateBar sections busy onGenerate />`
  - `<DraftReview issue prompt setPrompt busy onGenerate onPublish />`

- [ ] **Step 1: Write GenerateBar and IssueList**

Create `frontend/src/pages/admin/GenerateBar.jsx`:

```jsx
import { SECTION_LABELS } from '../../puzzles/logic'
import './admin.css'

export function GenerateBar({ sections, busy, onGenerate }) {
  return (
    <div className="pill-row">
      {sections.map((section) => (
        <button
          key={section}
          className="ink-button"
          disabled={Boolean(busy)}
          onClick={() => onGenerate(section)}
        >
          {busy === `Generate ${section}` ? 'Working…' : `Remake ${SECTION_LABELS[section] ?? section}`}
        </button>
      ))}
    </div>
  )
}
```

Create `frontend/src/pages/admin/IssueList.jsx`:

```jsx
import './admin.css'

export function IssueList({ issues, selectedIssueId, onSelect }) {
  return (
    <div className="issue-list">
      <h2>Issues</h2>
      {issues.length === 0 && <p className="chrome-line">No issues yet.</p>}
      {issues.map((issue) => (
        <button
          key={issue.id}
          className={`admin-row ${issue.id === selectedIssueId ? 'is-on' : ''}`}
          onClick={() => onSelect(issue.id)}
        >
          <strong>{issue.title}</strong>
          <span className="chrome-line">{issue.status}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write DraftReview**

Create `frontend/src/pages/admin/DraftReview.jsx`. The section list is derived, not hardcoded:

```jsx
import { GenerateBar } from './GenerateBar'
import { PuzzleRenderer } from '../../puzzles'
import { SECTION_LABELS } from '../../puzzles/logic'
import './admin.css'

export function DraftReview({ issue, prompt, setPrompt, busy, onGenerate, onPublish }) {
  // Derived from the issue itself, so it tracks the backend's puzzleTypes automatically.
  const sections = ['article', ...(issue.puzzles ?? []).map((puzzle) => puzzle.type)]

  return (
    <section className="review">
      <h2>{issue.title} <span className="chrome-line">{issue.status}</span></h2>

      <label className="prompt-box">
        <span className="chrome-line">Prompt for the next generation. Blank uses the saved template.</span>
        <textarea
          rows="4"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="e.g. base the article on this story, change the names, keep it warm. Make the reasoning questions easier."
        />
      </label>

      <GenerateBar sections={sections} busy={busy} onGenerate={onGenerate} />

      <article className="draft">
        <h3>{SECTION_LABELS.article}</h3>
        <p className="chrome-line">{issue.articleTitle}</p>
        <p><em>{issue.editorNote}</em></p>
        <p>{issue.articleBody}</p>
        <p><strong>Teaser:</strong> {issue.teaser}</p>
      </article>

      {(issue.puzzles ?? []).map((puzzle) => (
        <article className="draft" key={puzzle.id ?? puzzle.type}>
          <h3>{SECTION_LABELS[puzzle.type] ?? puzzle.type}</h3>
          {puzzle.prompt && <p className="chrome-line">Prompt used: {puzzle.prompt}</p>}
          <PuzzleRenderer puzzle={puzzle} />
          <details>
            <summary className="chrome-line">Answers and hints</summary>
            <pre>{JSON.stringify({ solution: puzzle.solution, hints: puzzle.hints }, null, 2)}</pre>
          </details>
        </article>
      ))}

      <div className="pill-row">
        <button className="ink-button publish" disabled={Boolean(busy)} onClick={onPublish}>
          {busy === 'Publish' ? 'Publishing…' : 'Publish and email subscribers'}
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Write AdminPage**

Create `frontend/src/pages/admin/AdminPage.jsx`:

```jsx
import { useState } from 'react'
import { authClient } from '../../lib/authClient'
import { fetchAdmin } from '../../lib/api'
import { IssueList } from './IssueList'
import { DraftReview } from './DraftReview'
import './admin.css'

export function AdminPage({ issues, setIssues, selectedIssueId, setSelectedIssueId, setNotice }) {
  const { data: session, isPending } = authClient.useSession()
  const selected = issues.find((issue) => issue.id === selectedIssueId) ?? issues[0]

  const [theme, setTheme] = useState('Space')
  const [title, setTitle] = useState('Issue Draft: Space')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState('')

  async function run(label, action) {
    setBusy(label)
    try {
      await action()
    } catch {
      setNotice(`${label} failed. If this account is not on the editor allowlist, the API refuses it.`)
    } finally {
      setBusy('')
    }
  }

  async function createIssue(event) {
    event.preventDefault()
    await run('Create draft', async () => {
      const data = await fetchAdmin('/api/admin/issues', { method: 'POST', body: JSON.stringify({ title, theme }) })
      setIssues([data.issue, ...issues])
      setSelectedIssueId(data.issue.id)
      setNotice('Draft issue created.')
    })
  }

  async function generate(section) {
    await run(`Generate ${section}`, async () => {
      await fetchAdmin(`/api/admin/issues/${selected.id}/generate/${section}`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      })
      const refreshed = await fetchAdmin('/api/admin/issues')
      setIssues(refreshed.issues)
      setNotice(`Regenerated ${section}.`)
    })
  }

  async function publish() {
    if (!window.confirm(`Publish "${selected.title}" and email every active subscriber?`)) return
    await run('Publish', async () => {
      const data = await fetchAdmin(`/api/admin/issues/${selected.id}/publish`, { method: 'POST' })
      setIssues(issues.map((issue) => (issue.id === data.issue.id ? data.issue : issue)))
      setNotice(`Published and queued ${data.emailSends} email sends.`)
    })
  }

  if (isPending) {
    return <main className="page-width admin"><h1>The Desk</h1><p className="chrome-line">Checking session…</p></main>
  }

  if (!session?.user) {
    return (
      <main className="page-width admin">
        <h1 className="misprint">The Desk</h1>
        <p>Google login is required to review drafts and publish issues.</p>
        <button className="ink-button" onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/admin' })}>
          Sign in with Google
        </button>
      </main>
    )
  }

  return (
    <main className="page-width admin">
      <div className="admin-head">
        <h1 className="misprint">The Desk</h1>
        <p className="chrome-line">{session.user.email}</p>
        <button className="ink-button" onClick={() => authClient.signOut().then(() => setIssues([]))}>Sign out</button>
      </div>

      <div className="admin-grid">
        <form className="admin-create" onSubmit={createIssue}>
          <h2>New issue</h2>
          <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Issue title" />
          <input value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Theme" />
          <button className="ink-button">Create draft</button>
        </form>

        <IssueList issues={issues} selectedIssueId={selected?.id} onSelect={setSelectedIssueId} />
      </div>

      {selected && (
        <DraftReview
          issue={selected}
          prompt={prompt}
          setPrompt={setPrompt}
          busy={busy}
          onGenerate={generate}
          onPublish={publish}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 4: Style the desk**

Create `frontend/src/pages/admin/admin.css`:

```css
.admin { padding-top: 2rem; padding-bottom: 4rem; }

.admin-head { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
.admin-head h1 { margin-right: auto; }

.admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.admin-create { display: grid; gap: 0.6rem; align-content: start; border: var(--rule); padding: 1.25rem; background: var(--paper-2); }
.admin-create input { border: var(--rule); background: var(--paper); padding: 0.5rem 0.7rem; }

.issue-list { display: grid; gap: 0.4rem; align-content: start; }

.admin-row {
  display: grid;
  gap: 0.15rem;
  text-align: left;
  border: var(--rule-thin);
  background: var(--paper);
  padding: 0.6rem 0.8rem;
}

.admin-row.is-on { background: var(--yellow); border: var(--rule); }

.review { border-top: 6px double var(--ink); padding-top: 1.5rem; }
.prompt-box { display: grid; gap: 0.4rem; margin: 1rem 0; }
.prompt-box textarea { border: var(--rule); background: var(--paper); padding: 0.7rem; }

.draft { border: var(--rule-thin); padding: 1.25rem; margin: 1.25rem 0; background: var(--paper-2); }
.draft h3 { text-transform: uppercase; color: var(--red); }
.draft pre { overflow-x: auto; background: var(--ink); color: var(--paper); padding: 0.8rem; font-size: 0.78rem; }

.ink-button.publish { background: var(--red); color: var(--paper); }

@media (max-width: 860px) {
  .admin-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 5: Remove the old Admin from App.jsx**

Delete the `Admin` function and the `SECTIONS` constant from `frontend/src/App.jsx`, and import the new page:

```jsx
import { AdminPage } from './pages/admin/AdminPage'
```

Replace the `<Admin ... />` call site with `<AdminPage ... />` keeping the same props.

- [ ] **Step 6: Confirm the drift is gone**

```bash
grep -rn "SECTIONS" src/ && echo "STILL HARDCODED" || echo "no hardcoded section list"
```

Expected: `no hardcoded section list`

- [ ] **Step 7: Build and test**

```bash
npm run build && npm test && npm run lint
```

Expected: all three succeed.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/admin frontend/src/App.jsx
git commit -m "refactor(ui): split admin desk into components, derive section list from issue"
```

---

### Task 11: Reduce App.jsx to router and shell

**Files:**
- Modify: `frontend/src/App.jsx` (full rewrite)
- Delete: `frontend/src/App.css`
- Delete: `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg` (unused scaffolding)

**Interfaces:**
- Consumes: everything built in Tasks 2–10
- Produces: `App` default export

- [ ] **Step 1: Rewrite App.jsx**

Replace `frontend/src/App.jsx` entirely:

```jsx
import { useEffect, useMemo, useState } from 'react'
import { fetchJson, fetchAdmin } from './lib/api'
import { useRoute } from './lib/useRoute'
import { Masthead } from './components/Masthead'
import { Notice } from './components/Notice'
import { Home } from './pages/Home'
import { Archive } from './pages/Archive'
import { IssuePage } from './pages/IssuePage'
import { About } from './pages/About'
import { AdminPage } from './pages/admin/AdminPage'
import { EMPTY_ISSUE } from './lib/emptyIssue'

export default function App() {
  const { route, navigate } = useRoute()
  const [latestIssue, setLatestIssue] = useState(EMPTY_ISSUE)
  const [issues, setIssues] = useState([])
  const [adminIssues, setAdminIssues] = useState([])
  const [selectedIssueId, setSelectedIssueId] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetchJson('/api/issues/latest')
      .then((data) => data.issue && setLatestIssue(data.issue))
      .catch(() => setNotice('Could not reach the press. Is the API running?'))
    fetchJson('/api/issues')
      .then((data) => data.issues?.length && setIssues(data.issues))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!route.startsWith('/admin')) return
    fetchAdmin('/api/admin/issues')
      .then((data) => {
        setAdminIssues(data.issues ?? [])
        setSelectedIssueId((current) => current || data.issues?.[0]?.id || '')
      })
      .catch(() => setNotice('Admin API unavailable, or Google login is required.'))
  }, [route])

  const currentIssue = useMemo(() => {
    if (!route.startsWith('/issues/')) return latestIssue
    const slug = route.split('/').filter(Boolean)[1]
    return issues.find((issue) => issue.slug === slug) ?? latestIssue
  }, [issues, latestIssue, route])

  return (
    <div className="grain">
      <Masthead navigate={navigate} issueNumber={latestIssue.number} />

      {route === '/' && <Home issue={latestIssue} issues={issues} navigate={navigate} setNotice={setNotice} />}
      {route === '/issues' && <Archive issues={issues} navigate={navigate} />}
      {route.startsWith('/issues/') && <IssuePage issue={currentIssue} />}
      {route === '/about' && <About />}
      {route.startsWith('/admin') && (
        <AdminPage
          issues={adminIssues}
          setIssues={setAdminIssues}
          selectedIssueId={selectedIssueId}
          setSelectedIssueId={setSelectedIssueId}
          setNotice={setNotice}
        />
      )}

      <footer className="page-width site-footer">
        <span className="chrome-line">पहेली प्रेस · Puzzle Press</span>
        <span className="chrome-line">110030 · Printed in the browser</span>
      </footer>

      <Notice message={notice} onDismiss={() => setNotice('')} />
    </div>
  )
}
```

- [ ] **Step 2: Add the empty-state issue**

The old file carried an 84-line `demoIssue` literal as its offline fallback. That is now dead weight — a real API is running. Replace it with a minimal placeholder so the first paint before `fetch` resolves is not blank.

Create `frontend/src/lib/emptyIssue.js`:

```js
// Shown for the one frame between mount and the first API response, and if the
// API is unreachable. Deliberately not a full demo issue — the API is the source.
export const EMPTY_ISSUE = {
  number: 1,
  slug: '',
  title: 'Loading the issue',
  theme: 'पहेली',
  editorNote: '',
  articleTitle: '',
  articleBody: '',
  teaser: '',
  publishedAt: null,
  puzzles: [],
}
```

- [ ] **Step 3: Add the footer style**

Append to `frontend/src/styles/base.css`:

```css
.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  border-top: 6px double var(--ink);
  padding-top: 1rem;
  padding-bottom: 3rem;
  margin-top: 3rem;
}
```

- [ ] **Step 4: Delete the dead files**

```bash
rm src/App.css src/assets/react.svg src/assets/vite.svg
```

`src/assets/hero.png` is left alone in case it is referenced elsewhere; check first:

```bash
grep -rn "hero.png" src/ index.html || rm src/assets/hero.png
```

- [ ] **Step 5: Confirm App.jsx is actually small now**

```bash
wc -l src/App.jsx
```

Expected: fewer than 80 lines (it was 540).

- [ ] **Step 6: Full verification**

```bash
npm run lint && npm test && npm run build
```

Expected: lint clean, `pass 10` / `fail 0`, build succeeds.

- [ ] **Step 7: Verify against the live backend**

In one terminal:

```bash
cd ../backend && npm run dev
```

In another:

```bash
cd frontend && npm run dev
```

Open the printed URL and confirm, on the seeded Issue #001:

- Masthead shows पहेली over PUZZLE PRESS, with grain visible over the whole page
- The home poster is oxblood with sunburst rays and a halftone screen
- `/issues/issue-001-retro-gaming` renders all eight puzzles with numbered dividers
- **Spelling bee** shows a hex letter cluster and accepts a listed word
- **Connections** shows a 4×4 grid, locks a correct group into a coloured band, and says "One away" for a three-of-four guess
- No section renders as a raw JSON dump
- `/admin` shows a Remake button for every puzzle type including bee and connections

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(ui): reduce App to router and shell, drop demo issue and legacy CSS"
```

---

## Self-review notes

**Spec coverage** — every spec item maps to a task: structure (Tasks 2, 5, 8, 9, 10, 11), drift fixes (Tasks 8, 10), type (Task 1 step 5), colour tokens (Task 1 step 1), CSS-only texture (Task 1 step 2), Devanagari chrome (Tasks 3, 4), SpellingBee (Task 6), Connections (Task 7), testing (Task 3).

**Deferred to Project 2** — `mediaUrl` props exist on `Poster` and `SectionDivider` and default to `null`. No task generates or fetches an image. That is intentional: this plan ships a complete-looking site with zero generated media, and Project 2 fills the props in.

**Not in this plan** — Hindi content, server-side scoring, a routing library. All listed as out of scope in the spec.
