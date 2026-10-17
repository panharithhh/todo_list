import { useState } from 'react'

// Shows the user's profile, or a small form to edit it.
export default function Profile({ user, onSave }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)

  function startEditing() {
    setName(user.name)
    setBio(user.bio)
    setEditing(true)
  }

  function handleSubmit(e) {
    e.preventDefault() // stop the browser from reloading the page
    if (!name.trim()) return
    onSave({ name: name.trim(), bio: bio.trim() })
    setEditing(false)
  }

  if (!editing) {
    return (
      <section className="card profile">
        <div className="avatar">{user.name[0].toUpperCase()}</div>
        <div className="grow">
          <strong>{user.name}</strong>
          <p className="muted">{user.bio}</p>
        </div>
        <button onClick={startEditing}>Edit profile</button>
      </section>
    )
  }

  return (
    <form className="card profile-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label>
        Bio
        <input value={bio} onChange={(e) => setBio(e.target.value)} />
      </label>
      <div className="row">
        <button type="submit" className="primary">Save</button>
        <button type="button" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </form>
  )
}
