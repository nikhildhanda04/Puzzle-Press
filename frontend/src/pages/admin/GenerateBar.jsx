import { SECTION_LABELS } from '../../puzzles/logic'
import './admin.css'

export function GenerateBar({ sections, busy, onGenerate }) {
  return (
    <div className="pill-row">
      {sections.map((section) => (
        <button
          key={section}
          className="ink-button"
          disabled={Boolean(busy)}
          onClick={() => onGenerate(section)}
        >
          {busy === `Generate ${section}` ? 'Working…' : `Remake ${SECTION_LABELS[section] ?? section}`}
        </button>
      ))}
    </div>
  )
}
