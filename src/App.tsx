/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole, SchoolSettings, Murid, Guru, Jurnal7KAIH, JurnalMembaca, AppNotification } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/auth/LoginPage';
import { NotificationModal } from './components/NotificationModal';
import { MuridDashboard } from './components/murid/MuridDashboard';
import { GuruDashboard } from './components/guru/GuruDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('murid');
  const [currentUser, setCurrentUser] = useState<Murid | Guru | { name: string } | null>(null);

  const [settings, setSettings] = useState<SchoolSettings>(storageService.getSettings());
  const [muridList, setMuridList] = useState<Murid[]>(storageService.getMuridList());
  const [guruList, setGuruList] = useState<Guru[]>(storageService.getGuruList());
  const [jurnal7KaihList, setJurnal7KaihList] = useState<Jurnal7KAIH[]>(storageService.get7KaihList());
  const [jurnalMembacaList, setJurnalMembacaList] = useState<JurnalMembaca[]>(storageService.getMembacaList());
  const [notifications, setNotifications] = useState<AppNotification[]>(storageService.getNotifications());

  const [selectedMuridId, setSelectedMuridId] = useState<string>(muridList[0]?.id || 'm-01');
  const [selectedGuruId, setSelectedGuruId] = useState<string>(guruList[0]?.id || 'g-01');
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Sync state whenever storage changes
  useEffect(() => {
    // 1. Periksa apakah URL memiliki parameter syncUrl atau sheet/syncSheet (sehingga tautan langsung mengonfigurasi perangkat lain)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlFromQuery = urlParams.get('syncUrl') || urlParams.get('url');
        const sheetFromQuery = urlParams.get('sheet') || urlParams.get('syncSheet') || urlParams.get('spreadsheet');
        const currentSet = storageService.getSettings();
        let changed = false;
        const newSettings = { ...currentSet };

        if (urlFromQuery && urlFromQuery.startsWith('http') && currentSet.googleWebAppUrl !== urlFromQuery) {
          newSettings.googleWebAppUrl = urlFromQuery;
          changed = true;
        }

        if (sheetFromQuery && sheetFromQuery.trim().length > 0 && currentSet.spreadsheetUrl !== sheetFromQuery && currentSet.spreadsheetId !== sheetFromQuery) {
          if (sheetFromQuery.startsWith('http')) {
            newSettings.spreadsheetUrl = sheetFromQuery;
          } else {
            newSettings.spreadsheetId = sheetFromQuery;
          }
          changed = true;
        }

        if (changed) {
          storageService.saveSettings(newSettings);
        }
      } catch (e) {
        console.warn('Gagal membaca query param:', e);
      }
    }

    const unsubscribe = storageService.subscribe(() => {
      setSettings(storageService.getSettings());
      setMuridList(storageService.getMuridList());
      setGuruList(storageService.getGuruList());
      setJurnal7KaihList(storageService.get7KaihList());
      setJurnalMembacaList(storageService.getMembacaList());
      setNotifications(storageService.getNotifications());
    });

    // 2. Auto-Tarik data terbaru dari Cloud Server secara otomatis di latar belakang (Silent Realtime Sync)
    const initSync = async () => {
      setIsSyncing(true);
      try {
        await storageService.pullDataFromSpreadsheet();
      } catch (err) {
        console.warn('Silent auto-sync background error:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    initSync();

    // Polling berkala setiap 12 detik agar data jurnal/nilai dari murid dan guru selalu realtime
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        storageService.pullFromCloudServer().catch(() => {});
      }
    }, 12000);

    // Auto-refresh senyap saat pengguna kembali ke tab browser
    const handleFocus = () => {
      initSync();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Auto logout jika akun murid yang sedang login telah dihapus di database/spreadsheet
  useEffect(() => {
    if (isAuthenticated && role === 'murid' && currentUser && 'id' in currentUser) {
      const stillExists = muridList.some((m) => m.id === (currentUser as Murid).id);
      if (!stillExists && muridList.length > 0) {
        handleLogout();
      }
    }
  }, [muridList, isAuthenticated, role, currentUser]);

  const currentMurid =
    (role === 'murid' && currentUser && 'nisn' in currentUser
      ? (currentUser as Murid)
      : muridList.find((m) => m.id === selectedMuridId)) || muridList[0];

  const currentGuru =
    (role === 'guru' && currentUser && 'nip' in currentUser
      ? (currentUser as Guru)
      : guruList.find((g) => g.id === selectedGuruId)) || guruList[0];

  // Actions
  const handleLoginSuccess = (
    newRole: UserRole,
    userObj: Murid | Guru | { name: string }
  ) => {
    setRole(newRole);
    setCurrentUser(userObj);
    setIsAuthenticated(true);
    if (newRole === 'murid' && 'id' in userObj) {
      setSelectedMuridId(userObj.id);
    } else if (newRole === 'guru' && 'id' in userObj) {
      setSelectedGuruId(userObj.id);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleSubmit7Kaih = (entry: Jurnal7KAIH) => {
    storageService.add7Kaih(entry);
  };

  const handleSubmitMembaca = (entry: JurnalMembaca) => {
    storageService.addMembaca(entry);
  };

  const handleVerify7Kaih = (id: string, feedback: string, rating: number, guruNama: string) => {
    storageService.verify7Kaih(id, feedback, rating, guruNama);
  };

  const handleVerifyMembaca = (id: string, feedback: string, rating: number, guruNama: string) => {
    storageService.verifyMembaca(id, feedback, rating, guruNama);
  };

  const handleMarkNotificationRead = (id: string) => {
    storageService.markNotificationRead(id);
  };

  const handleMarkAllNotificationsRead = () => {
    storageService.markAllNotificationsRead(role === 'murid' ? selectedMuridId : undefined);
  };

  const handleUpdateSettings = (newSettings: SchoolSettings) => {
    storageService.saveSettings(newSettings);
  };

  const handleUpdateMuridList = (newList: Murid[]) => {
    storageService.saveMuridList(newList);
  };

  const handleUpdateGuruList = (newList: Guru[]) => {
    storageService.saveGuruList(newList);
  };

  const handleUpdate7KaihList = (newList: Jurnal7KAIH[]) => {
    storageService.save7KaihList(newList);
  };

  const handleUpdateMembacaList = (newList: JurnalMembaca[]) => {
    storageService.saveMembacaList(newList);
  };

  const handleSyncSpreadsheet = async () => {
    setIsSyncing(true);
    // Tarik data terbaru dari Cloud Google Sheets (Pull data teranyar tanpa menimpa perubahan spreadsheet)
    const pullRes = await storageService.pullDataFromSpreadsheet();
    setIsSyncing(false);
    setSyncToast({
      message: pullRes.message,
      isError: !pullRes.success,
    });
    setTimeout(() => setSyncToast(null), 5000);
  };

  const handleResetDatabase = () => {
    storageService.resetToDefault();
    setSyncToast({
      message: 'Database berhasil direset ke pengaturan awal SDN Kapuk 06 Pagi.',
    });
    setTimeout(() => setSyncToast(null), 4000);
  };

  // If NOT logged in, show dedicated LoginPage with 3 portals
  if (!isAuthenticated) {
    return (
      <LoginPage
        settings={settings}
        muridList={muridList}
        guruList={guruList}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // When logged in, render authenticated layout
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-300 selection:text-blue-950 font-sans">
      {/* Navbar Authenticated */}
      <Navbar
        currentRole={role}
        settings={settings}
        currentUser={currentUser}
        onLogout={handleLogout}
        notifications={notifications}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onSyncSpreadsheet={handleSyncSpreadsheet}
        isSyncing={isSyncing}
      />

      {/* Global Toast for Sync / Actions */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-semibold ${
              syncToast.isError ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {syncToast.isError ? (
              <AlertCircle className="w-5 h-5 text-rose-200" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span>{syncToast.message}</span>
            <button
              onClick={() => setSyncToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Dynamic View based on Authenticated User Role */}
      <main className="flex-1">
        {role === 'murid' && currentMurid && (
          <MuridDashboard
            currentMurid={currentMurid}
            settings={settings}
            jurnal7KaihList={jurnal7KaihList}
            jurnalMembacaList={jurnalMembacaList}
            onSubmit7Kaih={handleSubmit7Kaih}
            onSubmitMembaca={handleSubmitMembaca}
            onOpenNotifications={() => setIsNotifModalOpen(true)}
          />
        )}

        {role === 'guru' && currentGuru && (
          <GuruDashboard
            currentGuru={currentGuru}
            muridList={muridList}
            onUpdateMuridList={handleUpdateMuridList}
            settings={settings}
            jurnal7KaihList={jurnal7KaihList}
            jurnalMembacaList={jurnalMembacaList}
            onVerify7Kaih={handleVerify7Kaih}
            onVerifyMembaca={handleVerifyMembaca}
            onUpdate7KaihList={handleUpdate7KaihList}
            onUpdateMembacaList={handleUpdateMembacaList}
          />
        )}

        {role === 'admin' && (
          <AdminDashboard
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            muridList={muridList}
            onUpdateMuridList={handleUpdateMuridList}
            guruList={guruList}
            onUpdateGuruList={handleUpdateGuruList}
            jurnal7KaihList={jurnal7KaihList}
            jurnalMembacaList={jurnalMembacaList}
            onSyncSpreadsheet={handleSyncSpreadsheet}
            isSyncing={isSyncing}
            onResetDatabase={handleResetDatabase}
            onUpdate7KaihList={handleUpdate7KaihList}
            onUpdateMembacaList={handleUpdateMembacaList}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} <b>{settings.namaSekolah}</b> — {settings.subJudul}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>NPSN: {settings.npsn}</span>
            <span>•</span>
            <span>Suku Dinas Pendidikan Wilayah I Jakarta Barat</span>
          </div>
        </div>
      </footer>

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        activeRole={role}
        activeStudentId={selectedMuridId}
      />
    </div>
  );
}
