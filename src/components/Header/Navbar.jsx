/* Navbar — brand + links + login/register ctas. collapses on mobile. */

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Zap } from 'lucide-react';

const LINKS = [
  { to: '/', label: 'home' },
  { to: '/features', label: 'the roster' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav">
      <Link to="/" className="site-brand">
        <span className="brand-bolt">
          <Zap size={18} strokeWidth={2.5} color="#141414" />
        </span>
        LockedIn
      </Link>

      <div className={`site-nav-links ${open ? 'open' : ''}`}>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)}>
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="site-nav-cta">
        <Link to="/login" className="btn">
          log in
        </Link>
        <Link to="/register" className="btn btn-accent">
          get locked in
        </Link>
        <button type="button" className="icon-btn nav-burger" onClick={() => setOpen((o) => !o)} aria-label="menu">
          <Menu size={17} strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  );
}
