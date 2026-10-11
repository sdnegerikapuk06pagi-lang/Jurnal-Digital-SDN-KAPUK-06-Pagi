import React, { useState } from 'react';
import { UserRole, SchoolSettings, Murid, Guru, AppNotification } from '../types';
import {
  Bell,
  GraduationCap,
  Users,
  ShieldCheck,
  RefreshCw,
  LogOut,
  User,
  ImageIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import { SpreadsheetSyncModal } from './common/SpreadsheetSyncModal';

interface NavbarProps {
  currentRole: UserRole;
  settings: SchoolSettings;
  currentUser: Murid | Guru | { name: string } | null;
  onLogout: () => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  settings,
  currentUser,
  onLogout,
  notifications,
  onOpenNotifications,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const currentMurid = currentRole === 'murid' ? (currentUser as Murid) : null;
  const currentGuru = currentRole === 'guru' ? (currentUser as Guru) : null;

  const filteredNotifs = notifications.filter((n) => {
    if (currentRole === 'murid') {
      return n.targetRole === 'murid' && (!n.targetUserId || n.targetUserId === currentMurid?.id);
    }
    if (currentRole === 'guru') {
      return n.targetRole === 'guru' || n.targetRole === 'admin';
    }
    return true;
  });

  const unreadCount = filteredNotifs.filter((n) => !n.isRead).length;
  const logoUrl = settings.logoUrl || 'https://i.imgur.com/GlCn0x3.png';
  const posterUrl = settings.posterUrl || 'https://i.imgur.com/pJOJiuF.jpeg';

  return (
    <header className="no-print bg-gradient-to-r from-blue-900 via-blue-950 to-indigo-950 text-white shadow-lg sticky top-0 z-40 border-b border-blue-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & School Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md p-1 flex items-center justify-center border border-white/20 shadow-inner overflow-hidden">
                <img
                  src={logoUrl}
                  alt="Logo SDN Kapuk 06 Pagi"
                  className="w-10 h-10 object-contain drop-shadow"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full font-mono">
                    NPSN {settings.npsn || '20105291'}
                  </span>
                  <span className="text-[10px] text-blue-200">
                    {settings.tahunAjaran} • {settings.semester}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                  {settings.namaSekolah || 'DIGITAL SDN Kapuk 06 Pagi'}
                </h1>
                <p className="text-xs text-blue-200/90 font-medium">
                  {settings.subJudul || 'Sistem Informasi Sekolah'}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsPosterModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-blue-950 hover:bg-amber-300 font-extrabold text-[11px] flex items-center gap-1 shadow-sm"
                title="Lihat Poster 7 KAIH"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Poster</span>
              </button>
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5 text-amber-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Action Tools: Sync + Notif + Logged-in Profile & Logout */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto">
            {/* Tombol Poster Resmi 7 KAIH (Desktop) */}
            <button
              onClick={() => setIsPosterModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-amber-400 text-blue-950 hover:bg-amber-300 transition-all font-extrabold cursor-pointer shadow-md"
              title="Buka Poster Resmi 7 KAIH & Literasi Sekolah"
            >
              <ImageIcon className="w-4 h-4" />
              <span>🖼️ Poster 7 KAIH</span>
            </button>

            {/* Quick Spreadsheet Sync Status & Modal Opener */}
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/50 transition-colors font-bold cursor-pointer shadow-xs"
              title="Cloud Database Sekolah: Aktif Otomatis Realtime"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Cloud Sync</span> <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded">Otomatis</span>
            </button>



            {/* Notification Bell (Desktop) */}
            <button
              onClick={onOpenNotifications}
              className="hidden md:flex relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all items-center justify-center"
              title="Lihat Notifikasi"
            >
              <Bell className="w-5 h-5 text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Badge (Current Authenticated User) */}
            <div className="flex items-center gap-2.5 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs text-white bg-blue-600">
                {currentRole === 'murid' ? (
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                ) : currentRole === 'guru' ? (
                  <Users className="w-4 h-4 text-cyan-200" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                )}
              </div>

              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                    {currentMurid?.nama || currentGuru?.nama || (currentUser as any)?.name || 'Pengguna'}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase font-mono ${
                      currentRole === 'murid'
                        ? 'bg-amber-400 text-blue-950'
                        : currentRole === 'guru'
                        ? 'bg-blue-400 text-blue-950'
                        : 'bg-emerald-400 text-slate-950'
                    }`}
                  >
                    {currentRole}
                  </span>
                </div>
                <p className="text-[10px] text-blue-200 truncate">
                  {currentRole === 'murid'
                    ? `${currentMurid?.kelas || ''} (NISN: ${currentMurid?.nisn || ''})`
                    : currentRole === 'guru'
                    ? currentGuru?.jabatan || 'Guru SDN Kapuk 06'
                    : 'Kepala Sekolah / Admin'}
                </p>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="ml-2 p-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white transition-all flex items-center gap-1 text-xs font-bold"
                title="Keluar dari Aplikasi"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* MODAL SINKRONISASI GOOGLE SPREADSHEET */}
      <SpreadsheetSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        settings={settings}
      />

      {/* MODAL POSTER 7 KAIH RESMI */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Poster Resmi 7 KAIH & Literasi Sekolah
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    SDN KAPUK 06 PAGI • Pembiasaan Karakter & Literasi Membaca
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPosterModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gambar Poster */}
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={posterUrl}
                alt="Poster 7 KAIH SDN Kapuk 06 Pagi"
                className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-lg border border-slate-300"
              />
            </div>

            {/* Footer Modal dengan tombol Aksi */}
            <div className="bg-white px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">
                Poster Resmi Pembiasaan 7 Karakter Anak Indonesia Hebat (7 KAIH).
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={posterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Resolusi Penuh</span>
                </a>
                <button
                  onClick={() => setIsPosterModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
