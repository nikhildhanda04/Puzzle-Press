import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import { geminiModels, generateSection, geminiMessage } from '../src/services/aiService.js'
import { puzzleTypes } from '../src/services/defaultPuzzles.js'
import { prisma } from '../src/lib/prisma.js'

// Runs every section against every model in the chain and reports which ones produce
// drafts that survive validation. Usage:
//   npm run ai:check
//   npm run ai:check -- gemini-2.0-flash-lite gemini-2.5-flash
const models = process.argv.slice(2).length ? process.argv.slice(2) : geminiModels()
const sections = ['article', ...puzzleTypes]

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set. Generation returns placeholder drafts, not Gemini output.')
  process.exit(1)
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

try {
  const available = []
  for await (const entry of await ai.models.list()) {
    if (!entry.supportedActions || entry.supportedActions.includes('generateContent')) {
      available.push(entry.name?.replace(/^models\//, '') ?? String(entry))
    }
  }
  const missing = models.filter((model) => !available.includes(model))
  console.log(`Key accepted. ${available.length} models available.`)
  if (missing.length) console.log(`NOT available to this key: ${missing.join(', ')}`)
} catch (error) {
  console.error(`Cannot list models: ${geminiMessage(error)}`)
  console.error('Every generation below will fail for the same reason. Fix the key first.')
  process.exit(1)
}

// Use the same seeded prompts the app uses. Without these the run only measures the
// generic fallback prompt, which never states the inner puzzle shape.
const rows = await prisma.promptTemplate.findMany({ where: { active: true } })
const templates = Object.fromEntries(rows.map((row) => [row.section, row]))
const untemplated = sections.filter((section) => !templates[section])
if (untemplated.length) {
  console.log(`\nNo active prompt template for: ${untemplated.join(', ')}. Run \`npm run seed\` first.`)
}

const issue = {
  number: 1,
  title: 'Issue #001: Retro Gaming',
  theme: 'Retro Gaming',
  sourceStory: '',
}

const results = []

for (const model of models) {
  process.env.GEMINI_MODEL = model
  console.log(`\n=== ${model} ===`)

  for (const section of sections) {
    const started = Date.now()
    try {
      const result = await generateSection({
        section,
        issue,
        promptTemplate: templates[section] ?? null,
        extraPrompt: '',
      })
      const ms = Date.now() - started
      console.log(`  ok    ${section.padEnd(13)} ${String(ms).padStart(6)}ms`)
      results.push({ model, section, ok: true, ms })
    } catch (error) {
      const ms = Date.now() - started
      console.log(`  FAIL  ${section.padEnd(13)} ${String(ms).padStart(6)}ms  ${error.message.slice(0, 140)}`)
      results.push({ model, section, ok: false, ms })
    }
  }
}

console.log('\n--- summary ---')
for (const model of models) {
  const rows = results.filter((row) => row.model === model)
  const passed = rows.filter((row) => row.ok)
  const median = passed.length
    ? passed.map((row) => row.ms).sort((a, b) => a - b)[Math.floor(passed.length / 2)]
    : 0
  const failed = rows.filter((row) => !row.ok).map((row) => row.section)
  console.log(`${model.padEnd(24)} ${passed.length}/${rows.length} sections, median ${median}ms${failed.length ? `, failed: ${failed.join(', ')}` : ''}`)
}

await prisma.$disconnect()
if (results.some((row) => !row.ok)) process.exitCode = 1
