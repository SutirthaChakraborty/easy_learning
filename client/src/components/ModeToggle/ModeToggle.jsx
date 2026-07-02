import styles from "./ModeToggle.module.css";
import { FaGraduationCap } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";

const ModeToggle = ({ mode, onChange }) => (
  <div className={styles.wrapper}>
    <button
      className={`${styles.btn} ${mode === "practice" ? styles.active : ""}`}
      onClick={() => onChange("practice")}
    >
      <FaGraduationCap /> Practice
    </button>
    <button
      className={`${styles.btn} ${mode === "warrior" ? styles.activeWarrior : ""}`}
      onClick={() => onChange("warrior")}
    >
      <GiCrossedSwords /> Warrior
    </button>
  </div>
);

export default ModeToggle;
