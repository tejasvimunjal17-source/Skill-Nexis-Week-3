import { useState } from 'react';

// Used for both "add" and "edit". Pass `initial` to edit an existing to-do.
export default function TodoForm({ initial, onSubmit, onCancel, submitLabel = 'Add to-do' }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('Title is required.');
    if (title.trim().length > 100) return setError('Title cannot be longer than 100 characters.');
    if (description.trim().length > 500) return setError('Description cannot be longer than 500 characters.');

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim() });
      if (!initial) {
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form" noValidate>
      {error && <p className="msg error" role="alert">{error}</p>}
      <input
        placeholder="What needs to be done?"
        value={title}
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
        <button className="btn" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
        {onCancel && (
          <button type="button" className="btn btn-light" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
