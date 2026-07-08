import styles from "./AdminUI.module.css";
import { DAYS_OF_WEEK } from "../../utils/schedule";

export default function WeeklyScheduleGrid({ events }) {
  return (
    <div className={styles.weekGrid}>
      {DAYS_OF_WEEK.map((day) => {
        const dayEvents = events
          .filter((e) => e.dayOfWeek === day.value)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        return (
          <div key={day.value} className={styles.weekGridDay}>
            <h5>{day.label.slice(0, 3)}</h5>
            {dayEvents.length === 0 ? (
              <span className={styles.weekGridEmpty}>—</span>
            ) : (
              dayEvents.map((e, i) => (
                <div key={i} className={styles.weekGridEvent}>
                  <strong>{e.startTime}–{e.endTime}</strong>
                  <span>{e.label}</span>
                  {e.sublabel && <span className={styles.mutedText}>{e.sublabel}</span>}
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
