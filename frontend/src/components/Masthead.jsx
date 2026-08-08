import { devanagariNumber } from '../lib/devanagari'
import './components.css'

export function Masthead({ navigate, issueNumber = 1 }) {
  return (
    <header className="masthead">
      <div className="masthead-top page-width">
        <span className="chrome-line">Est. 2026 · New Delhi 110030</span>
        <span className="chrome-line">अंक {devanagariNumber(String(issueNumber).padStart(3, '0'))}</span>
      </div>

      <button className="wordmark" onClick={() => navigate('/')}>
        <span className="wordmark-dev misprint">पहेली</span>
        <span className="wordmark-latin">PUZZLE PRESS</span>
      </button>

      <nav className="masthead-nav page-width">
        <button className="ink-button" onClick={() => navigate('/issues')}>Archive</button>
        <button className="ink-button" onClick={() => navigate('/about')}>About</button>
        <button className="ink-button" onClick={() => navigate('/admin')}>Desk</button>
      </nav>
    </header>
  )
}
