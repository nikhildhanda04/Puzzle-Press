import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { defaultPuzzle, puzzleTypes } from './defaultPuzzles.js'

// Tried in order. First is fast and cheap, later ones are the safety net.
// The 2.x ids were retired or unreachable on this project; confirm with `npm run ai:check`.
export const DEFAULT_GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-flash-latest']

export function geminiModels() {
  const configured = (process.env.GEMINI_MODEL ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)

  return configured.length ? configured : DEFAULT_GEMINI_MODELS
}

const questionSchema = z
  .object({
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2),
    answer: z.string().trim().min(1),
    difficulty: z.string().trim().optional(),
    explanation: z.string().trim().optional(),
  })
  .refine((value) => value.options.includes(value.answer), {
    message: 'answer must be one of the options',
  })

const letters = (word) => String(word).toUpperCase().replace(/[^A-Z]/g, '')

// A spelling bee is only playable if every listed word can actually be spelled from the
// seven letters, includes the required centre, and at least one word uses all seven.
const spellingBeeSchema = z
  .object({
    letters: z.array(z.string().trim().min(1)).length(7),
    center: z.string().trim().min(1),
    words: z.array(z.string().trim().min(1)).min(1),
    minLength: z.number().int().positive().optional(),
    pangrams: z.array(z.string().trim().min(1)).optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const pool = value.letters.map((letter) => letters(letter))
    const centre = letters(value.center)
    const fail = (message, path) => ctx.addIssue({ code: z.ZodIssueCode.custom, message, path })

    if (pool.some((letter) => letter.length !== 1)) return fail('letters must be single characters', ['letters'])
    if (new Set(pool).size !== 7) return fail('the seven letters must be distinct', ['letters'])
    if (centre.length !== 1) return fail('center must be a single letter', ['center'])
    if (!pool.includes(centre)) return fail('center must be one of the seven letters', ['center'])

    const allowed = new Set(pool)
    const minLength = value.minLength ?? 4

    for (const [index, raw] of value.words.entries()) {
      const word = letters(raw)
      if (word.length < minLength) return fail(`"${raw}" is shorter than ${minLength} letters`, ['words', index])
      if (!word.includes(centre)) return fail(`"${raw}" does not use the centre letter ${centre}`, ['words', index])
      const stray = [...word].find((letter) => !allowed.has(letter))
      if (stray) return fail(`"${raw}" uses ${stray}, which is not one of the seven letters`, ['words', index])
    }

    if (!value.words.some((word) => new Set(letters(word)).size === 7)) {
      fail('at least one word must be a pangram using all seven letters', ['words'])
    }
  })

// Sixteen distinct words in four groups of four, or the grid cannot be solved.
const connectionsSchema = z
  .object({
    groups: z.array(z.object({
      category: z.string().trim().min(1),
      words: z.array(z.string().trim().min(1)).length(4),
    }).passthrough()).length(4),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const all = value.groups.flatMap((group) => group.words.map((word) => letters(word)))
    const seen = new Set()
    const duplicate = all.find((word) => seen.size === seen.add(word).size)
    if (duplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `"${duplicate}" appears in more than one group`,
        path: ['groups'],
      })
    }
  })

// Shallow shape checks only: enough that the page renders and the puzzle is answerable.
// ponytail: a human reviews every draft before publish, so we do not verify that a maze
// has a path or that a word search actually hides its words. Add solvers if that changes.
const puzzleShapes = {
  crossword: z.object({
    entries: z.array(z.object({ clue: z.string().trim().min(1), answer: z.string().trim().min(1) }).passthrough()).min(1),
  }).passthrough(),
  maze: z.object({
    rows: z.number().int().positive(),
    cols: z.number().int().positive(),
  }).passthrough(),
  'word-search': z.object({
    grid: z.array(z.string().trim().min(1)).min(1),
    words: z.array(z.string().trim().min(1)).min(1),
  }).passthrough(),
  'spelling-bee': spellingBeeSchema,
  connections: connectionsSchema,
  trivia: z.object({ questions: z.array(questionSchema).min(1) }).passthrough(),
  reasoning: z.object({ questions: z.array(questionSchema).min(1) }).passthrough(),
  logic: z.object({
    setup: z.string().trim().min(1),
    choices: z.array(z.string().trim().min(1)).min(2),
    answer: z.string().trim().min(1),
  }).passthrough().refine((value) => value.choices.includes(value.answer), {
    message: 'answer must be one of the choices',
  }),
}

const articleSchema = z.object({
  articleTitle: z.string().trim().min(1),
  articleBody: z.string().trim().min(1),
  editorNote: z.string().trim().default(''),
  teaser: z.string().trim().default(''),
})

