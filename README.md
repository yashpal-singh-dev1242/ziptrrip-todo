# Todo App

![CI](https://github.com/yashpal-singh-dev1242/ziptrrip-todo/actions/workflows/ci.yml/badge.svg)

A full-stack todo application built for the Ziptrrip Developer Intern challenge.

- **Frontend:** React (Vite), a true multi-page app (not an SPA): one page for the todo list and one for a single todo, selected with a `?id=` query parameter.
- **Backend:** Node.js + Express REST API with full CRUD, input validation and file-based storage.
- **Tests:** 29 automated API tests (Jest + Supertest).

## Documentation

| Document | What it covers |
|---|---|
| [docs/FEATURES.md](docs/FEATURES.md) | Every user-facing feature, page by page |
| [docs/API.md](docs/API.md) | REST API reference: endpoints, parameters, validation, errors |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Project structure, multi-page setup, storage design, limitations |

## Project structure

```
.
├── backend/    Express API, JSON-file storage, Jest tests
├── frontend/   React + Vite multi-page app
└── docs/       Feature, API and architecture documentation
```

## Getting started

Developed and tested on Node.js v26.12.1 with npm 11.20.0.

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the backend (terminal 1)

```bash
cd backend
npm run dev
```

The API listens on `http://localhost:4000`. Data is stored in `backend/data/todos.json`, which is created automatically on first use.

### 3. Start the frontend (terminal 2)

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173/`. In development, Vite forwards requests starting with `/api` to the backend on port 4000, so start the backend first.


## Run with Docker

Requires Docker Desktop (or Docker Engine with the Compose plugin). From the repository root:

```bash
docker compose up --build
```

Then open `http://localhost:8080/`.

- Two containers start: the Express API, and nginx serving the built frontend and forwarding `/api` requests to the API.
- Only port `8080` is published to your machine; the API itself is reachable only through nginx.
- Todos are stored in a named Docker volume (`todo-data`), so they survive restarts and rebuilds.

| Command | Effect |
|---|---|
| `docker compose down` | Stop and remove the containers; **data is kept** |
| `docker compose down -v` | Also delete the data volume (all todos are lost) |

## Pages

| URL | Page |
|---|---|
| `/` | Todo list: add, search, filter, sort, complete, delete |
| `/todo.html?id=<todo id>` | Single todo: view, edit, complete, delete |

## Scripts

| Location | Command | Purpose |
|---|---|---|
| `backend/` | `npm run dev` | Start the API with auto-restart on file changes |
| `backend/` | `npm start` | Start the API |
| `backend/` | `npm test` | Run the API test suite |
| `frontend/` | `npm run dev` | Start the Vite dev server |
| `frontend/` | `npm run build` | Build both pages into `frontend/dist` |
| `frontend/` | `npm run preview` | Serve the production build locally |

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Port the API listens on |
| `DATA_FILE` | `backend/data/todos.json` | Location of the JSON data file |

## Running the tests

```bash
cd backend
npm test
```

The tests use a temporary data file per test, so they never touch your real data.