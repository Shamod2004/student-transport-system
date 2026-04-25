import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/AdminHeader";
import "../styles/animations.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    bookedCount: 0,
    cancelledCount: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [bookingStatsRes, studentsRes] = await Promise.all([
          fetch("http://localhost:5001/api/admin/bookings/stats"),
          fetch("http://localhost:5001/api/admin/students")
        ]);

        const bookingStats = bookingStatsRes.ok ? await bookingStatsRes.json() : null;
        const students = studentsRes.ok ? await studentsRes.json() : [];

        setStats({
          totalBookings: bookingStats?.totalBookings ?? bookingStats?.total ?? 0,
          bookedCount: bookingStats?.bookedCount ?? bookingStats?.booked ?? 0,
          cancelledCount: bookingStats?.cancelledCount ?? bookingStats?.cancelled ?? 0,
          totalStudents: Array.isArray(students) ? students.length : 0
        });
      } catch (error) {
        console.error("Failed to load admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.assign(import.meta.env.VITE_ROUTE_MANAGEMENT_APP_URL || "http://localhost:3000");
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-[#040b1a] via-[#0c1932] to-[#020617]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="absolute right-[-120px] top-[-40px] h-96 w-96 rounded-full bg-blue-500/15 blur-2xl" />
        <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />
      </div>

      <div className="relative z-10">
      <AdminHeader onLogout={() => setShowLogoutConfirm(true)} />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="space-y-6 rounded-2xl border border-cyan-200/15 bg-slate-900/45 p-4 shadow-[0_14px_44px_rgba(2,6,23,0.35)] backdrop-blur-sm">
              {/* Logo Area */}
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white shadow-lg">
                  ST
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-100/70">
                    School System
                  </p>
                </div>
              </div>

              {/* Main Menu */}
              <nav className="space-y-1">
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-cyan-100/55">
                  Main Menu
                </p>

                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="group flex w-full items-center gap-3 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-teal-500/20 px-3 py-3 text-sm font-medium text-cyan-100 shadow-md transition-[background,box-shadow] duration-200 hover:from-cyan-500/40 hover:to-teal-500/30"
                >
                  <span className="text-lg">📊</span>
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => navigate("/admin/students")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                >
                  <span className="text-lg">�</span>
                  <span>Registration Management</span>
                </button>

                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                >
                  <span className="text-lg">🚌</span>
                  <span>Booking Management</span>
                </button>

                <button
                  onClick={() => navigate("/admin/payments")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                >
                  <span className="text-lg">💳</span>
                  <span>Payment Management</span>
                </button>
              </nav>

              {/* System Status Card */}
              <div className="rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                  System Online
                </p>
                <div className="space-y-2 text-xs text-cyan-100/65">
                  <div className="flex items-center justify-between">
                    <span>Backend</span>
                    <span className="font-medium text-cyan-100">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Frontend</span>
                    <span className="font-medium text-cyan-100">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <span className="font-medium text-cyan-100">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
          {/* Welcome / hero panel */}
          <section className="section-reveal gradient-flow relative overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-950/70 via-blue-950/60 to-indigo-950/70 p-6 shadow-xl backdrop-blur-sm">
            <div className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-sky-400/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 right-0 h-44 w-44 rounded-full bg-indigo-400/20 blur-2xl" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Admin Dashboard
                </p>
                <h2 className="hero-text mt-2 text-3xl font-bold bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
                  Welcome back, {admin?.name || "Admin User"} 👋
                </h2>
                <p className="hero-subtitle mt-2 text-sm text-slate-300">
                  Overview of student registrations and bookings
                </p>
              </div>
              <div className="flex flex-wrap gap-3" />
            </div>
          </section>

          <div className="section-reveal relative isolate overflow-hidden rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-[#071226]/80 via-[#0a1b33]/65 to-[#0e223b]/65 p-4 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur-sm sm:p-5">
            <div className="ambient-blob pointer-events-none absolute -left-20 top-1/3 h-48 w-48 rounded-full bg-cyan-300/15 blur-2xl" />
            <div className="ambient-blob pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-blue-400/15 blur-2xl" />
            <div className="ambient-blob pointer-events-none absolute left-1/3 top-8 h-44 w-44 rounded-full bg-teal-300/10 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_82%_78%,rgba(59,130,246,0.14),transparent_38%),radial-gradient(circle_at_46%_12%,rgba(45,212,191,0.15),transparent_34%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:56px_56px] opacity-35" />
            <div className="relative space-y-6">
          {/* Stats cards */}
          <section className="stagger-in grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="card-hover-lift group rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/45 to-slate-900/30 p-5 shadow-xl hover:shadow-2xl hover:border-cyan-300/70 backdrop-blur-[2px]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200 font-semibold">
                Total Students
              </p>
              <p className="mt-3 text-4xl font-bold text-cyan-100 group-hover:text-white transition-colors">
                {loading ? "..." : stats.totalStudents}
              </p>
              <p className="mt-2 text-xs text-cyan-200/60">Active registrations</p>
            </div>
            <div className="card-hover-lift group rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-950/45 to-slate-900/30 p-5 shadow-xl hover:shadow-2xl hover:border-teal-300/70 backdrop-blur-[2px]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-teal-200 font-semibold">
                Total Bookings
              </p>
              <p className="mt-3 text-4xl font-bold text-teal-100 group-hover:text-white transition-colors">
                {loading ? "..." : stats.totalBookings}
              </p>
              <p className="mt-2 text-xs text-teal-200/60">All time</p>
            </div>
            <div className="card-hover-lift group rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/40 to-slate-900/35 p-5 shadow-xl hover:shadow-2xl hover:border-amber-300/70 backdrop-blur-[2px]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-200 font-semibold">
                Confirmed
              </p>
              <p className="mt-3 text-4xl font-bold text-amber-100 group-hover:text-white transition-colors">
                {loading ? "..." : stats.bookedCount}
              </p>
              <p className="mt-2 text-xs text-amber-200/60">Active bookings</p>
            </div>
            <div className="card-hover-lift group rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-950/45 to-slate-900/35 p-5 shadow-xl hover:shadow-2xl hover:border-rose-300/70 backdrop-blur-[2px]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-rose-200 font-semibold">
                Cancelled
              </p>
              <p className="mt-3 text-4xl font-bold text-rose-100 group-hover:text-white transition-colors">
                {loading ? "..." : stats.cancelledCount}
              </p>
              <p className="mt-2 text-xs text-rose-200/60">Cancelled</p>
            </div>
          </section>

          {/* Quick actions */}
          <section className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-slate-900/65 via-slate-900/45 to-blue-950/35 p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-slate-100">Quick Actions</h3>
            <p className="mt-1 text-xs text-slate-300/80">
              Shortcuts to frequently used admin tools
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => navigate("/admin/students")}
                className="button-animate flex items-center justify-between rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 px-4 py-4 text-left font-medium text-cyan-100 transition-[background,box-shadow] hover:from-cyan-500/35 hover:to-cyan-400/20 hover:shadow-lg"
              >
                <span className="text-sm font-semibold">Registration Management</span>
                <span className="text-2xl">👥</span>
              </button>
              <button
                onClick={() => navigate("/admin/bookings")}
                className="button-animate flex items-center justify-between rounded-xl border border-teal-300/30 bg-gradient-to-r from-teal-500/20 to-teal-400/10 px-4 py-4 text-left font-medium text-teal-100 transition-[background,box-shadow] hover:from-teal-500/35 hover:to-teal-400/20 hover:shadow-lg"
              >
                <span className="text-sm font-semibold">Booking Management</span>
                <span className="text-2xl">🚌</span>
              </button>
              <button
                onClick={() => navigate("/admin/payments")}
                className="button-animate flex items-center justify-between rounded-xl border border-blue-300/30 bg-gradient-to-r from-blue-500/20 to-sky-400/10 px-4 py-4 text-left font-medium text-blue-100 transition-[background,box-shadow] hover:from-blue-500/35 hover:to-sky-400/20 hover:shadow-lg"
              >
                <span className="text-sm font-semibold">Payment Management</span>
                <span className="text-2xl">💳</span>
              </button>
            </div>
          </section>
            </div>
          </div>
        </main>
      </div>
      </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-900/95 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
            <div className="flex items-center justify-between border-b border-cyan-300/15 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-100">Confirm Logout</h2>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70 text-sm text-cyan-100/70 transition-colors hover:bg-slate-700 hover:text-cyan-100"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-100">
                👋
              </div>
              <p className="text-center text-sm text-slate-200">
                Are you sure you want to logout?
              </p>
              <p className="mt-2 text-center text-xs text-cyan-100/55">
                You will need to login again to access the admin panel.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-cyan-300/15 px-6 py-4">
              <Button
                variant="outline"
                className="min-w-[96px] rounded-full border-cyan-300/35 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/15"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="min-w-[96px] rounded-full bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-500"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
