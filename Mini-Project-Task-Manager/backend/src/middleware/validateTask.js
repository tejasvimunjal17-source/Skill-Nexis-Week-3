// Basic request validation for task data.
// Mongoose also validates, but checking early gives clearer error messages.
const { STATUSES, PRIORITIES, TITLE_MAX, DESCRIPTION_MAX } = require('../config/taskOptions');

const ALLOWED_FIELDS = ['title', 'description', 'status', 'priority'];

// Returns a list of error messages (empty list = valid).
// partial = true is used for updates, where every field is optional.
const getTaskErrors = (body, { partial = false } = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['Request body must be a JSON object'];
  }

  const errors = [];
  const { title, description, status, priority } = body;

  if (title === undefined) {
    if (!partial) errors.push('Title is required');
  } else if (typeof title !== 'string' || title.trim() === '') {
    errors.push('Title must be a non-empty string');
  } else if (title.trim().length > TITLE_MAX) {
    errors.push(`Title cannot be longer than ${TITLE_MAX} characters`);
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else if (description.trim().length > DESCRIPTION_MAX) {
      errors.push(`Description cannot be longer than ${DESCRIPTION_MAX} characters`);
    }
  }

  if (status !== undefined && !STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${STATUSES.join(', ')}`);
  }

  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${PRIORITIES.join(', ')}`);
  }

  if (partial && !ALLOWED_FIELDS.some((field) => body[field] !== undefined)) {
    errors.push('Provide at least one field to update: title, description, status or priority');
  }

  return errors;
};

const sendValidationError = (res, errors) =>
  res.status(400).json({ success: false, message: 'Validation failed', errors });

const validateCreateTask = (req, res, next) => {
  const errors = getTaskErrors(req.body);
  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

const validateUpdateTask = (req, res, next) => {
  const errors = getTaskErrors(req.body, { partial: true });
  if (errors.length > 0) return sendValidationError(res, errors);
  next();
};

// A MongoDB id is 24 hexadecimal characters.
const validateObjectId = (req, res, next) => {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid task ID format' });
  }
  next();
};

module.exports = {
  ALLOWED_FIELDS,
  getTaskErrors,
  validateCreateTask,
  validateUpdateTask,
  validateObjectId,
};
