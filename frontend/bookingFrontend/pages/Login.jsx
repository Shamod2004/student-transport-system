import { useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { isValidEmail } from "@/lib/validation";
import { toast } from "sonner";
import "../styles/animations.css";

const showAccountAlerts = async (token) => {
  if (!token) return;

  try {
    const response = await fetch("http://localhost:5001/api/users/notifications", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) return;

    const data = await response.json();
    const unread = (data.notifications || []).filter((item) => !item.isRead);

    for (const item of unread) {
      toast("Account alert", {
        description: item.message
      });
      await fetch(`http://localhost:5001/api/users/notifications/${item._id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).catch(() => null);
    }
  } catch (_err) {
    // Keep login flow successful even if notifications cannot be loaded.
  }
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const driverMaintenanceAppUrl = import.meta.env.VITE_DRIVER_MAINTENANCE_APP_URL || "http://localhost:3003";
  const driverMaintenanceApiBaseUrl = import.meta.env.VITE_DRIVER_MAINTENANCE_API_URL || "http://localhost:5002";
  const routeManagementAppUrl = import.meta.env.VITE_ROUTE_MANAGEMENT_APP_URL || "http://localhost:3000";
  const redirectTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return location.state?.redirectTo || params.get("redirectTo") || "/";
  }, [location.search, location.state]);

  const redirectAfterAuth = (target) => {
    if (typeof target === "string" && /^https?:\/\//i.test(target)) {
      window.location.assign(target);
      return;
    }

    navigate(target || "/", { replace: true });
  };

  const redirectToDriverMaintenance = (token, user, destination = "/dashboard") => {
    const target = new URL("/login", driverMaintenanceAppUrl);
    target.searchParams.set("handoffToken", token);
    target.searchParams.set("handoffAdmin", JSON.stringify(user || {}));
    target.searchParams.set("handoffDestination", destination);
    window.location.assign(target.toString());
  };

  const redirectToRouteManagement = (token, admin) => {
    const target = new URL("http://localhost:3000/admin/dashboard");
    target.searchParams.set("handoffToken", token);
    if (admin) {
      target.searchParams.set("handoffAdmin", JSON.stringify(admin));
    }
    window.location.assign(target.toString());
  };

  const redirectSpecialAdmin = (token, admin) => {
    const adminType = String(admin?.adminType || "").toLowerCase();
    if (adminType === "route-management") {
      redirectToRouteManagement(token, admin);
      return true;
    }
    if (adminType === "driver-maintenance") {
      redirectToDriverMaintenance(token, admin);
      return true;
    }
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!formData.password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      // Specialized admin flows (driver maintenance, route management) are checked first.
      const maintenanceResponse = await fetch("http://localhost:5001/api/auth/driver-maintenance/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (maintenanceResponse.ok) {
        const maintenanceData = await maintenanceResponse.json();
        await showAccountAlerts(maintenanceData.token);
        redirectToDriverMaintenance(maintenanceData.token, maintenanceData.admin);
        return;
      }

      const routeAdminResponse = await fetch("http://localhost:5001/api/auth/route-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (routeAdminResponse.ok) {
        const routeAdminData = await routeAdminResponse.json();
        await showAccountAlerts(routeAdminData.token);
        redirectToRouteManagement(routeAdminData.token, routeAdminData.admin);
        return;
      }

      const adminResponse = await fetch("http://localhost:5001/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (adminResponse.ok) {
        const data = await adminResponse.json();
        await showAccountAlerts(data.token);
        login({
          token: data.token,
          user: {
            id: data.admin.id,
            name: data.admin.name,
            email: data.admin.email,
            role: data.admin.role || "admin"
          }
        });
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // Driver users authenticate against the driver maintenance backend.
      const driverResponse = await fetch(`${driverMaintenanceApiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (driverResponse.ok) {
        const driverData = await driverResponse.json();
        if (String(driverData.role || "").toLowerCase() === "driver") {
          redirectToDriverMaintenance(driverData.token, driverData, "/driver/dashboard");
          return;
        }
      }

      // Fall back to student login
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        await showAccountAlerts(data.token);
        login({
          token: data.token,
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            studentId: data.user.studentId,
            gender: data.user.gender || "",
            role: data.user.role || "student"
          }
        });
        redirectAfterAuth(redirectTo);
      } else {
        const loginError = await response.json().catch(() => ({}));
        setError(loginError.error || "Invalid email or password.");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2847] to-[#0f172a] text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="container mx-auto flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md auth-card-appear">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }
              navigate(redirectTo || "/", { replace: true });
            }}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10"
          >
            <span aria-hidden="true">&larr;</span>
            <span>Back</span>
          </button>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-lg">
                ST
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-200/70">
                  Student Transport
                </p>
                <h1 className="title-appear anim-delay-1 text-xl font-semibold text-slate-100">Welcome back</h1>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0f172a]/70 p-6 shadow-xl">
              <div className="space-y-2 mb-5">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Sign In
                </h2>
                <p className="text-sm text-slate-400">
                  Use your account to continue to the platform.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@university.edu"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <a href="#" className="text-xs font-medium text-blue-300 hover:text-blue-200">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-slate-500">OR</span>
                <div className="flex-1 border-t border-white/10" />
              </div>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <p className="text-center text-sm text-slate-400">
                  Don't have an account?{" "}
                  <Link to="/signup" state={{ redirectTo }} className="font-medium text-blue-300 hover:text-blue-200">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
