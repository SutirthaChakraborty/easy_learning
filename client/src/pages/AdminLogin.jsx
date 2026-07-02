import { useState } from "react";
import * as FramerMotion from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { MdAdminPanelSettings } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useAdminAuth } from "../context/AdminAuthContext";
import styles from "./Login.module.css";
import adminStyles from "./AdminLogin.module.css";

const AdminLogin = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminGoogleSignIn } = useAdminAuth();

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, email, displayName, photoURL } = result.user;
      await adminGoogleSignIn(uid, email, displayName || "", photoURL || "");
      navigate("/admin-dashboard");
    } catch (err) {
      const cancelled = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
      if (cancelled.includes(err.code)) {
        setError("Sign-in cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked. Please allow popups for this site.");
      } else {
        setError(err.message || "Sign-in failed. Please try again.");
      }
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
        <div className={`${styles.card} ${adminStyles.card}`}>
          <div className={adminStyles.iconWrap}>
            <MdAdminPanelSettings />
          </div>
          <h1 className={`${styles.title} ${adminStyles.title}`}>Admin / Parent Login</h1>
          <p className={styles.subtitle}>
            Sign in with your Google account to access the organization dashboard.
          </p>

          <button
            className={`${styles.googleBtn} ${adminStyles.googleBtn}`}
            onClick={handleGoogle}
            disabled={loading}
            type="button"
          >
            <FcGoogle className={styles.googleIcon} />
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={adminStyles.backBtn}
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

export default AdminLogin;
