const { validationResult, body } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');

const buildTaskQuery = async (user) => {
  if (user.role === 'manager') {
    return {};
  }

  if (user.role === 'teamlead') {
    const teamMembers = await User.find({ teamLead: user.id }).select('_id');
    const memberIds = teamMembers.map((m) => m._id);
    return { assignedTo: { $in: [user.id, ...memberIds] } };
  }

  const employeeDoc = await User.findById(user._id || user.id).select('teamLead');
  if (employeeDoc && employeeDoc.teamLead) {
    const teammates = await User.find({
      teamLead: employeeDoc.teamLead,
      role: 'employee',
    }).select('_id');
    const teammateIds = teammates.map((m) => m._id);
    return { $or: [{ assignedTo: { $in: teammateIds } }, { createdBy: { $in: teammateIds } }] };
  }
  return { $or: [{ assignedTo: user._id || user.id }, { createdBy: user._id || user.id }] };
};

const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 50 } = req.query;

    const query = await buildTaskQuery(req.user);

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo && req.user.role !== 'employee') query.assignedTo = assignedTo;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'username email role')
        .populate('createdBy', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const hasAccess = await canAccessTask(req.user, task);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    let taskAssignedTo = req.user.id; 

    if (req.user.role === 'employee') {
      taskAssignedTo = req.user.id;
    } else if (req.user.role === 'teamlead') {
      if (assignedTo && assignedTo !== req.user.id.toString()) {
        const member = await User.findOne({
          _id: assignedTo,
          teamLead: req.user.id,
        });
        if (!member) {
          return res.status(403).json({
            success: false,
            message: 'You can only assign tasks to your team members.',
          });
        }
        taskAssignedTo = assignedTo;
      } else if (assignedTo) {
        taskAssignedTo = assignedTo;
      }
    } else if (req.user.role === 'manager') {
      if (assignedTo) taskAssignedTo = assignedTo;
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      assignedTo: taskAssignedTo,
      createdBy: req.user.id,
      dueDate: dueDate || null,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email role');

    const io = req.app.get('io');
    if (io) {
      io.emit('task:created', populatedTask);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const hasAccess = await canAccessTask(req.user, task);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }


    if (req.user.role === 'employee') {
      const assignedToStr = (task.assignedTo._id || task.assignedTo).toString();
      const userId = (req.user._id || req.user.id).toString();
      if (assignedToStr !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update tasks assigned to you.',
        });
      }
    }

    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    if (assignedTo && assignedTo !== task.assignedTo.toString()) {
      if (req.user.role === 'teamlead') {
        const member = await User.findOne({ _id: assignedTo, teamLead: req.user.id });
        const isSelf = assignedTo === req.user.id.toString();
        if (!member && !isSelf) {
          return res.status(403).json({
            success: false,
            message: 'You can only reassign tasks to your team members.',
          });
        }
      }
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'username email role')
      .populate('createdBy', 'username email role');

    const io = req.app.get('io');
    if (io) {
      io.emit('task:updated', updatedTask);
    }

    res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }


    if (req.user.role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Employees are not allowed to delete tasks.',
      });
    }

    if (req.user.role === 'teamlead') {
      const teamMembers = await User.find({ teamLead: req.user.id }).select('_id');
      const memberIds = teamMembers.map((m) => m._id.toString());
      const assignedToStr = (task.assignedTo._id || task.assignedTo).toString();
      const isOnBoard = assignedToStr === req.user.id.toString() || memberIds.includes(assignedToStr);
      if (!isOnBoard) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete tasks on your team board.',
        });
      }
    }

    await task.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.emit('task:deleted', { taskId: req.params.id });
    }

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const canAccessTask = async (user, task) => {
  if (user.role === 'manager') return true;

  const userId = (user._id || user.id).toString();

  if (user.role === 'teamlead') {
    const teamMembers = await User.find({ teamLead: userId }).select('_id');
    const memberIds = teamMembers.map((m) => m._id.toString());
    const assignedToStr = (task.assignedTo._id || task.assignedTo).toString();
    return assignedToStr === userId || memberIds.includes(assignedToStr);
  }

  const assignedToStr = (task.assignedTo._id || task.assignedTo).toString();
  const createdByStr = (task.createdBy._id || task.createdBy).toString();
  return assignedToStr === userId || createdByStr === userId;
};

const taskValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be 3-100 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority value'),
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be 3-100 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed'])
    .withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority value'),
];

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  taskValidation,
  updateTaskValidation,
};
