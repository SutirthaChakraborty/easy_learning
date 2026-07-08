import { useCallback, useEffect, useState } from "react";
import { MdArrowBack, MdAdd, MdClose } from "react-icons/md";
import DataTable from "../../components/Admin/DataTable";
import MultiSelectModal from "../../components/Admin/MultiSelectModal";
import ScheduleEditor from "../../components/Admin/ScheduleEditor";
import WeeklyScheduleGrid from "../../components/Admin/WeeklyScheduleGrid";
import { dayLabel } from "../../utils/schedule";
import styles from "../../components/Admin/AdminUI.module.css";

// A trimmed sibling of components/Admin/BatchDetail.jsx for the teacher dashboard:
// roster can be edited, but subjects/other-teacher assignment stay admin-only —
// a teacher can only edit the weekly schedule for subjects they personally teach.
export default function TeacherBatchDetail({ batchId, teacherId, get, post, del, onClose, onChanged }) {
  const [batch, setBatch] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [tab, setTab] = useState("roster");
  const [picker, setPicker] = useState(null); // "addStudents" | null
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadBatch = useCallback(async () => {
    const d = await get(`/batches/${batchId}`);
    if (d.success) setBatch(d.batch);
  }, [get, batchId]);

  useEffect(() => {
    Promise.all([
      loadBatch(),
      get("/students").then((d) => { if (d.success) setAllStudents(d.students); }),
    ]).finally(() => setLoading(false));
  }, [loadBatch, get]);

  const refreshAfterChange = async () => {
    await loadBatch();
    onChanged?.();
  };

  const closePicker = () => { setPicker(null); setPickerError(""); };

  const handleAddStudents = async (studentIds) => {
    setPickerLoading(true);
    setPickerError("");
    const d = await post(`/batches/${batchId}/students`, { studentIds });
    setPickerLoading(false);
    if (!d.success) { setPickerError(d.message || "Something went wrong"); return; }
    closePicker();
    refreshAfterChange();
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm("Remove this student from the batch?")) return;
    await del(`/batches/${batchId}/students/${studentId}`);
    refreshAfterChange();
  };

  if (loading || !batch) return <p className={styles.empty}>Loading batch…</p>;

  const studentPickerItems = allStudents
    .filter((s) => !batch.studentIds.some((bs) => bs._id === s._id))
    .map((s) => ({ id: s._id, label: s.name, sublabel: s.email || s.grade }));

  const atCapacity = batch.maxStudents != null && batch.studentIds.length >= batch.maxStudents;

  return (
    <div>
      <button className={styles.backBtn} onClick={onClose}><MdArrowBack /> Back to My Batches</button>
      <div className={styles.detailHeader}>
        <h1>{batch.name}</h1>
      </div>
      <p className={styles.detailMeta}>
        {[batch.academicYear, batch.term].filter(Boolean).join(" · ") || "No academic year/term set"}
        {batch.description ? ` — ${batch.description}` : ""}
      </p>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "roster" ? styles.tabActive : ""}`} onClick={() => setTab("roster")}>
          Roster ({batch.studentIds.length})
        </button>
        <button className={`${styles.tab} ${tab === "subjects" ? styles.tabActive : ""}`} onClick={() => setTab("subjects")}>
          My Subjects ({batch.subjects.length})
        </button>
      </div>

      {tab === "roster" && (
        <>
          <div className={styles.pageHeader}>
            <p className={`${styles.capacityBar} ${atCapacity ? styles.capacityFull : ""}`}>
              {batch.studentIds.length} / {batch.maxStudents ?? "∞"} students
            </p>
            <button className={styles.primaryBtn} onClick={() => setPicker("addStudents")} disabled={atCapacity}>
              <MdAdd /> Add Students
            </button>
          </div>
          <DataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "grade", label: "Grade" },
            ]}
            rows={batch.studentIds}
            actions={[{ icon: <MdClose />, title: "Remove", variant: "delete", onClick: (row) => handleRemoveStudent(row._id) }]}
            emptyMsg="No students in this batch yet."
          />
        </>
      )}

      {tab === "subjects" && (
        <>
          {batch.subjects.length === 0 ? (
            <p className={styles.empty}>No subjects have been added to this batch yet.</p>
          ) : (
            <>
              <WeeklyScheduleGrid
                events={batch.subjects.flatMap((a) =>
                  a.schedule.map((slot) => ({
                    ...slot,
                    label: a.subject?.name || "Subject",
                    sublabel: a.teacherIds.map((t) => t.name).join(", "),
                  }))
                )}
              />
              {batch.subjects.map((assignment) => {
                const teachesThis = assignment.teacherIds.some((t) => t._id === teacherId);
                return (
                  <div key={assignment._id} className={styles.subjectCard}>
                    <div className={styles.subjectCardHeader}>
                      <h3>{assignment.subject?.name || "Unknown subject"}</h3>
                    </div>
                    {assignment.teacherIds.length === 0 ? (
                      <p className={styles.empty}>No teachers assigned yet.</p>
                    ) : (
                      <div className={styles.chipRow}>
                        {assignment.teacherIds.map((t) => (
                          <span key={t._id} className={styles.chip}>{t.name}</span>
                        ))}
                      </div>
                    )}
                    {teachesThis ? (
                      <ScheduleEditor
                        schedule={assignment.schedule}
                        teacherIds={assignment.teacherIds.map((t) => t._id)}
                        post={post}
                        del={del}
                        addPath={`/batches/${batchId}/subjects/${assignment._id}/schedule`}
                        deletePath={(slotId) => `/batches/${batchId}/subjects/${assignment._id}/schedule/${slotId}`}
                        onChanged={refreshAfterChange}
                      />
                    ) : (
                      <div className={styles.chipRow}>
                        {assignment.schedule.length === 0 ? (
                          <span className={styles.mutedText}>No weekly schedule set.</span>
                        ) : (
                          assignment.schedule.map((slot) => (
                            <span key={slot._id} className={styles.chip}>
                              {dayLabel(slot.dayOfWeek)} {slot.startTime}–{slot.endTime}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {picker === "addStudents" && (
        <MultiSelectModal
          title="Add Students to Batch"
          items={studentPickerItems}
          onConfirm={handleAddStudents}
          onClose={closePicker}
          loading={pickerLoading}
          serverError={pickerError}
          searchPlaceholder="Search students…"
          emptyMsg="No more students to add."
        />
      )}
    </div>
  );
}
