import { useState } from 'react'
import * as api from '../api.js'

// Sign in / sign up form. Hands the signed-in user up to App.
export default function Auth({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = isSignup ? await api.signup(email, password) : await api.login(email, password)
      onAuthSuccess(user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card auth-card">
      <h2>{isSignup ? 'Create an account' : 'Sign in'}</h2>

      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form">
        <label>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder={isSignup ? 'At least 8 characters' : ''}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </label>

        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Please wait…' : isSignup ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsSignup(!isSignup)
          setError('')
        }}
        style={{ marginTop: 12, background: 'none', border: 'none', color: '#2563eb', padding: 0 }}
      >
        {isSignup ? 'Already have an account? Sign in' : 'No account yet? Sign up'}
      </button>
    </div>
  )
}
