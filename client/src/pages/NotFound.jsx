import { Link } from "react-router-dom";
import * as FramerMotion from "framer-motion";
import { FaHome } from "react-icons/fa";
import VideoBackground from "../components/VideoBackground/VideoBackground";
import SEO from "../components/SEO/SEO";
import styles from "./NotFound.module.css";

const NotFound = () => {
  return (
    <div className={styles.page}>
      <SEO
        title="Page Not Found | Learningo"
        description="The page you're looking for doesn't exist. Head back to Learningo to continue your learning adventure."
        path="/404"
        noIndex
      />
      <VideoBackground />

      <FramerMotion.motion.div
        className={styles.panel}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>We couldn't find that page</h1>
        <p className={styles.subtitle}>
          The page you're looking for may have moved or no longer exists.
        </p>
        <Link to="/home" className={styles.ctaBtn}>
          <FaHome /> Back to Learningo
        </Link>
      </FramerMotion.motion.div>
    </div>
  );
};

export default NotFound;
