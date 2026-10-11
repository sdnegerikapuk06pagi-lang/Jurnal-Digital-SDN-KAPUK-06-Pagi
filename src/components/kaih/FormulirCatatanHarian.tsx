import React, { useState, useRef } from 'react';
import { Murid, Jurnal7KAIH } from '../../types';
import {
  Printer,
  Calendar,
  Sun,
  Heart,
  Activity,
  Apple,
  BookOpen,
  Users2,
  Moon,
  Check,
  X,
  Download,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  downloadElementAsPdf,
  downloadPrintableHtml,
  safePrintElement,
} from '../../services/printAndDownloadService';
import { normalizeDateStringToWIB } from '../../utils/dateUtils';

interface FormulirCatatanHarianProps {
  murid: Murid;
  jurnalList: Jurnal7KAIH[];
  onUpdateDayStatus?: (dateStr: string, habitKey: string, value: boolean) => void;
  onSwitchToRefleksi?: () => void;
  readOnly?: boolean;
}

export const FormulirCatatanHarian: React.FC<FormulirCatatanHarianProps> = ({
  murid,
  jurnalList,
  onUpdateDayStatus,
  onSwitchToRefleksi,
  readOnly = false,
}) => {
  const [selectedBulan, setSelectedBulan] = useState<string>('Oktober 2026');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(9); // 0-indexed (9 = Oktober)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Map of days 1..31 for current student
  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Helper to get status of habit on specific day
  const getDayStatus = (day: number, habitKey: string): boolean => {
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = selectedMonthIndex + 1 < 10 ? `0${selectedMonthIndex + 1}` : `${selectedMonthIndex + 1}`;
    const dateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    const journal = jurnalList.find(
      (j) => j.muridId === murid.id && normalizeDateStringToWIB(j.tanggal) === dateStr
    );
    if (!journal) return false;

    switch (habitKey) {
      case 'bangunPagi':
        return journal.bangunPagiChecked;
      case 'beribadah':
        return (journal.ibadahChecklist?.length || 0) > 0 || !!journal.sedangBerhalangan;
      case 'berolahraga':
        return journal.olahragaChecked;
      case 'makanSehat':
        return journal.makanSehatChecked;
      case 'gemarBelajar':
        return journal.belajarChecked;
      case 'bermasyarakat':
        return journal.bantuOrangTuaChecked;
      case 'tidurCepat':
        return journal.tidurTepatWaktuChecked;
      default:
        return false;
    }
  };

  const countChecked = (habitKey: string): number => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (getDayStatus(day, habitKey)) count++;
    }
    return count;
  };

  const handleCellClick = (day: number, habitKey: string) => {
    if (readOnly || !onUpdateDayStatus) return;
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const formattedMonth = selectedMonthIndex + 1 < 10 ? `0${selectedMonthIndex + 1}` : `${selectedMonthIndex + 1}`;
    const dateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;
    const currentVal = getDayStatus(day, habitKey);
    onUpdateDayStatus(dateStr, habitKey, !currentVal);
  };

  const isKelasRendah = murid.kelas.includes('1') || murid.kelas.includes('2') || murid.kelas.includes('3') || murid.kelas.includes('4');

  return (
    <div className="space-y-6">
      {/* Controls Bar (No print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-900" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Pilih Bulan:</span>
            <select
              value={selectedBulan}
              onChange={(e) => {
                setSelectedBulan(e.target.value);
                if (e.target.value.includes('Oktober')) setSelectedMonthIndex(9);
              }}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl"
            >
              <option value="Oktober 2026">Oktober 2026</option>
              <option value="November 2026">November 2026</option>
              <option value="Desember 2026">Desember 2026</option>
              <option value="Januari 2027">Januari 2027</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            (Lampiran {isKelasRendah ? '1. Kelas 1 - 4 SD' : '2. Kelas 5 - 6 SD'} Kemendikdasmen)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSwitchToRefleksi && (
            <button
              type="button"
              onClick={onSwitchToRefleksi}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-blue-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors"
              title="Buka Lembar Refleksi Orang Tua yang terisi otomatis dari data ini"
            >
              <span>⚡ Lembar Refleksi (Otomatis)</span>
            </button>
          )}

          {/* Unduh PDF Resmi */}
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={async () => {
              if (!printRef.current) return;
              setIsGeneratingPdf(true);
              const filename = `Catatan_Harian_${murid.nama.replace(/\s+/g, '_')}_${selectedBulan.replace(/\s+/g, '_')}`;
              const res = await downloadElementAsPdf(printRef.current, filename, {
                orientation: 'portrait',
                title: `Catatan Harian 7 KAIH - ${murid.nama} (${selectedBulan})`,
              });
              setIsGeneratingPdf(false);
              setToastMsg(res.message);
              setTimeout(() => setToastMsg(null), 4000);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            title="Unduh langsung berkas PDF Catatan Harian format A4"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4 text-emerald-200" />
            )}
            <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF (A4)'}</span>
          </button>

          {/* Unduh Dokumen HTML Siap Cetak */}
          <button
            type="button"
            onClick={() => {
              if (!printRef.current) return;
              const filename = `Catatan_Harian_${murid.nama.replace(/\s+/g, '_')}_${selectedBulan.replace(/\s+/g, '_')}`;
              downloadPrintableHtml(
                printRef.current,
                `Catatan Harian 7 KAIH - ${murid.nama} (${selectedBulan})`,
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
                  `Catatan Harian 7 KAIH - ${murid.nama} (${selectedBulan})`
                );
              } else {
                window.print();
              }
            }}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Cetak langsung menggunakan printer atau dialog cetak browser"
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

      {/* DOKUMEN CETAK PERSIS SEPERTI LAMPIRAN 1 & 2 RESMI KEMENDIKDASMEN */}
      <div ref={printRef} className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-300 shadow-lg print-container max-w-[210mm] mx-auto text-slate-900">
        {/* Header Catatan Harian */}
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide font-sans">
            Catatan Harian
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Gerakan Tujuh Kebiasaan Anak Indonesia Hebat (GiatTKAIH)
          </p>
        </div>

        {/* Info Siswa */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mb-3 font-semibold pb-3 border-b border-slate-200">
          <div>
            <span className="text-slate-600">Bulan : </span>
            <span className="font-bold text-slate-900">{selectedBulan}</span>
          </div>
          <div>
            <span className="text-slate-600">Nama : </span>
            <span className="font-bold text-slate-900">{murid.nama}</span>
          </div>
          <div>
            <span className="text-slate-600">Kelas : </span>
            <span className="font-bold text-slate-900">{murid.kelas}</span>
          </div>
          <div>
            <span className="text-slate-600">NISN : </span>
            <span className="font-mono text-slate-900">{murid.nisn}</span>
          </div>
        </div>

        {/* Petunjuk Pengisian Dokumen */}
        <div className="text-[10.5px] leading-relaxed text-slate-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 mb-4">
          {isKelasRendah ? (
            <p>
              <b>Petunjuk (Kelas 1 - 4 SD):</b> Berilah tanda paraf (✓) jika anak melakukan pembiasaan atau tanda silang (x) jika anak belum melakukan pembiasaan! Orang tua dan/atau guru dapat memberikan validasi untuk tanggal dengan paraf.
              <span className="block text-[10px] text-amber-800 italic mt-0.5">
                📝 Paraf guru dan orang tua bisa ditumpuk di dalam kotak.
              </span>
            </p>
          ) : (
            <p>
              <b>Petunjuk (Kelas 5 - 6 SD):</b> Berilah tanda centang (✓) jika kamu melakukan pembiasaan atau tanda silang (x) jika kamu belum melakukan pembiasaan! Orang tua dan/atau guru dapat memberikan validasi untuk tanggal dengan paraf.
            </p>
          )}
        </div>

        {/* 7 BLOK KEBIASAAN PERSIS LAMPIRAN 1 & 2 */}
        <div className="space-y-4">
          {/* 1. BANGUN PAGI */}
          <div className="rounded-2xl border border-amber-200 overflow-hidden bg-white shadow-xs">
            <div className="bg-[#0284c7] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-400 text-blue-950 flex items-center justify-center font-bold text-xs">
                  <Sun className="w-4 h-4 fill-amber-400 text-white" />
                </div>
                <h4 className="font-extrabold text-xs tracking-wide uppercase">Bangun Pagi</h4>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[11px] font-bold">
                Jumlah paraf : <span className="text-amber-300 font-extrabold">{countChecked('bangunPagi')}</span>
              </div>
            </div>

            <div className="p-3">
              {/* Grid 1 - 31 Warna Kuning Emas */}
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 mb-2">
                {daysArray.map((day) => {
                  const checked = getDayStatus(day, 'bangunPagi');
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(day, 'bangunPagi')}
                      className={`h-9 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        checked
                          ? 'bg-amber-400 text-blue-950 border-amber-500 shadow-xs'
                          : 'bg-[#fef08a]/60 hover:bg-[#fef08a] text-slate-800 border-amber-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-600 leading-none">{day}</span>
                      <span className="text-[12px] leading-tight">{checked ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <span>⏰</span>
                <span><b>Silakan isi waktu anak bangun pagi.</b> Contoh: 05:30 WIB (Definisi: Antara pukul 04.00 - 06.00).</span>
              </div>
            </div>
          </div>

          {/* 2. BERIBADAH */}
          <div className="rounded-2xl border border-sky-200 overflow-hidden bg-white shadow-xs">
            <div className="bg-[#0284c7] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-400 text-white flex items-center justify-center font-bold text-xs">
                  <Heart className="w-4 h-4 fill-rose-400 text-white" />
                </div>
                <h4 className="font-extrabold text-xs tracking-wide uppercase">Beribadah</h4>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[11px] font-bold">
                Jumlah paraf : <span className="text-amber-300 font-extrabold">{countChecked('beribadah')}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {daysArray.map((day) => {
                  const checked = getDayStatus(day, 'beribadah');
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(day, 'beribadah')}
                      className={`h-9 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        checked
                          ? 'bg-[#38bdf8] text-white border-sky-500 shadow-xs'
                          : 'bg-[#e0f2fe]/70 hover:bg-[#bae6fd] text-slate-800 border-sky-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-600 leading-none">{day}</span>
                      <span className="text-[12px] leading-tight">{checked ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. BEROLAHRAGA */}
          <div className="rounded-2xl border border-amber-200 overflow-hidden bg-white shadow-xs">
            <div className="bg-[#0284c7] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-extrabold text-xs tracking-wide uppercase">Berolahraga</h4>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[11px] font-bold">
                Jumlah paraf : <span className="text-amber-300 font-extrabold">{countChecked('berolahraga')}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {daysArray.map((day) => {
                  const checked = getDayStatus(day, 'berolahraga');
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(day, 'berolahraga')}
                      className={`h-9 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        checked
                          ? 'bg-amber-400 text-blue-950 border-amber-500 shadow-xs'
                          : 'bg-[#fef08a]/60 hover:bg-[#fef08a] text-slate-800 border-amber-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-600 leading-none">{day}</span>
                      <span className="text-[12px] leading-tight">{checked ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. MAKAN SEHAT DAN BERGIZI */}
          <div className="rounded-2xl border border-sky-200 overflow-hidden bg-white shadow-xs">
            <div className="bg-[#0284c7] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">
                  <Apple className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-extrabold text-xs tracking-wide uppercase">Makan Sehat dan Bergizi</h4>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[11px] font-bold">
                Jumlah paraf : <span className="text-amber-300 font-extrabold">{countChecked('makanSehat')}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {daysArray.map((day) => {
                  const checked = getDayStatus(day, 'makanSehat');
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(day, 'makanSehat')}
                      className={`h-9 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        checked
                          ? 'bg-[#38bdf8] text-white border-sky-500 shadow-xs'
                          : 'bg-[#e0f2fe]/70 hover:bg-[#bae6fd] text-slate-800 border-sky-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-600 leading-none">{day}</span>
                      <span className="text-[12px] leading-tight">{checked ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. GEMAR BELAJAR */}
          <div className="rounded-2xl border border-amber-200 overflow-hidden bg-white shadow-xs">
            <div className="bg-[#0284c7] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-extrabold text-xs tracking-wide uppercase">Gemar Belajar</h4>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[11px] font-bold">
                Jumlah paraf : <span className="text-amber-300 font-extrabold">{countChecked('gemarBelajar')}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {daysArray.map((day) => {
                  const checked = getDayStatus(day, 'gemarBelajar');
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(day, 'gemarBelajar')}
                      className={`h-9 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        checked
                          ? 'bg-amber-400 text-blue-950 border-amber-500 shadow-xs'
                          : 'bg-[#fef08a]/60 hover:bg-[#fef08a] text-slate-800 border-amber-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-600 leading-none">{day}</span>
                      <span className="text-[12px] leading-tight">{checked ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. BERMASYARAKAT */}
          <div className="rounded-2xl border border-sky-200 overflow-hidden bg-white shadow-xs">
            <div className="bg-[#0284c7] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  <Users2 className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-extrabold text-xs tracking-wide uppercase">Bermasyarakat</h4>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[11px] font-bold">
                Jumlah paraf : <span className="text-amber-300 font-extrabold">{countChecked('bermasyarakat')}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {daysArray.map((day) => {
                  const checked = getDayStatus(day, 'bermasyarakat');
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(day, 'bermasyarakat')}
                      className={`h-9 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        checked
                          ? 'bg-[#38bdf8] text-white border-sky-500 shadow-xs'
                          : 'bg-[#e0f2fe]/70 hover:bg-[#bae6fd] text-slate-800 border-sky-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-600 leading-none">{day}</span>
                      <span className="text-[12px] leading-tight">{checked ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 7. TIDUR CEPAT */}
          <div className="rounded-2xl border border-amber-200 overflow-hidden bg-white shadow-xs">
            <div className="bg-[#0284c7] text-white px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  <Moon className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-extrabold text-xs tracking-wide uppercase">Tidur Cepat</h4>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-[11px] font-bold">
                Jumlah paraf : <span className="text-amber-300 font-extrabold">{countChecked('tidurCepat')}</span>
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 mb-2">
                {daysArray.map((day) => {
                  const checked = getDayStatus(day, 'tidurCepat');
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleCellClick(day, 'tidurCepat')}
                      className={`h-9 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                        checked
                          ? 'bg-amber-400 text-blue-950 border-amber-500 shadow-xs'
                          : 'bg-[#fef08a]/60 hover:bg-[#fef08a] text-slate-800 border-amber-200'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-slate-600 leading-none">{day}</span>
                      <span className="text-[12px] leading-tight">{checked ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                <span>🌙</span>
                <span><b>Silakan isi waktu anak tidur.</b> Contoh: 20:30 WIB (Definisi: Tidur tepat waktu sebelum jam 21.00).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tanda Tangan Validasi Orang Tua & Guru */}
        <div className="grid grid-cols-2 gap-8 text-[11px] mt-8 pt-4 border-t border-slate-200 avoid-break">
          <div className="text-center">
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900">Orang Tua / Wali Murid</p>
            <div className="h-12 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Paraf / Validasi)</span>
            </div>
            <p className="font-bold underline">{murid.namaOrangTua}</p>
          </div>

          <div className="text-center">
            <p className="text-slate-600">Jakarta Barat, akhir bulan {selectedBulan}</p>
            <p className="font-bold text-slate-900">Guru Kelas / Observer</p>
            <div className="h-12 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 italic">(Paraf Guru)</span>
            </div>
            <p className="font-bold underline">Guru Kelas {murid.kelas}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
