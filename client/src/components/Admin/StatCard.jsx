import styles from "./AdminUI.module.css";

export default function StatCard({ label, value, icon, color }) {
  return (
    <div className={styles.statCard} style={{ borderColor: color }}>
      <div className={styles.statIcon} style={{ color }}>{icon}</div>
      <div>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}
