import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';

/**
 * Global navigation bar.
 * Add new <NavLink> entries as pages are added to the app.
 */
function Navbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      {/* Brand / logo */}
      <Link to="/" className="navbar__logo">
        Easy Learn <span aria-hidden="true">🧠</span>
      </Link>

      {/* Navigation links */}
      <ul className="navbar__links" role="list">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'navbar__link navbar__link--active' : 'navbar__link'
            }
          >
            Home
          </NavLink>
        </li>
        {/* Add more routes here:
          <li><NavLink to="/learn" className={...}>Learn</NavLink></li>
        */}
      </ul>
    </nav>
  );
}

export default Navbar;
