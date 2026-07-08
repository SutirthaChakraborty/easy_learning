import { useState } from "react";
import * as FramerMotion from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useAdminAuth } from "../context/AdminAuthContext";
import styles from "./Login.module.css";
import teacherStyles from "./TeacherLogin.module.css";

const TeacherLogin = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { teacherGoogleSignIn } = useAdminAuth();

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, email, displayName, photoURL } = result.user;
      await teacherGoogleSignIn(uid, email, displayName || "", photoURL || "");
      navigate("/teacher-dashboard");
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
        <div className={`${styles.card} ${teacherStyles.card}`}>
          <div className={teacherStyles.iconWrap}>
            <FaChalkboardTeacher />
          </div>
          <h1 className={`${styles.title} ${teacherStyles.title}`}>Teacher Login</h1>
          <p className={styles.subtitle}>
            Sign in with the Google account your organization admin has on file to access your batches.
          </p>

          <button
            className={`${styles.googleBtn} ${teacherStyles.googleBtn}`}
            onClick={handleGoogle}
            disabled={loading}
            type="button"
          >
            <FcGoogle className={styles.googleIcon} />
            {loading ? "Signing in…" : "Continue with Google"}
          </button>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={teacherStyles.backBtn}
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

export default TeacherLogin;
