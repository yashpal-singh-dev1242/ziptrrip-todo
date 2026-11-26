import { useState } from 'react';

const EMPTY = { title: '', description: '', priority: 'medium', dueDate: '' };

export default function TodoForm({
  initial,
  submitLabel = 'Save',
  resetOnSubmit = false,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    priority: initial?.priority ?? 'medium',
    dueDate: initial?.dueDate ?? '',
  }));
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description,
        priority: values.priority,
        dueDate: values.dueDate || null,
      });
      if (resetOnSubmit) setValues({ ...EMPTY });
    } catch (err) {
      setErrors(err.details?.length ? err.details : [err.message]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={values.title}
          onChange={set('title')}
          maxLength={200}
          required
          placeholder="What needs doing?"
        />
      </div>

      <div className="field">
        <label htmlFor="description">
          Description <span className="muted">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={3}
          maxLength={2000}
          value={values.description}
          onChange={set('description')}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" value={values.priority} onChange={set('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="dueDate">
            Due date <span className="muted">(optional)</span>
          </label>
          <input id="dueDate" type="date" value={values.dueDate} onChange={set('dueDate')} />
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="form-errors" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}