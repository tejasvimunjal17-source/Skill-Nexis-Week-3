// Allowed values shown in the screens. The backend (backend/src/config/taskOptions.js) is the one
// that really enforces them; keep both lists the same.
export const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;
export const SEARCH_MAX = 100;

export const labelFor = (options, value) =>
  options.find((o) => o.value === value)?.label ?? value;
