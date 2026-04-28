import { NavLink } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={{ backgroundColor: '#2C2C2C', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Desktop links */}
      <div className="nav-links" style={{
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'center',
        gap: '8px'
      }}>
        {[
          { to: '/', label: 'Home' },
          { to: '/compare', label: 'Compare' },
          { to: '/coverage', label: 'Coverage' },
          { to: '/learn', label: 'Learn' },
          { to: '/recommend', label: 'Recommend' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              padding: '16px 20px',
              color: isActive ? '#C4622D' : '#FAF8F5',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              borderBottom: isActive ? '2px solid #C4622D' : '2px solid transparent',
              display: 'block',
              transition: 'color 0.2s'
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Mobile hamburger button */}
      <div className="nav-hamburger" style={{
        display: 'none',
        padding: '0 20px',
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: '52px'
      }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: '#FAF8F5',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="nav-mobile-menu" style={{ borderTop: '1px solid #3E3E3E' }}>
          {[
            { to: '/', label: 'Home' },
            { to: '/compare', label: 'Compare' },
            { to: '/coverage', label: 'Coverage' },
            { to: '/learn', label: 'Learn' },
            { to: '/recommend', label: 'Recommend' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '14px 20px',
                color: isActive ? '#C4622D' : '#FAF8F5',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                borderLeft: isActive ? '3px solid #C4622D' : '3px solid transparent',
                display: 'block',
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}