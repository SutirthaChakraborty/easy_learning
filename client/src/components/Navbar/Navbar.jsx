import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "/logo.png";
import { playSlide } from "../../utils/sounds";
import { FaLayerGroup, FaSignOutAlt, FaTachometerAlt, FaHandPaper } from "react-icons/fa";
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

        {user ? (
          <div className={styles.userArea}>
            <NavLink to="/dashboard" className={styles.dashboardLink} onClick={close}>
              <FaTachometerAlt className={styles.loginIcon} /> {t("navbar.dashboard")}
            </NavLink>
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
