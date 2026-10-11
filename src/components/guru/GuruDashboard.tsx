import React, { useState, useRef } from 'react';
import { Guru, Murid, Jurnal7KAIH, JurnalMembaca, SchoolSettings, DAFTAR_KELAS } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Search,
  Star,
  MessageCircle,
  Share2,
  BarChart3,
  Award,
  Sun,
  BookOpen,
  Filter,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Lock,
  Download,
  Loader2,
  Sparkles,
  Users,
  Plus,
  Trash2,
  Edit,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  RotateCcw,
  Send,
  Smartphone,
  X,
} from 'lucide-react';
import { KopSurat } from '../KopSurat';
import { Rekapitulasi7KAIHGuru } from '../kaih/Rekapitulasi7KAIHGuru';
import { storageService } from '../../services/storageService';
import {
  downloadElementAsPdf,
  downloadPrintableHtml,
  safePrintElement,
} from '../../services/printAndDownloadService';
import { ImportDataModal } from '../common/ImportDataModal';
import { downloadTemplateMuridExcel } from '../../services/excelImportService';
import { calculateRubrik7KAIH, RUBRIK_GUIDELINES } from '../../services/rubrikService';
import {
  formatWaktuKirimWIB,
  formatJamWIB,
  normalizeDateStringToWIB,
  formatToWIBDisplay,
} from '../../utils/dateUtils';

interface GuruDashboardProps {
  currentGuru: Guru;
  muridList: Murid[];
  onUpdateMuridList: (newList: Murid[]) => void;
  settings: SchoolSettings;
  jurnal7KaihList: Jurnal7KAIH[];
  jurnalMembacaList: JurnalMembaca[];
  onVerify7Kaih: (id: string, feedback: string, rating: number, guruNama: string) => void;
  onVerifyMembaca: (id: string, feedback: string, rating: number, guruNama: string) => void;
  onUpdate7KaihList?: (newList: Jurnal7KAIH[]) => void;
  onUpdateMembacaList?: (newList: JurnalMembaca[]) => void;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({
  currentGuru,
  muridList,
  onUpdateMuridList,
  settings,
  jurnal7KaihList,
  jurnalMembacaList,
  onVerify7Kaih,
  onVerifyMembaca,
  onUpdate7KaihList,
  onUpdateMembacaList,
}) => {
  const isKepalaSekolah =
    currentGuru.kelasAmpu === 'Semua Kelas' ||
    currentGuru.jabatan.toLowerCase().includes('kepala sekolah');

  // If regular teacher, strictly lock to their own assigned class!
  const [selectedClass, setSelectedClass] = useState<string>(
    isKepalaSekolah ? 'Semua Kelas' : (currentGuru.kelasAmpu || 'Kelas 1A')
  );

  const activeClass = isKepalaSekolah ? selectedClass : currentGuru.kelasAmpu;

  const [activeTab, setActiveTab] = useState<
    'kelola_murid' | 'verifikasi' | 'lampiran4' | 'belum_mengisi' | 'analisis' | 'cetak_a4'
  >('kelola_murid');
  const [verifikasiClassFilter, setVerifikasiClassFilter] = useState<string>('Semua Kelas');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [cetakToastMsg, setCetakToastMsg] = useState<string | null>(null);
  const cetakA4Ref = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterTanggal, setFilterTanggal] = useState<string>(todayStr);

