import { useState } from 'react'
import { STATUSES } from '../statuses.js'

// The "add a todo" form. It keeps its own input state, then hands the
// finished todo up to App through the onAdd prop.
export default function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('To Do')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    // Only clear the form once the backend has saved the todo
    if (await onAdd(title.trim(), status)) {
      setTitle('')
      setStatus('To Do')
    }
  }

  return (
    <form className="row add-form" onSubmit={handleSubmit}>
      <input
        className="grow"
        placeholder="What needs doing?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <button type="submit" className="primary">Add</button>
    </form>
  )
}
