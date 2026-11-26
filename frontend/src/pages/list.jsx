import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { createTodo, deleteTodo, listTodos, updateTodo } from '../api';
import TodoForm from '../components/TodoForm';
import { DueLabel, PriorityBadge } from '../components/Meta';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

// value format is "<sort field>:<order>"
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'dueDate:asc', label: 'Due date (soonest)' },
  { value: 'priority:desc', label: 'Priority (high first)' },
  { value: 'title:asc', label: 'Title (A–Z)' },
];

function ListPage() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('createdAt:desc');
  const [reloadKey, setReloadKey] = useState(0);

  // Wait 300 ms after typing stops before searching
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const [sort, order] = sortValue.split(':');
    setError('');
    listTodos({ status, priority, search, sort, order })
      .then((data) => {
        if (!cancelled) setTodos(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, priority, search, sortValue, reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  async function handleCreate(data) {
    await createTodo(data);
    refresh();
  }

  async function handleToggle(todo) {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(todo) {
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    try {
      await deleteTodo(todo.id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function clearFilters() {
    setStatus('all');
    setPriority('');
    setSearchInput('');
    setSearch('');
  }

  const filtersActive = status !== 'all' || priority !== '' || search !== '';

  return (
    <main className="container">
      <h1>Todos</h1>
      <p className="subtitle">Keep track of what needs doing.</p>

      <section className="card">
        <h2>Add a todo</h2>
        <TodoForm submitLabel="Add todo" resetOnSubmit onSubmit={handleCreate} />
      </section>

      <section className="card">
        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Search title or description…"
            aria-label="Search todos"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            aria-label="Sort todos"
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="status-tabs" style={{ marginTop: 12 }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className="btn btn-small"
              aria-pressed={status === tab.value}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {!loading && !error && (
          <p className="result-count">
            {todos.length} {todos.length === 1 ? 'todo' : 'todos'}
          </p>
        )}
      </section>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : todos.length === 0 && !error ? (
        <div className="empty">
          {filtersActive ? (
            <>
              <p>No todos match your filters.</p>
              <button type="button" className="btn" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          ) : (
            <p>No todos yet. Add your first one above.</p>
          )}
        </div>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={`todo-item${todo.completed ? ' done' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo)}
                aria-label={`Mark "${todo.title}" as ${todo.completed ? 'not done' : 'done'}`}
              />
              <div className="todo-main">
                <a className="todo-title" href={`/todo.html?id=${encodeURIComponent(todo.id)}`}>
                  {todo.title}
                </a>
                <div className="todo-meta">
                  <PriorityBadge priority={todo.priority} />
                  <DueLabel todo={todo} />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => handleDelete(todo)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<ListPage />);