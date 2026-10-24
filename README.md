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
   npm run dev
   ```

   Copy `.env.example` to `.env` first and set the two JWT secrets. The first
   start runs the database migration and, outside production, adds a demo
   account (`demo@example.com` / `password123`) with two todos.

3. Start the frontend, in another terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open http://localhost:5180.

## API

Every route needs `Authorization: Bearer <accessToken>` except the ones marked public.

| Request | Body | Does |
| --- | --- | --- |
| `POST /auth/signup` (public) | `{ "email", "password" }` | Make an account (409 if the email is taken) |
| `POST /auth/login` (public) | `{ "email", "password" }` | Returns `{ user, accessToken }` and sets the refresh cookie |
| `POST /auth/refresh` (public) | | Swaps the refresh cookie for a new access token and a new cookie |
| `POST /auth/logout` (public) | | Revokes the refresh token and clears the cookie |
| `GET /auth/me` | | The signed-in user |
| `GET /todos` | | List your todos |
| `POST /todos` | `{ "title": "Buy milk", "status": "To Do" }` | Add a todo (status is optional) |
| `PATCH /todos/:id` | `{ "title": "..." }` or `{ "status": "Done" }` | Change one of your todos |
| `DELETE /todos/:id` | | Delete one of your todos |
| `GET /admin/todos` | | Everyone's todos (admins only) |

`status` is one of `To Do`, `In Progress` or `Done`. Access tokens last 15
minutes; the frontend refreshes them automatically. Each refresh token works
once, and replaying an old one ends the session.

Signup always makes a `user`. To make an admin:

```bash
docker exec nest_postgres psql -U postgres -d tododb \
  -c "UPDATE users SET role = 'admin' WHERE email = 'you@example.com'"
```

## Tests

```bash
cd nest-backend
npm test           # unit tests, no database needed
npm run test:e2e   # needs the database from step 1
```
