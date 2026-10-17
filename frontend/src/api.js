// Talks to the NestJS backend in ../nest-backend.
// Point it somewhere else with VITE_API_URL=http://host:port npm run dev
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    throw new Error(`Can't reach the backend at ${API_URL}. Is it running?`)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Request failed (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}

export function listTodos() {
  return request('/todos')
}

export function createTodo(title, status) {
  return request('/todos', { method: 'POST', body: JSON.stringify({ title, status }) })
}

export function updateTodo(id, changes) {
  return request(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(changes) })
}

export function deleteTodo(id) {
  return request(`/todos/${id}`, { method: 'DELETE' })
}
