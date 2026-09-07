import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "/logo.png";
import { playSlide } from "../../utils/sounds";
import {
  FaHome, FaInfoCircle, FaEnvelope, FaSignOutAlt,
  FaHandPaper, FaLayerGroup, FaGamepad,
} from "react-icons/fa";
import { RiBarChart2Fill } from "react-icons/ri";
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

  const pillClass = (colorClass) => ({ isActive }) =>
    `${styles.navPill} ${styles[colorClass]} ${isActive ? styles.navPillActive : ""}`;

  return (
    <nav className={styles.navbar}>
      <div className={styles.bar}>
        <Link to="/home" className={styles.logo} onClick={close}>
          <img src={logo} alt="logo" />
        </Link>

        <div className={`${styles.menu} ${mobileOpen ? styles.menuOpen : ""}`}>
          <div className={styles.navLinks}>
            <NavLink to="/home" className={pillClass("navHome")} onClick={close}>
              <span className={styles.navIconWrap}><FaHome className={styles.navIcon} /></span>
              {t("navbar.home")}
            </NavLink>

            <NavLink to="/about-us" className={pillClass("navAbout")} onClick={close}>
              <span className={styles.navIconWrap}><FaInfoCircle className={styles.navIcon} /></span>
              {t("navbar.about", { defaultValue: "About Us" })}
            </NavLink>

            <NavLink to="/games" className={pillClass("navGames")} onClick={close}>
              <span className={styles.navIconWrap}><FaGamepad className={styles.navIcon} /></span>
              {t("navbar.games", { defaultValue: "Games" })}
            </NavLink>

            <NavLink to="/contact-us" className={pillClass("navContact")} onClick={close}>
              <span className={styles.navIconWrap}><FaEnvelope className={styles.navIcon} /></span>
              {t("navbar.contact", { defaultValue: "Contact Us" })}
            </NavLink>

            {user && (
              <NavLink to="/dashboard" className={styles.dashboardLink} onClick={close}>
                <RiBarChart2Fill className={styles.navIcon} /> {t("navbar.dashboard")}
              </NavLink>
            )}
          </div>

          <div className={styles.rightGroup}>
            <LanguageSwitcher />

            {user ? (
              <div className={styles.userArea}>
                <span className={styles.userName}>
                  <FaHandPaper /> {t("navbar.greeting", { name: firstName })}
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
          </div>
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
      </div>
    </nav>
  );
};

export default Navbar;
