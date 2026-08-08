import assert from 'node:assert/strict'
import test from 'node:test'
import { isAdminEmail } from '../src/middleware/adminAuth.js'
import { escapeHtml, signupAllowed } from '../src/controllers/publicController.js'
import { defaultPuzzle, puzzleTypes } from '../src/services/defaultPuzzles.js'
import { DEFAULT_GEMINI_MODELS, geminiModels, geminiMessage, validateSection } from '../src/services/aiService.js'
import { serializeIssue } from '../src/services/issueSerializer.js'

test('admin allowlist fails closed and ignores case and spacing', () => {
  delete process.env.ADMIN_EMAILS
  assert.equal(isAdminEmail('editor@example.com'), false, 'unset ADMIN_EMAILS must admit nobody')

  process.env.ADMIN_EMAILS = ''
  assert.equal(isAdminEmail('editor@example.com'), false)

  process.env.ADMIN_EMAILS = ' Editor@Example.com , second@example.com '
  assert.equal(isAdminEmail('editor@example.com'), true)
  assert.equal(isAdminEmail('SECOND@example.com'), true)
  assert.equal(isAdminEmail('stranger@example.com'), false)
  assert.equal(isAdminEmail(undefined), false)
  assert.equal(isAdminEmail(''), false)
})

test('escapeHtml neutralises markup in the unsubscribe page', () => {
  assert.equal(
    escapeHtml(`<script>alert("x")</script>&'`),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;',
  )
})

test('every puzzle type still has a default', () => {
  for (const type of puzzleTypes) {
    const puzzle = defaultPuzzle(type, 'Retro Gaming')
    assert.ok(puzzle.title, `${type} needs a title`)
    assert.ok(puzzle.puzzle, `${type} needs puzzle data`)
  }
})

test('every built-in default passes the same validation the LLM output must pass', () => {
  for (const type of puzzleTypes) {
    const result = validateSection(type, defaultPuzzle(type, 'Retro Gaming'))
    assert.ok(result.success, `${type} default is rejected: ${JSON.stringify(result.error?.issues)}`)
  }
})

test('validation rejects the LLM output that would break a page', () => {
  const unanswerable = {
    title: 'Reasoning',
    puzzle: { questions: [{ question: 'Pick one', options: ['a', 'b'], answer: 'c' }] },
  }
  assert.equal(validateSection('reasoning', unanswerable).success, false, 'answer outside its options must fail')

  assert.equal(validateSection('article', { articleTitle: 'x' }).success, false, 'article without a body must fail')
  assert.equal(validateSection('word-search', { title: 'x', puzzle: { grid: [] } }).success, false, 'empty grid must fail')
  assert.equal(validateSection('crossword', { title: 'x', puzzle: {} }).success, false, 'crossword without entries must fail')
  assert.equal(
    validateSection('logic', { title: 'x', puzzle: { setup: 's', choices: ['a', 'b'], answer: 'z' } }).success,
    false,
    'logic answer outside its choices must fail',
  )
})

