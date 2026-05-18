import { useState } from "react";
import styles from "./Navbar.module.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "/logo.png";
import { playSlide } from "../../utils/sounds";
import { FaBook, FaCalculator, FaMicroscope, FaPencilAlt, FaLayerGroup, FaPuzzlePiece, FaSignOutAlt } from "react-icons/fa";
import { GiCardPlay } from "react-icons/gi";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0];

  const close = () => { setMobileOpen(false); playSlide(); };
  const handleLogin = () => { close(); navigate("/login"); };
  const handleLogout = async () => {
    close();
    await logout();
    navigate("/");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/" onClick={close}><img src={logo} alt="logo" /></Link>
      </div>

      <div className={`${styles.menu} ${mobileOpen ? styles.menuOpen : ""}`}>
        <div className={styles.dropdown}>
          <NavLink to="/" className={styles.btn1} onClick={close}>Home</NavLink>
        </div>

        <div className={styles.dropdown}>
          <NavLink to="/games" className={styles.btn2} onClick={close}>Games</NavLink>
          <div className={styles.dropdownContent}>
            <NavLink to="/games/spelling" onClick={close}>
              <FaPencilAlt className={styles.dropIcon} /> Spelling Bee
            </NavLink>
            <NavLink to="/games/memory" onClick={close}>
              <GiCardPlay className={styles.dropIcon} /> Memory Match
            </NavLink>
            <NavLink to="/games/puzzle" onClick={close}>
              <FaPuzzlePiece className={styles.dropIcon} /> Word Puzzle
            </NavLink>
          </div>
        </div>

        <div className={styles.dropdown}>
          <NavLink to="/subject/english" className={styles.btn3} onClick={close}>Lessons</NavLink>
          <div className={styles.dropdownContent}>
            <NavLink to="/subject/english" onClick={close}>
              <FaBook className={styles.dropIcon} /> English
            </NavLink>
            <NavLink to="/subject/maths" onClick={close}>
              <FaCalculator className={styles.dropIcon} /> Mathematics
            </NavLink>
            <NavLink to="/subject/science" onClick={close}>
              <FaMicroscope className={styles.dropIcon} /> Science
            </NavLink>
          </div>
        </div>

        {user ? (
          <div className={styles.userArea}>
            <span className={styles.userName}>👋 {firstName}</span>
            <button className={styles.logout} onClick={handleLogout}>
              <FaSignOutAlt className={styles.loginIcon} /> Logout
            </button>
          </div>
        ) : (
          <button className={styles.login} onClick={handleLogin}>
            <FaLayerGroup className={styles.loginIcon} /> Login
          </button>
        )}
      </div>

      <button
        className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ""}`}
        onClick={() => setMobileOpen(prev => !prev)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
};

export default Navbar;
