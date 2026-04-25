import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "stms_auth";
const COOKIE_NAME = "stms_auth";

const readAuthCookie = () => {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return null;

  try {
    const raw = decodeURIComponent(cookie.split("=").slice(1).join("="));
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const setAuthCookie = (payload) => {
  if (typeof document === "undefined") return;

  const encoded = encodeURIComponent(JSON.stringify(payload));
  const maxAge = 7 * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${maxAge}; samesite=lax`;
};

const clearAuthCookie = () => {
  if (typeof document === "undefined") return;

  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};

const readStoredAuth = () => {
  const cookieAuth = readAuthCookie();
  if (cookieAuth?.token && cookieAuth?.user) return cookieAuth;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { token: null, user: null };
  try {
    return JSON.parse(raw);
  } catch (err) {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const initialAuth = readStoredAuth();
  const [token, setToken] = useState(initialAuth.token || null);
  const [user, setUser] = useState(initialAuth.user || null);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored?.user?.role === "admin") {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
      return;
    }
    setToken(stored.token || null);
    setUser(stored.user || null);
  }, []);

  const login = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    if (payload?.user?.role === "admin") {
      localStorage.removeItem(STORAGE_KEY);
      clearAuthCookie();
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuthCookie(payload);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    clearAuthCookie();
    localStorage.removeItem("stms_pending_checkout");
    localStorage.removeItem("stms_my_booked_seats");
    localStorage.removeItem("stms_seat_change_request");
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser?.role === "admin") {
      localStorage.removeItem(STORAGE_KEY);
      clearAuthCookie();
      return;
    }
    const stored = readStoredAuth();
    const nextPayload = {
      token: stored.token || token,
      user: nextUser
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPayload));
    setAuthCookie(nextPayload);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      admin: user?.role === "admin" ? user : null,
      login,
      logout,
      updateUser,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === "admin"
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`
  }
});
