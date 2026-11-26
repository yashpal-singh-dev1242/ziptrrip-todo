const PRIORITIES = ['low', 'medium', 'high'];

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// partial=false -> create (title required). partial=true -> update (any subset of fields).
function validateTodoInput(body, { partial = false } = {}) {
  const errors = [];
  const value = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], value };
  }

  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    } else if (body.title.trim().length > 200) {
      errors.push('title must be at most 200 characters');
    } else {
      value.title = body.title.trim();
    }
  }

  if ('description' in body) {
    if (typeof body.description !== 'string') {
      errors.push('description must be a string');
    } else if (body.description.length > 2000) {
      errors.push('description must be at most 2000 characters');
    } else {
      value.description = body.description.trim();
    }
  }

  if ('priority' in body) {
    if (!PRIORITIES.includes(body.priority)) {
      errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
    } else {
      value.priority = body.priority;
    }
  }

  if ('dueDate' in body) {
    if (body.dueDate === null || body.dueDate === '') {
      value.dueDate = null;
    } else if (typeof body.dueDate !== 'string' || !isValidDate(body.dueDate)) {
      errors.push('dueDate must be a valid date in YYYY-MM-DD format, or null');
    } else {
      value.dueDate = body.dueDate;
    }
  }

  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') {
      errors.push('completed must be a boolean');
    } else {
      value.completed = body.completed;
    }
  }

  if (partial && errors.length === 0 && Object.keys(value).length === 0) {
    errors.push('Provide at least one field to update');
  }

  return { errors, value };
}

module.exports = { validateTodoInput, PRIORITIES };