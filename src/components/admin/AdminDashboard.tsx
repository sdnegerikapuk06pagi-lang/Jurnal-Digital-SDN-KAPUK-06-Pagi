import React, { useState, useEffect, useRef } from 'react';
import { SchoolSettings, Murid, Guru, Jurnal7KAIH, JurnalMembaca, DAFTAR_KELAS, AdminUser } from '../../types';
import {
  Settings,
  Users,
  GraduationCap,
  Database,
  BarChart3,
  Save,
  Plus,
  Trash2,
  Edit,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Image,
  Sparkles,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  FileText,
  RotateCcw as RotateCcwIcon,
} from 'lucide-react';
import { generateAppsScriptCode, generateAppsScriptHtml } from '../../services/appsScriptGenerator';
import { KopSurat } from '../KopSurat';
import { Rekapitulasi7KAIHGuru } from '../kaih/Rekapitulasi7KAIHGuru';
import {
  downloadElementAsPdf,
  downloadPrintableHtml,
  safePrintElement,
} from '../../services/printAndDownloadService';
import { storageService } from '../../services/storageService';
import { ImportDataModal } from '../common/ImportDataModal';
import { downloadTemplateMuridExcel, downloadTemplateGuruExcel } from '../../services/excelImportService';

interface AdminDashboardProps {
  settings: SchoolSettings;
  onUpdateSettings: (s: SchoolSettings) => void;
  muridList: Murid[];
  onUpdateMuridList: (list: Murid[]) => void;
  guruList: Guru[];
  onUpdateGuruList: (list: Guru[]) => void;
  jurnal7KaihList: Jurnal7KAIH[];
  jurnalMembacaList: JurnalMembaca[];
  onSyncSpreadsheet: () => void;
  isSyncing: boolean;
  onResetDatabase: () => void;
  onUpdate7KaihList?: (list: Jurnal7KAIH[]) => void;
  onUpdateMembacaList?: (list: JurnalMembaca[]) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  onUpdateSettings,
  muridList,
  onUpdateMuridList,
  guruList,
  onUpdateGuruList,
  jurnal7KaihList,
  jurnalMembacaList,
  onSyncSpreadsheet,
  isSyncing,
  onResetDatabase,
  onUpdate7KaihList,
  onUpdateMembacaList,
}) => {
  const [activeTab, setActiveTab] = useState<
    'statistik' | 'kelola_akun' | 'lampiran4' | 'pengaturan' | 'database_murid' | 'database_guru' | 'spreadsheet'
  >('kelola_akun');
  const [savedAlert, setSavedAlert] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [showAppsScriptDetails, setShowAppsScriptDetails] = useState(false);

  // Settings form state
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [isDownloadingCardsPdf, setIsDownloadingCardsPdf] = useState(false);
  const loginCardsRef = useRef<HTMLDivElement>(null);

  // Sync settings when external changes occur
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Add Murid state
  const [isAddingMurid, setIsAddingMurid] = useState(false);
  const [newMurid, setNewMurid] = useState<Omit<Murid, 'id'>>({
    nama: '',
    nisn: '',
    nis: '',
    kelas: 'Kelas 4A',
    jenisKelamin: 'L',
    namaOrangTua: '',
    noHpOraangTua: '',
    pin: '1234',
  });

  // Add Guru state
  const [isAddingGuru, setIsAddingGuru] = useState(false);
  const [newGuru, setNewGuru] = useState<Omit<Guru, 'id'>>({
    nama: '',
    nip: '',
    jabatan: 'Wali Kelas 4B',
    kelasAmpu: 'Kelas 4B',
    email: '',
    noHp: '',
    pin: '1234',
  });

  // State Kelola Akun & PIN
  const [subTabAkun, setSubTabAkun] = useState<'murid' | 'guru' | 'admin'>('murid');
  const [searchAkun, setSearchAkun] = useState('');
  const [filterKelasAkun, setFilterKelasAkun] = useState('Semua Kelas');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempStudentPin, setTempStudentPin] = useState('');
  const [editingGuruId, setEditingGuruId] = useState<string | null>(null);
  const [tempGuruPin, setTempGuruPin] = useState('');
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [isPrintingLoginCards, setIsPrintingLoginCards] = useState(false);
  const [isImportMuridModalOpen, setIsImportMuridModalOpen] = useState(false);
  const [isImportGuruModalOpen, setIsImportGuruModalOpen] = useState(false);

  // State Kelola Pengguna Admin (Mendukung multi-admin & penambahan akun baru)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(storageService.getAdminUsers());
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState<{
    username: string;
    password: string;
    nama: string;
    role: 'admin' | 'kepsek';
  }>({
    username: '',
    password: '',
    nama: '',
    role: 'admin',
  });
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [tempAdminPassword, setTempAdminPassword] = useState('');
  const [visibleAdminPasswords, setVisibleAdminPasswords] = useState<Record<string, boolean>>({});

  // Cloud Sync state
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudDiagnostic, setCloudDiagnostic] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    suggestions?: string[];
  } | null>(null);

  const handleAdminPull = async () => {
    setIsPullingCloud(true);
    setCloudDiagnostic(null);
    try {
      const res = await storageService.pullDataFromSpreadsheet(formData.googleWebAppUrl || formData.spreadsheetUrl);
      setIsPullingCloud(false);
      if (res.success) {
        setCloudDiagnostic({
          type: 'success',
          message: res.message,
        });
        setSavedAlert('Data berhasil ditarik dan disinkronkan dari Google Spreadsheet!');
        setTimeout(() => setSavedAlert(null), 5000);
      } else {
        setCloudDiagnostic({
          type: 'error',
          message: res.message,
          suggestions: [
            'Pastikan Web App diatur "Siapa saja (Anyone)" dan "Jalankan sebagai: Saya".',
            'Jika Anda baru berganti akun Google (misal ke akun Gmail), pastikan memasukkan URL Web App dari akun tersebut.',
            'Atau masukkan link Google Spreadsheet dengan izin "Siapa saja yang memiliki link dapat melihat".',
          ],
        });
      }
    } catch (e: any) {
      setIsPullingCloud(false);
      setCloudDiagnostic({
        type: 'error',
        message: e.message || 'Gagal menarik data dari Google Spreadsheet.',
      });
    }
  };

  const handleAdminPush = async () => {
    setIsPushingCloud(true);
    setCloudDiagnostic(null);
    try {
      const res = await storageService.syncAllToSpreadsheet(formData.googleWebAppUrl);
      setIsPushingCloud(false);
      if (res.success) {
        setCloudDiagnostic({
          type: 'success',
          message: res.message,
        });
        setSavedAlert('Seluruh data lokal berhasil dikirim ke Google Spreadsheet!');
        setTimeout(() => setSavedAlert(null), 5000);
      } else {
        setCloudDiagnostic({
          type: 'error',
          message: res.message,
          suggestions: [
            'Untuk mengunggah (Push), gunakan URL Google Apps Script Web App (bukan link spreadsheet biasa).',
          ],
        });
      }
    } catch (e: any) {
      setIsPushingCloud(false);
      setCloudDiagnostic({
        type: 'error',
        message: e.message || 'Gagal mengirim data ke Google Spreadsheet.',
      });
    }
  };

  const handleAdminTest = async () => {
    setIsTestingCloud(true);
    setCloudDiagnostic(null);
    try {
      const res = await storageService.testConnection(formData.googleWebAppUrl || formData.spreadsheetUrl);
      setIsTestingCloud(false);
      if (res.success) {
        setCloudDiagnostic({
          type: 'success',
          message: res.message,
          suggestions: res.suggestions,
        });
      } else {
        setCloudDiagnostic({
          type: 'error',
          message: res.message,
          suggestions: res.suggestions,
        });
      }
    } catch (e: any) {
      setIsTestingCloud(false);
      setCloudDiagnostic({
        type: 'error',
        message: e.message || 'Uji coba koneksi gagal.',
      });
    }
  };

  const handleBulkImportMurid = (data: Murid[], mode: 'replace' | 'append') => {
    const updated = storageService.bulkImportMurid(
      data,
      mode,
      filterKelasDb !== 'Semua Kelas' ? filterKelasDb : undefined
    );
    onUpdateMuridList(updated);
    setSavedAlert(`Berhasil mengimpor ${data.length} data murid ke dalam sistem!`);
    setTimeout(() => setSavedAlert(null), 4000);
  };

  const handleBulkImportGuru = (data: Guru[], mode: 'replace' | 'append') => {
    const updated = storageService.bulkImportGuru(data, mode);
    onUpdateGuruList(updated);
    setSavedAlert(`Berhasil mengimpor ${data.length} data guru ke dalam sistem!`);
    setTimeout(() => setSavedAlert(null), 4000);
  };

  const handleClearDemoMurid = () => {
    if (
      confirm(
        'Hapus seluruh akun contoh / demo murid (m-01 s/d m-12)? Data murid asli yang diimpor tidak akan terhapus.'
      )
    ) {
      const remaining = storageService.clearDemoAccounts();
      onUpdateMuridList(remaining);
      setSavedAlert('Seluruh akun contoh / demo murid berhasil dibersihkan.');
      setTimeout(() => setSavedAlert(null), 4000);
    }
  };

  // Apps Script Code & HTML
  const currentSpreadsheetUrlOrId = formData.spreadsheetUrl || formData.spreadsheetId || settings.spreadsheetUrl || settings.spreadsheetId || '';
  const appsScriptCode = generateAppsScriptCode(settings.namaSekolah, currentSpreadsheetUrlOrId);
  const appsScriptHtml = generateAppsScriptHtml(settings.namaSekolah);
  const [selectedScriptTab, setSelectedScriptTab] = useState<'gs' | 'html'>('gs');
  const [copiedHtml, setCopiedHtml] = useState(false);

  const togglePinVisibility = (id: string) => {
    setVisiblePins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedAlert('Pengaturan Identitas & Konfigurasi Sekolah Berhasil Disimpan!');
    setTimeout(() => setSavedAlert(null), 4000);
  };

  const handleCopyCode = () => {
    const textToCopy = selectedScriptTab === 'gs' ? appsScriptCode : appsScriptHtml;
    navigator.clipboard.writeText(textToCopy);
    if (selectedScriptTab === 'gs') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 3000);
    }
  };

  const handleDownloadScriptFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Action Save Student PIN
  const handleSaveStudentPin = (studentId: string) => {
    if (!tempStudentPin.trim()) return;
    const updated = muridList.map((m) =>
      m.id === studentId ? { ...m, pin: tempStudentPin.trim() } : m
    );
    onUpdateMuridList(updated);
    setEditingStudentId(null);
    setSavedAlert('PIN Murid berhasil diperbarui!');
    setTimeout(() => setSavedAlert(null), 3000);
  };

  // Action Reset Student PIN to 1234
  const handleResetStudentPin = (studentId: string) => {
    const updated = muridList.map((m) => (m.id === studentId ? { ...m, pin: '1234' } : m));
    onUpdateMuridList(updated);
    setSavedAlert('PIN Murid berhasil di-reset ke default 1234!');
    setTimeout(() => setSavedAlert(null), 3000);
  };

  // Action Reset All Student PINs in Selected Class
  const handleResetAllStudentsPin = () => {
    if (
      confirm(
        `Reset semua PIN murid (${filterKelasAkun}) menjadi "1234"? Murid dan orang tua dapat login kembali dengan PIN ini.`
      )
    ) {
      const updated = muridList.map((m) => {
        if (filterKelasAkun === 'Semua Kelas' || m.kelas === filterKelasAkun) {
          return { ...m, pin: '1234' };
        }
        return m;
      });
      onUpdateMuridList(updated);
      setSavedAlert(`Seluruh PIN murid (${filterKelasAkun}) telah direset ke 1234.`);
      setTimeout(() => setSavedAlert(null), 4000);
    }
  };

  // Action Save Guru PIN/Password
  const handleSaveGuruPin = (guruId: string) => {
    if (!tempGuruPin.trim()) return;
    const updated = guruList.map((g) =>
      g.id === guruId ? { ...g, pin: tempGuruPin.trim() } : g
    );
    onUpdateGuruList(updated);
    setEditingGuruId(null);
    setSavedAlert('Password Guru berhasil diperbarui!');
    setTimeout(() => setSavedAlert(null), 3000);
  };

  // Action Reset Guru PIN to 1234
  const handleResetGuruPin = (guruId: string) => {
    const updated = guruList.map((g) => (g.id === guruId ? { ...g, pin: '1234' } : g));
    onUpdateGuruList(updated);
    setSavedAlert('Password Guru berhasil di-reset ke default 1234!');
    setTimeout(() => setSavedAlert(null), 3000);
  };

  const handleAddMuridSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Murid = {
      ...newMurid,
      id: `m-${Date.now()}`,
    };
    onUpdateMuridList([...muridList, created]);
    setIsAddingMurid(false);
    setNewMurid({
      nama: '',
      nisn: '',
      nis: '',
      kelas: 'Kelas 4A',
      jenisKelamin: 'L',
      namaOrangTua: '',
      noHpOraangTua: '',
      pin: '1234',
    });
    setSavedAlert('Data murid baru berhasil ditambahkan.');
    setTimeout(() => setSavedAlert(null), 3000);
  };

  const handleDeleteMurid = (id: string) => {
    const target = muridList.find((m) => m.id === id);
    if (confirm(`Yakin ingin menghapus data murid "${target?.nama || id}"? Data otomatis terhapus dari sistem dan Google Spreadsheet.`)) {
      const res = storageService.deleteMurid(id);
      onUpdateMuridList(res.remaining);
      setSavedAlert(res.message);
      setTimeout(() => setSavedAlert(null), 4000);
    }
  };

  // State & Handlers Edit Murid Admin & Filter DB
  const [editingMuridAdmin, setEditingMuridAdmin] = useState<Murid | null>(null);
  const [filterKelasDb, setFilterKelasDb] = useState('Semua Kelas');
  const [searchDbMurid, setSearchDbMurid] = useState('');

  const handleEditMuridAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMuridAdmin) return;
    const updated = muridList.map((m) =>
      m.id === editingMuridAdmin.id ? editingMuridAdmin : m
    );
    onUpdateMuridList(updated);
    setEditingMuridAdmin(null);
    setSavedAlert(`Data murid ${editingMuridAdmin.nama} berhasil diperbarui.`);
    setTimeout(() => setSavedAlert(null), 3000);
  };

  const handleDeleteAllMuridAdmin = () => {
    const targetLabel = filterKelasDb === 'Semua Kelas' ? 'SEMUA murid sekolah' : `seluruh murid ${filterKelasDb}`;
    if (confirm(`Apakah Anda yakin ingin MENGHAPUS ${targetLabel}? Data akan otomatis terhapus dari sistem dan Google Spreadsheet.`)) {
      if (filterKelasDb === 'Semua Kelas') {
        storageService.deleteAllMurid();
        onUpdateMuridList([]);
      } else {
        const remaining = storageService.deleteMuridByKelas(filterKelasDb);
        onUpdateMuridList(remaining);
      }
      setSavedAlert(`Data ${targetLabel} telah berhasil dihapus dan disinkronkan ke Google Spreadsheet.`);
      setTimeout(() => setSavedAlert(null), 4000);
    }
  };

  const handleDeleteAllGuruAdmin = () => {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA data guru sekolah? Data akan otomatis terhapus dari sistem dan sheet DATA_GURU di Google Spreadsheet.')) {
      storageService.deleteAllGuru();
      onUpdateGuruList([]);
      setSavedAlert('Seluruh data guru berhasil dihapus dari sistem dan Google Spreadsheet.');
      setTimeout(() => setSavedAlert(null), 4000);
    }
  };

  const handleDeleteAll7KaihAdmin = () => {
    if (confirm('Hapus seluruh riwayat data Jurnal 7 KAIH di sekolah? Data akan otomatis dibersihkan dari Google Spreadsheet.')) {
      storageService.deleteAll7Kaih();
      if (onUpdate7KaihList) {
        onUpdate7KaihList([]);
      }
      setSavedAlert('Seluruh entri Jurnal 7 KAIH berhasil dibersihkan dari sistem dan Google Spreadsheet.');
      setTimeout(() => setSavedAlert(null), 3500);
    }
  };

  const handleDeleteAllMembacaAdmin = () => {
    if (confirm('Hapus seluruh riwayat data Jurnal Membaca di sekolah? Data akan otomatis dibersihkan dari Google Spreadsheet.')) {
      storageService.deleteAllMembaca();
      if (onUpdateMembacaList) {
        onUpdateMembacaList([]);
      }
      setSavedAlert('Seluruh entri Jurnal Membaca berhasil dibersihkan dari sistem dan Google Spreadsheet.');
      setTimeout(() => setSavedAlert(null), 3500);
    }
  };

  const handleDeleteAllDataAdmin = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SELURUH DATA SEKOLAH (Semua Murid, Semua Guru, Semua Jurnal 7 KAIH, dan Semua Jurnal Membaca)?\n\nDatabase lokal dan Google Spreadsheet akan dikosongkan secara permanen!')) {
      storageService.deleteAllData();
      onUpdateMuridList([]);
      onUpdateGuruList([]);
      if (onUpdate7KaihList) onUpdate7KaihList([]);
      if (onUpdateMembacaList) onUpdateMembacaList([]);
      setSavedAlert('Seluruh data sekolah (Murid, Guru, dan Jurnal) berhasil dibersihkan dan disinkronkan ke Google Spreadsheet.');
      setTimeout(() => setSavedAlert(null), 5000);
    }
  };

  const handleAddGuruSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Guru = {
      ...newGuru,
      id: `g-${Date.now()}`,
    };
    onUpdateGuruList([...guruList, created]);
    storageService.addGuru(created);
    setIsAddingGuru(false);
    setSavedAlert('Data guru baru berhasil ditambahkan dan disinkronkan ke Google Spreadsheet.');
    setTimeout(() => setSavedAlert(null), 3000);
  };

  const handleDeleteGuru = (id: string) => {
    const target = guruList.find((g) => g.id === id);
    if (confirm(`Yakin ingin menghapus data guru "${target?.nama || id}"? Data otomatis terhapus dari sistem dan Google Spreadsheet.`)) {
      const res = storageService.deleteGuru(id);
      onUpdateGuruList(res.remaining);
      setSavedAlert(res.message);
      setTimeout(() => setSavedAlert(null), 4000);
    }
  };

  // Handlers Kelola Pengguna Admin Baru (Multi-Admin)
  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newAdminUser.username.trim();
    const cleanPass = newAdminUser.password.trim();
    if (!cleanUser || !cleanPass) {
      setSavedAlert('Username dan Password admin wajib diisi!');
      setTimeout(() => setSavedAlert(null), 3500);
      return;
    }
    const existing = storageService.findAdminUser(cleanUser);
    if (existing) {
      setSavedAlert(`Username "${cleanUser}" sudah digunakan. Silakan gunakan username lain.`);
      setTimeout(() => setSavedAlert(null), 4000);
      return;
    }
    const created = storageService.addAdminUser({
      username: cleanUser,
      password: cleanPass,
      nama: newAdminUser.nama.trim() || 'Petugas Administrator',
      role: newAdminUser.role,
    });
    setAdminUsers(storageService.getAdminUsers());
    setIsAddingAdmin(false);
    setNewAdminUser({ username: '', password: '', nama: '', role: 'admin' });
    setSavedAlert(`Pengguna Administrator baru "${created.username}" berhasil ditambahkan!`);
    setTimeout(() => setSavedAlert(null), 4000);
  };

  const handleDeleteAdminUser = (id: string, username: string) => {
    if (username.toLowerCase() === 'admin06' || id === 'admin-master') {
      setSavedAlert('Akun master admin06 dilindungi dan tidak dapat dihapus.');
      setTimeout(() => setSavedAlert(null), 3500);
      return;
    }
    if (confirm(`Yakin ingin menghapus akses administrator untuk akun "${username}"?`)) {
      const ok = storageService.deleteAdminUser(id);
      if (ok) {
        setAdminUsers(storageService.getAdminUsers());
        setSavedAlert(`Akun administrator "${username}" berhasil dihapus.`);
        setTimeout(() => setSavedAlert(null), 3500);
      }
    }
  };

  const handleSaveAdminPassword = (id: string) => {
    if (!tempAdminPassword.trim()) return;
    storageService.updateAdminUser(id, { password: tempAdminPassword.trim() });
    const target = adminUsers.find((u) => u.id === id);
    if (target && target.username.toLowerCase() === 'admin06') {
      onUpdateSettings({ ...formData, adminPassword: tempAdminPassword.trim() });
    }
    setAdminUsers(storageService.getAdminUsers());
    setEditingAdminId(null);
    setTempAdminPassword('');
    setSavedAlert('Password akun administrator berhasil diperbarui!');
    setTimeout(() => setSavedAlert(null), 3500);
  };

  // Export CSV
  const handleExportMuridCsv = () => {
    const headers = ['ID', 'NISN', 'NIS', 'Nama', 'Kelas', 'JK', 'Nama Orang Tua', 'No HP', 'PIN Login'];
    const rows = muridList.map((m) => [
      m.id,
      m.nisn,
      m.nis,
      `"${m.nama}"`,
      m.kelas,
      m.jenisKelamin,
      `"${m.namaOrangTua}"`,
      m.noHpOraangTua,
      m.pin,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DATA_AKUN_MURID_SDN_KAPUK_06_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Murid for Account Management
  const filteredMuridAccounts = muridList.filter((m) => {
    const matchClass = filterKelasAkun === 'Semua Kelas' || m.kelas === filterKelasAkun;
    const matchSearch =
      !searchAkun.trim() ||
      m.nama.toLowerCase().includes(searchAkun.toLowerCase()) ||
      m.nisn.includes(searchAkun) ||
      m.namaOrangTua.toLowerCase().includes(searchAkun.toLowerCase());
    return matchClass && matchSearch;
  });

  // Filtered Guru for Account Management
  const filteredGuruAccounts = guruList.filter((g) => {
    return (
      !searchAkun.trim() ||
      g.nama.toLowerCase().includes(searchAkun.toLowerCase()) ||
      g.nip.includes(searchAkun) ||
      g.email.toLowerCase().includes(searchAkun.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Admin Header Banner */}
      <div className="no-print bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                Administrator & Kepala Sekolah
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">
                Panel Kontrol & Manajemen Sistem Informasi
              </h2>
              <p className="text-xs text-slate-300">
                SDN Kapuk 06 Pagi • Pengaturan Akun, Database & Sinkronisasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSyncSpreadsheet}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sinkronkan ke Spreadsheet</span>
            </button>
          </div>
        </div>
      </div>

      {savedAlert && (
        <div className="no-print mb-6 p-4 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="text-xs font-bold">{savedAlert}</span>
          </div>
          <button
            onClick={() => setSavedAlert(null)}
            className="text-xs bg-emerald-800/40 px-3 py-1 rounded-lg"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('kelola_akun')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'kelola_akun'
              ? 'bg-amber-400 text-blue-950 shadow-md font-extrabold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4 text-blue-950" />
          Kelola Akun & PIN/Password
        </button>

        <button
          onClick={() => setActiveTab('statistik')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'statistik'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Statistik Sekolah
        </button>

        <button
          onClick={() => setActiveTab('lampiran4')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'lampiran4'
              ? 'bg-emerald-700 text-white shadow-md font-bold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
          Rekapitulasi 7 KAIH (Lampiran 4)
        </button>

        <button
          onClick={() => setActiveTab('pengaturan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'pengaturan'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          Penyetingan Sekolah & Kop Surat
        </button>

        <button
          onClick={() => setActiveTab('database_murid')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'database_murid'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-sky-400" />
          Database Murid ({muridList.length})
        </button>

        <button
          onClick={() => setActiveTab('database_guru')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'database_guru'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-purple-400" />
          Database Guru ({guruList.length})
        </button>

        <button
          onClick={() => setActiveTab('spreadsheet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'spreadsheet'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-300" />
          <span>🌐 Cloud Database & Pembagian Online</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB UTAMA: KELOLA AKUN & PIN / PASSWORD (DISETTING OLEH ADMIN) */}
      {/* ======================================================== */}
      {activeTab === 'kelola_akun' && (
        <div className="space-y-6">
          {/* Header Card Kelola Akun */}
          <div className="no-print bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Pusat Pengaturan Akun & Password Pengguna
                  </h3>
                  <p className="text-xs text-slate-500">
                    Administrator berwenang penuh mengatur PIN murid, Password guru, serta mencetak kartu login.
                  </p>
                </div>
              </div>

              {/* Sub-Tabs: Murid vs Guru vs Admin Master */}
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSubTabAkun('murid')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    subTabAkun === 'murid'
                      ? 'bg-amber-400 text-blue-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Akun Murid ({muridList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabAkun('guru')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    subTabAkun === 'guru'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Akun Guru ({guruList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubTabAkun('admin')}
                  className={`px-3.5 py-2 rounded-xl transition-all ${
                    subTabAkun === 'admin'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kelola Akun Admin ({adminUsers.length})
                </button>
              </div>
            </div>

            {/* 1. SUB-TAB AKUN MURID */}
            {subTabAkun === 'murid' && (
              <div className="pt-4 space-y-4">
                {/* Filter and Bulk Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchAkun}
                        onChange={(e) => setSearchAkun(e.target.value)}
                        placeholder="Cari Nama / NISN murid..."
                        className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    <select
                      value={filterKelasAkun}
                      onChange={(e) => setFilterKelasAkun(e.target.value)}
                      className="text-xs font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                    >
                      <option value="Semua Kelas">Semua Kelas</option>
                      {DAFTAR_KELAS.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImportMuridModalOpen(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Impor massal akun murid langsung dari Excel atau Spreadsheet"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Impor Akun dari Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearDemoMurid}
                      className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Bersihkan akun contoh/demo m-01 s/d m-12"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hapus Akun Demo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetAllStudentsPin}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Reset semua PIN murid ke default 1234"
                    >
                      <RotateCcwIcon className="w-3.5 h-3.5" />
                      Reset PIN ({filterKelasAkun})
                    </button>

                    {muridList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteAllMuridAdmin}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Hapus seluruh murid (sesuai filter kelas saat ini)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Murid ({filterKelasAkun})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsPrintingLoginCards(!isPrintingLoginCards)}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-300" />
                      {isPrintingLoginCards ? 'Sembunyikan Kartu' : 'Cetak Kartu Login Murid'}
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    <b>Petunjuk Admin:</b> PIN ini digunakan murid dan orang tua saat login di portal murid.
                    Setiap perubahan PIN akan langsung aktif seketika.
                  </span>
                </div>

                {/* Tabel Akun & PIN Murid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">No</th>
                        <th className="py-3 px-3">Nama Lengkap Murid</th>
                        <th className="py-3 px-3">NISN</th>
                        <th className="py-3 px-3">Kelas</th>
                        <th className="py-3 px-3">L/P</th>
                        <th className="py-3 px-3">Nama Orang Tua</th>
                        <th className="py-3 px-3">PIN Login Saat Ini</th>
                        <th className="py-3 px-3 text-right">Aksi Administrator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMuridAccounts.map((m, idx) => {
                        const isEditingThis = editingStudentId === m.id;
                        const isVisible = visiblePins[m.id];

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-mono">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{m.nama}</td>
                            <td className="py-3 px-3 font-mono text-slate-600 font-semibold">{m.nisn}</td>
                            <td className="py-3 px-3">
                              <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {m.kelas}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  m.jenisKelamin === 'P'
                                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {m.jenisKelamin === 'P' ? 'P (Perempuan)' : 'L (Laki-Laki)'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-600">{m.namaOrangTua}</td>
                            <td className="py-3 px-3">
                              {isEditingThis ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={tempStudentPin}
                                    onChange={(e) => setTempStudentPin(e.target.value)}
                                    className="w-20 px-2 py-1 bg-white border-2 border-amber-400 rounded-lg font-mono font-bold text-xs"
                                    placeholder="PIN baru"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStudentPin(m.id)}
                                    className="p-1 bg-emerald-600 text-white rounded-lg text-xs"
                                    title="Simpan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStudentId(null)}
                                    className="p-1 bg-slate-200 text-slate-600 rounded-lg text-xs"
                                    title="Batal"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs tracking-wider">
                                    {isVisible ? m.pin : '••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePinVisibility(m.id)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                    title={isVisible ? 'Sembunyikan PIN' : 'Lihat PIN'}
                                  >
                                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudentId(m.id);
                                    setTempStudentPin(m.pin);
                                  }}
                                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold text-[11px] transition-colors"
                                >
                                  Ubah PIN
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetStudentPin(m.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] transition-colors"
                                  title="Reset PIN ke 1234"
                                >
                                  Reset 1234
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. SUB-TAB AKUN GURU */}
            {subTabAkun === 'guru' && (
              <div className="pt-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2 flex-1">
                    <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>
                      <b>Pengaturan Password Guru:</b> Bapak/Ibu Guru menggunakan NIP atau Email Akun Belajar
                      beserta Password ini untuk login ke Portal Guru Kelas.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsImportGuruModalOpen(true)}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                      title="Impor akun guru dari file Excel atau Spreadsheet"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Impor Akun Guru dari Excel</span>
                    </button>

                    {guruList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteAllGuruAdmin}
                        className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                        title="Hapus seluruh akun guru dari sistem dan Google Spreadsheet"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Hapus Semua Akun Guru ({guruList.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">No</th>
                        <th className="py-3 px-3">Nama Guru</th>
                        <th className="py-3 px-3">NIP</th>
                        <th className="py-3 px-3">Jabatan / Kelas</th>
                        <th className="py-3 px-3">Email (@guru.sd.belajar.id)</th>
                        <th className="py-3 px-3">Password / PIN Guru</th>
                        <th className="py-3 px-3 text-right">Aksi Administrator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredGuruAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                            <p className="font-semibold text-xs text-slate-600">Tidak ada akun guru ditemukan.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Tambahkan guru di tab Database Guru atau lakukan impor akun guru.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredGuruAccounts.map((g, idx) => {
                        const isEditingThis = editingGuruId === g.id;
                        const isVisible = visiblePins[g.id];

                        return (
                          <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-mono">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{g.nama}</td>
                            <td className="py-3 px-3 font-mono text-slate-600">{g.nip}</td>
                            <td className="py-3 px-3 text-slate-700 font-semibold">{g.jabatan}</td>
                            <td className="py-3 px-3 text-slate-500 font-mono">{g.email}</td>
                            <td className="py-3 px-3">
                              {isEditingThis ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={tempGuruPin}
                                    onChange={(e) => setTempGuruPin(e.target.value)}
                                    className="w-24 px-2 py-1 bg-white border-2 border-blue-600 rounded-lg font-mono font-bold text-xs"
                                    placeholder="Password"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveGuruPin(g.id)}
                                    className="p-1 bg-emerald-600 text-white rounded-lg text-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingGuruId(null)}
                                    className="p-1 bg-slate-200 text-slate-600 rounded-lg text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-blue-950 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                                    {isVisible ? g.pin : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePinVisibility(g.id)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                  >
                                    {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGuruId(g.id);
                                    setTempGuruPin(g.pin);
                                  }}
                                  className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg font-bold text-[11px] transition-colors"
                                >
                                  Ubah Password
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetGuruPin(g.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px] transition-colors"
                                >
                                  Reset 1234
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteGuru(g.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                                  title="Hapus Akun Guru"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. SUB-TAB AKUN MASTER & MULTI-ADMIN */}
            {subTabAkun === 'admin' && (
              <div className="pt-4 space-y-6">
                {/* Header & Tombol Tambah Admin Baru */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">
                        Manajemen Pengguna Administrator & Kepala Sekolah
                      </h4>
                      <p className="text-xs text-slate-400">
                        Tambahkan akun admin baru agar pengelolaan sistem tidak sendirian.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingAdmin(!isAddingAdmin)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingAdmin ? 'Tutup Formulir' : 'Tambah Pengguna Admin Baru'}</span>
                  </button>
                </div>

                {/* Formulir Tambah Pengguna Admin Baru */}
                {isAddingAdmin && (
                  <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl border-2 border-emerald-500/40 text-white animate-in fade-in space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Formulir Tambah Pengguna Admin Baru
                        </h4>
                        <p className="text-xs text-slate-400">
                          Akun baru akan langsung dapat login ke Portal Administrator sekolah.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddingAdmin(false)}
                        className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleAddAdminSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Username Admin (Login) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminUser.username}
                          onChange={(e) => setNewAdminUser({ ...newAdminUser, username: e.target.value })}
                          placeholder="Contoh: admin02 / operator"
                          className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Password Admin <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminUser.password}
                          onChange={(e) => setNewAdminUser({ ...newAdminUser, password: e.target.value })}
                          placeholder="Password akun baru"
                          className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white font-mono focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Nama Lengkap Pengguna <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newAdminUser.nama}
                          onChange={(e) => setNewAdminUser({ ...newAdminUser, nama: e.target.value })}
                          placeholder="Contoh: Bpk. Dani (Operator)"
                          className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">
                          Hak Akses / Peran
                        </label>
                        <select
                          value={newAdminUser.role}
                          onChange={(e) => setNewAdminUser({ ...newAdminUser, role: e.target.value as 'admin' | 'kepsek' })}
                          className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                        >
                          <option value="admin">Administrator Sekolah</option>
                          <option value="kepsek">Kepala Sekolah</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsAddingAdmin(false)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Simpan Pengguna Admin</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Info Keamanan & Kerahasiaan Password */}
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Keamanan Master Administrator:</span> Kredensial akun master (Username: <code className="bg-amber-100 px-1 py-0.5 rounded font-bold font-mono">admin06</code>) bersifat rahasia dan tidak ditampilkan pada layar login umum. Hanya Anda dan pengguna admin yang berwenang yang dapat melihat dan mengelola akun di halaman ini.
                  </div>
                </div>

                {/* Tabel Daftar Pengguna Administrator */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        Daftar Akun Administrator Aktif ({adminUsers.length} Pengguna)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Seluruh akun di bawah memiliki kewenangan penuh masuk ke Panel Administrator.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3.5">No</th>
                          <th className="py-3 px-3.5">Username</th>
                          <th className="py-3 px-3.5">Nama Petugas / Pengguna</th>
                          <th className="py-3 px-3.5">Peran / Otoritas</th>
                          <th className="py-3 px-3.5">Password</th>
                          <th className="py-3 px-3.5 text-right">Aksi Administrator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminUsers.map((user, idx) => {
                          const isMaster = user.username.toLowerCase() === 'admin06' || user.id === 'admin-master';
                          const isEditingThis = editingAdminId === user.id;
                          const isVisible = visibleAdminPasswords[user.id];

                          return (
                            <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3.5 font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                    {user.username}
                                  </span>
                                  {isMaster && (
                                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-300">
                                      Master
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3.5 font-bold text-slate-900">
                                {user.nama}
                              </td>
                              <td className="py-3 px-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    user.role === 'kepsek'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                                  }`}
                                >
                                  {user.role === 'kepsek' ? 'Kepala Sekolah' : 'Administrator'}
                                </span>
                              </td>
                              <td className="py-3 px-3.5">
                                {isEditingThis ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={tempAdminPassword}
                                      onChange={(e) => setTempAdminPassword(e.target.value)}
                                      className="w-28 px-2 py-1 bg-white border-2 border-emerald-500 rounded-lg font-mono font-bold text-xs"
                                      placeholder="Password baru"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveAdminPassword(user.id)}
                                      className="p-1 bg-emerald-600 text-white rounded-lg text-xs hover:bg-emerald-700"
                                      title="Simpan Password"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingAdminId(null)}
                                      className="p-1 bg-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-300"
                                      title="Batal"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                      {isVisible ? user.password : '••••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setVisibleAdminPasswords((prev) => ({
                                          ...prev,
                                          [user.id]: !prev[user.id],
                                        }))
                                      }
                                      className="p-1 text-slate-400 hover:text-slate-700"
                                      title={isVisible ? 'Sembunyikan' : 'Tampilkan'}
                                    >
                                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingAdminId(user.id);
                                      setTempAdminPassword(user.password);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] transition-colors"
                                  >
                                    Ubah Password
                                  </button>

                                  {!isMaster ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdminUser(user.id, user.username)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Hapus Akun Admin"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic px-1">
                                      Terproteksi
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pengaturan Kredensial Master di Pengaturan Form */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" /> Sinkronisasi Pengaturan Akun Master Utama (admin06)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Username Master Admin</label>
                      <input
                        type="text"
                        value={formData.adminUsername || 'admin06'}
                        onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Password Master Admin</label>
                      <input
                        type="text"
                        value={formData.adminPassword || 'admin123!'}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSettings(formData);
                        // Also update admin-master in adminUsers list
                        const current = storageService.getAdminUsers();
                        const updated = current.map((u) =>
                          u.username.toLowerCase() === 'admin06' || u.id === 'admin-master'
                            ? { ...u, username: formData.adminUsername || 'admin06', password: formData.adminPassword || 'admin123!' }
                            : u
                        );
                        storageService.saveAdminUsers(updated);
                        setAdminUsers(updated);
                        setSavedAlert('Kredensial master berhasil disimpan!');
                        setTimeout(() => setSavedAlert(null), 3000);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                    >
                      Simpan Kredensial Master
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CETAK SLIP KARTU LOGIN SISWA (A4 LAYOUT) */}
          {isPrintingLoginCards && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-300 shadow-xl space-y-6">
              <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Preview Kartu Akun Login Siswa (Siap Cetak Kertas A4)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bagikan kartu slip ini kepada orang tua siswa untuk pengisian Jurnal 7 KAIH dan Membaca.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isDownloadingCardsPdf}
                    onClick={async () => {
                      if (!loginCardsRef.current) return;
                      setIsDownloadingCardsPdf(true);
                      const res = await downloadElementAsPdf(
                        loginCardsRef.current,
                        `Kartu_Login_Siswa_${filterKelasAkun.replace(/\s+/g, '_')}`,
                        { orientation: 'portrait', title: 'Kartu Login Siswa' }
                      );
                      setIsDownloadingCardsPdf(false);
                      setSavedAlert(res.message);
                      setTimeout(() => setSavedAlert(null), 4000);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    <span>{isDownloadingCardsPdf ? 'Membuat PDF...' : 'Unduh PDF (Kertas A4)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!loginCardsRef.current) return;
                      downloadPrintableHtml(
                        loginCardsRef.current,
                        'Kartu Akses Login Siswa',
                        `Kartu_Login_Siswa_${filterKelasAkun.replace(/\s+/g, '_')}`
                      );
                      setSavedAlert('Berkas HTML Siap Cetak berhasil diunduh!');
                      setTimeout(() => setSavedAlert(null), 3000);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span>Unduh Dokumen Siap Cetak (HTML)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (loginCardsRef.current) {
                        safePrintElement(loginCardsRef.current, 'Kartu Login Siswa');
                      } else {
                        window.print();
                      }
                    }}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    <span>Cetak Langsung</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrintingLoginCards(false)}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Tutup
                  </button>
                </div>
              </div>

              {/* Grid Kartu Login Siswa (Cocok untuk dipotong dan dibagikan) */}
              <div ref={loginCardsRef} className="print-container">
                <div className="print-only mb-6">
                  <KopSurat settings={settings} />
                  <h3 className="text-center font-bold text-sm uppercase underline my-2">
                    KARTU AKSES LOGIN E-JURNAL PEMBIASAAN KARAKTER (7 KAIH)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredMuridAccounts.map((m) => (
                    <div
                      key={m.id}
                      className="border-2 border-dashed border-slate-300 p-4 rounded-2xl bg-slate-50/50 space-y-2 avoid-break"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-blue-950 uppercase tracking-wider">
                          SDN KAPUK 06 PAGI
                        </span>
                        <span className="text-[9px] font-bold bg-amber-300 text-blue-950 px-2 py-0.5 rounded-full">
                          {m.kelas}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">Nama Peserta Didik:</span>
                        <h5 className="font-extrabold text-xs text-slate-900">{m.nama}</h5>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">NISN (User):</span>
                          <span className="font-mono font-bold text-slate-800">{m.nisn}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">PIN Masuk:</span>
                          <span className="font-mono font-black text-amber-700 text-sm tracking-widest">{m.pin}</span>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-500 pt-1 text-center">
                        Didampingi Orang Tua: <b>{m.namaOrangTua}</b>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: STATISTIK & REKAPITULASI SEKOLAH */}
      {/* ======================================================== */}
      {activeTab === 'statistik' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Total Peserta Didik</span>
              <div className="mt-2 text-2xl font-black text-slate-900">{muridList.length}</div>
              <p className="text-[11px] text-blue-600 font-medium mt-1">Tersebar di Rombel 1-6</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Guru & Tendik</span>
              <div className="mt-2 text-2xl font-black text-slate-900">{guruList.length}</div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Wali Kelas & Guru Mapel</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Entri Jurnal 7 KAIH</span>
              <div className="mt-2 text-2xl font-black text-slate-900">{jurnal7KaihList.length}</div>
              <p className="text-[11px] text-amber-600 font-medium mt-1">Pembiasaan karakter anak</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold">Buku Terbaca</span>
              <div className="mt-2 text-2xl font-black text-slate-900">{jurnalMembacaList.length}</div>
              <p className="text-[11px] text-indigo-600 font-medium mt-1">Gerakan Literasi Sekolah</p>
            </div>
          </div>

          {/* Rangkuman Rombel SDN Kapuk 06 Pagi */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Partisipasi Pembiasaan per Rombongan Belajar
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Distribusi pengisian jurnal 7 KAIH dan membaca pada kelas-kelas SDN Kapuk 06 Pagi
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Kelas 4A', 'Kelas 5A', 'Kelas 6A'].map((kelasName) => {
                const kMurid = muridList.filter((m) => m.kelas === kelasName);
                const kKaih = jurnal7KaihList.filter((j) => j.kelas === kelasName);
                const kMembaca = jurnalMembacaList.filter((b) => b.kelas === kelasName);

                return (
                  <div key={kelasName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-slate-900">{kelasName}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        {kMurid.length} Murid
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Jurnal 7 KAIH Terkumpul:</span>
                        <span className="font-bold text-slate-800">{kKaih.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jurnal Membaca:</span>
                        <span className="font-bold text-slate-800">{kMembaca.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tingkat Kepatuhan:</span>
                        <span className="font-bold text-emerald-600">92%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB PEMANTAUAN 7 KAIH BULANAN (LAMPIRAN 4) */}
      {/* ======================================================== */}
      {activeTab === 'lampiran4' && (
        <Rekapitulasi7KAIHGuru
          settings={settings}
          currentGuru={guruList[0] || ({ nama: settings.kepalaSekolah, nip: settings.nipKepalaSekolah } as Guru)}
          muridList={muridList}
          jurnal7KaihList={jurnal7KaihList}
          selectedClass="Semua Kelas"
        />
      )}

      {/* ======================================================== */}
      {/* TAB 2: PENYETINGAN APLIKASI OLEH ADMIN & UPLOAD KOP SURAT */}
      {/* ======================================================== */}
      {activeTab === 'pengaturan' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h3 className="text-xl font-bold text-slate-900">Penyetingan Aplikasi & Kop Surat</h3>
            <p className="text-xs text-slate-500">
              Pengaturan identitas sekolah, kepala sekolah, format kop surat resmi, dan tahun ajaran.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Bagian 0: Upload & Pengaturan Logo Resmi Sekolah */}
            <div className="p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl border-2 border-dashed border-blue-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-500" /> Upload Logo Resmi Sekolah
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Unggah logo sekolah Anda (format PNG, JPG, atau WebP). Logo ini otomatis tampil pada Kop Surat Resmi (Lampiran 1–4), Navigasi Header, Slip Kartu Login, serta berkas Cetak dan PDF.
                  </p>
                </div>
                {formData.logoUrl && (
                  <span className="self-start text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Logo Terpasang
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                {/* Preview Box */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-2 border-slate-200 shadow-sm p-2 flex items-center justify-center shrink-0 overflow-hidden">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Preview Logo Sekolah"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Image className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                      <span className="text-[9px] text-slate-400 font-semibold block leading-tight">
                        Belum Ada Logo
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 space-y-2.5 w-full">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Berkas Logo Sekolah (PNG / JPG / WEBP / SVG):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            setSavedAlert('Ukuran berkas logo maksimal 2MB!');
                            setTimeout(() => setSavedAlert(null), 3000);
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData({
                              ...formData,
                              logoUrl: ev.target?.result as string,
                            });
                            setSavedAlert('Logo berhasil dipilih! Klik "Simpan Perubahan Pengaturan" untuk menerapkan.');
                            setTimeout(() => setSavedAlert(null), 3500);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 file:cursor-pointer cursor-pointer bg-white rounded-xl border border-slate-300 p-1 shadow-2xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, logoUrl: undefined });
                          setSavedAlert('Logo sekolah direset ke default.');
                          setTimeout(() => setSavedAlert(null), 3000);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus / Reset Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 1: Identitas Sekolah */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> 1. Identitas Resmi Sekolah
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sekolah</label>
                  <input
                    type="text"
                    value={formData.namaSekolah}
                    onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sub Judul Aplikasi</label>
                  <input
                    type="text"
                    value={formData.subJudul}
                    onChange={(e) => setFormData({ ...formData, subJudul: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* NPSN Field with prominent styling & explanation */}
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>NPSN (Nomor Pokok Sekolah Nasional)</span>
                    </label>
                    <span className="text-[10px] bg-amber-200 text-blue-950 font-mono font-bold px-2 py-0.5 rounded-full">
                      8 Digit Standar Kemendikdasmen
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.npsn}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value.trim() })}
                    placeholder="Contoh: 20105291"
                    className="w-full text-sm font-bold font-mono px-3.5 py-2.5 bg-white rounded-xl border-2 border-amber-300 focus:ring-2 focus:ring-blue-500 text-blue-950 shadow-xs"
                    required
                  />
                  <p className="text-[11px] text-amber-900 mt-1 font-medium">
                    NPSN ini langsung terpasang pada Kop Surat Resmi seluruh dokumen cetak (Lampiran 1–4), slip kartu login murid, dan header aplikasi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Sekolah</label>
                  <input
                    type="text"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Ajaran & Semester</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.tahunAjaran}
                      onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                      placeholder="2026/2027"
                      className="w-full text-xs font-semibold px-2 py-2 bg-slate-50 rounded-xl border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      placeholder="Semester Ganjil (1)"
                      className="w-full text-xs font-semibold px-2 py-2 bg-slate-50 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bagian 2: Kepala Sekolah */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 2. Pejabat Penandatangan (Kepala Sekolah)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kepala Sekolah Beserta Gelar
                  </label>
                  <input
                    type="text"
                    value={formData.kepalaSekolah}
                    onChange={(e) => setFormData({ ...formData, kepalaSekolah: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.nipKepalaSekolah}
                    onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Kop Surat Sekolah */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-3 flex items-center gap-1.5">
                <Image className="w-4 h-4" /> 3. Pengaturan & Upload Kop Surat
              </h4>

              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kopSuratMode"
                      value="default"
                      checked={formData.kopSuratMode === 'default'}
                      onChange={() => setFormData({ ...formData, kopSuratMode: 'default' })}
                      className="text-blue-900"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Gunakan Kop Dinas Resmi Pemprov DKI Jakarta (Standar)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kopSuratMode"
                      value="custom_image"
                      checked={formData.kopSuratMode === 'custom_image'}
                      onChange={() => setFormData({ ...formData, kopSuratMode: 'custom_image' })}
                      className="text-blue-900"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Upload Gambar Kop Surat Kustom
                    </span>
                  </label>
                </div>

                {formData.kopSuratMode === 'custom_image' && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Pilih Berkas Gambar Kop Surat (PNG / JPG / JPEG):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData({
                              ...formData,
                              kopImageUrl: ev.target?.result as string,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-600"
                    />
                    {formData.kopImageUrl && (
                      <div className="mt-3 p-2 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 block mb-1">Preview Kop Surat:</span>
                        <img
                          src={formData.kopImageUrl}
                          alt="Preview Kop"
                          className="max-h-24 mx-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Kop Surat Resmi */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Preview Kop Surat dengan Logo & NPSN Saat Ini
              </h4>
              <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <KopSurat settings={formData} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
              >
                <Save className="w-4 h-4 text-amber-300" />
                Simpan Perubahan Pengaturan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: DATABASE MURID */}
      {/* ======================================================== */}
      {activeTab === 'database_murid' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Master Database Murid</h3>
                <p className="text-xs text-slate-500">
                  Total {muridList.length} peserta didik terdaftar di SDN Kapuk 06 Pagi
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdminPull}
                  disabled={isPullingCloud}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                  title="Tarik data murid terbaru langsung dari Google Spreadsheet"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPullingCloud ? 'animate-spin' : ''}`} />
                  <span>{isPullingCloud ? 'Menarik...' : 'Tarik dari Spreadsheet'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportMuridModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Impor murid massal dari file Excel atau Spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Impor Excel / Spreadsheet</span>
                </button>
                <button
                  type="button"
                  onClick={downloadTemplateMuridExcel}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Unduh file format Excel untuk diisi"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Format Excel</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearDemoMurid}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Bersihkan akun contoh/demo m-01 s/d m-12"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Hapus Akun Demo</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllMuridAdmin}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Hapus Semua Murid (Sesuai Filter Kelas)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua Murid ({filterKelasDb})
                </button>
                <button
                  onClick={handleExportMuridCsv}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Ekspor CSV
                </button>
                <button
                  onClick={() => setIsAddingMurid(true)}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  Tambah Murid
                </button>
              </div>
            </div>

            {/* Filter Kelas & Pencarian Database Murid */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchDbMurid}
                  onChange={(e) => setSearchDbMurid(e.target.value)}
                  placeholder="Cari nama, NISN, atau orang tua..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Filter Kelas:</span>
                <select
                  value={filterKelasDb}
                  onChange={(e) => setFilterKelasDb(e.target.value)}
                  className="text-xs font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white"
                >
                  <option value="Semua Kelas">Semua Kelas ({muridList.length})</option>
                  {DAFTAR_KELAS.map((cls) => {
                    const count = muridList.filter((m) => m.kelas === cls).length;
                    return (
                      <option key={cls} value={cls}>
                        {cls} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Modal Tambah Murid */}
            {isAddingMurid && (
              <div className="p-4 mb-6 rounded-2xl bg-blue-50/70 border border-blue-200 animate-in fade-in">
                <h4 className="text-xs font-bold text-blue-950 mb-3">Formulir Tambah Murid Baru</h4>
                <form onSubmit={handleAddMuridSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Nama Lengkap Murid</label>
                    <input
                      type="text"
                      required
                      value={newMurid.nama}
                      onChange={(e) => setNewMurid({ ...newMurid, nama: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">NISN</label>
                    <input
                      type="text"
                      required
                      value={newMurid.nisn}
                      onChange={(e) => setNewMurid({ ...newMurid, nisn: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Kelas</label>
                    <select
                      value={newMurid.kelas}
                      onChange={(e) => setNewMurid({ ...newMurid, kelas: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    >
                      {DAFTAR_KELAS.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Nama Orang Tua</label>
                    <input
                      type="text"
                      required
                      value={newMurid.namaOrangTua}
                      onChange={(e) => setNewMurid({ ...newMurid, namaOrangTua: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">No HP Orang Tua (WhatsApp)</label>
                    <input
                      type="text"
                      required
                      value={newMurid.noHpOraangTua}
                      onChange={(e) => setNewMurid({ ...newMurid, noHpOraangTua: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingMurid(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-900 text-white rounded-lg font-bold"
                    >
                      Simpan Murid
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal Edit Murid Admin */}
            {editingMuridAdmin && (
              <div className="p-4 mb-6 rounded-2xl bg-amber-50/80 border border-amber-300 animate-in fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Edit className="w-3.5 h-3.5 text-amber-700" /> Edit Biodata Murid: {editingMuridAdmin.nama}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingMuridAdmin(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleEditMuridAdminSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Nama Lengkap Murid</label>
                    <input
                      type="text"
                      required
                      value={editingMuridAdmin.nama}
                      onChange={(e) => setEditingMuridAdmin({ ...editingMuridAdmin, nama: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">NISN</label>
                    <input
                      type="text"
                      required
                      value={editingMuridAdmin.nisn}
                      onChange={(e) => setEditingMuridAdmin({ ...editingMuridAdmin, nisn: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Kelas</label>
                    <select
                      value={editingMuridAdmin.kelas}
                      onChange={(e) => setEditingMuridAdmin({ ...editingMuridAdmin, kelas: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-bold"
                    >
                      {DAFTAR_KELAS.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Nama Orang Tua</label>
                    <input
                      type="text"
                      required
                      value={editingMuridAdmin.namaOrangTua}
                      onChange={(e) => setEditingMuridAdmin({ ...editingMuridAdmin, namaOrangTua: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">No HP Orang Tua (WA)</label>
                    <input
                      type="text"
                      required
                      value={editingMuridAdmin.noHpOraangTua}
                      onChange={(e) => setEditingMuridAdmin({ ...editingMuridAdmin, noHpOraangTua: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">PIN Login</label>
                    <input
                      type="text"
                      required
                      value={editingMuridAdmin.pin}
                      onChange={(e) => setEditingMuridAdmin({ ...editingMuridAdmin, pin: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingMuridAdmin(null)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-900 text-white rounded-lg font-bold shadow-xs"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabel Murid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Nama Murid</th>
                    <th className="py-3 px-3">NISN</th>
                    <th className="py-3 px-3">Kelas</th>
                    <th className="py-3 px-3">Nama Orang Tua</th>
                    <th className="py-3 px-3">No HP (WhatsApp)</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {muridList
                    .filter((m) => {
                      if (filterKelasDb !== 'Semua Kelas' && m.kelas !== filterKelasDb) return false;
                      if (!searchDbMurid.trim()) return true;
                      const q = searchDbMurid.toLowerCase();
                      return (
                        m.nama.toLowerCase().includes(q) ||
                        m.nisn.includes(q) ||
                        m.namaOrangTua.toLowerCase().includes(q)
                      );
                    })
                    .map((m, idx) => (
                    <tr key={m.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{m.nama}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{m.nisn}</td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                          {m.kelas}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{m.namaOrangTua}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{m.noHpOraangTua}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingMuridAdmin({ ...m })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Biodata Murid"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMurid(m.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Murid"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: DATABASE GURU */}
      {/* ======================================================== */}
      {activeTab === 'database_guru' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Master Database Guru & Wali Kelas</h3>
                <p className="text-xs text-slate-500">
                  Pengelolaan guru pengampu dan penugasan kelas di SDN Kapuk 06 Pagi
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportGuruModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Impor daftar guru massal dari file Excel atau Spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Impor Guru (Excel / Spreadsheet)</span>
                </button>
                <button
                  type="button"
                  onClick={downloadTemplateGuruExcel}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Unduh format template Excel untuk data Guru"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Format Excel</span>
                </button>
                <button
                  onClick={() => setIsAddingGuru(true)}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  Tambah Guru
                </button>
                {guruList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAllGuruAdmin}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Hapus seluruh data guru dari database dan Google Spreadsheet"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Guru ({guruList.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modal Tambah Guru */}
            {isAddingGuru && (
              <div className="p-4 mb-6 rounded-2xl bg-indigo-50/70 border border-indigo-200 animate-in fade-in">
                <h4 className="text-xs font-bold text-indigo-950 mb-3">Formulir Tambah Guru Baru</h4>
                <form onSubmit={handleAddGuruSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Nama Guru & Gelar</label>
                    <input
                      type="text"
                      required
                      value={newGuru.nama}
                      onChange={(e) => setNewGuru({ ...newGuru, nama: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">NIP</label>
                    <input
                      type="text"
                      required
                      value={newGuru.nip}
                      onChange={(e) => setNewGuru({ ...newGuru, nip: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Jabatan</label>
                    <input
                      type="text"
                      required
                      value={newGuru.jabatan}
                      onChange={(e) => setNewGuru({ ...newGuru, jabatan: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Kelas Ampu</label>
                    <select
                      value={newGuru.kelasAmpu}
                      onChange={(e) => setNewGuru({ ...newGuru, kelasAmpu: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-300"
                    >
                      {DAFTAR_KELAS.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                      <option value="Semua Kelas">Semua Kelas</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4 flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingGuru(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-900 text-white rounded-lg font-bold"
                    >
                      Simpan Guru
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabel Guru */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Nama Guru</th>
                    <th className="py-3 px-3">NIP</th>
                    <th className="py-3 px-3">Jabatan</th>
                    <th className="py-3 px-3">Kelas Ampu</th>
                    <th className="py-3 px-3">Email (@guru.sd.belajar.id)</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {guruList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                        <p className="font-semibold text-xs text-slate-600">Belum ada data guru terdaftar di database.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Klik &quot;Tambah Guru&quot; atau &quot;Impor Guru (Excel / Spreadsheet)&quot; untuk memasukkan data guru baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    guruList.map((g, idx) => (
                      <tr key={g.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{g.nama}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{g.nip}</td>
                        <td className="py-3 px-3 text-slate-700">{g.jabatan}</td>
                        <td className="py-3 px-3">
                          <span className="bg-indigo-50 text-indigo-800 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                            {g.kelasAmpu}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{g.email}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteGuru(g.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: INTEGRASI GOOGLE SPREADSHEET & APPS SCRIPT */}
      {/* ======================================================== */}
      {activeTab === 'spreadsheet' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Cloud Database & Pembagian Portal Online
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      100% Otomatis
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sistem database terpadu SDN Kapuk 06 Pagi — Otomatis terhubung ke seluruh murid & guru online tanpa perlu salin Apps Script.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdminPull}
                  disabled={isPullingCloud}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  title="Perbarui dan tarik data terbaru dari Cloud Server sekolah"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPullingCloud ? 'animate-spin' : ''}`} />
                  <span>{isPullingCloud ? 'Menyinkronkan...' : '🔄 Sinkronkan Data Cloud'}</span>
                </button>
              </div>
            </div>

            {/* HERO NOTICE: OTOMATIS AKTIF TANPA APPS SCRIPT */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 space-y-4 mb-6 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wide">
                      ⚡ Mode Otomatis Aktif — Tidak Perlu Salin Kode Apps Script!
                    </h4>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded-md">
                      Realtime Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Anda <b>tidak perlu lagi menyalin kode ke Google Apps Script</b> atau pusing dengan izin akun Google yang rumit! Sistem ini telah dilengkapi <b>Cloud Database Terpadu internal</b>.
                    Seluruh murid dan guru yang Anda daftarkan di sini langsung tersimpan di cloud dan dapat login serta mengisi jurnal secara online dari HP atau laptop masing-masing.
                  </p>
                </div>
              </div>

              {/* CARD BAGIKAN PORTAL KE MURID & GURU */}
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                    Tautan Portal Sekolah untuk Dibagikan ke Murid & Guru:
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    (Bebas dibuka di browser HP, Tablet, & Laptop tanpa login akun Google)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 select-all overflow-x-auto whitespace-nowrap">
                    {typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://portal-sdn06kapuk.sch.id'}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`);
                        setCopiedPortalLink(true);
                        setTimeout(() => setCopiedPortalLink(false), 3000);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                      copiedPortalLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-900 hover:bg-blue-800 text-white'
                    }`}
                  >
                    {copiedPortalLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                    <span>{copiedPortalLink ? 'Link Tersalin!' : 'Salin Link Portal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const url = `${window.location.origin}${window.location.pathname}`;
                        const text = `*PORTAL DIGITAL SDN KAPUK 06 PAGI*\n\nYth. Bapak/Ibu Guru dan Wali Murid, silakan akses portal sekolah melalui tautan online berikut:\n🔗 ${url}\n\n• *Murid*: Masuk dengan NISN & PIN\n• *Guru*: Masuk dengan NIP & PIN\n\nTerima kasih.`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <span>💬 Bagikan ke WA</span>
                  </button>
                </div>

                {/* Panduan Singkat Login untuk Murid & Guru */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 text-[11px]">
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200">
                    <span className="font-bold text-blue-900 block mb-0.5">1. Murid & Orang Tua</span>
                    <p className="text-slate-600">
                      Buka link portal, pilih <b>"Masuk sebagai Murid"</b>, masukkan <b>NISN</b> & <b>PIN</b> (default: 1234). Langsung bisa isi 7 KAIH & Jurnal Membaca.
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200">
                    <span className="font-bold text-indigo-900 block mb-0.5">2. Guru & Wali Kelas</span>
                    <p className="text-slate-600">
                      Buka link portal, pilih <b>"Masuk sebagai Guru"</b>, masukkan <b>NIP</b> & <b>PIN</b>. Guru dapat memverifikasi jurnal dan memberi nilai bintang.
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-900 block mb-0.5">3. Administrator</span>
                    <p className="text-slate-600">
                      Pilih <b>"Masuk sebagai Admin"</b>, username: <code>admin06</code>. Berhak mengimpor data murid/guru, cetak kartu, dan rekap nilai.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RINGKASAN DATA DATABASE CLOUD */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Ringkasan Data Tersimpan di Cloud Server:
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Seluruh perubahan biodata dan input jurnal otomatis tersinkronisasi realtime.
                  </p>
                </div>
                {formData.lastSyncTime && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                    ✓ Terakhir Sinkron: {formData.lastSyncTime}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Database Murid</span>
                  <div className="text-2xl font-black text-blue-900 mt-1">{muridList.length}</div>
                  <span className="text-[10px] text-slate-500">Akun Siswa Aktif</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Database Guru</span>
                  <div className="text-2xl font-black text-indigo-900 mt-1">{guruList.length}</div>
                  <span className="text-[10px] text-slate-500">Tenaga Pendidik</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Jurnal 7 KAIH</span>
                  <div className="text-2xl font-black text-emerald-900 mt-1">{jurnal7KaihList.length}</div>
                  <span className="text-[10px] text-slate-500">Catatan Karakter</span>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Jurnal Membaca</span>
                  <div className="text-2xl font-black text-amber-900 mt-1">{jurnalMembacaList.length}</div>
                  <span className="text-[10px] text-slate-500">Ulasan Literasi</span>
                </div>
              </div>

              {/* Action Buttons: Tarik, Impor Excel, Unduh Cadangan */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAdminPull}
                  disabled={isPullingCloud}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Tarik data terbaru dari Cloud Server sekolah"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPullingCloud ? 'animate-spin' : ''}`} />
                  <span>{isPullingCloud ? 'Menyinkronkan...' : '📥 Tarik Data Cloud Terbaru'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportMuridModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  title="Impor murid dari file Excel atau Spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
                  <span>📤 Impor Data dari Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMuridCsv}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Unduh seluruh data akun murid dalam format CSV / Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unduh Cadangan Akun (.csv)</span>
                </button>
              </div>

              {/* Hasil Diagnostik Realtime */}
              {cloudDiagnostic && (
                <div
                  className={`p-4 rounded-2xl border text-xs animate-in fade-in space-y-2 mt-3 ${
                    cloudDiagnostic.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : cloudDiagnostic.type === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-blue-50 border-blue-300 text-blue-950'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {cloudDiagnostic.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{cloudDiagnostic.message}</p>
                      {cloudDiagnostic.suggestions && cloudDiagnostic.suggestions.length > 0 && (
                        <div className="mt-2 space-y-1 text-[11px] opacity-90">
                          <p className="font-semibold text-slate-700">Rekomendasi Perbaikan:</p>
                          <ul className="list-disc list-inside space-y-0.5 font-medium">
                            {cloudDiagnostic.suggestions.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CEKLIS & PANDUAN SUSUNAN SHEET SPREADSHEET */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-200 space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                    <span>📋</span> Ceklis Susunan Sheet & Kolom Google Spreadsheet (Panduan Resmi)
                  </h4>
                  <p className="text-[11px] text-blue-900/80">
                    Periksa apakah susunan tab sheet dan baris tabel di Google Spreadsheet Anda sudah sesuai dengan standar berikut agar nama murid dan guru tidak kosong.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-200 text-blue-900 shrink-0">
                  Wajib 5 Tab Sheet
                </span>
              </div>

              {/* 5 Sheet Tabs Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* TAB 1: DATA_MURID */}
                <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-900 flex items-center justify-center text-[10px] font-black">1</span>
                      Nama Tab Sheet: <code className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">DATA_MURID</code>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Data Siswa</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <b>Baris 1 WAJIB berupa Nama Kolom</b> (jangan taruh judul/kop surat di baris 1-3).
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-800">
                    <div className="text-amber-400 font-bold mb-1">// Header Baris 1:</div>
                    ID | NISN | NIS | <span className="text-emerald-400 font-bold">Nama Murid</span> | Kelas | JK | Nama Orang Tua | No HP Orang Tua | PIN
                  </div>
                  <div className="text-[10px] text-slate-500">
                    * Kolom minimal wajib: <b>NISN</b>, <b>Nama Murid</b> (atau Nama Siswa), dan <b>Kelas</b>.
                  </div>
                </div>

                {/* TAB 2: DATA_GURU */}
                <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-900 flex items-center justify-center text-[10px] font-black">2</span>
                      Nama Tab Sheet: <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">DATA_GURU</code>
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">Data Pendidik</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    <b>Baris 1 WAJIB berupa Nama Kolom</b> (header langsung di baris pertama).
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto leading-relaxed border border-slate-800">
                    <div className="text-amber-400 font-bold mb-1">// Header Baris 1:</div>
                    ID | NIP | <span className="text-emerald-400 font-bold">Nama Guru</span> | Jabatan | Kelas Ampu | Email | No HP | PIN
                  </div>
                  <div className="text-[10px] text-slate-500">
                    * Kolom minimal wajib: <b>NIP</b>, <b>Nama Guru</b>, <b>Jabatan</b>, dan <b>Kelas Ampu</b>.
                  </div>
                </div>

                {/* TAB 3 & 4: JURNAL */}
                <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-xs space-y-1.5 md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block">Tab 3: <code className="text-emerald-700 font-bold">JURNAL_7KAIH</code></span>
                      <span className="text-[10px] text-slate-500">Menyimpan riwayat 7 KAIH harian seluruh siswa.</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block">Tab 4: <code className="text-amber-700 font-bold">JURNAL_MEMBACA</code></span>
                      <span className="text-[10px] text-slate-500">Menyimpan jurnal literasi buku & membaca.</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-800 block">Tab 5: <code className="text-purple-700 font-bold">PENGATURAN</code></span>
                      <span className="text-[10px] text-slate-500">Profil SDN Kapuk 06 Pagi & Kepala Sekolah.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solusi Kenapa Nama Murid & Guru Kosong */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-[11px] text-amber-950 space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>💡</span> Mengapa Nama Murid & Guru Bisa Kosong di Apps Script?
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                  <li>
                    <b>Penyebab 1 (Paling Sering):</b> Terdapat baris Judul / Kop Surat (misal: <i>"DAFTAR NAMA SISWA KELAS IV SDN KAPUK 06"</i>) di baris 1-2. <b>Solusi Terbaik:</b> Langsung blok & hapus baris 1 dan 2 tersebut di spreadsheet! Jadikan baris 1 langsung nama kolom (<code>ID</code>, <code>NISN</code>, <code>Nama Murid</code>, <code>Kelas</code>, dst). Setelah dihapus, nama murid akan langsung terbaca otomatis 100%.
                  </li>
                  <li>
                    <b>Penyebab 2:</b> Nama tab di spreadsheet masih bernama bawaan (misal: <i>Sheet1</i> atau <i>Data Siswa</i>). Ganti nama tab di bawah menjadi <code>DATA_MURID</code> dan <code>DATA_GURU</code>.
                  </li>
                  <li>
                    <b>Penyebab 3:</b> Judul kolom bukan <i>Nama Murid</i> atau <i>Nama Guru</i> (misal: kolom hanya ditulis <i>Keterangan</i>). Ubah judul kolom menjadi <code>Nama Murid</code>.
                  </li>
                </ul>
              </div>
            </div>

            {/* CADANGAN OPSIONAL GOOGLE SPREADSHEET (TIDAK WAJIB) */}
            <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-500" />
                    Cadangan Google Spreadsheet (Opsional / Pilihan Tambahan)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Jika Anda ingin menghubungkan Google Spreadsheet sebagai arsip cadangan, cukup masukkan link spreadsheet di bawah ini. Anda <b>tidak wajib</b> membuat atau menyalin kode Apps Script.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Link Google Spreadsheet Cadangan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={formData.spreadsheetUrl || formData.spreadsheetId || ''}
                    onChange={(e) => setFormData({ ...formData, spreadsheetUrl: e.target.value })}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    * Opsional. Jika diisi, pastikan izin spreadsheet disetel "Siapa saja yang memiliki link dapat melihat".
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    URL Google Apps Script (Hanya Jika Ada):
                  </label>
                  <input
                    type="url"
                    value={formData.googleWebAppUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleWebAppUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    * Tidak wajib. Kosongkan jika menggunakan sistem Cloud bawaan.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ ...formData });
                    setSavedAlert('Pengaturan cadangan Google Spreadsheet berhasil disimpan!');
                    setTimeout(() => setSavedAlert(null), 3000);
                  }}
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Simpan Pengaturan Spreadsheet
                </button>

                {/* Toggle accordion kode Apps Script teknis */}
                <button
                  type="button"
                  onClick={() => setShowAppsScriptDetails(!showAppsScriptDetails)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-colors ml-auto"
                >
                  {showAppsScriptDetails ? '▲ Sembunyikan Kode Apps Script' : '▼ Teknis Lanjutan: Kode Apps Script (Hanya Developer)'}
                </button>
              </div>

              {/* Accordion Detail Kode Apps Script (Tersembunyi secara default agar tidak membingungkan) */}
              {showAppsScriptDetails && (
                <div className="pt-4 border-t border-slate-200 space-y-3 animate-in fade-in">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <b>Catatan Developer:</b> Kode di bawah ini hanya diperlukan jika Anda ingin membuat sinkronisasi eksternal mandiri ke Google Sheets. Untuk penggunaan normal, <b>Anda tidak perlu menyalin kode ini sama sekali</b>.
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSelectedScriptTab('gs')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedScriptTab === 'gs' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Code.gs
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedScriptTab('html')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedScriptTab === 'html' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Index.html
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      {(selectedScriptTab === 'gs' ? copiedCode : copiedHtml) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-amber-300" />
                      )}
                      Salin Kode
                    </button>
                  </div>

                  <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
                    {selectedScriptTab === 'gs' ? appsScriptCode : appsScriptHtml}
                  </pre>
                </div>
              )}
            </div>

            {/* PUSAT MANAJEMEN HAPUS DATA */}
            <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  <b className="text-slate-800">Pusat Manajemen Hapus Semua Data:</b> Hapus massal data per modul atau kosongkan database sekolah secara permanen.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAllMuridAdmin}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Hapus seluruh murid dari sistem dan database cloud"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Murid ({muridList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllGuruAdmin}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Hapus seluruh guru dari sistem dan database cloud"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Guru ({guruList.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll7KaihAdmin}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua 7 KAIH</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllMembacaAdmin}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus Semua Membaca</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Kembalikan semua data ke pengaturan default SDN Kapuk 06 Pagi?')) {
                        onResetDatabase();
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Reset Pengaturan
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllDataAdmin}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Hapus seluruh murid, guru, dan riwayat jurnal sekolah secara permanen"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Hapus Seluruh Data Sekolah</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPOR DATA MURID */}
      <ImportDataModal
        isOpen={isImportMuridModalOpen}
        onClose={() => setIsImportMuridModalOpen(false)}
        type="murid"
        targetKelas={filterKelasDb !== 'Semua Kelas' ? filterKelasDb : undefined}
        onImportMurid={handleBulkImportMurid}
      />

      {/* MODAL IMPOR DATA GURU */}
      <ImportDataModal
        isOpen={isImportGuruModalOpen}
        onClose={() => setIsImportGuruModalOpen(false)}
        type="guru"
        onImportGuru={handleBulkImportGuru}
      />
    </div>
  );
};
