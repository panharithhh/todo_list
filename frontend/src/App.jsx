import { useEffect, useState } from 'react'
import * as api from './api.js'
import Auth from './components/Auth.jsx'
import TodoForm from './components/TodoForm.jsx'
import TodoItem from './components/TodoItem.jsx'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // On page load, swap the refresh cookie for an access token (if it's still valid)
  useEffect(() => {
    api.setSessionExpiredHandler(() => {
      setCurrentUser(null)
      setError('Your session expired. Please sign in again.')
    })
    api.restoreSession().then((user) => {
      setCurrentUser(user)
      setCheckingSession(false)
    })
  }, [])

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
    await run(async () => setTodos(await (showAll ? api.listAllTodos() : api.listTodos())))
    setLoading(false)
  }

  // Reload whenever someone signs in or out, or an admin switches views
  useEffect(() => {
    if (currentUser) loadTodos()
    else setTodos([])
  }, [currentUser?.id, showAll])

  function handleLogin(user) {
    setError('')
    setShowAll(false)
    setCurrentUser(user)
  }

  async function handleLogout() {
    await api.logout().catch(() => {})
    setCurrentUser(null)
  }

  function addTodo(title, status) {
    return run(async () => {
      const todo = await api.createTodo(title, status)
      if (!showAll) setTodos((current) => [...current, todo])
      else await loadTodos()
    })
  }

  function updateTodo(id, changes) {
    return run(async () => {
      const saved = await api.updateTodo(id, changes)
      setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, ...saved } : todo)))
    })
  }

  function deleteTodo(id) {
    return run(async () => {
      await api.deleteTodo(id)
      setTodos((current) => current.filter((todo) => todo.id !== id))
    })
  }

  const doneCount = todos.filter((todo) => todo.status === 'Done').length
  const isAdmin = currentUser?.role === 'admin'

  if (checkingSession) {
    return (
      <main className="app">
        <p className="empty">Loading…</p>
      </main>
    )
  }

  return (
    <main className="app">
      <header className="header">
        <h1>Todo App</h1>
        {currentUser && (
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="username">
              {currentUser.email}
              {isAdmin && <strong style={{ color: '#2563eb' }}> (admin)</strong>}
            </span>
            <button type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="error row" style={{ marginTop: 12 }}>
          <span className="grow">{error}</span>
          {currentUser && (
            <button type="button" onClick={loadTodos}>
              Retry
            </button>
          )}
        </div>
      )}

      {!currentUser ? (
        <Auth onAuthSuccess={handleLogin} />
      ) : (
        <>
          <TodoForm onAdd={addTodo} />

          <div className="row" style={{ alignItems: 'center' }}>
            <p className="muted grow">
              {todos.length} todos · {doneCount} done
            </p>
            {isAdmin && (
              <button type="button" onClick={() => setShowAll((all) => !all)}>
                {showAll ? 'Show my todos' : 'Show everyone’s todos'}
              </button>
            )}
          </div>
          {loading ? (
            <p className="empty">Loading todos…</p>
          ) : todos.length === 0 ? (
            <p className="empty">No todos yet. Add one above!</p>
          ) : (
            <ul className="list">
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  // Admins can see everyone's todos but only change their own
                  readOnly={todo.ownerId !== currentUser.id}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
