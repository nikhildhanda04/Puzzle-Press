import { Poster } from '../components/Poster'
import { Subscribe } from '../components/Subscribe'
import { devanagariNumber } from '../lib/devanagari'
import { SECTION_LABELS } from '../puzzles/logic'
import './pages.css'

export function Home({ issue, issues, navigate, setNotice }) {
  return (
    <main>
      <Poster
        issue={issue}
        kicker="Fresh off the press"
        action={
          <button className="ink-button poster-action" onClick={() => navigate(`/issues/${issue.slug}`)}>
            Read this issue
          </button>
        }
      />

      <div className="page-width columns">
        <article className="col-main">
          <p className="chrome-line">This issue's story</p>
          <h2>{issue.articleTitle}</h2>
          <p>{issue.articleBody}</p>
        </article>

        <aside className="col-side">
          <p className="chrome-line">Inside</p>
          <ol className="contents">
            {(issue.puzzles ?? []).map((puzzle, index) => (
              <li key={puzzle.id ?? puzzle.type}>
                <span className="contents-number">{devanagariNumber(String(index + 1).padStart(2, '0'))}</span>
                <span>{puzzle.title || SECTION_LABELS[puzzle.type] || puzzle.type}</span>
              </li>
            ))}
          </ol>
          <Subscribe setNotice={setNotice} />
        </aside>
      </div>

      <section className="page-width back-issues">
        <h2>Back issues</h2>
        <div className="issue-cards">
          {issues.map((old) => (
            <button key={old.slug} className="issue-card" onClick={() => navigate(`/issues/${old.slug}`)}>
              <span className="issue-card-number">{devanagariNumber(String(old.number).padStart(3, '0'))}</span>
              <strong>{old.theme ?? old.title}</strong>
              <span className="chrome-line">{old.teaser}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
