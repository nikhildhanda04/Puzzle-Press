import { useEffect, useMemo, useState } from 'react'
import { authClient } from './lib/authClient'
import { fetchJson, fetchAdmin } from './lib/api'
import { useRoute } from './lib/useRoute'
import { PuzzleRenderer } from './puzzles'
import { Home } from './pages/Home'
import { Archive } from './pages/Archive'
import { IssuePage } from './pages/IssuePage'
import { About } from './pages/About'
import './App.css'

const SECTIONS = ['article', 'crossword', 'maze', 'word-search', 'trivia', 'logic', 'reasoning']

const demoIssue = {
  number: 1,
  slug: 'issue-001-retro-gaming',
  title: 'Issue #001: Retro Gaming',
  theme: 'Retro Gaming',
  editorNote: 'Welcome to Puzzle Press, a pocket-sized magazine of curious facts and playable puzzles.',
  articleTitle: 'Why Pixel Worlds Still Feel Huge',
  articleBody:
    'Retro games did more with less. A small sprite, a bright sound effect, and a handful of colors could suggest an entire world. This first issue uses that same spirit: compact pages, punchy puzzles, and enough texture to feel like something that arrived in the mail.',
  teaser: 'Next issue: a new theme, a fresh article, and five more puzzles.',
  publishedAt: new Date().toISOString(),
  puzzles: [
    {
      type: 'crossword',
      title: 'Cartridge Crossword',
      puzzle: {
        entries: [
          { clue: 'Old-school game container', answer: 'CART', direction: 'across', row: 0, col: 0 },
          { clue: 'Place to spend quarters', answer: 'ARCADE', direction: 'down', row: 0, col: 1 },
        ],
      },
    },
    {
      type: 'maze',
      title: 'Arcade Cabinet Maze',
      puzzle: { rows: 7, cols: 7, start: [0, 0], finish: [6, 6], walls: [[0, 2], [1, 2], [2, 2], [2, 4], [3, 4], [4, 1], [4, 2], [5, 4]] },
    },
    {
      type: 'word-search',
      title: 'High Score Word Search',
      puzzle: { grid: ['RETROXX', 'PUZZLEX', 'PIXELXX', 'ARCADEZ', 'BUTTONS', 'LEVELXX', 'SECRETZ'], words: ['RETRO', 'PUZZLE', 'PIXEL', 'ARCADE', 'LEVEL'] },
    },
    {
      type: 'trivia',
      title: 'Insert Coin Trivia',
      puzzle: {
        questions: [
          { question: 'What does an arcade high-score table usually track?', options: ['Top scores', 'Weather', 'Recipes', 'Bus routes'], answer: 'Top scores' },
          { question: 'What visual style uses tiny square units?', options: ['Pixel art', 'Oil wash', 'Marble print', 'Blueprint'], answer: 'Pixel art' },
        ],
      },
    },
    {
      type: 'logic',
      title: 'Page Order Logic',
      puzzle: { setup: 'Article comes before trivia. Maze is not first. Which page opens the puzzle stack?', choices: ['Article', 'Maze', 'Trivia'], answer: 'Article' },
    },
    {
      type: 'reasoning',
      title: 'Reasoning Page',
      puzzle: {
        questions: [
          {
            difficulty: 'easy',
            question: 'What number continues the series? 2, 6, 12, 20, 30, ?',
            options: ['36', '40', '42', '46'],
            answer: '42',
            explanation: 'The gaps grow by two each step: 4, 6, 8, 10, then 12. So 30 + 12 = 42.',
          },
          {
            difficulty: 'medium',
            question: 'Every cabinet in the arcade takes coins. Nothing that takes coins is free to play. Which statement must be true?',
            options: [
              'No cabinet in the arcade is free to play.',
              'Everything that takes coins is a cabinet.',
              'Some cabinets in the arcade are free to play.',
              'Everything free to play takes coins.',
            ],
            answer: 'No cabinet in the arcade is free to play.',
            explanation: 'Each cabinet takes coins, and nothing that takes coins is free, so no cabinet is free. The others reverse the statements or contradict them.',
          },
        ],
      },
    },
  ],
}

