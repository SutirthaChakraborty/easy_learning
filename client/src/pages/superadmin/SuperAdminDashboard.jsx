import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCrown, FaBuilding, FaUsers, FaCheckCircle, FaTimesCircle,
  FaClock, FaChartBar, FaCog, FaSignOutAlt, FaTachometerAlt,
  FaGlobe, FaThumbsUp, FaThumbsDown, FaSearch, FaChalkboardTeacher,
  FaUserGraduate, FaChartLine, FaEnvelopeOpenText, FaComments,
  FaFileExcel,
} from "react-icons/fa";
import { MdClose, MdInsights } from "react-icons/md";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { designationLabel } from "../../utils/designations";
import StudentDashboardViewer from "../../components/StudentDashboardViewer/StudentDashboardViewer";
import DataTable from "../../components/Admin/DataTable";
import styles from "./SuperAdminDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const NAV = [
  { key: "overview", label: "Overview", icon: <FaTachometerAlt /> },
  { key: "organizations", label: "Organizations", icon: <FaBuilding /> },
  { key: "question-uploads", label: "Question Review", icon: <FaFileExcel /> },
  { key: "chat", label: "Admin Chat", icon: <FaComments /> },
  { key: "contact", label: "Contact Messages", icon: <FaEnvelopeOpenText /> },
  { key: "reports", label: "Reports", icon: <FaChartBar /> },
  { key: "settings", label: "Settings", icon: <FaCog /> },
];

const PLAN_OPTIONS = ["free", "basic", "pro", "enterprise"];
const KEY_RE = /^[a-zA-Z0-9_]+$/;

