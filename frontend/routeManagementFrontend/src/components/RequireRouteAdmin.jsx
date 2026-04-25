import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'stms_route_admin_auth';

const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, admin: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || null,
      admin: parsed?.admin || null
    };
  } catch {
    return { token: null, admin: null };
  }
};

const persistAuth = (token, admin) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token,
      admin,
      updatedAt: Date.now()
    })
  );
};

const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const RequireRouteAdmin = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');

  const loginUrl = useMemo(() => {
    return (
      import.meta.env.VITE_BOOKING_APP_LOGIN_URL ||
      import.meta.env.VITE_BOOKING_LOGIN_URL ||
      'http://localhost:3001/login'
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const handoffToken = params.get('handoffToken');
    const handoffAdminRaw = params.get('handoffAdmin');

    if (!handoffToken) return;

    if (!handoffAdminRaw) {
      persistAuth(handoffToken, null);
      setStatus('ok');
      navigate(location.pathname, { replace: true });
      return;
    }

    try {
      const handoffAdmin = JSON.parse(handoffAdminRaw);
      const isRouteAdmin =
        String(handoffAdmin?.role || '').toLowerCase() === 'admin' &&
        String(handoffAdmin?.adminType || '').toLowerCase() === 'route-management';

      if (isRouteAdmin) {
        persistAuth(handoffToken, handoffAdmin);
        setStatus('ok');
      } else {
        persistAuth(handoffToken, null);
        setStatus('ok');
      }
    } catch {
      persistAuth(handoffToken, null);
      setStatus('ok');
    }

    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    let isCancelled = false;

    const verify = async () => {
      const { token, admin } = readStoredAuth();
      if (!token) {
        clearAuth();
        setStatus('denied');
        return;
      }

      if (
        admin &&
        !(
          String(admin?.role || '').toLowerCase() === 'admin' &&
          String(admin?.adminType || '').toLowerCase() === 'route-management'
        )
      ) {
        clearAuth();
        setStatus('denied');
        return;
      }

      if (!isCancelled) {
        setStatus('ok');
      }

      try {
        const response = await fetch('http://localhost:5001/api/auth/route-admin/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 401 || response.status === 403) {
          clearAuth();
          if (!isCancelled) setStatus('denied');
          return;
        }

        if (!response.ok) {
          // Keep existing session on transient backend/server errors.
          if (!isCancelled) setStatus('ok');
          return;
        }

        const payload = await response.json();
        persistAuth(token, payload?.admin || null);
        if (!isCancelled) setStatus('ok');
      } catch {
        // Network hiccup should not force route admins back to login.
        if (!isCancelled) setStatus('ok');
      }
    };

    verify();
    return () => {
      isCancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (status !== 'denied') return;

    const target = new URL(loginUrl, window.location.origin);
    const redirectTo = `/admin/dashboard`;
    target.searchParams.set('redirectTo', redirectTo);
    window.location.replace(target.toString());
  }, [loginUrl, status]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (status !== 'ok') {
    return null;
  }

  return children;
};

export default RequireRouteAdmin;
