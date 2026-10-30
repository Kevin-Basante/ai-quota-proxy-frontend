import { useEffect, useRef, useState } from 'react'
import PlanBadge from './PlanBadge.jsx'
import { ChevronIcon } from './Icons.jsx'

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export default function UserSwitcher({ users, currentUserId, onSelect }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const current = users.find((user) => user.id === currentUserId)

  useEffect(() => {
    const close = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="switcher" ref={containerRef}>
      <button type="button" className="switcher__trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className={`avatar avatar--${current?.plan?.toLowerCase() ?? 'free'}`}>{current ? initials(current.displayName) : '··'}</span>
        <span className="switcher__identity">
          <span className="switcher__name">{current?.displayName ?? 'Select a user'}</span>
          <span className="switcher__role">{current?.role ?? '—'}</span>
        </span>
        <ChevronIcon className={`switcher__chevron ${open ? 'is-open' : ''}`} />
      </button>
      {open && (
        <div className="switcher__menu" role="listbox">
          <p className="switcher__caption">Sign in as a demo account</p>
          {users.map((user) => (
            <button
              type="button"
              role="option"
              aria-selected={user.id === currentUserId}
              key={user.id}
              className={`switcher__option ${user.id === currentUserId ? 'is-active' : ''}`}
              onClick={() => {
                onSelect(user.id)
                setOpen(false)
              }}
            >
              <span className={`avatar avatar--${user.plan.toLowerCase()}`}>{initials(user.displayName)}</span>
              <span className="switcher__identity">
                <span className="switcher__name">{user.displayName}</span>
                <span className="switcher__role">{user.role}</span>
              </span>
              <PlanBadge plan={user.plan} size="sm" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
