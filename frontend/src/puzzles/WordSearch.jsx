import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { toggleFound } from './logic'

export function WordSearch({ puzzle }) {
  const grid = puzzle.puzzle?.grid ?? []
  const words = puzzle.puzzle?.words ?? []
  const cols = grid[0]?.length ?? 7
  const [found, setFound] = useState([])

  return (
    <PuzzleFrame title={puzzle.title} note={`${found.length} of ${words.length} struck off`}>
      <div className="grid-ink word-grid" style={{ '--size': cols }}>
        {grid.flatMap((row, rowIndex) =>
          row.split('').map((letter, colIndex) => (
            <span className="cell is-static" key={`${rowIndex}-${colIndex}`}>{letter}</span>
          )),
        )}
      </div>
      <div className="pill-row">
        {words.map((word) => (
          <button
            key={word}
            className={`ink-button ${found.includes(word) ? 'is-struck' : ''}`}
            onClick={() => setFound((old) => toggleFound(old, word))}
          >
            {word}
          </button>
        ))}
      </div>
    </PuzzleFrame>
  )
}
