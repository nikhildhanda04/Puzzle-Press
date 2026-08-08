import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const promptUpdateSchema = z.object({
  body: z.string().min(1),
  active: z.boolean().optional(),
})

export async function listPrompts(_req, res) {
  const prompts = await prisma.promptTemplate.findMany({ orderBy: [{ section: 'asc' }, { name: 'asc' }] })
  res.json({ prompts })
}

export async function updatePrompt(req, res) {
  const parsed = promptUpdateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid prompt payload.' })

  const prompt = await prisma.promptTemplate.update({ where: { id: req.params.id }, data: parsed.data })
  res.json({ prompt })
}
