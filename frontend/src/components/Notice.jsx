import './components.css'

export function Notice({ message, onDismiss }) {
  if (!message) return null
  return (
    <button className="notice" onClick={onDismiss} aria-live="polite">
      {message}
      <span className="chrome-line notice-close">dismiss ×</span>
    </button>
  )
}
