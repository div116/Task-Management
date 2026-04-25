const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  taskValidation,
  updateTaskValidation,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTasks).post(taskValidation, createTask);

router
  .route('/:id')
  .get(getTask)
  .put(updateTaskValidation, updateTask)
  .delete(deleteTask);

module.exports = router;
