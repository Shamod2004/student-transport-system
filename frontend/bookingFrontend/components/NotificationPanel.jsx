import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Bell, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const NotificationPanel = ({ open, onClose, onUnreadChange }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const getPendingCount = (collection) =>
    collection.filter(
      (item) =>
        !item.isRead || (item?.type === "gender-seat-alert" && Boolean(item?.metadata?.canChangeSeat))
    ).length;

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

  useEffect(() => {
    if (!open || !token || !user) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:5001/api/users/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error("Could not load notifications");
        }

        const data = await response.json();
        const notifications = data.notifications || [];
        setItems(notifications);
        onUnreadChange?.(getPendingCount(notifications));
      } catch (_err) {
        // Keep panel open and show empty state instead of an error toast.
        setItems([]);
        onUnreadChange?.(0);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [open, token, user, onUnreadChange]);

  const markOneRead = async (id) => {
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5001/api/users/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error("Could not mark notification");
      }

      setItems((prev) => {
        const next = prev.map((item) => (item._id === id ? { ...item, isRead: true } : item));
        onUnreadChange?.(getPendingCount(next));
        return next;
      });
    } catch (_err) {
      toast.error("Failed to update notification");
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((item) => !item.isRead);
    if (!unread.length) return;

    await Promise.all(unread.map((item) => markOneRead(item._id)));
  };

  const clearAllNotifications = async () => {
    if (!token) return;
    if (!items.length) return;

    try {
      const response = await fetch("http://localhost:5001/api/users/notifications", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Clear-all route not found. Restart backend server.");
        }
        throw new Error("Could not clear notifications");
      }

      setItems([]);
      onUnreadChange?.(0);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error(err?.message || "Failed to clear notifications");
    }
  };

  const handleChangeSeatClick = async (item) => {
    const payload = {
      notificationId: item._id,
      selectedSeatId: item?.metadata?.selectedSeatId || "",
      adjacentSeatId: item?.metadata?.adjacentSeatId || "",
      targetSeatId: item?.metadata?.adjacentSeatId || "",
      requestedAt: Date.now()
    };

    localStorage.setItem("stms_seat_change_request", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("stms:seat-change-request", { detail: payload }));

    onClose?.();
    navigate(item?.metadata?.redirectTo || "/", {
      state: { seatChangeFromNotification: true }
    });
  };

  const handlePreferSeatClick = async (item) => {
    await markOneRead(item._id);
    toast("Preference saved", {
      description: "You kept your current seat."
    });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] panel-overlay-fade" onClick={onClose} />

      <div className="no-scrollbar panel-pop-in fixed right-4 top-20 z-50 w-[min(92vw,360px)] max-h-[72vh] overflow-y-auto rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-sky-50 text-slate-800 shadow-[0_22px_48px_rgba(15,23,42,0.16)]">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 px-4 py-2 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Notifications</p>
              <h2 className="text-sm font-bold text-slate-900">Alerts</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-slate-600">{getPendingCount(items)} pending</p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={markAllRead}
                className="h-7 border-slate-300 bg-white px-2 text-[11px] text-slate-700 hover:bg-slate-100"
              >
                <CheckCheck className="mr-1 h-3.5 w-3.5" />
                Mark all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllNotifications}
                className="h-7 border-rose-300 bg-white px-2 text-[11px] text-rose-700 hover:bg-rose-50"
              >
                Clear all
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2 px-3 py-3">
          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-center text-xs text-slate-600">
              <Bell className="mx-auto mb-1 h-4 w-4" />
              No notifications yet
            </div>
          ) : (
            items.map((item) => (
              (() => {
                const isActionableSeatAlert =
                  item?.type === "gender-seat-alert" && Boolean(item?.metadata?.canChangeSeat);

                return (
              <div
                key={item._id}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  item.isRead && !isActionableSeatAlert
                    ? "border-slate-200 bg-white text-slate-600"
                    : "border-cyan-200 bg-cyan-50 text-slate-800"
                }`}
              >
                <p className="text-xs leading-relaxed">{item.message}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  {isActionableSeatAlert ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreferSeatClick(item)}
                        className="h-7 border-slate-300 bg-white px-2 text-[11px] text-slate-700"
                      >
                        {item?.metadata?.secondaryActionLabel || "I prefer this seat"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleChangeSeatClick(item)}
                        className="h-7 bg-cyan-600 px-2 text-[11px] text-white hover:bg-cyan-500"
                      >
                        {item?.metadata?.actionLabel || "Change seat"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markOneRead(item._id)}
                      className="h-7 px-2 text-[11px] text-slate-600 hover:bg-white/80"
                    >
                      {item.isRead ? "Seen" : "Mark read"}
                    </Button>
                  )}
                </div>
              </div>
                );
              })()
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;
