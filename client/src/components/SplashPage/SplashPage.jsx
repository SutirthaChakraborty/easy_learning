import { useEffect, useRef, useState } from "react";
import * as FramerMotion from "framer-motion";
import splashVideo from "../../assets/videos/splashpage.mp4";
import logo from "/logo.png";
import styles from "./SplashPage.module.css";

const DURATION_MS = 2600;

// Full-screen intro shown once on initial app load, before the "/" role-select
// page appears. Plays splashpage.mp4 as the backdrop while a 0% -> 100%
// loader fills, then hands off to the app via onFinish.
const SplashPage = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const tick = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const pct = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
      setProgress(pct);

      if (pct < 100) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        onFinishRef.current?.();
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <FramerMotion.motion.div
      className={styles.wrapper}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <video
        className={styles.video}
        src={splashVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className={styles.overlay} />

      <div className={styles.logoArea}>
        <img src={logo} alt="Easy Learning" className={styles.logo} />
      </div>

      <div className={styles.loaderArea}>
        <div className={styles.loaderTrack}>
          <div className={styles.loaderFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.percent}>{progress}%</span>
      </div>
    </FramerMotion.motion.div>
  );
};

export default SplashPage;
