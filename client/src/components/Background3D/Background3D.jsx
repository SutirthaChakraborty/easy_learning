import { useEffect, useRef } from "react";
import styles from "./Background3D.module.css";

const BRICK_COLORS = ["#e53935", "#1e88e5", "#43a047", "#fb8c00", "#fdd835", "#8e44ad"];

const BRICKS = Array.from({ length: 14 }, (_, i) => {
  const size = 44 + ((i * 37) % 70);
  return {
    id: i,
    size,
    studs: size > 78 ? 4 : 2,
    color: BRICK_COLORS[i % BRICK_COLORS.length],
    top: (i * 53) % 100,
    left: (i * 71) % 100,
    depth: -420 + ((i * 97) % 820),
    duration: 14 + (i % 6) * 3,
    delay: -(i * 1.7),
    spin: i % 2 === 0 ? 1 : -1,
  };
});

// Fixed, non-interactive (pointer-events: none) full-viewport layer mounted once
// at the app root so every page/dashboard shares the same animated backdrop.
const Background3D = () => {
  const sceneRef = useRef(null);
  const frameRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;
      if (sceneRef.current) {
        sceneRef.current.style.transform = `rotateX(${current.current.y}deg) rotateY(${current.current.x}deg)`;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    const setTarget = (clientX, clientY) => {
      const x = (clientX / window.innerWidth - 0.5) * 2;
      const y = (clientY / window.innerHeight - 0.5) * 2;
      target.current = { x: x * 8, y: -y * 6 };
    };

    const onMouseMove = (e) => setTarget(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches?.[0]) setTarget(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onOrientation = (e) => {
      if (e.gamma == null || e.beta == null) return;
      target.current = {
        x: Math.max(-10, Math.min(10, e.gamma / 3)),
        y: Math.max(-8, Math.min(8, (e.beta - 45) / 4)),
      };
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("deviceorientation", onOrientation, { passive: true });

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.scene} ref={sceneRef}>
        {BRICKS.map((b) => (
          <div
            key={b.id}
            className={styles.brick}
            style={{
              "--size": `${b.size}px`,
              "--color": b.color,
              "--top": `${b.top}%`,
              "--left": `${b.left}%`,
              "--depth": `${b.depth}px`,
              "--duration": `${b.duration}s`,
              "--delay": `${b.delay}s`,
              "--spin": b.spin,
            }}
          >
            <div className={styles.studRow}>
              {Array.from({ length: b.studs }, (_, s) => (
                <span key={s} className={styles.stud} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Background3D;
