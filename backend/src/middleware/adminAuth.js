import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'

export function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminEmail(email) {
  const allowed = adminEmails()
  if (allowed.size === 0) return false
  return allowed.has(String(email ?? '').trim().toLowerCase())
}

export async function requireAdmin(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!session?.user) {
    return res.status(401).json({ error: 'Google login required.' })
  }

  if (!isAdminEmail(session.user.email)) {
    return res.status(403).json({ error: 'This account is not an editor.' })
  }

  req.user = session.user
  req.session = session.session
  next()
}
