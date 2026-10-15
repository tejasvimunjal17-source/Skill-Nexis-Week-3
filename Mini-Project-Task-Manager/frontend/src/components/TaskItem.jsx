import { useState } from 'react';
import TaskForm from './TaskForm.jsx';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, labelFor } from '../utils/taskOptions.js';

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="task">
        <TaskForm
          initial={task}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(task._id, values);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className={`task ${task.status === 'done' ? 'done' : ''}`}>
      <div className="task-text">
        <strong>{task.title}</strong>
        <span className={`badge priority-${task.priority}`}>{labelFor(PRIORITY_OPTIONS, task.priority)}</span>
        {task.description && <p>{task.description}</p>}
      </div>
      <div className="row">
        <select
          value={task.status}
          // A failed update is already shown on the page, so the error is not thrown again here.
          onChange={(e) => onUpdate(task._id, { status: e.target.value }).catch(() => {})}
          aria-label={`Status of "${task.title}"`}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="btn btn-light" onClick={() => setEditing(true)}>Edit</button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm(`Delete "${task.title}"?`)) onDelete(task._id);
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
