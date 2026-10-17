import { useEffect, useState } from 'react'
import * as api from './api.js'
import Profile from './components/Profile.jsx'
import TodoForm from './components/TodoForm.jsx'
import TodoItem from './components/TodoItem.jsx'

export default function App() {
  const [user, setUser] = useState({ name: 'Guest', bio: 'Learning React' })
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Runs a backend call. Shows its error and returns false if it fails,
  // so the forms can keep what the user typed.
  async function run(action) {
    try {
      await action()
      setError('')
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }

  async function loadTodos() {
    setLoading(true)
    await run(async () => setTodos(await api.listTodos()))
    setLoading(false)
  }

  // Load the todos from the backend once, when the page opens
  useEffect(() => {
    loadTodos()
  }, [])

  function addTodo(title, status) {
    return run(async () => {
      const todo = await api.createTodo(title, status)
      setTodos((current) => [...current, todo])
    })
  }

  function updateTodo(id, changes) {
    return run(async () => {
      const saved = await api.updateTodo(id, changes)
      setTodos((current) => current.map((todo) => (todo.id === id ? saved : todo)))
    })
  }

  function deleteTodo(id) {
    return run(async () => {
      await api.deleteTodo(id)
      setTodos((current) => current.filter((todo) => todo.id !== id))
    })
  }

  const doneCount = todos.filter((todo) => todo.status === 'Done').length

  return (
    <main className="app">
      <header className="header">
        <h1>Todo List</h1>
        <span className="username">Signed in as {user.name}</span>
      </header>

      <Profile user={user} onSave={setUser} />

      {error && (
        <div className="error row">
          <span className="grow">{error}</span>
          <button type="button" onClick={loadTodos}>Retry</button>
        </div>
      )}

      <TodoForm onAdd={addTodo} />

      <p className="muted">
        {todos.length} todos · {doneCount} done
      </p>
      {loading ? (
        <p className="empty">Loading todos…</p>
      ) : todos.length === 0 ? (
        <p className="empty">Nothing to do. Add something above.</p>
      ) : (
        <ul className="list">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onUpdate={updateTodo} onDelete={deleteTodo} />
          ))}
        </ul>
      )}
    </main>
  )
}
