import { devanagariNumber } from '../lib/devanagari'
import './components.css'

export function Poster({ issue, mediaUrl = null, kicker = 'Fresh off the press', action = null }) {
  const number = String(issue?.number ?? 1).padStart(3, '0')

  return (
    <section className="poster">
      <div className="poster-rays sunburst" aria-hidden="true" />
      {mediaUrl && <img className="poster-art" src={mediaUrl} alt="" />}
      <div className="poster-grid halftone" aria-hidden="true" />

      <div className="poster-body page-width">
        <p className="chrome-line poster-kicker">{kicker}</p>
        <p className="poster-number">{devanagariNumber(number)}</p>
        <h1 className="poster-title misprint">{issue?.theme ?? issue?.title ?? 'Puzzle Press'}</h1>
        <p className="poster-sub">Issue #{number} · {issue?.title}</p>
        {action}
      </div>

      <p className="chrome-line poster-credit">पहेली प्रेस · Design by Krash</p>
    </section>
  )
}
