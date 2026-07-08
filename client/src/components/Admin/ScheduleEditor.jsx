import { useEffect, useState } from "react";
import { MdAdd, MdClose, MdWarning } from "react-icons/md";
import styles from "./AdminUI.module.css";
import { DAYS_OF_WEEK, dayLabel } from "../../utils/schedule";

export default function ScheduleEditor({ schedule, teacherIds, post, del, addPath, deletePath, onChanged }) {
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!startTime || !endTime || teacherIds.length === 0) { setWarning(""); return; }
    let cancelled = false;
    (async () => {
      const found = [];
      for (const tutorId of teacherIds) {
        const d = await post("/schedule/check-conflict", { tutorId, dayOfWeek, startTime, endTime });
        if (d.success && d.conflicts?.length) found.push(...d.conflicts);
      }
      if (cancelled) return;
      if (found.length === 0) { setWarning(""); return; }
      const summary = [...new Set(found.map((c) => `${c.batchName} (${c.subjectName || "subject"})`))].join(", ");
      setWarning(`Conflicts with: ${summary}`);
    })();
    return () => { cancelled = true; };
  }, [dayOfWeek, startTime, endTime, teacherIds, post]);

  const handleAdd = async () => {
    setSaving(true);
    setError("");
    const d = await post(addPath, { dayOfWeek, startTime, endTime });
    setSaving(false);
    if (!d.success) {
      const extra = d.conflicts?.length ? ` (${[...new Set(d.conflicts.map((c) => c.batchName))].join(", ")})` : "";
      setError((d.message || "Something went wrong") + extra);
      return;
    }
    setStartTime("");
    setEndTime("");
    setWarning("");
    onChanged?.();
  };

  const handleRemove = async (slotId) => {
    if (!confirm("Remove this schedule slot?")) return;
    await del(deletePath(slotId));
    onChanged?.();
  };

  return (
    <div className={styles.scheduleEditor}>
      <div className={styles.chipRow}>
        {schedule.length === 0 ? (
          <span className={styles.mutedText}>No weekly schedule set.</span>
        ) : (
          schedule.map((slot) => (
            <span key={slot._id} className={styles.chip}>
              {dayLabel(slot.dayOfWeek)} {slot.startTime}–{slot.endTime}
              <button onClick={() => handleRemove(slot._id)}><MdClose /></button>
            </span>
          ))
        )}
      </div>
      <div className={styles.scheduleForm}>
        <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
          {DAYS_OF_WEEK.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        <button className={styles.viewBtn} title="Add Slot" onClick={handleAdd} disabled={saving || !startTime || !endTime}>
          <MdAdd />
        </button>
      </div>
      {warning && <p className={styles.scheduleWarning}><MdWarning /> {warning}</p>}
      {error && <p className={styles.serverError}>{error}</p>}
    </div>
  );
}
