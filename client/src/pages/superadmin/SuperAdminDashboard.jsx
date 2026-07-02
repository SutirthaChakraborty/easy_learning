import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCrown, FaBuilding, FaUsers, FaCheckCircle, FaTimesCircle,
  FaClock, FaChartBar, FaCog, FaSignOutAlt, FaTachometerAlt,
  FaGlobe, FaThumbsUp, FaThumbsDown,
} from "react-icons/fa";
import { MdClose } from "react-icons/md";
import { useAdminAuth } from "../../context/AdminAuthContext";
import styles from "./SuperAdminDashboard.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const NAV = [
  { key: "overview", label: "Overview", icon: <FaTachometerAlt /> },
  { key: "organizations", label: "Organizations", icon: <FaBuilding /> },
  { key: "reports", label: "Reports", icon: <FaChartBar /> },
  { key: "settings", label: "Settings", icon: <FaCog /> },
];

const PLAN_OPTIONS = ["free", "basic", "pro", "enterprise"];

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
function RejectModal({ onConfirm, onClose, loading }) {
  const [reason, setReason] = useState("");
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Reject Organization</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <p className={styles.modalDesc}>Provide a reason for rejection (optional):</p>
        <textarea
          className={styles.modalTextarea}
          placeholder="Reason for rejection…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.rejectBtn} onClick={() => onConfirm(reason)} disabled={loading}>
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Settings modal ────────────────────────────────────────────────────────────
function SettingModal({ onSave, onClose, loading }) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Add / Update Setting</h3>
          <button className={styles.modalClose} onClick={onClose}><MdClose /></button>
        </div>
        <div className={styles.modalForm}>
          <div className={styles.modalField}><label>Key</label>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. max_students_per_batch" />
          </div>
          <div className={styles.modalField}><label>Value</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 30" />
          </div>
          <div className={styles.modalField}><label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this setting controls" />
          </div>
          <button className={styles.saveSettingBtn} onClick={() => onSave({ key, value, description })} disabled={loading || !key || !value}>
            {loading ? "Saving…" : "Save Setting"}
          </button>
        </div>
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
  const [settings, setSettings] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [settingModal, setSettingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const loadSettings = useCallback(async () => {
    const d = await get("/settings");
    if (d.success) setSettings(d.settings);
  }, [get]);

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, [loadStats]);

  const handleSection = useCallback(async (sec) => {
    setSection(sec);
    if (sec === "organizations") loadOrgs(filterStatus);
    else if (sec === "settings") loadSettings();
  }, [filterStatus, loadOrgs, loadSettings]);

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    loadOrgs(status);
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

  const handlePlanChange = async (id, plan) => {
    await put(`/organizations/${id}/subscription`, { plan });
    loadOrgs(filterStatus);
  };

  const handleSaveSetting = async (body) => {
    setActionLoading("setting");
    const d = await post("/settings", body);
    setActionLoading(null);
    if (d.success) { setSettingModal(false); loadSettings(); }
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
                <p>All organization admins, tutors, students, and parents are managed through their respective org dashboards.</p>
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

                      {org.status === "pending" && (
                        <div className={styles.orgActions}>
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApprove(org._id)}
                            disabled={actionLoading === org._id + "_approve"}
                          >
                            <FaThumbsUp /> {actionLoading === org._id + "_approve" ? "…" : "Approve"}
                          </button>
                          <button
                            className={styles.rejectOrgBtn}
                            onClick={() => setRejectTarget(org._id)}
                          >
                            <FaThumbsDown /> Reject
                          </button>
                        </div>
                      )}

                      {org.status === "approved" && (
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
                      )}

                      {org.status === "rejected" && org.rejectionReason && (
                        <p className={styles.rejectedReason}>Reason: {org.rejectionReason}</p>
                      )}
                    </div>
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
          </>
        )}

        {/* ── Settings ── */}
        {section === "settings" && (
          <>
            <div className={styles.pageHeader}>
              <h1>System Settings</h1>
              <button className={styles.addSettingBtn} onClick={() => setSettingModal(true)}>
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
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
