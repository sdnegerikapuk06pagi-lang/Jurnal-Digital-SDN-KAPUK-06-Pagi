import React from 'react';
import { AppNotification } from '../types';
import { Bell, CheckCircle2, BookOpen, Sparkles, X } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  activeRole: string;
  activeStudentId?: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  activeRole,
  activeStudentId,
}) => {
  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (activeRole === 'murid') {
      return n.targetRole === 'murid' && (!n.targetUserId || n.targetUserId === activeStudentId);
    }
    if (activeRole === 'guru') {
      return n.targetRole === 'guru' || n.targetRole === 'admin';
    }
    return true;
  });

  const unreadCount = filteredNotifs.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Notifikasi Sistem</h3>
              <p className="text-xs text-blue-200">
                {unreadCount > 0 ? `${unreadCount} pemberitahuan belum dibaca` : 'Semua telah dibaca'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-sm">Belum ada notifikasi baru untuk Anda.</p>
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl my-1 transition-all ${
                  n.isRead ? 'bg-slate-50/70 opacity-80' : 'bg-blue-50/80 border border-blue-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      {n.journalType === '7kaih' ? (
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : n.journalType === 'membaca' ? (
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-800">{n.title}</h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-2 inline-block font-mono">
                        {n.timestamp}
                      </span>
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex-shrink-0 font-medium"
                    >
                      Tandai Dibaca
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Tandai Semua Sudah Dibaca
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
