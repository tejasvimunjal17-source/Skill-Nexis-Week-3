import { useState } from 'react';
import TodoForm from './TodoForm.jsx';

export default function TodoItem({ todo, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="todo">
        <TodoForm
          initial={todo}
          submitLabel="Save"
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(todo._id, values);
            setEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className={`todo ${todo.completed ? 'done' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo)}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'not done' : 'done'}`}
      />
      <div className="todo-text">
        <strong>{todo.title}</strong>
        {todo.description && <p>{todo.description}</p>}
      </div>
      <div className="row">
        <button className="btn btn-light" onClick={() => setEditing(true)}>Edit</button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (window.confirm(`Delete "${todo.title}"?`)) onDelete(todo._id);
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
