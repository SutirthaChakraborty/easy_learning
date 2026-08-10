import { createContext, useContext, useState, useEffect } from "react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const ADMIN_JWT_KEY = "admin_jwt";
const SUPERADMIN_JWT_KEY = "superadmin_jwt";
const TEACHER_JWT_KEY = "teacher_jwt";
const PARENT_JWT_KEY = "parent_jwt";

const AdminAuthContext = createContext(null);

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isExpired(token) {
  const p = decodeJWT(token);
  if (!p?.exp) return true;
  return p.exp * 1000 < Date.now();
}

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(undefined);
  const [superAdminUser, setSuperAdminUser] = useState(undefined);
  const [teacherUser, setTeacherUser] = useState(undefined);
  const [parentUser, setParentUser] = useState(undefined);

  useEffect(() => {
    const adminToken = localStorage.getItem(ADMIN_JWT_KEY);
    if (adminToken && !isExpired(adminToken)) {
      const p = decodeJWT(adminToken);
      setAdminUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "org_admin" });
    } else {
      setAdminUser(null);
    }

    const saToken = localStorage.getItem(SUPERADMIN_JWT_KEY);
    if (saToken && !isExpired(saToken)) {
      const p = decodeJWT(saToken);
      setSuperAdminUser({ email: p.email, name: p.name, role: "superadmin" });
    } else {
      setSuperAdminUser(null);
    }

    const teacherToken = localStorage.getItem(TEACHER_JWT_KEY);
    if (teacherToken && !isExpired(teacherToken)) {
      const p = decodeJWT(teacherToken);
      setTeacherUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "teacher" });
    } else {
      setTeacherUser(null);
    }

    const parentToken = localStorage.getItem(PARENT_JWT_KEY);
    if (parentToken && !isExpired(parentToken)) {
      const p = decodeJWT(parentToken);
      setParentUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, role: "parent" });
    } else {
      setParentUser(null);
    }
  }, []);

  const adminGoogleSignIn = async (uid, email, name, photoURL) => {
    const res = await fetch(`${API}/api/admin/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email, name, photoURL }),
    });
    if (!res.ok && res.status === 404) throw new Error("Admin auth route not found. The server may not be running the latest code.");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem(ADMIN_JWT_KEY, data.token);
    const p = decodeJWT(data.token);
    setAdminUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "org_admin" });
    return data.admin;
  };

  const superAdminLogin = async (email, password) => {
    const res = await fetch(`${API}/api/superadmin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok && res.status === 404) throw new Error("Super admin auth route not found. The server may not be running the latest code.");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem(SUPERADMIN_JWT_KEY, data.token);
    setSuperAdminUser({ email: data.superadmin.email, name: data.superadmin.name, role: "superadmin" });
  };

  const teacherGoogleSignIn = async (uid, email, name, photoURL) => {
    const res = await fetch(`${API}/api/teacher/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email, name, photoURL }),
    });
    if (!res.ok && res.status === 404) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "No teacher account found for this email.");
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem(TEACHER_JWT_KEY, data.token);
    const p = decodeJWT(data.token);
    setTeacherUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, orgId: p.orgId, role: "teacher" });
    return data.teacher;
  };

  const parentGoogleSignIn = async (uid, email, name, photoURL) => {
    const res = await fetch(`${API}/api/parent/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email, name, photoURL }),
    });
    if (!res.ok && res.status === 404) throw new Error("Parent auth route not found. The server may not be running the latest code.");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    localStorage.setItem(PARENT_JWT_KEY, data.token);
    const p = decodeJWT(data.token);
    setParentUser({ id: p.id, uid: p.uid, email: p.email, name: p.name, role: "parent" });
    return data.parent;
  };

  const adminLogout = () => {
    localStorage.removeItem(ADMIN_JWT_KEY);
    setAdminUser(null);
  };

  const superAdminLogout = () => {
    localStorage.removeItem(SUPERADMIN_JWT_KEY);
    setSuperAdminUser(null);
  };

  const teacherLogout = () => {
    localStorage.removeItem(TEACHER_JWT_KEY);
    setTeacherUser(null);
  };

  const parentLogout = () => {
    localStorage.removeItem(PARENT_JWT_KEY);
    setParentUser(null);
  };

  const getAdminToken = () => localStorage.getItem(ADMIN_JWT_KEY);
  const getSuperAdminToken = () => localStorage.getItem(SUPERADMIN_JWT_KEY);
  const getTeacherToken = () => localStorage.getItem(TEACHER_JWT_KEY);
  const getParentToken = () => localStorage.getItem(PARENT_JWT_KEY);

  return (
    <AdminAuthContext.Provider value={{
      adminUser, superAdminUser, teacherUser, parentUser,
      adminGoogleSignIn, superAdminLogin, teacherGoogleSignIn, parentGoogleSignIn,
      adminLogout, superAdminLogout, teacherLogout, parentLogout,
      getAdminToken, getSuperAdminToken, getTeacherToken, getParentToken,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