function App() {
  const { route, navigate } = useRoute()
  const [latestIssue, setLatestIssue] = useState(demoIssue)
  const [issues, setIssues] = useState([demoIssue])
  const [adminIssues, setAdminIssues] = useState([])
  const [selectedIssueId, setSelectedIssueId] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    fetchJson('/api/issues/latest').then((data) => data.issue && setLatestIssue(data.issue)).catch(() => {})
    fetchJson('/api/issues').then((data) => data.issues?.length && setIssues(data.issues)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!route.startsWith('/admin')) return
    fetchAdmin('/api/admin/issues')
      .then((data) => {
        setAdminIssues(data.issues ?? [])
        setSelectedIssueId((current) => current || data.issues?.[0]?.id || '')
      })
      .catch(() => setNotice('Admin API unavailable or Google login required.'))
  }, [route])

  const currentIssue = useMemo(() => {
    if (route.startsWith('/issues/')) {
      const slug = route.split('/').filter(Boolean)[1]
      return issues.find((issue) => issue.slug === slug) ?? latestIssue
    }
    return latestIssue
  }, [issues, latestIssue, route])

  return (
    <div className="paper-shell">
      <header className="masthead">
        <button className="brand" onClick={() => navigate('/')}>Puzzle Press</button>
        <nav>
          <button onClick={() => navigate(`/issues/${latestIssue.slug}`)}>Latest Issue</button>
          <button onClick={() => navigate('/issues')}>Previous Issues</button>
          <button onClick={() => navigate('/about')}>About</button>
          <button onClick={() => navigate('/admin')}>Admin</button>
        </nav>
      </header>

      {route === '/' && <Home issue={latestIssue} issues={issues} navigate={navigate} setNotice={setNotice} />}
      {route === '/issues' && <Archive issues={issues} navigate={navigate} />}
      {route.startsWith('/issues/') && <IssuePage issue={currentIssue} />}
      {route === '/about' && <About />}
      {route.startsWith('/admin') && (
        <Admin
          issues={adminIssues}
          setIssues={setAdminIssues}
          selectedIssueId={selectedIssueId}
          setSelectedIssueId={setSelectedIssueId}
          setNotice={setNotice}
        />
      )}

      {notice && <button className="notice" onClick={() => setNotice('')}>{notice}</button>}
    </div>
  )
}

function Admin({ issues, setIssues, selectedIssueId, setSelectedIssueId, setNotice }) {
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
      setNotice(`${label} failed. If this account is not on the editor allowlist, the API will refuse it.`)
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
      const data = await fetchAdmin(`/api/admin/issues/${selected.id}/generate/${section}`, {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      })
      const refreshed = await fetchAdmin('/api/admin/issues')
      setIssues(refreshed.issues)
      setNotice(data.issue ? `Regenerated ${section}.` : `Regenerated the ${section} puzzle.`)
    })
  }

  async function publish() {
    if (!window.confirm(`Publish "${selected.title}" and email every active subscriber?`)) return
    await run('Publish', async () => {
      const data = await fetchAdmin(`/api/admin/issues/${selected.id}/publish`, { method: 'POST' })
      setIssues(issues.map((issue) => issue.id === data.issue.id ? data.issue : issue))
      setNotice(`Published and queued ${data.emailSends} email sends.`)
    })
  }

  async function signIn() {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/admin',
    })
  }

  async function signOut() {
    await authClient.signOut()
    setIssues([])
  }

  if (isPending) {
    return <main className="admin"><section><h1>Admin Dashboard</h1><p>Checking session...</p></section></main>
  }

  if (!session?.user) {
    return (
      <main className="admin">
        <section>
          <h1>Admin Dashboard</h1>
          <p>Google login is required to review drafts and publish issues.</p>
          <button className="primary" onClick={signIn}>Sign in with Google</button>
        </section>
      </main>
    )
  }

  return (
    <main className="admin">
      <section>
        <h1>Admin Dashboard</h1>
        <p>Signed in as {session.user.email}</p>
        <button onClick={signOut}>Sign out</button>
      </section>

      <section className="admin-grid">
        <form onSubmit={createIssue}>
          <h2>Create Issue</h2>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
          <input value={theme} onChange={(event) => setTheme(event.target.value)} />
          <button>Create Draft</button>
        </form>

        <div>
          <h2>Issues</h2>
          {issues.map((issue) => <button className="admin-row" key={issue.id} onClick={() => setSelectedIssueId(issue.id)}>{issue.title} · {issue.status}</button>)}
        </div>
      </section>

      {selected && (
        <section className="review">
          <h2>{selected.title} · {selected.status}</h2>

          <label className="prompt-box">
            <span>Prompt for the next generation. Leave blank to use the saved template.</span>
            <textarea
              rows="4"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. base the article on this story, change the names, keep it warm and generic. Make the reasoning questions easier."
            />
          </label>

          <div className="toolbar">
            {SECTIONS.map((section) => (
              <button key={section} disabled={Boolean(busy)} onClick={() => generate(section)}>
                {busy === `Generate ${section}` ? 'Working...' : `Remake ${section}`}
              </button>
            ))}
          </div>

          <article className="draft">
            <h3>Article</h3>
            <p className="score">{selected.articleTitle}</p>
            <p><em>{selected.editorNote}</em></p>
            <p>{selected.articleBody}</p>
            <p><strong>Teaser:</strong> {selected.teaser}</p>
          </article>

          {(selected.puzzles ?? []).map((puzzle) => (
            <article className="draft" key={puzzle.id ?? puzzle.type}>
              <h3>{puzzle.type}</h3>
              {puzzle.prompt && <p><strong>Prompt used:</strong> {puzzle.prompt}</p>}
              <PuzzleRenderer puzzle={puzzle} />
              <details>
                <summary>Answers and hints</summary>
                <pre>{JSON.stringify({ solution: puzzle.solution, hints: puzzle.hints }, null, 2)}</pre>
              </details>
            </article>
          ))}

          <div className="toolbar">
            <button className="primary" disabled={Boolean(busy)} onClick={publish}>
              {busy === 'Publish' ? 'Publishing...' : 'Publish and email subscribers'}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
