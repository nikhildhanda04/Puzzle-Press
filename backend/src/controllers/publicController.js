import crypto from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { serializeIssue } from '../services/issueSerializer.js'

const subscriberSchema = z.object({
  email: z.string().trim().email().max(254),
})

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ))
}

function noticePage(heading, body, formToken) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)} - Puzzle Press</title></head>
<body style="font-family: Georgia, serif; color: #24170f; background: #f7e6b2; padding: 48px; max-width: 34rem; margin: 0 auto;">
<h1>${escapeHtml(heading)}</h1>
<p>${body}</p>
${formToken ? `<form method="post" action="/api/unsubscribe?token=${encodeURIComponent(formToken)}"><button style="font: inherit; padding: 8px 16px;">Yes, unsubscribe me</button></form>` : ''}
</body></html>`
}

export async function getLatestIssue(_req, res) {
  const issue = await prisma.issue.findFirst({
    where: { status: 'published' },
    include: { puzzles: true },
    orderBy: [{ publishedAt: 'desc' }, { number: 'desc' }],
  })

  res.json({ issue: serializeIssue(issue, { includeSolutions: false }) })
}

export async function listPublishedIssues(_req, res) {
  const issues = await prisma.issue.findMany({
    where: { status: 'published' },
    orderBy: { number: 'desc' },
    include: { puzzles: true },
  })

  res.json({ issues: issues.map((issue) => serializeIssue(issue, { includeSolutions: false })) })
}

export async function getPublishedIssue(req, res) {
  const issue = await prisma.issue.findFirst({
    where: { slug: req.params.slug, status: 'published' },
    include: { puzzles: true },
  })

  if (!issue) return res.status(404).json({ error: 'Issue not found.' })
  res.json({ issue: serializeIssue(issue, { includeSolutions: false }) })
}

// ponytail: per-process memory, so a second instance doubles the allowance.
// Good enough to stop a script; move to Redis if this ever runs on more than one box.
const signupHits = new Map()
const SIGNUP_WINDOW_MS = 60_000
const SIGNUP_LIMIT = 5

export function signupAllowed(key, now = Date.now()) {
  const hits = (signupHits.get(key) ?? []).filter((time) => now - time < SIGNUP_WINDOW_MS)
  hits.push(now)
  signupHits.set(key, hits)

  if (signupHits.size > 10_000) signupHits.clear()
  return hits.length <= SIGNUP_LIMIT
}

export async function createSubscriber(req, res) {
  if (!signupAllowed(req.ip ?? 'unknown')) {
    return res.status(429).json({ error: 'Too many signups from this address. Try again in a minute.' })
  }

  const parsed = subscriberSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email address.' })

  const subscriber = await prisma.subscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: { status: 'active' },
    create: {
      email: parsed.data.email.toLowerCase(),
      unsubscribeToken: crypto.randomBytes(24).toString('hex'),
    },
  })

  res.status(201).json({ subscriber: { id: subscriber.id, email: subscriber.email, status: subscriber.status } })
}

// GET only confirms. Mail scanners prefetch links, so the actual opt-out is the POST below.
export async function showUnsubscribe(req, res) {
  const token = String(req.query.token ?? '')
  const subscriber = token
    ? await prisma.subscriber.findUnique({ where: { unsubscribeToken: token } })
    : null

  if (!subscriber) {
    return res.status(404).type('html').send(noticePage('Link not found', 'That unsubscribe link is invalid.'))
  }

  if (subscriber.status === 'unsubscribed') {
    return res.type('html').send(noticePage('Already unsubscribed', `${escapeHtml(subscriber.email)} is not on the list.`))
  }

  return res.type('html').send(
    noticePage('Unsubscribe', `Stop sending Puzzle Press to ${escapeHtml(subscriber.email)}?`, token),
  )
}

export async function confirmUnsubscribe(req, res) {
  const token = String(req.query.token ?? '')
  const { count } = token
    ? await prisma.subscriber.updateMany({ where: { unsubscribeToken: token }, data: { status: 'unsubscribed' } })
    : { count: 0 }

  if (count === 0) {
    return res.status(404).type('html').send(noticePage('Link not found', 'That unsubscribe link is invalid.'))
  }

  return res.type('html').send(noticePage('Unsubscribed', 'You will not get any more issue emails.'))
}
