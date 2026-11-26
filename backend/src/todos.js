const express = require('express');
const { validateTodoInput, PRIORITIES } = require('./validation');

const STATUSES = ['all', 'active', 'completed'];
const SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'title'];
const ORDERS = ['asc', 'desc'];
const PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

function compareBy(field, direction) {
  const dir = direction === 'desc' ? -1 : 1;
  return (a, b) => {
    if (field === 'dueDate') {
      // Todos without a due date always go last, in either direction
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate) * dir;
    }
    if (field === 'priority') {
      return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * dir;
    }
    if (field === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) * dir;
    }
    return a.createdAt.localeCompare(b.createdAt) * dir;
  };
}

function createTodosRouter(store) {
  const router = express.Router();
  const notFound = (res) => res.status(404).json({ error: 'Todo not found' });
  const badRequest = (res, error, details) => res.status(400).json({ error, details });

  // List with optional filtering, search and sorting
  router.get('/', async (req, res) => {
    const { status = 'all', priority, search, sort = 'createdAt', order } = req.query;
    const errors = [];
    if (!STATUSES.includes(status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`);
    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
    }
    if (!SORT_FIELDS.includes(sort)) errors.push(`sort must be one of: ${SORT_FIELDS.join(', ')}`);
    if (order !== undefined && !ORDERS.includes(order)) {
      errors.push(`order must be one of: ${ORDERS.join(', ')}`);
    }
    if (errors.length) return badRequest(res, 'Invalid query parameters', errors);

    const direction = order || (sort === 'createdAt' ? 'desc' : 'asc');
    let todos = await store.list();

    if (status === 'active') todos = todos.filter((t) => !t.completed);
    if (status === 'completed') todos = todos.filter((t) => t.completed);
    if (priority) todos = todos.filter((t) => t.priority === priority);
    if (search) {
      const q = String(search).trim().toLowerCase();
      if (q) {
        todos = todos.filter(
          (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        );
      }
    }

    todos.sort(compareBy(sort, direction));
    res.json(todos);
  });

  router.get('/:id', async (req, res) => {
    const todo = await store.get(req.params.id);
    if (!todo) return notFound(res);
    res.json(todo);
  });

  router.post('/', async (req, res) => {
    const { errors, value } = validateTodoInput(req.body ?? {});
    if (errors.length) return badRequest(res, 'Validation failed', errors);

    const todo = await store.create({
      description: '',
      priority: 'medium',
      dueDate: null,
      completed: false,
      ...value,
    });
    res.status(201).location(`/api/todos/${todo.id}`).json(todo);
  });

  // PUT and PATCH share one handler: only the fields you send are changed
  const update = async (req, res) => {
    const { errors, value } = validateTodoInput(req.body ?? {}, { partial: true });
    if (errors.length) return badRequest(res, 'Validation failed', errors);

    const todo = await store.update(req.params.id, value);
    if (!todo) return notFound(res);
    res.json(todo);
  };
  router.put('/:id', update);
  router.patch('/:id', update);

  router.delete('/:id', async (req, res) => {
    const removed = await store.remove(req.params.id);
    if (!removed) return notFound(res);
    res.status(204).end();
  });

  return router;
}

module.exports = { createTodosRouter };