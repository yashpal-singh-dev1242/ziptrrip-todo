const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../src/app');

let dir;
let dataFile;
let app;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-test-'));
  dataFile = path.join(dir, 'todos.json');
  app = createApp({ dataFile });
});

afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const create = (body) => request(app).post('/api/todos').send(body);
const titles = (res) => res.body.map((t) => t.title);

async function seed() {
  await create({ title: 'Write report', priority: 'low', dueDate: '2026-12-10' });
  await create({ title: 'Buy milk', priority: 'high', description: 'from the shop' });
  const done = await create({ title: 'Call mom', priority: 'medium', dueDate: '2026-12-01' });
  await request(app).patch(`/api/todos/${done.body.id}`).send({ completed: true });
}

describe('health and routing', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('unknown route returns a JSON 404', async () => {
    const res = await request(app).get('/api/nothing-here');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /api/todos', () => {
  test('creates a todo and applies defaults', async () => {
    const res = await create({ title: '  Buy milk  ' });
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/todos/${res.body.id}`);
    expect(res.body).toMatchObject({
      title: 'Buy milk',
      description: '',
      priority: 'medium',
      dueDate: null,
      completed: false,
    });
    expect(res.body.id).toEqual(expect.any(String));
  });

  test.each([
    ['missing title', {}],
    ['blank title', { title: '   ' }],
    ['title too long', { title: 'x'.repeat(201) }],
    ['bad priority', { title: 'a', priority: 'urgent' }],
    ['impossible date', { title: 'a', dueDate: '2026-02-30' }],
    ['wrong date format', { title: 'a', dueDate: '01/12/2026' }],
    ['non-boolean completed', { title: 'a', completed: 'yes' }],
  ])('rejects %s', async (_name, body) => {
    const res = await create(body);
    expect(res.status).toBe(400);
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  test('rejects malformed JSON', async () => {
    const res = await request(app)
      .post('/api/todos')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });

  test('handles many simultaneous creates without losing data', async () => {
    await Promise.all(Array.from({ length: 10 }, (_, i) => create({ title: `Todo ${i}` })));
    const res = await request(app).get('/api/todos');
    expect(res.body).toHaveLength(10);
  });
});

describe('GET /api/todos', () => {
  beforeEach(seed);

  test('filters by status', async () => {
    const active = await request(app).get('/api/todos?status=active');
    expect(titles(active).sort()).toEqual(['Buy milk', 'Write report']);
    const completed = await request(app).get('/api/todos?status=completed');
    expect(titles(completed)).toEqual(['Call mom']);
  });

  test('filters by priority', async () => {
    const res = await request(app).get('/api/todos?priority=high');
    expect(titles(res)).toEqual(['Buy milk']);
  });

  test('searches title and description, case-insensitively', async () => {
    const byTitle = await request(app).get('/api/todos?search=REPORT');
    expect(titles(byTitle)).toEqual(['Write report']);
    const byDescription = await request(app).get('/api/todos?search=shop');
    expect(titles(byDescription)).toEqual(['Buy milk']);
  });

  test('sorts by priority, due date and title', async () => {
    const priority = await request(app).get('/api/todos?sort=priority&order=desc');
    expect(titles(priority)).toEqual(['Buy milk', 'Call mom', 'Write report']);

    const dueAsc = await request(app).get('/api/todos?sort=dueDate&order=asc');
    expect(titles(dueAsc)).toEqual(['Call mom', 'Write report', 'Buy milk']);

    // Todos without a due date stay last even when descending
    const dueDesc = await request(app).get('/api/todos?sort=dueDate&order=desc');
    expect(titles(dueDesc)).toEqual(['Write report', 'Call mom', 'Buy milk']);

    const title = await request(app).get('/api/todos?sort=title');
    expect(titles(title)).toEqual(['Buy milk', 'Call mom', 'Write report']);
  });

  test('defaults to newest first', async () => {
    const res = await request(app).get('/api/todos');
    const times = res.body.map((t) => t.createdAt);
    expect(times).toEqual([...times].sort().reverse());
  });

  test('rejects invalid query parameters', async () => {
    for (const query of ['status=nope', 'priority=nope', 'sort=nope', 'order=sideways']) {
      const res = await request(app).get(`/api/todos?${query}`);
      expect(res.status).toBe(400);
    }
  });
});

describe('GET /api/todos/:id', () => {
  test('returns a todo by id', async () => {
    const created = await create({ title: 'Find me' });
    const res = await request(app).get(`/api/todos/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Find me');
  });

  test('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/todos/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('PATCH and PUT /api/todos/:id', () => {
  test('PATCH changes only the fields sent', async () => {
    const created = await create({ title: 'Original', priority: 'low' });
    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'Original', priority: 'low', completed: true });
    expect(res.body.createdAt).toBe(created.body.createdAt);
    expect(res.body.updatedAt >= created.body.updatedAt).toBe(true);
  });

  test('PUT updates a todo too', async () => {
    const created = await create({ title: 'Old title' });
    const res = await request(app)
      .put(`/api/todos/${created.body.id}`)
      .send({ title: 'New title', priority: 'high' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'New title', priority: 'high' });
  });

  test('can clear the due date with null', async () => {
    const created = await create({ title: 'Dated', dueDate: '2026-12-01' });
    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ dueDate: null });
    expect(res.body.dueDate).toBeNull();
  });

  test('cannot overwrite the id', async () => {
    const created = await create({ title: 'Keep my id' });
    const res = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ id: 'hacked', title: 'Renamed' });
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.title).toBe('Renamed');
  });

  test('rejects an empty body and invalid values', async () => {
    const created = await create({ title: 'Valid' });
    const empty = await request(app).patch(`/api/todos/${created.body.id}`).send({});
    expect(empty.status).toBe(400);
    const invalid = await request(app)
      .patch(`/api/todos/${created.body.id}`)
      .send({ priority: 'urgent' });
    expect(invalid.status).toBe(400);
  });

  test('returns 404 for an unknown id', async () => {
    const res = await request(app).patch('/api/todos/does-not-exist').send({ title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/todos/:id', () => {
  test('deletes a todo', async () => {
    const created = await create({ title: 'Temporary' });
    const del = await request(app).delete(`/api/todos/${created.body.id}`);
    expect(del.status).toBe(204);
    const after = await request(app).get(`/api/todos/${created.body.id}`);
    expect(after.status).toBe(404);
  });

  test('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/todos/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('persistence', () => {
  test('data survives a new app instance using the same file', async () => {
    await create({ title: 'Persisted' });
    const restarted = createApp({ dataFile });
    const res = await request(restarted).get('/api/todos');
    expect(titles(res)).toEqual(['Persisted']);
  });
});