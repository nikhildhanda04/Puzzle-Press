import { useState } from 'react'
import { fetchJson } from '../lib/api'
import './components.css'

export function Subscribe({ setNotice }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      await fetchJson('/api/subscribers', { method: 'POST', body: JSON.stringify({ email }) })
      setEmail('')
      setNotice('Subscribed. New issues will arrive by email.')
    } catch {
      setNotice('Subscription failed. Check the address and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="subscribe" onSubmit={submit}>
      <h3>Get the next issue</h3>
      <p className="chrome-line">One email per issue. Unsubscribe in one click.</p>
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="reader@example.com"
        type="email"
        required
        aria-label="Email address"
      />
      <button className="ink-button" disabled={busy}>{busy ? 'Sending…' : 'Subscribe'}</button>
    </form>
  )
}
