import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { deleteTodo, getTodo, updateTodo } from '../api';
import TodoForm from '../components/TodoForm';
import { DueLabel, PriorityBadge } from '../components/Meta';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function BackLink() {
  return (
    <a className="back-link" href="/">
      ← Back to all todos
    </a>
  );
}

function DetailPage() {
  const id = new URLSearchParams(window.location.search).get('id');
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    getTodo(id)
      .then((data) => {
        if (!cancelled) setTodo(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    document.title = todo ? `${todo.title} · Todos` : 'Todo details';
  }, [todo]);

  async function handleToggle() {
    setBusy(true);
    setError('');
    try {
      setTodo(await updateTodo(todo.id, { completed: !todo.completed }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(data) {
    // TodoForm shows any validation errors itself, so just let them propagate
    const updated = await updateTodo(todo.id, data);
    setTodo(updated);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${todo.title}"?`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteTodo(todo.id);
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  let content;
  if (!id) {
    content = (
      <div className="empty">
        <p>No todo id was provided in the URL.</p>
      </div>
    );
  } else if (loading) {
    content = <p className="loading">Loading…</p>;
  } else if (notFound) {
    content = (
      <div className="empty">
        <h2>Todo not found</h2>
        <p>It may have been deleted, or the link is wrong.</p>
      </div>
    );
  } else if (!todo) {
    content = (
      <div className="alert" role="alert">
        {error || 'Something went wrong.'}
      </div>
    );
  } else if (editing) {
    content = (
      <section className="card">
        <h2>Edit todo</h2>
        <TodoForm
          initial={todo}
          submitLabel="Save changes"
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </section>
    );
  } else {
    content = (
      <section className="card">
        <div className="detail-header">
          <h1 className={todo.completed ? 'struck' : ''}>{todo.title}</h1>
          <span className={`status-pill ${todo.completed ? 'is-done' : 'is-active'}`}>
            {todo.completed ? 'Completed' : 'Active'}
          </span>
        </div>

        <div className="todo-meta">
          <PriorityBadge priority={todo.priority} />
          <DueLabel todo={todo} />
        </div>

        <p className="detail-description">
          {todo.description || <span className="muted">No description.</span>}
        </p>

        <dl className="detail-dates">
          <dt>Created</dt>
          <dd>{formatTimestamp(todo.createdAt)}</dd>
          <dt>Last updated</dt>
          <dd>{formatTimestamp(todo.updatedAt)}</dd>
          <dt>ID</dt>
          <dd className="mono">{todo.id}</dd>
        </dl>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={handleToggle}>
            {todo.completed ? 'Mark as not done' : 'Mark as done'}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={handleDelete}>
            Delete
          </button>
        </div>
      </section>
    );
  }

  return (
    <main className="container">
      <BackLink />
      {content}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<DetailPage />);