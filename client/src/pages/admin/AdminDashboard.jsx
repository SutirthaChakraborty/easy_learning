import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdminPanelSettings, MdDashboard, MdPeople, MdGroups,
  MdSchool, MdFamilyRestroom, MdBarChart, MdLogout, MdAdd,
  MdDelete, MdBusiness, MdClose, MdCheckCircle, MdPending,
  MdSearch, MdInsights, MdEdit, MdSupportAgent,
} from "react-icons/md";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { DESIGNATION_OPTIONS, ORG_TYPE_OPTIONS, designationLabel } from "../../utils/designations";
import StudentDashboardViewer from "../../components/StudentDashboardViewer/StudentDashboardViewer";
import styles from "./AdminDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,15}$/;

const NAV = [
  { key: "overview", label: "Overview", icon: <MdDashboard /> },
  { key: "org", label: "Organization", icon: <MdBusiness /> },
  { key: "tutors", label: "Tutors", icon: <MdPeople /> },
  { key: "batches", label: "Batches", icon: <MdGroups /> },
  { key: "students", label: "Students", icon: <MdSchool /> },
  { key: "parents", label: "Parents", icon: <MdFamilyRestroom /> },
  { key: "reports", label: "Reports", icon: <MdBarChart /> },
  { key: "chat", label: "Messages", icon: <MdSupportAgent /> },
];