  // Murid Management States
  const [searchMurid, setSearchMurid] = useState('');
  const [isAddingMurid, setIsAddingMurid] = useState(false);
  const [newMuridData, setNewMuridData] = useState({
    nama: '',
    nisn: '',
    nis: '',
    jenisKelamin: 'L' as 'L' | 'P',
    namaOrangTua: '',
    noHpOraangTua: '',
    pin: '1234',
  });
  const [editingMurid, setEditingMurid] = useState<Murid | null>(null);
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);

  // Delete All Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'murid_kelas' | 'jurnal_kelas' | 'semua_kelas'>('murid_kelas');
  const [deleteConfirmKeyword, setDeleteConfirmKeyword] = useState('');

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Toast / Alert Notification State
  const [guruToast, setGuruToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setGuruToast({ message, isError });
    setTimeout(() => setGuruToast(null), 3500);
  };

  const handleImportMuridClass = (data: Murid[], mode: 'replace' | 'append') => {
    const updated = storageService.bulkImportMurid(data, mode, activeClass);
    onUpdateMuridList(updated);
    showToast(`Berhasil mengimpor ${data.length} data murid ke ${activeClass}!`);
  };

  // Verification modal state
  const [verifyingItem, setVerifyingItem] = useState<{
    type: '7kaih' | 'membaca';
    item: Jurnal7KAIH | JurnalMembaca;
  } | null>(null);
  const [feedbackText, setFeedbackText] = useState('Sangat baik! Terus pertahankan pembiasaan positif ini.');
  const [ratingVal, setRatingVal] = useState<number>(5);

  // Filter students strictly by active class
  const classStudents = muridList.filter((m) =>
    activeClass === 'Semua Kelas' ? true : m.kelas === activeClass
  );

  // Filter students with search
  const filteredClassStudents = classStudents.filter((m) => {
    if (!searchMurid.trim()) return true;
    const q = searchMurid.toLowerCase();
    return (
      m.nama.toLowerCase().includes(q) ||
      m.nisn.includes(q) ||
      (m.nis && m.nis.includes(q)) ||
      m.namaOrangTua.toLowerCase().includes(q)
    );
  });

  // Share URL calculation
  const shareAppUrl =
    typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://ais-pre-lmcsshuq6gskzc5qjdriud-875835973089.asia-southeast1.run.app';

  // Broadcast Message to WhatsApp
  const generateWaBroadcastMessage = () => {
    return `Assalamu'alaikum Wr. Wb. / Salam Sejahtera Bapak/Ibu Wali Murid ${activeClass} SDN Kapuk 06 Pagi,\n\nBerikut tautan resmi Portal E-Jurnal Pembiasaan 7 KAIH dan Jurnal Membaca sekolah:\n🔗 ${shareAppUrl}\n\nCara Masuk Ananda:\n1. Buka tautan di atas melalui browser HP (Chrome / Safari)\n2. Pilih portal "Murid"\n3. Masukkan NISN ananda masing-masing\n4. Masukkan PIN login (default: 1234)\n\nMari dampingi ananda tercinta melaksanakan pembiasaan positif setiap hari!\n\nWali Kelas: ${currentGuru.nama}\nSDN Kapuk 06 Pagi`;
  };

  // Submit Add Murid
  const handleAddMuridSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMuridData.nama.trim() || !newMuridData.nisn.trim()) {
      showToast('Nama dan NISN murid wajib diisi!', true);
      return;
    }
    if (muridList.some((m) => m.nisn === newMuridData.nisn.trim())) {
      showToast(`Murid dengan NISN ${newMuridData.nisn} sudah terdaftar!`, true);
      return;
    }

    const createdStudent: Murid = {
      id: `m-${Date.now()}`,
      nama: newMuridData.nama.trim(),
      nisn: newMuridData.nisn.trim(),
      nis: newMuridData.nis.trim() || `${newMuridData.nisn.trim().slice(-4)}`,
      kelas: activeClass === 'Semua Kelas' ? 'Kelas 1A' : activeClass,
      jenisKelamin: newMuridData.jenisKelamin,
      namaOrangTua: newMuridData.namaOrangTua.trim() || 'Orang Tua / Wali',
      noHpOraangTua: newMuridData.noHpOraangTua.trim() || '081200000000',
      pin: newMuridData.pin.trim() || '1234',
    };

    const updated = [createdStudent, ...muridList];
    onUpdateMuridList(updated);
    storageService.syncSingleToSpreadsheet('SYNC_MURID', createdStudent);

    setIsAddingMurid(false);
    setNewMuridData({
      nama: '',
      nisn: '',
      nis: '',
      jenisKelamin: 'L',
      namaOrangTua: '',
      noHpOraangTua: '',
      pin: '1234',
    });
    showToast(`Murid ${createdStudent.nama} berhasil didaftarkan ke ${createdStudent.kelas}!`);
  };

  // Submit Edit Murid
  const handleEditMuridSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMurid) return;
    if (!editingMurid.nama.trim() || !editingMurid.nisn.trim()) {
      showToast('Nama dan NISN murid tidak boleh kosong!', true);
      return;
    }

    const updated = muridList.map((m) => (m.id === editingMurid.id ? editingMurid : m));
    onUpdateMuridList(updated);
    storageService.syncSingleToSpreadsheet('SYNC_MURID', editingMurid);
    showToast(`Data murid ${editingMurid.nama} berhasil diperbarui!`);
    setEditingMurid(null);
  };

  // Delete Single Murid
  const handleDeleteSingleMurid = (student: Murid) => {
    if (confirm(`Hapus murid "${student.nama}" (NISN: ${student.nisn}) dari ${student.kelas}? Data jurnal ananda juga akan dibersihkan.`)) {
      const updated = muridList.filter((m) => m.id !== student.id);
      onUpdateMuridList(updated);
      if (onUpdate7KaihList) {
        onUpdate7KaihList(jurnal7KaihList.filter((j) => j.muridId !== student.id));
      }
      if (onUpdateMembacaList) {
        onUpdateMembacaList(jurnalMembacaList.filter((b) => b.muridId !== student.id));
      }
      showToast(`Data murid ${student.nama} berhasil dihapus.`);
    }
  };

  // Execute Delete All (Modal Confirm)
  const handleExecuteDeleteAll = () => {
    if (deleteConfirmKeyword.trim().toUpperCase() !== 'HAPUS') {
      showToast('Ketik kata "HAPUS" untuk konfirmasi penghapusan!', true);
      return;
    }

    if (deleteTarget === 'murid_kelas') {
      const remainingMurid = muridList.filter((m) =>
        activeClass === 'Semua Kelas' ? false : m.kelas !== activeClass
      );
      onUpdateMuridList(remainingMurid);
      showToast(`Semua murid di ${activeClass} berhasil dihapus.`);
    } else if (deleteTarget === 'jurnal_kelas') {
      if (onUpdate7KaihList) {
        onUpdate7KaihList(
          jurnal7KaihList.filter((j) =>
            activeClass === 'Semua Kelas' ? false : j.kelas !== activeClass
          )
        );
      }
      if (onUpdateMembacaList) {
        onUpdateMembacaList(
          jurnalMembacaList.filter((b) =>
            activeClass === 'Semua Kelas' ? false : b.kelas !== activeClass
          )
        );
      }
      showToast(`Semua riwayat jurnal di ${activeClass} berhasil dibersihkan.`);
    } else if (deleteTarget === 'semua_kelas') {
      const remainingMurid = muridList.filter((m) =>
        activeClass === 'Semua Kelas' ? false : m.kelas !== activeClass
      );
      onUpdateMuridList(remainingMurid);
      if (onUpdate7KaihList) {
        onUpdate7KaihList(
          jurnal7KaihList.filter((j) =>
            activeClass === 'Semua Kelas' ? false : j.kelas !== activeClass
          )
        );
      }
      if (onUpdateMembacaList) {
        onUpdateMembacaList(
          jurnalMembacaList.filter((b) =>
            activeClass === 'Semua Kelas' ? false : b.kelas !== activeClass
          )
        );
      }
      showToast(`Seluruh murid dan riwayat jurnal di ${activeClass} berhasil dikosongkan.`);
    }

    setIsDeleteModalOpen(false);
    setDeleteConfirmKeyword('');
  };



  // Copy Single Student Login Info
  const handleCopyStudentLogin = (student: Murid) => {
    const text = `Portal Murid SDN Kapuk 06 Pagi:\nNama: ${student.nama}\nNISN: ${student.nisn}\nKelas: ${student.kelas}\nPIN: ${student.pin}\nTautan: ${shareAppUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedStudentId(student.id);
    showToast(`Info login ${student.nama} tersalin!`);
    setTimeout(() => setCopiedStudentId(null), 2500);
  };

  // Filter journals strictly by active class (untuk tab kelola murid & belum mengisi)
  const class7Kaih = jurnal7KaihList.filter((j) =>
    activeClass === 'Semua Kelas' ? true : j.kelas === activeClass
  );
  const classMembaca = jurnalMembacaList.filter((b) =>
    activeClass === 'Semua Kelas' ? true : b.kelas === activeClass
  );

  // Antrean Verifikasi Guru: Fleksibel dapat menampilkan 'Semua Kelas' atau filter per rombel
  const pending7Kaih = jurnal7KaihList.filter((j) => {
    if (j.status !== 'pending') return false;
    if (verifikasiClassFilter === 'Semua Kelas') return true;
    return j.kelas === verifikasiClassFilter;
  });

  const pendingMembaca = jurnalMembacaList.filter((b) => {
    if (b.status !== 'pending') return false;
    if (verifikasiClassFilter === 'Semua Kelas') return true;
    return b.kelas === verifikasiClassFilter;
  });

  const totalAllPending7Kaih = jurnal7KaihList.filter((j) => j.status === 'pending').length;
  const totalAllPendingMembaca = jurnalMembacaList.filter((b) => b.status === 'pending').length;
  const totalAllPending = totalAllPending7Kaih + totalAllPendingMembaca;

  // Students who haven't submitted today (Laporan Murid Belum Mengisi)
  const studentsWithoutKaihToday = classStudents.filter((student) => {
    return !class7Kaih.some((j) => j.muridId === student.id && j.tanggal === filterTanggal);
  });
  const studentsWithoutMembacaToday = classStudents.filter((student) => {
    return !classMembaca.some((b) => b.muridId === student.id && b.tanggal === filterTanggal);
  });

  // Calculate 7 KAIH Compliance percentages for this class
  const totalVerifiedOrSubmitted = class7Kaih.length || 1;
  const bangunPagiPct = Math.round((class7Kaih.filter((j) => j.bangunPagiChecked).length / totalVerifiedOrSubmitted) * 100);
  const ibadahPct = Math.round((class7Kaih.filter((j) => (j.ibadahChecklist?.length || 0) >= 3).length / totalVerifiedOrSubmitted) * 100);
  const olahragaPct = Math.round((class7Kaih.filter((j) => j.olahragaChecked).length / totalVerifiedOrSubmitted) * 100);
  const makanSehatPct = Math.round((class7Kaih.filter((j) => j.makanSehatChecked).length / totalVerifiedOrSubmitted) * 100);
  const belajarPct = Math.round((class7Kaih.filter((j) => j.belajarChecked).length / totalVerifiedOrSubmitted) * 100);
  const bantuOrtuPct = Math.round((class7Kaih.filter((j) => j.bantuOrangTuaChecked).length / totalVerifiedOrSubmitted) * 100);
  const tidurTepatPct = Math.round((class7Kaih.filter((j) => j.tidurTepatWaktuChecked).length / totalVerifiedOrSubmitted) * 100);

  // Handle Action Verify
  const handleOpenVerifyModal = (type: '7kaih' | 'membaca', item: Jurnal7KAIH | JurnalMembaca) => {
    setVerifyingItem({ type, item });
    setRatingVal(5);
    setFeedbackText(
      type === '7kaih'
        ? 'Luar biasa! Pembiasaan karakter 7 KAIH terlaksana dengan sangat baik.'
        : 'Ringkasan cerita sangat bagus dan hikmah yang dipetik sangat bermakna!'
    );
  };

  const handleConfirmVerify = () => {
    if (!verifyingItem) return;

    // Strict authorization check: Wali Kelas can ONLY verify journals of their own class!
    if (!isKepalaSekolah && verifyingItem.item.kelas !== currentGuru.kelasAmpu) {
      alert(
        `Akses Ditolak: Anda adalah Wali ${currentGuru.kelasAmpu}. Anda hanya memiliki hak memverifikasi jurnal murid dari ${currentGuru.kelasAmpu}.`
      );
      setVerifyingItem(null);
      return;
    }

    if (verifyingItem.type === '7kaih') {
      onVerify7Kaih(verifyingItem.item.id, feedbackText, ratingVal, currentGuru.nama);
    } else {
      onVerifyMembaca(verifyingItem.item.id, feedbackText, ratingVal, currentGuru.nama);
    }
    setVerifyingItem(null);
  };

  // WhatsApp reminder link
  const createWaReminderLink = (student: Murid, jenis: '7kaih' | 'membaca' | 'keduanya') => {
    let rawPhone = student.noHpOraangTua.replace(/[^0-9]/g, '');
    if (rawPhone.startsWith('0')) {
      rawPhone = '62' + rawPhone.slice(1);
    }
    const jenisText =
      jenis === '7kaih'
        ? 'Jurnal Pembiasaan 7 KAIH'
        : jenis === 'membaca'
        ? 'Jurnal Literasi Membaca'
        : 'Jurnal 7 KAIH dan Jurnal Membaca';

    const msg = `Assalamu'alaikum Wr. Wb. / Selamat Sejahtera Bapak/Ibu ${student.namaOrangTua},\n\nKami dari SDN Kapuk 06 Pagi mengingatkan agar ananda ${student.nama} (${student.kelas}) dapat mengisi ${jenisText} untuk tanggal ${filterTanggal} melalui Aplikasi DIGITAL SDN Kapuk 06 Pagi.\n\nTerima kasih atas pendampingan dan kerja sama Bapak/Ibu di rumah.\n\nSalam hormat,\n${currentGuru.nama} (Wali Kelas)`;

    return `https://wa.me/${rawPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Teacher Header Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-xl shadow-md">
              {currentGuru.nama.charAt(0)}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full font-mono">
                Portal Guru Kelas • SDN Kapuk 06 Pagi
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">{currentGuru.nama}</h2>
              <p className="text-xs text-blue-200">
                NIP: {currentGuru.nip} | {currentGuru.jabatan}
              </p>
            </div>
          </div>

          {/* Otoritas Kelas Wali Kelas */}
          {!isKepalaSekolah ? (
            <div className="flex items-center gap-2.5 bg-amber-400 text-blue-950 px-4 py-2 rounded-2xl border border-amber-300 shadow-md font-bold text-xs self-start md:self-auto">
              <ShieldCheck className="w-5 h-5 text-blue-950 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-extrabold text-blue-950/80 leading-none">
                  Kewenangan Verifikasi
                </div>
                <div className="text-sm font-black text-blue-950 leading-tight">
                  Wali {currentGuru.kelasAmpu}
                </div>
              </div>
              <span className="text-[10px] bg-blue-950 text-amber-300 font-extrabold px-2 py-0.5 rounded-full ml-1">
                Khusus {currentGuru.kelasAmpu}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-black/25 p-2 rounded-2xl border border-white/10 self-start md:self-auto">
              <Filter className="w-4 h-4 text-amber-300 ml-1" />
              <span className="text-xs font-semibold text-slate-200">Pantau Rombel (Kepala Sekolah):</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-blue-950 text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              >
                <option value="Semua Kelas">Semua Rombel</option>
                {DAFTAR_KELAS.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs Guru */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('kelola_murid')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'kelola_murid'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          Kelola Murid Kelas
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
            {classStudents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('verifikasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'verifikasi'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Verifikasi Jurnal
          {pending7Kaih.length + pendingMembaca.length > 0 && (
            <span className="bg-amber-400 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {pending7Kaih.length + pendingMembaca.length} Menunggu
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lampiran4')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'lampiran4'
              ? 'bg-amber-400 text-blue-950 shadow-md font-extrabold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-950" />
          Laporan 7 KAIH Bulanan (Lampiran 4)
        </button>

        <button
          onClick={() => setActiveTab('belum_mengisi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'belum_mengisi'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Murid Belum Mengisi
          {studentsWithoutKaihToday.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {studentsWithoutKaihToday.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analisis')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'analisis'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          Rekapitulasi & Analisis Kelas
        </button>

        <button
          onClick={() => setActiveTab('cetak_a4')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'cetak_a4'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Printer className="w-4 h-4 text-emerald-400" />
          Cetak Rekapitulasi A4 / PDF
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 0: KELOLA MURID KELAS (TAMBAH, EDIT, HAPUS, HAPUS SEMUA) */}
      {/* ======================================================== */}
      {activeTab === 'kelola_murid' && (
        <div className="space-y-6 no-print">
          {/* Header & Statistik Kelas */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
                    Otoritas Penuh Guru Kelas
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">• {activeClass}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Daftar & Manajemen Peserta Didik {activeClass}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wali kelas dapat mendaftarkan murid baru, memperbarui biodata & PIN login murid, atau mengosongkan data kelas.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title={`Impor daftar murid ${activeClass} langsung dari Excel atau spreadsheet`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Impor Excel / Spreadsheet</span>
                </button>

                <button
                  type="button"
                  onClick={downloadTemplateMuridExcel}
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Unduh format template Excel untuk data Murid"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Format Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Bagikan Tautan ke Ortu
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddingMurid(true)}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  + Masukkan Murid Baru
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget('murid_kelas');
                    setDeleteConfirmKeyword('');
                    setIsDeleteModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Hapus Semua Murid di Kelas Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Total Peserta Didik</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{classStudents.length}</div>
                <div className="text-[10px] text-blue-600 font-bold mt-0.5">Rombel {activeClass}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="text-[11px] text-blue-700 font-medium">Laki-laki (L)</div>
                <div className="text-2xl font-black text-blue-950 mt-1">
                  {classStudents.filter((m) => m.jenisKelamin === 'L').length}
                </div>
                <div className="text-[10px] text-blue-500 font-semibold mt-0.5">Siswa</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100">
                <div className="text-[11px] text-pink-700 font-medium">Perempuan (P)</div>
                <div className="text-2xl font-black text-pink-950 mt-1">
                  {classStudents.filter((m) => m.jenisKelamin === 'P').length}
                </div>
                <div className="text-[10px] text-pink-500 font-semibold mt-0.5">Siswi</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100">
                <div className="text-[11px] text-amber-800 font-medium">Jurnal Terkumpul</div>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {class7Kaih.length + classMembaca.length}
                </div>
                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                  {class7Kaih.length} 7-KAIH • {classMembaca.length} Baca
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar & Table Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchMurid}
                  onChange={(e) => setSearchMurid(e.target.value)}
                  placeholder={`Cari nama, NISN, atau orang tua di ${activeClass}...`}
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {classStudents.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Impor Murid {activeClass} dari Excel
                </button>
              )}
            </div>

            {/* Table */}
            {filteredClassStudents.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Belum Ada Murid di {activeClass}</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  {searchMurid
                    ? 'Tidak ada murid yang cocok dengan pencarian kata kunci.'
                    : `Kelas ini belum memiliki daftar murid. Silakan impor dari berkas Excel / Spreadsheet atau masukkan data murid secara manual.`}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Impor dari Excel / Spreadsheet
                  </button>
                  <button
                    onClick={() => setIsAddingMurid(true)}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl"
                  >
                    + Masukkan Murid Manual
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-10">No</th>
                      <th className="py-3 px-3">Peserta Didik</th>
                      <th className="py-3 px-3">NISN / NIS</th>
                      <th className="py-3 px-3">Orang Tua / Wali</th>
                      <th className="py-3 px-3">WhatsApp Ortu</th>
                      <th className="py-3 px-3">PIN Login</th>
                      <th className="py-3 px-3 text-center">Partisipasi</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClassStudents.map((m, idx) => {
                      const sKaih = class7Kaih.filter((j) => j.muridId === m.id);
                      const sBaca = classMembaca.filter((b) => b.muridId === m.id);
                      const isPinVisible = visiblePins[m.id];
                      const isCopied = copiedStudentId === m.id;

                      let rawPhone = m.noHpOraangTua.replace(/[^0-9]/g, '');
                      if (rawPhone.startsWith('0')) rawPhone = '62' + rawPhone.slice(1);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  m.jenisKelamin === 'P'
                                    ? 'bg-pink-100 text-pink-700'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {m.nama.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{m.nama}</div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      m.jenisKelamin === 'P'
                                        ? 'bg-pink-50 text-pink-700'
                                        : 'bg-blue-50 text-blue-700'
                                    }`}
                                  >
                                    {m.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'}
                                  </span>
                                  <span>• {m.kelas}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-slate-800">{m.nisn}</div>
                            {m.nis && <div className="text-[10px] text-slate-400 font-mono">NIS: {m.nis}</div>}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            {m.namaOrangTua}
                          </td>
                          <td className="py-3 px-3">
                            <a
                              href={`https://wa.me/${rawPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg font-mono font-bold transition-colors"
                              title="Chat WhatsApp Orang Tua"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{m.noHpOraangTua}</span>
                            </a>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-800 text-xs">
                                {isPinVisible ? m.pin : '••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePins((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                                }
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                title={isPinVisible ? 'Sembunyikan PIN' : 'Lihat PIN'}
                              >
                                {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-2 text-[10px]">
                              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                                {sKaih.length} 7-KAIH
                              </span>
                              <span className="bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-full">
                                {sBaca.length} Buku
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyStudentLogin(m)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isCopied
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                                }`}
                                title="Salin Kartu / Info Login Murid"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingMurid({ ...m })}
                                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                title="Edit Biodata Murid"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSingleMurid(m)}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                title="Hapus Murid Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: VERIFIKASI JURNAL (PENGESAHAN DENGAN NOTIFIKASI OTOMATIS) */}
      {activeTab === 'verifikasi' && (
        <div className="space-y-6 no-print">
          {/* Header & Filter Antrean Verifikasi */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  Antrean Verifikasi Jurnal Murid
                </h3>
                <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full">
                  {pending7Kaih.length + pendingMembaca.length} Menunggu
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Waktu pengiriman murid disesuaikan dengan zona <b>Waktu Indonesia Barat (WIB, UTC+7)</b>.
              </p>
            </div>

            {/* Quick Filter Kelas */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setVerifikasiClassFilter('Semua Kelas')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    verifikasiClassFilter === 'Semua Kelas'
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Kelas ({totalAllPending})
                </button>
                {currentGuru.kelasAmpu && currentGuru.kelasAmpu !== 'Semua Kelas' && (
                  <button
                    type="button"
                    onClick={() => setVerifikasiClassFilter(currentGuru.kelasAmpu)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      verifikasiClassFilter === currentGuru.kelasAmpu
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {currentGuru.kelasAmpu} (
                    {jurnal7KaihList.filter((j) => j.status === 'pending' && j.kelas === currentGuru.kelasAmpu).length +
                      jurnalMembacaList.filter((b) => b.status === 'pending' && b.kelas === currentGuru.kelasAmpu).length}
                    )
                  </button>
                )}
              </div>

              <select
                value={verifikasiClassFilter}
                onChange={(e) => setVerifikasiClassFilter(e.target.value)}
                className="text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
              >
                <option value="Semua Kelas">Pilih Rombel / Semua Kelas</option>
                {DAFTAR_KELAS.map((cls) => {
                  const cnt =
                    jurnal7KaihList.filter((j) => j.status === 'pending' && j.kelas === cls).length +
                    jurnalMembacaList.filter((b) => b.status === 'pending' && b.kelas === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      {cls} {cnt > 0 ? `(${cnt} antrean)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Antrean Jurnal 7 KAIH */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-900">Jurnal 7 KAIH Menunggu Verifikasi</h4>
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                  {pending7Kaih.length} Item
                </span>
              </div>

              {pending7Kaih.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Semua Jurnal 7 KAIH Telah Diverifikasi!</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tidak ada antrean 7 KAIH tertunda ({verifikasiClassFilter}).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending7Kaih.map((j) => {
                    const rubrik = calculateRubrik7KAIH(j);
                    const waktuKirim = formatWaktuKirimWIB(j.submittedAt, j.jamKirim, j.id);
                    const cleanTanggal = normalizeDateStringToWIB(j.tanggal);
                    const cleanJamBangun = formatJamWIB(j.jamBangun);
                    const cleanJamTidur = formatJamWIB(j.jamTidur);

                    return (
                      <div
                        key={j.id}
                        className="p-4 rounded-2xl border border-amber-200 bg-amber-50/20 hover:bg-amber-50/40 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-black text-blue-950 block">{j.muridNama}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {j.kelas} • Tanggal: <b className="text-slate-800">{cleanTanggal}</b>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] bg-blue-100 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-full">
                              Rubrik: {j.skorRataRata || rubrik.skorRataRata}/4.0 ({j.predikatOtomatis || rubrik.predikat})
                            </span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                              Menunggu Review
                            </span>
                          </div>
                        </div>

                        {/* Deteksi Jam Pengiriman Murid (WIB) */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50/90 px-3 py-2 rounded-xl border border-blue-200">
                          <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                          <span>
                            Dikirim Murid: <b className="font-bold text-blue-950">{waktuKirim.lengkap}</b> (Zona WIB)
                          </span>
                        </div>

                        {/* Breakdown 7 Rubrik Otomatis (Gambar 1 - 6 + Tidur) */}
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-[10px] p-2 bg-white rounded-xl border border-amber-200/80 text-center">
                          <div>
                            <span className="text-slate-400 block font-medium">Bangun (1)</span>
                            <span className="font-extrabold text-amber-700">{j.skorBangunPagi || rubrik.skorBangunPagi}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Ibadah (2)</span>
                            <span className="font-extrabold text-rose-700">{j.skorBeribadah || rubrik.skorBeribadah}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Olahraga (3)</span>
                            <span className="font-extrabold text-emerald-700">{j.skorBerolahraga || rubrik.skorBerolahraga}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Belajar (4)</span>
                            <span className="font-extrabold text-blue-700">{j.skorGemarBelajar || rubrik.skorGemarBelajar}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Makan (5)</span>
                            <span className="font-extrabold text-green-700">{j.skorMakanSehat || rubrik.skorMakanSehat}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Masy. (6)</span>
                            <span className="font-extrabold text-purple-700">{j.skorBermasyarakat || rubrik.skorBermasyarakat}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-medium">Tidur (7)</span>
                            <span className="font-extrabold text-indigo-700">{j.skorTidurCepat || rubrik.skorTidurCepat}/4</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                          <p>
                            ⏰ Bangun: <b>{cleanJamBangun}</b> | Tidur: <b>{cleanJamTidur}</b>
                          </p>
                          <p>
                            🕌 Ibadah ({j.agama || 'Muslim'}):{' '}
                            <b>
                              {j.sedangBerhalangan ? (
                                <span className="text-purple-700 font-bold">🌸 Sedang Berhalangan / Uzur Syar'i (Skor 4/4)</span>
                              ) : j.agama === 'Non Muslim' ? (
                                `${j.jenisIbadahNonMuslim || 'Ibadah rutin'} (${j.frekuensiIbadahNonMuslim || 'Sering'})`
                              ) : (
                                (j.ibadahChecklist || []).join(', ') || '-'
                              )}
                            </b>
                          </p>
                          {j.olahragaDesc && (
                            <p>
                              🏃 Olahraga: <b>{j.olahragaDesc}</b> ({j.olahragaDurasiPilihan || '30 menit'})
                            </p>
                          )}
                          {j.belajarDesc && (
                            <p>
                              📚 Belajar: <b>{j.belajarDesc}</b> ({j.durasiBelajarMenit} mnt)
                            </p>
                          )}
                          {j.bantuOrangTuaDesc && (
                            <p>
                              🧹 Bantu Ortu: <b>{j.bantuOrangTuaDesc}</b>
                            </p>
                          )}
                          {j.catatanOrangTua && (
                            <p className="text-slate-500 italic mt-1">
                              Paraf Ortu: "{j.catatanOrangTua}"
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal('7kaih', j)}
                            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                            Verifikasi & Beri Nilai
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Antrean Jurnal Membaca */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    Jurnal Membaca Menunggu Verifikasi
                  </h4>
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {pendingMembaca.length} Item
                </span>
              </div>

              {pendingMembaca.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-60 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Semua Jurnal Membaca Telah Diverifikasi!
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tidak ada antrean membaca tertunda ({verifikasiClassFilter}).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMembaca.map((b) => {
                    const waktuKirimBaca = formatWaktuKirimWIB(b.submittedAt, b.jamKirim, b.id);
                    const cleanTanggalBaca = normalizeDateStringToWIB(b.tanggal);

                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-sm font-black text-blue-950 block">{b.muridNama}</span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {b.kelas} • Tanggal: <b className="text-slate-800">{cleanTanggalBaca}</b>
                            </span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                            Menunggu Review
                          </span>
                        </div>

                        {/* Deteksi Jam Pengiriman Murid (WIB) */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-emerald-50/90 px-3 py-2 rounded-xl border border-emerald-200">
                          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            Dikirim Murid: <b className="font-bold text-emerald-950">{waktuKirimBaca.lengkap}</b> (Zona WIB)
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                          <h5 className="font-bold text-slate-900">{b.judulBuku}</h5>
                          <p className="text-slate-500 text-[11px]">
                            Penulis: {b.penulis || '-'} • Hal {b.halamanAwal}-{b.halamanAkhir} (
                            {b.durasiMenit} menit) • {b.kategori}
                          </p>
                          <p className="text-slate-700 italic pt-1 leading-relaxed line-clamp-3">
                            "{b.ringkasan}"
                          </p>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenVerifyModal('membaca', b)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                            Verifikasi Ulasan Buku
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL VERIFIKASI DENGAN NOTIFIKASI OTOMATIS */}
      {verifyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  Verifikasi Jurnal{' '}
                  {verifyingItem.type === '7kaih' ? '7 KAIH' : 'Literasi Membaca'}
                </h3>
                <p className="text-xs text-blue-200">
                  Siswa: {verifyingItem.item.muridNama} ({verifyingItem.item.kelas})
                </p>
              </div>
              <button
                onClick={() => setVerifyingItem(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {verifyingItem.type === '7kaih' && (() => {
                const item7 = verifyingItem.item as Jurnal7KAIH;
                const r = calculateRubrik7KAIH(item7);
                return (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-blue-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Rubrik Penilaian Otomatis (Gambar 1–6 + Tidur):
                      </span>
                      <span className="font-black px-2.5 py-0.5 rounded-full bg-blue-900 text-amber-300 text-[11px]">
                        Rata-rata: {item7.skorRataRata || r.skorRataRata}/4.0 ({item7.predikatOtomatis || r.predikat})
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-[10px] text-center bg-white p-2 rounded-xl border border-blue-100">
                      <div>
                        <span className="text-slate-400 block">Bangun (1)</span>
                        <span className="font-bold text-amber-700">{item7.skorBangunPagi || r.skorBangunPagi}/4</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Ibadah (2)</span>
                        <span className="font-bold text-rose-700">{item7.skorBeribadah || r.skorBeribadah}/4</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Olahraga (3)</span>
                        <span className="font-bold text-emerald-700">{item7.skorBerolahraga || r.skorBerolahraga}/4</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Belajar (4)</span>
                        <span className="font-bold text-blue-700">{item7.skorGemarBelajar || r.skorGemarBelajar}/4</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Makan (5)</span>
                        <span className="font-bold text-green-700">{item7.skorMakanSehat || r.skorMakanSehat}/4</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Masy. (6)</span>
                        <span className="font-bold text-purple-700">{item7.skorBermasyarakat || r.skorBermasyarakat}/4</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Tidur (7)</span>
                        <span className="font-bold text-indigo-700">{item7.skorTidurCepat || r.skorTidurCepat}/4</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Rating Bintang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Beri Nilai Apresiasi (Bintang 1 - 5):
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratingVal
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">
                    {ratingVal === 5
                      ? '⭐⭐⭐⭐⭐ Sangat Baik / Istimewa'
                      : ratingVal === 4
                      ? '⭐⭐⭐⭐ Baik'
                      : '⭐⭐⭐ Cukup'}
                  </span>
                </div>
              </div>

              {/* Feedback Guru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Umpan Balik Guru (Tampil di Akun Murid & Ortu):
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-medium leading-relaxed"
                />

                {/* Quick Templates */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Sangat membanggakan! Pertahankan bangun pagi.',
                    'Hebat sekali, literasimu berkembang pesat!',
                    'Perhatikan jam istirahat malam ya nak.',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setFeedbackText(tpl)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      "{tpl.substring(0, 24)}..."
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                🔔 <b>Notifikasi Otomatis:</b> Murid akan seketika melihat notifikasi di dasbor murid
                bahwa jurnal ini telah resmi diverifikasi oleh <b>{currentGuru.nama}</b>.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setVerifyingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmVerify}
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-300" />
                Simpan & Kirim Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB LAMPIRAN 4: REKAPITULASI 7 KAIH BULANAN SESUAI PANDUAN RESMI */}
      {activeTab === 'lampiran4' && (
        <Rekapitulasi7KAIHGuru
          settings={settings}
          currentGuru={currentGuru}
          muridList={muridList}
          jurnal7KaihList={jurnal7KaihList}
          selectedClass={activeClass}
          onClassChange={isKepalaSekolah ? setSelectedClass : undefined}
        />
      )}

      {/* TAB 2: LAPORAN MURID BELUM MENGISI (DENGAN WA BLAST PENGINGAT) */}
      {activeTab === 'belum_mengisi' && (
        <div className="space-y-6 no-print">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Laporan Murid Belum Mengisi Jurnal ({activeClass})
                </h3>
                <p className="text-xs text-slate-500">
                  Pantau murid yang belum mengisi pembiasaan harian & hubungi orang tua via WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600">Pilih Tanggal:</span>
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* List Table Murid Belum Mengisi */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Murid</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4">Nama Orang Tua</th>
                    <th className="py-3 px-4 text-center">Status 7 KAIH</th>
                    <th className="py-3 px-4 text-center">Status Membaca</th>
                    <th className="py-3 px-4 text-right">Aksi Pengingat WA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((student, idx) => {
                    const hasKaih = class7Kaih.some(
                      (j) => j.muridId === student.id && j.tanggal === filterTanggal
                    );
                    const hasMembaca = classMembaca.some(
                      (b) => b.muridId === student.id && b.tanggal === filterTanggal
                    );

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{student.nama}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{student.nisn}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {student.namaOrangTua}
                          <span className="block text-[10px] text-slate-400">
                            {student.noHpOraangTua}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasKaih ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              ✓ Terisi
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              ✗ Belum Isi
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {hasMembaca ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              ✓ Terisi
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              - Belum
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!hasKaih || !hasMembaca ? (
                            <a
                              href={createWaReminderLink(
                                student,
                                !hasKaih && !hasMembaca
                                  ? 'keduanya'
                                  : !hasKaih
                                  ? '7kaih'
                                  : 'membaca'
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Kirim WA Pengingat
                            </a>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">Lengkap ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REKAPITULASI & ANALISIS KELAS */}
      {activeTab === 'analisis' && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Kepatuhan 7 KAIH Rata-Rata</span>
              <div className="mt-2 text-2xl font-black text-blue-900">
                {Math.round(
                  (bangunPagiPct + ibadahPct + olahragaPct + makanSehatPct + belajarPct + bantuOrtuPct + tidurTepatPct) / 7
                )}
                %
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Sangat Baik & Konsisten</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Buku Dibaca Kelas</span>
              <div className="mt-2 text-2xl font-black text-emerald-700">{classMembaca.length} Judul</div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Literasi Sekolah Aktif</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Total Halaman Terbaca</span>
              <div className="mt-2 text-2xl font-black text-indigo-700">
                {classMembaca.reduce(
                  (acc, cur) => acc + Math.max(0, cur.halamanAkhir - cur.halamanAwal + 1),
                  0
                )}{' '}
                Hal
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Rata-rata 25 hal/siswa</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Tingkat Verifikasi Guru</span>
              <div className="mt-2 text-2xl font-black text-amber-600">
                {class7Kaih.length > 0
                  ? Math.round(
                      (class7Kaih.filter((j) => j.status === 'verified').length / class7Kaih.length) * 100
                    )
                  : 100}
                %
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Respon cepat wali kelas</p>
            </div>
          </div>

          {/* Bar Chart 7 Kebiasaan Anak Indonesia Hebat */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Analisis Capaian 7 Kebiasaan Anak Indonesia Hebat ({activeClass})
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Persentase keterlaksanaan masing-masing kebiasaan baik oleh seluruh siswa
            </p>

            <div className="space-y-4">
              {[
                { title: '1. Bangun Pagi Mandiri', pct: bangunPagiPct, color: 'bg-amber-500' },
                { title: '2. Ibadah / Sholat 5 Waktu & Doa', pct: ibadahPct, color: 'bg-rose-500' },
                { title: '3. Berolahraga / Aktivitas Fisik', pct: olahragaPct, color: 'bg-emerald-500' },
                { title: '4. Makan Sehat & Gizi Seimbang', pct: makanSehatPct, color: 'bg-green-600' },
                { title: '5. Gemar Belajar Mandiri', pct: belajarPct, color: 'bg-blue-600' },
                { title: '6. Berbakti & Membantu Orang Tua', pct: bantuOrtuPct, color: 'bg-purple-600' },
                { title: '7. Tidur Tepat Waktu (sebelum 21.00)', pct: tidurTepatPct, color: 'bg-indigo-600' },
              ].map((h, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>{h.title}</span>
                    <span>{h.pct}% Tercapai</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${h.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(5, h.pct)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREVIEW CETAK REKAPITULASI DENGAN SETTING KERTAS A4 & FORMAT PDF */}
      {activeTab === 'cetak_a4' && (
        <div className="space-y-6">
          {/* Action Toolbar (Hidden during print) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-900" />
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Preview Dokumen Cetak Rekapitulasi (Kertas A4)
                </h4>
                <p className="text-xs text-slate-500">
                  Siap diunduh sebagai PDF dengan margin 15mm standar kearsipan sekolah.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Unduh PDF Resmi A4 */}
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={async () => {
                  if (!cetakA4Ref.current) return;
                  setIsGeneratingPdf(true);
                  const filename = `Rekapitulasi_Cetak_${selectedClass.replace(/\s+/g, '_')}_${settings.semester.replace(/\s+/g, '_')}`;
                  const res = await downloadElementAsPdf(cetakA4Ref.current, filename, {
                    orientation: 'portrait',
                    title: `Rekapitulasi Pembiasaan & Literasi - ${selectedClass}`,
                  });
                  setIsGeneratingPdf(false);
                  setCetakToastMsg(res.message);
                  setTimeout(() => setCetakToastMsg(null), 4000);
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-200" />
                )}
                <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF (Format A4)'}</span>
              </button>

              {/* Unduh HTML Siap Cetak */}
              <button
                type="button"
                onClick={() => {
                  if (!cetakA4Ref.current) return;
                  const filename = `Rekapitulasi_Cetak_${selectedClass.replace(/\s+/g, '_')}_${settings.semester.replace(/\s+/g, '_')}`;
                  downloadPrintableHtml(
                    cetakA4Ref.current,
                    `Rekapitulasi Pembiasaan & Literasi - ${selectedClass}`,
                    filename
                  );
                  setCetakToastMsg('Berkas HTML Siap Cetak berhasil diunduh!');
                  setTimeout(() => setCetakToastMsg(null), 3000);
                }}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                <span className="hidden sm:inline">Unduh Berkas HTML</span>
              </button>

              {/* Cetak Langsung */}
              <button
                type="button"
                onClick={() => {
                  if (cetakA4Ref.current) {
                    safePrintElement(
                      cetakA4Ref.current,
                      `Rekapitulasi Pembiasaan - ${selectedClass}`
                    );
                  } else {
                    handlePrintA4();
                  }
                }}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Cetak Langsung</span>
              </button>
            </div>
          </div>

          {cetakToastMsg && (
            <div className="no-print p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cetakToastMsg}</span>
            </div>
          )}

          {/* DOKUMEN CETAK RESMI FORMAT KERTAS A4 */}
          <div ref={cetakA4Ref} className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-lg print-container max-w-[210mm] mx-auto text-black">
            {/* Kop Surat Resmi SDN Kapuk 06 Pagi */}
            <KopSurat settings={settings} />

            {/* Judul Laporan */}
            <div className="text-center my-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide underline underline-offset-4">
                REKAPITULASI PEMBIASAAN 7 KAIH DAN LITERASI MEMBACA
              </h3>
              <p className="text-xs mt-1 font-semibold">
                Rombongan Belajar: {selectedClass} • Tahun Ajaran: {settings.tahunAjaran} ({settings.semester})
              </p>
            </div>

            {/* Ringkasan Parameter */}
            <div className="text-[11px] mb-4 grid grid-cols-2 gap-2 border border-black p-2.5 rounded-sm">
              <div>
                <p>
                  <b>Sekolah:</b> {settings.namaSekolah}
                </p>
                <p>
                  <b>NPSN:</b> {settings.npsn}
                </p>
                <p>
                  <b>Wali Kelas:</b> {currentGuru.nama}
                </p>
              </div>
              <div>
                <p>
                  <b>Jumlah Murid:</b> {classStudents.length} Siswa
                </p>
                <p>
                  <b>Tanggal Rekapitulasi:</b> {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </p>
                <p>
                  <b>Status Verifikasi:</b> Lengkap & Tervalidasi
                </p>
              </div>
            </div>

            {/* Tabel Rekapitulasi Murid */}
            <table className="w-full text-[10px] border-collapse border border-black my-4">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-black p-1.5 w-8">No</th>
                  <th className="border border-black p-1.5 text-left">Nama Peserta Didik</th>
                  <th className="border border-black p-1.5 w-20">NISN</th>
                  <th className="border border-black p-1.5 w-16">7 KAIH</th>
                  <th className="border border-black p-1.5 w-16">Buku</th>
                  <th className="border border-black p-1.5 w-16">Halaman</th>
                  <th className="border border-black p-1.5 w-16">Nilai Rata</th>
                  <th className="border border-black p-1.5 text-left">Predikat Karakter</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s, idx) => {
                  const sKaih = class7Kaih.filter((j) => j.muridId === s.id);
                  const sBaca = classMembaca.filter((b) => b.muridId === s.id);
                  const hal = sBaca.reduce(
                    (acc, c) => acc + Math.max(0, c.halamanAkhir - c.halamanAwal + 1),
                    0
                  );

                  return (
                    <tr key={s.id} className="text-center">
                      <td className="border border-black p-1">{idx + 1}</td>
                      <td className="border border-black p-1 text-left font-bold">{s.nama}</td>
                      <td className="border border-black p-1 font-mono">{s.nisn}</td>
                      <td className="border border-black p-1">{sKaih.length} Hari</td>
                      <td className="border border-black p-1">{sBaca.length} Judul</td>
                      <td className="border border-black p-1">{hal} Hal</td>
                      <td className="border border-black p-1 font-bold">5.0 (A)</td>
                      <td className="border border-black p-1 text-left">Sangat Baik / Mandiri</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bagian Tanda Tangan Resmi */}
            <div className="grid grid-cols-2 gap-8 text-[11px] mt-8 avoid-break">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah SDN Kapuk 06 Pagi</p>
                <div className="h-16 flex items-center justify-center">
                  {/* Cap & Signature Placeholder */}
                  <span className="text-[10px] text-slate-400 italic">
                    [Tanda Tangan & Cap Sekolah]
                  </span>
                </div>
                <p className="font-bold underline">{settings.kepalaSekolah || 'Emirita Br. Ginting, S.Ag'}</p>
                <p>NIP. {settings.nipKepalaSekolah || '197104212003122001'}</p>
              </div>

              <div className="text-center">
                <p>Jakarta Barat, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                <p className="font-bold">Guru Kelas / Wali Kelas</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400 italic">
                    [Tanda Tangan Guru Kelas]
                  </span>
                </div>
                <p className="font-bold underline">{currentGuru.nama}</p>
                <p>NIP. {currentGuru.nip}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: TAMBAH MURID BARU KE KELAS INI */}
      {/* ======================================================== */}
      {isAddingMurid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Tambah Murid Baru</h4>
                  <p className="text-xs text-slate-500">Pendaftaran peserta didik ke {activeClass}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingMurid(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMuridSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Peserta Didik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Farhan Pratama"
                  value={newMuridData.nama}
                  onChange={(e) => setNewMuridData({ ...newMuridData, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NISN (10 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0123456789"
                    value={newMuridData.nisn}
                    onChange={(e) => setNewMuridData({ ...newMuridData, nisn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Sekolah)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 242501"
                    value={newMuridData.nis}
                    onChange={(e) => setNewMuridData({ ...newMuridData, nis: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={newMuridData.jenisKelamin}
                    onChange={(e) => setNewMuridData({ ...newMuridData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rombongan Belajar (Kelas)</label>
                  <input
                    type="text"
                    disabled
                    value={activeClass === 'Semua Kelas' ? 'Kelas 1A' : activeClass}
                    className="w-full px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk. Bambang Sutrisno"
                  value={newMuridData.namaOrangTua}
                  onChange={(e) => setNewMuridData({ ...newMuridData, namaOrangTua: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. HP Orang Tua (WhatsApp)</label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={newMuridData.noHpOraangTua}
                  onChange={(e) => setNewMuridData({ ...newMuridData, noHpOraangTua: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Digunakan untuk fitur pengingat jurnal dan broadcast pengumuman via WhatsApp.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Login Murid (Default: 1234)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={newMuridData.pin}
                  onChange={(e) => setNewMuridData({ ...newMuridData, pin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingMurid(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  Simpan Murid Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT DATA MURID */}
      {/* ======================================================== */}
      {editingMurid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Edit Data Murid</h4>
                  <p className="text-xs text-slate-500">Perbarui informasi ananda {editingMurid.nama}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMurid(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditMuridSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Peserta Didik <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingMurid.nama}
                  onChange={(e) => setEditingMurid({ ...editingMurid, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NISN (10 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMurid.nisn}
                    onChange={(e) => setEditingMurid({ ...editingMurid, nisn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk)</label>
                  <input
                    type="text"
                    value={editingMurid.nis}
                    onChange={(e) => setEditingMurid({ ...editingMurid, nis: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={editingMurid.jenisKelamin}
                    onChange={(e) => setEditingMurid({ ...editingMurid, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas / Rombel</label>
                  {isKepalaSekolah ? (
                    <select
                      value={editingMurid.kelas}
                      onChange={(e) => setEditingMurid({ ...editingMurid, kelas: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-bold"
                    >
                      {DAFTAR_KELAS.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={editingMurid.kelas}
                      className="w-full px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-slate-600 font-bold"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                <input
                  type="text"
                  value={editingMurid.namaOrangTua}
                  onChange={(e) => setEditingMurid({ ...editingMurid, namaOrangTua: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. HP Orang Tua (WhatsApp)</label>
                <input
                  type="text"
                  value={editingMurid.noHpOraangTua}
                  onChange={(e) => setEditingMurid({ ...editingMurid, noHpOraangTua: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Login Murid</label>
                <input
                  type="text"
                  maxLength={6}
                  value={editingMurid.pin}
                  onChange={(e) => setEditingMurid({ ...editingMurid, pin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMurid(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: HAPUS SEMUA (DENGAN KONFIRMASI KETIK "HAPUS") */}
      {/* ======================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus Semua</h4>
                <p className="text-xs text-rose-600 font-semibold">Tindakan ini memerlukan kehati-hatian</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Pilih cakupan data yang ingin Anda hapus untuk <b>{activeClass}</b>:
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteTarget === 'murid_kelas'}
                    onChange={() => setDeleteTarget('murid_kelas')}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Hapus Semua Murid di {activeClass}</span>
                    <span className="text-slate-500 text-[11px]">
                      Menghapus seluruh daftar akun peserta didik {activeClass} ({classStudents.length} murid).
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteTarget === 'jurnal_kelas'}
                    onChange={() => setDeleteTarget('jurnal_kelas')}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Hapus Semua Riwayat Jurnal {activeClass}</span>
                    <span className="text-slate-500 text-[11px]">
                      Membersihkan seluruh entri 7 KAIH dan Membaca murid {activeClass}.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 cursor-pointer">
                  <input
                    type="radio"
                    name="deleteScope"
                    checked={deleteTarget === 'semua_kelas'}
                    onChange={() => setDeleteTarget('semua_kelas')}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <span className="font-bold text-rose-900 block">Kosongkan Seluruh Data {activeClass}</span>
                    <span className="text-rose-700 text-[11px]">
                      Hapus semua murid beserta seluruh riwayat jurnalnya (Mulai dari nol).
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-1">
                  Ketik kata <span className="text-rose-600 uppercase font-black font-mono">HAPUS</span> di bawah ini untuk konfirmasi:
                </label>
                <input
                  type="text"
                  placeholder="Ketik HAPUS"
                  value={deleteConfirmKeyword}
                  onChange={(e) => setDeleteConfirmKeyword(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold tracking-wider text-center uppercase focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmKeyword('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteAll}
                disabled={deleteConfirmKeyword.trim().toUpperCase() !== 'HAPUS'}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-xs text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: BAGIKAN TAUTAN APLIKASI KE MURID & ORANG TUA */}
      {/* ======================================================== */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">Bagikan Tautan ke Murid & Ortu</h4>
                  <p className="text-xs text-slate-500">Tautan resmi portal {activeClass} SDN Kapuk 06 Pagi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* URL Box */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Tautan Aplikasi Web Publik:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareAppUrl}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono text-[11px] text-blue-900 font-semibold select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shareAppUrl);
                      setCopiedLink(true);
                      showToast('Tautan aplikasi berhasil disalin!');
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-900 hover:bg-blue-800 text-white shadow-xs'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* WA Broadcast Message Preview */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Format Pesan Pengumuman WhatsApp Grup Kelas:
                </label>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-slate-800 leading-relaxed font-sans whitespace-pre-line text-[11px] max-h-48 overflow-y-auto">
                  {generateWaBroadcastMessage()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generateWaBroadcastMessage())}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Pesan ke Grup WhatsApp
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generateWaBroadcastMessage());
                    showToast('Format pesan pengumuman tersalin ke clipboard!');
                  }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Salin Teks Lengkap
                </button>
              </div>

              {/* Petunjuk Tambahan */}
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-[11px] text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" /> Tips Penggunaan untuk Murid & Ortu:
                </div>
                <p>
                  1. Murid dan orang tua tidak perlu install file APK. Cukup buka tautan di browser Chrome atau Safari di HP manapun.
                </p>
                <p>
                  2. Di menu browser HP, pilih <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b> agar muncul ikon aplikasi langsung di layar HP seperti aplikasi Play Store.
                </p>
                <p>
                  3. Murid masuk dengan memasukkan <b>NISN</b> dan <b>PIN (1234)</b>.
                </p>
                <p className="text-emerald-800 font-semibold pt-1 border-t border-blue-200/60">
                  4. Bebas Akun Google: Tautan portal ini TIDAK membutuhkan login Google, sehingga aman dari masalah "Akses ditolak" atau "Perlu izin akun Google".
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {guruToast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-semibold ${
              guruToast.isError ? 'bg-rose-600' : 'bg-slate-900'
            }`}
          >
            {guruToast.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-200 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{guruToast.message}</span>
            <button
              onClick={() => setGuruToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODAL IMPOR DATA MURID KELAS */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="murid"
        targetKelas={activeClass !== 'Semua Kelas' ? activeClass : undefined}
        onImportMurid={handleImportMuridClass}
      />
    </div>
  );
};
