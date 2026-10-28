# React Todo

A small todo list in React. The todos are saved in PostgreSQL through the NestJS
backend in `../nest-backend`, so they survive a page refresh. The profile (name
and bio) still lives only in local state.

## Run it

Start the database and the backend first:

```bash
cd ../nest-backend
docker compose up -d
npm install
npm run dev
```

Then the frontend:

```bash
npm install
npm run dev
```

Then open http://localhost:5180. The frontend talks to the backend at
http://localhost:3000. To use another address, run it with
`VITE_API_URL=http://host:port npm run dev`.

## Where things are

| What | File |
| --- | --- |
| Todo state, plus create / update / delete through the backend | `src/App.jsx` |
| The requests to the backend (`GET`, `POST`, `PATCH`, `DELETE /todos`) | `src/api.js` |
| Username and profile (edit with a form) | `src/components/Profile.jsx` |
| Add a todo (title + status) | `src/components/TodoForm.jsx` |
| One todo row: edit title, change status, delete | `src/components/TodoItem.jsx` |
| The three statuses | `src/statuses.js` |

## The React ideas used

- **`useState`** holds data that changes. Calling the setter re-renders the screen.
- **`useEffect`** loads the todos from the backend once, when the page opens.
- **Props** pass data down (`todo`, `user`) and functions down (`onAdd`, `onUpdate`, `onDelete`).
  Children call those functions to change state that lives in `App`.
- **Never mutate state.** Once the backend has saved a change, create uses
  `[...todos, newTodo]`, update uses `.map()`, delete uses `.filter()`. Each one
  builds a new array.
- **Controlled inputs**: `value={title}` plus `onChange` keeps the input and state in sync.
- **`key`** on list items helps React track which row is which. The ids come from Postgres.
