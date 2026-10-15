// Connects URLs + HTTP methods to controller functions.
const express = require('express');
const {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
} = require('../controllers/todoController');
const {
  validateCreateTodo,
  validateUpdateTodo,
  validateObjectId,
} = require('../middleware/validateTodo');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Week 3: every to-do route now needs a valid login token.
router.use(protect);

router.route('/').get(getTodos).post(validateCreateTodo, createTodo);

router
  .route('/:id')
  .get(validateObjectId, getTodoById)
  .put(validateObjectId, validateUpdateTodo, updateTodo)
  .patch(validateObjectId, validateUpdateTodo, updateTodo)
  .delete(validateObjectId, deleteTodo);

module.exports = router;
