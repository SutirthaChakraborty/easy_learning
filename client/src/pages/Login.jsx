import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as FramerMotion from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginManual, registerManual } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await registerManual(name, email, password);
      } else {
        await loginManual(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || t("login.errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      const cancelled = [
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
      ];
      if (cancelled.includes(err.code)) {
        setError(t("login.googleCancelled"));
      } else if (err.code === "auth/popup-blocked") {
        setError(t("login.popupBlocked"));
      } else if (err.code === "auth/network-request-failed") {
        setError(t("login.networkError"));
      } else if (err.code === "auth/operation-not-allowed") {
        setError(t("login.operationNotAllowed"));
      } else {
        setError(t("login.errorDefault"));
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignup((prev) => !prev);
    setError("");
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
        <div className={styles.card}>
          <h1 className={styles.title}>
            {isSignup ? t("login.joinTitle") : t("login.welcomeBack")}
          </h1>
          <p className={styles.subtitle}>
            {isSignup ? t("login.createAccountSubtitle") : t("login.continueJourneySubtitle")}
          </p>

          <button
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={loading}
            type="button"
          >
            <FcGoogle className={styles.googleIcon} />
            {t("login.continueGoogle")}
          </button>

          <div className={styles.divider}>
            <span>{t("login.or")}</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignup && (
              <div className={styles.inputGroup}>
                <FaUser className={styles.inputIcon} />
                <input
                  type="text"
                  placeholder={t("login.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.inputIcon} />
              <input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <FaLock className={styles.inputIcon} />
              <input
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading
                ? t("login.loading")
                : isSignup
                ? t("login.createAccountBtn")
                : t("login.signInBtn")}
            </button>
          </form>

          <p className={styles.toggle}>
            {isSignup ? t("login.alreadyAccount") : t("login.noAccount")}{" "}
            <button className={styles.toggleBtn} onClick={switchMode} type="button">
              {isSignup ? t("login.signInBtn") : t("login.signUpBtn")}
            </button>
          </p>
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default Login;
