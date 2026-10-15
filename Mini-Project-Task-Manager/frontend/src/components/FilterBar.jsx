import { STATUS_OPTIONS, PRIORITY_OPTIONS, SEARCH_MAX } from '../utils/taskOptions.js';
import { hasActiveFilters } from '../utils/filters.js';

// The filter controls. The parent keeps the values and asks the backend for matching tasks.
export default function FilterBar({ filters, onChange, onClear }) {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });

  return (
    <div className="filter-bar" role="search" aria-label="Filter tasks">
      <label className="inline">
        Status
        <select value={filters.status} onChange={set('status')}>
          <option value="all">All</option>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <label className="inline">
        Priority
        <select value={filters.priority} onChange={set('priority')}>
          <option value="all">All</option>
          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <label className="inline grow">
        Search
        <input
          type="search"
          placeholder="Search title or details"
          value={filters.search}
          maxLength={SEARCH_MAX}
          onChange={set('search')}
        />
      </label>
      {hasActiveFilters(filters) && (
        <button className="btn btn-light" onClick={onClear}>Clear filters</button>
      )}
    </div>
  );
}
