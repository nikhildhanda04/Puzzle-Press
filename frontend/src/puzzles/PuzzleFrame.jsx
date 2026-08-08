import './puzzles.css'

export function PuzzleFrame({ title, note, children }) {
  return (
    <section className="puzzle-frame">
      {title && <h3 className="puzzle-title">{title}</h3>}
      {note && <p className="chrome-line">{note}</p>}
      {children}
    </section>
  )
}
