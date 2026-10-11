import React, { useState, useEffect, useRef } from 'react';
import { SchoolSettings, Murid, Guru, Jurnal7KAIH, DAFTAR_KELAS } from '../../types';
import {
  Printer,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { KopSurat } from '../KopSurat';
import {
  downloadElementAsPdf,
  downloadPrintableHtml,
  safePrintElement,
} from '../../services/printAndDownloadService';
import { normalizeDateStringToWIB } from '../../utils/dateUtils';

interface Rekapitulasi7KAIHGuruProps {
  settings: SchoolSettings;
  currentGuru: Guru;
  muridList: Murid[];
  jurnal7KaihList: Jurnal7KAIH[];
  selectedClass?: string;
  onClassChange?: (cls: string) => void;
}

export const Rekapitulasi7KAIHGuru: React.FC<Rekapitulasi7KAIHGuruProps> = ({
  settings,
  currentGuru,
  muridList,
  jurnal7KaihList,
  selectedClass = 'Kelas 1A',
  onClassChange,
}) => {
  const [activeClass, setActiveClass] = useState<string>(selectedClass);
  const [selectedBulan, setSelectedBulan] = useState<string>('Oktober 2026');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(9); // Oktober = 9
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Mode Tampilan: Lampiran SD (Kelas 1 - 4) vs Lampiran SD (Kelas 5 - 6)
  const isInitiallyAtas = selectedClass.includes('5') || selectedClass.includes('6');
  const [lampiranMode, setLampiranMode] = useState<'sd_1_4' | 'sd_5_6'>(
    isInitiallyAtas ? 'sd_5_6' : 'sd_1_4'
  );

  useEffect(() => {
    setActiveClass(selectedClass);
    if (selectedClass.includes('5') || selectedClass.includes('6')) {
      setLampiranMode('sd_5_6');
    } else if (
      selectedClass.includes('1') ||
      selectedClass.includes('2') ||
      selectedClass.includes('3') ||
      selectedClass.includes('4')
    ) {
      setLampiranMode('sd_1_4');
    }
  }, [selectedClass]);

  const handleClassSelect = (cls: string) => {
    setActiveClass(cls);
    if (cls.includes('5') || cls.includes('6')) {
      setLampiranMode('sd_5_6');
    } else if (cls.includes('1') || cls.includes('2') || cls.includes('3') || cls.includes('4')) {
      setLampiranMode('sd_1_4');
    }
    if (onClassChange) onClassChange(cls);
  };

  const classStudents = muridList.filter((m) =>
    activeClass === 'Semua Kelas' ? true : m.kelas === activeClass
  );

  // Hitung jumlah hari kebiasaan per murid dalam bulan ini (murni dari data nyata murid, tanpa fallback palsu)
  const calculateHabitDays = (studentId: string, habitKey: string): number => {
    const formattedMonth = selectedMonthIndex + 1 < 10 ? `0${selectedMonthIndex + 1}` : `${selectedMonthIndex + 1}`;
    const monthPrefix = `${selectedYear}-${formattedMonth}`;

    const studentMonthJournals = jurnal7KaihList.filter((j) => {
      if (j.muridId !== studentId) return false;
      const tglWib = normalizeDateStringToWIB(j.tanggal);
      return tglWib.startsWith(monthPrefix);
    });

    // Jika murid belum mengisi jurnal pada bulan ini, kembalikan 0 (tidak ada angka bayangan/palsu)
    if (studentMonthJournals.length === 0) {
      return 0;
    }

    return studentMonthJournals.filter((j) => {
      switch (habitKey) {
        case 'bangunPagi':
          return j.bangunPagiChecked;
        case 'beribadah':
          return (j.ibadahChecklist?.length || 0) >= 1 || !!j.sedangBerhalangan;
        case 'berolahraga':
          return j.olahragaChecked;
        case 'makanSehat':
          return j.makanSehatChecked;
        case 'gemarBelajar':
          return j.belajarChecked;
        case 'bermasyarakat':
          return j.bantuOrangTuaChecked;
        case 'tidurCepat':
          return j.tidurTepatWaktuChecked;
        default:
          return false;
      }
    }).length;
  };

  // Export to CSV matching Lampiran Terpilih
  const handleExportCsv = () => {
    const lampiranLabel = lampiranMode === 'sd_1_4' ? 'Lampiran_SD_Kelas_1-4' : 'Lampiran_SD_Kelas_5-6';
    const headers = [
      'No',
      'Nama',
      'P/L',
      'Bangun Pagi',
      'Taat Beribadah',
      'Berolahraga',
      'Makan Sehat dan Bergizi',
      'Gemar Belajar',
      'Aktif Bermasyarakat',
      'Tidur Cepat',
      'Rata-rata Hari',
      'Catatan (Kategori)',
      'Format Lampiran',
    ];

    const rows = classStudents.map((s, idx) => {
      const bPagi = calculateHabitDays(s.id, 'bangunPagi');
      const ibadah = calculateHabitDays(s.id, 'beribadah');
      const olahraga = calculateHabitDays(s.id, 'berolahraga');
      const makan = calculateHabitDays(s.id, 'makanSehat');
      const belajar = calculateHabitDays(s.id, 'gemarBelajar');
      const masy = calculateHabitDays(s.id, 'bermasyarakat');
      const tidur = calculateHabitDays(s.id, 'tidurCepat');
      const avg = Math.round((bPagi + ibadah + olahraga + makan + belajar + masy + tidur) / 7);
      const catatan = avg >= 21 ? 'Sudah Terbiasa' : 'Belum Terbiasa';

      return [
        idx + 1,
        `"${s.nama}"`,
        s.jenisKelamin,
        bPagi,
        ibadah,
        olahraga,
        makan,
        belajar,
        masy,
        tidur,
        avg,
        `"${catatan}"`,
        `"${lampiranMode === 'sd_1_4' ? 'Lampiran SD (Kelas 1 - 4)' : 'Lampiran SD (Kelas 5 - 6)'}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${lampiranLabel}_REKAP_${activeClass}_${selectedBulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (No Print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* TOGGLE TAMPILAN LAMPIRAN KELAS 1-4 DAN KELAS 5-6 */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLampiranMode('sd_1_4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                lampiranMode === 'sd_1_4'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
              <span>Lampiran SD (Kelas 1 - 4)</span>
            </button>
            <button
              type="button"
              onClick={() => setLampiranMode('sd_5_6')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                lampiranMode === 'sd_5_6'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>Lampiran SD (Kelas 5 - 6)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Rombel / Kelas:</span>
            {onClassChange ? (
              <select
                value={activeClass}
                onChange={(e) => handleClassSelect(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {DAFTAR_KELAS.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-black px-3 py-1 bg-amber-100 text-blue-950 rounded-xl border border-amber-300">
                {activeClass} (Khusus Wali Kelas)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Bulan:</span>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
            >
              <option value="Oktober 2026">Oktober 2026</option>
              <option value="November 2026">November 2026</option>
              <option value="Desember 2026">Desember 2026</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {/* Unduh PDF Landscape A4 */}
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={async () => {
              if (!printRef.current) return;
              setIsGeneratingPdf(true);
              const lampiranLabel = lampiranMode === 'sd_1_4' ? 'SD_Kelas_1-4' : 'SD_Kelas_5-6';
              const filename = `Rekapitulasi_7KAIH_${lampiranLabel}_${activeClass.replace(/\s+/g, '_')}_${selectedBulan.replace(/\s+/g, '_')}`;
              const res = await downloadElementAsPdf(printRef.current, filename, {
                orientation: 'landscape',
                title: `Rekapitulasi 7 KAIH (${lampiranMode === 'sd_1_4' ? 'Kelas 1-4' : 'Kelas 5-6'}) - ${activeClass} (${selectedBulan})`,
              });
              setIsGeneratingPdf(false);
              setToastMsg(res.message);
              setTimeout(() => setToastMsg(null), 4000);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            title="Unduh langsung berkas PDF Rekapitulasi Format Landscape A4"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-emerald-200" />
            )}
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF (Landscape A4)'}</span>
          </button>

          {/* Unduh Berkas HTML Siap Cetak */}
          <button
            type="button"
            onClick={() => {
              if (!printRef.current) return;
              const lampiranLabel = lampiranMode === 'sd_1_4' ? 'SD_Kelas_1-4' : 'SD_Kelas_5-6';
              const filename = `Rekapitulasi_7KAIH_${lampiranLabel}_${activeClass.replace(/\s+/g, '_')}_${selectedBulan.replace(/\s+/g, '_')}`;
              downloadPrintableHtml(
                printRef.current,
                `Rekapitulasi 7 KAIH (${lampiranMode === 'sd_1_4' ? 'Kelas 1-4' : 'Kelas 5-6'}) - ${activeClass} (${selectedBulan})`,
                filename
              );
              setToastMsg('Berkas HTML Siap Cetak berhasil diunduh!');
              setTimeout(() => setToastMsg(null), 3000);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Unduh berkas siap cetak mandiri untuk dibuka di browser apa pun"
          >
            <FileText className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden sm:inline">Unduh Berkas HTML</span>
          </button>

          {/* Cetak Langsung */}
          <button
            type="button"
            onClick={() => {
              if (printRef.current) {
                safePrintElement(
                  printRef.current,
                  `Rekapitulasi 7 KAIH (${lampiranMode === 'sd_1_4' ? 'Kelas 1-4' : 'Kelas 5-6'}) - ${activeClass} (${selectedBulan})`
                );
              } else {
                window.print();
              }
            }}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Cetak format Lampiran Resmi"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* DOKUMEN CETAK PERSIS SEPERTI LAMPIRAN SD KEMENDIKDASMEN */}
      <div ref={printRef} className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-lg print-container max-w-[297mm] mx-auto text-black">
        {/* Banner Identifikasi Mode Lampiran */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-blue-950 text-amber-300 rounded-md font-mono">
            {lampiranMode === 'sd_1_4' ? 'Lampiran SD (Kelas 1 - 4)' : 'Lampiran SD (Kelas 5 - 6)'}
          </span>
          <span className="text-[10px] text-slate-500 italic">
            {lampiranMode === 'sd_1_4'
              ? 'Contoh Formulir Pemantauan 7 KAIH Guru SD (Kelas 1 - 4) Bulanan'
              : 'Contoh Formulir Pemantauan 7 KAIH Guru SD (Kelas 5 - 6) Bulanan'}
          </span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wide font-sans text-slate-900">
            Pemantauan Tujuh Kebiasaan Anak Indonesia Hebat (7 KAIH)
          </h2>
          <p className="text-[11px] text-blue-950 font-bold mt-0.5">
            {lampiranMode === 'sd_1_4'
              ? 'Rekapitulasi Penerapan Karakter Bulanan SD (Kelas 1 - 4) • Fase Fondasi & Pembiasaan Awal'
              : 'Rekapitulasi Penerapan Karakter Bulanan SD (Kelas 5 - 6) • Fase Lanjutan & Kemandirian Siswa'}
          </p>
        </div>

        {/* Tabel Identitas Satuan Pendidikan */}
        <div className="mb-4 text-[11px] border border-black p-3 bg-slate-50/50 rounded-xs">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-44 font-semibold py-0.5">Nama Satuan Pendidikan</td>
                <td className="w-3">:</td>
                <td className="font-bold">{settings.namaSekolah || 'SDN KAPUK 06 PAGI'}</td>
              </tr>
              <tr>
                <td className="font-semibold py-0.5">NPSN</td>
                <td>:</td>
                <td className="font-mono">{settings.npsn || '20105291'}</td>
              </tr>
              <tr>
                <td className="font-semibold py-0.5">Provinsi</td>
                <td>:</td>
                <td>{settings.provinsi || 'DKI Jakarta'}</td>
              </tr>
              <tr>
                <td className="font-semibold py-0.5">Kota/Kabupaten, Provinsi</td>
                <td>:</td>
                <td>{settings.kota || 'Kota Jakarta Barat'}, {settings.provinsi || 'DKI Jakarta'}</td>
              </tr>
              <tr>
                <td className="font-semibold py-0.5">Kelas / Rombel</td>
                <td>:</td>
                <td className="font-bold">{activeClass}</td>
              </tr>
              <tr>
                <td className="font-semibold py-0.5">Bulan Pelaporan</td>
                <td>:</td>
                <td className="font-bold text-blue-900">{selectedBulan}</td>
              </tr>
              <tr>
                <td className="font-semibold py-0.5">Format Acuan Kemendikdasmen</td>
                <td>:</td>
                <td className="font-bold text-slate-800">
                  {lampiranMode === 'sd_1_4'
                    ? 'Lampiran SD (Kelas 1 - 4): Fokus Pembiasaan & Pendampingan Orang Tua'
                    : 'Lampiran SD (Kelas 5 - 6): Fokus Kemandirian, Tanggung Jawab & Disiplin Ibadah'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TABEL PEMANTAUAN 7 KAIH (PERSIS FORMAT LAMPIRAN 4) */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-[10px] border-collapse border border-black text-center">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="border border-black p-1.5 w-8" rowSpan={2}>
                  No
                </th>
                <th className="border border-black p-1.5 text-left min-w-[140px]" rowSpan={2}>
                  Nama
                </th>
                <th className="border border-black p-1.5 w-10" rowSpan={2}>
                  P/L
                </th>
                <th className="border border-black p-1.5 text-center" colSpan={7}>
                  <div className="uppercase">PEMBIASAAN</div>
                  <div className="text-[8.5px] font-normal italic text-slate-700">
                    Isian berupa angka dari jumlah ceklis melakukan kegiatan (1 s.d. 31)
                  </div>
                </th>
                <th className="border border-black p-1.5 w-28 text-center" rowSpan={2}>
                  Catatan
                  <div className="text-[8.5px] font-normal italic text-slate-700">(Sudah/Belum Terbiasa)</div>
                </th>
              </tr>
              <tr className="bg-slate-100 font-bold text-[9px]">
                <th className="border border-black p-1.5 w-16">
                  <div>Bangun Pagi</div>
                  <div className="text-[7.5px] font-normal text-slate-600">
                    {lampiranMode === 'sd_1_4' ? 's.d. 05.30 WIB' : 'Subuh mandiri'}
                  </div>
                </th>
                <th className="border border-black p-1.5 w-16">
                  <div>Taat Beribadah</div>
                  <div className="text-[7.5px] font-normal text-slate-600">
                    {lampiranMode === 'sd_1_4' ? 'Bimbingan ortu' : '5 waktu tertib'}
                  </div>
                </th>
                <th className="border border-black p-1.5 w-16">
                  <div>Berolahraga</div>
                  <div className="text-[7.5px] font-normal text-slate-600">
                    {lampiranMode === 'sd_1_4' ? 'Senam SAIH' : 'Rutin ≥30 mnt'}
                  </div>
                </th>
                <th className="border border-black p-1.5 w-20">
                  <div>Makan Sehat & Bergizi</div>
                  <div className="text-[7.5px] font-normal text-slate-600">
                    {lampiranMode === 'sd_1_4' ? 'Sarapan & buah' : 'Gizi seimbang'}
                  </div>
                </th>
                <th className="border border-black p-1.5 w-16">
                  <div>Gemar Belajar</div>
                  <div className="text-[7.5px] font-normal text-slate-600">
                    {lampiranMode === 'sd_1_4' ? '15-30 menit' : '≥45 menit'}
                  </div>
                </th>
                <th className="border border-black p-1.5 w-20">
                  <div>Aktif Bermasyarakat</div>
                  <div className="text-[7.5px] font-normal text-slate-600">
                    {lampiranMode === 'sd_1_4' ? 'Bantu di rumah' : 'Gotong royong'}
                  </div>
                </th>
                <th className="border border-black p-1.5 w-16">
                  <div>Tidur Cepat</div>
                  <div className="text-[7.5px] font-normal text-slate-600">
                    {lampiranMode === 'sd_1_4' ? '< 21.00 WIB' : '< 21.30 WIB'}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student, idx) => {
                const bPagi = calculateHabitDays(student.id, 'bangunPagi');
                const ibadah = calculateHabitDays(student.id, 'beribadah');
                const olahraga = calculateHabitDays(student.id, 'berolahraga');
                const makan = calculateHabitDays(student.id, 'makanSehat');
                const belajar = calculateHabitDays(student.id, 'gemarBelajar');
                const masy = calculateHabitDays(student.id, 'bermasyarakat');
                const tidur = calculateHabitDays(student.id, 'tidurCepat');

                const totalDays = 31;
                const minThreshold = Math.ceil((2 / 3) * totalDays); // 21 days
                const avgDays = Math.round((bPagi + ibadah + olahraga + makan + belajar + masy + tidur) / 7);
                const isTerbiasa = avgDays >= minThreshold;

                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="border border-black p-1 font-mono">{idx + 1}</td>
                    <td className="border border-black p-1 text-left font-bold text-slate-900">
                      {student.nama}
                    </td>
                    <td className="border border-black p-1 font-mono font-bold">{student.jenisKelamin}</td>
                    <td className="border border-black p-1 font-mono">{bPagi}</td>
                    <td className="border border-black p-1 font-mono">{ibadah}</td>
                    <td className="border border-black p-1 font-mono">{olahraga}</td>
                    <td className="border border-black p-1 font-mono">{makan}</td>
                    <td className="border border-black p-1 font-mono">{belajar}</td>
                    <td className="border border-black p-1 font-mono">{masy}</td>
                    <td className="border border-black p-1 font-mono">{tidur}</td>
                    <td className="border border-black p-1 font-semibold text-[9.5px]">
                      {isTerbiasa ? (
                        <span className="text-emerald-700 font-bold">Sudah Terbiasa</span>
                      ) : (
                        <span className="text-amber-700">Belum Terbiasa</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Catatan Kaki Panduan Resmi Berdasarkan Mode Lampiran SD */}
        <div className="text-[9.5px] text-slate-600 mt-2 space-y-0.5">
          <p>
            <b>Catatan Pemantauan {lampiranMode === 'sd_1_4' ? 'Lampiran SD (Kelas 1 - 4)' : 'Lampiran SD (Kelas 5 - 6)'}:</b>
          </p>
          <p>1. Pengisian tabel dengan memberikan kisaran 1 s.d. 31 sesuai jumlah hari dalam bulan murni berdasarkan jurnal harian nyata murid.</p>
          <p>
            2. Kategori <b>Sudah Terbiasa</b> diberikan ketika anak menerapkan kebiasaan minimal 2/3 dari total hari dalam sebulan (&ge; 21 hari).
          </p>
          <p>
            3. {lampiranMode === 'sd_1_4'
              ? 'Fase Fondasi & Kelas Awal (Kelas 1-4) berfokus pada pendampingan orang tua di rumah dan pembiasaan dasar yang menyenangkan.'
              : 'Fase Lanjutan (Kelas 5-6) berfokus pada kemandirian penuh tanpa diingatkan, disiplin ibadah 5 waktu, dan kepedulian sosial lingkungan.'}
          </p>
        </div>

        {/* Tanda Tangan Resmi Lampiran 4 */}
        <div className="grid grid-cols-2 gap-8 text-[11px] mt-10 avoid-break">
          <div className="text-center">
            <p className="text-slate-700">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala Sekolah</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan & Cap Sekolah)</span>
            </div>
            <p className="font-bold underline text-slate-900">{settings.kepalaSekolah || 'Emirita Br. Ginting, S.Ag'}</p>
            <p className="text-[10px] text-slate-600">NIP. {settings.nipKepalaSekolah || '197104212003122001'}</p>
          </div>

          <div className="text-center">
            <p className="text-slate-700">Jakarta Barat, akhir {selectedBulan}</p>
            <p className="font-bold text-slate-900">Guru wali kelas / Observer</p>
            <div className="h-16 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan Guru)</span>
            </div>
            <p className="font-bold underline text-slate-900">{currentGuru.nama}</p>
            <p className="text-[10px] text-slate-600">NIP. {currentGuru.nip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
