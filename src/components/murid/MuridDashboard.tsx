import React, { useState } from 'react';
import { Murid, Jurnal7KAIH, JurnalMembaca, SchoolSettings } from '../../types';
import {
  Sun,
  Heart,
  Activity,
  Apple,
  BookOpen,
  Users2,
  Moon,
  CheckCircle,
  Clock,
  Star,
  Send,
  Sparkles,
  Award,
  AlertCircle,
  FileCheck,
  Calendar,
  FileText,
  Info,
  X,
  ChevronRight,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { getTodayWIB, getJamMenitWIB, getTimestampWIB, normalizeDateStringToWIB } from '../../utils/dateUtils';
import { FormulirCatatanHarian } from '../kaih/FormulirCatatanHarian';
import { LembarRefleksiOrtu } from '../kaih/LembarRefleksiOrtu';
import { calculateRubrik7KAIH, RUBRIK_GUIDELINES } from '../../services/rubrikService';

interface MuridDashboardProps {
  currentMurid: Murid;
  settings: SchoolSettings;
  jurnal7KaihList: Jurnal7KAIH[];
  jurnalMembacaList: JurnalMembaca[];
  onSubmit7Kaih: (entry: Jurnal7KAIH) => void;
  onSubmitMembaca: (entry: JurnalMembaca) => void;
  onOpenNotifications: () => void;
}

export const MuridDashboard: React.FC<MuridDashboardProps> = ({
  currentMurid,
  settings: _settings,
  jurnal7KaihList,
  jurnalMembacaList,
  onSubmit7Kaih,
  onSubmitMembaca,
  onOpenNotifications,
}) => {
  // Sesuai urutan yang diminta user:
  // 1) Isi 7 KAIH (sebelumnya Isi Cepat Harian)
  // 2) Formulir Catatan Harian
  // 3) Lembar Refleksi Orang Tua
  // Selain itu, urutan tidak berubah: membaca, beranda, riwayat.
  const [activeTab, setActiveTab] = useState<
    'kaih' | 'catatan_harian' | 'refleksi_ortu' | 'membaca' | 'beranda' | 'riwayat'
  >('kaih');

  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [isRubrikGuideModalOpen, setIsRubrikGuideModalOpen] = useState(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);

  const posterUrl = _settings?.posterUrl || 'https://i.imgur.com/pJOJiuF.jpeg';
  const logoUrl = _settings?.logoUrl || 'https://i.imgur.com/GlCn0x3.png';

  // Form State 7 KAIH (Harian) - Tanggal default Waktu Indonesia Barat (WIB, UTC+7)
  const todayStr = getTodayWIB();
  const [kaihTanggal, setKaihTanggal] = useState(todayStr);

  // 1. Bangun Pagi (Gambar 1: <= 05:00 = 4, 05:01-05:30 = 3, 05:31-06:00 = 2, > 06:00 = 1)
  const [jamBangun, setJamBangun] = useState('');
  const [bangunPagiChecked, setBangunPagiChecked] = useState(false);

  // 2. Beribadah (Gambar 2: Muslim & Non Muslim)
  const [agama, setAgama] = useState<'Muslim' | 'Non Muslim'>('Muslim');
  const [ibadahChecklist, setIbadahChecklist] = useState<string[]>([]);
  const [sedangBerhalangan, setSedangBerhalangan] = useState(false);
  const [jenisIbadahNonMuslim, setJenisIbadahNonMuslim] = useState('');
  const [frekuensiIbadahNonMuslim, setFrekuensiIbadahNonMuslim] = useState<
    'Sering' | 'Sedang' | 'Jarang-jarang' | 'Tidak melakukan ibadah' | ''
  >('');

  // 3. Berolahraga (Gambar 3: >= 30 mnt = 4, 20-29 mnt = 3, 10-19 mnt = 2, < 10 mnt = 1)
  const [olahragaChecked, setOlahragaChecked] = useState(false);
  const [olahragaDesc, setOlahragaDesc] = useState('');
  const [olahragaDurasiPilihan, setOlahragaDurasiPilihan] = useState<
    '< 10 menit' | '10 - 19 menit' | '20 - 29 menit' | '30 menit atau lebih' | ''
  >('');

  // 4. Makan Sehat dan Bergizi (Gambar 5: 3 waktu x 5 jenis = 15 centang)
  const [makanSehatChecked, setMakanSehatChecked] = useState(false);
  const [makanSehatHabits, setMakanSehatHabits] = useState<string[]>([]);
  const [makanSehatCentangs, setMakanSehatCentangs] = useState<Record<string, boolean>>({});

  // 5. Gemar Belajar (Gambar 4: > 60 mnt = 4, 31-60 = 3, 15-30 = 2, < 15 = 1)
  const [belajarChecked, setBelajarChecked] = useState(false);
  const [belajarDesc, setBelajarDesc] = useState('');
  const [durasiBelajar, setDurasiBelajar] = useState<number | ''>('');

  // 6. Bermasyarakat (Gambar 6: 6 pertanyaan Iya/Tidak)
  const [bantuOrangTuaChecked, setBantuOrangTuaChecked] = useState(false);
  const [bantuOrangTuaDesc, setBantuOrangTuaDesc] = useState('');
  const [bermasyarakatAnswers, setBermasyarakatAnswers] = useState<Record<string, 'Iya' | 'Tidak'>>({});

  // 7. Tidur Cepat (Pukul 21.00 = 4, 21.01-22.00 = 3, 22.01-23.00 = 2, 23.01-24.00 = 1)
  const [jamTidur, setJamTidur] = useState('');
  const [tidurTepatWaktuChecked, setTidurTepatWaktuChecked] = useState(false);

  // Refleksi & Komentar Orang Tua
  const [refleksiMurid, setRefleksiMurid] = useState('');
  const [catatanOrangTua, setCatatanOrangTua] = useState('');
  const [parafOrangTua, setParafOrangTua] = useState(false);

  // State proses penyimpanan dengan progress indicator
  const [isSavingKaih, setIsSavingKaih] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  const [saveStatusText, setSaveStatusText] = useState<string>('');

  // Fungsi pengosongan formulir (hanya teks bayangan sebagai contoh pengisian)
  const resetFormToBlank = () => {
    setJamBangun('');
    setBangunPagiChecked(false);
    setIbadahChecklist([]);
    setSedangBerhalangan(false);
    setJenisIbadahNonMuslim('');
    setFrekuensiIbadahNonMuslim('');
    setOlahragaChecked(false);
    setOlahragaDesc('');
    setOlahragaDurasiPilihan('');
    setMakanSehatChecked(false);
    setMakanSehatHabits([]);
    setMakanSehatCentangs({});
    setBelajarChecked(false);
    setBelajarDesc('');
    setDurasiBelajar('');
    setBantuOrangTuaChecked(false);
    setBantuOrangTuaDesc('');
    setBermasyarakatAnswers({});
    setJamTidur('');
    setTidurTepatWaktuChecked(false);
    setRefleksiMurid('');
    setCatatanOrangTua('');
    setParafOrangTua(false);
  };

  // Form State Jurnal Membaca
  const [bacaTanggal, setBacaTanggal] = useState(todayStr);
  const [judulBuku, setJudulBuku] = useState('');
  const [penulis, setPenulis] = useState('');
  const [penerbit, setPenerbit] = useState('');
  const [kategori, setKategori] = useState<JurnalMembaca['kategori']>('Cerita Rakyat');
  const [halamanAwal, setHalamanAwal] = useState(1);
  const [halamanAkhir, setHalamanAkhir] = useState(15);
  const [durasiMembaca, setDurasiMembaca] = useState(25);
  const [ringkasan, setRingkasan] = useState('');
  const [kesan, setKesan] = useState<JurnalMembaca['kesan']>('Sangat Seru');

  // Filter journals for current student
  const student7Kaih = jurnal7KaihList.filter((j) => j.muridId === currentMurid.id);
  const studentMembaca = jurnalMembacaList.filter((b) => b.muridId === currentMurid.id);

  // Stats
  const verifiedKaihCount = student7Kaih.filter((j) => j.status === 'verified').length;
  const verifiedMembacaCount = studentMembaca.filter((b) => b.status === 'verified').length;
  const totalBukuDibaca = studentMembaca.length;
  const totalHalamanDibaca = studentMembaca.reduce(
    (acc, cur) => acc + Math.max(0, cur.halamanAkhir - cur.halamanAwal + 1),
    0
  );

  // Check if today is already submitted
  const isKaihTodaySubmitted = student7Kaih.some((j) => j.tanggal === todayStr);
  const isMembacaTodaySubmitted = studentMembaca.some((j) => j.tanggal === todayStr);

  // Latest verified journal to show celebration banner
  const latestVerifiedKaih = student7Kaih.find((j) => j.status === 'verified');
  const latestVerifiedBaca = studentMembaca.find((j) => j.status === 'verified');

  // Sinkronisasi data formulir saat tanggal atau murid berganti:
  // Jika tanggal tersebut sudah memiliki data tersimpan di riwayat, muat data nyata tersebut.
  // Jika tanggal baru (belum diisi), pastikan formulir tetap bersih (hanya teks bayangan contoh pengisian).
  React.useEffect(() => {
    const existing = student7Kaih.find((j) => j.tanggal === kaihTanggal);
    if (existing) {
      setJamBangun(existing.jamBangun || '');
      setBangunPagiChecked(!!existing.bangunPagiChecked);
      setAgama(existing.agama || 'Muslim');
      setIbadahChecklist(existing.ibadahChecklist || []);
      setSedangBerhalangan(
        !!existing.sedangBerhalangan ||
        (existing.ibadahChecklist || []).some((item) => item.toLowerCase().includes('berhalangan'))
      );
      setJenisIbadahNonMuslim(existing.jenisIbadahNonMuslim || '');
      setFrekuensiIbadahNonMuslim((existing.frekuensiIbadahNonMuslim as any) || '');
      setOlahragaChecked(!!existing.olahragaChecked);
      setOlahragaDesc(existing.olahragaDesc || '');
      setOlahragaDurasiPilihan((existing.olahragaDurasiPilihan as any) || '');
      setMakanSehatChecked(!!existing.makanSehatChecked);
      setMakanSehatHabits(existing.makanSehatHabits || []);
      setBelajarChecked(!!existing.belajarChecked);
      setBelajarDesc(existing.belajarDesc || '');
      setDurasiBelajar(existing.durasiBelajarMenit || '');
      setBantuOrangTuaChecked(!!existing.bantuOrangTuaChecked);
      setBantuOrangTuaDesc(existing.bantuOrangTuaDesc || '');
      setBermasyarakatAnswers(existing.bermasyarakatAnswers || {});
      setJamTidur(existing.jamTidur || '');
      setTidurTepatWaktuChecked(!!existing.tidurTepatWaktuChecked);
      setRefleksiMurid(existing.refleksiMurid || '');
      setCatatanOrangTua(existing.catatanOrangTua || '');
      setParafOrangTua(!!existing.parafOrangTua);
    } else {
      resetFormToBlank();
    }
  }, [kaihTanggal, currentMurid.id]);

  // Hitung centang makan sehat dan bermasyarakat
  const totalMakanCentang = Object.values(makanSehatCentangs).filter(Boolean).length;
  const totalBermasyarakatIya = Object.values(bermasyarakatAnswers).filter((v) => v === 'Iya').length;

  // Real-time live automatic rubric evaluation
  const liveRubrik = calculateRubrik7KAIH({
    jamBangun,
    agama,
    ibadahChecklist,
    sedangBerhalangan,
    jenisIbadahNonMuslim,
    frekuensiIbadahNonMuslim: frekuensiIbadahNonMuslim || undefined,
    olahragaChecked,
    olahragaDurasiPilihan: olahragaDurasiPilihan || undefined,
    makanSehatCentangCount: totalMakanCentang,
    belajarChecked,
    durasiBelajarMenit: Number(durasiBelajar),
    bermasyarakatAnswers,
    bermasyarakatIyaCount: totalBermasyarakatIya,
    jamTidur,
  });

  // Handle cell click on the 1-31 matrix
  const handleUpdateDayStatus = (dateStr: string, habitKey: string, value: boolean) => {
    const existing = jurnal7KaihList.find(
      (j) => j.muridId === currentMurid.id && normalizeDateStringToWIB(j.tanggal) === dateStr
    );
    let updatedEntry: Jurnal7KAIH;

    if (existing) {
      updatedEntry = {
        ...existing,
        bangunPagiChecked: habitKey === 'bangunPagi' ? value : existing.bangunPagiChecked,
        ibadahChecklist:
          habitKey === 'beribadah'
            ? value
              ? ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']
              : []
            : existing.ibadahChecklist,
        olahragaChecked: habitKey === 'berolahraga' ? value : existing.olahragaChecked,
        makanSehatChecked: habitKey === 'makanSehat' ? value : existing.makanSehatChecked,
        belajarChecked: habitKey === 'gemarBelajar' ? value : existing.belajarChecked,
        bantuOrangTuaChecked: habitKey === 'bermasyarakat' ? value : existing.bantuOrangTuaChecked,
        tidurTepatWaktuChecked: habitKey === 'tidurCepat' ? value : existing.tidurTepatWaktuChecked,
      };
    } else {
      const wibNow = getTimestampWIB();
      const wibJam = getJamMenitWIB();
      updatedEntry = {
        id: `kaih-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        muridId: currentMurid.id,
        muridNama: currentMurid.nama,
        kelas: currentMurid.kelas,
        tanggal: dateStr,
        jamBangun: habitKey === 'bangunPagi' && value ? '05:00' : '',
        bangunPagiChecked: habitKey === 'bangunPagi' ? value : false,
        agama: 'Muslim',
        ibadahChecklist: habitKey === 'beribadah' && value ? ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'] : [],
        olahragaChecked: habitKey === 'berolahraga' ? value : false,
        olahragaDesc: '',
        olahragaDurasiPilihan: undefined,
        makanSehatChecked: habitKey === 'makanSehat' ? value : false,
        makanSehatHabits: [],
        makanSehatCentangCount: 0,
        belajarChecked: habitKey === 'gemarBelajar' ? value : false,
        belajarDesc: '',
        durasiBelajarMenit: habitKey === 'gemarBelajar' && value ? 30 : 0,
        bantuOrangTuaChecked: habitKey === 'bermasyarakat' ? value : false,
        bantuOrangTuaDesc: '',
        bermasyarakatIyaCount: 0,
        jamTidur: habitKey === 'tidurCepat' && value ? '21:00' : '',
        tidurTepatWaktuChecked: habitKey === 'tidurCepat' ? value : false,
        catatanOrangTua: '',
        parafOrangTua: false,
        status: 'pending',
        submittedAt: wibNow,
        jamKirim: `${wibJam} WIB`,
      };
    }

    // Auto evaluate rubrik
    const rubrikResult = calculateRubrik7KAIH(updatedEntry);
    updatedEntry.skorBangunPagi = rubrikResult.skorBangunPagi;
    updatedEntry.skorBeribadah = rubrikResult.skorBeribadah;
    updatedEntry.skorBerolahraga = rubrikResult.skorBerolahraga;
    updatedEntry.skorGemarBelajar = rubrikResult.skorGemarBelajar;
    updatedEntry.skorMakanSehat = rubrikResult.skorMakanSehat;
    updatedEntry.skorBermasyarakat = rubrikResult.skorBermasyarakat;
    updatedEntry.skorTidurCepat = rubrikResult.skorTidurCepat;
    updatedEntry.skorRataRata = rubrikResult.skorRataRata;
    updatedEntry.predikatOtomatis = rubrikResult.predikat;

    onSubmit7Kaih(updatedEntry);
  };

  // Handle Submit 7 KAIH Harian dengan Indikator Progres Penyimpanan & Transisi Otomatis ke Formulir Catatan Harian
  const handleKaihSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSavingKaih(true);
    setSaveProgress(15);
    setSaveStatusText('Memvalidasi data pembiasaan 7 KAIH...');

    await new Promise((r) => setTimeout(r, 200));
    setSaveProgress(45);
    setSaveStatusText('Menghitung rubrik penilaian otomatis Gambar 1–6...');

    const evaluated = calculateRubrik7KAIH({
      jamBangun,
      agama,
      ibadahChecklist,
      sedangBerhalangan,
      jenisIbadahNonMuslim,
      frekuensiIbadahNonMuslim: frekuensiIbadahNonMuslim || undefined,
      olahragaChecked,
      olahragaDurasiPilihan: olahragaDurasiPilihan || undefined,
      makanSehatCentangCount: totalMakanCentang,
      belajarChecked,
      durasiBelajarMenit: Number(durasiBelajar),
      bermasyarakatAnswers,
      bermasyarakatIyaCount: totalBermasyarakatIya,
      jamTidur,
    });

    await new Promise((r) => setTimeout(r, 250));
    setSaveProgress(75);
    setSaveStatusText('Menyimpan ke basis data & menyinkronkan data...');

    const wibNow = getTimestampWIB();
    const wibJam = getJamMenitWIB();

    const finalIbadah = agama === 'Muslim'
      ? (sedangBerhalangan ? ['Sedang Berhalangan (Uzur Syar\'i)', ...ibadahChecklist.filter((x) => !x.includes('Berhalangan'))] : ibadahChecklist)
      : [];

    const newEntry: Jurnal7KAIH = {
      id: `kaih-${Date.now()}`,
      muridId: currentMurid.id,
      muridNama: currentMurid.nama,
      kelas: currentMurid.kelas,
      tanggal: kaihTanggal,
      jamBangun,
      bangunPagiChecked,
      agama,
      ibadahChecklist: finalIbadah,
      sedangBerhalangan: agama === 'Muslim' ? sedangBerhalangan : false,
      jenisIbadahNonMuslim: agama === 'Non Muslim' ? jenisIbadahNonMuslim : undefined,
      frekuensiIbadahNonMuslim: (agama === 'Non Muslim' && frekuensiIbadahNonMuslim ? frekuensiIbadahNonMuslim : undefined) as any,
      olahragaChecked,
      olahragaDesc,
      olahragaDurasiPilihan: (olahragaDurasiPilihan || undefined) as any,
      makanSehatChecked,
      makanSehatHabits,
      makanSehatCentangCount: totalMakanCentang,
      belajarChecked,
      belajarDesc,
      durasiBelajarMenit: Number(durasiBelajar),
      bantuOrangTuaChecked,
      bantuOrangTuaDesc,
      bermasyarakatAnswers,
      bermasyarakatIyaCount: totalBermasyarakatIya,
      jamTidur,
      tidurTepatWaktuChecked,
      // Rubrik Penilaian Otomatis Harian
      skorBangunPagi: evaluated.skorBangunPagi,
      skorBeribadah: evaluated.skorBeribadah,
      skorBerolahraga: evaluated.skorBerolahraga,
      skorGemarBelajar: evaluated.skorGemarBelajar,
      skorMakanSehat: evaluated.skorMakanSehat,
      skorBermasyarakat: evaluated.skorBermasyarakat,
      skorTidurCepat: evaluated.skorTidurCepat,
      skorRataRata: evaluated.skorRataRata,
      predikatOtomatis: evaluated.predikat,
      refleksiMurid,
      catatanOrangTua,
      parafOrangTua,
      status: 'pending',
      submittedAt: wibNow,
      jamKirim: `${wibJam} WIB`,
    };

    onSubmit7Kaih(newEntry);

    setSaveProgress(100);
    setSaveStatusText('Berhasil disimpan! Membuka Formulir Catatan Harian...');

    await new Promise((r) => setTimeout(r, 400));
    setIsSavingKaih(false);

    // Otomatis beralih ke halaman/tab berikutnya: Formulir Catatan Harian
    setActiveTab('catatan_harian');

    setSubmitSuccessMsg(
      `Alhamdulillah! Jurnal 7 KAIH berhasil dicatat dan dipindahkan ke Formulir Catatan Harian. Rubrik Otomatis: Predikat "${evaluated.predikat}" (Skor ${evaluated.skorRataRata}/4.0).`
    );
    setTimeout(() => setSubmitSuccessMsg(null), 6000);
  };

  // Handle Submit Membaca
  const handleMembacaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulBuku.trim()) {
      alert('Mohon isi judul buku yang dibaca.');
      return;
    }

    const wibNow = getTimestampWIB();
    const wibJam = getJamMenitWIB();

    const newEntry: JurnalMembaca = {
      id: `baca-${Date.now()}`,
      muridId: currentMurid.id,
      muridNama: currentMurid.nama,
      kelas: currentMurid.kelas,
      tanggal: bacaTanggal,
      judulBuku,
      penulis,
      penerbit,
      kategori,
      halamanAwal: Number(halamanAwal),
      halamanAkhir: Number(halamanAkhir),
      durasiMenit: Number(durasiMembaca),
      ringkasan,
      kesan,
      status: 'pending',
      submittedAt: wibNow,
      jamKirim: `${wibJam} WIB`,
    };

    onSubmitMembaca(newEntry);
    setSubmitSuccessMsg('Hebat! Jurnal Membaca berhasil dikirim dan menunggu verifikasi guru.');
    setJudulBuku('');
    setRingkasan('');
    setActiveTab('riwayat');
    setTimeout(() => setSubmitSuccessMsg(null), 5000);
  };

  const toggleIbadah = (item: string) => {
    if (ibadahChecklist.includes(item)) {
      setIbadahChecklist(ibadahChecklist.filter((i) => i !== item));
    } else {
      setIbadahChecklist([...ibadahChecklist, item]);
    }
  };

  const toggleMakanHabit = (item: string) => {
    if (makanSehatHabits.includes(item)) {
      setMakanSehatHabits(makanSehatHabits.filter((i) => i !== item));
    } else {
      setMakanSehatHabits([...makanSehatHabits, item]);
    }
  };

  const toggleMakanCentangCell = (key: string) => {
    setMakanSehatCentangs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setAllMakanCentang = (val: boolean) => {
    const allKeys = [
      'pagi_pokok', 'pagi_lauk', 'pagi_sayur', 'pagi_buah', 'pagi_air',
      'siang_pokok', 'siang_lauk', 'siang_sayur', 'siang_buah', 'siang_air',
      'malam_pokok', 'malam_lauk', 'malam_sayur', 'malam_buah', 'malam_air',
    ];
    const updated: Record<string, boolean> = {};
    allKeys.forEach((k) => {
      updated[k] = val;
    });
    setMakanSehatCentangs(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Student Profile Header & Welcome Card */}
      <div className="no-print bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-extrabold text-2xl shadow-lg border-2 border-white/50">
              {currentMurid.nama.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/90 text-blue-950 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                  {currentMurid.kelas}
                </span>
                <span className="text-blue-100 text-xs">NISN: {currentMurid.nisn}</span>
              </div>
              <h2 className="text-2xl font-bold mt-1 tracking-tight">{currentMurid.nama}</h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Orang Tua / Wali: <span className="font-semibold">{currentMurid.namaOrangTua}</span> (
                {currentMurid.noHpOraangTua})
              </p>
            </div>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-3">
            <div className="bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase text-blue-200 block font-semibold">Status Hari Ini</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isKaihTodaySubmitted ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                ></span>
                <span className="text-xs font-bold">
                  {isKaihTodaySubmitted ? '7 KAIH Terisi ✓' : 'Belum Isi 7 KAIH'}
                </span>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] uppercase text-blue-200 block font-semibold">Literasi Membaca</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    isMembacaTodaySubmitted ? 'bg-emerald-400' : 'bg-sky-300'
                  }`}
                ></span>
                <span className="text-xs font-bold">
                  {isMembacaTodaySubmitted ? 'Membaca Terisi ✓' : 'Belum Membaca'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {submitSuccessMsg && (
        <div className="no-print mb-6 p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-100 flex-shrink-0" />
            <p className="font-semibold text-sm">{submitSuccessMsg}</p>
          </div>
          <button
            onClick={() => setSubmitSuccessMsg(null)}
            className="text-xs bg-emerald-700/50 hover:bg-emerald-700 px-3 py-1 rounded-lg"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Real-time Verification Alert Banner */}
      {(latestVerifiedKaih || latestVerifiedBaca) && (
        <div className="no-print mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-blue-950 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  Notifikasi Otomatis Verifikasi Guru
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  Resmi Diverifikasi
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {latestVerifiedKaih?.feedbackGuru
                  ? `Guru: "${latestVerifiedKaih.feedbackGuru}"`
                  : latestVerifiedBaca?.feedbackGuru
                  ? `Guru: "${latestVerifiedBaca.feedbackGuru}"`
                  : 'Guru kelas telah memeriksa dan memverifikasi jurnal pembiasaan Anda!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setActiveTab('riwayat')}
              className="text-xs font-bold px-3.5 py-1.5 bg-blue-900 text-white rounded-xl hover:bg-blue-800 transition-colors shadow-xs"
            >
              Lihat Ulasan Guru
            </button>
            <button
              onClick={onOpenNotifications}
              className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Semua Notifikasi
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs - PERSIS SESUAI URUTAN YANG DIMINTA:
          1) Isi 7 KAIH (sebelumnya Isi Cepat Harian)
          2) Formulir Catatan Harian
          3) Lembar Refleksi Orang Tua
          Selain itu tidak berubah (Isi Jurnal Membaca, Panduan 7 KAIH, Riwayat & Ulasan) */}
      <div className="no-print flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
        {/* 1) ISI 7 KAIH */}
        <button
          onClick={() => setActiveTab('kaih')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'kaih'
              ? 'bg-amber-400 text-blue-950 shadow-md font-extrabold'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sun className="w-4 h-4 text-amber-500" />
          1) Isi 7 KAIH
        </button>

        {/* 2) FORMULIR CATATAN HARIAN */}
        <button
          onClick={() => setActiveTab('catatan_harian')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'catatan_harian'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-300" />
          2) Formulir Catatan Harian
        </button>

        {/* 3) LEMBAR REFLEKSI ORANG TUA */}
        <button
          onClick={() => setActiveTab('refleksi_ortu')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'refleksi_ortu'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-300" />
          3) Lembar Refleksi Orang Tua
        </button>

        {/* 4) ISI JURNAL MEMBACA */}
        <button
          onClick={() => setActiveTab('membaca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'membaca'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-500" />
          Isi Jurnal Membaca
        </button>

        {/* 5) PANDUAN 7 KAIH & LENCANA */}
        <button
          onClick={() => setActiveTab('beranda')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'beranda'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          Panduan 7 KAIH & Lencana
        </button>

        {/* 6) RIWAYAT & ULASAN GURU */}
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'riwayat'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4 text-indigo-500" />
          Riwayat & Ulasan Guru ({student7Kaih.length + studentMembaca.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1) FITUR: ISI 7 KAIH (LENGKAP DENGAN RUBRIK OTOMATIS GAMBAR 1-6 + TIDUR) */}
      {/* ========================================================================= */}
      {activeTab === 'kaih' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-6">
          {/* BANNER POSTER 7 KAIH */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-blue-950 shadow-sm flex items-center justify-between gap-3 border border-amber-300">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={posterUrl}
                alt="Poster 7 KAIH"
                className="w-12 h-16 object-cover rounded-xl shadow-md border-2 border-white flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setIsPosterModalOpen(true)}
              />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-950 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  Panduan Karakter Murid
                </span>
                <h3 className="text-xs sm:text-sm font-black mt-0.5 leading-tight truncate">
                  Poster Resmi 7 Karakter Anak Indonesia Hebat
                </h3>
                <p className="text-[11px] font-medium opacity-90 truncate">
                  Lihat panduan 7 pembiasaan karakter unggul murid SDN Kapuk 06 Pagi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPosterModalOpen(true)}
              className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-amber-300 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md flex-shrink-0 cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Buka Poster</span>
            </button>
          </div>

          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Isi 7 KAIH (Jurnal Pembiasaan Harian)</h3>
                <p className="text-xs text-slate-500">
                  Dilengkapi <b>Rubrik Penilaian Otomatis (Skor 1 - 4)</b> sesuai standar resmi Kementerian Pendidikan Dasar dan Menengah.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={resetFormToBlank}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Kosongkan formulir kembali ke awal"
              >
                <span>Bersihkan Isian</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRubrikGuideModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Info className="w-4 h-4 text-blue-700" />
                <span>Standar Rubrik Gambar 1–6</span>
              </button>
            </div>
          </div>

          {/* CARD PREVIEW LIVE RUBRIK PENILAIAN HARIAN OTOMATIS */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white p-5 rounded-2xl shadow-md border border-blue-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-blue-950 rounded-xl font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">
                    Rubrik Penilaian Harian Otomatis 7 KAIH
                  </h4>
                  <p className="text-[11px] text-blue-200">
                    Skor terhitung langsung otomatis saat murid mengisi butir di bawah.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-blue-200 block uppercase font-semibold">Skor Rata-Rata</span>
                  <span className="text-xl font-black text-amber-300 font-mono">
                    {liveRubrik.isFreshBlank ? '-' : liveRubrik.skorRataRata}{' '}
                    <span className="text-xs text-blue-200">/ 4.0</span>
                  </span>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-xl border border-white/20 text-center">
                  <span className="text-[10px] text-blue-200 block uppercase font-semibold">Predikat</span>
                  <span
                    className={`text-xs font-black ${
                      liveRubrik.isFreshBlank
                        ? 'text-amber-300'
                        : liveRubrik.predikat === 'Sangat Baik'
                        ? 'text-emerald-300'
                        : liveRubrik.predikat === 'Baik'
                        ? 'text-blue-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {liveRubrik.isFreshBlank ? 'Belum Diisi' : liveRubrik.predikat}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid 7 Skor Butir Rubrik Gambar 1-6 + Tidur */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-3 text-center text-xs">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-amber-200 block font-semibold">1. Bangun (Gbr 1)</span>
                <span className="text-base font-black text-white">
                  {liveRubrik.skorBangunPagi > 0 ? `${liveRubrik.skorBangunPagi}/4` : '-'}
                </span>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-rose-200 block font-semibold">2. Ibadah (Gbr 2)</span>
                <span className="text-base font-black text-white">
                  {liveRubrik.skorBeribadah > 0 ? `${liveRubrik.skorBeribadah}/4` : '-'}
                </span>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-emerald-200 block font-semibold">3. Olahraga (Gbr 3)</span>
                <span className="text-base font-black text-white">
                  {liveRubrik.skorBerolahraga > 0 ? `${liveRubrik.skorBerolahraga}/4` : '-'}
                </span>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-blue-200 block font-semibold">4. Belajar (Gbr 4)</span>
                <span className="text-base font-black text-white">
                  {liveRubrik.skorGemarBelajar > 0 ? `${liveRubrik.skorGemarBelajar}/4` : '-'}
                </span>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-green-200 block font-semibold">5. Makan (Gbr 5)</span>
                <span className="text-base font-black text-white">
                  {liveRubrik.skorMakanSehat > 0 ? `${liveRubrik.skorMakanSehat}/4` : '-'}
                </span>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-purple-200 block font-semibold">6. Masyarakat (6)</span>
                <span className="text-base font-black text-white">
                  {liveRubrik.skorBermasyarakat > 0 ? `${liveRubrik.skorBermasyarakat}/4` : '-'}
                </span>
              </div>
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-[10px] text-indigo-200 block font-semibold">7. Tidur Cepat</span>
                <span className="text-base font-black text-white">
                  {liveRubrik.skorTidurCepat > 0 ? `${liveRubrik.skorTidurCepat}/4` : '-'}
                </span>
              </div>
            </div>

            {/* Banner Penjelasan Formulir Bersih (Bayangan Pengisian) */}
            {liveRubrik.isFreshBlank && (
              <div className="mt-3 p-2.5 bg-amber-400/20 border border-amber-300/40 rounded-xl text-[11px] text-amber-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  <b>Formulir Bersih (Teks Bayangan):</b> Kolom di bawah belum diisi dan hanya memuat teks contoh
                  (bayangan pengisian). Silakan centang dan masukkan data nyata pembiasaan hari ini untuk menghitung rubrik penilaian otomatis.
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleKaihSubmit} className="space-y-6">
            {/* Tanggal & Jam */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                <input
                  type="date"
                  value={kaihTanggal}
                  onChange={(e) => setKaihTanggal(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Waktu Bangun Pagi (Contoh bayangan: 05:00)
                </label>
                <input
                  type="time"
                  value={jamBangun}
                  onChange={(e) => setJamBangun(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ket: 04.30–05.00 (Skor 4) • 05.01–05.30 (Skor 3) • 05.31–06.00 (Skor 2) • &gt;06.00 (Skor 1)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  7. Waktu Tidur Malam (Contoh bayangan: 21:00)
                </label>
                <input
                  type="time"
                  value={jamTidur}
                  onChange={(e) => setJamTidur(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ket: &le;21.00 (Skor 4) • 21.01–22.00 (Skor 3) • 22.01–23.00 (Skor 2) • 23.01–24.00 (Skor 1)
                </span>
              </div>
            </div>

            {/* Checklist & Form 7 Kebiasaan Lengkap */}
            <div className="space-y-4">
              {/* 1. Bangun Pagi (Gambar 1) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bangunPagiChecked}
                      onChange={(e) => setBangunPagiChecked(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded-md text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Sun className="w-4 h-4 text-amber-500" />
                        1. Bangun Pagi & Merapikan Tempat Tidur (Gambar 1)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Membentuk jam biologis teratur, menumbuhkan kemandirian dan kedisiplinan sejak dini.
                      </p>
                    </div>
                  </label>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg shrink-0">
                    Skor: {liveRubrik.skorBangunPagi}/4
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  Status Rubrik: <b>{liveRubrik.ketBangunPagi}</b>
                </div>
              </div>

              {/* 2. Beribadah Sesuai Agama & Kepercayaan (Gambar 2: Muslim & Non Muslim) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    2. Beribadah Sesuai Agama & Kepercayaan (Gambar 2)
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-900 rounded-lg shrink-0">
                    Skor: {liveRubrik.skorBeribadah}/4
                  </span>
                </div>

                {/* Pilihan Agama: Muslim / Non Muslim */}
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Pilih Agama Siswa:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAgama('Muslim')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        agama === 'Muslim'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      🕌 Muslim
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgama('Non Muslim')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        agama === 'Non Muslim'
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      ⛪ Non Muslim
                    </button>
                  </div>
                </div>

                {/* Sub-form Muslim: Sholat 5 Waktu & Ibadah */}
                {agama === 'Muslim' && (
                  <div className="space-y-3 pt-1 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs text-slate-600 font-semibold">
                        Pilih sholat 5 waktu & ibadah yang berhasil dilaksanakan hari ini:
                      </p>

                      {/* Tombol Opsi Sedang Berhalangan bagi Muslimah */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !sedangBerhalangan;
                          setSedangBerhalangan(nextState);
                          if (nextState) {
                            setIbadahChecklist(['Sedang Berhalangan (Uzur Syar\'i)']);
                          } else {
                            setIbadahChecklist([]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 self-start sm:self-auto cursor-pointer ${
                          sedangBerhalangan
                            ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
                        }`}
                      >
                        <span>{sedangBerhalangan ? '✓' : '🌸'}</span>
                        <span>Sedang Berhalangan (Uzur Syar'i)</span>
                      </button>
                    </div>

                    {sedangBerhalangan ? (
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>
                          <b>Status: Sedang Berhalangan / Uzur Syar'i.</b> Ananda dibebaskan dari kewajiban sholat dan rubrik penilaian otomatis bernilai <b>Sangat Baik (Skor 4/4)</b>.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Doa Bersama Keluarga', 'Tadarus / Mengaji'].map(
                            (ibadah) => {
                              const isSelected = ibadahChecklist.includes(ibadah);
                              return (
                                <button
                                  key={ibadah}
                                  type="button"
                                  onClick={() => toggleIbadah(ibadah)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-rose-500 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {isSelected ? '✓ ' : '+ '}
                                  {ibadah}
                                </button>
                              );
                            }
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 italic mt-1">
                          Kriteria Rubrik: 5 Waktu Lengkap (Skor 4) • 3-4 Waktu (Skor 3) • 1-2 Waktu (Skor 2) • Belum Sholat (Skor 1)
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Sub-form Non Muslim: Pertanyaan Singkat Isian + Dropdown Frekuensi */}
                {agama === 'Non Muslim' && (
                  <div className="space-y-3 pt-1 p-3.5 bg-rose-50/50 rounded-xl border border-rose-200 animate-in fade-in">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                      <span>✝️ Pertanyaan Khusus Ibadah Non-Muslim:</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Jenis ibadah yang dilakukan (isian singkat):
                      </label>
                      <input
                        type="text"
                        value={jenisIbadahNonMuslim}
                        onChange={(e) => setJenisIbadahNonMuslim(e.target.value)}
                        placeholder="Contoh: Kebaktian di Gereja, Doa Pagi Bersama Keluarga, Meditasi, Puja Bakti, dll."
                        className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-medium"
                        required={agama === 'Non Muslim'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Dropdown Frekuensi Ibadah Non-Muslim:
                      </label>
                      <select
                        value={frekuensiIbadahNonMuslim}
                        onChange={(e) => setFrekuensiIbadahNonMuslim(e.target.value as any)}
                        className="w-full text-xs font-bold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500"
                      >
                        <option value="">-- Pilih Frekuensi Ibadah Non-Muslim --</option>
                        <option value="Sering">Sering (Ibadah Rutin sesuai ajaran agama - Skor 4)</option>
                        <option value="Sedang">Sedang (Ibadah dilakukan, belum rutin - Skor 3)</option>
                        <option value="Jarang-jarang">Jarang-jarang (Kadang-kadang melakukan ibadah - Skor 2)</option>
                        <option value="Tidak melakukan ibadah">Tidak melakukan ibadah (Skor 1)</option>
                      </select>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-rose-100">
                      Status Evaluasi: <b>{liveRubrik.ketBeribadah}</b>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Berolahraga (Gambar 3) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={olahragaChecked}
                      onChange={(e) => setOlahragaChecked(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded-md text-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        3. Berolahraga / Aktivitas Fisik (Gambar 3)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Senam SAIH, jalan sehat, lari santai, lompat tali, atau bersepeda.
                      </p>
                    </div>
                  </label>
                  <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg shrink-0">
                    Skor: {liveRubrik.skorBerolahraga}/4
                  </span>
                </div>

                {olahragaChecked && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Pilihan Durasi Olahraga (Rubrik Gambar 3):
                      </label>
                      <select
                        value={olahragaDurasiPilihan}
                        onChange={(e) => setOlahragaDurasiPilihan(e.target.value as any)}
                        className="w-full text-xs font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                      >
                        <option value="">-- Pilih Durasi Olahraga --</option>
                        <option value="30 menit atau lebih">30 menit atau lebih (Skor 4 - Sangat Baik)</option>
                        <option value="20 - 29 menit">20 – 29 menit (Skor 3 - Baik)</option>
                        <option value="10 - 19 menit">10 – 19 menit (Skor 2 - Cukup)</option>
                        <option value="< 10 menit">&lt; 10 menit (Skor 1 - Perlu Ditingkatkan)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Jenis Aktivitas Fisik:
                      </label>
                      <input
                        type="text"
                        value={olahragaDesc}
                        onChange={(e) => setOlahragaDesc(e.target.value)}
                        placeholder="Contoh: Senam SAIH & jalan santai 30 menit"
                        className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Gemar Belajar Mandiri (Gambar 4) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    4. Gemar Belajar Mandiri & Mengulang Materi (Gambar 4)
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg shrink-0">
                    Skor: {liveRubrik.skorGemarBelajar}/4
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Durasi Belajar (Menit):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={240}
                        value={durasiBelajar}
                        onChange={(e) => setDurasiBelajar(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Contoh: 45"
                        className="w-28 text-xs font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-center"
                      />
                      <span className="text-xs text-slate-600 font-semibold">Menit</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      &gt;60 mnt (Skor 4) • 31-60 mnt (Skor 3) • 15-30 mnt (Skor 2) • &lt;15 mnt (Skor 1)
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Materi / Mata Pelajaran yang Dipelajari:
                    </label>
                    <input
                      type="text"
                      value={belajarDesc}
                      onChange={(e) => setBelajarDesc(e.target.value)}
                      placeholder="Contoh bayangan: Membaca materi IPAS Bab 2, latihan soal Matematika"
                      className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Makan Sehat dan Bergizi (Gambar 5: 3 waktu makan x 5 jenis = 15 centang) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-green-600" />
                    5. Makan Sehat dan Bergizi (Gambar 5 - Isi Piringku)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-900 rounded-lg">
                      {totalMakanCentang}/15 Centang • Skor: {liveRubrik.skorMakanSehat}/4
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Kriteria Gambar 5: 13–15 centang (Skor 4) • 10–12 centang (Skor 3) • 7–9 centang (Skor 2) • 0–6 centang (Skor 1).
                </p>

                {/* Tabel 3 Waktu Makan x 5 Komponen Makanan Sehat */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-center border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="py-2 px-3 text-left">Waktu Makan</th>
                        <th className="py-2 px-2">Makanan Pokok</th>
                        <th className="py-2 px-2">Lauk Pauk</th>
                        <th className="py-2 px-2">Sayuran</th>
                        <th className="py-2 px-2">Buah-Buahan</th>
                        <th className="py-2 px-2">Air Putih Cukup</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { key: 'pagi', label: '🌅 Sarapan Pagi' },
                        { key: 'siang', label: '☀️ Makan Siang' },
                        { key: 'malam', label: '🌙 Makan Malam' },
                      ].map((row) => (
                        <tr key={row.key} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-left font-bold text-slate-800">{row.label}</td>
                          {['pokok', 'lauk', 'sayur', 'buah', 'air'].map((item) => {
                            const cKey = `${row.key}_${item}`;
                            const isChecked = !!makanSehatCentangs[cKey];
                            return (
                              <td key={item} className="py-2 px-2">
                                <button
                                  type="button"
                                  onClick={() => toggleMakanCentangCell(cKey)}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                    isChecked
                                      ? 'bg-green-600 text-white shadow-xs'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  {isChecked ? '✓' : ''}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    Total Centang Terpilih: <b>{totalMakanCentang} dari 15</b>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAllMakanCentang(true)}
                      className="text-[11px] font-bold text-green-700 hover:underline"
                    >
                      Centang Semua (15/15)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAllMakanCentang(false)}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Bermasyarakat & Membantu Orang Tua (Gambar 6: 6 Pertanyaan Iya/Tidak) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Users2 className="w-4 h-4 text-purple-600" />
                    6. Bermasyarakat & Membantu Orang Tua (Gambar 6)
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg shrink-0">
                    {totalBermasyarakatIya}/6 IYA • Skor: {liveRubrik.skorBermasyarakat}/4
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Kriteria Gambar 6: 6 IYA (Skor 4) • 4–5 IYA (Skor 3) • 2–3 IYA (Skor 2) • 0–1 IYA (Skor 1).
                </p>

                <div className="space-y-2 pt-1">
                  {[
                    { id: 'q1', text: '1. Menyapa tetangga / teman dengan senyum dan ramah' },
                    { id: 'q2', text: '2. Membantu orang tua membersihkan atau merapikan rumah' },
                    { id: 'q3', text: '3. Membuang sampah pada tempatnya & menjaga kebersihan lingkungan' },
                    { id: 'q4', text: '4. Menjaga kerukunan dan tidak bertengkar dengan saudara/teman' },
                    { id: 'q5', text: '5. Berbagi rezeki, makanan, atau peduli sesama yang membutuhkan' },
                    { id: 'q6', text: '6. Berbicara santun dan menghormati orang yang lebih tua' },
                  ].map((q) => {
                    const ans = bermasyarakatAnswers[q.id];
                    return (
                      <div
                        key={q.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-semibold text-slate-800">{q.text}</span>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          {!ans && (
                            <span className="text-[10px] text-amber-600 italic font-medium mr-1">
                              Belum dipilih
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setBermasyarakatAnswers((prev) => ({ ...prev, [q.id]: 'Iya' }))
                            }
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                              ans === 'Iya'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                            }`}
                          >
                            Iya ✓
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setBermasyarakatAnswers((prev) => ({ ...prev, [q.id]: 'Tidak' }))
                            }
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                              ans === 'Tidak'
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                            }`}
                          >
                            Tidak
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7. Tidur Cepat (Sebelum Pukul 21.00 s/d 24.00) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tidurTepatWaktuChecked}
                      onChange={(e) => setTidurTepatWaktuChecked(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded-md text-indigo-600"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-indigo-600" />
                        7. Tidur Cepat (Pukul 21.00 Skor 4 s/d 24.00 Skor 1)
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Waktu istirahat 9–10 jam untuk fungsi otak dan pemulihan stamina tubuh ananda.
                      </p>
                    </div>
                  </label>
                  <span className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-900 rounded-lg shrink-0">
                    Skor: {liveRubrik.skorTidurCepat}/4
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                  Status Rubrik: <b>{liveRubrik.ketTidurCepat}</b> (Jam Tidur Tercatat: {jamTidur} WIB)
                </div>
              </div>

              {/* Catatan & Paraf Orang Tua */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900 uppercase">
                    Pendampingan Orang Tua / Wali Murid
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Refleksi Diri Murid Hari Ini:
                  </label>
                  <textarea
                    rows={2}
                    value={refleksiMurid}
                    onChange={(e) => setRefleksiMurid(e.target.value)}
                    placeholder="Contoh bayangan: Saya bersemangat melaksanakan 7 kebiasaan anak hebat dan bersyukur hari ini..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 mb-3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Refleksi / Komentar Orang Tua:
                  </label>
                  <textarea
                    rows={2}
                    value={catatanOrangTua}
                    onChange={(e) => setCatatanOrangTua(e.target.value)}
                    placeholder="Contoh bayangan: Ananda melaksanakannya dengan tertib, mandiri, dan gembira di rumah..."
                    className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={parafOrangTua}
                    onChange={(e) => setParafOrangTua(e.target.checked)}
                    className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-400"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Saya selaku Orang Tua/Wali ({currentMurid.namaOrangTua}) menyatakan data pembiasaan di atas benar dan memberikan paraf.
                  </span>
                </label>
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">
                Predikat Harian: <b className="text-blue-900">{liveRubrik.predikat}</b> (Rata-rata {liveRubrik.skorRataRata}/4.0)
              </span>

              <button
                type="submit"
                disabled={isSavingKaih}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.01] disabled:opacity-60 cursor-pointer"
              >
                {isSavingKaih ? (
                  <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-amber-300" />
                )}
                <span>{isSavingKaih ? 'Menyimpan...' : 'Simpan & Lanjut ke Formulir Catatan Harian'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2) TAB: FORMULIR CATATAN HARIAN (LAMPIRAN 1 & 2 KEMENDIKDASMEN) */}
      {/* ========================================================================= */}
      {activeTab === 'catatan_harian' && (
        <FormulirCatatanHarian
          murid={currentMurid}
          jurnalList={jurnal7KaihList}
          onUpdateDayStatus={handleUpdateDayStatus}
          onSwitchToRefleksi={() => setActiveTab('refleksi_ortu')}
        />
      )}

      {/* ========================================================================= */}
      {/* 3) TAB: LEMBAR REFLEKSI ORANG TUA (LAMPIRAN 3 - OTOMATIS DARI REKAP SEBULAN) */}
      {/* ========================================================================= */}
      {activeTab === 'refleksi_ortu' && (
        <LembarRefleksiOrtu
          murid={currentMurid}
          jurnalList={jurnal7KaihList}
        />
      )}

      {/* ========================================================================= */}
      {/* 4) TAB: ISI JURNAL MEMBACA */}
      {/* ========================================================================= */}
      {activeTab === 'membaca' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Form Jurnal Literasi Membaca</h3>
                <p className="text-xs text-slate-500">
                  Gerakan Literasi Sekolah SDN Kapuk 06 Pagi: Baca minimal 15-20 menit per hari.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleMembacaSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Membaca</label>
                <input
                  type="date"
                  value={bacaTanggal}
                  onChange={(e) => setBacaTanggal(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Buku</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cerita Rakyat">Cerita Rakyat Nusantara</option>
                  <option value="Fiksi / Dongeng">Fiksi / Dongeng Anak</option>
                  <option value="Ensiklopedia / IPTEK">Ensiklopedia / IPTEK</option>
                  <option value="Buku Pelajaran">Buku Pelajaran Sekolah</option>
                  <option value="Biografi / Pahlawan">Biografi / Tokoh Pahlawan</option>
                  <option value="Komik Edukasi">Komik Edukasi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Durasi Membaca (Menit)
                </label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={durasiMembaca}
                  onChange={(e) => setDurasiMembaca(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-3 py-2 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Buku *</label>
                <input
                  type="text"
                  value={judulBuku}
                  onChange={(e) => setJudulBuku(e.target.value)}
                  placeholder="Contoh: Malin Kundang / Petualangan Ruang Angkasa"
                  className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pengarang / Penulis</label>
                <input
                  type="text"
                  value={penulis}
                  onChange={(e) => setPenulis(e.target.value)}
                  placeholder="Nama pengarang buku"
                  className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penerbit (Opsional)</label>
                <input
                  type="text"
                  value={penerbit}
                  onChange={(e) => setPenerbit(e.target.value)}
                  placeholder="Nama penerbit"
                  className="w-full text-xs px-3.5 py-2 bg-white rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Halaman Awal</label>
                <input
                  type="number"
                  min={1}
                  value={halamanAwal}
                  onChange={(e) => setHalamanAwal(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Halaman Akhir</label>
                <input
                  type="number"
                  min={1}
                  value={halamanAkhir}
                  onChange={(e) => setHalamanAkhir(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-center font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ringkasan Cerita & Pesan Moral / Hikmah yang Didapat *
              </label>
              <textarea
                rows={4}
                value={ringkasan}
                onChange={(e) => setRingkasan(e.target.value)}
                placeholder="Ceritakan dengan bahasamu sendiri apa isi buku yang kamu baca dan apa pesan kebaikan yang kamu petik..."
                className="w-full text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-normal leading-relaxed"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.01]"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                Kirim Jurnal Membaca ke Guru
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5) TAB: PANDUAN 7 KAIH & LENCANA */}
      {/* ========================================================================= */}
      {activeTab === 'beranda' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Jurnal 7 KAIH Terisi</span>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">{student7Kaih.length}</span>
                <span className="text-xs text-slate-400 ml-1.5">Hari</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                ✓ {verifiedKaihCount} Telah diverifikasi guru
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Literasi Membaca</span>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">{totalBukuDibaca}</span>
                <span className="text-xs text-slate-400 ml-1.5">Buku</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                📖 Total {totalHalamanDibaca} Halaman
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Kategori Kepatuhan</span>
              <div className="mt-3">
                <span className="text-xl font-black text-emerald-600">
                  {student7Kaih.length >= 21 ? 'Sudah Terbiasa' : 'Dalam Proses'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standar Kemendikdasmen: &ge; 21 hari/bln</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Apresiasi Karakter</span>
              <div className="mt-3">
                <span className="text-xl font-black text-amber-500 flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> Pelajar Hebat
                </span>
              </div>
              <p className="text-[11px] text-blue-600 font-medium mt-1">Generasi Emas 2045</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Panduan Resmi Gerakan Tujuh Kebiasaan Anak Indonesia Hebat (GiatTKAIH)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Kementerian Pendidikan Dasar dan Menengah Republik Indonesia (2025)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {[
                { no: 1, title: 'Bangun Pagi', desc: 'Pukul 04.30 - 05.00 (Gambar 1), membentuk jam biologis & disiplin.', icon: Sun, color: 'text-amber-500 bg-amber-50' },
                { no: 2, title: 'Beribadah', desc: 'Taat sholat & doa (Gambar 2), memperkuat nilai spiritual dan moral.', icon: Heart, color: 'text-rose-500 bg-rose-50' },
                { no: 3, title: 'Berolahraga', desc: 'Aktivitas fisik >= 30 mnt (Gambar 3), kebugaran raga dan jiwa.', icon: Activity, color: 'text-emerald-500 bg-emerald-50' },
                { no: 4, title: 'Gemar Belajar', desc: 'Belajar mandiri > 60 mnt (Gambar 4), mengulang materi pelajaran.', icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
                { no: 5, title: 'Makan Sehat', desc: 'Isi Piringku 13-15 centang (Gambar 5), gizi seimbang & air cukup.', icon: Apple, color: 'text-green-600 bg-green-50' },
                { no: 6, title: 'Bermasyarakat', desc: '6 sikap kepedulian (Gambar 6), gotong royong dan santun.', icon: Users2, color: 'text-purple-600 bg-purple-50' },
                { no: 7, title: 'Tidur Cepat', desc: 'Jam 21.00 (Skor 4) s/d 24.00 (Skor 1), istirahat berkualitas 9-10 jam.', icon: Moon, color: 'text-indigo-600 bg-indigo-50' },
              ].map((h) => {
                const IconComponent = h.icon;
                return (
                  <div
                    key={h.no}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 flex flex-col items-center text-center"
                  >
                    <div className={`p-3 rounded-2xl ${h.color} mb-2.5`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Kebiasaan #{h.no}</span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">{h.title}</h4>
                    <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">{h.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6) TAB: RIWAYAT & ULASAN VERIFIKASI GURU (DENGAN RUBRIK SKOR OTOMATIS) */}
      {/* ========================================================================= */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">
              Riwayat Jurnal Murid & Verifikasi Guru
            </h3>
            <span className="text-xs text-slate-500">
              Menampilkan entri milik {currentMurid.nama}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daftar Jurnal 7 KAIH */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-sm text-slate-900">Riwayat Jurnal 7 KAIH</h4>
                </div>
                <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">
                  {student7Kaih.length} Catatan
                </span>
              </div>

              {student7Kaih.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Belum ada jurnal 7 KAIH yang diisi.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {student7Kaih.map((j) => {
                    const rubrik = calculateRubrik7KAIH(j);
                    return (
                      <div
                        key={j.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          j.status === 'verified'
                            ? 'border-emerald-200 bg-emerald-50/30'
                            : 'border-amber-200 bg-amber-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-800 font-mono">
                            📅 {j.tanggal}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                              Rubrik: {j.skorRataRata || rubrik.skorRataRata}/4.0 ({j.predikatOtomatis || rubrik.predikat})
                            </span>
                            {j.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" /> Diverifikasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Menunggu
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Breakdown 7 Rubrik */}
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-[10px] my-2 p-2 bg-white rounded-xl border border-slate-100 text-center">
                          <div>
                            <span className="text-slate-400 block">Bangun</span>
                            <span className="font-bold text-amber-700">{j.skorBangunPagi || rubrik.skorBangunPagi}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Ibadah</span>
                            <span className="font-bold text-rose-700">{j.skorBeribadah || rubrik.skorBeribadah}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Olahraga</span>
                            <span className="font-bold text-emerald-700">{j.skorBerolahraga || rubrik.skorBerolahraga}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Belajar</span>
                            <span className="font-bold text-blue-700">{j.skorGemarBelajar || rubrik.skorGemarBelajar}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Makan</span>
                            <span className="font-bold text-green-700">{j.skorMakanSehat || rubrik.skorMakanSehat}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Masy.</span>
                            <span className="font-bold text-purple-700">{j.skorBermasyarakat || rubrik.skorBermasyarakat}/4</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Tidur</span>
                            <span className="font-bold text-indigo-700">{j.skorTidurCepat || rubrik.skorTidurCepat}/4</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 mb-2">
                          <p>
                            ⏰ Bangun: <span className="font-semibold">{j.jamBangun}</span> | Tidur:{' '}
                            <span className="font-semibold">{j.jamTidur}</span>
                          </p>
                          <p>
                            🕌 Ibadah ({j.agama || 'Muslim'}):{' '}
                            <span className="font-semibold">
                              {j.agama === 'Non Muslim'
                                ? `${j.jenisIbadahNonMuslim || '-'} (${j.frekuensiIbadahNonMuslim || 'Sering'})`
                                : (j.ibadahChecklist || []).join(', ')}
                            </span>
                          </p>
                        </div>

                        {j.status === 'verified' && (
                          <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-xs shadow-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-emerald-900 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                Penilaian Guru: {j.rating ? '⭐'.repeat(j.rating) : '⭐⭐⭐⭐⭐'}
                              </span>
                              <span className="text-[10px] text-slate-400">{j.verifiedAt}</span>
                            </div>
                            <p className="text-slate-700 italic">"{j.feedbackGuru}"</p>
                            <span className="text-[10px] text-slate-500 font-medium block mt-1">
                              Dinilai oleh: {j.verifiedBy}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daftar Jurnal Membaca */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-sm text-slate-900">Riwayat Jurnal Membaca</h4>
                </div>
                <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                  {studentMembaca.length} Buku
                </span>
              </div>

              {studentMembaca.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Belum ada jurnal membaca yang dicatat.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentMembaca.map((b) => (
                    <div
                      key={b.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        b.status === 'verified'
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-blue-200 bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          📅 {b.tanggal}
                        </span>
                        {b.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Diverifikasi Guru
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Menunggu Verifikasi
                          </span>
                        )}
                      </div>

                      <h5 className="font-bold text-sm text-slate-900">{b.judulBuku}</h5>
                      <p className="text-[11px] text-slate-500 mb-2">
                        {b.penulis ? `Karya ${b.penulis} • ` : ''}Hal {b.halamanAwal}-{b.halamanAkhir} (
                        {b.durasiMenit} menit) • {b.kategori}
                      </p>

                      <div className="p-2.5 bg-slate-50/80 rounded-xl text-xs text-slate-700 leading-relaxed">
                        <p className="line-clamp-3">{b.ringkasan}</p>
                      </div>

                      {b.status === 'verified' && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-xs shadow-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-emerald-900 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              Penilaian Guru: {b.rating ? '⭐'.repeat(b.rating) : '⭐⭐⭐⭐⭐'}
                            </span>
                            <span className="text-[10px] text-slate-400">{b.verifiedAt}</span>
                          </div>
                          <p className="text-slate-700 italic">"{b.feedbackGuru}"</p>
                          <span className="text-[10px] text-slate-500 font-medium block mt-1">
                            Dinilai oleh: {b.verifiedBy}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TABEL PANDUAN STANDAR RUBRIK 7 KAIH (GAMBAR 1 - 6 + TIDUR CEPAT) */}
      {/* ========================================================================= */}
      {isRubrikGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Standar Resmi Rubrik Penilaian 7 KAIH
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kementerian Pendidikan Dasar dan Menengah • Gambar 1 s.d. Gambar 6 + Tidur Cepat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRubrikGuideModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {RUBRIK_GUIDELINES.map((item) => (
                <div
                  key={item.no}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">
                      #{item.no} {item.kebiasaan}
                    </span>
                    <span className="bg-blue-100 text-blue-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                      {item.gambarRef}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="font-black text-emerald-800 block">Skor 4 (Sangat Baik)</span>
                      <p className="text-emerald-950 mt-0.5">{item.kriteria.skor4}</p>
                    </div>
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl">
                      <span className="font-black text-blue-800 block">Skor 3 (Baik)</span>
                      <p className="text-blue-950 mt-0.5">{item.kriteria.skor3}</p>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="font-black text-amber-800 block">Skor 2 (Cukup)</span>
                      <p className="text-amber-950 mt-0.5">{item.kriteria.skor2}</p>
                    </div>
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
                      <span className="font-black text-rose-800 block">Skor 1 (Kurang)</span>
                      <p className="text-rose-950 mt-0.5">{item.kriteria.skor1}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRubrikGuideModalOpen(false)}
                className="px-5 py-2 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-800"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIHAT POSTER RESMI 7 KAIH */}
      {isPosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20">
                  <img
                    src={logoUrl}
                    alt="Logo SDN Kapuk 06 Pagi"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold leading-tight">
                    Poster Resmi 7 Karakter Anak Indonesia Hebat
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    SDN Kapuk 06 Pagi • Panduan Pembiasaan Karakter Unggul
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

            {/* Konten Gambar Poster */}
            <div className="p-4 bg-slate-100 flex items-center justify-center overflow-auto max-h-[72vh]">
              <img
                src={posterUrl}
                alt="Poster 7 KAIH SDN Kapuk 06 Pagi"
                className="max-h-[68vh] w-auto object-contain rounded-2xl shadow-lg border border-slate-300"
              />
            </div>

            {/* Footer Modal */}
            <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 font-medium">
                7 Pembiasaan: Bangun Pagi, Beribadah, Olahraga, Makan Sehat, Gemar Belajar, Bermasyarakat, Tidur Cepat.
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={posterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Resolusi Penuh</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsPosterModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROGRES MENYIMPAN 7 KAIH & PERALIHAN KE FORMULIR CATATAN HARIAN */}
      {isSavingKaih && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-blue-950 flex items-center justify-center shadow-inner">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Menyimpan Jurnal 7 KAIH
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {saveStatusText || 'Sedang memproses penyimpanan data...'}
              </p>
            </div>

            {/* Indikator Progres Bar Animasi */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${saveProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 px-1">
                <span>Progres: {saveProgress}%</span>
                <span>Waktu Indonesia Barat (WIB)</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-[11px] text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Setelah proses menyimpan selesai, halaman akan otomatis dialihkan ke <b>Formulir Catatan Harian</b>.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
