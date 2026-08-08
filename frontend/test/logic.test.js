import test from 'node:test'
import assert from 'node:assert/strict'

import {
  SECTION_LABELS,
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

test('checkBeeWord guard order: short before no-center', () => {
  // ACE is both too short (3 < 4) and missing center (no R)
  assert.equal(checkBeeWord('ACE', bee, []).status, 'short')
})

test('checkBeeWord guard order: short before bad-letter', () => {
  // ACS is both too short (3 < 4) and has bad letter (S)
  assert.equal(checkBeeWord('ACS', bee, []).status, 'short')
})

test('checkBeeWord guard order: no-center before bad-letter', () => {
  // ACES is valid length, but missing R and has S
  assert.equal(checkBeeWord('ACES', bee, []).status, 'no-center')
})

test('checkBeeWord guard order: bad-letter before already', () => {
  // GRATE has bad letter G, should fail there even if already found
  assert.equal(checkBeeWord('GRATE', bee, ['GRATE']).status, 'bad-letter')
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

test('toggleSelection adds below the cap', () => {
  assert.deepEqual(toggleSelection(['A', 'B'], 'C'), ['A', 'B', 'C'])
  assert.deepEqual(toggleSelection([], 'X'), ['X'])
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

test('SECTION_LABELS has all eleven keys with non-empty values', () => {
  const keys = ['editorNote', 'article', 'crossword', 'maze', 'word-search', 'spelling-bee', 'connections', 'trivia', 'logic', 'reasoning', 'teaser']
  for (const key of keys) {
    assert.equal(typeof SECTION_LABELS[key], 'string', `${key} must be a string`)
    assert.ok(SECTION_LABELS[key].length > 0, `${key} must have a non-empty value`)
  }
})

test('devanagariNumber converts digits', () => {
  assert.equal(devanagariNumber(1), '१')
  assert.equal(devanagariNumber('007'), '००७')
  assert.equal(devanagariNumber(2026), '२०२६')
})
