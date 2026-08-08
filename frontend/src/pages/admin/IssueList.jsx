import './admin.css'

export function IssueList({ issues, selectedIssueId, onSelect }) {
  return (
    <div className="issue-list">
      <h2>Issues</h2>
      {issues.length === 0 && <p className="chrome-line">No issues yet.</p>}
      {issues.map((issue) => (
        <button
          key={issue.id}
          className={`admin-row ${issue.id === selectedIssueId ? 'is-on' : ''}`}
          onClick={() => onSelect(issue.id)}
        >
          <strong>{issue.title}</strong>
          <span className="chrome-line">{issue.status}</span>
        </button>
      ))}
    </div>
  )
}
