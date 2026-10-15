// Controllers hold the logic for each API route.
// Every query is limited to the logged-in user (req.user), so one user can never
// read, change or delete another user's tasks, even by guessing an id.
const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');
const { ALLOWED_FIELDS } = require('../middleware/validateTask');
const { buildTaskFilter } = require('../utils/taskFilter');
const { STATUSES } = require('../config/taskOptions');

// Keep only the fields we allow (so nobody can set "user" or other values),
// and trim extra spaces from the text fields.
const pickAllowedFields = (body) =>
  ALLOWED_FIELDS.reduce((result, field) => {
    if (body[field] === undefined) return result;
    result[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    return result;
  }, {});

// POST /api/tasks  -> create a task for the logged-in user
const createTask = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...pickAllowedFields(req.body), user: req.user._id });
  res.status(201).json({ success: true, message: 'Task created successfully', data: task });
});

// GET /api/tasks?status=&priority=&search=  -> the logged-in user's tasks, filtered (newest first)
const getTasks = asyncHandler(async (req, res) => {
  const { filter, errors } = buildTaskFilter(req.query, req.user._id);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Invalid filter', errors });
  }
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

// GET /api/tasks/summary  -> how many tasks the user has in each status
const getTaskSummary = asyncHandler(async (req, res) => {
  const counts = await Promise.all(
    STATUSES.map((status) => Task.countDocuments({ user: req.user._id, status }))
  );
  const summary = STATUSES.reduce((result, status, index) => {
    result[status] = counts[index];
    return result;
  }, {});
  summary.total = counts.reduce((sum, n) => sum + n, 0);
  res.status(200).json({ success: true, data: summary });
});

// GET /api/tasks/:id  -> one task (only if it belongs to the user)
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.status(200).json({ success: true, data: task });
});

// PUT/PATCH /api/tasks/:id  -> update a task (only if it belongs to the user)
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pickAllowedFields(req.body),
    { new: true, runValidators: true }
  );
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
});

// DELETE /api/tasks/:id  -> delete a task (only if it belongs to the user)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.status(200).json({ success: true, message: 'Task deleted successfully', data: task });
});

module.exports = { createTask, getTasks, getTaskSummary, getTaskById, updateTask, deleteTask };
