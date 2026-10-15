// The allowed values and limits for tasks, in ONE place (no dependencies, easy to test).
const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;
const SEARCH_MAX = 100;

module.exports = { STATUSES, PRIORITIES, TITLE_MAX, DESCRIPTION_MAX, SEARCH_MAX };
