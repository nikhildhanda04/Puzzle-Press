import { prisma } from '../lib/prisma.js'

export async function getAnalytics(_req, res) {
  const [issues, drafts, subscribers, emails] = await Promise.all([
    prisma.issue.count({ where: { status: 'published' } }),
    prisma.issue.count({ where: { status: 'draft' } }),
    prisma.subscriber.count({ where: { status: 'active' } }),
    prisma.issueEmailSend.count(),
  ])

  res.json({ analytics: { publishedIssues: issues, drafts, activeSubscribers: subscribers, emailSends: emails } })
}
