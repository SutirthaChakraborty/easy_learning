import { useState } from "react";
import * as FramerMotion from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaCrown } from "react-icons/fa";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useAdminAuth } from "../context/AdminAuthContext";
import styles from "./Login.module.css";
import saStyles from "./SuperAdminLogin.module.css";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { superAdminLogin } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await superAdminLogin(email, password);
      navigate("/superadmin-dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FramerMotion.motion.div
      className={styles.page}
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.overlay} />
      <div className={styles.content}>
        <div className={`${styles.card} ${saStyles.card}`}>
          <div className={saStyles.iconWrap}>
            <FaCrown />
          </div>
          <h1 className={`${styles.title} ${saStyles.title}`}>Super Admin Login</h1>
          <p className={styles.subtitle}>
            Restricted access — platform-level control only.
          </p>

          <form onSubmit={handleSubmit} className={`${styles.form} ${saStyles.form}`}>
            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.inputIcon} />
              <input
                type="email"
                placeholder="Admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${styles.input} ${saStyles.input}`}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <FaLock className={styles.inputIcon} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${styles.input} ${saStyles.input}`}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={saStyles.submitBtn}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <button
            className={saStyles.backBtn}
            onClick={() => navigate("/")}
            type="button"
          >
            Back to Role Selection
          </button>
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default SuperAdminLogin;
