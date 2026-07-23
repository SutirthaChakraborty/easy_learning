import { useState, useEffect } from "react";
import { MdClose, MdEdit } from "react-icons/md";
import DataTable from "./DataTable";
import Modal from "./Modal";
import styles from "./AdminUI.module.css";

const HIDDEN_KEYS = ["_id", "__v", "status", "submittedBy", "uploadBatchId", "createdAt", "updatedAt", "translations", "id"];
const NUMBER_KEYS = new Set(["level", "xp"]);
const ARRAY_KEYS = new Set(["options"]);

// Shared by the Admin and Teacher dashboards — both expose the same relative
// `/questions/uploads/:id` (GET) and `/questions/:module/:subject/:id` (PATCH)
// routes under their own API prefix, so the same `get`/`post` props work for either.
export default function QuestionBatchDetailModal({ batchId, get, post, onClose }) {
  const [batch, setBatch] = useState(null);
  const [rows, setRows] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [rowLoading, setRowLoading] = useState(false);
  const [rowError, setRowError] = useState("");

  useEffect(() => {
    get(`/questions/uploads/${batchId}`).then((d) => {
      if (d.success) { setBatch(d.batch); setRows(d.rows); }
    });
  }, [batchId, get]);

  const editableKeys = rows.length ? Object.keys(rows[0]).filter((k) => !HIDDEN_KEYS.includes(k)) : [];

  const rowColumns = editableKeys.map((k) => ({
    key: k, label: k, render: (r) => (Array.isArray(r[k]) ? r[k].join(", ") : String(r[k] ?? "—")),
  }));

  const editFields = editableKeys.map((k) => ({
    key: k, label: k, type: NUMBER_KEYS.has(k) ? "number" : "text",
  }));

  const editInitial = editingRow
    ? Object.fromEntries(editableKeys.map((k) => [
      k, ARRAY_KEYS.has(k) && Array.isArray(editingRow[k]) ? editingRow[k].join(", ") : editingRow[k],
    ]))
    : {};

  const handleEditSubmit = async (form) => {
    setRowLoading(true);
    setRowError("");
    const payload = {};
    for (const k of editableKeys) {
      payload[k] = ARRAY_KEYS.has(k)
        ? String(form[k] || "").split(",").map((s) => s.trim()).filter(Boolean)
        : form[k];
    }
    const d = await post(`/questions/${batch.module}/${batch.subject}/${editingRow._id}`, payload, "PATCH");
    setRowLoading(false);
    if (!d.success) { setRowError(d.message || "Something went wrong"); return; }
    setRows((rs) => rs.map((r) => (r._id === editingRow._id ? d.question : r)));
    setEditingRow(null);
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>{batch ? batch.originalFilename : "Loading…"}</h3>
            <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
          </div>
          {!batch ? <p className={styles.empty}>Loading…</p> : (
            <>
              <p className={styles.mutedText}>
                {batch.module} / {batch.subject} · {batch.submittedByName} ({batch.submittedByEmail})
              </p>

              {batch.rowErrors?.length > 0 && (
                <>
                  <p className={styles.mutedText} style={{ marginTop: 16 }}>Skipped rows ({batch.rowErrors.length}):</p>
                  <DataTable
                    columns={[
                      { key: "row", label: "Row" },
                      { key: "field", label: "Field" },
                      { key: "message", label: "Error" },
                    ]}
                    rows={batch.rowErrors.map((e, i) => ({ _id: `err-${i}`, ...e }))}
                    emptyMsg="No errors"
                  />
                </>
              )}

              <p className={styles.mutedText} style={{ marginTop: 16 }}>Submitted questions ({rows.length}):</p>
              <DataTable
                columns={rowColumns}
                rows={rows}
                actions={[{ icon: <MdEdit />, title: "Edit", onClick: (row) => { setEditingRow(row); setRowError(""); } }]}
                emptyMsg="No rows found for this batch."
              />
            </>
          )}
        </div>
      </div>

      {editingRow && (
        <Modal
          title="Edit Question"
          fields={editFields}
          initial={editInitial}
          onSubmit={handleEditSubmit}
          onClose={() => setEditingRow(null)}
          loading={rowLoading}
          serverError={rowError}
        />
      )}
    </>
  );
}
