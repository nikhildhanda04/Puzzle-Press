import { useMemo, useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { checkConnectionsGuess, connectionsNearMiss, shuffle, toggleSelection } from './logic'

const BANDS = ['var(--yellow)', 'var(--vermilion)', 'var(--violet)', 'var(--magenta)']
const MISTAKE_LIMIT = 4

export function Connections({ puzzle }) {
  const groups = puzzle.puzzle?.groups ?? []
  const board = useMemo(
    () => {
      const shuffleGroups = puzzle.puzzle?.groups ?? []
      return shuffle(shuffleGroups.flatMap((group) => group.words ?? []), shuffleGroups.length + 11)
    },
    [puzzle],
  )

  const [selection, setSelection] = useState([])
  const [solved, setSolved] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [message, setMessage] = useState('')

  const locked = new Set(solved.flatMap((group) => group.words))
  const remaining = board.filter((word) => !locked.has(word))
  const over = mistakes >= MISTAKE_LIMIT
  const won = solved.length === groups.length && groups.length > 0

  function submit() {
    const result = checkConnectionsGuess(groups, selection)
    if (result.correct) {
      setSolved((old) => [...old, { category: result.category, words: result.words }])
      setSelection([])
      setMessage('')
      return
    }
    setMistakes((old) => old + 1)
    setMessage(connectionsNearMiss(groups, selection) ? 'One away.' : 'Not a group.')
  }

  return (
    <PuzzleFrame
      title={puzzle.title}
      note={`Pick four that belong together · ${MISTAKE_LIMIT - mistakes} mistakes left`}
    >
      {solved.map((group, index) => (
        <div className="conn-band" key={group.category} style={{ '--band': BANDS[index % BANDS.length] }}>
          <strong>{group.category}</strong>
          <span>{group.words.join(' · ')}</span>
        </div>
      ))}

      {!won && !over && (
        <>
          <div className="conn-board">
            {remaining.map((word) => (
              <button
                key={word}
                className={`conn-word ${selection.includes(word) ? 'is-on' : ''}`}
                onClick={() => setSelection((old) => toggleSelection(old, word))}
              >
                {word}
              </button>
            ))}
          </div>

          <div className="pill-row">
            <button className="ink-button" disabled={selection.length !== 4} onClick={submit}>Submit</button>
            <button className="ink-button" onClick={() => setSelection([])}>Deselect</button>
          </div>
        </>
      )}

      {message && !won && <p className="verdict is-wrong">{message}</p>}
      {won && <p className="verdict is-right">All four groups. Cleanly done.</p>}
      {over && !won && (
        <div className="conn-reveal">
          <p className="verdict is-wrong">Out of guesses. The groups were:</p>
          {groups.map((group) => (
            <p key={group.category}><strong>{group.category}</strong> — {group.words.join(' · ')}</p>
          ))}
        </div>
      )}
    </PuzzleFrame>
  )
}
