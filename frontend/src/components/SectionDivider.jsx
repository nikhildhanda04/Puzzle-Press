import { devanagariNumber } from '../lib/devanagari'
import { SECTION_LABELS } from '../puzzles/logic'
import './components.css'

export function SectionDivider({ index, type, title, mediaUrl = null }) {
  return (
    <div className="divider">
      <span className="divider-number">{devanagariNumber(String(index).padStart(2, '0'))}</span>
      <span className="divider-label chrome-line">{SECTION_LABELS[type] ?? type}</span>
      <span className="divider-rule" aria-hidden="true" />
      {mediaUrl
        ? <img className="divider-art" src={mediaUrl} alt="" />
        : <span className="divider-art divider-art-fallback halftone" aria-hidden="true" />}
      <h2 className="divider-title">{title}</h2>
    </div>
  )
}
