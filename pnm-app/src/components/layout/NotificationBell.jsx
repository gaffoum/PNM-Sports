import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { listMyNotifications, markNotificationRead, markAllNotificationsRead } from "../../hooks/useNotifications";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

export default function NotificationBell() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  async function load() {
    try {
      setItems(await listMyNotifications());
    } catch {
      /* silencieux : ne doit pas gêner la navigation */
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  async function openNotification(n) {
    if (!n.read) {
      setItems((its) => its.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id).catch(() => {});
    }
    setOpen(false);
    if (n.link) nav(n.link);
  }

  async function markAll() {
    setItems((its) => its.map((x) => ({ ...x, read: true })));
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-lg hover:bg-line/30 text-ink-dim hover:text-ink transition-colors" title="Notifications">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] leading-4 text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-panel border border-line rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-line">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAll} className="text-[11px] text-cyan-bright hover:underline">Tout marquer comme lu</button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="px-3 py-4 text-xs text-ink-dim text-center">Aucune notification.</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className={`w-full text-left px-3 py-2.5 border-b border-line/50 last:border-0 hover:bg-line/20 ${n.read ? "" : "bg-cyan-bright/5"}`}
              >
                <div className="flex items-center gap-1.5">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-bright shrink-0" />}
                  <span className="text-sm font-medium truncate">{n.title}</span>
                </div>
                {n.message && <p className="text-xs text-ink-dim mt-0.5 line-clamp-2">{n.message}</p>}
                <div className="text-[10px] text-ink-muted mt-1">{timeAgo(n.created_at)}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
