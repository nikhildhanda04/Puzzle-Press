import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const mediaSchema = z.object({
  title: z.string().trim().min(1),
  altText: z.string().trim().min(1),
  url: z.string().trim().url(),
  notes: z.string().optional(),
})

export async function listMedia(_req, res) {
  const media = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ media })
}

export async function createMedia(req, res) {
  const parsed = mediaSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid media payload.' })

  const media = await prisma.mediaAsset.create({ data: parsed.data })
  res.status(201).json({ media })
}
