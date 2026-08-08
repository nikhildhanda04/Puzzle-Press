import { Crossword } from './Crossword'
import { Maze } from './Maze'
import { WordSearch } from './WordSearch'
import { SpellingBee } from './SpellingBee'
import { Connections } from './Connections'
import { Trivia } from './Trivia'
import { LogicPuzzle } from './LogicPuzzle'
import { PuzzleFrame } from './PuzzleFrame'
import { SECTION_LABELS } from './logic'

// A lookup table, not a factory. Adding a backend puzzle type means adding one
// line here; anything missing renders a visible placeholder rather than a JSON dump.
// eslint-disable-next-line react-refresh/only-export-components -- PUZZLE_RENDERERS is a required export (Tasks 9/10 depend on it), not just an internal constant to hoist elsewhere.
export const PUZZLE_RENDERERS = {
  crossword: Crossword,
  maze: Maze,
  'word-search': WordSearch,
  'spelling-bee': SpellingBee,
  connections: Connections,
  trivia: Trivia,
  reasoning: Trivia,
  logic: LogicPuzzle,
}

export function PuzzleRenderer({ puzzle }) {
  const Renderer = PUZZLE_RENDERERS[puzzle.type]
  if (Renderer) return <Renderer puzzle={puzzle} />

  return (
    <PuzzleFrame title={puzzle.title || SECTION_LABELS[puzzle.type] || puzzle.type}>
      <p className="verdict is-wrong">No renderer for “{puzzle.type}” yet.</p>
    </PuzzleFrame>
  )
}
