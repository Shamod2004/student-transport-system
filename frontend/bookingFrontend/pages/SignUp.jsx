import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  isValidEmail,
  isValidGender,
  isValidName,
  isValidPassword,
  isValidStudentId
} from "@/lib/validation";
import "../styles/animations.css";

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || "/";
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    gender: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  const redirectAfterAuth = (target) => {
    if (typeof target === "string" && /^https?:\/\//i.test(target)) {
      window.location.assign(target);
      return;
    }

    navigate(target || "/", { replace: true });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!isValidName(formData.firstName)) {
      setError("First name is required");
      return false;
    }
    if (!isValidName(formData.lastName)) {
      setError("Last name is required");
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!isValidStudentId(formData.studentId)) {
      setError("Student ID is required");
      return false;
    }
    if (!isValidGender(formData.gender)) {
      setError("Please select gender");
      return false;
    }
    if (!isValidPassword(formData.password)) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          studentId: formData.studentId,
          gender: formData.gender,
          password: formData.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        login({
          token: data.token,
          user: {
            id: data.user.id,
            name: data.user.name || `${formData.firstName} ${formData.lastName}`,
            email: data.user.email,
            studentId: data.user.studentId || formData.studentId,
            gender: data.user.gender || formData.gender,
            role: "student"
          }
        });
        redirectAfterAuth(redirectTo);
      } else {
        const signUpError = await response.json().catch(() => ({}));
        setError(signUpError.error || "Sign up failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2847] to-[#0f172a] text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="container mx-auto flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md auth-card-appear">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-indigo-600 text-white text-sm font-bold shadow-lg">
                ST
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/70">
                  Student Transport
                </p>
                <h1 className="title-appear anim-delay-1 text-xl font-semibold text-slate-100">Create your account</h1>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0f172a]/70 p-6 shadow-xl">
              <div className="space-y-2 mb-5">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                  Create Account
                </h2>
                <p className="text-sm text-slate-400">
                  Sign up to start booking your student transport.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@university.edu"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="studentId" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Student ID
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    placeholder="STU123456"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="gender" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                    required
                  >
                    <option value="" className="bg-slate-900 text-slate-200">Select gender</option>
                    <option value="male" className="bg-slate-900 text-slate-200">Male</option>
                    <option value="female" className="bg-slate-900 text-slate-200">Female</option>
                    <option value="other" className="bg-slate-900 text-slate-200">Other</option>
                  </select>
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
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                    required
                  />
                  <p className="text-xs text-slate-500">At least 6 characters</p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 shadow-lg"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm">
                <p className="text-slate-400">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-emerald-300 hover:text-emerald-200">
                    Sign In
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

export default SignUp;
