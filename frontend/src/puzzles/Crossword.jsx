import { PuzzleFrame } from './PuzzleFrame'

export function Crossword({ puzzle }) {
  const entries = puzzle.puzzle?.entries ?? []
  const size = puzzle.puzzle?.size ?? 7

  return (
    <PuzzleFrame title={puzzle.title}>
      <div className="grid-ink crossword-grid" style={{ '--size': size }}>
        {Array.from({ length: size * size }).map((_, index) => (
          <input key={index} maxLength="1" aria-label={`Cell ${index + 1}`} />
        ))}
      </div>
      <ol className="clues">
        {entries.map((entry, index) => (
          <li key={`${entry.direction}-${entry.row}-${entry.col}-${index}`}>
            <span className="chrome-line">{entry.direction}</span> {entry.clue}
          </li>
        ))}
      </ol>
    </PuzzleFrame>
  )
}
