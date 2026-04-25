import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaBell, FaChevronDown } from 'react-icons/fa';
import { Link, NavLink, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();

  const bookingBaseUrl = import.meta.env.VITE_BOOKING_APP_BASE_URL || 'http://localhost:3001';
  const bookingAppUrl = import.meta.env.VITE_BOOKING_APP_URL || 'http://localhost:3001/booking';

  const readCookieAuth = () => {
    if (typeof document === 'undefined') return null;

    const cookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('stms_auth='));

    if (!cookie) return null;

    try {
      const raw = decodeURIComponent(cookie.split('=').slice(1).join('='));
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const clearSharedAuth = () => {
    if (typeof document === 'undefined') return;
    document.cookie = 'stms_auth=; path=/; max-age=0; samesite=lax';
  };

  const readSharedAuth = () => {
    const cookieAuth = readCookieAuth();
    if (cookieAuth?.token && cookieAuth?.user) return cookieAuth;
    return { token: null, user: null };
  };

  const [authState, setAuthState] = useState(() => readSharedAuth());

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const hydrateAuth = () => {
      try {
        const cookieAuth = readCookieAuth();
        const parsed = cookieAuth;
        if (!parsed) {
          localStorage.removeItem('stms_auth');
          setAuthState({ token: null, user: null });
          return;
        }

        setAuthState({ token: parsed?.token || null, user: parsed?.user || null });
      } catch {
        const parsed = readCookieAuth();
        setAuthState({ token: parsed?.token || null, user: parsed?.user || null });
      }
    };

    hydrateAuth();
    window.addEventListener('storage', hydrateAuth);
    window.addEventListener('focus', hydrateAuth);
    const interval = window.setInterval(hydrateAuth, 3000);

    return () => {
      window.removeEventListener('storage', hydrateAuth);
      window.removeEventListener('focus', hydrateAuth);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!authState?.token) {
      setNotificationCount(0);
      return;
    }

    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/users/notifications', {
          headers: { Authorization: `Bearer ${authState.token}` }
        });
        if (!response.ok) return;

        const data = await response.json();
        const unread = (data.notifications || []).filter((item) => !item.isRead).length;
        if (!cancelled) {
          setNotificationCount(unread);
        }
      } catch {
        if (!cancelled) {
          setNotificationCount(0);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authState?.token]);

  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [location.pathname, location.search]);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Journey', path: '/journey' },
    { name: 'About Us', path: '/about' },
    { name: 'FAQs', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  const isAuthenticated = Boolean(authState?.token);

  const displayName = useMemo(() => {
    if (authState?.user?.name) return authState.user.name;
    if (authState?.user?.email) return authState.user.email.split('@')[0];
    return 'Student';
  }, [authState?.user]);

  const userInitial = displayName?.charAt(0)?.toUpperCase() || 'S';

  const goToUrl = (url) => {
    window.location.assign(url);
  };

  const handleLoginClick = () => {
    const bookingLoginUrl =
      import.meta.env.VITE_BOOKING_APP_LOGIN_URL ||
      import.meta.env.VITE_BOOKING_LOGIN_URL ||
      'http://localhost:3001/login';

    const bookingTargetUrl = new URL(bookingAppUrl, window.location.origin);
    if (location.pathname === '/journey' && location.search) {
      bookingTargetUrl.search = location.search;
    }

    const bookingTargetPath = `${bookingTargetUrl.pathname}${bookingTargetUrl.search}${bookingTargetUrl.hash}`;

    const loginUrl = new URL(bookingLoginUrl, window.location.origin);
    loginUrl.searchParams.set('redirectTo', bookingTargetPath);
    goToUrl(loginUrl.toString());
  };

  const handleSignupClick = () => {
    goToUrl(`${bookingBaseUrl}/signup`);
  };

  const handleNotificationsClick = () => {
    goToUrl(`${bookingBaseUrl}/booking?panel=notifications`);
  };

  const handleProfileClick = () => {
    goToUrl(`${bookingBaseUrl}/booking?panel=account`);
  };

  const handleEditProfileClick = () => {
    goToUrl(`${bookingBaseUrl}/booking?panel=account&mode=edit`);
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('stms_auth');
    localStorage.removeItem('stms_pending_checkout');
    localStorage.removeItem('stms_my_booked_seats');
    localStorage.removeItem('stms_seat_change_request');
    clearSharedAuth();
    setAuthState({ token: null, user: null });
    setNotificationCount(0);
    setShowUserMenu(false);
    setIsOpen(false);
    window.location.replace('/');
  };

  return (
    <nav
      className={`sticky top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
        scrolled
          ? 'bg-gray-900/95 py-3 shadow-[0_14px_34px_rgba(0,0,0,0.35)] backdrop-blur-xl'
          : 'bg-gray-800 py-6'
      }`}
    >
      <div className="px-5 md:px-10 transition-all duration-300">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-700 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-md">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div>
              <span className="block text-xl font-semibold text-white group-hover:text-sky-300 transition-all duration-300 tracking-wide">
                Way Go
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `relative text-slate-200 hover:text-white transition-all duration-300 font-medium group ${
                    isActive ? 'text-white font-bold' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`transition-transform duration-300 ${isActive ? 'scale-105' : ''}`}>
                      {item.name}
                    </span>
                    <span
                      className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-sky-400 transition-all duration-300 ${
                        isActive 
                          ? 'w-full' 
                          : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleNotificationsClick}
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/80 text-slate-100 transition-all duration-300 hover:bg-slate-600"
                  title="Notifications"
                >
                  <FaBell className="h-3.5 w-3.5" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                <div className="relative hidden md:block">
                  <button
                    onClick={() => setShowUserMenu((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-700/80 px-2 py-1 text-slate-100 transition-all duration-300 hover:bg-slate-600"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                      {userInitial}
                    </div>
                    <span className="text-sm font-medium">{displayName}</span>
                    <FaChevronDown className={`h-3 w-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl"
                      >
                        <button
                          onClick={handleProfileClick}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                        >
                          Profile
                        </button>
                        <button
                          onClick={handleEditProfileClick}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-100 transition hover:bg-slate-800"
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={handleLogoutClick}
                          className="w-full px-4 py-2.5 text-left text-sm text-rose-300 transition hover:bg-slate-800 hover:text-rose-200"
                        >
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="hidden md:block rounded-full border border-slate-400 bg-transparent px-5 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-slate-700"
                >
                  Login
                </button>
                <button
                  onClick={handleSignupClick}
                  className="hidden md:block rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-sky-500"
                >
                  Sign Up
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-slate-200 hover:text-white transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <FaTimes className="w-6 h-6" key="close" />
                ) : (
                  <FaBars className="w-6 h-6" key="menu" />
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-gray-900/95 shadow-xl rounded-2xl overflow-hidden mt-4 border border-slate-700"
            >
              <div className="py-4 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => 
                        `block px-6 py-3 text-slate-200 hover:text-white hover:bg-slate-800 transition-all duration-300 font-medium text-lg ${
                          isActive ? 'text-white bg-slate-800 font-bold' : ''
                        }`
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </NavLink>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: navItems.length * 0.1 }}
                  className="px-6 py-3"
                >
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={handleNotificationsClick}
                        className="mb-2 w-full rounded-xl border border-slate-600 px-4 py-3 text-slate-100"
                      >
                        Notifications ({notificationCount})
                      </button>
                      <button
                        onClick={handleProfileClick}
                        className="mb-2 w-full rounded-xl border border-slate-600 px-4 py-3 text-slate-100"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleEditProfileClick}
                        className="mb-2 w-full rounded-xl border border-slate-600 px-4 py-3 text-slate-100"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={handleLogoutClick}
                        className="w-full rounded-xl border border-rose-500/60 px-4 py-3 text-rose-200 transition hover:bg-rose-500/10"
                      >
                        Logout
                      </button>
                    </>
                  ) : null}

                  <button
                    onClick={isAuthenticated ? handleProfileClick : handleLoginClick}
                    className="w-full bg-sky-600 text-white px-6 py-3 rounded-xl shadow-md hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
                  >
                    {isAuthenticated ? `Hi, ${displayName}` : 'Login'}
                  </button>
                  {!isAuthenticated && (
                    <button
                      onClick={handleSignupClick}
                      className="mt-2 w-full border border-slate-500 text-white px-6 py-3 rounded-xl transition-all duration-300 hover:bg-slate-800"
                    >
                      Sign Up
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
