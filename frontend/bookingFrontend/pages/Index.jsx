import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingCard from "@/components/BookingCard";
import PassengerInfo from "@/components/PassengerInfo";
import SeatMap from "@/components/SeatMap";
import BookingSummary from "@/components/BookingSummary";
import RouteStyleFooter from "@/components/RouteStyleFooter";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  isValidEmail,
  isValidGender,
  isValidName,
  isValidPhoneNumber,
  isValidStudentId
} from "@/lib/validation";
import { toast } from "sonner";
import { Sparkles, Timer, ChevronRight } from "lucide-react";
import "../styles/animations.css";


const toDateKey = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const BOOKING_LOCK_DURATION_MS = 10 * 60 * 1000;

const hasLocalLockTimeRemaining = (checkout, now = Date.now()) => {
  const createdAt = Number(checkout?.createdAt || 0);
  if (!createdAt) return false;
  return createdAt + BOOKING_LOCK_DURATION_MS > now;
};

const generateSeats = () => {
  const seats = [];
  const bookedMale = new Set();
  const bookedFemale = new Set();
  const reserved = new Set();
  const labels = "ABCDEFGHIJ";
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 4; col++) {
      const id = `${labels[row]}${col + 1}`;
      let status = "available";
      if (bookedMale.has(id)) status = "booked-male";
      else if (bookedFemale.has(id)) status = "booked-female";
      else if (reserved.has(id)) status = "reserved";
      seats.push({ id, row, col, status });
    }
  }
  return seats;
};

