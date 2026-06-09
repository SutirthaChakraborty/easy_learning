import styles from "./ModeToggle.module.css";

const ModeToggle = ({ mode, onChange }) => (
  <div className={styles.wrapper}>
    <button
      className={`${styles.btn} ${mode === "practice" ? styles.active : ""}`}
      onClick={() => onChange("practice")}
    >
      🎓 Practice
    </button>
    <button
      className={`${styles.btn} ${mode === "warrior" ? styles.activeWarrior : ""}`}
      onClick={() => onChange("warrior")}
    >
      ⚔️ Warrior
    </button>
  </div>
);

export default ModeToggle;
