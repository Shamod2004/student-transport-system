import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AdminHeader from "@/components/AdminHeader";
import { ChevronDown, Bell } from "lucide-react";
import {
  isValidEmail,
  isValidGender,
  isValidName,
  isValidPhoneNumber,
  isValidStudentId
} from "@/lib/validation";

const RegistrationManagement = () => {
  const navigate = useNavigate();
  const { admin, logout, token } = useAuth();
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
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    phone: "",
    gender: ""
  });

  useEffect(() => {
    fetchStudents();
    fetchAdmins();
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

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.includes(searchTerm) ||
        (student.gender || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!isValidName(formData.firstName)) {
      showError("First name is required");
      return false;
    }
    if (!isValidName(formData.lastName)) {
      showError("Last name is required");
      return false;
    }
    if (!isValidEmail(formData.email)) {
      showError("Valid email is required");
      return false;
    }
    if (!isValidStudentId(formData.studentId)) {
      showError("Student ID is required");
      return false;
    }
    if (!isValidPhoneNumber(formData.phone)) {
      showError("Valid phone number is required");
      return false;
    }
    if (!isValidGender(formData.gender)) {
      showError("Please select gender");
      return false;
    }
    return true;
  };

  const handleAddStudent = () => {
    setEditingId(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      studentId: "",
      phone: "",
      gender: ""
    });
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingId(student._id);
    setFormData({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      email: student.email || "",
      studentId: student.studentId || "",
      phone: student.phone || "",
      gender: student.gender || ""
    });
    setShowModal(true);
  };

  const handleSaveStudent = () => {
    if (!validateForm()) return;

    if (editingId) {
      fetch(`http://localhost:5001/api/admin/students/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
        .then(res => res.json())
        .then(updatedStudent => {
          setStudents((prev) =>
            prev.map((s) => (s._id === editingId ? updatedStudent : s))
          );
          setShowModal(false);
          showSuccess("Student updated successfully!");
        })
        .catch(err => {
          console.error("Update error:", err);
          showError("Failed to update student");
        });
    } else {
      fetch("http://localhost:5001/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
        .then(res => res.json())
        .then(newStudent => {
          setStudents((prev) => [newStudent, ...prev]);
          setShowModal(false);
          setEditingId(null);
          showSuccess("Student added successfully!");
        })
        .catch(err => {
          console.error("Create error:", err);
          showError("Failed to add student");
        });
    }
  };

  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete?._id) return;

    fetch(`http://localhost:5001/api/admin/students/${studentToDelete._id}`, {
      method: "DELETE"
    })
      .then(() => {
        setStudents((prev) => prev.filter((s) => s._id !== studentToDelete._id));
        setShowDeleteModal(false);
        setStudentToDelete(null);
        showSuccess("Student deleted successfully!");
      })
      .catch(err => {
        console.error("Delete error:", err);
        showError("Failed to delete student");
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2847] to-[#0f172a]">
      <AdminHeader onLogout={handleLogout} />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-56 flex-shrink-0">
            <div className="space-y-6">
              {/* Logo Area */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  ST
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    School System
                  </p>
                </div>
              </div>

              {/* Main Menu */}
              <nav className="space-y-1">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Main Menu
                </p>

                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors duration-200"
                >
                  <span className="text-lg">📊</span>
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => navigate("/admin/students")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600/80 to-indigo-600/80 text-white font-medium text-sm shadow-md hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                >
                  <span className="text-lg">👤</span>
                  <span>Student Registrations</span>
                </button>

                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors duration-200"
                >
                  <span className="text-lg">🚌</span>
                  <span>Booking Management</span>
                </button>
              </nav>

              {/* System Status Card */}
              <div className="rounded-lg border border-white/10 bg-gradient-to-br from-blue-950/50 to-blue-900/20 p-4">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Total Students
                </p>
                <p className="text-2xl font-bold text-blue-300">{students.length}</p>
                <p className="text-xs text-blue-400/60 mt-1">Currently registered</p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
          {/* Header section */}
          <section className="rounded-2xl border border-slate-800/50 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-transparent p-6 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Student Management
                </p>
                <h2 className="mt-2 text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Student Registrations
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Manage and track all student registrations
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-full px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                onClick={handleAddStudent}
              >
                + Add New Student
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

          {/* Search bar */}
          <section className="rounded-2xl border border-slate-800/50 bg-slate-900/50 shadow-xl">
            <div className="border-b border-slate-800/50 p-6">
              <input
                type="text"
                placeholder="🔍 Search by name, email, or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-800/50 bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Student ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Gender
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Registered
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="border-b border-slate-800/30 bg-slate-900/30 transition-all hover:bg-slate-900/60 hover:border-slate-700/50"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-slate-100">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        <span className="rounded-lg bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
                          {student.studentId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {student.phone || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 capitalize">
                        {student.gender || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="rounded-full bg-blue-600/20 px-4 py-1.5 text-xs font-semibold text-blue-300 transition-all hover:bg-blue-600/40 hover:shadow-lg border border-blue-500/30"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(student)}
                            className="rounded-full bg-rose-600/20 px-4 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-600/40 hover:shadow-lg border border-rose-500/30"
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

            {filteredStudents.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-4xl mb-3">🎓</p>
                <p className="text-sm text-slate-400">No students found</p>
              </div>
            )}
          </section>
        </main>
      </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
          <div className="mx-4 w-full max-w-lg rounded-xl border border-white/10 bg-gradient-to-b from-[#1a2847]/95 to-[#0f172a]/95 shadow-2xl animation-scaleup">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  {editingId ? "✏️ Edit Student" : "➕ Add New Student"}
                </h2>
                <p className="text-xs text-slate-400 mt-1.5">
                  {editingId ? "Update student information" : "Register a new student"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-slate-200 transition-all duration-200"
              >
                ✕
              </button>
            </div>

            {/* Form content */}
            <div className="space-y-5 px-6 py-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all backdrop-blur-sm hover:border-white/20"
                  placeholder="e.g. John"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all backdrop-blur-sm hover:border-white/20"
                  placeholder="e.g. Doe"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all backdrop-blur-sm hover:border-white/20"
                    placeholder="e.g. IT23284302"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all backdrop-blur-sm hover:border-white/20"
                    placeholder="+94 77 123 4567"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all backdrop-blur-sm hover:border-white/20"
                  >
                    <option value="" className="bg-slate-900 text-slate-200">Select gender</option>
                    <option value="male" className="bg-slate-900 text-slate-200">Male</option>
                    <option value="female" className="bg-slate-900 text-slate-200">Female</option>
                    <option value="other" className="bg-slate-900 text-slate-200">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30 transition-all backdrop-blur-sm hover:border-white/20"
                  placeholder="student@example.com"
                />
              </div>

              <div className="rounded-lg bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 p-4 mt-2">
                <p className="text-xs text-blue-300/90 leading-relaxed">
                  <span className="font-semibold">💡 Info:</span> Fields marked with * are required. All changes are saved instantly.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/5 px-6 py-4 bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
              <Button
                variant="outline"
                className="min-w-[100px] rounded-full border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-slate-100"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="min-w-[120px] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                onClick={handleSaveStudent}
              >
                {editingId ? "Save Changes" : "Add Student"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-lg">
          <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-gradient-to-b from-[#1a2847]/95 to-[#0f172a]/95 shadow-2xl text-center animation-scaleup">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-5 bg-gradient-to-r from-rose-600/10 to-red-600/10">
              <h2 className="text-lg font-bold bg-gradient-to-r from-rose-400 to-red-400 bg-clip-text text-transparent">Confirm Delete</h2>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-sm text-slate-400 hover:text-slate-200 transition-all duration-200"
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
                Delete {studentToDelete?.firstName} {studentToDelete?.lastName}?
              </p>
              <p className="text-xs text-slate-400">
                This action cannot be undone. The student record will be permanently removed from the system.
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

      <style jsx>{`
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

export default StudentRegistrations;