function sectionSchema(section) {
  if (section === 'article') return articleSchema
  return z.object({
    title: z.string().trim().min(1),
    prompt: z.string().optional(),
    puzzle: puzzleShapes[section],
    solution: z.unknown().optional(),
    hints: z.unknown().optional(),
  })
}

export function validateSection(section, value) {
  return sectionSchema(section).safeParse(value)
}

// The SDK stringifies Google's error envelope into message. Pull out the human part.
export function geminiMessage(error) {
  try {
    const parsed = JSON.parse(error.message)
    return parsed?.error?.message ?? error.message
  } catch {
    return error.message
  }
}

function parseJsonBlock(text) {
  const trimmed = String(text ?? '').trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  return JSON.parse(fenced ? fenced[1] : trimmed)
}

function buildPrompt({ section, issue, promptTemplate, extraPrompt, retryNote }) {
  const themeLine = issue.theme
    ? `Theme: ${issue.theme}.`
    : 'This issue has no fixed theme. Choose fresh, varied subject matter that stands on its own.'

  return [
    promptTemplate?.body ?? defaultPrompt(section),
    themeLine,
    // The editor's own story, retold so nobody real is identifiable.
    section === 'article' && issue.sourceStory
      ? `Source story from the editor's own life. Retell it as a magazine feature that keeps its shape and feeling, but replace every real name, place, and identifying detail with invented ones. Nobody real should be recognisable, and do not mention that it is based on a true story.\n\n${issue.sourceStory}`
      : '',
    extraPrompt ? `Editor instructions, follow these closely but keep the JSON shape above:\n${extraPrompt}` : '',
    `Issue:\n${JSON.stringify({ number: issue.number, title: issue.title, theme: issue.theme ?? null }, null, 2)}`,
    retryNote ? `Your previous reply was rejected: ${retryNote}. Return corrected JSON.` : '',
  ].filter(Boolean).join('\n\n')
}

// One retry against a single model: models usually fix their own shape when told
// exactly what was wrong. An API-level error is not retried, it means try the next model.
async function draftWithModel({ ai, model, section, issue, promptTemplate, extraPrompt }) {
  let lastError = ''

  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response
    try {
      response = await ai.models.generateContent({
        model,
        contents: buildPrompt({ section, issue, promptTemplate, extraPrompt, retryNote: lastError }),
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You draft family-friendly retro magazine content. Return only valid JSON.',
        },
      })
    } catch (cause) {
      return { ok: false, reason: geminiMessage(cause) }
    }

    try {
      const parsed = parseJsonBlock(response.text)
      const result = validateSection(section, parsed)
      if (result.success) return { ok: true, data: result.data }
      lastError = result.error.issues.map((item) => `${item.path.join('.') || 'root'}: ${item.message}`).join('; ')
    } catch (error) {
      lastError = `reply was not valid JSON (${error.message})`
    }
  }

  return { ok: false, reason: lastError }
}

export async function generateSection({ section, issue, promptTemplate, extraPrompt }) {
  if (!process.env.GEMINI_API_KEY) {
    return { data: fallbackSection(section, issue), source: 'fallback' }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const failures = []

  // Walk the chain: a rate limit, a retired model id, or two unusable drafts all fall through.
  for (const model of geminiModels()) {
    const attempt = await draftWithModel({ ai, model, section, issue, promptTemplate, extraPrompt })
    if (attempt.ok) return { data: attempt.data, source: 'gemini', model, failures }
    failures.push(`${model}: ${attempt.reason}`)
  }

  const error = new Error(`No Gemini model produced usable ${section} content. ${failures.join(' | ')}`)
  error.status = 502
  throw error
}

function defaultPrompt(section) {
  if (section === 'article') {
    return 'Create JSON with articleTitle, articleBody around 500 words, editorNote, and teaser.'
  }

  return 'Create JSON with title, prompt, puzzle, solution, and hints for this puzzle section.'
}

function fallbackSection(section, issue) {
  const theme = issue.theme ?? 'This Issue'

  if (section === 'article') {
    return {
      articleTitle: `The Curious Case of ${theme}`,
      articleBody: `${theme} takes over this issue with a brisk feature designed for the first MVP draft. Replace this placeholder with a human-reviewed 500 word article before publishing. The final copy should read like a compact magazine feature: curious, warm, specific, and packed with vivid facts.`,
      editorNote: `Welcome to Issue #${String(issue.number).padStart(3, '0')}.${issue.theme ? ` This draft is themed around ${issue.theme}.` : ''}`,
      teaser: 'Next time: another pocket-sized bundle of puzzles, facts, and retro page-turning surprises.',
    }
  }

  if (!puzzleTypes.includes(section)) {
    const error = new Error(`Unknown generation section: ${section}`)
    error.status = 400
    throw error
  }

  return defaultPuzzle(section, theme)
}
