import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { normalizePhoneNumber } from "@/lib/validation";

const PassengerInfo = ({ details, onDetailsChange, gender = "", onGenderChange, errors = {} }) => {
  const { user } = useAuth();

  const handlePhoneChange = (value) => {
    const normalized = normalizePhoneNumber(value).slice(0, 9);
    onDetailsChange?.((prev) => ({ ...prev, phone: normalized }));
  };

  const handleNicChange = (value) => {
    const cleaned = String(value || "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9\-/]/g, "")
      .slice(0, 20);
    onDetailsChange?.((prev) => ({ ...prev, nic: cleaned }));
  };

  const fieldErrorClass = (fieldName) =>
    errors?.[fieldName] ? "border-rose-400/70 focus-visible:border-rose-500 focus-visible:ring-rose-400/20" : "border-blue-200 focus-visible:border-blue-400/70 focus-visible:ring-blue-400/20";

  useEffect(() => {
    if (!user || user.role !== "student") return;

    onDetailsChange?.((prev) => ({
      ...prev,
      name: prev.name || user.name || "",
      email: prev.email || user.email || "",
      nic: prev.nic || user.studentId || ""
    }));
  }, [user, onDetailsChange]);

  return (
    <div className="booking-scroll-reveal overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]" data-booking-reveal>
      <div
        className="booking-scroll-reveal booking-delay-1 flex w-full items-center justify-between p-6 text-left"
        data-booking-reveal
      >
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Passenger Information</h3>
            <p className="text-sm text-slate-600">Fill out the form below and verify your identity.</p>
          </div>
        </div>
      </div>

      <div className="booking-scroll-reveal booking-delay-2 border-t border-slate-200 p-6 pt-4" data-booking-reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="passenger-field booking-scroll-reveal booking-delay-3 space-y-2" data-booking-reveal>
              <Label htmlFor="name" className="text-sm font-medium text-black">
                Full Name
              </Label>
              <div className="modern-input-wrap relative">
                <User className="modern-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500/70" />
                <Input
                  id="name"
                  required
                  placeholder="Enter your full name"
                  value={details?.name || ""}
                  onChange={(e) => onDetailsChange?.((prev) => ({ ...prev, name: e.target.value }))}
                  aria-invalid={Boolean(errors?.name)}
                  className={`input-base modern-input bg-white pl-10 text-slate-800 placeholder:text-slate-400 ${fieldErrorClass("name")}`}
                />
              </div>
              {errors?.name && <p className="text-xs text-rose-600">{errors.name}</p>}
            </div>

            <div className="passenger-field booking-scroll-reveal booking-delay-4 space-y-2" data-booking-reveal>
              <Label htmlFor="email" className="text-sm font-medium text-black">
                Email Address
              </Label>
              <div className="modern-input-wrap relative">
                <Mail className="modern-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500/70" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={details?.email || ""}
                  onChange={(e) => onDetailsChange?.((prev) => ({ ...prev, email: e.target.value }))}
                  aria-invalid={Boolean(errors?.email)}
                  className={`input-base modern-input bg-white pl-10 text-slate-800 placeholder:text-slate-400 ${fieldErrorClass("email")}`}
                />
              </div>
              {errors?.email && <p className="text-xs text-rose-600">{errors.email}</p>}
            </div>

            <div className="passenger-field booking-scroll-reveal booking-delay-5 space-y-2" data-booking-reveal>
              <Label htmlFor="phone" className="text-sm font-medium text-black">
                Contact Number
              </Label>
              <div className="flex gap-2">
                <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                  +94
                </div>
                <div className="modern-input-wrap relative flex-1">
                  <Phone className="modern-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500/70" />
                  <Input
                    id="phone"
                    required
                    inputMode="numeric"
                    maxLength={9}
                    pattern="7[0-9]{8}"
                    placeholder="7XXXXXXXX"
                    value={details?.phone || ""}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    aria-invalid={Boolean(errors?.phone)}
                    className={`input-base modern-input bg-white pl-10 text-slate-800 placeholder:text-slate-400 ${fieldErrorClass("phone")}`}
                  />
                </div>
              </div>
              {errors?.phone && <p className="text-xs text-rose-600">{errors.phone}</p>}
            </div>

            <div className="passenger-field booking-scroll-reveal booking-delay-6 space-y-2" data-booking-reveal>
              <Label htmlFor="nic" className="text-sm font-medium text-black">
                NIC / Student ID
              </Label>
              <div className="modern-input-wrap relative">
                <Shield className="modern-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500/70" />
                <Input
                  id="nic"
                  required
                  placeholder="NIC or Student ID number"
                  value={details?.nic || ""}
                  onChange={(e) => handleNicChange(e.target.value)}
                  aria-invalid={Boolean(errors?.nic)}
                  className={`input-base modern-input bg-white pl-10 text-slate-800 placeholder:text-slate-400 ${fieldErrorClass("nic")}`}
                />
              </div>
              {errors?.nic && <p className="text-xs text-rose-600">{errors.nic}</p>}
            </div>

            <div className="passenger-field booking-scroll-reveal booking-delay-7 space-y-2 sm:col-span-2" data-booking-reveal>
              <Label htmlFor="gender" className="text-sm font-medium text-black">
                Gender
              </Label>
              <div className="modern-input-wrap relative">
                <select
                  id="gender"
                  value={gender}
                  required
                  onChange={(e) => onGenderChange?.(e.target.value)}
                  aria-invalid={Boolean(errors?.gender)}
                  className={`input-base modern-input h-10 w-full rounded-md bg-white px-3 text-sm text-slate-800 ${fieldErrorClass("gender")}`}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {errors?.gender && <p className="text-xs text-rose-600">{errors.gender}</p>}
            </div>
          </div>

          <div className="booking-scroll-reveal booking-delay-8 mt-4 flex items-center gap-2 text-xs text-slate-600" data-booking-reveal>
            <Shield className="h-3.5 w-3.5" />
            <span>Your information is never shared with third parties.</span>
          </div>
      </div>
    </div>
  );
};

export default PassengerInfo;