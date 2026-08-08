import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { generateSection } from '../services/aiService.js'
import { defaultPuzzle, puzzleTypes } from '../services/defaultPuzzles.js'
import { sendIssueEmail } from '../services/emailService.js'
import { serializeIssue } from '../services/issueSerializer.js'
import { slugify } from '../utils/slugify.js'

const issueSchema = z.object({
  title: z.string().trim().min(1),
  // Optional: an issue can run with no fixed theme.
  theme: z.string().trim().min(1).nullish().or(z.literal('')),
  slug: z.string().trim().min(1).optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal('')),
  sourceStory: z.string().max(20000).optional(),
  editorNote: z.string().optional(),
  articleTitle: z.string().optional(),
  articleBody: z.string().optional(),
  teaser: z.string().optional(),
})

const generateSchema = z.object({
  prompt: z.string().trim().max(4000).optional(),
})

const puzzleSchema = z.object({
  title: z.string().optional(),
  prompt: z.string().optional(),
  puzzle: z.unknown().optional(),
  solution: z.unknown().optional(),
  hints: z.unknown().optional(),
})

export async function listAdminIssues(_req, res) {
  const issues = await prisma.issue.findMany({ orderBy: { number: 'desc' }, include: { puzzles: true } })
  res.json({ issues: issues.map(serializeIssue) })
}

export async function createIssue(req, res) {
  const parsed = issueSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid issue payload.' })

  const latest = await prisma.issue.findFirst({ orderBy: { number: 'desc' } })
  const number = (latest?.number ?? 0) + 1
  const theme = parsed.data.theme || null
  const numbered = `issue-${String(number).padStart(3, '0')}`
  const slug = parsed.data.slug ?? (theme ? `${numbered}-${slugify(theme)}` : numbered)

  const issue = await prisma.issue.create({
    data: {
      ...parsed.data,
      theme,
      number,
      slug,
      coverImageUrl: parsed.data.coverImageUrl || null,
      puzzles: {
        create: puzzleTypes.map((type, index) => ({
          ...defaultPuzzle(type, theme ?? undefined),
          sortOrder: index + 1,
        })),
      },
    },
    include: { puzzles: true },
  })

  res.status(201).json({ issue: serializeIssue(issue) })
}

export async function updateIssue(req, res) {
  const parsed = issueSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid issue payload.' })

  const data = { ...parsed.data }
  if (Object.hasOwn(data, 'coverImageUrl')) {
    data.coverImageUrl = data.coverImageUrl || null
  }
  if (Object.hasOwn(data, 'theme')) {
    data.theme = data.theme || null
  }

  const issue = await prisma.issue.update({
    where: { id: req.params.id },
    data,
    include: { puzzles: true },
  })

  res.json({ issue: serializeIssue(issue) })
}

export async function updatePuzzle(req, res) {
  const parsed = puzzleSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid puzzle payload.' })

  const existing = await prisma.puzzle.findFirst({
    where: { id: req.params.puzzleId, issueId: req.params.issueId },
  })
  if (!existing) return res.status(404).json({ error: 'Puzzle not found.' })

  const puzzle = await prisma.puzzle.update({ where: { id: existing.id }, data: parsed.data })
  res.json({ puzzle })
}

export async function generateIssueSection(req, res) {
  const parsedBody = generateSchema.safeParse(req.body ?? {})
  if (!parsedBody.success) return res.status(400).json({ error: 'Invalid prompt.' })

  const issue = await prisma.issue.findUnique({ where: { id: req.params.id }, include: { puzzles: true } })
  if (!issue) return res.status(404).json({ error: 'Issue not found.' })

  const section = req.params.section
  if (section !== 'article' && !puzzleTypes.includes(section)) {
    return res.status(400).json({ error: 'Unknown generation section.' })
  }

  const extraPrompt = parsedBody.data.prompt ?? ''
  const promptTemplate = await prisma.promptTemplate.findFirst({ where: { section, active: true } })
  const { data: generated, source, model } = await generateSection({ section, issue, promptTemplate, extraPrompt })

  if (section === 'article') {
    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: {
        articleTitle: generated.articleTitle,
        articleBody: generated.articleBody,
        editorNote: generated.editorNote || issue.editorNote,
        teaser: generated.teaser || issue.teaser,
      },
      include: { puzzles: true },
    })
    return res.json({ issue: serializeIssue(updated), generated, source, model })
  }

  const existing = issue.puzzles.find((puzzle) => puzzle.type === section)
  const puzzleData = {
    title: generated.title ?? existing?.title ?? defaultPuzzle(section, issue.theme ?? undefined).title,
    prompt: extraPrompt || generated.prompt || '',
    puzzle: generated.puzzle,
    solution: generated.solution ?? generated.puzzle,
    hints: generated.hints ?? [],
  }

  const puzzle = await prisma.puzzle.upsert({
    where: { issueId_type: { issueId: issue.id, type: section } },
    update: puzzleData,
    create: { issueId: issue.id, type: section, sortOrder: puzzleTypes.indexOf(section) + 1, ...puzzleData },
  })

  res.json({ puzzle, generated, source, model })
}

async function mailIssue(issue) {
  const subscribers = await prisma.subscriber.findMany({ where: { status: 'active' } })

  for (const subscriber of subscribers) {
    const where = { issueId_subscriberId: { issueId: issue.id, subscriberId: subscriber.id } }
    const existing = await prisma.issueEmailSend.findUnique({ where })
    if (existing?.status === 'sent') continue

    const result = await sendIssueEmail({ subscriber, issue })
    const data = {
      providerMessageId: result.providerMessageId,
      status: result.status,
      error: result.error,
      sentAt: result.status === 'sent' ? new Date() : null,
    }

    await prisma.issueEmailSend.upsert({
      where,
      update: data,
      create: { issueId: issue.id, subscriberId: subscriber.id, ...data },
    })
  }
}

export async function publishIssue(req, res) {
  const issue = await prisma.issue.update({
    where: { id: req.params.id },
    data: { status: 'published', publishedAt: new Date() },
    include: { puzzles: true },
  })

  const pending = await prisma.subscriber.count({ where: { status: 'active' } })
  res.json({ issue: serializeIssue(issue), emailSends: pending })

  // ponytail: in-process fire-and-forget so publish returns fast; swap for a real queue
  // once sends need retries or must survive a restart mid-run.
  mailIssue(issue).catch((error) => console.error(`Issue ${issue.number} mail run failed`, error))
}
