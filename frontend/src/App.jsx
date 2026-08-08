import { useEffect, useMemo, useState } from 'react'
import { fetchJson, fetchAdmin } from './lib/api'
import { useRoute } from './lib/useRoute'
import { Home } from './pages/Home'
import { Archive } from './pages/Archive'
import { IssuePage } from './pages/IssuePage'
import { About } from './pages/About'
import { AdminPage } from './pages/admin/AdminPage'
import './App.css'

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
        <AdminPage
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

export default App
