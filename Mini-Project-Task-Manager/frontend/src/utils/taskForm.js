// Checks the add/edit form in the browser BEFORE sending it. The backend checks again.
import { TITLE_MAX, DESCRIPTION_MAX, STATUS_OPTIONS, PRIORITY_OPTIONS } from './taskOptions.js';

// Returns an error message, or null when the values are fine.
export const validateTaskForm = ({ title, description, status, priority }) => {
  if (!String(title ?? '').trim()) return 'Title is required.';
  if (title.trim().length > TITLE_MAX) return `Title cannot be longer than ${TITLE_MAX} characters.`;
  if (String(description ?? '').trim().length > DESCRIPTION_MAX) {
    return `Description cannot be longer than ${DESCRIPTION_MAX} characters.`;
  }
  if (!STATUS_OPTIONS.some((o) => o.value === status)) return 'Please choose a valid status.';
  if (!PRIORITY_OPTIONS.some((o) => o.value === priority)) return 'Please choose a valid priority.';
  return null;
};