test('model chain parses in order and falls back to the built-in list', () => {
  delete process.env.GEMINI_MODEL
  assert.deepEqual(geminiModels(), DEFAULT_GEMINI_MODELS)

  process.env.GEMINI_MODEL = ''
  assert.deepEqual(geminiModels(), DEFAULT_GEMINI_MODELS, 'an empty value must not mean an empty chain')

  process.env.GEMINI_MODEL = ' gemini-2.0-flash-lite , gemini-2.0-flash ,, gemini-2.5-flash '
  assert.deepEqual(geminiModels(), ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'])

  process.env.GEMINI_MODEL = 'only-one'
  assert.deepEqual(geminiModels(), ['only-one'])
})

test('google error envelopes are unwrapped to the human message', () => {
  const wrapped = new Error(JSON.stringify({ error: { code: 400, message: 'API key not valid.' } }))
  assert.equal(geminiMessage(wrapped), 'API key not valid.')
  assert.equal(geminiMessage(new Error('plain socket hang up')), 'plain socket hang up')
})

test('spelling bee validation catches the ways a model gets it wrong', () => {
  const base = defaultPuzzle('spelling-bee', 'Retro Gaming')
  const withPuzzle = (patch) => ({ ...base, puzzle: { ...base.puzzle, ...patch } })

  assert.equal(validateSection('spelling-bee', base).success, true, 'the built-in bee must be playable')

  assert.equal(
    validateSection('spelling-bee', withPuzzle({ words: [...base.puzzle.words, 'CARDIGAN'] })).success,
    false,
    'a word using letters outside the seven must fail',
  )
  assert.equal(
    validateSection('spelling-bee', withPuzzle({ words: [...base.puzzle.words, 'CODE'] })).success,
    false,
    'a word missing the centre letter must fail',
  )
  assert.equal(
    validateSection('spelling-bee', withPuzzle({ words: [...base.puzzle.words, 'ART'] })).success,
    false,
    'a word under the minimum length must fail',
  )
  assert.equal(
    validateSection('spelling-bee', withPuzzle({ words: ['CARD', 'CART', 'TRADE'] })).success,
    false,
    'no pangram must fail',
  )
  assert.equal(
    validateSection('spelling-bee', withPuzzle({ center: 'Z' })).success,
    false,
    'a centre outside the seven letters must fail',
  )
  assert.equal(
    validateSection('spelling-bee', withPuzzle({ letters: ['A', 'A', 'C', 'D', 'E', 'O', 'R'] })).success,
    false,
    'repeated letters in the set must fail',
  )
})

test('connections validation enforces four groups of four distinct words', () => {
  const base = defaultPuzzle('connections', 'Retro Gaming')
  assert.equal(validateSection('connections', base).success, true, 'the built-in grid must be solvable')

  const groups = base.puzzle.groups
  assert.equal(new Set(groups.flatMap((g) => g.words)).size, 16, 'the default grid holds sixteen distinct words')

  const duplicated = structuredClone(groups)
  duplicated[1].words[0] = duplicated[0].words[0]
  assert.equal(
    validateSection('connections', { ...base, puzzle: { groups: duplicated } }).success,
    false,
    'the same word in two groups must fail',
  )

  const short = structuredClone(groups)
  short[2].words.pop()
  assert.equal(
    validateSection('connections', { ...base, puzzle: { groups: short } }).success,
    false,
    'a group of three must fail',
  )
  assert.equal(
    validateSection('connections', { ...base, puzzle: { groups: groups.slice(0, 3) } }).success,
    false,
    'three groups must fail',
  )
})

test('public payloads drop the answer key and the editor source story', () => {
  const issue = {
    id: 'i1', number: 1, slug: 's', title: 't', theme: null, status: 'published',
    sourceStory: 'a real story about real people',
    puzzles: [{ id: 'p1', type: 'crossword', title: 'c', prompt: '', puzzle: { entries: [] }, solution: { entries: ['SECRET'] }, hints: ['h'], sortOrder: 1 }],
  }

  const publicView = serializeIssue(issue, { includeSolutions: false })
  assert.equal(publicView.puzzles[0].solution, undefined)
  assert.equal(publicView.sourceStory, undefined)
  assert.deepEqual(publicView.puzzles[0].hints, ['h'], 'hints stay public')
  assert.ok(!JSON.stringify(publicView).includes('SECRET'))
  assert.ok(!JSON.stringify(publicView).includes('real people'))

  assert.deepEqual(serializeIssue(issue).puzzles[0].solution, { entries: ['SECRET'] }, 'admin still sees answers')
})

test('signup rate limit allows a burst then blocks', () => {
  const now = 1_000_000
  for (let i = 0; i < 5; i += 1) {
    assert.equal(signupAllowed('1.2.3.4', now), true, `attempt ${i + 1} should pass`)
  }
  assert.equal(signupAllowed('1.2.3.4', now), false, 'sixth attempt in the window is blocked')
  assert.equal(signupAllowed('5.6.7.8', now), true, 'a different address is unaffected')
  assert.equal(signupAllowed('1.2.3.4', now + 61_000), true, 'the window expires')
})

test('reasoning questions are answerable as written', () => {
  const { questions } = defaultPuzzle('reasoning', 'Retro Gaming').puzzle

  assert.ok(questions.length >= 3)
  for (const question of questions) {
    assert.equal(question.options.length, 4, `${question.question} needs four options`)
    assert.equal(new Set(question.options).size, 4, `${question.question} has a duplicate option`)
    assert.ok(question.options.includes(question.answer), `${question.question} answer is not an option`)
    assert.ok(['easy', 'medium'].includes(question.difficulty), `${question.question} difficulty must be easy or medium`)
    assert.ok(question.explanation, `${question.question} needs an explanation`)
  }
})
