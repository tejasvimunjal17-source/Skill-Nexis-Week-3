// Filter helpers: what the filter bar holds, and what is sent to the backend.
import { SEARCH_MAX } from './taskOptions.js';

export const DEFAULT_FILTERS = { status: 'all', priority: 'all', search: '' };

// Only filters that are really in use are sent in the address (?status=done&priority=high&search=milk).
export const buildTaskParams = (filters) => {
  const params = {};
  if (filters.status && filters.status !== 'all') params.status = filters.status;
  if (filters.priority && filters.priority !== 'all') params.priority = filters.priority;
  const search = String(filters.search ?? '').trim().slice(0, SEARCH_MAX);
  if (search) params.search = search;
  return params;
};

export const hasActiveFilters = (filters) => Object.keys(buildTaskParams(filters)).length > 0;
