import { useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'

export function LogicPuzzle({ puzzle }) {
  const data = puzzle.puzzle ?? {}
  const [choice, setChoice] = useState('')

  return (
    <PuzzleFrame title={puzzle.title}>
      <p className="logic-setup">{data.setup}</p>
      <div className="pill-row">
        {(data.choices ?? []).map((option) => (
          <button
            key={option}
            className={`ink-button ${choice === option ? 'is-on' : ''}`}
            onClick={() => setChoice(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {choice && (
        <p className={choice === data.answer ? 'verdict is-right' : 'verdict is-wrong'}>
          {choice === data.answer ? 'Correct.' : 'Not quite.'}
        </p>
      )}
    </PuzzleFrame>
  )
}
