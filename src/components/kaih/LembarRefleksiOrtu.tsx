import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Murid, Jurnal7KAIH, Refleksi7KAIH } from '../../types';
import { storageService } from '../../services/storageService';
import { kaihAnalysisService, MonthAnalysisSummary } from '../../services/kaihAnalysisService';
import {
  Printer,
  Save,
  Sun,
  Heart,
  Activity,
  Apple,
  BookOpen,
  Users2,
  Moon,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  BarChart3,
  Calendar,
  Info,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  downloadElementAsPdf,
  downloadPrintableHtml,
  safePrintElement,
} from '../../services/printAndDownloadService';

interface LembarRefleksiOrtuProps {
  murid: Murid;
  jurnalList?: Jurnal7KAIH[];
  bulan?: string;
  readOnly?: boolean;
}

export const LembarRefleksiOrtu: React.FC<LembarRefleksiOrtuProps> = ({
  murid,
  jurnalList = [],
  bulan = 'Oktober 2026',
  readOnly = false,
}) => {
  const [selectedBulan, setSelectedBulan] = useState(bulan);
  const [saveAlert, setSaveAlert] = useState<string | null>(null);

  // Compute live analysis from daily quick records for this month
  const analysis: MonthAnalysisSummary = useMemo(() => {
    return kaihAnalysisService.analyzeMonth(murid, selectedBulan, jurnalList);
  }, [murid, selectedBulan, jurnalList]);

  // Check if a saved reflection already exists in storage
  const existingSaved = useMemo(() => {
    return storageService
      .getRefleksiList()
      .find((r) => r.muridId === murid.id && r.bulan === selectedBulan);
  }, [murid.id, selectedBulan]);

  const [formData, setFormData] = useState<Refleksi7KAIH>(() => {
    return existingSaved || analysis.generatedRefleksi;
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Keep in sync and auto-fill from monthly rekap when month or student changes
  useEffect(() => {
    // Selalu hitung otomatis dari hasil rekap sebulan sekali
    const freshAnalysis = kaihAnalysisService.analyzeMonth(murid, selectedBulan, jurnalList);
    if (existingSaved && existingSaved.bangunPagiRefleksi && existingSaved.bangunPagiRefleksi.trim().length > 0) {
      setFormData(existingSaved);
    } else {
      setFormData(freshAnalysis.generatedRefleksi);
      // Auto-save to storage if not present so it's persisted for teacher review
      storageService.saveRefleksi({
        ...freshAnalysis.generatedRefleksi,
        muridId: murid.id,
        muridNama: murid.nama,
        kelas: murid.kelas,
        bulan: selectedBulan,
      });
    }
  }, [selectedBulan, murid.id, existingSaved, jurnalList]);

  // Handle re-generating reflection directly from daily records
  const handleAutoFillFromDaily = () => {
    const freshAnalysis = kaihAnalysisService.analyzeMonth(murid, selectedBulan, jurnalList);
    setFormData(freshAnalysis.generatedRefleksi);
    storageService.saveRefleksi({
      ...freshAnalysis.generatedRefleksi,
      muridId: murid.id,
      muridNama: murid.nama,
      kelas: murid.kelas,
      bulan: selectedBulan,
    });
    setSaveAlert('✨ Berhasil diisi otomatis dari hasil rekap pembiasaan sebulan penuh!');
    setTimeout(() => setSaveAlert(null), 3500);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const toSave: Refleksi7KAIH = {
      ...formData,
      muridId: murid.id,
      muridNama: murid.nama,
      kelas: murid.kelas,
      bulan: selectedBulan,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    storageService.saveRefleksi(toSave);
    setSaveAlert(`Lembar Refleksi Orang Tua (${selectedBulan}) berhasil disimpan ke database!`);
    setTimeout(() => setSaveAlert(null), 3500);
  };

  const bp = analysis.habits['bangunPagi'];
  const ib = analysis.habits['beribadah'];
  const ol = analysis.habits['berolahraga'];
  const ms = analysis.habits['makanSehat'];
  const gb = analysis.habits['gemarBelajar'];
  const bm = analysis.habits['bermasyarakat'];
  const tc = analysis.habits['tidurCepat'];

  return (
    <div className="space-y-6">
      {/* Control Bar (No Print) */}
      <div className="no-print bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-900" />
              <span className="text-xs font-bold text-slate-700">Pilih Bulan Refleksi:</span>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(e.target.value)}
                className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="Desember 2026">Desember 2026</option>
                <option value="Januari 2027">Januari 2027</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 hidden md:inline">
              (Lampiran 3 Kemendikdasmen - Lembar Refleksi Orang Tua)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={handleAutoFillFromDaily}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-blue-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                title="Isi otomatis kesimpulan dan tindak lanjut dari hasil rekap pembiasaan sebulan sekali"
              >
                <Sparkles className="w-4 h-4 text-blue-950 fill-blue-950" />
                <span>⚡ Isi Otomatis dari Rekap Sebulan</span>
              </button>
            )}

            {!readOnly && (
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4 text-emerald-200" />
                <span>Simpan Refleksi</span>
              </button>
            )}

            {/* Unduh PDF Resmi */}
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={async () => {
                if (!printRef.current) return;
                setIsGeneratingPdf(true);
                const filename = `Lembar_Refleksi_Ortu_${murid.nama.replace(/\s+/g, '_')}_${selectedBulan.replace(/\s+/g, '_')}`;
                const res = await downloadElementAsPdf(printRef.current, filename, {
                  orientation: 'portrait',
                  title: `Lembar Refleksi Orang Tua (Lampiran 3) - ${murid.nama}`,
                });
                setIsGeneratingPdf(false);
                setSaveAlert(res.message);
                setTimeout(() => setSaveAlert(null), 4000);
              }}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              title="Unduh langsung berkas PDF Lembar Refleksi format A4"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-amber-300" />
              )}
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF (A4)'}</span>
            </button>

            {/* Unduh Dokumen HTML Siap Cetak */}
            <button
              type="button"
              onClick={() => {
                if (!printRef.current) return;
                const filename = `Lembar_Refleksi_Ortu_${murid.nama.replace(/\s+/g, '_')}_${selectedBulan.replace(/\s+/g, '_')}`;
                downloadPrintableHtml(
                  printRef.current,
                  `Lembar Refleksi Orang Tua (Lampiran 3) - ${murid.nama} (${selectedBulan})`,
                  filename
                );
                setSaveAlert('Berkas HTML Siap Cetak berhasil diunduh!');
                setTimeout(() => setSaveAlert(null), 3000);
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
                    `Lembar Refleksi Orang Tua - ${murid.nama} (${selectedBulan})`
                  );
                } else {
                  window.print();
                }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Live Analysis Summary Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-amber-300 flex items-center justify-center shrink-0 font-bold shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-blue-950 text-sm">
                  Status Analisis Harian ({selectedBulan}):
                </span>
                <span
                  className={`font-black text-[11px] px-2.5 py-0.5 rounded-full ${
                    analysis.overallKategori === 'Sudah Terbiasa'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {analysis.overallKategori} (Standar Kemendikdasmen &ge; 21 Hari)
                </span>
              </div>
              <p className="text-slate-600 text-[11.5px] mt-0.5">
                Rata-rata ketercapaian 7 pembiasaan: <b>{analysis.averagePercentage}%</b>.
                Seluruh kolom di bawah terisi otomatis berdasarkan ceklis 1–31 hari pada <b>Formulir Catatan Harian</b>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-blue-200 shrink-0">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-slate-600">
              Orang tua tetap dapat menyunting teks di bawah sebelum mencetak.
            </span>
          </div>
        </div>
      </div>

      {saveAlert && (
        <div className="no-print p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveAlert}</span>
        </div>
      )}

      {/* DOKUMEN CETAK PERSIS SEPERTI LAMPIRAN 3 RESMI KEMENDIKDASMEN */}
      <div ref={printRef} className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-lg print-container max-w-[210mm] mx-auto text-slate-900">
        {/* Header Lembar Refleksi */}
        <div className="text-center mb-6">
          <div className="text-right text-[10px] text-slate-500 italic mb-1 no-print">
            Lampiran 3. Contoh Lembar Refleksi Orang Tua (Halaman Kedua Catatan Harian)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wide font-sans">
            Lembar Refleksi Orang Tua
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Gerakan Tujuh Kebiasaan Anak Indonesia Hebat (GiatTKAIH)
          </p>
        </div>

        {/* Info Siswa */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mb-6 font-semibold pb-3 border-b border-slate-200">
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
            <span className="text-slate-600">Orang Tua / Wali : </span>
            <span className="font-bold text-slate-900">{murid.namaOrangTua}</span>
          </div>
        </div>

        {/* 7 BAGIAN KEBIASAAN PERSIS LAMPIRAN 3 */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. Bangun Pagi */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="bg-[#0284c7] text-white px-3 py-1 rounded-lg flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="font-bold text-xs uppercase tracking-wide">1. Bangun Pagi</span>
              </div>
              {bp && (
                <div className="text-[10.5px] font-semibold text-slate-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Terlaksana: <b className="text-blue-900">{bp.daysChecked}</b> dari {bp.totalDays} hari ({bp.percentage}%) •{' '}
                  <span className={bp.kategori === 'Sudah Terbiasa' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {bp.kategori}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Kesimpulan/Refleksi Orang Tua:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={formData.bangunPagiRefleksi}
                onChange={(e) => setFormData({ ...formData, bangunPagiRefleksi: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tindak Lanjut:</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.bangunPagiTindakLanjut}
                onChange={(e) => setFormData({ ...formData, bangunPagiTindakLanjut: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white font-sans"
              />
            </div>
          </div>

          {/* 2. Beribadah */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="bg-[#0284c7] text-white px-3 py-1 rounded-lg flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                <span className="font-bold text-xs uppercase tracking-wide">2. Beribadah</span>
              </div>
              {ib && (
                <div className="text-[10.5px] font-semibold text-slate-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                  Terlaksana: <b className="text-blue-900">{ib.daysChecked}</b> dari {ib.totalDays} hari ({ib.percentage}%) •{' '}
                  <span className={ib.kategori === 'Sudah Terbiasa' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {ib.kategori}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Kesimpulan/Refleksi Orang Tua:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={formData.beribadahRefleksi}
                onChange={(e) => setFormData({ ...formData, beribadahRefleksi: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tindak Lanjut:</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.beribadahTindakLanjut}
                onChange={(e) => setFormData({ ...formData, beribadahTindakLanjut: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white font-sans"
              />
            </div>
          </div>

          {/* 3. Berolahraga */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="bg-[#0284c7] text-white px-3 py-1 rounded-lg flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-300" />
                <span className="font-bold text-xs uppercase tracking-wide">3. Berolahraga</span>
              </div>
              {ol && (
                <div className="text-[10.5px] font-semibold text-slate-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Terlaksana: <b className="text-blue-900">{ol.daysChecked}</b> dari {ol.totalDays} hari ({ol.percentage}%) •{' '}
                  <span className={ol.kategori === 'Sudah Terbiasa' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {ol.kategori}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Kesimpulan/Refleksi Orang Tua:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={formData.berolahragaRefleksi}
                onChange={(e) => setFormData({ ...formData, berolahragaRefleksi: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tindak Lanjut:</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.berolahragaTindakLanjut}
                onChange={(e) => setFormData({ ...formData, berolahragaTindakLanjut: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white font-sans"
              />
            </div>
          </div>

          {/* 4. Makan Sehat dan Bergizi */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="bg-[#0284c7] text-white px-3 py-1 rounded-lg flex items-center gap-2">
                <Apple className="w-4 h-4 text-green-300" />
                <span className="font-bold text-xs uppercase tracking-wide">4. Makan Sehat dan Bergizi</span>
              </div>
              {ms && (
                <div className="text-[10.5px] font-semibold text-slate-600 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                  Terlaksana: <b className="text-blue-900">{ms.daysChecked}</b> dari {ms.totalDays} hari ({ms.percentage}%) •{' '}
                  <span className={ms.kategori === 'Sudah Terbiasa' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {ms.kategori}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Kesimpulan/Refleksi Orang Tua:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={formData.makanSehatRefleksi}
                onChange={(e) => setFormData({ ...formData, makanSehatRefleksi: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tindak Lanjut:</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.makanSehatTindakLanjut}
                onChange={(e) => setFormData({ ...formData, makanSehatTindakLanjut: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white font-sans"
              />
            </div>
          </div>

          {/* 5. Gemar Belajar */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="bg-[#0284c7] text-white px-3 py-1 rounded-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-200" />
                <span className="font-bold text-xs uppercase tracking-wide">5. Gemar Belajar</span>
              </div>
              {gb && (
                <div className="text-[10.5px] font-semibold text-slate-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Terlaksana: <b className="text-blue-900">{gb.daysChecked}</b> dari {gb.totalDays} hari ({gb.percentage}%) •{' '}
                  <span className={gb.kategori === 'Sudah Terbiasa' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {gb.kategori}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Kesimpulan/Refleksi Orang Tua:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={formData.gemarBelajarRefleksi}
                onChange={(e) => setFormData({ ...formData, gemarBelajarRefleksi: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tindak Lanjut:</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.gemarBelajarTindakLanjut}
                onChange={(e) => setFormData({ ...formData, gemarBelajarTindakLanjut: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white font-sans"
              />
            </div>
          </div>

          {/* 6. Bermasyarakat */}
          <div className="space-y-2 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="bg-[#0284c7] text-white px-3 py-1 rounded-lg flex items-center gap-2">
                <Users2 className="w-4 h-4 text-purple-200" />
                <span className="font-bold text-xs uppercase tracking-wide">6. Bermasyarakat</span>
              </div>
              {bm && (
                <div className="text-[10.5px] font-semibold text-slate-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Terlaksana: <b className="text-blue-900">{bm.daysChecked}</b> dari {bm.totalDays} hari ({bm.percentage}%) •{' '}
                  <span className={bm.kategori === 'Sudah Terbiasa' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {bm.kategori}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Kesimpulan/Refleksi Orang Tua:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={formData.bermasyarakatRefleksi}
                onChange={(e) => setFormData({ ...formData, bermasyarakatRefleksi: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tindak Lanjut:</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.bermasyarakatTindakLanjut}
                onChange={(e) => setFormData({ ...formData, bermasyarakatTindakLanjut: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white font-sans"
              />
            </div>
          </div>

          {/* 7. Tidur Cepat */}
          <div className="space-y-2 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="bg-[#0284c7] text-white px-3 py-1 rounded-lg flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-200" />
                <span className="font-bold text-xs uppercase tracking-wide">7. Tidur Cepat</span>
              </div>
              {tc && (
                <div className="text-[10.5px] font-semibold text-slate-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Terlaksana: <b className="text-blue-900">{tc.daysChecked}</b> dari {tc.totalDays} hari ({tc.percentage}%) •{' '}
                  <span className={tc.kategori === 'Sudah Terbiasa' ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
                    {tc.kategori}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Kesimpulan/Refleksi Orang Tua:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={formData.tidurCepatRefleksi}
                onChange={(e) => setFormData({ ...formData, tidurCepatRefleksi: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Tindak Lanjut:</label>
              <input
                type="text"
                disabled={readOnly}
                value={formData.tidurCepatTindakLanjut}
                onChange={(e) => setFormData({ ...formData, tidurCepatTindakLanjut: e.target.value })}
                className="w-full text-xs p-2 bg-slate-50/60 rounded-xl border border-slate-300 focus:bg-white font-sans"
              />
            </div>
          </div>

          {/* Tanda Tangan Orang Tua */}
          <div className="text-right pt-6 text-xs avoid-break">
            <p className="text-slate-600">Jakarta Barat, akhir {selectedBulan}</p>
            <p className="font-bold text-slate-900 mt-1">Orang Tua / Wali Murid,</p>
            <div className="h-16 flex items-center justify-end">
              <span className="text-[10px] text-slate-400 italic mr-8">(Tanda Tangan Orang Tua)</span>
            </div>
            <p className="font-bold underline text-slate-900">{murid.namaOrangTua}</p>
          </div>
        </form>
      </div>
    </div>
  );
};
