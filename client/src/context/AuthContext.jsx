import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/auth";

const API = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
const JWT_KEY = "jwt_token";

const AuthContext = createContext(null);

async function syncSessionCookie(user) {
  if (user) {
    await fetch(`${API}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        photoURL: user.photoURL || "",
      }),
    });
  } else {
    await fetch(`${API}/api/auth/session`, {
      method: "DELETE",
      credentials: "include",
    });
  }
}

function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

export const AuthProvider = ({ children }) => {
  // user shape: { uid, email, name, photoURL, authType: 'firebase' | 'jwt' }
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    // Check for a stored JWT first
    const token = localStorage.getItem(JWT_KEY);
    if (token && !isTokenExpired(token)) {
      const payload = decodeJWT(token);
      setUser({
        uid: payload.id,
        email: payload.email,
        name: payload.name,
        photoURL: "",
        authType: "jwt",
      });
    }

    // Firebase listener (handles Google sign-in)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const hasJWT = !!localStorage.getItem(JWT_KEY);
      if (hasJWT) return; // JWT user takes precedence; ignore Firebase state

      try {
        await syncSessionCookie(firebaseUser);
      } catch (_) {}
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          authType: "firebase",
        });
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const registerManual = async (name, email, password) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    localStorage.setItem(JWT_KEY, data.token);
    setUser({
      uid: data.user.id,
      email: data.user.email,
      name: data.user.name,
      photoURL: "",
      authType: "jwt",
    });
  };

  const loginManual = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    localStorage.setItem(JWT_KEY, data.token);
    setUser({
      uid: data.user.id,
      email: data.user.email,
      name: data.user.name,
      photoURL: "",
      authType: "jwt",
    });
  };

  const logout = async () => {
    localStorage.removeItem(JWT_KEY);
    await signOut(auth);
    await syncSessionCookie(null);
    setUser(null);
  };

  const getToken = () => localStorage.getItem(JWT_KEY);

  return (
    <AuthContext.Provider value={{ user, registerManual, loginManual, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
