import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "/logo.png";
import { playSlide } from "../../utils/sounds";
import { FaBook, FaCalculator, FaMicroscope, FaPencilAlt, FaLayerGroup, FaPuzzlePiece, FaSignOutAlt } from "react-icons/fa";
import { GiCardPlay } from "react-icons/gi";
import { useAuth } from "../../context/AuthContext";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

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
          <NavLink to="/" className={styles.btn1} onClick={close}>
            {t("navbar.home")}
          </NavLink>
        </div>

        <div className={styles.dropdown}>
          <NavLink to="/games" className={styles.btn2} onClick={close}>
            {t("navbar.games")}
          </NavLink>
          <div className={styles.dropdownContent}>
            <NavLink to="/games/spelling" onClick={close}>
              <FaPencilAlt className={styles.dropIcon} /> {t("navbar.spellingBee")}
            </NavLink>
            <NavLink to="/games/memory" onClick={close}>
              <GiCardPlay className={styles.dropIcon} /> {t("navbar.memoryMatch")}
            </NavLink>
            <NavLink to="/games/puzzle" onClick={close}>
              <FaPuzzlePiece className={styles.dropIcon} /> {t("navbar.wordPuzzle")}
            </NavLink>
          </div>
        </div>

        <div className={styles.dropdown}>
          <NavLink to="/subject/english" className={styles.btn3} onClick={close}>
            {t("navbar.lessons")}
          </NavLink>
          <div className={styles.dropdownContent}>
            <NavLink to="/subject/english" onClick={close}>
              <FaBook className={styles.dropIcon} /> {t("navbar.english")}
            </NavLink>
            <NavLink to="/subject/maths" onClick={close}>
              <FaCalculator className={styles.dropIcon} /> {t("navbar.mathematics")}
            </NavLink>
            <NavLink to="/subject/science" onClick={close}>
              <FaMicroscope className={styles.dropIcon} /> {t("navbar.science")}
            </NavLink>
          </div>
        </div>

        {user ? (
          <div className={styles.userArea}>
            <span className={styles.userName}>
              👋 {t("navbar.greeting", { name: firstName })}
            </span>
            <button className={styles.logout} onClick={handleLogout}>
              <FaSignOutAlt className={styles.loginIcon} /> {t("navbar.logout")}
            </button>
          </div>
        ) : (
          <button className={styles.login} onClick={handleLogin}>
            <FaLayerGroup className={styles.loginIcon} /> {t("navbar.login")}
          </button>
        )}

        {/* Language switcher sits at the end of the menu (or in-menu on mobile) */}
        <LanguageSwitcher />
      </div>

      <button
        className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ""}`}
        onClick={() => setMobileOpen((prev) => !prev)}
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
