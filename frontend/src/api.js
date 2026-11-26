const BASE = '/api/todos';

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data?.details || [];
    throw err;
  }
  return data;
}

export function listTodos(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value);
  }
  const query = qs.toString();
  return request(query ? `${BASE}?${query}` : BASE);
}

export const getTodo = (id) => request(`${BASE}/${encodeURIComponent(id)}`);

export const createTodo = (data) =>
  request(BASE, { method: 'POST', body: JSON.stringify(data) });

export const updateTodo = (id, data) =>
  request(`${BASE}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteTodo = (id) =>
  request(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' });