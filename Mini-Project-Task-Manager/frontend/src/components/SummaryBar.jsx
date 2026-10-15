import { STATUS_OPTIONS } from '../utils/taskOptions.js';

// Shows how many tasks the user has in each status (counts ignore the filters).
export default function SummaryBar({ summary }) {
  if (!summary) return null;
  return (
    <p className="summary" aria-label="Task summary">
      {STATUS_OPTIONS.map((o) => (
        <span key={o.value} className="chip">{o.label}: <strong>{summary[o.value] ?? 0}</strong></span>
      ))}
      <span className="chip">Total: <strong>{summary.total ?? 0}</strong></span>
    </p>
  );
}
