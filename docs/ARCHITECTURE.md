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


## Docker

`docker-compose.yml` runs the whole app as two services:

```
Browser ──▶ nginx container (:8080 on the host) ──/api──▶ Express container (:4000, internal only)
                                                              │
                                                       volume "todo-data" mounted at /data
```

| Service | Built from | Notes |
|---|---|---|
| `backend` | `backend/Dockerfile` | Node 24 (Alpine), production dependencies only, runs as the non-root `node` user. `DATA_FILE` points to `/data/todos.json` inside the volume. Has a health check that calls `/api/health`. |
| `frontend` | `frontend/Dockerfile` | Multi-stage build: Vite builds both HTML pages, then only the built files are copied into an nginx image. Starts after the backend is healthy. |

`frontend/nginx.conf` serves `index.html` and `todo.html` as separate files (there is no single-page fallback, matching the multi-page design) and proxies `/api/` to the `backend` service.

Data lives in the named volume `todo-data`, so `docker compose down` keeps it and `docker compose down -v` deletes it.

## Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on every pull request, using Node.js 24 on GitHub's Ubuntu runners. It has two independent jobs:

| Job | Steps |
|---|---|
| Backend tests | `npm ci`, then `npm test` in `backend/` |
| Frontend build | `npm ci`, then `npm run build` in `frontend/` (fails if either HTML page does not compile) |

## Known limitations

- No authentication or user accounts: all todos are shared.
- JSON-file storage suits a single server instance; it is not designed for multiple instances or high write volume.
- The list is not paginated.
- The Docker setup serves the app over plain HTTP on port 8080. TLS, a domain and cloud deployment configuration are not included.