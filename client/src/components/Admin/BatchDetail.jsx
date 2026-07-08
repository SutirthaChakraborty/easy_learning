import { useCallback, useEffect, useState } from "react";
import { MdArrowBack, MdAdd, MdClose } from "react-icons/md";
import DataTable from "./DataTable";
import MultiSelectModal from "./MultiSelectModal";
import styles from "./AdminUI.module.css";

export default function BatchDetail({ batchId, get, post, del, onClose, onChanged }) {
  const [batch, setBatch] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [allTutors, setAllTutors] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [tab, setTab] = useState("roster");
  const [picker, setPicker] = useState(null); // "addStudents" | "addSubject" | { type: "addTeacher", subjectAssignmentId }
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
      get("/tutors").then((d) => { if (d.success) setAllTutors(d.tutors); }),
      get("/subjects").then((d) => { if (d.success) setAllSubjects(d.subjects); }),
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

  const handleAddSubjects = async (subjectIds) => {
    setPickerLoading(true);
    setPickerError("");
    for (const subjectId of subjectIds) {
      const d = await post(`/batches/${batchId}/subjects`, { subjectId });
      if (!d.success) { setPickerLoading(false); setPickerError(d.message || "Something went wrong"); return; }
    }
    setPickerLoading(false);
    closePicker();
    refreshAfterChange();
  };

  const handleRemoveSubject = async (subjectAssignmentId) => {
    if (!confirm("Remove this subject from the batch?")) return;
    await del(`/batches/${batchId}/subjects/${subjectAssignmentId}`);
    refreshAfterChange();
  };

  const handleAddTeachers = async (subjectAssignmentId, tutorIds) => {
    setPickerLoading(true);
    setPickerError("");
    for (const tutorId of tutorIds) {
      const d = await post(`/batches/${batchId}/subjects/${subjectAssignmentId}/teachers`, { tutorId });
      if (!d.success) { setPickerLoading(false); setPickerError(d.message || "Something went wrong"); return; }
    }
    setPickerLoading(false);
    closePicker();
    refreshAfterChange();
  };

  const handleRemoveTeacher = async (subjectAssignmentId, tutorId) => {
    if (!confirm("Remove this teacher from the subject?")) return;
    await del(`/batches/${batchId}/subjects/${subjectAssignmentId}/teachers/${tutorId}`);
    refreshAfterChange();
  };

  if (loading || !batch) return <p className={styles.empty}>Loading batch…</p>;

  const studentPickerItems = allStudents
    .filter((s) => !batch.studentIds.some((bs) => bs._id === s._id))
    .map((s) => ({ id: s._id, label: s.name, sublabel: s.email || s.grade }));

  const subjectPickerItems = allSubjects
    .filter((s) => s.status === "active" && !batch.subjects.some((a) => a.subject?._id === s._id))
    .map((s) => ({ id: s._id, label: s.name, sublabel: s.code }));

  const atCapacity = batch.maxStudents != null && batch.studentIds.length >= batch.maxStudents;

  return (
    <div>
      <button className={styles.backBtn} onClick={onClose}><MdArrowBack /> Back to Batches</button>
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
          Subjects ({batch.subjects.length})
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
          <div className={styles.pageHeader}>
            <div />
            <button className={styles.primaryBtn} onClick={() => setPicker("addSubject")}>
              <MdAdd /> Add Subject
            </button>
          </div>
          {batch.subjects.length === 0 ? (
            <p className={styles.empty}>No subjects added to this batch yet.</p>
          ) : (
            batch.subjects.map((assignment) => (
              <div key={assignment._id} className={styles.subjectCard}>
                <div className={styles.subjectCardHeader}>
                  <h3>{assignment.subject?.name || "Unknown subject"}</h3>
                  <div className={styles.subjectCardActions}>
                    <button className={styles.viewBtn} title="Add Teacher" onClick={() => setPicker({ type: "addTeacher", subjectAssignmentId: assignment._id })}>
                      <MdAdd />
                    </button>
                    <button className={styles.deleteBtn} title="Remove Subject" onClick={() => handleRemoveSubject(assignment._id)}>
                      <MdClose />
                    </button>
                  </div>
                </div>
                {assignment.teacherIds.length === 0 ? (
                  <p className={styles.empty}>No teachers assigned yet.</p>
                ) : (
                  <div className={styles.chipRow}>
                    {assignment.teacherIds.map((t) => (
                      <span key={t._id} className={styles.chip}>
                        {t.name}
                        <button onClick={() => handleRemoveTeacher(assignment._id, t._id)}><MdClose /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
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

      {picker === "addSubject" && (
        <MultiSelectModal
          title="Add Subjects to Batch"
          items={subjectPickerItems}
          onConfirm={handleAddSubjects}
          onClose={closePicker}
          loading={pickerLoading}
          serverError={pickerError}
          searchPlaceholder="Search subjects…"
          emptyMsg="No more subjects to add."
        />
      )}

      {picker?.type === "addTeacher" && (
        <MultiSelectModal
          title="Assign Teachers"
          items={allTutors
            .filter((t) => !batch.subjects.find((a) => a._id === picker.subjectAssignmentId)?.teacherIds.some((at) => at._id === t._id))
            .map((t) => ({ id: t._id, label: t.name, sublabel: t.email }))}
          onConfirm={(tutorIds) => handleAddTeachers(picker.subjectAssignmentId, tutorIds)}
          onClose={closePicker}
          loading={pickerLoading}
          serverError={pickerError}
          searchPlaceholder="Search teachers…"
          emptyMsg="No more teachers to assign."
        />
      )}
    </div>
  );
}
