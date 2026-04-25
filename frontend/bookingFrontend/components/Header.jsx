import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import AccountDetailsPanel from "@/components/AccountDetailsPanel";
import NotificationPanel from "@/components/NotificationPanel";
import { Bell } from "lucide-react";
import { FaBars, FaChevronDown, FaTimes } from "react-icons/fa";

const Header = () => {
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);

  const routeBaseUrl = import.meta.env.VITE_ROUTE_APP_BASE_URL || "http://localhost:3000";

  const navItems = [
    { name: "Home", type: "external", href: `${routeBaseUrl}/` },
    { name: "Journey", type: "external", href: `${routeBaseUrl}/journey` },
    { name: "Booking", type: "internal", path: "/booking" },
    { name: "FAQ", type: "external", href: `${routeBaseUrl}/faq` },
    { name: "Contact", type: "external", href: `${routeBaseUrl}/contact` }
  ];

  const displayName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0];
    return "Student";
  }, [user]);

  const userInitial = displayName?.charAt(0)?.toUpperCase() || "S";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleNotificationPanel = () => {
    setShowNotificationPanel((prev) => {
      const next = !prev;
      if (next) setShowAccountPanel(false);
      return next;
    });
  };

  const toggleAccountPanel = () => {
    setShowAccountPanel((prev) => {
      const next = !prev;
      if (next) setShowNotificationPanel(false);
      return next;
    });
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/users/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const notifications = data.notifications || [];
          const unread = notifications.filter((item) => !item.isRead).length;
          setNotificationCount(unread);
        }
      } catch (_err) {
        // Keep UI responsive even if notification fetch fails.
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowProfileMenu(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const checkPendingCheckout = async () => {
      try {
        const raw = localStorage.getItem("stms_pending_checkout");
        const pending = raw ? JSON.parse(raw) : null;

        if (!pending || !isAuthenticated || !token) {
          setHasPendingCheckout(false);
          return;
        }

        const response = await fetch("http://localhost:5001/api/bookings/my-seats", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          setHasPendingCheckout(false);
          return;
        }

        const payload = await response.json();
        const activeLocks = Array.isArray(payload?.activeLocks) ? payload.activeLocks : [];
        const now = Date.now();

        const hasFutureLock = activeLocks.some((lock) => {
          const expiresAt = lock?.lockExpiresAt ? new Date(lock.lockExpiresAt).getTime() : NaN;
          return Number.isFinite(expiresAt) && expiresAt > now;
        });

        if (!hasFutureLock) {
          // Prevent stale nav button when lock/countdown is already expired.
          localStorage.removeItem("stms_pending_checkout");
        }

        setHasPendingCheckout(hasFutureLock);
      } catch (_err) {
        setHasPendingCheckout(false);
      }
    };

    checkPendingCheckout();
    const interval = setInterval(checkPendingCheckout, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const searchParams = new URLSearchParams(location.search);
    const panel = searchParams.get("panel");

    if (panel === "account") {
      setShowAccountPanel(true);
      setShowNotificationPanel(false);
      return;
    }

    if (panel === "notifications") {
      setShowNotificationPanel(true);
      setShowAccountPanel(false);
    }
  }, [location.search, isAuthenticated]);


  const handleContinuePayment = () => {
    try {
      const raw = localStorage.getItem("stms_pending_checkout");
      const pending = raw ? JSON.parse(raw) : null;
      if (!pending || !token) {
        return;
      }

      const paymentAppUrl = import.meta.env.VITE_PAYMENT_APP_URL || "http://localhost:3002";
      const paymentUrl = new URL(paymentAppUrl, window.location.origin);
      paymentUrl.searchParams.set("checkout", JSON.stringify({
        ...pending,
        token
      }));
      
      window.location.replace(paymentUrl.toString());
    } catch (_err) {
      // Keep flow working even if parsing fails
    }
  };
  const goToExternal = (url) => {
    window.location.assign(url);
  };

  const handleProfileOpen = () => {
    setShowAccountPanel(true);
    setShowNotificationPanel(false);
    setShowProfileMenu(false);
  };

  const handleEditProfileOpen = () => {
    setShowAccountPanel(true);
    setShowNotificationPanel(false);
    setShowProfileMenu(false);
    navigate("/booking?panel=account&mode=edit", { replace: true });
  };

  return (
    <>
      <header
        className={`sticky top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
          isScrolled
            ? "bg-gray-900/95 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            : "bg-gray-800 py-6"
        }`}
      >
        <div className="container flex items-center justify-between px-4 sm:px-6">
          <Link to="/booking" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 text-sm font-bold text-white shadow-[0_10px_20px_rgba(0,0,0,0.28)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              W
            </div>
            <span className="text-xl font-semibold tracking-wide text-white transition-colors duration-300 group-hover:text-sky-300">
              Way Go
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              if (item.type === "external") {
                return (
                  <button
                    key={item.name}
                    onClick={() => goToExternal(item.href)}
                    className="relative text-slate-200 hover:text-white transition-all duration-300 font-medium group"
                  >
                    <span>{item.name}</span>
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-sky-400 transition-all duration-300 group-hover:w-full" />
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative font-medium transition-all duration-300 ${
                      isActive ? "text-white" : "text-slate-200 hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{item.name}</span>
                      <span
                        className={`absolute -bottom-1 left-1/2 h-0.5 -translate-x-1/2 bg-sky-400 transition-all duration-300 ${
                          isActive ? "w-full" : "w-0"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              );
            })}
            {hasPendingCheckout && (
              <button
                onClick={handleContinuePayment}
                className="relative text-slate-200 hover:text-white transition-all duration-300 font-medium group"
                title="Continue with payment"
              >
                <span>Payment</span>
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-sky-400 transition-all duration-300 group-hover:w-full" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleNotificationPanel}
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/80 text-slate-100 transition-all duration-200 hover:bg-slate-600"
                  title="Notifications"
                >
                  <Bell className="h-[14px] w-[14px]" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>

                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setShowProfileMenu((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-700/80 px-2 py-1 text-slate-100 transition-all duration-200 hover:bg-slate-600"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                      {userInitial}
                    </div>
                    <span className="text-sm font-medium">{displayName}</span>
                    <FaChevronDown className={`h-3 w-3 transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`} />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl">
                      <button
                        onClick={handleProfileOpen}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleEditProfileOpen}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                      >
                        Edit Profile
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleAccountPanel}
                  className="sm:hidden inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/80 text-slate-100"
                  title="Profile"
                >
                  <span className="text-xs font-semibold">{userInitial}</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  className="rounded-full border border-slate-400 bg-transparent px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-700"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
                <button
                  className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-sky-500"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden text-slate-200 hover:text-white transition-all duration-300"
              title="Menu"
            >
              {isMobileMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 overflow-hidden rounded-2xl border border-slate-700 bg-gray-900/95">
            <div className="py-2">
              {navItems.map((item) =>
                item.type === "external" ? (
                  <button
                    key={item.name}
                    onClick={() => goToExternal(item.href)}
                    className="block w-full px-5 py-3 text-left text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    {item.name}
                  </button>
                ) : (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-5 py-3 text-left transition ${
                        isActive ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800 hover:text-white"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                )
              )}

              {hasPendingCheckout && (
                <button
                  onClick={handleContinuePayment}
                  className="block w-full px-5 py-3 text-left text-slate-200 transition hover:bg-slate-800 hover:text-white"
                >
                  Payment
                </button>
              )}

              <div className="border-t border-slate-700 px-4 py-3">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={toggleNotificationPanel}
                      className="mb-2 w-full rounded-xl border border-slate-600 px-4 py-2.5 text-left text-slate-100"
                    >
                      Notifications ({notificationCount})
                    </button>
                    <button
                      onClick={handleProfileOpen}
                      className="mb-2 w-full rounded-xl border border-slate-600 px-4 py-2.5 text-left text-slate-100"
                    >
                      Profile
                    </button>
                    <button
                      onClick={handleEditProfileOpen}
                      className="w-full rounded-xl border border-slate-600 px-4 py-2.5 text-left text-slate-100"
                    >
                      Edit Profile
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="mb-2 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-left text-white"
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </button>
                    <button
                      className="w-full rounded-xl border border-slate-500 px-4 py-2.5 text-left text-white"
                      onClick={() => navigate("/signup")}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      <AccountDetailsPanel open={showAccountPanel} onClose={() => setShowAccountPanel(false)} />
      <NotificationPanel
        open={showNotificationPanel}
        onClose={() => setShowNotificationPanel(false)}
        onUnreadChange={setNotificationCount}
      />
    </>
  );
};

export default Header;
