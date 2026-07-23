import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaChalkboardTeacher } from "react-icons/fa";
import { MdLogout, MdGroups, MdVisibility, MdUploadFile, MdMenu, MdClose } from "react-icons/md";
import { useAdminAuth } from "../../context/AdminAuthContext";
import DataTable from "../../components/Admin/DataTable";
import TeacherBatchDetail from "./TeacherBatchDetail";
import TeacherQuestionUpload from "./TeacherQuestionUpload";
import styles from "../admin/AdminDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const NAV = [
  { key: "batches", label: "My Batches", icon: <MdGroups /> },
  { key: "questions", label: "Upload Questions", icon: <MdUploadFile /> },
];

function useTeacherApi(token) {
  const get = useCallback(async (path) => {
    const r = await fetch(`${API}/api/teacher${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
  }, [token]);

  const post = useCallback(async (path, body, method = "POST") => {
    const r = await fetch(`${API}/api/teacher${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }, [token]);

  const postForm = useCallback(async (path, formData, method = "POST") => {
    const r = await fetch(`${API}/api/teacher${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return r.json();
  }, [token]);

  const del = useCallback(async (path) => {
    const r = await fetch(`${API}/api/teacher${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  }, [token]);

  return { get, post, postForm, del };
}

const TeacherDashboard = () => {
  const { teacherUser, teacherLogout, getTeacherToken } = useAdminAuth();
  const navigate = useNavigate();
  const token = getTeacherToken();
  const { get, post, postForm, del } = useTeacherApi(token);

  const [section, setSection] = useState("batches");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherUser && teacherUser !== undefined) navigate("/teacher-login");
  }, [teacherUser, navigate]);

  const loadBatches = useCallback(async () => {
    const d = await get("/batches");
    if (d.success) setBatches(d.batches);
  }, [get]);

  useEffect(() => {
    loadBatches().finally(() => setLoading(false));
  }, [loadBatches]);

  const handleLogout = () => { teacherLogout(); navigate("/"); };

  if (loading || teacherUser === undefined) {
    return <div className={styles.splash}><FaChalkboardTeacher className={styles.splashIcon} /><p>Loading…</p></div>;
  }

  return (
    <div className={styles.layout}>
      {/* Mobile top bar */}
      <div className={styles.mobileTopBar}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <MdMenu />
        </button>
        <span className={styles.mobileTopBarTitle}>
          <FaChalkboardTeacher /> Teacher Panel
        </span>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileNavOpen && (
        <div className={styles.sidebarBackdrop} onClick={() => setMobileNavOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <FaChalkboardTeacher className={styles.sidebarLogo} />
          <span>Teacher Panel</span>
          <button
            className={styles.sidebarCloseBtn}
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <MdClose />
          </button>
        </div>
        <div className={styles.adminInfo}>
          {teacherUser?.name && <p className={styles.adminName}>{teacherUser.name}</p>}
          <p className={styles.adminEmail}>{teacherUser?.email}</p>
        </div>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`${styles.navItem} ${section === n.key ? styles.navActive : ""}`}
              onClick={() => { setSection(n.key); setSelectedBatchId(null); setMobileNavOpen(false); }}
            >
              {n.icon} <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <MdLogout /> <span>Logout</span>
        </button>
      </aside>

      <main className={styles.main}>
        {section === "questions" ? (
          <TeacherQuestionUpload get={get} post={post} postForm={postForm} token={token} />
        ) : selectedBatchId ? (
          <TeacherBatchDetail
            batchId={selectedBatchId}
            teacherId={teacherUser?.id}
            get={get}
            post={post}
            del={del}
            onClose={() => setSelectedBatchId(null)}
            onChanged={loadBatches}
          />
        ) : (
          <>
            <div className={styles.pageHeader}>
              <h1>My Batches</h1>
              <p>Welcome back, {teacherUser?.name || teacherUser?.email}</p>
            </div>
            <DataTable
              columns={[
                { key: "name", label: "Batch Name" },
                { key: "academicYear", label: "Year / Term", render: (r) => [r.academicYear, r.term].filter(Boolean).join(" · ") || "—" },
                { key: "subjects", label: "Subjects", render: (r) => r.subjects?.length || 0 },
                { key: "studentIds", label: "Students", render: (r) => `${r.studentIds?.length || 0}${r.maxStudents ? ` / ${r.maxStudents}` : ""}` },
                { key: "status", label: "Status" },
              ]}
              rows={batches}
              actions={[
                { icon: <MdVisibility />, title: "Open Batch", onClick: (row) => setSelectedBatchId(row._id) },
              ]}
              emptyMsg="No batches assigned to you yet. Ask your admin to add you to a batch."
            />
          </>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
