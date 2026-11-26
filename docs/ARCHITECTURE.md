# Architecture

## Overview

```
Browser ──▶ Vite dev server (:5173) ──/api──▶ Express API (:4000) ──▶ backend/data/todos.json
```

Two independent projects live in this repository: `backend/` and `frontend/`. They only talk to each other over the REST API described in [API.md](API.md).

## Multi-page frontend (not an SPA)

The challenge requires separate pages instead of a single-page app. The frontend is built as a **Vite multi-page app**:

- `frontend/index.html` loads `src/pages/list.jsx`, the todo list page.
- `frontend/todo.html` loads `src/pages/detail.jsx`, the single-todo page.
- `vite.config.js` registers both HTML files as separate build entry points, so `npm run build` outputs two real HTML documents.
- There is no client-side router. Moving between pages is an ordinary link (`<a href="/todo.html?id=...">`), which makes the browser load a new document.
- The detail page reads the todo id with `new URLSearchParams(window.location.search).get('id')`.

Each page mounts its own React root. Code shared by both pages lives in:

| File | Purpose |
|---|---|
| `src/api.js` | All calls to the backend, plus error handling |
| `src/utils.js` | Date helpers and the overdue rule |
| `src/components/TodoForm.jsx` | Form used to add (list page) and edit (detail page) |
| `src/components/Meta.jsx` | Priority badge and due-date label |
| `src/styles.css` | Styling for both pages |

## Backend structure

| File | Purpose |
|---|---|
| `src/server.js` | Starts the HTTP server |
| `src/app.js` | Builds the Express app (middleware, routes, error handling). Kept separate from `server.js` so tests can import it without opening a port. |
| `src/todos.js` | The `/api/todos` routes, including filtering, search and sorting |
| `src/validation.js` | Input validation for create and update |
| `src/storage.js` | `TodoStore`: reads and writes the JSON data file |
| `tests/todos.test.js` | API tests |

## Storage

Todos are stored as a JSON array in `backend/data/todos.json` (created automatically, and excluded from git).

- **One operation at a time.** All reads and writes go through an internal queue, so simultaneous requests cannot overwrite each other. A test creates 10 todos concurrently and checks none are lost.
- **Safe writes.** Each save writes to a temporary file and then renames it over the real file, so an interrupted write cannot leave a half-written data file.
- **Swappable.** The routes only use the store's methods (`list`, `get`, `create`, `update`, `remove`), so replacing the JSON file with a database means changing `storage.js` only.

## Design decisions

- **Server-side validation is the source of truth.** The frontend shows the server's error messages in the form rather than duplicating the rules.
- **Dates are plain `YYYY-MM-DD` strings.** This avoids time-zone shifts for due dates; the overdue check compares against today's date in the browser's local time zone.
- **IDs are UUIDs**, so ids cannot be guessed from creation order.

## Known limitations

- No authentication or user accounts: all todos are shared.
- JSON-file storage suits a single server instance; it is not designed for multiple instances or high write volume.
- The list is not paginated.
- In development the frontend relies on Vite's `/api` proxy. A production deployment would need the built files in `frontend/dist` served by a web server that also routes `/api` to the backend; that setup is not included here.