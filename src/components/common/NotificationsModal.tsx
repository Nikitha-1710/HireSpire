import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  CheckCheck,
  X,
  RefreshCw,
  MailOpen
} from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApplicationById?: (appId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectApplicationById,
}) => {
  const { setUnreadNotifications } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.notifications);
      setUnreadNotifications(res.unreadCount);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadNotifications((count) => Math.max(0, count - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadNotifications(0);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 max-h-[85vh] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">System Notifications</h2>
              <span className="text-xs text-slate-400">Application updates & interview alerts</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </button>
          </div>
        </div>

        {/* List of notifications */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="space-y-2 py-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-950 border border-slate-800" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">You're all caught up.</h3>
              <p className="text-xs text-slate-400">No unread notifications at this time.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.notification_id}
                onClick={() => {
                  if (!item.is_read) handleMarkAsRead(item.notification_id);
                  if (item.application_id && onSelectApplicationById) {
                    onClose();
                    onSelectApplicationById(item.application_id);
                  }
                }}
                className={`p-3.5 rounded-xl border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                  !item.is_read
                    ? 'bg-indigo-950/40 border-indigo-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-950/90'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {!item.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
