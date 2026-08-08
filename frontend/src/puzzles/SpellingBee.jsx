import { useMemo, useState } from 'react'
import { PuzzleFrame } from './PuzzleFrame'
import { beeProgress, checkBeeWord, shuffle } from './logic'

const MESSAGES = {
  empty: 'Type a word first.',
  short: (data) => `Too short — ${data.minLength ?? 4} letters minimum.`,
  'no-center': (data) => `Every word must use ${data.center}.`,
  'bad-letter': 'That uses a letter outside the seven.',
  already: 'Already found.',
  unknown: 'Not on this list.',
}

export function SpellingBee({ puzzle }) {
  const data = puzzle.puzzle ?? {}
  const center = String(data.center ?? '').toUpperCase()
  const letters = (data.letters ?? []).map((letter) => letter.toUpperCase())
  const outer = useMemo(
    () => shuffle(letters.filter((letter) => letter !== center), letters.length || 1),
    [letters, center],
  )

  const [entry, setEntry] = useState('')
  const [found, setFound] = useState([])
  const [message, setMessage] = useState('')
  const progress = beeProgress(found, data)

  function submit(event) {
    event.preventDefault()
    const result = checkBeeWord(entry, data, found)
    if (result.status === 'ok') {
      setFound((old) => [...old, result.word].sort())
      setMessage(result.pangram ? `Pangram! ${result.word}` : `Good — ${result.word}`)
      setEntry('')
      return
    }
    const template = MESSAGES[result.status]
    setMessage(typeof template === 'function' ? template(data) : template)
  }

  return (
    <PuzzleFrame
      title={puzzle.title}
      note={`${progress.found} of ${progress.total} words · ${progress.pangramsFound}/${progress.pangramsTotal} pangrams`}
    >
      <div className="bee">
        <ul className="bee-hive">
          <li><button type="button" className="bee-cell is-center" onClick={() => setEntry((old) => old + center)}>{center}</button></li>
          {outer.map((letter) => (
            <li key={letter}>
              <button type="button" className="bee-cell" onClick={() => setEntry((old) => old + letter)}>{letter}</button>
            </li>
          ))}
        </ul>

        <form className="bee-form" onSubmit={submit}>
          <input
            value={entry}
            onChange={(event) => setEntry(event.target.value.toUpperCase())}
            placeholder="TYPE A WORD"
            aria-label="Your word"
            autoComplete="off"
          />
          <button className="ink-button">Enter</button>
          <button className="ink-button" type="button" onClick={() => setEntry('')}>Clear</button>
        </form>

        {message && <p className="verdict">{message}</p>}

        <div className="bee-bar" aria-hidden="true"><span style={{ width: `${progress.percent}%` }} /></div>

        <div className="pill-row">
          {found.map((word) => <span key={word} className="ink-button is-found">{word}</span>)}
        </div>
      </div>
    </PuzzleFrame>
  )
}
