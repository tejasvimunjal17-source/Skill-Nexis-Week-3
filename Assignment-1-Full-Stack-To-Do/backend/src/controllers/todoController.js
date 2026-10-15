// Controllers hold the logic for each API route.
// Week 3 change: every query is limited to the logged-in user (req.user),
// so one user can never read, change or delete another user's to-dos.
const Todo = require('../models/Todo');
const asyncHandler = require('../middleware/asyncHandler');
const { ALLOWED_FIELDS } = require('../middleware/validateTodo');

// Keep only the fields we allow, so nobody can set other values (like "user").
const pickAllowedFields = (body) =>
  ALLOWED_FIELDS.reduce((result, field) => {
    if (body[field] !== undefined) result[field] = body[field];
    return result;
  }, {});

// POST /api/todos  -> create a task for the logged-in user
const createTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.create({ ...pickAllowedFields(req.body), user: req.user._id });
  res.status(201).json({
    success: true,
    message: 'Todo created successfully',
    data: todo,
  });
});

// GET /api/todos  -> get the logged-in user's tasks (newest first)
const getTodos = asyncHandler(async (req, res) => {
  const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: todos.length,
    data: todos,
  });
});

// GET /api/todos/:id  -> get one task (only if it belongs to the user)
const getTodoById = asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
  if (!todo) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }
  res.status(200).json({ success: true, data: todo });
});

// PUT/PATCH /api/todos/:id  -> update a task (only if it belongs to the user)
const updateTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    pickAllowedFields(req.body),
    { new: true, runValidators: true }
  );
  if (!todo) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }
  res.status(200).json({
    success: true,
    message: 'Todo updated successfully',
    data: todo,
  });
});

// DELETE /api/todos/:id  -> delete a task (only if it belongs to the user)
const deleteTodo = asyncHandler(async (req, res) => {
  const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!todo) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }
  res.status(200).json({
    success: true,
    message: 'Todo deleted successfully',
    data: todo,
  });
});

module.exports = { createTodo, getTodos, getTodoById, updateTodo, deleteTodo };
