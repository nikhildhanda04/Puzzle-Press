import { Poster } from '../components/Poster'
import { SectionDivider } from '../components/SectionDivider'
import { PuzzleRenderer } from '../puzzles'
import { SECTION_LABELS } from '../puzzles/logic'
import './pages.css'

export function IssuePage({ issue }) {
  const date = issue.publishedAt
    ? new Date(issue.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Draft preview'

  return (
    <main>
      <Poster issue={issue} kicker={date} />

      <div className="page-width">
        <SectionDivider index={0} type="editorNote" title="Editor's note" />
        <div className="prose"><p>{issue.editorNote}</p></div>

        <SectionDivider index={1} type="article" title={issue.articleTitle || SECTION_LABELS.article} />
        <div className="prose"><p>{issue.articleBody}</p></div>

        {(issue.puzzles ?? []).map((puzzle, index) => (
          <div key={puzzle.id ?? puzzle.type}>
            <SectionDivider
              index={index + 2}
              type={puzzle.type}
              title={puzzle.title || SECTION_LABELS[puzzle.type] || puzzle.type}
            />
            <PuzzleRenderer puzzle={puzzle} />
          </div>
        ))}

        <SectionDivider index={(issue.puzzles?.length ?? 0) + 2} type="teaser" title="Next issue" />
        <div className="prose"><p>{issue.teaser}</p></div>
      </div>
    </main>
  )
}
