import { useState } from 'react';
import { validateTaskForm } from '../utils/taskForm.js';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TITLE_MAX } from '../utils/taskOptions.js';

// Used for both "add" and "edit". Pass `initial` to edit an existing task.
export default function TaskForm({ initial, onSubmit, onCancel, submitLabel = 'Add task' }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState(initial?.status || 'todo');
  const [priority, setPriority] = useState(initial?.priority || 'medium');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const values = { title, description, status, priority };
    const problem = validateTaskForm(values);
    if (problem) return setError(problem);

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), status, priority });
      if (!initial) {
        setTitle('');
        setDescription('');
        setStatus('todo');
        setPriority('medium');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" noValidate>
      {error && <p className="msg error" role="alert">{error}</p>}
      <input
        placeholder="What needs to be done?"
        value={title}
        maxLength={TITLE_MAX + 20}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Title"
      />
      <textarea
        placeholder="Details (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        aria-label="Description"
      />
      <div className="row">
        <label className="inline">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="inline">
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <button className="btn" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
        {onCancel && <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
