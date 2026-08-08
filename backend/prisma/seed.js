import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { defaultPuzzle, puzzleTypes } from '../src/services/defaultPuzzles.js'

const prisma = new PrismaClient()

const promptSeeds = [
  ['article', 'Default Article', 'Create a warm editor note, a 500 word theme feature, and a next-issue teaser. Return JSON with articleTitle, articleBody, editorNote, teaser.'],
  ['crossword', 'Default Crossword', 'Create a compact themed crossword on a 7x7 grid with six to ten entries. Every answer must be a single uppercase word with no spaces or punctuation, and row and col are zero-based coordinates of the first letter. Return JSON with title, prompt, hints, and puzzle as { size: 7, entries: [{ clue, answer, direction: "across" or "down", row, col }] }. Put the same object in solution.'],
  ['maze', 'Default Maze', 'Create a themed 7x7 maze. Coordinates are zero-based [row, col] pairs. Walls are the blocked cells, and a clear path must exist from start to finish moving only up, down, left or right through cells that are not walls. Return JSON with title, prompt, hints, and puzzle as { rows: 7, cols: 7, start: [0, 0], finish: [6, 6], walls: [[row, col], ...] }. Put the same object in solution.'],
  ['word-search', 'Default Word Search', 'Create a themed word search. The grid is an array of strings, one string per row, every string the same length, uppercase letters only, no spaces. Every listed word must be readable in the grid horizontally, vertically or diagonally, forwards or backwards. Return JSON with title, prompt, hints, and puzzle as { grid: ["ROWONE", "ROWTWO", ...], words: [uppercase words] }. Put the same object in solution.'],
  ['spelling-bee', 'Default Spelling Bee', 'Create a spelling bee. Pick seven distinct letters and one of them as the required centre letter, chosen so that at least one common English word uses all seven. List at least fifteen common English words of four letters or more that can be spelled using only those seven letters, with letters allowed to repeat, and every word must contain the centre letter. Do not list a word containing any letter outside the seven. Return JSON with title, prompt, hints, and puzzle as { letters: seven uppercase letters, center: one of them, minLength: 4, words: uppercase array, pangrams: the words using all seven }. Put the same object in solution.'],
  ['connections', 'Default Connections', 'Create a connections grid: sixteen words in four groups of four, each group sharing a category. Every word must appear exactly once across the whole grid. Aim for one easy group, two medium, and one that leans on wordplay or a second meaning, so a few words look like they belong to the wrong group. Return JSON with title, prompt, hints, and puzzle as { groups: [{ category, words: four uppercase words }] }. Put the same object in solution.'],
  ['trivia', 'Default Trivia', 'Create five themed trivia questions. Each question needs exactly four options, and the answer string must match one of its four options character for character. Return JSON with title, prompt, hints, and puzzle as { questions: [{ question, options: [four strings], answer }] }. Put the same object in solution.'],
  ['logic', 'Default Logic', 'Create one themed logic puzzle: a short setup of two or three stated facts leading to exactly one defensible conclusion. Choices is a flat array of strings, and the answer string must match one of them character for character. Return JSON with title, prompt, hints, and puzzle as { setup, choices: [three or four strings], answer }. Put the same object in solution.'],
  ['reasoning', 'Default Reasoning', 'Create five logical reasoning questions at easy to medium difficulty: number series, syllogisms, odd-one-out, simple ordering or seating, and basic deduction. No trick questions and no outside knowledge required. Each question must have exactly one defensible answer that follows from the stated facts alone. Return JSON with title, prompt, hints, and puzzle.questions as an array of { difficulty: "easy" | "medium", question, options (4 strings, one of them the answer), answer, explanation }. Put the same questions array in solution.'],
]

async function main() {
  for (const [section, name, body] of promptSeeds) {
    await prisma.promptTemplate.upsert({
      where: { section_name: { section, name } },
      update: { body, active: true },
      create: { section, name, body, active: true },
    })
  }

  const issue = await prisma.issue.upsert({
    where: { slug: 'issue-001-retro-gaming' },
    update: {},
    create: {
      number: 1,
      slug: 'issue-001-retro-gaming',
      title: 'Issue #001: Retro Gaming',
      theme: 'Retro Gaming',
      status: 'published',
      publishedAt: new Date(),
      editorNote: 'Welcome to the first issue of Puzzle Press, printed fresh for your browser.',
      articleTitle: 'Why Pixel Worlds Still Feel Huge',
      articleBody: 'Retro games did more with less. A small sprite, a sharp sound effect, and a handful of colors could suggest an entire world. This issue celebrates that compact magic with puzzles inspired by cartridges, arcades, secret rooms, and high-score tables.',
      teaser: 'Next issue brings another themed stack of short reads and playable puzzles.',
      puzzles: {
        create: puzzleTypes.map((type, index) => ({
          ...defaultPuzzle(type, 'Retro Gaming'),
          sortOrder: index + 1,
        })),
      },
    },
  })

  console.log(`Seeded ${issue.title}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
