// Turns the filters from the URL (?status=done&priority=high&search=milk) into a MongoDB filter.
//
// Safety rules:
//  - the filter ALWAYS contains the logged-in user's id, and nothing in the URL can change that;
//  - every value must be plain text from the allowed list (this blocks "NoSQL injection" such as
//    ?status[$ne]=x, where the value would be an object instead of text);
//  - the search text is escaped, so characters like "." or "(" are searched literally.
const { STATUSES, PRIORITIES, SEARCH_MAX } = require('../config/taskOptions');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "all" or an empty value means "do not filter by this".
const readChoice = (value, allowed, label, errors) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    errors.push(`${label} must be a single text value`);
    return undefined;
  }
  const clean = value.trim();
  if (clean === '' || clean === 'all') return undefined;
  if (!allowed.includes(clean)) {
    errors.push(`${label} must be one of: ${allowed.join(', ')} (or "all")`);
    return undefined;
  }
  return clean;
};

// Returns { filter, errors }. If errors is not empty, the request must be rejected.
const buildTaskFilter = (query, userId) => {
  const errors = [];
  const source = query && typeof query === 'object' ? query : {};

  const status = readChoice(source.status, STATUSES, 'Status', errors);
  const priority = readChoice(source.priority, PRIORITIES, 'Priority', errors);

  let search;
  if (source.search !== undefined) {
    if (typeof source.search !== 'string') {
      errors.push('Search must be a single text value');
    } else {
      const text = source.search.trim();
      if (text.length > SEARCH_MAX) {
        errors.push(`Search cannot be longer than ${SEARCH_MAX} characters`);
      } else if (text !== '') {
        search = text;
      }
    }
  }

  const filter = { user: userId }; // always first, always the logged-in user
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i'); // "i" = ignore upper/lower case
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  return { filter, errors };
};

module.exports = { buildTaskFilter, escapeRegex };
