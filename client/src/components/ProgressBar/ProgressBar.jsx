import styles from "./ProgressBar.module.css";

const ProgressBar = ({ current, total }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{current} / {total}</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
