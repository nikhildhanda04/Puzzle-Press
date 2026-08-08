import { useState } from 'react'
import { authClient } from '../../lib/authClient'
import { fetchAdmin } from '../../lib/api'
import { IssueList } from './IssueList'
import { DraftReview } from './DraftReview'
import './admin.css'

export function AdminPage({ issues, setIssues, selectedIssueId, setSelectedIssueId, setNotice }) {
  const { data: session, isPending } = authClient.useSession()
  const selected = issues.find((issue) => issue.id === selectedIssueId) ?? issues[0]

  const [theme, setTheme] = useState('Space')
  const [title, setTitle] = useState('Issue Draft: Space')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState('')

  async function run(label, action) {
    setBusy(label)
    try {
      await action()
    } catch {
      setNotice(`${label} failed. If this account is not on the editor allowlist, the API refuses it.`)
    } finally {
      setBusy('')
    }
  }

  async function createIssue(event) {
    event.preventDefault()
    await run('Create draft', async () => {
      const data = await fetchAdmin('/api/admin/issues', { method: 'POST', body: JSON.stringify({ title, theme }) })
      setIssues([data.issue, ...issues])
      setSelectedIssueId(data.issue.id)
      setNotice('Draft issue created.')
    })
  }

  async function generate(section) {
    await run(`Generate ${section}`, async () => {
      await fetchAdmin(`/api/admin/issues/${selected.id}/generate/${section}`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      })
      const refreshed = await fetchAdmin('/api/admin/issues')
      setIssues(refreshed.issues)
      setNotice(`Regenerated ${section}.`)
    })
  }

  async function publish() {
    if (!window.confirm(`Publish "${selected.title}" and email every active subscriber?`)) return
    await run('Publish', async () => {
      const data = await fetchAdmin(`/api/admin/issues/${selected.id}/publish`, { method: 'POST' })
      setIssues(issues.map((issue) => (issue.id === data.issue.id ? data.issue : issue)))
      setNotice(`Published and queued ${data.emailSends} email sends.`)
    })
  }

  if (isPending) {
    return <main className="page-width admin"><h1>The Desk</h1><p className="chrome-line">Checking session…</p></main>
  }

  if (!session?.user) {
    return (
      <main className="page-width admin">
        <h1 className="misprint">The Desk</h1>
        <p>Google login is required to review drafts and publish issues.</p>
        <button className="ink-button" onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: '/admin' })}>
          Sign in with Google
        </button>
      </main>
    )
  }

  return (
    <main className="page-width admin">
      <div className="admin-head">
        <h1 className="misprint">The Desk</h1>
        <p className="chrome-line">{session.user.email}</p>
        <button className="ink-button" onClick={() => authClient.signOut().then(() => setIssues([]))}>Sign out</button>
      </div>

      <div className="admin-grid">
        <form className="admin-create" onSubmit={createIssue}>
          <h2>New issue</h2>
          <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Issue title" />
          <input value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Theme" />
          <button className="ink-button">Create draft</button>
        </form>

        <IssueList issues={issues} selectedIssueId={selected?.id} onSelect={setSelectedIssueId} />
      </div>

      {selected && (
        <DraftReview
          issue={selected}
          prompt={prompt}
          setPrompt={setPrompt}
          busy={busy}
          onGenerate={generate}
          onPublish={publish}
        />
      )}
    </main>
  )
}