function useAdminApi(token) {
  const get = useCallback(async (path) => {
    const r = await fetch(`${API}/api/admin${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
  }, [token]);

  const post = useCallback(async (path, body) => {
    const r = await fetch(`${API}/api/admin${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }, [token]);

  const postForm = useCallback(async (path, formData, method = "POST") => {
    const r = await fetch(`${API}/api/admin${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return r.json();
  }, [token]);

  const del = useCallback(async (path) => {
    const r = await fetch(`${API}/api/admin${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  }, [token]);

  return { get, post, postForm, del };
}

// ── Field-level validation ──────────────────────────────────────────────────
function validateField(f, value, form) {
  const isVisible = !f.showIf || f.showIf(form);
  if (!isVisible) return null;

  const strVal = typeof value === "string" ? value.trim() : value;
  const isEmpty = value === undefined || value === null || strVal === "" || (f.type === "file" && !value);

  if (f.required && isEmpty) return `${f.label} is required`;
  if (isEmpty) return null;

  if (f.type === "email" && !EMAIL_RE.test(strVal)) return "Enter a valid email address";
  if (f.type === "tel" && !PHONE_RE.test(strVal)) return "Enter a valid phone number";
  if (f.type === "number") {
    const n = Number(strVal);
    if (Number.isNaN(n)) return `${f.label} must be a number`;
    if (f.min !== undefined && n < f.min) return `${f.label} must be at least ${f.min}`;
    if (f.max !== undefined && n > f.max) return `${f.label} must be at most ${f.max}`;
  }
  if (f.minLength && strVal.length < f.minLength) return `${f.label} must be at least ${f.minLength} characters`;
  if (f.maxLength && strVal.length > f.maxLength) return `${f.label} must be at most ${f.maxLength} characters`;
  return null;
}

function validateForm(fields, form) {
  const errors = {};
  fields.forEach((f) => {
    const err = validateField(f, form[f.key], form);
    if (err) errors[f.key] = err;
  });
  return errors;
}

// ── Mini modal (config-driven form) ─────────────────────────────────────────
function Modal({ title, fields, onSubmit, onClose, loading, serverError, initial }) {
  const [form, setForm] = useState(initial || {});
  const [touched, setTouched] = useState({});
  const errors = validateForm(fields, form);

  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleBlur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(fields.map((f) => [f.key, true])));
    if (Object.keys(errors).length > 0) return;
    onSubmit(form);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {fields.map((f) => {
            if (f.showIf && !f.showIf(form)) return null;
            const showError = touched[f.key] && errors[f.key];
            return (
              <div key={f.key} className={styles.modalField}>
                <label>{f.label}{f.required && " *"}</label>
                {f.type === "select" ? (
                  <select
                    value={form[f.key] ?? ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    onBlur={() => handleBlur(f.key)}
                  >
                    <option value="" disabled>{f.placeholder || "Select…"}</option>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "file" ? (
                  <input
                    type="file"
                    accept={f.accept || "image/*"}
                    onChange={(e) => handleChange(f.key, e.target.files?.[0] || null)}
                    onBlur={() => handleBlur(f.key)}
                  />
                ) : (
                  <input
                    type={f.type === "tel" ? "text" : (f.type || "text")}
                    placeholder={f.placeholder || f.label}
                    value={form[f.key] || ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    onBlur={() => handleBlur(f.key)}
                  />
                )}
                {showError && <span className={styles.fieldError}>{errors[f.key]}</span>}
              </div>
            );
          })}
          {serverError && <p className={styles.serverError}>{serverError}</p>}
          <button type="submit" className={styles.modalSubmit} disabled={loading || (Object.keys(touched).length > 0 && hasErrors)}>
            {loading ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className={styles.statCard} style={{ borderColor: color }}>
      <div className={styles.statIcon} style={{ color }}>{icon}</div>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

// ── Data table ────────────────────────────────────────────────────────────────
function DataTable({ columns, rows, actions, emptyMsg }) {
  if (!rows.length) return <p className={styles.empty}>{emptyMsg}</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key] || "—"}</td>)}
              {actions && (
                <td>
                  <div className={styles.rowActions}>
                    {actions.map((a, i) => (
                      <button key={i} className={a.variant === "delete" ? styles.deleteBtn : styles.viewBtn} title={a.title} onClick={() => a.onClick(row)}>
                        {a.icon}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className={styles.searchBar}>
      <MdSearch />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

// ── Performance modal ─────────────────────────────────────────────────────────
function PerformanceModal({ data, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Performance — {data.name}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>

        {data.type === "student" ? (
          data.performance.linked ? (
            <div className={styles.perfGrid}>
              <div className={styles.perfStat}><span>{data.performance.totalXP}</span><label>Total XP</label></div>
              <div className={styles.perfStat}><span>{data.performance.totalSessions}</span><label>Sessions</label></div>
              <div className={styles.perfStat}><span>{data.performance.totalMinutes}</span><label>Minutes</label></div>
              <div className={styles.perfStat}><span>{data.performance.averageScore}%</span><label>Avg Score</label></div>
              <div className={styles.perfStat}><span>{data.performance.achievementCount}</span><label>Achievements</label></div>
            </div>
          ) : (
            <p className={styles.empty}>No learning activity recorded yet for this student's linked email.</p>
          )
        ) : (
          data.students.length === 0 ? (
            <p className={styles.empty}>This tutor has no students assigned yet.</p>
          ) : (
            <div className={styles.tutorPerfList}>
              {data.students.map((s) => (
                <div key={s.studentId} className={styles.tutorPerfRow}>
                  <strong>{s.name}</strong>
                  {s.performance.linked ? (
                    <span>{s.performance.totalXP} XP · {s.performance.totalSessions} sessions · {s.performance.averageScore}% avg</span>
                  ) : (
                    <span className={styles.mutedText}>No activity yet</span>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Chat panel ──────────────────────────────────────────────────────────────
function ChatPanel({ messages, draft, onDraftChange, onSend, sending }) {
  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatMessages}>
        {messages.length === 0 ? (
          <p className={styles.empty}>No messages yet. Start the conversation with the Super Admin.</p>
        ) : (
          messages.map((m) => (
            <div key={m._id} className={`${styles.chatBubble} ${m.senderRole === "admin" ? styles.chatBubbleMine : styles.chatBubbleTheirs}`}>
              <p>{m.message}</p>
              <span className={styles.chatTime}>{new Date(m.createdAt).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
      <div className={styles.chatInputRow}>
        <textarea
          rows={2}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Message the Super Admin…"
        />
        <button className={styles.primaryBtn} onClick={onSend} disabled={sending || !draft.trim()}>
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { adminUser, adminLogout, getAdminToken } = useAdminAuth();
  const navigate = useNavigate();
  const token = getAdminToken();
  const { get, post, postForm, del } = useAdminApi(token);

  const [section, setSection] = useState("overview");
  const [stats, setStats] = useState({ tutors: 0, students: 0, batches: 0, parents: 0, org: null });
  const [org, setOrg] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [tutorSearch, setTutorSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [perfModal, setPerfModal] = useState(null);
  const [dashboardViewerStudent, setDashboardViewerStudent] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatUnread, setChatUnread] = useState(0);
  const [chatSending, setChatSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminUser && adminUser !== undefined) navigate("/admin-login");
  }, [adminUser, navigate]);

  const loadStats = useCallback(async () => {
    const data = await get("/stats");
    if (data.success) { setStats(data.stats); setOrg(data.stats.org); }
  }, [get]);

  const loadProfile = useCallback(async () => {
    const data = await get("/profile");
    if (data.success) setProfile(data.admin);
  }, [get]);

  useEffect(() => {
    Promise.all([loadStats(), loadProfile()]).finally(() => setLoading(false));
  }, [loadStats, loadProfile]);

  const pollChatUnread = useCallback(async () => {
    const d = await get("/chat/unread-count");
    if (d.success) setChatUnread(d.count);
  }, [get]);

  useEffect(() => {
    pollChatUnread();
    const iv = setInterval(pollChatUnread, 25000);
    return () => clearInterval(iv);
  }, [pollChatUnread]);

  const loadTutors = useCallback(async (search) => {
    const d = await get(`/tutors${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    if (d.success) setTutors(d.tutors);
  }, [get]);

  const loadStudents = useCallback(async (search) => {
    const d = await get(`/students${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    if (d.success) setStudents(d.students);
  }, [get]);

  const loadChat = useCallback(async () => {
    const d = await get("/chat");
    if (d.success) { setChatMessages(d.messages); setChatUnread(0); }
  }, [get]);

  const loadSection = useCallback(async (sec) => {
    setSection(sec);
    if (sec === "tutors") loadTutors(tutorSearch);
    else if (sec === "batches") {
      const d = await get("/batches"); if (d.success) setBatches(d.batches);
    } else if (sec === "students") loadStudents(studentSearch);
    else if (sec === "parents") {
      const d = await get("/parents"); if (d.success) setParents(d.parents);
    } else if (sec === "org") {
      const d = await get("/org"); if (d.success) setOrg(d.org);
    } else if (sec === "chat") loadChat();
  }, [get, loadTutors, loadStudents, loadChat, tutorSearch, studentSearch]);

  const handleSendChat = async () => {
    if (!chatDraft.trim()) return;
    setChatSending(true);
    const d = await post("/chat", { message: chatDraft.trim() });
    setChatSending(false);
    if (d.success) { setChatDraft(""); loadChat(); }
  };

  const handleLogout = () => { adminLogout(); navigate("/"); };

  const openModal = (config) => { setModal(config); setModalError(""); };
  const closeModal = () => setModal(null);

  const submitViaForm = (endpoint, form, fields) => {
    const formData = new FormData();
    fields.forEach((f) => {
      const v = form[f.key];
      if (v !== undefined && v !== null && v !== "") formData.append(f.key, v);
    });
    return postForm(endpoint, formData, modal.method || "POST");
  };

  const handleModalSubmit = async (form) => {
    setModalLoading(true);
    setModalError("");
    try {
      const hasFile = modal.fields.some((f) => f.type === "file");
      const data = hasFile
        ? await submitViaForm(modal.endpoint, form, modal.fields)
        : await post(modal.endpoint, form);

      if (!data.success) { setModalError(data.message || "Something went wrong"); return; }
      closeModal();
      loadStats();
      loadProfile();
      loadSection(section);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (path, id) => {
    if (!confirm("Delete this record?")) return;
    await del(`${path}/${id}`);
    loadStats();
    loadSection(section);
  };

  const openStudentPerformance = async (student) => {
    const d = await get(`/students/${student._id}/performance`);
    if (!d.success) return;
    if (d.performance.linked) {
      setDashboardViewerStudent({ id: student._id, name: student.name });
    } else {
      setPerfModal({ type: "student", name: student.name, performance: d.performance });
    }
  };

  const openTutorPerformance = async (tutor) => {
    const d = await get(`/tutors/${tutor._id}/performance`);
    if (d.success) setPerfModal({ type: "tutor", name: tutor.name, students: d.students });
  };

  if (loading || adminUser === undefined) {
    return <div className={styles.splash}><MdAdminPanelSettings className={styles.splashIcon} /><p>Loading…</p></div>;
  }

  const orgStatusBadge = (status) => {
    const map = { approved: styles.badgeGreen, pending: styles.badgeYellow, rejected: styles.badgeRed };
    return <span className={`${styles.badge} ${map[status] || styles.badgeYellow}`}>{status}</span>;
  };

  const orgRegistrationFields = [
    { key: "name", label: "Organization Name", required: true, minLength: 2, maxLength: 100 },
    { key: "type", label: "Type", type: "select", required: true, options: ORG_TYPE_OPTIONS },
    { key: "address", label: "Address", maxLength: 200 },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "designation", label: "Your Designation (Principal / Father / Mother / etc.)", type: "select", required: true, options: DESIGNATION_OPTIONS },
    { key: "designationOther", label: "Please specify", required: true, showIf: (f) => f.designation === "other", maxLength: 50 },
    { key: "logo", label: "Organization Logo (optional)", type: "file", accept: "image/*" },
  ];

  const profileFields = [
    { key: "designation", label: "Your Designation", type: "select", required: true, options: DESIGNATION_OPTIONS },
    { key: "designationOther", label: "Please specify", required: true, showIf: (f) => f.designation === "other", maxLength: 50 },
    { key: "phone", label: "Phone", type: "tel" },
    { key: "avatar", label: "Profile Photo (optional)", type: "file", accept: "image/*" },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <MdAdminPanelSettings className={styles.sidebarLogo} />
          <span>Admin Panel</span>
        </div>
        <div className={styles.adminInfo}>
          {adminUser?.name && <p className={styles.adminName}>{adminUser.name}</p>}
          <p className={styles.adminEmail}>{adminUser?.email}</p>
          {profile?.designation && <p className={styles.adminDesignation}>{designationLabel(profile)}</p>}
          <button
            className={styles.editProfileBtn}
            onClick={() => openModal({
              title: "Edit Your Profile",
              endpoint: "/profile",
              method: "PATCH",
              fields: profileFields,
              initial: { designation: profile?.designation || "", designationOther: profile?.designationOther || "", phone: profile?.phone || "" },
            })}
          >
            <MdEdit /> Edit Profile
          </button>
        </div>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`${styles.navItem} ${section === n.key ? styles.navActive : ""}`}
              onClick={() => loadSection(n.key)}
            >
              {n.icon} <span>{n.label}</span>
              {n.key === "chat" && chatUnread > 0 && <span className={styles.navDot} />}
            </button>
          ))}
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <MdLogout /> <span>Logout</span>
        </button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Org approval banner */}
        {org && org.status === "pending" && (
          <div className={styles.banner}>
            <MdPending /> Your organization is pending approval by the Super Admin.
          </div>
        )}
        {org && org.status === "rejected" && (
          <div className={`${styles.banner} ${styles.bannerRed}`}>
            <MdClose /> Your organization was rejected. Reason: {org.rejectionReason || "No reason given."} You can update your details and resubmit for review.
          </div>
        )}

        {/* ── Overview ── */}
        {section === "overview" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Overview</h1>
              <p>Welcome back, {adminUser?.name || adminUser?.email}</p>
            </div>
            <div className={styles.statsGrid}>
              <StatCard label="Tutors" value={stats.tutors} icon={<MdPeople />} color="#a259f7" />
              <StatCard label="Batches" value={stats.batches} icon={<MdGroups />} color="#4f8ef7" />
              <StatCard label="Students" value={stats.students} icon={<MdSchool />} color="#2ecc71" />
              <StatCard label="Parents" value={stats.parents} icon={<MdFamilyRestroom />} color="#f7a825" />
            </div>
            {!org && (
              <div className={styles.setupCard}>
                <h2>Set Up Your Organization</h2>
                <p>Register your school or coaching centre to start managing tutors, batches, and students.</p>
                <button className={styles.primaryBtn} onClick={() => loadSection("org")}>
                  Register Organization
                </button>
              </div>
            )}
            {org && (
              <div className={styles.orgSummary}>
                {org.logoUrl && <img src={org.logoUrl} alt="" className={styles.orgLogo} />}
                <h3>{org.name}</h3>
                <p>{org.type?.replace("_", " ")} · {orgStatusBadge(org.status)}</p>
              </div>
            )}
          </>
        )}

        {/* ── Organization ── */}
        {section === "org" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Organization</h1>
            </div>
            {!org ? (
              <div className={styles.setupCard}>
                <h2>Register Your Organization</h2>
                <p>This will create your org and send it for Super Admin approval. Please also declare your identity (e.g. Principal, Father, Mother).</p>
                <button className={styles.primaryBtn} onClick={() => openModal({
                  title: "Register Organization",
                  endpoint: "/org",
                  fields: orgRegistrationFields,
                })}>
                  <MdAdd /> Register Now
                </button>
              </div>
            ) : (
              <div className={styles.orgCard}>
                {org.logoUrl && <img src={org.logoUrl} alt="" className={styles.orgLogo} />}
                <div className={styles.orgCardRow}><span>Name</span><strong>{org.name}</strong></div>
                <div className={styles.orgCardRow}><span>Type</span><strong>{org.type?.replace("_", " ")}</strong></div>
                <div className={styles.orgCardRow}><span>Address</span><strong>{org.address || "—"}</strong></div>
                <div className={styles.orgCardRow}><span>Phone</span><strong>{org.phone || "—"}</strong></div>
                <div className={styles.orgCardRow}><span>Status</span><strong>{orgStatusBadge(org.status)}</strong></div>
                {profile?.designation && (
                  <div className={styles.orgCardRow}><span>Declared By</span><strong>{designationLabel(profile)}</strong></div>
                )}
                {org.status === "approved" && (
                  <div className={styles.approvedMsg}><MdCheckCircle /> Approved — you can now manage your team.</div>
                )}
                {org.status === "rejected" && (
                  <button className={styles.primaryBtn} onClick={() => openModal({
                    title: "Resubmit Organization",
                    endpoint: "/org",
                    fields: orgRegistrationFields,
                    initial: {
                      name: org.name, type: org.type, address: org.address, phone: org.phone,
                      designation: profile?.designation || "", designationOther: profile?.designationOther || "",
                    },
                  })}>
                    <MdEdit /> Resubmit Registration
                  </button>
                )}
                {org.rejectionHistory?.length > 0 && (
                  <div className={styles.rejectionHistory}>
                    <h4>Past Rejections</h4>
                    {org.rejectionHistory.map((h, i) => (
                      <p key={i}>{new Date(h.rejectedAt).toLocaleDateString()}: {h.reason}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Tutors ── */}
        {section === "tutors" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Tutors / Teachers</h1>
              <button className={styles.primaryBtn} onClick={() => openModal({
                title: "Add Tutor",
                endpoint: "/tutors",
                fields: [
                  { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
                  { key: "email", label: "Email", type: "email", required: true },
                  { key: "phone", label: "Phone", type: "tel" },
                  { key: "subject", label: "Subject", maxLength: 50 },
                ],
              })}>
                <MdAdd /> Add Tutor
              </button>
            </div>
            <SearchBar value={tutorSearch} onChange={(v) => { setTutorSearch(v); loadTutors(v); }} placeholder="Search tutors by name…" />
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "subject", label: "Subject" },
                { key: "phone", label: "Phone" },
                { key: "status", label: "Status" },
              ]}
              rows={tutors}
              actions={[
                { icon: <MdInsights />, title: "View Performance", onClick: openTutorPerformance },
                { icon: <MdDelete />, title: "Delete", variant: "delete", onClick: (row) => handleDelete("/tutors", row._id) },
              ]}
              emptyMsg="No tutors yet. Add your first tutor."
            />
          </>
        )}

        {/* ── Batches ── */}
        {section === "batches" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Batches / Classes</h1>
              <button className={styles.primaryBtn} onClick={() => openModal({
                title: "Create Batch",
                endpoint: "/batches",
                fields: [
                  { key: "name", label: "Batch Name", required: true, minLength: 2, maxLength: 100 },
                  { key: "subject", label: "Subject", maxLength: 50 },
                  { key: "description", label: "Description", maxLength: 300 },
                ],
              })}>
                <MdAdd /> Create Batch
              </button>
            </div>
            <DataTable
              columns={[
                { key: "name", label: "Batch Name" },
                { key: "subject", label: "Subject" },
                { key: "tutorIds", label: "Tutors", render: (r) => r.tutorIds?.length || 0 },
                { key: "studentIds", label: "Students", render: (r) => r.studentIds?.length || 0 },
                { key: "status", label: "Status" },
              ]}
              rows={batches}
              actions={[{ icon: <MdDelete />, title: "Delete", variant: "delete", onClick: (row) => handleDelete("/batches", row._id) }]}
              emptyMsg="No batches yet. Create your first batch."
            />
          </>
        )}

        {/* ── Students ── */}
        {section === "students" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Students</h1>
              <button className={styles.primaryBtn} onClick={() => openModal({
                title: "Add Student",
                endpoint: "/students",
                fields: [
                  { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
                  { key: "email", label: "Email", type: "email" },
                  { key: "age", label: "Age", type: "number", min: 3, max: 25 },
                  { key: "grade", label: "Grade / Class", maxLength: 20 },
                ],
              })}>
                <MdAdd /> Add Student
              </button>
            </div>
            <SearchBar value={studentSearch} onChange={(v) => { setStudentSearch(v); loadStudents(v); }} placeholder="Search students by name…" />
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "grade", label: "Grade" },
                { key: "age", label: "Age" },
                { key: "status", label: "Status" },
              ]}
              rows={students}
              actions={[
                { icon: <MdInsights />, title: "View Performance", onClick: openStudentPerformance },
                { icon: <MdDelete />, title: "Delete", variant: "delete", onClick: (row) => handleDelete("/students", row._id) },
              ]}
              emptyMsg="No students yet. Add your first student."
            />
          </>
        )}

        {/* ── Parents ── */}
        {section === "parents" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Parents / Guardians</h1>
              <button className={styles.primaryBtn} onClick={() => openModal({
                title: "Add Parent",
                endpoint: "/parents",
                fields: [
                  { key: "name", label: "Full Name", required: true, minLength: 2, maxLength: 100 },
                  { key: "email", label: "Email", type: "email", required: true },
                  { key: "phone", label: "Phone", type: "tel" },
                ],
              })}>
                <MdAdd /> Add Parent
              </button>
            </div>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                { key: "studentIds", label: "Children", render: (r) => r.studentIds?.length || 0 },
                { key: "consentGiven", label: "Consent", render: (r) => r.consentGiven ? "Yes" : "No" },
              ]}
              rows={parents}
              emptyMsg="No parents linked yet."
            />
          </>
        )}

        {/* ── Reports ── */}
        {section === "reports" && (
          <>
            <div className={styles.pageHeader}><h1>Reports & Analytics</h1></div>
            <div className={styles.statsGrid}>
              <StatCard label="Total Tutors" value={stats.tutors} icon={<MdPeople />} color="#a259f7" />
              <StatCard label="Total Batches" value={stats.batches} icon={<MdGroups />} color="#4f8ef7" />
              <StatCard label="Total Students" value={stats.students} icon={<MdSchool />} color="#2ecc71" />
              <StatCard label="Total Parents" value={stats.parents} icon={<MdFamilyRestroom />} color="#f7a825" />
            </div>
            <div className={styles.reportNote}>
              <MdBarChart /> Use the Tutors or Students section, search by name, then click the performance icon to view detailed learning stats.
            </div>
          </>
        )}

        {/* ── Messages (chat with Super Admin) ── */}
        {section === "chat" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Messages</h1>
              <p>Chat directly with the Super Admin about your organization or registration.</p>
            </div>
            <ChatPanel
              messages={chatMessages}
              draft={chatDraft}
              onDraftChange={setChatDraft}
              onSend={handleSendChat}
              sending={chatSending}
            />
          </>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <Modal
          title={modal.title}
          fields={modal.fields}
          initial={modal.initial}
          onSubmit={handleModalSubmit}
          onClose={closeModal}
          loading={modalLoading}
          serverError={modalError}
        />
      )}

      {/* Performance modal */}
      {perfModal && <PerformanceModal data={perfModal} onClose={() => setPerfModal(null)} />}

      {dashboardViewerStudent && (
        <StudentDashboardViewer
          apiBase={`${API}/api/admin/students/${dashboardViewerStudent.id}/dashboard`}
          token={token}
          displayName={dashboardViewerStudent.name}
          onClose={() => setDashboardViewerStudent(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
