import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import "../styles/animations.css";

const initialForm = {
  busImageUrl: "",
  busId: "",
  routeName: "",
  busType: "AC",
  status: "Certified",
  departureTime: "",
  arrivalTime: "",
  departureLocation: "",
  arrivalLocation: "",
  departureDate: "",
  price: ""
};

const AdminRouteManagement = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [routes, setRoutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/routes?limit=200");
      if (!res.ok) throw new Error("Failed to load routes");
      const data = await res.json();
      setRoutes(Array.isArray(data.routes) ? data.routes : []);
    } catch (error) {
      showError(error.message || "Failed to load routes");
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.assign(import.meta.env.VITE_ROUTE_MANAGEMENT_APP_URL || "http://localhost:3000");
  };

  const filteredRoutes = useMemo(() => {
    return routes.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        (item.busId || "").toLowerCase().includes(q) ||
        (item.routeName || "").toLowerCase().includes(q) ||
        (item.departureLocation || "").toLowerCase().includes(q) ||
        (item.arrivalLocation || "").toLowerCase().includes(q)
      );
    });
  }, [routes, searchTerm]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (route) => {
    setEditingId(route._id);
    setFormData({
      busImageUrl: route.busImageUrl || "",
      busId: route.busId || "",
      routeName: route.routeName || "",
      busType: route.busType || "AC",
      status: route.status || "Certified",
      departureTime: route.departureTime || "",
      arrivalTime: route.arrivalTime || "",
      departureLocation: route.departureLocation || "",
      arrivalLocation: route.arrivalLocation || "",
      departureDate: route.departureDate ? String(route.departureDate).split("T")[0] : "",
      price: route.price ?? ""
    });
    setShowModal(true);
  };

  const validateForm = () => {
    if (!formData.busId.trim()) return "Bus ID is required";
    if (!formData.routeName.trim()) return "Route name is required";
    if (!formData.departureLocation.trim()) return "Departure location is required";
    if (!formData.arrivalLocation.trim()) return "Arrival location is required";
    if (!formData.departureDate) return "Departure date is required";
    if (!formData.departureTime) return "Departure time is required";
    if (!formData.arrivalTime) return "Arrival time is required";
    if (formData.price !== "" && (Number.isNaN(Number(formData.price)) || Number(formData.price) < 0)) {
      return "Price must be 0 or more";
    }
    return "";
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    const payload = {
      ...formData,
      busId: formData.busId.trim().toUpperCase(),
      price: formData.price === "" ? 0 : Number(formData.price)
    };

    try {
      const endpoint = editingId
        ? `http://localhost:5001/api/admin/routes/${editingId}`
        : "http://localhost:5001/api/admin/routes";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || "Failed to save route");
      }

      if (editingId) {
        setRoutes((prev) => prev.map((route) => (route._id === editingId ? body : route)));
        showSuccess("Route updated successfully");
      } else {
        setRoutes((prev) => [body, ...prev]);
        showSuccess("Route created successfully");
      }

      setShowModal(false);
    } catch (error) {
      showError(error.message || "Failed to save route");
    }
  };

  const handleDelete = async (routeId) => {
    const ok = window.confirm("Delete this route?");
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:5001/api/admin/routes/${routeId}`, {
        method: "DELETE"
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || "Failed to delete route");
      }

      setRoutes((prev) => prev.filter((route) => route._id !== routeId));
      showSuccess("Route deleted successfully");
    } catch (error) {
      showError(error.message || "Failed to delete route");
    }
  };

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
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-white shadow-lg">
                    ST
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-100/70">School System</p>
                </div>

                <nav className="space-y-1">
                  <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-cyan-100/55">Main Menu</p>
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
                    className="group flex w-full items-center gap-3 rounded-xl border border-cyan-300/35 bg-gradient-to-r from-cyan-500/25 to-teal-500/20 px-3 py-3 text-sm font-medium text-cyan-100 shadow-md transition-[background,box-shadow] duration-200 hover:from-cyan-500/40 hover:to-teal-500/30"
                  >
                    <span className="text-lg">🛣️</span>
                    <span>Route Management</span>
                  </button>
                </nav>

                <div className="rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                    Total Routes
                  </p>
                  <p className="text-2xl font-bold text-cyan-100">{routes.length}</p>
                  <p className="mt-1 text-xs text-cyan-100/65">Managed in system</p>
                </div>
              </div>
            </aside>

            <main className="flex-1 space-y-6">
              <section className="section-reveal gradient-flow relative overflow-hidden rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-950/70 via-blue-950/60 to-indigo-950/70 p-6 shadow-xl backdrop-blur-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Route Management</p>
                    <h2 className="hero-text mt-2 bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-200 bg-clip-text text-3xl font-bold text-transparent">
                      Manage Transport Routes
                    </h2>
                    <p className="hero-subtitle mt-2 text-sm text-slate-300">
                      Add, update and remove route schedules for the booking system
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-6 shadow-lg hover:from-cyan-700 hover:to-teal-700"
                    onClick={openCreateModal}
                  >
                    + Add New Route
                  </Button>
                </div>
              </section>

              {successMessage && (
                <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
                  {errorMessage}
                </div>
              )}

              <section className="rounded-2xl border border-cyan-300/20 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Search by bus id, route name, from, to"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-lg border border-cyan-300/20 bg-slate-900/60 px-4 py-2.5 text-sm text-cyan-100 outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead>
                      <tr className="border-b border-cyan-300/15 text-xs uppercase tracking-wider text-cyan-100/70">
                        <th className="px-3 py-3">Bus ID</th>
                        <th className="px-3 py-3">Route</th>
                        <th className="px-3 py-3">From</th>
                        <th className="px-3 py-3">To</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Time</th>
                        <th className="px-3 py-3">Price</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoutes.map((route) => (
                        <tr key={route._id} className="border-b border-cyan-300/10">
                          <td className="px-3 py-3 font-semibold text-cyan-100">{route.busId}</td>
                          <td className="px-3 py-3">{route.routeName}</td>
                          <td className="px-3 py-3">{route.departureLocation}</td>
                          <td className="px-3 py-3">{route.arrivalLocation}</td>
                          <td className="px-3 py-3">{route.departureDate ? new Date(route.departureDate).toLocaleDateString() : "-"}</td>
                          <td className="px-3 py-3">{route.departureTime} - {route.arrivalTime}</td>
                          <td className="px-3 py-3">LKR {Number(route.price || 0).toLocaleString()}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(route)}
                                className="rounded-md border border-cyan-300/30 px-2.5 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(route._id)}
                                className="rounded-md border border-rose-300/30 px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-500/20"
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
              </section>
            </main>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-cyan-300/20 bg-slate-900/95 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.65)]">
            <h3 className="mb-5 text-lg font-semibold text-slate-100">
              {editingId ? "Edit Route" : "Add Route"}
            </h3>

            <div className="grid gap-3 md:grid-cols-2">
              <input name="busId" value={formData.busId} onChange={handleInputChange} placeholder="Bus ID" className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="routeName" value={formData.routeName} onChange={handleInputChange} placeholder="Route Name" className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="departureLocation" value={formData.departureLocation} onChange={handleInputChange} placeholder="Departure Location" className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="arrivalLocation" value={formData.arrivalLocation} onChange={handleInputChange} placeholder="Arrival Location" className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="departureDate" type="date" value={formData.departureDate} onChange={handleInputChange} className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="price" type="number" min="0" value={formData.price} onChange={handleInputChange} placeholder="Price" className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="departureTime" type="time" value={formData.departureTime} onChange={handleInputChange} className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="arrivalTime" type="time" value={formData.arrivalTime} onChange={handleInputChange} className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100" />
              <input name="busImageUrl" value={formData.busImageUrl} onChange={handleInputChange} placeholder="Bus Image URL (optional)" className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100 md:col-span-2" />
              <select name="busType" value={formData.busType} onChange={handleInputChange} className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100">
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Luxury">Luxury</option>
              </select>
              <select name="status" value={formData.status} onChange={handleInputChange} className="rounded-lg border border-cyan-300/20 bg-slate-900/60 px-3 py-2 text-sm text-cyan-100">
                <option value="Certified">Certified</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-full border-cyan-300/35 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/15"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                onClick={handleSave}
              >
                {editingId ? "Update Route" : "Create Route"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRouteManagement;
