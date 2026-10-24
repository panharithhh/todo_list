import axios from 'axios'

// Talks to the NestJS backend in ../nest-backend.
// Point it somewhere else with VITE_API_URL=http://host:port npm run dev
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// The access token lives in memory only. The refresh token is an HttpOnly
// cookie the browser sends to /auth/refresh, so a page reload can get a new one.
let accessToken = null
let onSessionExpired = () => {}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

const http = axios.create({ baseURL: API_URL, withCredentials: true })

http.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// Every refresh token works once, so callers that hit a 401 together share one refresh
let refreshing = null
function refreshAccessToken() {
  refreshing ??= http
    .post('/auth/refresh')
    .then(({ data }) => {
      accessToken = data.accessToken
      return data.user
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// On a 401, refresh once and retry; if that fails too, the session is over
http.interceptors.response.use(undefined, async (error) => {
  const { config, response } = error
  if (response?.status !== 401 || config._retried || config.url.startsWith('/auth/')) {
    throw error
  }
  config._retried = true
  try {
    await refreshAccessToken()
  } catch {
    accessToken = null
    onSessionExpired()
    throw error
  }
  return http(config)
})

// Turns axios errors into an Error with the backend's message
async function request(promise) {
  try {
    const { data } = await promise
    return data
  } catch (err) {
    if (!err.response) throw new Error(`Can't reach the backend at ${API_URL}. Is it running?`)
    const message = err.response.data?.message
    throw new Error(
      (Array.isArray(message) ? message.join(', ') : message) ?? `Request failed (${err.response.status})`,
    )
  }
}

// === AUTH ===
async function startSession(promise) {
  const data = await request(promise)
  accessToken = data.accessToken
  return data.user
}

export function signup(email, password) {
  return startSession(http.post('/auth/signup', { email, password }))
}

export function login(email, password) {
  return startSession(http.post('/auth/login', { email, password }))
}

// Called on page load: resolves to the user if the refresh cookie is still good
export async function restoreSession() {
  try {
    return await refreshAccessToken()
  } catch {
    return null
  }
}

export async function logout() {
  accessToken = null
  await request(http.post('/auth/logout'))
}

// === TODOS ===
export function listTodos() {
  return request(http.get('/todos'))
}

export function createTodo(title, status) {
  return request(http.post('/todos', { title, status }))
}

export function updateTodo(id, changes) {
  return request(http.patch(`/todos/${id}`, changes))
}

export function deleteTodo(id) {
  return request(http.delete(`/todos/${id}`))
}

// === ADMIN ===
export function listAllTodos() {
  return request(http.get('/admin/todos'))
}
