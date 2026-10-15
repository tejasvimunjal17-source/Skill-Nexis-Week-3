import { useEffect, useState } from 'react';
import TodoForm from '../components/TodoForm.jsx';
import TodoItem from '../components/TodoItem.jsx';
import { fetchTodos, createTodo, updateTodo, deleteTodo, getErrorMessage } from '../api/client.js';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showSuccess = (text) => {
    setSuccess(text);
    setTimeout(() => setSuccess(''), 2500);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchTodos();
      setTodos(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // The handlers below throw a readable Error so the forms can show it.
  const run = async (action) => {
    try {
      return await action();
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  };

  const handleCreate = (values) =>
    run(async () => {
      const { data } = await createTodo(values);
      setTodos((current) => [data.data, ...current]);
      showSuccess('To-do added.');
    });

  const handleUpdate = (id, values) =>
    run(async () => {
      const { data } = await updateTodo(id, values);
      setTodos((current) => current.map((t) => (t._id === id ? data.data : t)));
      showSuccess('To-do updated.');
    });

  const handleToggle = async (todo) => {
    setError('');
    try {
      await handleUpdate(todo._id, { completed: !todo.completed });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await run(() => deleteTodo(id));
      setTodos((current) => current.filter((t) => t._id !== id));
      showSuccess('To-do deleted.');
    } catch (err) {
      setError(err.message);
    }
  };

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="card">
      <h2>My to-dos</h2>
      <TodoForm onSubmit={handleCreate} />

      {success && <p className="msg success" role="status">{success}</p>}
      {error && (
        <p className="msg error" role="alert">
          {error} <button className="link" onClick={load}>Try again</button>
        </p>
      )}

      {loading ? (
        <p className="center">Loading your to-dos...</p>
      ) : todos.length === 0 && !error ? (
        <p className="center muted">No to-dos yet. Add your first one above.</p>
      ) : (
        <>
          <p className="muted small">{doneCount} of {todos.length} done</p>
          <ul className="todo-list">
            {todos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onToggle={handleToggle}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
