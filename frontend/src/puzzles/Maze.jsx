import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'

export function Maze({ puzzle }) {
  const data = puzzle.puzzle ?? {}
  const rows = data.rows ?? 7
  const cols = data.cols ?? 7
  const walls = new Set((data.walls ?? []).map((cell) => cell.join(',')))
  const start = (data.start ?? [0, 0]).join(',')
  const finish = (data.finish ?? [rows - 1, cols - 1]).join(',')
  const [marked, setMarked] = useState(() => new Set())

  function mark(key) {
    setMarked((old) => {
      const next = new Set(old)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <PuzzleFrame title={puzzle.title} note="Tap cells to trace your route.">
      <div className="grid-ink maze-grid" style={{ '--size': cols }}>
        {Array.from({ length: rows * cols }).map((_, index) => {
          const key = `${Math.floor(index / cols)},${index % cols}`
          const isWall = walls.has(key)
          return (
            <button
              key={key}
              disabled={isWall}
              aria-label={`Cell ${key}`}
              className={`cell ${isWall ? 'is-wall' : ''} ${marked.has(key) ? 'is-marked' : ''}`}
              onClick={() => mark(key)}
            >
              {key === start ? 'S' : key === finish ? 'F' : ''}
            </button>
          )
        })}
      </div>
    </PuzzleFrame>
  )
}
