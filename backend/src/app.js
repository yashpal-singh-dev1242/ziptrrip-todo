const express = require('express');
const cors = require('cors');
const path = require('path');
const { TodoStore } = require('./storage');
const { createTodosRouter } = require('./todos');

function createApp({ dataFile } = {}) {
  const app = express();
  const file =
    dataFile || process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'todos.json');
  const store = new TodoStore(file);

  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/todos', createTodosRouter(store));

  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };