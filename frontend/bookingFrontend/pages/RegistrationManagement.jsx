import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/AdminHeader";
import { ChevronDown, Bell, Trash2, Edit2 } from "lucide-react";
import {
  isValidAddress,
  isValidEmail,
  isValidGender,
  isValidName,
  isValidPassword,
  isValidPhoneNumber
} from "@/lib/validation";
import "../styles/animations.css";

const RegistrationManagement = () => {
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const [registrationType, setRegistrationType] = useState("students");
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "",
    address: ""
  });

  const getItemId = (item) => item?._id || item?.id || null;

  useEffect(() => {
    if (!token) return;
    fetchStudents();
    fetchAdmins();
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/users/students", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      showError("Failed to load students");
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/users/admins", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch admins");
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
      showError("Failed to load admins");
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const handleLogout = () => {
    logout();
    window.location.assign(import.meta.env.VITE_ROUTE_MANAGEMENT_APP_URL || "http://localhost:3000");
  };

  const getFilteredData = () => {
    const data = registrationType === "students" ? students : admins;
    return data.filter((item) =>
      (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.studentId || "").includes(searchTerm)
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!isValidName(formData.name)) {
      showError("Name is required");
      return false;
    }
    if (!isValidEmail(formData.email)) {
      showError("Valid email is required");
      return false;
    }
    if (!editingId && !isValidPassword(formData.password)) {
      showError("Password is required");
      return false;
    }

    if (editingId && formData.password.trim() && !isValidPassword(formData.password)) {
      showError("Password must be at least 6 characters");
      return false;
    }

    if (registrationType === "students") {
      if (!isValidPhoneNumber(formData.phone)) {
        showError("Valid phone number is required");
        return false;
      }

      if (!isValidGender(formData.gender)) {
        showError("Please select gender");
        return false;
      }

      if (!isValidAddress(formData.address)) {
        showError("Address is required");
        return false;
      }
    }

    return true;
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      gender: "",
      address: ""
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    const itemId = getItemId(item);
    if (!itemId) {
      showError("Unable to edit this record. Missing ID.");
      return;
    }
    setEditingId(itemId);
    setFormData({
      name: item.name || "",
      email: item.email || "",
      password: "",
      phone: item.phone || "",
      gender: item.gender || "",
      address: item.address || ""
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const endpoint =
      registrationType === "students"
        ? `http://localhost:5001/api/users/students`
        : `http://localhost:5001/api/users/admins`;

    const payload = {
      name: formData.name,
      email: formData.email,
      ...(formData.password && { password: formData.password }),
      ...(registrationType === "students" && {
        phone: formData.phone,
        gender: formData.gender,
        address: formData.address
      })
    };

    try {
      if (editingId) {
        const response = await fetch(`${endpoint}/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const updated = await response.json();
        if (!response.ok) throw new Error(updated?.error || "Failed to update");
        if (registrationType === "students") {
          setStudents((prev) =>
            prev.map((s) =>
              getItemId(s) === editingId
                ? {
                    ...s,
                    ...updated,
                    notificationCount: s.notificationCount || 0,
                    unreadNotificationCount: s.unreadNotificationCount || 0,
                    latestNotificationMessage: s.latestNotificationMessage || "",
                    latestNotificationAt: s.latestNotificationAt || null
                  }
                : s
            )
          );
        } else {
          setAdmins((prev) =>
            prev.map((a) => (getItemId(a) === editingId ? updated : a))
          );
        }
        showSuccess(`${registrationType === "students" ? "Student" : "Admin"} updated successfully!`);
      } else {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const newItem = await response.json();
          if (!response.ok) throw new Error(newItem?.error || "Failed to create");
        if (registrationType === "students") {
          setStudents((prev) => [
            {
              ...newItem,
              notificationCount: 0,
              unreadNotificationCount: 0,
              latestNotificationMessage: "",
              latestNotificationAt: null
            },
            ...prev
          ]);
        } else {
          setAdmins((prev) => [newItem, ...prev]);
        }
        showSuccess(`${registrationType === "students" ? "Student" : "Admin"} added successfully!`);
      }
      setShowModal(false);
    } catch (err) {
      showError(err.message || `Failed to ${editingId ? "update" : "add"} ${registrationType === "students" ? "student" : "admin"}`);
    }
  };

  const openDeleteModal = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const targetId = getItemId(deleteTarget);
    if (!targetId) {
      showError("Unable to delete this record. Missing ID.");
      return;
    }

    const endpoint =
      registrationType === "students"
        ? `http://localhost:5001/api/users/students/${targetId}`
        : `http://localhost:5001/api/users/admins/${targetId}`;

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      let responseBody = null;
      try {
        responseBody = await response.json();
      } catch (_err) {
        // Some delete responses may not include JSON.
      }
      if (!response.ok) throw new Error(responseBody?.error || "Failed to delete");

      if (registrationType === "students") {
        setStudents((prev) => prev.filter((s) => getItemId(s) !== targetId));
      } else {
        setAdmins((prev) => prev.filter((a) => getItemId(a) !== targetId));
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      showSuccess(`${registrationType === "students" ? "Student" : "Admin"} deleted successfully!`);
    } catch (err) {
      showError(err.message || "Failed to delete");
    }
  };

  const filteredData = getFilteredData();
  const totalCount = registrationType === "students" ? students.length : admins.length;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-[#040b1a] via-[#0c1932] to-[#020617]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="absolute right-[-120px] top-[-40px] h-96 w-96 rounded-full bg-blue-500/15 blur-2xl" />
        <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)]" />
      </div>

      <div className="relative z-10">
      <AdminHeader onLogout={handleLogout} />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="space-y-6 rounded-2xl border border-cyan-200/15 bg-slate-900/45 p-4 shadow-[0_14px_44px_rgba(2,6,23,0.35)] backdrop-blur-sm">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  ST
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-100/70">
                    School System
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-cyan-100/55">
                  Main Menu
                </p>

                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                >
                  <span className="text-lg">📊</span>
                  <span>Dashboard</span>
                </button>

                <button
                  className="group flex w-full items-center gap-3 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-teal-500/20 px-3 py-3 text-sm font-medium text-cyan-100 shadow-md transition-[background,box-shadow] duration-200 hover:from-cyan-500/40 hover:to-teal-500/30"
                >
                  <span className="text-lg">👥</span>
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

              <div className="rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                  {registrationType === "students" ? "Total Students" : "Total Admins"}
                </p>
                <p className="text-2xl font-bold text-cyan-100">{totalCount}</p>
                <p className="mt-1 text-xs text-cyan-100/65">
                  {registrationType === "students" ? "Currently registered" : "Active admins"}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Header section with dropdown */}
            <section className="section-reveal gradient-flow relative overflow-visible rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-950/70 via-blue-950/60 to-indigo-950/70 p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Registration System
                  </p>
                  <h2 className="hero-text mt-2 text-3xl font-bold bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
                    Registration Management
                  </h2>
                  <p className="hero-subtitle mt-2 text-sm text-slate-300">
                    Manage student and admin registrations
                  </p>
                </div>
                <div className="flex gap-3 items-center">
                  <div ref={dropdownRef} className="relative z-30">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-slate-900/55 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-slate-900/80 transition-colors duration-200"
                    >
                      {registrationType === "students" ? "👤 Students" : "🔐 Admins"}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 z-20 w-56 rounded-lg border border-cyan-300/20 bg-slate-900 shadow-lg">
                        <button
                          onClick={() => {
                            setRegistrationType("students");
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                            registrationType === "students"
                              ? "bg-cyan-500/15 text-cyan-200 border-b border-cyan-300/20"
                              : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <span className="text-lg">👤</span>
                          <div>
                            <p className="font-semibold">Students Registration Details</p>
                            <p className="text-xs text-slate-500">Manage student registrations</p>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setRegistrationType("admins");
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                            registrationType === "admins"
                              ? "bg-cyan-500/15 text-cyan-200"
                              : "text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          <span className="text-lg">🔐</span>
                          <div>
                            <p className="font-semibold">Admin Registration Details</p>
                            <p className="text-xs text-slate-500">Manage admin accounts</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                    onClick={handleAdd}
                  >
                    + Add New {registrationType === "students" ? "Student" : "Admin"}
                  </Button>
                </div>
              </div>
            </section>

            {/* Toast notifications */}
            {successMessage && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 p-4 flex items-center gap-3">
                <span className="text-xl">✨</span>
                <p className="text-sm text-emerald-300">{successMessage}</p>
              </div>
            )}
            {errorMessage && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/50 p-4 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm text-rose-300">{errorMessage}</p>
              </div>
            )}

            {/* Search bar */}
            <section className="rounded-2xl border border-slate-800/50 bg-slate-900/50 shadow-xl">
              <div className="border-b border-slate-800/50 p-6">
                <input
                  type="text"
                  placeholder={`🔍 Search by name, email, or ${registrationType === "students" ? "student" : ""} ID...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-[border-color,box-shadow]"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-max">
                  <thead className="border-b border-slate-800/50 bg-slate-950/40 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">
                        Email
                      </th>
                      {registrationType === "students" && (
                        <>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">
                            Phone
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">
                            Gender
                          </th>
                        </>
                      )}
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          <span>Alerts</span>
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">
                        Registered
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-3 py-6 text-center text-slate-400">
                          No {registrationType} found
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr
                          key={getItemId(item) || item.email}
                          className="border-b border-slate-800/30 bg-slate-900/30 transition-colors hover:bg-slate-900/60 hover:border-slate-700/50"
                        >
                          <td className="px-3 py-2 text-xs font-semibold text-slate-100 whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-400 truncate max-w-[180px]">
                            {item.email}
                          </td>
                          {registrationType === "students" && (
                            <>
                              <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">
                                {item.phone || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-400 capitalize whitespace-nowrap">
                                {item.gender || "N/A"}
                              </td>
                            </>
                          )}
                          <td className="px-3 py-2 text-xs">
                            {registrationType === "students" ? (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium whitespace-nowrap ${
                                (item.unreadNotificationCount || 0) > 0
                                  ? "bg-amber-500/20 text-amber-300"
                                  : (item.notificationCount || 0) > 0
                                    ? "bg-blue-500/20 text-blue-300"
                                    : "bg-slate-700/50 text-slate-300"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${(item.unreadNotificationCount || 0) > 0 ? "bg-amber-400" : (item.notificationCount || 0) > 0 ? "bg-blue-400" : "bg-slate-400"}`} />
                                {(item.unreadNotificationCount || 0) > 0
                                  ? `${item.unreadNotificationCount}U`
                                  : (item.notificationCount || 0) > 0
                                    ? `${item.notificationCount}T`
                                    : "—"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-[9px] font-medium text-slate-300 whitespace-nowrap">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(item.createdAt || new Date()).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-xs text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleEdit(item)}
                                className="inline-flex items-center gap-0.5 rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 text-[9px] font-medium text-slate-300 hover:bg-slate-800 transition-colors whitespace-nowrap"
                              >
                                <Edit2 className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="inline-flex items-center gap-0.5 rounded-md border border-rose-700/50 bg-rose-950/30 px-2 py-1 text-[9px] font-medium text-rose-300 hover:bg-rose-950/50 transition-colors whitespace-nowrap"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  </table>
                </div>
              </section>
            </main>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-100">
                {editingId ? "Edit" : "Add New"} {registrationType === "students" ? "Student" : "Admin"}
              </h3>
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {!editingId && (
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                )}
                {registrationType === "students" && (
                  <>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </>
                )}
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {editingId ? "Update" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-900/95 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
              <div className="flex items-center justify-between border-b border-cyan-300/15 px-6 py-5">
                <h3 className="text-lg font-semibold text-slate-100">Confirm Delete</h3>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70 text-sm text-cyan-100/70 transition-colors hover:bg-slate-700 hover:text-cyan-100"
                >
                  ×
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-200">
                  🗑️
                </div>
                <p className="text-center text-sm text-slate-200">
                  Delete {registrationType === "students" ? "student" : "admin"} <span className="font-semibold">{deleteTarget?.name || "this record"}</span>?
                </p>
                <p className="mt-2 text-center text-xs text-cyan-100/55">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-cyan-300/15 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="min-w-[96px] rounded-full border-cyan-300/35 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/15"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="min-w-[96px] rounded-full bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-500"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default RegistrationManagement;
