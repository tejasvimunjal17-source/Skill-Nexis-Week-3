import { useCallback, useEffect, useRef, useState } from 'react';
import TaskForm from '../components/TaskForm.jsx';
import TaskItem from '../components/TaskItem.jsx';
import FilterBar from '../components/FilterBar.jsx';
import SummaryBar from '../components/SummaryBar.jsx';
import {
  fetchTasks, fetchSummary, createTask, updateTask, deleteTask, getErrorMessage,
} from '../api/client.js';
import { DEFAULT_FILTERS, buildTaskParams, hasActiveFilters } from '../utils/filters.js';

const SEARCH_DELAY_MS = 400; // wait a moment after typing before asking the backend

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Always holds the filters currently in use (so a reload after an edit uses the latest ones).
  const activeFilters = { ...filters, search: appliedSearch };
  const activeRef = useRef(activeFilters);
  activeRef.current = activeFilters;
  const requestId = useRef(0); // lets us ignore answers that arrive late

  const showSuccess = (text) => {
    setSuccess(text);
    setTimeout(() => setSuccess(''), 2500);
  };

  const loadTasks = useCallback(async () => {
    const myRequest = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchTasks(buildTaskParams(activeRef.current));
      if (myRequest === requestId.current) setTasks(data.data);
    } catch (err) {
      if (myRequest === requestId.current) setError(getErrorMessage(err));
    } finally {
      if (myRequest === requestId.current) setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await fetchSummary();
      setSummary(data.data);
    } catch {
      setSummary(null); // the counts are optional; the task list still works
    }
  }, []);

  // Typing in the search box: apply it after a short pause.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedSearch(filters.search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Ask the backend for matching tasks whenever a filter changes.
  useEffect(() => {
    loadTasks();
  }, [filters.status, filters.priority, appliedSearch, loadTasks]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const refresh = () => Promise.all([loadTasks(), loadSummary()]);

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
      await createTask(values);
      showSuccess('Task added.');
      await refresh();
    });

  const handleUpdate = async (id, values) => {
    setError('');
    try {
      await run(() => updateTask(id, values));
      showSuccess('Task updated.');
      await refresh();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await run(() => deleteTask(id));
      showSuccess('Task deleted.');
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedSearch('');
  };

  const filtering = hasActiveFilters(activeFilters);

  return (
    <div className="card">
      <h2>My tasks</h2>
      <SummaryBar summary={summary} />
      <TaskForm onSubmit={handleCreate} />

      <h3>Filter</h3>
      <FilterBar filters={filters} onChange={setFilters} onClear={clearFilters} />

      {success && <p className="msg success" role="status">{success}</p>}
      {error && (
        <p className="msg error" role="alert">
          {error} <button className="link" onClick={refresh}>Try again</button>
        </p>
      )}

      {loading ? (
        <p className="center">Loading your tasks...</p>
      ) : tasks.length === 0 && !error ? (
        <p className="center muted">
          {filtering ? 'No tasks match your filters.' : 'No tasks yet. Add your first one above.'}
        </p>
      ) : (
        <>
          <p className="muted small">
            Showing {tasks.length} task{tasks.length === 1 ? '' : 's'}{filtering ? ' (filtered)' : ''}
          </p>
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem key={task._id} task={task} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
