import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdminPanelSettings, MdDashboard, MdPeople, MdGroups,
  MdSchool, MdFamilyRestroom, MdBarChart, MdLogout, MdAdd,
  MdDelete, MdBusiness, MdClose, MdCheckCircle, MdPending,
} from "react-icons/md";
import { useAdminAuth } from "../../context/AdminAuthContext";
import styles from "./AdminDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const NAV = [
  { key: "overview", label: "Overview", icon: <MdDashboard /> },
  { key: "org", label: "Organization", icon: <MdBusiness /> },
  { key: "tutors", label: "Tutors", icon: <MdPeople /> },
  { key: "batches", label: "Batches", icon: <MdGroups /> },
  { key: "students", label: "Students", icon: <MdSchool /> },
  { key: "parents", label: "Parents", icon: <MdFamilyRestroom /> },
  { key: "reports", label: "Reports", icon: <MdBarChart /> },
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

  const del = useCallback(async (path) => {
    const r = await fetch(`${API}/api/admin${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  }, [token]);

  return { get, post, del };
}

// ── Mini modal ────────────────────────────────────────────────────────────────
function Modal({ title, fields, onSubmit, onClose, loading }) {
  const [form, setForm] = useState({});
  const handleChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {fields.map((f) => (
            <div key={f.key} className={styles.modalField}>
              <label>{f.label}</label>
              <input
                type={f.type || "text"}
                placeholder={f.placeholder || f.label}
                required={f.required}
                value={form[f.key] || ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
            </div>
          ))}
          <button type="submit" className={styles.modalSubmit} disabled={loading}>
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
function DataTable({ columns, rows, onDelete, emptyMsg }) {
  if (!rows.length) return <p className={styles.empty}>{emptyMsg}</p>;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}
            {onDelete && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row) : row[c.key] || "—"}</td>)}
              {onDelete && (
                <td>
                  <button className={styles.deleteBtn} onClick={() => onDelete(row._id)}>
                    <MdDelete />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { adminUser, adminLogout, getAdminToken } = useAdminAuth();
  const navigate = useNavigate();
  const token = getAdminToken();
  const { get, post, del } = useAdminApi(token);

  const [section, setSection] = useState("overview");
  const [stats, setStats] = useState({ tutors: 0, students: 0, batches: 0, parents: 0, org: null });
  const [org, setOrg] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminUser && adminUser !== undefined) navigate("/admin-login");
  }, [adminUser, navigate]);

  const loadStats = useCallback(async () => {
    const data = await get("/stats");
    if (data.success) { setStats(data.stats); setOrg(data.stats.org); }
  }, [get]);

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, [loadStats]);

  const loadSection = useCallback(async (sec) => {
    setSection(sec);
    if (sec === "tutors") {
      const d = await get("/tutors"); if (d.success) setTutors(d.tutors);
    } else if (sec === "batches") {
      const d = await get("/batches"); if (d.success) setBatches(d.batches);
    } else if (sec === "students") {
      const d = await get("/students"); if (d.success) setStudents(d.students);
    } else if (sec === "parents") {
      const d = await get("/parents"); if (d.success) setParents(d.parents);
    } else if (sec === "org") {
      const d = await get("/org"); if (d.success) setOrg(d.org);
    }
  }, [get]);

  const handleLogout = () => { adminLogout(); navigate("/"); };

  const openModal = (config) => setModal(config);
  const closeModal = () => setModal(null);

  const handleModalSubmit = async (form) => {
    setModalLoading(true);
    try {
      const data = await post(modal.endpoint, form);
      if (!data.success) { alert(data.message); return; }
      closeModal();
      loadStats();
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

  if (loading || adminUser === undefined) {
    return <div className={styles.splash}><MdAdminPanelSettings className={styles.splashIcon} /><p>Loading…</p></div>;
  }

  const orgStatusBadge = (status) => {
    const map = { approved: styles.badgeGreen, pending: styles.badgeYellow, rejected: styles.badgeRed };
    return <span className={`${styles.badge} ${map[status] || styles.badgeYellow}`}>{status}</span>;
  };

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
        </div>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`${styles.navItem} ${section === n.key ? styles.navActive : ""}`}
              onClick={() => loadSection(n.key)}
            >
              {n.icon} <span>{n.label}</span>
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
            <MdClose /> Your organization was rejected. Reason: {org.rejectionReason || "No reason given."}
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
                <p>This will create your org and send it for Super Admin approval.</p>
                <button className={styles.primaryBtn} onClick={() => openModal({
                  title: "Register Organization",
                  endpoint: "/org",
                  fields: [
                    { key: "name", label: "Organization Name", required: true },
                    { key: "type", label: "Type (school / coaching_centre / institution / other)" },
                    { key: "address", label: "Address" },
                    { key: "phone", label: "Phone" },
                  ],
                })}>
                  <MdAdd /> Register Now
                </button>
              </div>
            ) : (
              <div className={styles.orgCard}>
                <div className={styles.orgCardRow}><span>Name</span><strong>{org.name}</strong></div>
                <div className={styles.orgCardRow}><span>Type</span><strong>{org.type?.replace("_", " ")}</strong></div>
                <div className={styles.orgCardRow}><span>Address</span><strong>{org.address || "—"}</strong></div>
                <div className={styles.orgCardRow}><span>Phone</span><strong>{org.phone || "—"}</strong></div>
                <div className={styles.orgCardRow}><span>Status</span><strong>{orgStatusBadge(org.status)}</strong></div>
                {org.status === "approved" && (
                  <div className={styles.approvedMsg}><MdCheckCircle /> Approved — you can now manage your team.</div>
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
                  { key: "name", label: "Full Name", required: true },
                  { key: "email", label: "Email", type: "email", required: true },
                  { key: "phone", label: "Phone" },
                  { key: "subject", label: "Subject" },
                ],
              })}>
                <MdAdd /> Add Tutor
              </button>
            </div>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "subject", label: "Subject" },
                { key: "phone", label: "Phone" },
                { key: "status", label: "Status" },
              ]}
              rows={tutors}
              onDelete={(id) => handleDelete("/tutors", id)}
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
                  { key: "name", label: "Batch Name", required: true },
                  { key: "subject", label: "Subject" },
                  { key: "description", label: "Description" },
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
              onDelete={(id) => handleDelete("/batches", id)}
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
                  { key: "name", label: "Full Name", required: true },
                  { key: "email", label: "Email", type: "email" },
                  { key: "age", label: "Age", type: "number" },
                  { key: "grade", label: "Grade / Class" },
                ],
              })}>
                <MdAdd /> Add Student
              </button>
            </div>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "grade", label: "Grade" },
                { key: "age", label: "Age" },
                { key: "status", label: "Status" },
              ]}
              rows={students}
              onDelete={(id) => handleDelete("/students", id)}
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
                  { key: "name", label: "Full Name", required: true },
                  { key: "email", label: "Email", type: "email", required: true },
                  { key: "phone", label: "Phone" },
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
              <MdBarChart /> Detailed per-student and per-batch analytics will appear here once students start completing lessons and quizzes.
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <Modal
          title={modal.title}
          fields={modal.fields}
          onSubmit={handleModalSubmit}
          onClose={closeModal}
          loading={modalLoading}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
