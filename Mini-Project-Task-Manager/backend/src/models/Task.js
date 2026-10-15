// The Task schema describes what a task looks like in MongoDB.
const mongoose = require('mongoose');
const { STATUSES, PRIORITIES, TITLE_MAX, DESCRIPTION_MAX } = require('../config/taskOptions');

const taskSchema = new mongoose.Schema(
  {
    // The user who owns this task. Every query is limited to the logged-in user.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [TITLE_MAX, `Title cannot be longer than ${TITLE_MAX} characters`],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [DESCRIPTION_MAX, `Description cannot be longer than ${DESCRIPTION_MAX} characters`],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of: ${STATUSES.join(', ')}` },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: `Priority must be one of: ${PRIORITIES.join(', ')}` },
      default: 'medium',
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Task', taskSchema);
