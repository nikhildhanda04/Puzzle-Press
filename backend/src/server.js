import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { adminRoutes } from './routes/adminRoutes.js'
import { publicRoutes } from './routes/publicRoutes.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const allowedOrigin = process.env.PUBLIC_SITE_URL ?? 'http://localhost:5173'

// Off by default: without a real proxy in front, a client could forge X-Forwarded-For
// and walk straight past the signup rate limit. Set to the number of proxy hops when deployed.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'puzzle-press-backend' })
})

app.use('/api', publicRoutes)
app.use('/api/admin', adminRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  // Deliberate statuses (a rejected Gemini draft, a bad section) carry a message worth showing.
  const status = err.status ?? 500
  res.status(status).json({ error: status === 500 ? 'Unexpected server error.' : err.message })
})

app.listen(port, () => {
  console.log(`Puzzle Press API listening on http://localhost:${port}`)
})
