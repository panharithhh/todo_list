# todo_list

A todo app with a React frontend and a NestJS backend that saves the todos in
PostgreSQL.

| Folder | What | Runs on |
| --- | --- | --- |
| `frontend/` | React + Vite | http://localhost:5180 |
| `nest-backend/` | NestJS + TypeORM API | http://localhost:3000 |
| `nest-backend/docker-compose.yml` | PostgreSQL 16 in Docker | localhost:5432 |

## What you need

- Node.js 20.19+, 22.13+ or 24
- Docker (for the database)

## Run it

1. Start the database:

   ```bash
   cd nest-backend
   docker compose up -d
   ```

2. Start the backend, in a new terminal:

   ```bash
   cd nest-backend
   npm install
   npm run start:dev
   ```

   The first start creates the `todos` table and adds two sample todos.

3. Start the frontend, in another terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open http://localhost:5180.

## API

| Request | Body | Does |
| --- | --- | --- |
| `GET /todos` | | List all todos |
| `POST /todos` | `{ "title": "Buy milk", "status": "To Do" }` | Add a todo (status is optional) |
| `PATCH /todos/:id` | `{ "title": "..." }` or `{ "status": "Done" }` | Change a todo |
| `DELETE /todos/:id` | | Delete a todo |

`status` is one of `To Do`, `In Progress` or `Done`.

## Tests

```bash
cd nest-backend
npm test           # unit tests, no database needed
npm run test:e2e   # needs the database from step 1
```
