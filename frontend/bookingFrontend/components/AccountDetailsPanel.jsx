import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { isValidName, isValidPhoneNumber } from "@/lib/validation";
import { toast } from "sonner";
import { X, User, PencilLine } from "lucide-react";

const AccountDetailsPanel = ({ open, onClose }) => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    address: "",
  });

  useEffect(() => {
    if (!open || !user) return;
    setForm({
      name: user.name || "",
      phone: user.phone || "",
      gender: user.gender || "",
      address: user.address || "",
    });
    setIsEditing(false);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };

  const handleSave = async () => {
    if (!token) {
      toast.error("Please login again");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!isValidName(form.name)) {
      toast.error("Enter a valid name");
      return;
    }

    if (form.phone.trim() && !isValidPhoneNumber(form.phone)) {
      toast.error("Enter a valid phone number");
      return;
    }

    setIsSaving(true);
    try {
      // Update user profile
      const userResponse = await fetch("http://localhost:5001/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          gender: form.gender,
          address: form.address,
        }),
      });

      if (!userResponse.ok) {
        throw new Error("Failed to update profile");
      }

      const userData = await userResponse.json();
      updateUser(userData.user);

      // Also update student registration in RegistrationManagement if user has studentId
      if (user.studentId) {
        try {
          await fetch(`http://localhost:5001/api/users/students/${user.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: form.name,
              email: user.email,
              phone: form.phone,
              gender: form.gender,
              address: form.address,
            }),
          });
        } catch (err) {
          console.warn("Could not sync student registration, but user profile updated:", err);
        }
      }

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Could not update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open || !user) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] panel-overlay-fade" onClick={onClose} />

      <div className="no-scrollbar panel-pop-in fixed right-4 top-20 z-50 w-[min(90vw,304px)] max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-sky-50 text-slate-800 shadow-[0_22px_48px_rgba(15,23,42,0.16)]">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 px-3 py-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Account</p>
              <h2 className="text-sm font-bold text-slate-900">Profile Details</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 px-2.5 py-2.5">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-[0_8px_16px_rgba(15,23,42,0.05)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-md">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name || "Student"}</p>
              <p className="truncate text-[10px] text-slate-600">{user.email || "-"}</p>
            </div>
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-1">
                <PencilLine className="h-3 w-3" />
                {isEditing ? "Cancel" : "Edit"}
              </span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-[0_8px_16px_rgba(15,23,42,0.05)]">
            <div className="grid gap-2">
              <div>
                <Label className="text-[10px] text-slate-600">Student ID</Label>
                <Input value={user.studentId || "-"} disabled className="mt-1 h-8 border-slate-200 bg-slate-50 text-xs text-slate-700 cursor-default" />
              </div>
              <div>
                <Label className="text-[10px] text-slate-600">Name</Label>
                <Input
                  value={form.name}
                  disabled={!isEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={`mt-1 h-8 border-slate-200 text-xs transition-all ${isEditing ? "bg-white text-slate-800 cursor-text" : "bg-slate-50 text-slate-700 cursor-default"}`}
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-600">Phone</Label>
                <Input
                  value={form.phone}
                  disabled={!isEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className={`mt-1 h-8 border-slate-200 text-xs transition-all ${isEditing ? "bg-white text-slate-800 cursor-text" : "bg-slate-50 text-slate-700 cursor-default"}`}
                />
              </div>
              <div>
                <Label className="text-[10px] text-slate-600">Gender</Label>
                <select
                  value={form.gender}
                  disabled={!isEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                  className={`mt-1 h-8 w-full rounded-md border border-slate-200 px-2.5 text-xs transition-all ${isEditing ? "bg-white text-slate-800 cursor-pointer" : "bg-slate-50 text-slate-700 cursor-default"}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-slate-600">Address</Label>
                <Input
                  value={form.address}
                  disabled={!isEditing}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className={`mt-1 h-8 border-slate-200 text-xs transition-all ${isEditing ? "bg-white text-slate-800 cursor-text" : "bg-slate-50 text-slate-700 cursor-default"}`}
                />
              </div>
              {isEditing && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-1 h-8 bg-gradient-to-r from-cyan-500 to-sky-500 text-xs text-white hover:from-cyan-400 hover:to-sky-400"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              )}
            </div>
          </div>

          <Button
            onClick={handleLogout}
            className="h-8 w-full border border-rose-200 bg-gradient-to-r from-rose-100 to-pink-100 text-xs font-medium text-rose-700 hover:from-rose-200 hover:to-pink-200"
          >
            Logout
          </Button>
        </div>
      </div>
    </>
  );
};

export default AccountDetailsPanel;
