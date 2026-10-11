import React, { useState, useEffect } from 'react';
import { UserRole, SchoolSettings, Murid, Guru, DAFTAR_KELAS } from '../../types';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  School,
  CheckCircle2,
  AlertTriangle,
  ImageIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface LoginPageProps {
  settings: SchoolSettings;
  muridList: Murid[];
  guruList: Guru[];
  onLoginSuccess: (role: UserRole, userObj: Murid | Guru | { name: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  settings,
  muridList,
  guruList,
  onLoginSuccess,
}) => {
  const [activePortal, setActivePortal] = useState<UserRole>('murid');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  // Form State Murid
  const [muridNisn, setMuridNisn] = useState('');
  const [muridPin, setMuridPin] = useState('');

  // Form State Guru
  const [guruIdentifier, setGuruIdentifier] = useState('');
  const [guruPin, setGuruPin] = useState('');

  // Form State Admin
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Silent Auto-Tarik Data di latar belakang jika daftar murid belum ada (tanpa notifikasi/alert)
  useEffect(() => {
    if (muridList.length === 0) {
      storageService.pullDataFromSpreadsheet().catch(() => {});
    }
  }, [muridList.length]);

  // Handler Login Murid (Otomatis & Tanpa Langkah Manual)
  const handleLoginMurid = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedNisn = muridNisn.trim();
    const trimmedPin = muridPin.trim();

    if (!trimmedNisn || !trimmedPin) {
      setErrorMessage('Mohon masukkan NISN dan PIN murid yang telah diberikan sekolah.');
      return;
    }

    let currentMurids = muridList;
    if (currentMurids.length === 0) {
      currentMurids = storageService.getMuridList();
      if (currentMurids.length === 0) {
        // Coba sinkronkan cepat di latar belakang tanpa mengganggu alur login
        await storageService.pullDataFromSpreadsheet().catch(() => {});
        currentMurids = storageService.getMuridList();
      }
    }

    const found = currentMurids.find(
      (m) => (m.nisn === trimmedNisn || m.nis === trimmedNisn || m.nama.toLowerCase() === trimmedNisn.toLowerCase()) &&
             m.pin === trimmedPin
    );

    if (found) {
      onLoginSuccess('murid', found);
    } else {
      setErrorMessage(
        'NISN atau PIN murid tidak sesuai. Silakan hubungi Wali Kelas jika lupa PIN (Default: 1234).'
      );
    }
  };

  // Handler Login Guru
  const handleLoginGuru = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = guruIdentifier.trim().toLowerCase();
    const trimmedPin = guruPin.trim();

    if (!trimmedId || !trimmedPin) {
      setErrorMessage('Mohon masukkan NIP atau Email Akun Belajar dan PIN guru.');
      return;
    }

    const found = guruList.find(
      (g) => (g.nip === trimmedId || g.email.toLowerCase() === trimmedId || g.nama.toLowerCase().includes(trimmedId)) &&
             g.pin === trimmedPin
    );

    if (found) {
      onLoginSuccess('guru', found);
    } else {
      setErrorMessage(
        'NIP/Email atau Password guru salah. Password dapat di-reset oleh Administrator sekolah.'
      );
    }
  };

  // Handler Login Admin
  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputUser = adminUsername.trim().toLowerCase();
    const inputPass = adminPassword.trim();

    if (!inputUser || !inputPass) {
      setErrorMessage('Mohon masukkan Username dan Password Administrator.');
      return;
    }

    // 1. Cek dari daftar akun admin yang terdaftar di storageService
    const adminUsers = storageService.getAdminUsers();
    const matchedAccount = adminUsers.find(
      (a) => a.username.toLowerCase() === inputUser && a.password === inputPass
    );

    if (matchedAccount) {
      onLoginSuccess('admin', {
        name: matchedAccount.nama || settings.kepalaSekolah || 'Administrator',
      });
      return;
    }

    // 2. Cek akun default dari settings
    const targetUser = (settings.adminUsername || 'admin06').toLowerCase();
    const targetPass = settings.adminPassword || 'admin123!';
    const targetNip = (settings.nipKepalaSekolah || '').toLowerCase();

    if (
      (inputUser === targetUser || inputUser === targetNip || inputUser === 'admin06' || inputUser === 'kepsek') &&
      inputPass === targetPass
    ) {
      onLoginSuccess('admin', {
        name: inputUser === 'kepsek' || inputUser === targetNip
          ? (settings.kepalaSekolah || 'Kepala Sekolah')
          : 'Administrator Utama',
      });
      return;
    }

    setErrorMessage('Username atau Password Administrator/Kepala Sekolah salah.');
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-300 selection:text-blue-950">
      {/* Top Header Branding */}
      <div className="max-w-4xl mx-auto w-full text-center pt-2 sm:pt-4">
        {/* Logo Resmi Sekolah */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20 shadow-xl overflow-hidden">
            <img
              src={settings.logoUrl || 'https://i.imgur.com/GlCn0x3.png'}
              alt="Logo Resmi SDN Kapuk 06 Pagi"
              className="w-full h-full object-contain drop-shadow"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-semibold mb-3 shadow-inner">
          <School className="w-4 h-4" />
          <span>NPSN: {settings.npsn || '20105291'} • DKI Jakarta</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {settings.namaSekolah || 'DIGITAL SDN KAPUK 06 PAGI'}
        </h1>
        <p className="text-sm sm:text-base text-blue-200 mt-1 max-w-2xl mx-auto">
          {settings.subJudul || 'Sistem Informasi Sekolah, e-Jurnal Karakter 7 KAIH & Literasi Membaca'}
        </p>
      </div>

      {/* Main Login Card Container */}
      <div className="max-w-xl mx-auto w-full my-3">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* 3 Tab Header Portals (Distinct visual theme per role) */}
          <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            {/* Tab Murid */}
            <button
              type="button"
              onClick={() => {
                setActivePortal('murid');
                setErrorMessage(null);
              }}
              className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ${
                activePortal === 'murid'
                  ? 'bg-amber-400 text-blue-950 shadow-md border-b-2 border-amber-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span>Murid & Ortu</span>
            </button>

            {/* Tab Guru */}
            <button
              type="button"
              onClick={() => {
                setActivePortal('guru');
                setErrorMessage(null);
              }}
              className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ${
                activePortal === 'guru'
                  ? 'bg-blue-900 text-white shadow-md border-b-2 border-blue-950'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Guru Kelas</span>
            </button>

            {/* Tab Admin */}
            <button
              type="button"
              onClick={() => {
                setActivePortal('admin');
                setErrorMessage(null);
              }}
              className={`py-3.5 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-center ${
                activePortal === 'admin'
                  ? 'bg-slate-900 text-white shadow-md border-b-2 border-emerald-500'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Admin / Kepsek</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8">
            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* ======================================================== */}
            {/* PORTAL 1: TAMPILAN LOGIN MURID (WARNA AMBER / SKY RAMAH ANAK) */}
            {/* ======================================================== */}
            {activePortal === 'murid' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      Portal Masuk Murid & Orang Tua
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gunakan NISN dan PIN yang telah di-setting oleh Administrator sekolah.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLoginMurid} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Induk Siswa Nasional (NISN)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={muridNisn}
                        onChange={(e) => setMuridNisn(e.target.value)}
                        placeholder="Contoh: 0123456781"
                        className="w-full text-xs font-semibold pl-9 pr-3.5 py-3 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-400 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        PIN Murid / Sandi Pendampingan
                      </label>
                      <span className="text-[11px] text-amber-700 font-medium">Default: 1234</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={muridPin}
                        onChange={(e) => setMuridPin(e.target.value)}
                        placeholder="Masukkan 4 digit PIN"
                        className="w-full text-xs font-semibold pl-9 pr-10 py-3 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-400 font-mono tracking-wider"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-500 text-blue-950 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                    <GraduationCap className="w-5 h-5" />
                    Masuk ke Jurnal Pembiasaan 7 KAIH
                  </button>
                </form>

                {/* Petunjuk Akses Murid */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Belum memiliki NISN atau lupa PIN?</span>
                  <span className="font-semibold text-amber-800">Hubungi Wali Kelas masing-masing</span>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PORTAL 2: TAMPILAN LOGIN GURU (WARNA DEEP NAVY / PROFESIONAL) */}
            {/* ======================================================== */}
            {activePortal === 'guru' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      Portal Masuk Guru Kelas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gunakan NIP atau Email @guru.sd.belajar.id yang diatur oleh Admin.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLoginGuru} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      NIP Guru atau Email Akun Belajar
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={guruIdentifier}
                        onChange={(e) => setGuruIdentifier(e.target.value)}
                        placeholder="Contoh: 198503122010012015"
                        className="w-full text-xs font-semibold pl-9 pr-3.5 py-3 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Password / PIN Guru
                      </label>
                      <span className="text-[11px] text-blue-700 font-medium">Default: 1234</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={guruPin}
                        onChange={(e) => setGuruPin(e.target.value)}
                        placeholder="Masukkan Password Guru"
                        className="w-full text-xs font-semibold pl-9 pr-10 py-3 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-600 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                    <Users className="w-5 h-5 text-amber-300" />
                    Masuk ke Ruang Guru & Verifikasi
                  </button>
                </form>

                {/* Petunjuk Akses Guru */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Lupa Password atau belum terdaftar?</span>
                  <span className="font-semibold text-blue-900">Hubungi Administrator Sekolah</span>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* PORTAL 3: TAMPILAN LOGIN ADMIN / KEPSEK (WARNA DARK SLATE) */}
            {/* ======================================================== */}
            {activePortal === 'admin' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      Portal Administrator & Kepala Sekolah
                    </h3>
                    <p className="text-xs text-slate-500">
                      Akses otoritas penuh untuk pengaturan akun, database & kop surat.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLoginAdmin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Username Admin / NIP Kepala Sekolah
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Masukkan Username Administrator"
                        className="w-full text-xs font-semibold pl-9 pr-3.5 py-3 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Password Administrator
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Masukkan Password Administrator"
                        className="w-full text-xs font-semibold pl-9 pr-10 py-3 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Masuk ke Panel Kontrol Administrator
                  </button>
                </form>

                {/* Petunjuk Akses Admin */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Akses Otoritas Kepala Sekolah & Pengelola</span>
                  <span className="font-semibold text-slate-800">SDN Kapuk 06 Pagi</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Poster Resmi 7 KAIH Banner */}
      <div className="max-w-xl mx-auto w-full mb-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 text-white shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={settings.posterUrl || 'https://i.imgur.com/pJOJiuF.jpeg'}
              alt="Thumbnail Poster 7 KAIH"
              className="w-14 h-18 sm:w-16 sm:h-20 object-cover rounded-xl shadow-md border border-white/30 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setIsPosterModalOpen(true)}
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full font-mono">
                Panduan Karakter
              </span>
              <h4 className="text-sm font-extrabold text-white mt-1 truncate">
                Poster Resmi 7 KAIH & Literasi
              </h4>
              <p className="text-xs text-blue-200 mt-0.5 truncate">
                7 Kebiasaan Anak Indonesia Hebat • SDN Kapuk 06 Pagi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPosterModalOpen(true)}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Lihat Poster</span>
          </button>
        </div>
      </div>

      {/* Modal Poster 7 KAIH Fullscreen */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={settings.logoUrl || 'https://i.imgur.com/GlCn0x3.png'}
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                    Poster Resmi 7 KAIH & Literasi Sekolah
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    SDN KAPUK 06 PAGI • Panduan Pembiasaan Karakter Siswa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPosterModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={settings.posterUrl || 'https://i.imgur.com/pJOJiuF.jpeg'}
                alt="Poster 7 KAIH SDN Kapuk 06 Pagi"
                className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-lg border border-slate-300"
              />
            </div>

            <div className="bg-white px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">
                Poster Resmi Pembiasaan 7 Karakter Anak Indonesia Hebat (7 KAIH).
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={settings.posterUrl || 'https://i.imgur.com/pJOJiuF.jpeg'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Resolusi Penuh</span>
                </a>
                <button
                  type="button"
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

      {/* Footer Info */}
      <div className="text-center text-xs text-blue-200/70 pb-4">
        <p>
          © {new Date().getFullYear()} {settings.namaSekolah} • Sistem Informasi Sekolah Terpadu
        </p>
        <p className="text-[11px] text-blue-300/50 mt-1">
          Kec. Cengkareng, Kota Jakarta Barat, DKI Jakarta
        </p>
      </div>
    </div>
  );
};
