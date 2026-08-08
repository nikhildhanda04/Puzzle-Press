import { useEffect, useMemo, useState } from 'react'
import { authClient } from './lib/authClient'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

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
  const [route, setRoute] = useState(window.location.pathname)
  const [latestIssue, setLatestIssue] = useState(demoIssue)
  const [issues, setIssues] = useState([demoIssue])
  const [adminIssues, setAdminIssues] = useState([])
  const [selectedIssueId, setSelectedIssueId] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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

  function navigate(path) {
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      {route.startsWith('/issues/') && <Issue issue={currentIssue} />}
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

function Home({ issue, issues, navigate, setNotice }) {
  return (
    <main>
      <section className="hero-issue">
        <div>
          <p className="kicker">Fresh from the browser press</p>
          <h1>Retro Weekly</h1>
          <p className="issue-line">Issue #{String(issue.number).padStart(3, '0')} is out: {issue.theme}</p>
          <button className="primary" onClick={() => navigate(`/issues/${issue.slug}`)}>Read Magazine</button>
        </div>
        <div className="cover-art" aria-hidden="true">
          <span>8-BIT</span>
          <span>PUZZLES</span>
          <span>FACTS</span>
        </div>
      </section>

      <section className="news-grid">
        <article>
          <h2>Latest Article</h2>
          <h3>{issue.articleTitle}</h3>
          <p>{issue.articleBody}</p>
        </article>
        <article>
          <h2>Latest Games</h2>
          <ul>{issue.puzzles?.map((puzzle) => <li key={puzzle.type}>{puzzle.title}</li>)}</ul>
        </article>
        <Subscribe setNotice={setNotice} />
      </section>

      <section className="strip">
        <h2>Previous Issues</h2>
        <div className="issue-cards">
          {issues.map((oldIssue) => (
            <button key={oldIssue.slug} onClick={() => navigate(`/issues/${oldIssue.slug}`)}>
              <span>#{String(oldIssue.number).padStart(3, '0')}</span>
              {oldIssue.theme}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function Archive({ issues, navigate }) {
  return (
    <main className="page">
      <h1>Previous Issues</h1>
      <div className="archive-grid">
        {issues.map((issue) => (
          <button key={issue.slug} onClick={() => navigate(`/issues/${issue.slug}`)}>
            <strong>Issue #{String(issue.number).padStart(3, '0')}</strong>
            <span>{issue.theme}</span>
            <small>{issue.teaser}</small>
          </button>
        ))}
      </div>
    </main>
  )
}

function Issue({ issue }) {
  const issueDate = issue.publishedAt ? new Date(issue.publishedAt).toLocaleDateString() : 'Draft preview'

  return (
    <main className="magazine">
      <section className="issue-title">
        <p>==========================</p>
        <h1>{issue.title}</h1>
        <p>{issueDate}</p>
        <p>Theme: {issue.theme}</p>
        <p>==========================</p>
      </section>

      <MagazineSection title="Editor's Note"><p>{issue.editorNote}</p></MagazineSection>
      <MagazineSection title={issue.articleTitle || 'Fun Article'}><p>{issue.articleBody}</p></MagazineSection>
      {issue.puzzles?.map((puzzle) => <Puzzle key={puzzle.type} puzzle={puzzle} />)}
      <MagazineSection title="Next Issue Teaser"><p>{issue.teaser}</p></MagazineSection>
    </main>
  )
}

function MagazineSection({ title, children }) {
  return <section className="mag-section"><h2>{title}</h2>{children}</section>
}

function Puzzle({ puzzle }) {
  if (puzzle.type === 'crossword') return <Crossword puzzle={puzzle} />
  if (puzzle.type === 'maze') return <Maze puzzle={puzzle} />
  if (puzzle.type === 'word-search') return <WordSearch puzzle={puzzle} />
  if (puzzle.type === 'trivia' || puzzle.type === 'reasoning') return <Trivia puzzle={puzzle} />
  if (puzzle.type === 'logic') return <LogicPuzzle puzzle={puzzle} />
  return <MagazineSection title={puzzle.title}><pre>{JSON.stringify(puzzle.puzzle, null, 2)}</pre></MagazineSection>
}

function Crossword({ puzzle }) {
  const answers = puzzle.puzzle?.entries ?? []
  const size = puzzle.puzzle?.size ?? 7
  return (
    <MagazineSection title={puzzle.title}>
      <div className="crossword-grid" style={{ '--size': size }}>
        {Array.from({ length: size * size }).map((_, index) => <input key={index} maxLength="1" aria-label={`Crossword cell ${index + 1}`} />)}
      </div>
      <ol className="clues">{answers.map((entry, index) => <li key={index}>{entry.clue}</li>)}</ol>
    </MagazineSection>
  )
}

function Maze({ puzzle }) {
  const data = puzzle.puzzle ?? {}
  const rows = data.rows ?? 7
  const cols = data.cols ?? 7
  const walls = new Set((data.walls ?? []).map((cell) => cell.join(',')))
  const [marked, setMarked] = useState(new Set())

  return (
    <MagazineSection title={puzzle.title}>
      <div className="maze-grid" style={{ '--cols': cols }}>
        {Array.from({ length: rows * cols }).map((_, index) => {
          const row = Math.floor(index / cols)
          const col = index % cols
          const key = `${row},${col}`
          const isWall = walls.has(key)
          return (
            <button
              key={key}
              disabled={isWall}
              className={`${isWall ? 'wall' : ''} ${marked.has(key) ? 'marked' : ''}`}
              onClick={() => setMarked((old) => new Set(old).add(key))}
            >
              {key === (data.start ?? [0, 0]).join(',') ? 'S' : key === (data.finish ?? [rows - 1, cols - 1]).join(',') ? 'F' : ''}
            </button>
          )
        })}
      </div>
    </MagazineSection>
  )
}

function WordSearch({ puzzle }) {
  const [found, setFound] = useState([])
  const words = puzzle.puzzle?.words ?? []
  return (
    <MagazineSection title={puzzle.title}>
      <div className="word-grid">{(puzzle.puzzle?.grid ?? []).flatMap((row) => row.split('').map((letter, index) => <button key={`${row}-${index}`}>{letter}</button>))}</div>
      <div className="word-list">{words.map((word) => <button key={word} className={found.includes(word) ? 'found' : ''} onClick={() => setFound((old) => old.includes(word) ? old : [...old, word])}>{word}</button>)}</div>
    </MagazineSection>
  )
}

function Trivia({ puzzle }) {
  const [answers, setAnswers] = useState({})
  const questions = puzzle.puzzle?.questions ?? []
  const score = questions.filter((q, i) => answers[i] === q.answer).length
  return (
    <MagazineSection title={puzzle.title}>
      <p className="score">Score: {score}/{questions.length}</p>
      {questions.map((question, index) => (
        <div className="trivia" key={question.question}>
          <p>{question.difficulty && <span className="difficulty">{question.difficulty}</span>}{question.question}</p>
          {(question.options ?? []).map((option) => <button key={option} className={answers[index] === option ? 'selected' : ''} onClick={() => setAnswers({ ...answers, [index]: option })}>{option}</button>)}
          {answers[index] && question.explanation && <p className="explanation">{question.explanation}</p>}
        </div>
      ))}
    </MagazineSection>
  )
}

function LogicPuzzle({ puzzle }) {
  const [choice, setChoice] = useState('')
  const data = puzzle.puzzle ?? {}
  return (
    <MagazineSection title={puzzle.title}>
      <p>{data.setup}</p>
      <div className="word-list">
        {(data.choices ?? []).map((option) => <button key={option} className={choice === option ? 'selected' : ''} onClick={() => setChoice(option)}>{option}</button>)}
      </div>
      {choice && <p className="score">{choice === data.answer ? 'Correct.' : 'Not quite.'}</p>}
    </MagazineSection>
  )
}

function Subscribe({ setNotice }) {
  const [email, setEmail] = useState('')
  async function submit(event) {
    event.preventDefault()
    try {
      await fetchJson('/api/subscribers', { method: 'POST', body: JSON.stringify({ email }) })
      setEmail('')
      setNotice('Subscribed. New issues will arrive by email.')
    } catch {
      setNotice('Subscription failed. Check the API and email format.')
    }
  }
  return (
    <form className="subscribe" onSubmit={submit}>
      <h2>Subscribe</h2>
      <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="reader@example.com" type="email" required />
      <button>Get Issue Emails</button>
    </form>
  )
}

function About() {
  return (
    <main className="page">
      <h1>About</h1>
      <p>Puzzle Press is a human-reviewed, AI-assisted retro magazine. Every few days, a themed issue collects a short article and a stack of playable puzzles into one paper-like web edition.</p>
    </main>
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
              <Puzzle puzzle={puzzle} />
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

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: options.credentials ?? 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  })
  if (!response.ok) throw new Error('Request failed')
  return response.json()
}

function fetchAdmin(path, options = {}) {
  return fetchJson(path, { ...options, credentials: 'include' })
}

export default App