function useSAApi(token) {
  const get = useCallback(async (path) => {
    const r = await fetch(`${API}/api/superadmin${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
  }, [token]);

  const put = useCallback(async (path, body = {}) => {
    const r = await fetch(`${API}/api/superadmin${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }, [token]);

  const post = useCallback(async (path, body) => {
    const r = await fetch(`${API}/api/superadmin${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }, [token]);

  return { get, put, post };
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    approved: styles.badgeGreen,
    pending: styles.badgeYellow,
    rejected: styles.badgeRed,
    active: styles.badgeGreen,
    expired: styles.badgeRed,
    cancelled: styles.badgeRed,
    free: styles.badgeGray,
    basic: styles.badgeBlue,
    pro: styles.badgePurple,
    enterprise: styles.badgeGold,
    open: styles.badgeYellow,
    in_progress: styles.badgeBlue,
    resolved: styles.badgeGreen,
  };
  return <span className={`${styles.badge} ${map[status] || styles.badgeGray}`}>{status}</span>;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
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

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ title = "Reject Organization", onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const error = reason.trim().length < 5 ? "Please provide a reason of at least 5 characters" : "";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <p className={styles.modalDesc}>Provide a reason for rejection:</p>
        <textarea
          className={styles.modalTextarea}
          placeholder="Reason for rejection…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={3}
        />
        {touched && error && <p className={styles.fieldError}>{error}</p>}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.rejectBtn}
            onClick={() => { setTouched(true); if (!error) onConfirm(reason.trim()); }}
            disabled={loading || (touched && !!error)}
          >
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Settings modal ────────────────────────────────────────────────────────────
function SettingModal({ onSave, onClose, loading, serverError }) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState({});

  const keyError = !key.trim() ? "Key is required" : !KEY_RE.test(key.trim()) ? "Only letters, numbers, and underscores allowed" : "";
  const valueError = !value.trim() ? "Value is required" : "";
  const hasErrors = !!keyError || !!valueError;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Add / Update Setting</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <div className={styles.modalForm}>
          <div className={styles.modalField}><label>Key</label>
            <input value={key} onChange={(e) => setKey(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, key: true }))} placeholder="e.g. max_students_per_batch" />
            {touched.key && keyError && <span className={styles.fieldError}>{keyError}</span>}
          </div>
          <div className={styles.modalField}><label>Value</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, value: true }))} placeholder="e.g. 30" />
            {touched.value && valueError && <span className={styles.fieldError}>{valueError}</span>}
          </div>
          <div className={styles.modalField}><label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this setting controls" />
          </div>
          {serverError && <p className={styles.fieldError}>{serverError}</p>}
          <button
            className={styles.saveSettingBtn}
            onClick={() => { setTouched({ key: true, value: true }); if (!hasErrors) onSave({ key: key.trim(), value: value.trim(), description }); }}
            disabled={loading || (Object.keys(touched).length > 0 && hasErrors)}
          >
            {loading ? "Saving…" : "Save Setting"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Org detail drawer: admin identity + teachers + students + performance ────
function OrgDetailModal({ org, get, token, onClose }) {
  const [tab, setTab] = useState("admin");
  const [admin, setAdmin] = useState(null);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [search, setSearch] = useState("");
  const [perf, setPerf] = useState(null);
  const [dashboardViewerStudent, setDashboardViewerStudent] = useState(null);

  useEffect(() => {
    get(`/organizations/${org._id}/admin`).then((d) => { if (d.success) setAdmin(d.admin); });
  }, [org._id, get]);

  const loadStudents = useCallback(async (q) => {
    const d = await get(`/organizations/${org._id}/students${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    if (d.success) setStudents(d.students);
  }, [get, org._id]);

  const loadTutors = useCallback(async (q) => {
    const d = await get(`/organizations/${org._id}/tutors${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    if (d.success) setTutors(d.tutors);
  }, [get, org._id]);

  const handleTab = (t) => {
    setTab(t);
    setSearch("");
    if (t === "students") loadStudents("");
    else if (t === "tutors") loadTutors("");
  };

  const handleSearch = (v) => {
    setSearch(v);
    if (tab === "students") loadStudents(v);
    else if (tab === "tutors") loadTutors(v);
  };

  const viewStudentPerf = async (student) => {
    const d = await get(`/organizations/${org._id}/students/${student._id}/performance`);
    if (!d.success) return;
    if (d.performance.linked) {
      setDashboardViewerStudent({ id: student._id, name: student.name });
    } else {
      setPerf({ type: "student", name: student.name, performance: d.performance });
    }
  };

  const viewTutorPerf = async (tutor) => {
    const d = await get(`/organizations/${org._id}/tutors/${tutor._id}/performance`);
    if (d.success) setPerf({ type: "tutor", name: tutor.name, students: d.students });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.wideModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{org.name}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>

        <div className={styles.filterRow} style={{ marginBottom: 16 }}>
          <button className={`${styles.filterBtn} ${tab === "admin" ? styles.filterActive : ""}`} onClick={() => handleTab("admin")}>Admin Identity</button>
          <button className={`${styles.filterBtn} ${tab === "tutors" ? styles.filterActive : ""}`} onClick={() => handleTab("tutors")}>Teachers</button>
          <button className={`${styles.filterBtn} ${tab === "students" ? styles.filterActive : ""}`} onClick={() => handleTab("students")}>Students</button>
        </div>

        {tab === "admin" && (
          admin ? (
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}><span>Name</span><strong>{admin.name || "—"}</strong></div>
              <div className={styles.detailRow}><span>Email</span><strong>{admin.email}</strong></div>
              <div className={styles.detailRow}><span>Phone</span><strong>{admin.phone || "—"}</strong></div>
              <div className={styles.detailRow}><span>Designation</span><strong>{designationLabel(admin) || "—"}</strong></div>
            </div>
          ) : <p className={styles.empty}>Loading admin identity…</p>
        )}

        {(tab === "tutors" || tab === "students") && (
          <>
            <div className={styles.searchBarSA}>
              <FaSearch />
              <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder={`Search ${tab} by name…`} />
            </div>
            <div className={styles.tutorPerfList}>
              {(tab === "tutors" ? tutors : students).length === 0 ? (
                <p className={styles.empty}>No {tab} found.</p>
              ) : (tab === "tutors" ? tutors : students).map((row) => (
                <div key={row._id} className={styles.tutorPerfRow}>
                  <div>
                    <strong>{row.name}</strong>
                    <span className={styles.mutedText}> · {row.email || "no email"}</span>
                  </div>
                  <button className={styles.viewBtnSA} onClick={() => (tab === "tutors" ? viewTutorPerf(row) : viewStudentPerf(row))}>
                    <MdInsights /> Performance
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {perf && (
          <div className={styles.perfOverlay} onClick={() => setPerf(null)}>
            <div className={styles.perfPanel} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Performance — {perf.name}</h3>
                <button className={styles.modalClose} onClick={() => setPerf(null)}><MdClose /></button>
              </div>
              {perf.type === "student" ? (
                perf.performance.linked ? (
                  <div className={styles.perfGrid}>
                    <div className={styles.perfStat}><span>{perf.performance.totalXP}</span><label>Total XP</label></div>
                    <div className={styles.perfStat}><span>{perf.performance.totalSessions}</span><label>Sessions</label></div>
                    <div className={styles.perfStat}><span>{perf.performance.totalMinutes}</span><label>Minutes</label></div>
                    <div className={styles.perfStat}><span>{perf.performance.averageScore}%</span><label>Avg Score</label></div>
                    <div className={styles.perfStat}><span>{perf.performance.achievementCount}</span><label>Achievements</label></div>
                  </div>
                ) : <p className={styles.empty}>No learning activity recorded yet.</p>
              ) : (
                perf.students.length === 0 ? <p className={styles.empty}>No students assigned.</p> : (
                  <div className={styles.tutorPerfList}>
                    {perf.students.map((s) => (
                      <div key={s.studentId} className={styles.tutorPerfRow}>
                        <strong>{s.name}</strong>
                        {s.performance.linked ? (
                          <span>{s.performance.totalXP} XP · {s.performance.totalSessions} sessions · {s.performance.averageScore}% avg</span>
                        ) : <span className={styles.mutedText}>No activity yet</span>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {dashboardViewerStudent && (
        <StudentDashboardViewer
          apiBase={`${API}/api/superadmin/organizations/${org._id}/students/${dashboardViewerStudent.id}/dashboard`}
          token={token}
          displayName={dashboardViewerStudent.name}
          onClose={() => setDashboardViewerStudent(null)}
        />
      )}
    </div>
  );
}

// ── Question upload batch detail: parsed rows + row errors ───────────────────
function UploadBatchDetailModal({ batchId, get, onClose }) {
  const [batch, setBatch] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    get(`/question-uploads/${batchId}`).then((d) => {
      if (d.success) { setBatch(d.batch); setRows(d.rows); }
    });
  }, [batchId, get]);

  const rowColumns = rows.length
    ? Object.keys(rows[0])
      .filter((k) => !["_id", "__v", "status", "submittedBy", "uploadBatchId", "createdAt", "updatedAt", "translations", "id"].includes(k))
      .map((k) => ({ key: k, label: k, render: (r) => Array.isArray(r[k]) ? r[k].join(", ") : String(r[k] ?? "—") }))
    : [];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.wideModal}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{batch ? batch.originalFilename : "Loading…"}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        {!batch ? <p className={styles.empty}>Loading…</p> : (
          <>
            <p className={styles.orgMeta}>
              {batch.module} / {batch.subject} · {batch.submittedByName} ({batch.submittedByEmail}) · {batch.orgName}
            </p>
            <a href={batch.originalFileUrl} target="_blank" rel="noreferrer" className={styles.attachmentLink}>
              Download original file
            </a>

            {batch.rowErrors?.length > 0 && (
              <>
                <p className={styles.orgMeta} style={{ marginTop: 16 }}>Skipped rows ({batch.rowErrors.length}):</p>
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

            <p className={styles.orgMeta} style={{ marginTop: 16 }}>Submitted questions ({rows.length}):</p>
            <DataTable columns={rowColumns} rows={rows} emptyMsg="No rows found for this batch." />
          </>
        )}
      </div>
    </div>
  );
}

// ── Admin chat: conversation list + thread ────────────────────────────────────
function ChatSection({ conversations, activeConvo, messages, draft, onOpen, onDraftChange, onSend, sending }) {
  return (
    <div className={styles.chatLayout}>
      <div className={styles.convoList}>
        {conversations.length === 0 ? (
          <p className={styles.empty}>No conversations yet.</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.adminUid}
              className={`${styles.convoRow} ${activeConvo?.adminUid === c.adminUid ? styles.convoActive : ""}`}
              onClick={() => onOpen(c)}
            >
              <strong>{c.orgName || "Unknown org"}</strong>
              {c.unreadCount > 0 && <span className={styles.navDot} />}
              <p className={styles.convoPreview}>{c.lastMessage}</p>
              <span className={styles.convoMeta}>{c.orgStatus} · {new Date(c.lastAt).toLocaleDateString()}</span>
            </button>
          ))
        )}
      </div>
      <div className={styles.convoThread}>
        {!activeConvo ? (
          <p className={styles.empty}>Select a conversation.</p>
        ) : (
          <>
            <div className={styles.chatMessages}>
              {messages.map((m) => (
                <div key={m._id} className={`${styles.chatBubble} ${m.senderRole === "superadmin" ? styles.chatBubbleMine : styles.chatBubbleTheirs}`}>
                  <p>{m.message}</p>
                  <span className={styles.chatTime}>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className={styles.chatInputRow}>
              <textarea rows={2} value={draft} onChange={(e) => onDraftChange(e.target.value)} placeholder="Reply to org admin…" />
              <button className={styles.approveBtn} onClick={onSend} disabled={sending || !draft.trim()}>
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const SuperAdminDashboard = () => {
  const { superAdminUser, superAdminLogout, getSuperAdminToken } = useAdminAuth();
  const navigate = useNavigate();
  const token = getSuperAdminToken();
  const { get, put, post } = useSAApi(token);

  const [section, setSection] = useState("overview");
  const [stats, setStats] = useState({ totalOrgs: 0, pendingOrgs: 0, approvedOrgs: 0, rejectedOrgs: 0 });
  const [orgs, setOrgs] = useState([]);
  const [uploadStats, setUploadStats] = useState({ totalUploads: 0, pendingUploads: 0, approvedUploads: 0, rejectedUploads: 0 });
  const [uploadBatches, setUploadBatches] = useState([]);
  const [uploadFilterStatus, setUploadFilterStatus] = useState("all");
  const [rejectUploadTarget, setRejectUploadTarget] = useState(null);
  const [detailBatchId, setDetailBatchId] = useState(null);
  const [settings, setSettings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageFilter, setMessageFilter] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [settingModal, setSettingModal] = useState(false);
  const [settingError, setSettingError] = useState("");
  const [detailOrg, setDetailOrg] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [convoMessages, setConvoMessages] = useState([]);
  const [convoDraft, setConvoDraft] = useState("");
  const [convoSending, setConvoSending] = useState(false);
  const [chatUnreadTotal, setChatUnreadTotal] = useState(0);

  useEffect(() => {
    if (!superAdminUser && superAdminUser !== undefined) navigate("/superadmin-login");
  }, [superAdminUser, navigate]);

  const loadStats = useCallback(async () => {
    const d = await get("/stats");
    if (d.success) setStats(d.stats);
  }, [get]);

  const loadOrgs = useCallback(async (status) => {
    const query = status && status !== "all" ? `?status=${status}` : "";
    const d = await get(`/organizations${query}`);
    if (d.success) setOrgs(d.orgs);
  }, [get]);

  const loadUploadStats = useCallback(async () => {
    const d = await get("/question-uploads/stats");
    if (d.success) setUploadStats(d.stats);
  }, [get]);

  const loadUploadBatches = useCallback(async (status) => {
    const query = status && status !== "all" ? `?status=${status}` : "";
    const d = await get(`/question-uploads${query}`);
    if (d.success) setUploadBatches(d.batches);
  }, [get]);

  const loadSettings = useCallback(async () => {
    const d = await get("/settings");
    if (d.success) setSettings(d.settings);
  }, [get]);

  const loadMessages = useCallback(async (status) => {
    const query = status && status !== "all" ? `?status=${status}` : "";
    const d = await get(`/contact${query}`);
    if (d.success) setMessages(d.messages);
  }, [get]);

  const loadConversations = useCallback(async () => {
    const d = await get("/chat");
    if (d.success) setConversations(d.conversations);
  }, [get]);

  const pollChatUnread = useCallback(async () => {
    const d = await get("/chat/unread-count");
    if (d.success) setChatUnreadTotal(d.count);
  }, [get]);

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
    loadUploadStats();
  }, [loadStats, loadUploadStats]);

  useEffect(() => {
    pollChatUnread();
    const iv = setInterval(pollChatUnread, 25000);
    return () => clearInterval(iv);
  }, [pollChatUnread]);

  const handleSection = useCallback(async (sec) => {
    setSection(sec);
    if (sec === "organizations") loadOrgs(filterStatus);
    else if (sec === "question-uploads") { loadUploadStats(); loadUploadBatches(uploadFilterStatus); }
    else if (sec === "settings") loadSettings();
    else if (sec === "contact") loadMessages(messageFilter);
    else if (sec === "chat") loadConversations();
  }, [filterStatus, uploadFilterStatus, messageFilter, loadOrgs, loadUploadStats, loadUploadBatches, loadSettings, loadMessages, loadConversations]);

  const openConversation = async (convo) => {
    setActiveConvo(convo);
    const d = await get(`/chat/${convo.orgId}`);
    if (d.success) setConvoMessages(d.messages);
    loadConversations();
  };

  const handleSendConvo = async () => {
    if (!convoDraft.trim() || !activeConvo) return;
    setConvoSending(true);
    const d = await post(`/chat/${activeConvo.orgId}`, { message: convoDraft.trim() });
    setConvoSending(false);
    if (d.success) {
      setConvoDraft("");
      const t = await get(`/chat/${activeConvo.orgId}`);
      if (t.success) setConvoMessages(t.messages);
      loadConversations();
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    loadOrgs(status);
  };

  const handleMessageFilterChange = (status) => {
    setMessageFilter(status);
    loadMessages(status);
  };

  const handleApprove = async (id) => {
    setActionLoading(id + "_approve");
    await put(`/organizations/${id}/approve`);
    setActionLoading(null);
    loadStats();
    loadOrgs(filterStatus);
  };

  const handleRejectConfirm = async (reason) => {
    setActionLoading("reject");
    await put(`/organizations/${rejectTarget}/reject`, { reason });
    setActionLoading(null);
    setRejectTarget(null);
    loadStats();
    loadOrgs(filterStatus);
  };

  const handleUploadFilterChange = (status) => {
    setUploadFilterStatus(status);
    loadUploadBatches(status);
  };

  const handleApproveUpload = async (id) => {
    setActionLoading(id + "_approve");
    await put(`/question-uploads/${id}/approve`);
    setActionLoading(null);
    loadUploadStats();
    loadUploadBatches(uploadFilterStatus);
  };

  const handleRejectUploadConfirm = async (reason) => {
    setActionLoading("reject-upload");
    await put(`/question-uploads/${rejectUploadTarget}/reject`, { reason });
    setActionLoading(null);
    setRejectUploadTarget(null);
    loadUploadStats();
    loadUploadBatches(uploadFilterStatus);
  };

  const handlePlanChange = async (id, plan) => {
    await put(`/organizations/${id}/subscription`, { plan });
    loadOrgs(filterStatus);
  };

  const handleSaveSetting = async (body) => {
    setActionLoading("setting");
    setSettingError("");
    const d = await post("/settings", body);
    setActionLoading(null);
    if (d.success) { setSettingModal(false); loadSettings(); } else { setSettingError(d.message); }
  };

  const handleReply = async (id) => {
    setActionLoading(id + "_reply");
    const d = await put(`/contact/${id}`, { reply: replyDrafts[id] || "", status: "resolved" });
    setActionLoading(null);
    if (d.success) loadMessages(messageFilter);
  };

  const handleLogout = () => { superAdminLogout(); navigate("/"); };

  if (loading || superAdminUser === undefined) {
    return <div className={styles.splash}><FaCrown className={styles.splashIcon} /><p>Loading…</p></div>;
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <FaCrown className={styles.sidebarLogo} />
          <span>Super Admin</span>
        </div>
        <div className={styles.adminInfo}>
          <p className={styles.adminName}>Learningo Super Admin</p>
          <p className={styles.adminEmail}>{superAdminUser?.email}</p>
        </div>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`${styles.navItem} ${section === n.key ? styles.navActive : ""}`}
              onClick={() => handleSection(n.key)}
            >
              {n.icon} <span>{n.label}</span>
              {n.key === "organizations" && stats.pendingOrgs > 0 && <span className={styles.navDot} />}
              {n.key === "question-uploads" && uploadStats.pendingUploads > 0 && <span className={styles.navDot} />}
              {n.key === "chat" && chatUnreadTotal > 0 && <span className={styles.navDot} />}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarCapabilities}>
          <p className={styles.capTitle}>Capabilities</p>
          {["User & Role Management", "Content Management", "Subscription & Billing", "Reports & Analytics", "Safety & Compliance", "System Settings"].map((c) => (
            <p key={c} className={styles.capItem}>{c}</p>
          ))}
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* ── Overview ── */}
        {section === "overview" && (
          <>
            <div className={styles.pageHeader}>
              <div>
                <h1>Platform Overview</h1>
                <p>Manages entire Learningo platform — organizations, users, content & subscriptions.</p>
              </div>
            </div>
            <div className={styles.statsGrid}>
              <StatCard label="Total Organizations" value={stats.totalOrgs} icon={<FaBuilding />} color="#f7a825" />
              <StatCard label="Pending Approval" value={stats.pendingOrgs} icon={<FaClock />} color="#4f8ef7" />
              <StatCard label="Approved" value={stats.approvedOrgs} icon={<FaCheckCircle />} color="#2ecc71" />
              <StatCard label="Rejected" value={stats.rejectedOrgs} icon={<FaTimesCircle />} color="#e74c3c" />
            </div>

            {stats.pendingOrgs > 0 && (
              <div className={styles.pendingAlert}>
                <FaClock />
                <div>
                  <strong>{stats.pendingOrgs} organization{stats.pendingOrgs > 1 ? "s" : ""} awaiting your approval.</strong>
                  <p>Review and approve or reject them from the Organizations section.</p>
                </div>
                <button className={styles.reviewBtn} onClick={() => handleSection("organizations")}>
                  Review Now
                </button>
              </div>
            )}

            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <FaGlobe className={styles.infoIcon} />
                <h3>Platform Control</h3>
                <p>Approve or reject organizations, manage global permissions, and monitor platform-wide compliance.</p>
              </div>
              <div className={styles.infoCard}>
                <FaUsers className={styles.infoIcon} />
                <h3>User & Role Management</h3>
                <p>Open an approved organization to see its admin's identity, teachers, and students, and drill into each one's learning performance.</p>
              </div>
              <div className={styles.infoCard}>
                <FaChartBar className={styles.infoIcon} />
                <h3>Reports & Analytics</h3>
                <p>Platform-level reports including institution-level metrics, engagement, and performance data flow upward here.</p>
              </div>
            </div>
          </>
        )}

        {/* ── Organizations ── */}
        {section === "organizations" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Organizations</h1>
              <div className={styles.filterRow}>
                {["all", "pending", "approved", "rejected"].map((s) => (
                  <button
                    key={s}
                    className={`${styles.filterBtn} ${filterStatus === s ? styles.filterActive : ""}`}
                    onClick={() => handleFilterChange(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {orgs.length === 0 ? (
              <p className={styles.empty}>No organizations {filterStatus !== "all" ? `with status "${filterStatus}"` : ""} found.</p>
            ) : (
              <div className={styles.orgList}>
                {orgs.map((org) => (
                  <div key={org._id} className={styles.orgCard}>
                    <div className={styles.orgCardLeft}>
                      <FaBuilding className={styles.orgIcon} />
                      <div>
                        <h3 className={styles.orgName}>{org.name}</h3>
                        <p className={styles.orgMeta}>
                          {org.type?.replace("_", " ")} · {org.adminEmail}
                        </p>
                        {org.address && <p className={styles.orgAddr}>{org.address}</p>}
                        <p className={styles.orgDate}>
                          Registered: {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={styles.orgCardRight}>
                      <div className={styles.orgBadges}>
                        <StatusBadge status={org.status} />
                        <StatusBadge status={org.subscriptionPlan} />
                      </div>

                      <div className={styles.orgActions}>
                        {org.status !== "approved" && (
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApprove(org._id)}
                            disabled={actionLoading === org._id + "_approve"}
                          >
                            <FaThumbsUp /> {actionLoading === org._id + "_approve" ? "…" : "Approve"}
                          </button>
                        )}
                        {org.status !== "rejected" && (
                          <button
                            className={styles.rejectOrgBtn}
                            onClick={() => setRejectTarget(org._id)}
                          >
                            <FaThumbsDown /> Reject
                          </button>
                        )}
                      </div>

                      {org.status === "approved" && (
                        <>
                          <div className={styles.planRow}>
                            <label className={styles.planLabel}>Plan:</label>
                            <select
                              className={styles.planSelect}
                              value={org.subscriptionPlan}
                              onChange={(e) => handlePlanChange(org._id, e.target.value)}
                            >
                              {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                          <button className={styles.viewDetailBtn} onClick={() => setDetailOrg(org)}>
                            <FaChartLine /> View Admin / Teachers / Students
                          </button>
                        </>
                      )}

                      {org.status === "rejected" && org.rejectionReason && (
                        <p className={styles.rejectedReason}>Reason: {org.rejectionReason}</p>
                      )}

                      {org.rejectionHistory?.length > 0 && (
                        <details className={styles.rejectionHistory}>
                          <summary>Rejection history ({org.rejectionHistory.length})</summary>
                          {org.rejectionHistory.map((h, i) => (
                            <p key={i} className={styles.rejectedReason}>{new Date(h.rejectedAt).toLocaleString()}: {h.reason}</p>
                          ))}
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Question Upload Review ── */}
        {section === "question-uploads" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Question Review</h1>
              <div className={styles.filterRow}>
                {["all", "pending", "approved", "rejected"].map((s) => (
                  <button
                    key={s}
                    className={`${styles.filterBtn} ${uploadFilterStatus === s ? styles.filterActive : ""}`}
                    onClick={() => handleUploadFilterChange(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.statsGrid}>
              <StatCard label="Total Uploads" value={uploadStats.totalUploads} icon={<FaFileExcel />} color="#f7a825" />
              <StatCard label="Pending Review" value={uploadStats.pendingUploads} icon={<FaClock />} color="#4f8ef7" />
              <StatCard label="Approved" value={uploadStats.approvedUploads} icon={<FaCheckCircle />} color="#2ecc71" />
              <StatCard label="Rejected" value={uploadStats.rejectedUploads} icon={<FaTimesCircle />} color="#e74c3c" />
            </div>

            {uploadBatches.length === 0 ? (
              <p className={styles.empty}>No question uploads {uploadFilterStatus !== "all" ? `with status "${uploadFilterStatus}"` : ""} found.</p>
            ) : (
              <div className={styles.orgList}>
                {uploadBatches.map((b) => (
                  <div key={b._id} className={styles.orgCard}>
                    <div className={styles.orgCardLeft}>
                      <FaFileExcel className={styles.orgIcon} />
                      <div>
                        <h3 className={styles.orgName}>{b.originalFilename}</h3>
                        <p className={styles.orgMeta}>
                          {b.module} / {b.subject} · {b.submittedByName} ({b.submittedByEmail}) · {b.orgName}
                        </p>
                        <p className={styles.orgAddr}>
                          {b.rowCount} question{b.rowCount === 1 ? "" : "s"}{b.skippedRowCount ? `, ${b.skippedRowCount} skipped` : ""}
                        </p>
                        <p className={styles.orgDate}>Uploaded: {new Date(b.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={styles.orgCardRight}>
                      <div className={styles.orgBadges}>
                        <StatusBadge status={b.status} />
                      </div>

                      <div className={styles.orgActions}>
                        {b.status !== "approved" && (
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApproveUpload(b._id)}
                            disabled={actionLoading === b._id + "_approve"}
                          >
                            <FaThumbsUp /> {actionLoading === b._id + "_approve" ? "…" : "Approve"}
                          </button>
                        )}
                        {b.status !== "rejected" && (
                          <button className={styles.rejectOrgBtn} onClick={() => setRejectUploadTarget(b._id)}>
                            <FaThumbsDown /> Reject
                          </button>
                        )}
                      </div>

                      <button className={styles.viewDetailBtn} onClick={() => setDetailBatchId(b._id)}>
                        <FaChartLine /> View Questions
                      </button>

                      {b.status === "rejected" && b.rejectionReason && (
                        <p className={styles.rejectedReason}>Reason: {b.rejectionReason}</p>
                      )}

                      {b.rejectionHistory?.length > 0 && (
                        <details className={styles.rejectionHistory}>
                          <summary>Rejection history ({b.rejectionHistory.length})</summary>
                          {b.rejectionHistory.map((h, i) => (
                            <p key={i} className={styles.rejectedReason}>{new Date(h.rejectedAt).toLocaleString()}: {h.reason}</p>
                          ))}
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Admin Chat ── */}
        {section === "chat" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Admin Chat</h1>
              <p>Message org admins directly about their registration or organization.</p>
            </div>
            <ChatSection
              conversations={conversations}
              activeConvo={activeConvo}
              messages={convoMessages}
              draft={convoDraft}
              onOpen={openConversation}
              onDraftChange={setConvoDraft}
              onSend={handleSendConvo}
              sending={convoSending}
            />
          </>
        )}

        {/* ── Contact Messages ── */}
        {section === "contact" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Contact Messages</h1>
              <div className={styles.filterRow}>
                {["all", "open", "in_progress", "resolved"].map((s) => (
                  <button
                    key={s}
                    className={`${styles.filterBtn} ${messageFilter === s ? styles.filterActive : ""}`}
                    onClick={() => handleMessageFilterChange(s)}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {messages.length === 0 ? (
              <p className={styles.empty}>No messages {messageFilter !== "all" ? `with status "${messageFilter}"` : ""} found.</p>
            ) : (
              <div className={styles.orgList}>
                {messages.map((m) => (
                  <div key={m._id} className={styles.messageCard}>
                    <div className={styles.messageHeader}>
                      <div>
                        <strong>{m.subject}</strong>
                        <p className={styles.orgMeta}>{m.name} ({m.role}) · {m.email}{m.orgName ? ` · ${m.orgName}` : ""}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className={styles.messageBody}>{m.message}</p>
                    {m.attachmentUrl && (
                      <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className={styles.attachmentLink}>View attachment</a>
                    )}
                    {m.reply && <p className={styles.replyText}><strong>Reply:</strong> {m.reply}</p>}
                    {m.status !== "resolved" && (
                      <div className={styles.replyRow}>
                        <textarea
                          className={styles.modalTextarea}
                          rows={2}
                          placeholder="Write a reply…"
                          value={replyDrafts[m._id] || ""}
                          onChange={(e) => setReplyDrafts((d) => ({ ...d, [m._id]: e.target.value }))}
                        />
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleReply(m._id)}
                          disabled={actionLoading === m._id + "_reply"}
                        >
                          {actionLoading === m._id + "_reply" ? "…" : "Reply & Resolve"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Reports ── */}
        {section === "reports" && (
          <>
            <div className={styles.pageHeader}><h1>Reports & Analytics</h1></div>
            <div className={styles.statsGrid}>
              <StatCard label="Total Organizations" value={stats.totalOrgs} icon={<FaBuilding />} color="#f7a825" />
              <StatCard label="Pending" value={stats.pendingOrgs} icon={<FaClock />} color="#4f8ef7" />
              <StatCard label="Approved" value={stats.approvedOrgs} icon={<FaCheckCircle />} color="#2ecc71" />
              <StatCard label="Rejected" value={stats.rejectedOrgs} icon={<FaTimesCircle />} color="#e74c3c" />
            </div>
            <div className={styles.reportCards}>
              <div className={styles.reportCard}>
                <h3>Platform Approval Rate</h3>
                <p className={styles.bigNum}>
                  {stats.totalOrgs > 0
                    ? Math.round((stats.approvedOrgs / stats.totalOrgs) * 100)
                    : 0}%
                </p>
                <p className={styles.reportDesc}>of registered organizations have been approved.</p>
              </div>
              <div className={styles.reportCard}>
                <h3>Pending Queue</h3>
                <p className={styles.bigNum}>{stats.pendingOrgs}</p>
                <p className={styles.reportDesc}>organizations awaiting review.</p>
              </div>
            </div>
            <div className={styles.reportNote}>
              <FaChalkboardTeacher /> Open an approved organization from the Organizations tab to view teacher and student performance data.
            </div>
          </>
        )}

        {/* ── Settings ── */}
        {section === "settings" && (
          <>
            <div className={styles.pageHeader}>
              <h1>System Settings</h1>
              <button className={styles.addSettingBtn} onClick={() => { setSettingError(""); setSettingModal(true); }}>
                + Add Setting
              </button>
            </div>
            {settings.length === 0 ? (
              <p className={styles.empty}>No global settings configured yet. Add your first setting.</p>
            ) : (
              <div className={styles.settingsTable}>
                <div className={styles.settingsHeader}>
                  <span>Key</span><span>Value</span><span>Description</span>
                </div>
                {settings.map((s) => (
                  <div key={s._id} className={styles.settingRow}>
                    <span className={styles.settingKey}>{s.key}</span>
                    <span className={styles.settingValue}>{String(s.value)}</span>
                    <span className={styles.settingDesc}>{s.description || "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
          loading={actionLoading === "reject"}
        />
      )}

      {/* Setting modal */}
      {settingModal && (
        <SettingModal
          onSave={handleSaveSetting}
          onClose={() => setSettingModal(false)}
          loading={actionLoading === "setting"}
          serverError={settingError}
        />
      )}

      {/* Org detail drawer */}
      {detailOrg && (
        <OrgDetailModal org={detailOrg} get={get} token={token} onClose={() => setDetailOrg(null)} />
      )}

      {/* Reject question upload modal */}
      {rejectUploadTarget && (
        <RejectModal
          title="Reject Question Upload"
          onConfirm={handleRejectUploadConfirm}
          onClose={() => setRejectUploadTarget(null)}
          loading={actionLoading === "reject-upload"}
        />
      )}

      {/* Question upload batch detail (parsed rows) */}
      {detailBatchId && (
        <UploadBatchDetailModal batchId={detailBatchId} get={get} onClose={() => setDetailBatchId(null)} />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