const Index = () => {
  const { user, token, updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Modern: Always restore route and lock info on focus, login, and after payment
  useEffect(() => {
    const restoreBookingState = async () => {
      // Restore route/booking from localStorage
      let pending = null;
      try {
        const raw = localStorage.getItem('stms_pending_checkout');
        pending = raw ? JSON.parse(raw) : null;
        setPendingCheckout(pending);
      } catch {
        setPendingCheckout(null);
      }
      // Always fetch lock info from backend if logged in
      if (isAuthenticated && token) {
        try {
          const res = await fetch('/api/bookings/my-seats', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          const serverLocks = Array.isArray(data?.activeLocks) ? data.activeLocks : [];

          if (!serverLocks.length && pending && !hasLocalLockTimeRemaining(pending)) {
            localStorage.removeItem("stms_pending_checkout");
            setPendingCheckout(null);
          }
        } catch {
          // Network error, do nothing
        }
      }
    };
    // Run on mount, focus, and visibility change
    restoreBookingState();
    window.addEventListener('focus', restoreBookingState);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') restoreBookingState();
    });
    return () => {
      window.removeEventListener('focus', restoreBookingState);
      document.removeEventListener('visibilitychange', restoreBookingState);
    };
  }, [isAuthenticated, token]);
  // Restore pending checkout from localStorage, update on login
  const [pendingCheckout, setPendingCheckout] = useState(() => {
    try {
      const raw = localStorage.getItem("stms_pending_checkout");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // When user logs in, re-check localStorage for pending checkout
    try {
      const raw = localStorage.getItem("stms_pending_checkout");
      setPendingCheckout(raw ? JSON.parse(raw) : null);
    } catch {
      setPendingCheckout(null);
    }
  }, [user, token, isAuthenticated]);

  // Compute selectedRoute: prefer URL, fallback to pendingCheckout
  const selectedRoute = useMemo(() => {
    const params = new URLSearchParams(location.search);
    if (!params.get("routeId") && pendingCheckout) {
      return {
        routeId: pendingCheckout.routeId || "",
        from: pendingCheckout.from || "",
        to: pendingCheckout.to || "",
        travelDate: pendingCheckout.travelDate || pendingCheckout.departureDate || "",
        departureDate: pendingCheckout.departureDate || pendingCheckout.travelDate || "",
        routeNumber: pendingCheckout.routeNumber || "",
        busName: pendingCheckout.busName || "",
        busType: pendingCheckout.busType || "",
        departureTime: pendingCheckout.departureTime || "",
        arrivalTime: pendingCheckout.arrivalTime || "",
        duration: pendingCheckout.duration || "-",
        pricePerSeat: Number.isFinite(Number(pendingCheckout.price)) ? Number(pendingCheckout.price) : 1800,
      };
    }
    // Otherwise, use URL params as before
    const departureDate =
      params.get("departureDate") ||
      params.get("date") ||
      pendingCheckout?.departureDate ||
      pendingCheckout?.travelDate ||
      "";
    const travelDate =
      params.get("travelDate") ||
      params.get("date") ||
      pendingCheckout?.travelDate ||
      pendingCheckout?.departureDate ||
      "";
    const from = params.get("from") || pendingCheckout?.from || "";
    const to = params.get("to") || pendingCheckout?.to || "";
    const routeNumber =
      params.get("routeNumber") ||
      pendingCheckout?.routeNumber ||
      params.get("routeName") ||
      "";
    const routeId =
      params.get("routeId") ||
      pendingCheckout?.routeId ||
      routeNumber ||
      "";
    const busName =
      params.get("busName") ||
      pendingCheckout?.busName ||
      params.get("routeName") ||
      "";
    const busType = params.get("busType") || pendingCheckout?.busType || "";
    const departureTime = params.get("departureTime") || pendingCheckout?.departureTime || "";
    const arrivalTime = params.get("arrivalTime") || pendingCheckout?.arrivalTime || "";
    const explicitDuration = params.get("duration");

    const parseClockTime = (timeValue) => {
      if (!timeValue) return null;
      const value = String(timeValue).trim();
      const match = value.match(/^\d{1,2}:(\d{2})(?:\s*(AM|PM))?$/i);
      if (!match) return null;

      let hours = Number(match[1]);
      const minutes = Number(match[2]);
      const period = match[3]?.toUpperCase();

      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      return hours * 60 + minutes;
    };

    const deriveDuration = () => {
      if (explicitDuration && String(explicitDuration).trim()) {
        return String(explicitDuration).trim();
      }

      const start = parseClockTime(departureTime);
      const end = parseClockTime(arrivalTime);
      if (start === null || end === null) return "-";

      let diff = end - start;
      if (diff < 0) diff += 24 * 60;

      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h`;
      return `${minutes}m`;
    };

    const duration = deriveDuration();
    const priceCandidates = [
      params.get("price"),
      params.get("fare"),
      params.get("ticketPrice"),
      params.get("amount"),
      pendingCheckout?.pricePerSeat,
      pendingCheckout?.price
    ];
    const parsedPrice = priceCandidates
      .map((value) => Number(value))
      .find((value) => Number.isFinite(value) && value >= 0);
    const pricePerSeat = Number.isFinite(parsedPrice) ? parsedPrice : 1800;

    return {
      routeId,
      from,
      to,
      travelDate,
      departureDate,
      routeNumber,
      busName,
      busType,
      departureTime,
      arrivalTime,
      duration,
      pricePerSeat,
    };
  }, [location.search, pendingCheckout]);

  const [seats, setSeats] = useState(generateSeats);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [seatChangeMode, setSeatChangeMode] = useState(false);
  const [seatChangeTargetSeatId, setSeatChangeTargetSeatId] = useState("");
  const [seatChangeNotificationId, setSeatChangeNotificationId] = useState("");
  const [myBookedSeats, setMyBookedSeats] = useState([]);
  const [myActiveLocks, setMyActiveLocks] = useState([]);
  const [lockTimeNow, setLockTimeNow] = useState(Date.now());

  const [passengerGender, setPassengerGender] = useState(user?.gender || "");
  const [passengerDetails, setPassengerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    nic: ""
  });
  const [passengerErrors, setPassengerErrors] = useState({});
  const userFirstName = (user?.name || "").trim().split(/\s+/)[0] || "Student";

  useEffect(() => {
    setPassengerGender(user?.gender || "");
  }, [user?.gender]);

  useEffect(() => {
    if (!user || user.role !== "student") return;

    const isRedirectedAfterLogin = Boolean(location.state?.redirectTo);
    
    // Try to restore saved passenger details from localStorage (same user)
    let savedDetails = null;
    try {
      const raw = localStorage.getItem("stms_passenger_details");
      const saved = raw ? JSON.parse(raw) : null;
      if (saved && saved.userId === user.id) {
        savedDetails = saved.details;
      }
    } catch (_err) {
      // Ignore malformed localStorage
    }

    setPassengerDetails((prev) => {
      // If we have saved details for this user, use them
      if (savedDetails) {
        return savedDetails;
      }

      // Otherwise, use logic based on redirect state
      const nextDetails = { ...prev };

      if (isRedirectedAfterLogin) {
        nextDetails.name = user.name || "";
        nextDetails.email = user.email || "";
        nextDetails.phone = user.phone || "";
        nextDetails.nic = user.studentId || "";
      } else {
        nextDetails.name = prev.name || user.name || "";
        nextDetails.email = prev.email || user.email || "";
        nextDetails.phone = prev.phone || user.phone || "";
        nextDetails.nic = prev.nic || user.studentId || "";
      }

      return nextDetails;
    });
  }, [user, location.state?.redirectTo]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setMyBookedSeats([]);
      setMyActiveLocks([]);
      return;
    }

    const raw = localStorage.getItem("stms_my_booked_seats");
    if (!raw) {
      setMyBookedSeats([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setMyBookedSeats(Array.isArray(parsed) ? parsed : []);
    } catch (_err) {
      setMyBookedSeats([]);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const refreshMyBookedSeats = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (selectedRoute.routeId) queryParams.set("routeId", selectedRoute.routeId);
        if (selectedRoute.travelDate) queryParams.set("travelDate", selectedRoute.travelDate);
        if (selectedRoute.departureDate) queryParams.set("departureDate", selectedRoute.departureDate);

        const queryText = queryParams.toString();
        const response = await fetch(
          `http://localhost:5001/api/bookings/my-seats${queryText ? `?${queryText}` : ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (!response.ok) return;

        const payload = await response.json();
        const seatsFromServer = Array.isArray(payload?.seats) ? payload.seats : [];
        const lockEntries = Array.isArray(payload?.activeLocks) ? payload.activeLocks : [];

        setMyBookedSeats(seatsFromServer);
        setMyActiveLocks(lockEntries);
        localStorage.setItem("stms_my_booked_seats", JSON.stringify(seatsFromServer));
      } catch (_err) {
        // Keep booking flow usable even when sync fails.
      }
    };

    refreshMyBookedSeats();
    const intervalId = setInterval(refreshMyBookedSeats, 15000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, token, selectedRoute.routeId, selectedRoute.travelDate, selectedRoute.departureDate]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const intervalId = setInterval(() => {
      setLockTimeNow(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    const pendingSeats = Array.isArray(pendingCheckout?.seats)
      ? pendingCheckout.seats.map((seat) => String(seat || "").trim().toUpperCase()).filter(Boolean)
      : [];
    if (!pendingSeats.length || seatChangeMode) return;

    const selectedRouteDateKey =
      toDateKey(selectedRoute?.departureDate) || toDateKey(selectedRoute?.travelDate);
    const pendingDateKey =
      toDateKey(pendingCheckout?.departureDate) || toDateKey(pendingCheckout?.travelDate);
    const routeMatches =
      String(selectedRoute?.routeId || "") === String(pendingCheckout?.routeId || "");
    const dateMatches = selectedRouteDateKey && pendingDateKey && selectedRouteDateKey === pendingDateKey;

    if (!routeMatches && !dateMatches) return;

    const hasServerLockForPendingSeat = myActiveLocks.some((lock) => {
      const lockSeat = String(lock?.seatNumber || "").trim().toUpperCase();
      const lockRouteMatches =
        String(lock?.routeId || "") === String(selectedRoute?.routeId || "");
      const lockDateKey = toDateKey(lock?.departureDate) || toDateKey(lock?.travelDate);
      const lockDateMatches = selectedRouteDateKey && lockDateKey && selectedRouteDateKey === lockDateKey;
      const lockExpiresAt = lock?.lockExpiresAt ? new Date(lock.lockExpiresAt).getTime() : 0;
      const lockActive = Number.isFinite(lockExpiresAt) ? lockExpiresAt > Date.now() : false;
      return pendingSeats.includes(lockSeat) && lockActive && (lockRouteMatches || lockDateMatches);
    });

    const localLockIsActive = hasLocalLockTimeRemaining(pendingCheckout);
    if (!hasServerLockForPendingSeat && !localLockIsActive) return;

    setSeats((prev) =>
      prev.map((seat) => {
        if (pendingSeats.includes(seat.id)) {
          if (seat.status === "available" || seat.status === "selected") {
            return { ...seat, status: "selected" };
          }
        }

        if (seat.status === "selected" && !pendingSeats.includes(seat.id)) {
          return { ...seat, status: "available" };
        }

        return seat;
      })
    );
  }, [
    pendingCheckout,
    selectedRoute?.routeId,
    selectedRoute?.travelDate,
    selectedRoute?.departureDate,
    myActiveLocks,
    seatChangeMode
  ]);

  const activeLockInfo = useMemo(() => {
    const hasServerLocks = isAuthenticated && Array.isArray(myActiveLocks) && myActiveLocks.length > 0;

    if (!hasServerLocks) {
      const localCreatedAt = Number(pendingCheckout?.createdAt || 0);
      const localSeats = Array.isArray(pendingCheckout?.seats)
        ? pendingCheckout.seats.map((seat) => String(seat || "").trim().toUpperCase()).filter(Boolean)
        : [];

      if (!localCreatedAt || !localSeats.length) return null;

      const localRemainingMs = Math.max(0, localCreatedAt + BOOKING_LOCK_DURATION_MS - lockTimeNow);
      if (localRemainingMs <= 0) return null;

      const totalSeconds = Math.ceil(localRemainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      return {
        remainingMs: localRemainingMs,
        countdown: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        seatNumbers: localSeats
      };
    }

    const selectedRouteDateKey = toDateKey(selectedRoute?.departureDate) || toDateKey(selectedRoute?.travelDate);

    const routeLocks = myActiveLocks
      .filter((lock) => {
        const lockRouteId = String(lock?.routeId || "");
        const selectedRouteId = String(selectedRoute.routeId || "");
        const lockDateKey = toDateKey(lock?.departureDate) || toDateKey(lock?.travelDate);

        const routeMatches = selectedRouteId && lockRouteId === selectedRouteId;
        const dateMatches = selectedRouteDateKey && lockDateKey && lockDateKey === selectedRouteDateKey;

        return routeMatches || dateMatches;
      })
      .map((lock) => {
        const expiresAt = lock?.lockExpiresAt ? new Date(lock.lockExpiresAt).getTime() : NaN;
        return Number.isFinite(expiresAt)
          ? { ...lock, expiresAt, remainingMs: Math.max(0, expiresAt - lockTimeNow) }
          : null;
      })
      .filter((lock) => lock && lock.remainingMs > 0)
      .sort((a, b) => a.remainingMs - b.remainingMs);

    if (!routeLocks.length) {
      const fallbackLock = myActiveLocks
        .map((lock) => {
          const expiresAt = lock?.lockExpiresAt ? new Date(lock.lockExpiresAt).getTime() : NaN;
          return Number.isFinite(expiresAt)
            ? { ...lock, expiresAt, remainingMs: Math.max(0, expiresAt - lockTimeNow) }
            : null;
        })
        .filter((lock) => lock && lock.remainingMs > 0)
        .sort((a, b) => a.remainingMs - b.remainingMs)[0];

      if (!fallbackLock) return null;

      const totalSeconds = Math.ceil(fallbackLock.remainingMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      return {
        remainingMs: fallbackLock.remainingMs,
        countdown: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
        seatNumbers: [String(fallbackLock?.seatNumber || "").trim().toUpperCase()].filter(Boolean)
      };
    }

    const minimumRemaining = routeLocks[0].remainingMs;
    const totalSeconds = Math.ceil(minimumRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return {
      remainingMs: minimumRemaining,
      countdown: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      seatNumbers: routeLocks
        .map((lock) => String(lock?.seatNumber || "").trim().toUpperCase())
        .filter(Boolean)
    };
  }, [isAuthenticated, myActiveLocks, selectedRoute.routeId, selectedRoute.travelDate, selectedRoute.departureDate, pendingCheckout, lockTimeNow]);

  useEffect(() => {
    const revealTargets = Array.from(document.querySelectorAll("[data-booking-reveal]"));
    if (!revealTargets.length) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -12% 0px",
      }
    );

    revealTargets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;

    setSeats((prev) =>
      prev.map((seat) => (seat.status === "selected" ? { ...seat, status: "available" } : seat))
    );
    setShowSeatSelection(false);
    setSeatChangeMode(false);
    setSeatChangeTargetSeatId("");
    setSeatChangeNotificationId("");
    setMyBookedSeats([]);
    setMyActiveLocks([]);
    setPassengerGender("");
    setPassengerDetails({
      name: "",
      email: "",
      phone: "",
      nic: ""
    });
    setPassengerErrors({});

    // Clear saved passenger details on logout
    try {
      localStorage.removeItem("stms_passenger_details");
    } catch (_err) {
      // Keep flow working even if localStorage fails
    }

    // After local reset on logout, immediately re-sync booked seats for guest users.
    refreshBookedSeatStatuses();
  }, [isAuthenticated]);

  useEffect(() => {
    const activateSeatChangeMode = (requestPayload) => {
      const targetSeatId = requestPayload?.targetSeatId || requestPayload?.adjacentSeatId || "";
      if (!targetSeatId) {
        toast.error("Seat change request is missing target seat details.");
        return;
      }

      const normalizedTargetSeat = String(targetSeatId).trim().toUpperCase();
      const normalizedNotificationId = String(requestPayload?.notificationId || "").trim();

      setSeatChangeTargetSeatId(normalizedTargetSeat);
      setSeatChangeNotificationId(normalizedNotificationId);
      setSeatChangeMode(true);
      setShowSeatSelection(true);

      // Seat change flow replaces a single seat, so clear previous temporary picks first.
      setSeats((prev) =>
        prev.map((seat) => (seat.status === "selected" ? { ...seat, status: "available" } : seat))
      );
    };

    const onSeatChangeRequested = (event) => {
      activateSeatChangeMode(event?.detail || {});
    };

    window.addEventListener("stms:seat-change-request", onSeatChangeRequested);

    if (location.state?.seatChangeFromNotification) {
      const pendingRaw = localStorage.getItem("stms_seat_change_request");
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          activateSeatChangeMode(pending);
        } catch (_err) {
          // Ignore malformed request and keep booking page usable.
        }
      }
    }

    return () => {
      window.removeEventListener("stms:seat-change-request", onSeatChangeRequested);
    };
  }, [location.state, myBookedSeats]);

  const selectedSeats = useMemo(
    () => seats.filter((s) => s.status === "selected").map((s) => s.id),
    [seats]
  );

  const total = selectedSeats.length * selectedRoute.pricePerSeat;
  const formattedTotal = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(total);

  const normalizeGender = (value) => (value || "").toLowerCase();
  const isLoggedFemaleUser = isAuthenticated && normalizeGender(user?.gender) === "female";

  const getAdjacentSeatConflict = (seatToCheck) => {
    const currentGender = normalizeGender(passengerGender);
    if (!currentGender || currentGender === "other") {
      return null;
    }

    const oppositeStatus = currentGender === "male" ? "booked-female" : "booked-male";

    return seats.find(
      (candidate) =>
        candidate.row === seatToCheck.row &&
        Math.abs(candidate.col - seatToCheck.col) === 1 &&
        candidate.status === oppositeStatus
    );
  };

  const toggleSeatSelection = (seatId) => {
    setSeats((prev) =>
      prev.map((seat) =>
        seat.id === seatId && seat.status !== "booked" && seat.status !== "booked-male" && seat.status !== "booked-female" && seat.status !== "reserved"
          ? { ...seat, status: seat.status === "selected" ? "available" : "selected" }
          : seat
      )
    );
  };

  const SEAT_ROUTE_ID = selectedRoute.routeId;
  const SEAT_TRAVEL_DATE = selectedRoute.travelDate;
  const SEAT_DEPARTURE_DATE = selectedRoute.departureDate;

  const refreshBookedSeatStatuses = async () => {
    if (!SEAT_ROUTE_ID) return;

    try {
      const response = await fetch(
        `http://localhost:5001/api/bookings/seat-summary?routeId=${encodeURIComponent(SEAT_ROUTE_ID)}&travelDate=${encodeURIComponent(SEAT_TRAVEL_DATE)}&departureDate=${encodeURIComponent(SEAT_DEPARTURE_DATE)}`
      );

      if (!response.ok) return;

      const payload = await response.json();
      const bookedBySeatId = new Map(
        (payload?.seats || []).map((item) => [String(item?.seatNumber || "").trim().toUpperCase(), item?.status || "booked"])
      );

      setSeats((prev) =>
        prev.map((seat) => {
          if (seat.status === "selected") {
            return seat;
          }

          const serverStatus = bookedBySeatId.get(seat.id);
          if (serverStatus === "booked-male" || serverStatus === "booked-female" || serverStatus === "booked") {
            return { ...seat, status: serverStatus };
          }

          if (seat.status === "booked" || seat.status === "booked-male" || seat.status === "booked-female") {
            return { ...seat, status: "available" };
          }

          return seat;
        })
      );
    } catch (_err) {
      // Keep booking flow usable even if sync request fails.
    }
  };

  useEffect(() => {
    refreshBookedSeatStatuses();
    const intervalId = setInterval(refreshBookedSeatStatuses, 15000);
    return () => clearInterval(intervalId);
  }, [SEAT_ROUTE_ID, SEAT_TRAVEL_DATE, SEAT_DEPARTURE_DATE]);

  const handleSeatClick = (seatId) => {
    const seat = seats.find((s) => s.id === seatId);

    if (seatChangeMode) {
      if (seat.status !== "available" && seat.status !== "selected") {
        return;
      }

      setSeats((prev) =>
        prev.map((item) => {
          if (item.status === "selected" && item.id !== seatId) {
            return { ...item, status: "available" };
          }

          if (item.id === seatId) {
            if (item.status === "available") {
              return { ...item, status: "selected" };
            }

            if (item.status === "selected") {
              return { ...item, status: "available" };
            }
          }

          return item;
        })
      );
      return;
    }

    const isSelecting = seat.status === "available";

    if (isSelecting) {
      const conflictSeat = getAdjacentSeatConflict(seat);
      if (conflictSeat) {
        const genderLabel = normalizeGender(passengerGender) === "male" ? "female" : "male";
        toast("Seat notice", {
          description: `A ${genderLabel} student is in the adjacent seat. Do you want to continue with ${seat.id}?`,
          duration: 5200,
          action: {
            label: "Continue",
            onClick: () => {
              toggleSeatSelection(seat.id);
            },
          },
          cancel: {
            label: "Another seat",
          },
        });
        return;
      }
    }

    toggleSeatSelection(seatId);
  };

  const handleSaveSeatChange = async () => {
    if (!seatChangeMode) return;

    if (!seatChangeTargetSeatId) {
      toast.error("No target seat found for this change request.");
      return;
    }

    if (selectedSeats.length !== 1) {
      toast.error("Select one new seat before saving changes.");
      return;
    }

    const replacementSeatId = selectedSeats[0];

      if (!token) {
        toast.error("Please login again to continue.");
        return;
      }

      const normalizedTargetSeat = String(seatChangeTargetSeatId || "").trim().toUpperCase();
      const normalizedReplacementSeat = String(replacementSeatId || "").trim().toUpperCase();
      const normalizedNotificationId = String(seatChangeNotificationId || "").trim();

      try {
        const response = await fetch("http://localhost:5001/api/bookings/change-seat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            targetSeatId: normalizedTargetSeat,
            replacementSeatId: normalizedReplacementSeat,
            notificationId: normalizedNotificationId,
            routeId: selectedRoute.routeId,
            travelDate: selectedRoute.travelDate,
            departureDate: selectedRoute.departureDate
          })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to save seat change");
        }
      } catch (err) {
        toast.error(err.message || "Failed to save seat change");
        return;
      }

    const nextBookedSeats = myBookedSeats.map((seatId) =>
        seatId === normalizedTargetSeat ? normalizedReplacementSeat : seatId
    );
    setMyBookedSeats(nextBookedSeats);
    localStorage.setItem("stms_my_booked_seats", JSON.stringify(nextBookedSeats));

    setSeats((prev) =>
      prev.map((seat) => {
          if (seat.id === normalizedTargetSeat) {
          return { ...seat, status: "available" };
        }
          if (seat.id === normalizedReplacementSeat) {
          return { ...seat, status: "booked-female" };
        }
        if (seat.status === "selected") {
          return { ...seat, status: "available" };
        }
        return seat;
      })
    );

    const pendingRaw = localStorage.getItem("stms_pending_checkout");
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        const existingSeats = Array.isArray(pending.seats) ? pending.seats : [];
        const updated = {
          ...pending,
          seats: existingSeats.map((seatId) =>
            seatId === normalizedTargetSeat ? normalizedReplacementSeat : seatId
          ),
          total: (pending.pricePerSeat || 1800) * (existingSeats.length || 1),
          updatedAt: Date.now()
        };
        localStorage.setItem("stms_pending_checkout", JSON.stringify(updated));
      } catch (_err) {
        // Keep UI flow even if saved checkout payload is malformed.
      }
    }

    localStorage.removeItem("stms_seat_change_request");
    setSeatChangeMode(false);
    setSeatChangeTargetSeatId("");
    setSeatChangeNotificationId("");
    setShowSeatSelection(false);

    await refreshBookedSeatStatuses();

    toast.success("Seat changed successfully", {
      description: `Seat ${normalizedTargetSeat} was replaced with ${normalizedReplacementSeat}.`
    });
  };

  const handleSeatSelectionSheetToggle = (nextOpen) => {
    setShowSeatSelection(nextOpen);
    if (!nextOpen && seatChangeMode) {
      setSeatChangeMode(false);
      setSeatChangeTargetSeatId("");
      setSeatChangeNotificationId("");
    }
  };

  const handleGenderChange = async (nextGender) => {
    setPassengerGender(nextGender);
    setPassengerErrors((prev) => ({ ...prev, gender: "" }));

    if (isAuthenticated && user) {
      const nextUser = { ...user, gender: nextGender };
      updateUser(nextUser);

      if (token) {
        try {
          await fetch("http://localhost:5001/api/users/me", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ gender: nextGender })
          });
        } catch (_err) {
          // Keep local gender for demo mode even when backend call fails.
        }
      }
    }
  };

  const handlePassengerDetailsChange = (updater) => {
    setPassengerDetails((prev) => {
      const nextDetails = updater(prev);
      
      // Persist passenger details to localStorage
      if (user && user.id) {
        try {
          localStorage.setItem("stms_passenger_details", JSON.stringify({
            userId: user.id,
            details: nextDetails,
            updatedAt: Date.now()
          }));
        } catch (_err) {
          // Keep UI responsive even if localStorage fails
        }
      }
      
      return nextDetails;
    });
    setPassengerErrors({});
  };

  const validatePassengerDetails = () => {
    const nextErrors = {};

    if (!isValidName(passengerDetails.name)) {
      nextErrors.name = "Enter the passenger full name.";
    }

    if (!isValidEmail(passengerDetails.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!isValidPhoneNumber(passengerDetails.phone)) {
      nextErrors.phone = "Enter a valid Sri Lankan mobile number.";
    }

    if (!isValidStudentId(passengerDetails.nic)) {
      nextErrors.nic = "Enter a valid NIC or student ID.";
    }

    if (!isValidGender(passengerGender)) {
      nextErrors.gender = "Select a gender.";
    }

    setPassengerErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validatePassengerDetails()) {
      toast.error("Please complete the passenger information before checkout.");
      document.getElementById("passenger-info")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }

    if (!selectedSeats.length) {
      toast.error("Please select at least one seat before checkout.");
      return false;
    }

    if (!isAuthenticated || !token) {
      toast.error("Please log in to proceed with payment.");
      navigate("/login", { state: { redirectTo: `/booking${location.search || ""}` } });
      return false;
    }

    const routeLabel = `${selectedRoute.from} - ${selectedRoute.to}`;
    const bookingPayloads = selectedSeats.map((seatId) => ({
      routeId: selectedRoute.routeId,
      busName: selectedRoute.busName,
      from: selectedRoute.from,
      to: selectedRoute.to,
      travelDate: selectedRoute.travelDate,
      departureDate: selectedRoute.departureDate,
      routeNumber: selectedRoute.routeNumber,
      route: routeLabel,
      studentName: passengerDetails.name,
      studentEmail: passengerDetails.email,
      phone: passengerDetails.phone,
      nic: passengerDetails.nic,
      gender: passengerGender,
      seatNumber: seatId,
      price: selectedRoute.pricePerSeat,
      status: "Pending",
      paymentStatus: "Pending",
    }));

    let createdBookingIds = [];
    try {
      const createResponses = await Promise.all(
        bookingPayloads.map((payload) =>
          fetch("http://localhost:5001/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })
        )
      );

      const failedResponse = createResponses.find((response) => !response.ok);
      if (failedResponse) {
        const body = await failedResponse.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to save booking before checkout.");
      }

      const createdBookings = await Promise.all(
        createResponses.map((response) => response.json().catch(() => ({})))
      );
      createdBookingIds = createdBookings
        .map((booking) => booking?._id)
        .filter(Boolean);
    } catch (error) {
      toast.error(error.message || "Could not save booking. Please try again.");
      return false;
    }

    const pendingCheckout = {
      routeId: selectedRoute.routeId,
      from: selectedRoute.from,
      to: selectedRoute.to,
      travelDate: selectedRoute.travelDate,
      departureDate: selectedRoute.departureDate,
      routeNumber: selectedRoute.routeNumber,
      busName: selectedRoute.busName,
      seats: selectedSeats,
      pricePerSeat: selectedRoute.pricePerSeat,
      total,
      passenger: {
        ...passengerDetails,
        gender: passengerGender
      },
      bookingIds: createdBookingIds,
      createdAt: Date.now()
    };

    localStorage.setItem("stms_pending_checkout", JSON.stringify(pendingCheckout));

    const paymentAppUrl = import.meta.env.VITE_PAYMENT_APP_URL || "http://localhost:3002";
    const paymentUrl = new URL(paymentAppUrl, window.location.origin);
    paymentUrl.searchParams.set(
      "checkout",
      JSON.stringify({
        ...pendingCheckout,
        token
      })
    );

    window.location.replace(paymentUrl.toString());
    return true;
  };

  const handleContinuePaymentFromCountdown = () => {
    try {
      const raw = localStorage.getItem("stms_pending_checkout");
      const pending = raw ? JSON.parse(raw) : null;
      if (!pending || !token) {
        toast.error("Payment information not found or session expired.");
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
      toast.error("Failed to continue payment session.");
    }
  };

  return (
    <div className="page-enter relative isolate min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-zinc-100 to-slate-200 pb-24 md:pb-0">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="ambient-blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-slate-300/25 blur-3xl" />
        <div className="ambient-blob absolute right-[-120px] top-24 h-96 w-96 rounded-full bg-zinc-300/25 blur-3xl" />
      </div>
      <div className="relative isolate h-[220px] overflow-hidden border-b border-slate-200 sm:h-[250px] md:h-[290px]">
        <img
          src="/hero-banner.jpg"
          alt="Student transport"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/30 to-black/40" />
        <section className="container relative z-10 flex h-full items-center py-6 md:py-8">
          <div className="max-w-3xl space-y-4 title-appear anim-delay-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Online Booking</p>
            <h1 className="hero-text text-2xl font-bold text-white sm:text-3xl md:text-4xl">
              Book Your Seat
            </h1>
            <p className="hero-subtitle text-sm text-white/85 md:text-base">
              Welcome{isAuthenticated && user ? `, ${userFirstName}` : " back"}. Select your seat and complete booking in minutes.
            </p>
          </div>
        </section>
      </div>

      <main className="relative z-20">
        <div className="container pb-12 pt-6 md:pt-8">
          <div className="relative grid gap-6 lg:grid-cols-3 xl:gap-8">
            <div className="space-y-6 lg:col-span-2">
              <section className="booking-scroll-reveal booking-delay-2 booking-surface rounded-2xl border border-slate-300/90 bg-slate-50 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.07)] backdrop-blur-sm" data-booking-reveal>
                <BookingCard
                  departureCity={selectedRoute.from}
                  arrivalCity={selectedRoute.to}
                  departureDateTime={`${selectedRoute.travelDate} - ${selectedRoute.departureTime}`}
                  arrivalDateTime={`${selectedRoute.travelDate} - ${selectedRoute.arrivalTime}`}
                  duration={selectedRoute.duration}
                  busType={selectedRoute.busType}
                  busModel={selectedRoute.busName}
                  routeNumber={selectedRoute.routeNumber}
                  availableSeats={seats.filter((s) => s.status === "available").length}
                  priceLkr={selectedRoute.pricePerSeat}
                  seatSelectorTheme={isLoggedFemaleUser ? "female" : "default"}
                  onSelectSeats={() => setShowSeatSelection(true)}
                />
              </section>

              <section id="passenger-info" className="booking-scroll-reveal booking-delay-3 booking-surface rounded-2xl border border-slate-300/90 bg-slate-50 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.07)] backdrop-blur-sm" data-booking-reveal>
                <PassengerInfo
                  errors={passengerErrors}
                  details={passengerDetails}
                  onDetailsChange={handlePassengerDetailsChange}
                  gender={passengerGender}
                  onGenderChange={handleGenderChange}
                />
              </section>

              {activeLockInfo ? (
                <section
                  className="booking-scroll-reveal booking-delay-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-4 shadow-[0_12px_24px_rgba(217,119,6,0.12)]"
                  data-booking-reveal
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                        <Sparkles className="h-3 w-3" />
                        Your Seat Lock Is Active
                      </p>
                      <p className="mt-1 text-xs font-medium text-amber-900">
                        Locked seats: {activeLockInfo.seatNumbers.join(", ")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-amber-800/80">
                        This seat is reserved for 10 minutes on the booking page. Complete payment before the timer ends.
                      </p>
                      {pendingCheckout && (
                        <button
                          onClick={handleContinuePaymentFromCountdown}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:from-rose-700 hover:to-orange-700 hover:shadow-md"
                        >
                          💳 Continue Payment
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="rounded-lg border border-amber-300/70 bg-white/80 px-3 py-1.5 text-center shadow-sm">
                      <p className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                        <Timer className="h-3 w-3" />
                        Time Left
                      </p>
                      <p className="mt-0.5 font-mono text-lg font-bold leading-none text-rose-600">
                        {activeLockInfo.countdown}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>

            <aside id="booking-summary" className="booking-scroll-reveal booking-delay-4 h-fit lg:sticky lg:top-20 lg:self-start" data-booking-reveal>
              <div className="mb-2 rounded-xl border border-slate-300/90 bg-slate-100/95 px-4 py-3 transition-[border-color,box-shadow] duration-300 hover:border-slate-400 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Checkout Summary</p>
              </div>
              <section className="booking-scroll-reveal booking-delay-2 booking-surface rounded-2xl border border-slate-300/90 bg-slate-50 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.07)] backdrop-blur-sm transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-slate-400 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)]" data-booking-reveal>
                <BookingSummary
                  from={selectedRoute.from}
                  to={selectedRoute.to}
                  date={selectedRoute.travelDate}
                  selectedSeats={selectedSeats}
                  pricePerSeat={selectedRoute.pricePerSeat}
                  onCheckout={handleCheckout}
                />
              </section>
            </aside>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-slate-100/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-600">Selected Seats</p>
            <p className="text-sm font-semibold text-slate-800">
              {selectedSeats.length > 0 ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""}` : "No seat selected"}
            </p>
            <p className="text-xs text-slate-600">{formattedTotal}</p>
          </div>
          <Button
            size="sm"
            className="booking-button min-w-[150px] border border-blue-300/60 bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm hover:from-blue-500 hover:to-sky-500"
            onClick={() => {
              const summary = document.getElementById("booking-summary");
              summary?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Review Booking
          </Button>
        </div>
      </div>

      <Sheet open={showSeatSelection} onOpenChange={handleSeatSelectionSheetToggle}>
        <SheetContent side="right" className="sheet-open w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Choose Your Seat</SheetTitle>
            <SheetDescription>
              {seatChangeMode
                ? "Choose one replacement seat, then save your changes."
                : "Select your preferred seats from the bus layout below"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <SeatMap
              seats={seats}
              onSeatClick={handleSeatClick}
              theme={isLoggedFemaleUser ? "female" : "default"}
              flaggedSeatId={seatChangeTargetSeatId}
              seatChangeMode={seatChangeMode}
            />
          </div>

          {seatChangeMode ? (
            <div className="sticky bottom-0 mt-4 border-t border-slate-200 bg-white/95 px-1 py-3 backdrop-blur-sm">
              <Button
                onClick={handleSaveSeatChange}
                className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
              >
                Save Changes
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <RouteStyleFooter />
    </div>
  );
}
export default Index;
