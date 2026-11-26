const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

// JSON-file store. All operations run one at a time through a queue, and writes
// go to a temp file first and are then renamed, so a crash can't leave a half-written file.
class TodoStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.queue = Promise.resolve();
  }

  _enqueue(task) {
    const run = this.queue.then(task);
    this.queue = run.catch(() => {});
    return run;
  }

  async _read() {
    try {
      return JSON.parse(await fs.readFile(this.filePath, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async _write(todos) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(todos, null, 2));
    await fs.rename(tmp, this.filePath);
  }

  list() {
    return this._enqueue(() => this._read());
  }

  get(id) {
    return this._enqueue(async () => {
      const todos = await this._read();
      return todos.find((t) => t.id === id) || null;
    });
  }

  create(data) {
    return this._enqueue(async () => {
      const todos = await this._read();
      const now = new Date().toISOString();
      const todo = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
      todos.push(todo);
      await this._write(todos);
      return todo;
    });
  }

  update(id, changes) {
    return this._enqueue(async () => {
      const todos = await this._read();
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) return null;
      todos[index] = { ...todos[index], ...changes, updatedAt: new Date().toISOString() };
      await this._write(todos);
      return todos[index];
    });
  }

  remove(id) {
    return this._enqueue(async () => {
      const todos = await this._read();
      const next = todos.filter((t) => t.id !== id);
      if (next.length === todos.length) return false;
      await this._write(next);
      return true;
    });
  }
}

module.exports = { TodoStore };