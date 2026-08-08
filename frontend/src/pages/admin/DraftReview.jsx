import { GenerateBar } from './GenerateBar'
import { PuzzleRenderer } from '../../puzzles'
import { SECTION_LABELS } from '../../puzzles/logic'
import './admin.css'

export function DraftReview({ issue, prompt, setPrompt, busy, onGenerate, onPublish }) {
  // Derived from the issue itself, so it tracks the backend's puzzleTypes automatically.
  const sections = ['article', ...(issue.puzzles ?? []).map((puzzle) => puzzle.type)]

  return (
    <section className="review">
      <h2>{issue.title} <span className="chrome-line">{issue.status}</span></h2>

      <label className="prompt-box">
        <span className="chrome-line">Prompt for the next generation. Blank uses the saved template.</span>
        <textarea
          rows="4"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="e.g. base the article on this story, change the names, keep it warm. Make the reasoning questions easier."
        />
      </label>

      <GenerateBar sections={sections} busy={busy} onGenerate={onGenerate} />

      <article className="draft">
        <h3>{SECTION_LABELS.article}</h3>
        <p className="chrome-line">{issue.articleTitle}</p>
        <p><em>{issue.editorNote}</em></p>
        <p>{issue.articleBody}</p>
        <p><strong>Teaser:</strong> {issue.teaser}</p>
      </article>

      {(issue.puzzles ?? []).map((puzzle) => (
        <article className="draft" key={puzzle.id ?? puzzle.type}>
          <h3>{SECTION_LABELS[puzzle.type] ?? puzzle.type}</h3>
          {puzzle.prompt && <p className="chrome-line">Prompt used: {puzzle.prompt}</p>}
          <PuzzleRenderer puzzle={puzzle} />
          <details>
            <summary className="chrome-line">Answers and hints</summary>
            <pre>{JSON.stringify({ solution: puzzle.solution, hints: puzzle.hints }, null, 2)}</pre>
          </details>
        </article>
      ))}

      <div className="pill-row">
        <button className="ink-button publish" disabled={Boolean(busy)} onClick={onPublish}>
          {busy === 'Publish' ? 'Publishing…' : 'Publish and email subscribers'}
        </button>
      </div>
    </section>
  )
}
