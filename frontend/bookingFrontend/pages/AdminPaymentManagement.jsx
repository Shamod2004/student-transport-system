import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/AdminHeader";
import { useAuth } from "@/context/AuthContext";
import { isValidName } from "@/lib/validation";
import "../styles/animations.css";

const DEFAULT_FORM = {
  studentId: "",
  studentName: "",
  travelRoute: "",
  startDate: "",
  validityPeriod: "1 Day",
  paymentMade: true
};

const AdminPaymentManagement = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState(DEFAULT_FORM);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const toInputDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-CA");
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch("http://localhost:5001/api/admin/payments");
      if (!response.ok) throw new Error("Failed to fetch payments");
      const payload = await response.json();
      setPayments(Array.isArray(payload?.payments) ? payload.payments : []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      showError("Failed to load payments");
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.assign(import.meta.env.VITE_ROUTE_MANAGEMENT_APP_URL || "http://localhost:3000");
  };

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingId(null);
  };

  const handleAddPayment = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEditPayment = (payment) => {
    setEditingId(payment._id);
    setFormData({
      studentId: payment.studentId || "",
      studentName: payment.studentName || "",
      travelRoute: payment.travelRoute || "",
      startDate: toInputDate(payment.startDate),
      validityPeriod: payment.validityPeriod || "1 Day",
      paymentMade: Boolean(payment.paymentMade)
    });
    setShowModal(true);
  };

  const handleDeletePayment = (payment) => {
    setPaymentToDelete(payment);
    setShowDeleteModal(true);
  };

  const validateForm = () => {
    if (!formData.studentId.trim()) {
      showError("Student ID is required");
      return false;
    }
    if (!isValidName(formData.studentName)) {
      showError("Enter a valid student name");
      return false;
    }
    if (!formData.travelRoute.trim()) {
      showError("Travel route is required");
      return false;
    }
    if (!formData.startDate) {
      showError("Start date is required");
      return false;
    }
    return true;
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      studentId: formData.studentId.trim(),
      studentName: formData.studentName.trim(),
      travelRoute: formData.travelRoute.trim(),
      startDate: formData.startDate,
      validityPeriod: formData.validityPeriod,
      paymentMade: Boolean(formData.paymentMade)
    };

    try {
      const url = editingId
        ? `http://localhost:5001/api/admin/payments/${editingId}`
        : "http://localhost:5001/api/admin/payments";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || result?.error || "Failed to save payment");

      showSuccess(editingId ? "Payment updated successfully" : "Payment created successfully");
      setShowModal(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      console.error("Error saving payment:", error);
      showError(error.message || "Failed to save payment");
    }
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete?._id) return;

    try {
      const response = await fetch(`http://localhost:5001/api/admin/payments/${paymentToDelete._id}`, {
        method: "DELETE"
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || payload?.error || "Failed to delete payment");

      showSuccess("Payment deleted successfully");
      setShowDeleteModal(false);
      setPaymentToDelete(null);
      fetchPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      showError(error.message || "Failed to delete payment");
    }
  };

  const filteredPayments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return payments;

    return payments.filter((item) =>
      String(item.studentId || "").toLowerCase().includes(q) ||
      String(item.studentName || "").toLowerCase().includes(q) ||
      String(item.travelRoute || "").toLowerCase().includes(q) ||
      String(item.validityPeriod || "").toLowerCase().includes(q)
    );
  }, [payments, searchTerm]);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-[#040b1a] via-[#0c1932] to-[#020617]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-cyan-500/15 blur-2xl" />
        <div className="absolute right-[-120px] top-[-40px] h-96 w-96 rounded-full bg-blue-500/15 blur-2xl" />
        <div className="absolute bottom-[-140px] left-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-2xl" />
      </div>

      <div className="relative z-10">
        <AdminHeader onLogout={handleLogout} />

        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex gap-8">
            <aside className="w-56 flex-shrink-0">
              <div className="space-y-6 rounded-2xl border border-cyan-200/15 bg-slate-900/45 p-4 shadow-[0_14px_44px_rgba(2,6,23,0.35)] backdrop-blur-sm">
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    ST
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-100/70">School System</p>
                </div>

                <nav className="space-y-1">
                  <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-cyan-100/55">Main Menu</p>

                  <button onClick={() => navigate("/admin/dashboard")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100">
                    <span className="text-lg">📊</span>
                    <span>Dashboard</span>
                  </button>

                  <button onClick={() => navigate("/admin/students")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100">
                    <span className="text-lg">👥</span>
                    <span>Registration Management</span>
                  </button>

                  <button onClick={() => navigate("/admin/bookings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/90 transition-colors duration-200 hover:bg-cyan-500/10 hover:text-cyan-100">
                    <span className="text-lg">🚌</span>
                    <span>Booking Management</span>
                  </button>

                  <button className="group flex w-full items-center gap-3 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-teal-500/20 px-3 py-3 text-sm font-medium text-cyan-100 shadow-md transition-[background,box-shadow] duration-200 hover:from-cyan-500/40 hover:to-teal-500/30">
                    <span className="text-lg">💳</span>
                    <span>Payment Management</span>
                  </button>
                </nav>
              </div>
            </aside>

            <main className="flex-1 space-y-6">
              <section className="section-reveal gradient-flow relative overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-950/70 via-blue-950/60 to-indigo-950/70 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Payment Management</p>
                    <h2 className="hero-text mt-2 text-3xl font-bold bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-200 bg-clip-text text-transparent">
                      Manage Bus Pass Payments
                    </h2>
                    <p className="hero-subtitle mt-2 text-sm text-slate-300">
                      Create, update, and monitor all payment records
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg"
                    onClick={handleAddPayment}
                  >
                    + Add Payment
                  </Button>
                </div>
              </section>

              {successMessage ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/50 p-4 text-sm text-emerald-300">{successMessage}</div>
              ) : null}
              {errorMessage ? (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/50 p-4 text-sm text-rose-300">{errorMessage}</div>
              ) : null}

              <section className="rounded-2xl border border-slate-800/50 bg-slate-900/50 shadow-xl">
                <div className="border-b border-slate-800/50 p-6">
                  <input
                    type="text"
                    placeholder="Search by student ID, name, route, validity..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead>
                      <tr className="border-b border-slate-800/70 bg-slate-900/60 text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-4 py-3">Student ID</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Route</th>
                        <th className="px-4 py-3">Start Date</th>
                        <th className="px-4 py-3">Validity</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length ? (
                        filteredPayments.map((payment) => (
                          <tr key={payment._id} className="border-b border-slate-800/40 text-sm text-slate-200 hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-semibold text-cyan-200">{payment.studentId || "-"}</td>
                            <td className="px-4 py-3">{payment.studentName || "-"}</td>
                            <td className="px-4 py-3">{payment.travelRoute || "-"}</td>
                            <td className="px-4 py-3">{formatDate(payment.startDate)}</td>
                            <td className="px-4 py-3">{payment.validityPeriod || "-"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${payment.paymentMade ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                                {payment.paymentMade ? "Paid" : "Pending"}
                              </span>
                            </td>
                            <td className="px-4 py-3">{formatDate(payment.createdAt)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20" onClick={() => handleEditPayment(payment)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20" onClick={() => handleDeletePayment(payment)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                            No payments found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl rounded-2xl border border-cyan-300/20 bg-slate-900/95 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
            <div className="flex items-center justify-between border-b border-cyan-300/15 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-100">{editingId ? "Edit Payment" : "Add Payment"}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70 text-sm text-cyan-100/70 hover:bg-slate-700 hover:text-cyan-100">×</button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Student ID</label>
                  <input className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100" value={formData.studentId} onChange={(e) => setFormData((prev) => ({ ...prev, studentId: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Student Name</label>
                  <input className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100" value={formData.studentName} onChange={(e) => setFormData((prev) => ({ ...prev, studentName: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Travel Route</label>
                  <input className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100" value={formData.travelRoute} onChange={(e) => setFormData((prev) => ({ ...prev, travelRoute: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Start Date</label>
                  <input type="date" className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100" value={formData.startDate} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-300">Validity Period</label>
                  <select className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-100" value={formData.validityPeriod} onChange={(e) => setFormData((prev) => ({ ...prev, validityPeriod: e.target.value }))}>
                    <option value="1 Day">1 Day</option>
                    <option value="1 Month">1 Month</option>
                  </select>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                <input type="checkbox" checked={Boolean(formData.paymentMade)} onChange={(e) => setFormData((prev) => ({ ...prev, paymentMade: e.target.checked }))} />
                Mark as paid
              </label>

              <div className="flex justify-end gap-3 border-t border-cyan-300/15 pt-4">
                <Button type="button" variant="outline" className="border-cyan-300/35 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/15" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500">
                  {editingId ? "Update Payment" : "Create Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-300/20 bg-slate-900/95 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
            <div className="flex items-center justify-between border-b border-cyan-300/15 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-100">Delete Payment</h2>
              <button onClick={() => { setShowDeleteModal(false); setPaymentToDelete(null); }} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/70 text-sm text-cyan-100/70 hover:bg-slate-700 hover:text-cyan-100">×</button>
            </div>

            <div className="px-6 py-6">
              <p className="text-sm text-slate-200">
                Are you sure you want to delete payment for <span className="font-semibold text-cyan-200">{paymentToDelete?.studentName || "this student"}</span>?
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-cyan-300/15 px-6 py-4">
              <Button variant="outline" className="border-cyan-300/35 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/15" onClick={() => { setShowDeleteModal(false); setPaymentToDelete(null); }}>
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-500" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPaymentManagement;
