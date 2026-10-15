// Connects URLs + HTTP methods to controller functions.
const express = require('express');
const {
  createTask,
  getTasks,
  getTaskSummary,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const {
  validateCreateTask,
  validateUpdateTask,
  validateObjectId,
} = require('../middleware/validateTask');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Every task route needs a valid login token.
router.use(protect);

router.route('/').get(getTasks).post(validateCreateTask, createTask);

// "/summary" must come BEFORE "/:id", otherwise "summary" would be treated as an id.
router.get('/summary', getTaskSummary);

router
  .route('/:id')
  .get(validateObjectId, getTaskById)
  .put(validateObjectId, validateUpdateTask, updateTask)
  .patch(validateObjectId, validateUpdateTask, updateTask)
  .delete(validateObjectId, deleteTask);

module.exports = router;
