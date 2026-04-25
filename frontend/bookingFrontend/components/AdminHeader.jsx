import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const AdminHeader = ({ onLogout }) => {
  const { admin } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 overflow-hidden transition-all duration-300 ${
          isScrolled
            ? "bg-[linear-gradient(115deg,rgba(203,213,225,0.95)_0%,rgba(226,232,240,0.93)_52%,rgba(241,245,249,0.92)_100%)] shadow-[0_14px_34px_rgba(15,23,42,0.22)] backdrop-blur-2xl"
            : "bg-[linear-gradient(115deg,rgba(226,232,240,0.98)_0%,rgba(241,245,249,0.96)_52%,rgba(248,250,252,0.95)_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        }`}
      >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(148,163,184,0.24),transparent_36%),radial-gradient(circle_at_86%_14%,rgba(100,116,139,0.18),transparent_34%)]" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 text-sm font-bold text-white shadow-[0_10px_20px_rgba(15,23,42,0.28)]">
            ST
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-700">School Transport System</p>
            <h1 className="text-sm font-semibold text-slate-900">Admin Control Panel</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-white/75 px-3 py-1 text-xs font-medium text-slate-700 md:block">
            System Online
          </div>

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{admin?.name || "Admin User"}</p>
            <p className="text-xs text-slate-600">{admin?.email || "admin@example.com"}</p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-500 to-slate-700 text-sm font-semibold text-white shadow-sm">
            {(admin?.name || "A").charAt(0).toUpperCase()}
          </div>

          <Button
            onClick={onLogout}
            className="rounded-lg bg-gradient-to-r from-rose-600 to-red-500 px-4 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:from-rose-500 hover:to-red-500"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
      <div className="h-[69px]" />
    </>
  );
};

export default AdminHeader;