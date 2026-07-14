import { useState, useEffect, useCallback } from "react";
import { MdCloudUpload, MdFileDownload } from "react-icons/md";
import DataTable from "../../components/Admin/DataTable";
import styles from "../admin/AdminDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const MODULES = ["read", "write", "listen", "speak"];
const SUBJECTS = ["english", "maths", "science"];
const STATUS_BADGE = { pending: styles.badgeYellow, approved: styles.badgeGreen, rejected: styles.badgeRed };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function StatusBadge({ status }) {
  return <span className={`${styles.badge} ${STATUS_BADGE[status] || ""}`}>{status}</span>;
}

export default function TeacherQuestionUpload({ get, postForm, token }) {
  const [module, setModule] = useState("read");
  const [subject, setSubject] = useState("english");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  const loadUploads = useCallback(async () => {
    const d = await get("/questions/uploads");
    if (d.success) setUploads(d.batches);
  }, [get]);

  const loadBatches = useCallback(async () => {
    const d = await get("/batches");
    if (d.success) setMyBatches(d.batches);
  }, [get]);

  useEffect(() => { loadUploads(); loadBatches(); }, [loadUploads, loadBatches]);

  const batchNameById = (id) => myBatches.find((b) => b._id === id)?.name || id;

  const toggleBatch = (id) => {
    setSelectedBatchIds((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError("");
    try {
      const r = await fetch(`${API}/api/teacher/questions/template?module=${module}&subject=${subject}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Could not download template");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${module}-${subject}-template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download template");
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please choose a .xlsx file"); return; }
    if (selectedBatchIds.length === 0) { setError("Select at least one batch these questions should be visible to"); return; }
    setUploading(true);
    setError("");
    setResult(null);
    const formData = new FormData();
    formData.append("module", module);
    formData.append("subject", subject);
    formData.append("file", file);
    formData.append("batchIds", JSON.stringify(selectedBatchIds));
    const d = await postForm("/questions/upload", formData);
    setUploading(false);
    if (!d.success) { setError(d.message || "Upload failed"); if (d.rowErrors) setResult(d); return; }
    setResult(d);
    setFile(null);
    setSelectedBatchIds([]);
    loadUploads();
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1>Upload Questions</h1>
          <p>Submit new questions for review. A super admin approves them before they appear to students.</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className={styles.orgCard} style={{ maxWidth: 640 }}>
        <div className={styles.modalField}>
          <label>Module</label>
          <select value={module} onChange={(e) => setModule(e.target.value)}>
            {MODULES.map((m) => <option key={m} value={m}>{cap(m)}</option>)}
          </select>
        </div>
        <div className={styles.modalField}>
          <label>Subject</label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
          </select>
        </div>

        <button type="button" className={styles.viewBtn} onClick={handleDownloadTemplate} disabled={downloading} style={{ alignSelf: "flex-start" }}>
          <MdFileDownload /> {downloading ? "Downloading…" : `Download ${module}/${subject} template`}
        </button>

        <div className={styles.modalField}>
          <label>Filled template (.xlsx)</label>
          <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <div className={styles.modalField}>
          <label>Visible to batch(es)</label>
          {myBatches.length === 0 ? (
            <span>You have no assigned batches yet — ask your admin to add you to one.</span>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {myBatches.map((b) => (
                <label key={b._id} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "normal" }}>
                  <input
                    type="checkbox"
                    checked={selectedBatchIds.includes(b._id)}
                    onChange={() => toggleBatch(b._id)}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <span className={styles.fieldError}>{error}</span>}

        <button type="submit" className={styles.primaryBtn} disabled={uploading} style={{ alignSelf: "flex-start" }}>
          <MdCloudUpload /> {uploading ? "Uploading…" : "Upload"}
        </button>
      </form>

      {result && (
        <div className={styles.orgSummary} style={{ marginTop: 20, maxWidth: 640 }}>
          <h3>Upload result</h3>
          <p>
            {result.insertedCount || 0} question(s) submitted for review
            {result.skippedCount ? `, ${result.skippedCount} row(s) skipped` : ""}.
          </p>
          {result.rowErrors?.length > 0 && (
            <DataTable
              columns={[
                { key: "row", label: "Row" },
                { key: "field", label: "Field" },
                { key: "message", label: "Error" },
              ]}
              rows={result.rowErrors.map((e, i) => ({ _id: i, ...e }))}
              emptyMsg="No errors"
            />
          )}
        </div>
      )}

      <div className={styles.pageHeader} style={{ marginTop: 32 }}>
        <h1 style={{ fontSize: "1.3rem" }}>My Uploads</h1>
      </div>
      <DataTable
        columns={[
          { key: "module", label: "Module / Subject", render: (r) => `${cap(r.module)} / ${cap(r.subject)}` },
          { key: "batches", label: "Batches", render: (r) => (r.batchIds || []).map(batchNameById).join(", ") || "—" },
          { key: "originalFilename", label: "File" },
          { key: "rowCount", label: "Rows", render: (r) => `${r.rowCount}${r.skippedRowCount ? ` (+${r.skippedRowCount} skipped)` : ""}` },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "createdAt", label: "Uploaded", render: (r) => new Date(r.createdAt).toLocaleDateString() },
        ]}
        rows={uploads}
        emptyMsg="No uploads yet. Submit your first batch of questions above."
      />
    </>
  );
}
