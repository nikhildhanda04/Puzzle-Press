import { devanagariNumber } from '../lib/devanagari'
import './pages.css'

export function Archive({ issues, navigate }) {
  return (
    <main className="page-width">
      <h1 className="misprint">Archive</h1>
      <p className="chrome-line">Every issue, still playable</p>
      <div className="issue-cards">
        {issues.map((issue) => (
          <button key={issue.slug} className="issue-card" onClick={() => navigate(`/issues/${issue.slug}`)}>
            <span className="issue-card-number">{devanagariNumber(String(issue.number).padStart(3, '0'))}</span>
            <strong>{issue.theme ?? issue.title}</strong>
            <span className="chrome-line">{issue.teaser}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
