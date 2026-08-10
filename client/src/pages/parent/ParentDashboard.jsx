import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdFamilyRestroom, MdAdd, MdDelete, MdEdit,
  MdInsights, MdClose, MdLogout, MdMenu, MdSupportAgent, MdChildCare,
} from "react-icons/md";
import { useAdminAuth } from "../../context/AdminAuthContext";
import StudentDashboardViewer from "../../components/StudentDashboardViewer/StudentDashboardViewer";
import Modal from "../../components/Admin/Modal";
import DataTable from "../../components/Admin/DataTable";
import StatCard from "../../components/Admin/StatCard";
import styles from "./ParentDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const NAV = [
  { key: "kids", label: "My Kids", icon: <MdChildCare /> },
  { key: "chat", label: "Chat with Us", icon: <MdSupportAgent /> },
];

function useParentApi(token) {
  const get = useCallback(async (path) => {
    const r = await fetch(`${API}/api/parent${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.json();
  }, [token]);

  const post = useCallback(async (path, body, method = "POST") => {
    const r = await fetch(`${API}/api/parent${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }, [token]);

  const del = useCallback(async (path) => {
    const r = await fetch(`${API}/api/parent${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.json();
  }, [token]);

  return { get, post, del };
}

// ── Performance modal (fallback when a kid has no learning activity yet) ─────
function PerformanceModal({ data, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Performance — {data.name}</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        {data.performance.linked ? (
          <div className={styles.perfGrid}>
            <div className={styles.perfStat}><span>{data.performance.totalXP}</span><label>Total XP</label></div>
            <div className={styles.perfStat}><span>{data.performance.totalSessions}</span><label>Sessions</label></div>
            <div className={styles.perfStat}><span>{data.performance.totalMinutes}</span><label>Minutes</label></div>
            <div className={styles.perfStat}><span>{data.performance.averageScore}%</span><label>Avg Score</label></div>
            <div className={styles.perfStat}><span>{data.performance.achievementCount}</span><label>Achievements</label></div>
          </div>
        ) : (
          <p className={styles.empty}>No learning activity recorded yet for this child's email. Once they start learning, progress will show up here.</p>
        )}
      </div>
    </div>
  );
}

// ── Chat panel ────────────────────────────────────────────────────────────────
function ChatPanel({ messages, draft, onDraftChange, onSend, sending }) {
  return (
    <div className={styles.chatPanel}>
      <div className={styles.chatMessages}>
        {messages.length === 0 ? (
          <p className={styles.empty}>No messages yet. Start the conversation with the Super Admin.</p>
        ) : (
          messages.map((m) => (
            <div key={m._id} className={`${styles.chatBubble} ${m.senderRole === "parent" ? styles.chatBubbleMine : styles.chatBubbleTheirs}`}>
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
const ParentDashboard = () => {
  const { parentUser, parentLogout, getParentToken } = useAdminAuth();
  const navigate = useNavigate();
  const token = getParentToken();
  const { get, post, del } = useParentApi(token);

  const [section, setSection] = useState("kids");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [perfModal, setPerfModal] = useState(null);
  const [dashboardViewerChild, setDashboardViewerChild] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatUnread, setChatUnread] = useState(0);
  const [chatSending, setChatSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentUser && parentUser !== undefined) navigate("/parent-login");
  }, [parentUser, navigate]);

  const loadChildren = useCallback(async () => {
    const d = await get("/children");
    if (d.success) setChildren(d.children);
  }, [get]);

  useEffect(() => {
    loadChildren().finally(() => setLoading(false));
  }, [loadChildren]);

  const pollChatUnread = useCallback(async () => {
    const d = await get("/chat/unread-count");
    if (d.success) setChatUnread(d.count);
  }, [get]);

  useEffect(() => {
    pollChatUnread();
    const iv = setInterval(pollChatUnread, 25000);
    return () => clearInterval(iv);
  }, [pollChatUnread]);

  const loadChat = useCallback(async () => {
    const d = await get("/chat");
    if (d.success) { setChatMessages(d.messages); setChatUnread(0); }
  }, [get]);

  const loadSection = useCallback(async (sec) => {
    setSection(sec);
    if (sec === "kids") loadChildren();
    else if (sec === "chat") loadChat();
  }, [loadChildren, loadChat]);

  const handleSendChat = async () => {
    if (!chatDraft.trim()) return;
    setChatSending(true);
    const d = await post("/chat", { message: chatDraft.trim() });
    setChatSending(false);
    if (d.success) { setChatDraft(""); loadChat(); }
  };

  const handleLogout = () => { parentLogout(); navigate("/"); };

  const openModal = (config) => { setModal(config); setModalError(""); };
  const closeModal = () => setModal(null);

  const handleModalSubmit = async (form) => {
    setModalLoading(true);
    setModalError("");
    try {
      const data = await post(modal.endpoint, form, modal.method || "POST");
      if (!data.success) { setModalError(data.message || "Something went wrong"); return; }
      closeModal();
      loadChildren();
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteChild = async (child) => {
    if (!confirm(`Remove ${child.name} from your kids?`)) return;
    await del(`/children/${child._id}`);
    loadChildren();
  };

  const openChildPerformance = async (child) => {
    const d = await get(`/children/${child._id}/performance`);
    if (!d.success) return;
    if (d.performance.linked) {
      setDashboardViewerChild({ id: child._id, name: child.name });
    } else {
      setPerfModal({ name: child.name, performance: d.performance });
    }
  };

  if (loading || parentUser === undefined) {
    return <div className={styles.splash}><MdFamilyRestroom className={styles.splashIcon} /><p>Loading…</p></div>;
  }

  const childFields = [
    { key: "name", label: "Child's Name", required: true, minLength: 2, maxLength: 100 },
    { key: "age", label: "Age", type: "number", required: true, min: 1, max: 25 },
    { key: "email", label: "Child's Email", type: "email", required: true, placeholder: "Used to link their learning progress" },
  ];

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
          <MdFamilyRestroom /> Parent Dashboard
        </span>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileNavOpen && (
        <div className={styles.sidebarBackdrop} onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <MdFamilyRestroom className={styles.sidebarLogo} />
          <span>Parent Dashboard</span>
          <button
            className={styles.sidebarCloseBtn}
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <MdClose />
          </button>
        </div>
        <div className={styles.adminInfo}>
          {parentUser?.name && <p className={styles.adminName}>{parentUser.name}</p>}
          <p className={styles.adminEmail}>{parentUser?.email}</p>
        </div>
        <nav className={styles.nav}>
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`${styles.navItem} ${section === n.key ? styles.navActive : ""}`}
              onClick={() => { loadSection(n.key); setMobileNavOpen(false); }}
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
        {/* ── My Kids ── */}
        {section === "kids" && (
          <>
            <div className={styles.pageHeader}>
              <h1>My Kids</h1>
              <button className={styles.primaryBtn} onClick={() => openModal({
                title: "Add Kid",
                endpoint: "/children",
                fields: childFields,
              })}>
                <MdAdd /> Add Kid
              </button>
            </div>
            <div className={styles.statsGrid}>
              <StatCard label="Total Kids" value={children.length} icon={<MdChildCare />} color="#ec4899" />
            </div>
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "age", label: "Age" },
                { key: "email", label: "Email" },
              ]}
              rows={children}
              actions={[
                { icon: <MdInsights />, title: "Performance", onClick: openChildPerformance },
                { icon: <MdEdit />, title: "Edit", onClick: (row) => openModal({
                    title: "Edit Kid",
                    endpoint: `/children/${row._id}`,
                    method: "PATCH",
                    fields: childFields,
                    initial: { name: row.name, age: row.age, email: row.email },
                  }) },
                { icon: <MdDelete />, title: "Remove", variant: "delete", onClick: handleDeleteChild },
              ]}
              emptyMsg={`You haven't added any kids yet. Click "Add Kid" to get started.`}
            />
          </>
        )}

        {/* ── Chat with Us ── */}
        {section === "chat" && (
          <>
            <div className={styles.pageHeader}>
              <h1>Chat with Us</h1>
              <p>Chat directly with the Super Admin about your account or your kids.</p>
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

      {/* Performance fallback modal */}
      {perfModal && <PerformanceModal data={perfModal} onClose={() => setPerfModal(null)} />}

      {dashboardViewerChild && (
        <StudentDashboardViewer
          apiBase={`${API}/api/parent/children/${dashboardViewerChild.id}/dashboard`}
          token={token}
          displayName={dashboardViewerChild.name}
          onClose={() => setDashboardViewerChild(null)}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
