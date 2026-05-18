import { useState } from "react";
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
      setError(err.message || "Something went wrong. Please try again.");
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
      const googleErrors = {
        "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      };
      setError(googleErrors[err.code] || "Something went wrong. Please try again.");
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
            {isSignup ? "Join Learningo!" : "Welcome Back!"}
          </h1>
          <p className={styles.subtitle}>
            {isSignup
              ? "Create your account to start learning"
              : "Sign in to continue your journey"}
          </p>

          <button
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={loading}
            type="button"
          >
            <FcGoogle className={styles.googleIcon} />
            Continue with Google
          </button>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignup && (
              <div className={styles.inputGroup}>
                <FaUser className={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Your name"
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
                placeholder="Email address"
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
                placeholder="Password"
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
              {loading ? "Loading..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className={styles.toggle}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button className={styles.toggleBtn} onClick={switchMode} type="button">
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </FramerMotion.motion.div>
  );
};

export default Login;
