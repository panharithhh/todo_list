import { useState } from 'react'
import { STATUSES, statusClass } from '../statuses.js'

export default function TodoItem({ todo, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)

  async function save() {
    if (!draft.trim()) return
    if (await onUpdate(todo.id, { title: draft.trim() })) setEditing(false)
  }

  function cancel() {
    setDraft(todo.title)
    setEditing(false)
  }

  return (
    <li className="item">
      {editing ? (
        <input
          className="grow"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          autoFocus
        />
      ) : (
        <span className={`grow title ${todo.status === 'Done' ? 'done' : ''}`}>{todo.title}</span>
      )}

      <select
        className={`status ${statusClass(todo.status)}`}
        value={todo.status}
        onChange={(e) => onUpdate(todo.id, { status: e.target.value })}
      >
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      {editing ? (
        <>
          <button className="primary" onClick={save}>Save</button>
          <button onClick={cancel}>Cancel</button>
        </>
      ) : (
        <>
          <button onClick={() => setEditing(true)}>Edit</button>
          <button className="danger" onClick={() => onDelete(todo.id)}>Delete</button>
        </>
      )}
    </li>
  )
}
