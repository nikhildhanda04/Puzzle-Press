export const SECTION_LABELS = {
  article: 'The Article',
  crossword: 'Crossword',
  maze: 'The Maze',
  'word-search': 'Word Search',
  'spelling-bee': 'Spelling Bee',
  connections: 'Connections',
  trivia: 'Trivia',
  logic: 'Logic',
  reasoning: 'Reasoning',
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
