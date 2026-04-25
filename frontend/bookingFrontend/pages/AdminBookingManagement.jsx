import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/AdminHeader";
import {
  isValidEmail,
  isValidGender,
  isValidName,
  isValidSeatNumber
} from "@/lib/validation";
import "../styles/animations.css";

const AdminBookingManagement = () => {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    studentName: "",
    studentEmail: "",
    gender: "",
    route: "",
    seatNumber: "",
    departureDate: "",
    status: "Booked",
    price: ""
  });

  const toCanonicalStatus = (value) => {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "booked" || normalized === "confirmed") return "Booked";
    if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
    return value || "Booked";
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/admin/bookings");
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showError("Failed to load bookings");
    }
  };

  useEffect(() => {
    fetchBookings();

    // Keep CRUD view synced with live seat changes done from student notification flow.
    const intervalId = setInterval(fetchBookings, 10000);
    return () => clearInterval(intervalId);
  }, []);

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

  const filteredBookings = bookings.filter(
    (booking) =>
      booking.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.seatNumber?.toString().includes(searchTerm) ||
      (booking.gender || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!isValidName(formData.studentName)) {
      showError("Student name is required");
      return false;
    }
    if (formData.studentEmail.trim() && !isValidEmail(formData.studentEmail)) {
      showError("Student email must be valid");
      return false;
    }
    if (!formData.route.trim()) {
      showError("Route is required");
      return false;
    }
    if (!isValidSeatNumber(formData.seatNumber)) {
      showError("Seat number is required");
      return false;
    }
    if (!isValidGender(formData.gender)) {
      showError("Booking gender is required");
      return false;
    }
    if (!formData.departureDate) {
      showError("Departure date is required");
      return false;
    }
    if (formData.price && (Number.isNaN(Number(formData.price)) || Number(formData.price) <= 0)) {
      showError("Price must be a valid number");
      return false;
    }
    return true;
  };

  const handleAddBooking = () => {
    setEditingId(null);
    setFormData({
      studentName: "",
      studentEmail: "",
      gender: "",
      route: "",
      seatNumber: "",
      departureDate: "",
      status: "Booked",
      price: ""
    });
    setShowModal(true);
  };

  const handleEditBooking = (booking) => {
    setEditingId(booking._id);
    setFormData({
      studentName: booking.studentName,
      studentEmail: booking.studentEmail,
      gender: booking.gender || "",
      route: booking.route,
      seatNumber: booking.seatNumber,
      departureDate: booking.departureDate?.split("T")[0] || "",
      status: toCanonicalStatus(booking.status),
      price: booking.price
    });
    setShowModal(true);
  };

  const handleSaveBooking = () => {
    if (!validateForm()) return;

    const payload = {
      ...formData,
      status: toCanonicalStatus(formData.status)
    };

    if (editingId) {
      fetch(`http://localhost:5001/api/admin/bookings/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed to update booking");
          return data;
        })
        .then(updatedBooking => {
          setBookings((prev) =>
            prev.map((b) => (b._id === editingId ? updatedBooking : b))
          );
          setShowModal(false);
          showSuccess("Booking updated successfully!");
        })
        .catch(err => {
          console.error("Update error:", err);
          showError(err.message || "Failed to update booking");
        });
    } else {
      fetch("http://localhost:5001/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed to add booking");
          return data;
        })
        .then(newBooking => {
          setBookings((prev) => [newBooking, ...prev]);
          setShowModal(false);
          showSuccess("Booking added successfully!");
        })
        .catch(err => {
          console.error("Create error:", err);
          showError(err.message || "Failed to add booking");
        });
    }
  };

  const openDeleteModal = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!bookingToDelete?._id) return;

    fetch(`http://localhost:5001/api/admin/bookings/${bookingToDelete._id}`, {
      method: "DELETE"
    })
      .then(async (res) => {
        if (!res.ok) {
          let message = "Failed to delete booking";
          try {
            const data = await res.json();
            message = data?.error || message;
          } catch (_err) {
            // Keep fallback message.
          }
          throw new Error(message);
        }
      })
      .then(() => {
        setBookings((prev) => prev.filter((b) => b._id !== bookingToDelete._id));
        setShowDeleteModal(false);
        setBookingToDelete(null);
        showSuccess("Booking deleted successfully!");
      })
      .catch(err => {
        console.error("Delete error:", err);
        showError(err.message || "Failed to delete booking");
      });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      booked: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      confirmed: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      pending: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      completed: "bg-sky-500/20 text-sky-300 border border-sky-500/30",
      cancelled: "bg-rose-500/20 text-rose-300 border border-rose-500/30"
    };
    return statusMap[String(status || "").toLowerCase()] || "bg-slate-500/20 text-slate-300 border border-slate-500/30";
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
      <AdminHeader onLogout={handleLogout} />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="space-y-6 rounded-2xl border border-cyan-200/15 bg-slate-900/45 p-4 shadow-[0_14px_44px_rgba(2,6,23,0.35)] backdrop-blur-sm">
              {/* Logo Area */}
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

              {/* Main Menu */}
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
                  onClick={() => navigate("/admin/students")}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100"
                >
                  <span className="text-lg">�</span>
                  <span>Registration Management</span>
                </button>

                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="group flex w-full items-center gap-3 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-teal-500/20 px-3 py-3 text-sm font-medium text-cyan-100 shadow-md transition-[background,box-shadow] duration-200 hover:from-cyan-500/40 hover:to-teal-500/30"
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
                  <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-cyan-100">{bookings.length}</p>
                <p className="mt-1 text-xs text-cyan-100/65">All bookings</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
          {/* Header section */}
          <section className="section-reveal gradient-flow relative overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-950/70 via-blue-950/60 to-indigo-950/70 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Booking Management
                </p>
                <h2 className="hero-text mt-2 text-3xl font-bold bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
                  Manage Transport Bookings
                </h2>
                <p className="hero-subtitle mt-2 text-sm text-slate-300">
                  Review, update and track all student transport bookings
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-full px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg"
                onClick={handleAddBooking}
              >
                + Add New Booking
              </Button>
            </div>
          </section>

          {/* Toast notifications */}
          {successMessage && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 p-4 flex items-center gap-3 animation-slidedown">
              <span className="text-xl">✨</span>
              <p className="text-sm text-emerald-300">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/50 p-4 flex items-center gap-3 animation-slidedown">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-rose-300">{errorMessage}</p>
            </div>
          )}

          {/* Search bar and table */}
          <section className="rounded-2xl border border-slate-800/50 bg-slate-900/50 shadow-xl">
            <div className="border-b border-slate-800/50 p-6">
              <input
                type="text"
                placeholder="🔍 Search by student name, route, or seat number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-[border-color,box-shadow]"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-800/50 bg-slate-950/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Route
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Seat
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Gender
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Departure
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking._id}
                      className="border-b border-slate-800/30 bg-slate-900/30 transition-colors hover:bg-slate-900/60 hover:border-slate-700/50"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-100">
                        {booking.studentName}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <span className="rounded-lg bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-300">
                          {booking.route}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <span className="rounded-lg bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
                          {booking.seatNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 capitalize">
                        {booking.gender ? (
                          <span className={`rounded-lg px-2 py-1 text-xs font-medium ${
                            String(booking.gender).toLowerCase() === "female"
                              ? "bg-pink-500/20 text-pink-300"
                              : String(booking.gender).toLowerCase() === "male"
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-slate-500/20 text-slate-300"
                          }`}>
                            {booking.gender}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {booking.departureDate
                          ? new Date(booking.departureDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-200">
                        Rs. {booking.price || "0"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                            booking.status
                          )}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditBooking(booking)}
                            className="rounded-full border border-orange-500/30 bg-orange-600/20 px-3 py-1 text-[11px] font-semibold text-orange-300 transition-[background-color,box-shadow] hover:bg-orange-600/40 hover:shadow-lg"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(booking)}
                            className="rounded-full border border-rose-500/30 bg-rose-600/20 px-3 py-1 text-[11px] font-semibold text-rose-300 transition-[background-color,box-shadow] hover:bg-rose-600/40 hover:shadow-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredBookings.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">🚌</p>
                <p className="text-sm text-slate-400">No bookings found</p>
              </div>
            )}
          </section>
        </main>
      </div>
      </div>
      </div>

      {/* Add/Edit Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="mx-4 w-full max-w-2xl rounded-xl border border-white/10 bg-gradient-to-b from-[#1a2847]/95 to-[#0f172a]/95 shadow-2xl animation-scaleup my-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-gradient-to-r from-orange-600/10 via-amber-600/10 to-transparent">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  {editingId ? "✏️ Edit Booking" : "🎫 Add New Booking"}
                </h2>
                <p className="text-xs text-slate-400 mt-1.5">
                  {editingId ? "Update booking details" : "Create a new transport booking"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            {/* Form content */}
            <div className="space-y-5 px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Student Email
                  </label>
                  <input
                    type="email"
                    name="studentEmail"
                    value={formData.studentEmail}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Route *
                  </label>
                  <input
                    type="text"
                    name="route"
                    value={formData.route}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                    placeholder="e.g. Route A - City Center"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Seat Number *
                  </label>
                  <input
                    type="text"
                    name="seatNumber"
                    value={formData.seatNumber}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                    placeholder="e.g. A1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Booking Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    name="departureDate"
                    value={formData.departureDate}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                    placeholder="1500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/30 transition-[border-color,box-shadow] hover:border-white/20"
                  >
                    <option value="Booked">Booked</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-orange-600/10 to-amber-600/10 border border-orange-500/20 p-4 mt-2">
                <p className="text-xs text-orange-300/90 leading-relaxed">
                  <span className="font-semibold">💡 Info:</span> Fields marked with * are required. Changes are saved instantly.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/5 px-6 py-4 bg-gradient-to-r from-orange-600/5 to-amber-600/5">
              <Button
                variant="outline"
                className="min-w-[100px] rounded-full border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="min-w-[120px] rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg"
                onClick={handleSaveBooking}
              >
                {editingId ? "Save Changes" : "Add Booking"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-gradient-to-b from-[#1a2847]/95 to-[#0f172a]/95 shadow-2xl text-center animation-scaleup">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-gradient-to-r from-rose-600/10 to-red-600/10">
              <h2 className="text-lg font-bold bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">Confirm Delete</h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30">
                <span className="text-3xl">🗑️</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 mb-1">
                Delete booking for {bookingToDelete?.studentName}?
              </p>
              <p className="text-xs text-slate-400">
                This action cannot be undone. The booking record will be permanently removed.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800/50 px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900">
              <Button
                variant="outline"
                className="min-w-[100px] rounded-full border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="min-w-[100px] rounded-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-lg"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slidedown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleup {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animation-slidedown {
          animation: slidedown 0.3s ease-out;
        }

        .animation-scaleup {
          animation: scaleup 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminBookingManagement;
