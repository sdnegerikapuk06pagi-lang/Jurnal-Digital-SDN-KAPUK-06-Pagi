import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Murid, Guru } from '../../types';
import {
  parseExcelOrCsvFile,
  parsePastedSpreadsheetText,
  processMuridRows,
  processGuruRows,
  downloadTemplateMuridExcel,
  downloadTemplateGuruExcel,
  ImportResult,
} from '../../services/excelImportService';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'murid' | 'guru';
  targetKelas?: string; // If imported by a class teacher
  onImportMurid?: (data: Murid[], mode: 'replace' | 'append') => void;
  onImportGuru?: (data: Guru[], mode: 'replace' | 'append') => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  type,
  targetKelas,
  onImportMurid,
  onImportGuru,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportResult<Murid | Guru> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setPastedText('');
    setPreviewResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Handle File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const rawRows = await parseExcelOrCsvFile(file);
      if (rawRows.length === 0) {
        setErrorMessage('File Excel/CSV kosong atau format tabel tidak terdeteksi.');
        setIsProcessing(false);
        return;
      }

      if (type === 'murid') {
        const result = processMuridRows(rawRows, targetKelas);
        setPreviewResult(result as ImportResult<Murid | Guru>);
      } else {
        const result = processGuruRows(rawRows);
        setPreviewResult(result as ImportResult<Murid | Guru>);
      }
    } catch (err: any) {
      setErrorMessage(`Gagal membaca berkas Excel: ${err?.message || 'Format tidak didukung'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Processing Pasted Text
  const handleProcessPasted = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Mohon tempel (paste) data dari spreadsheet terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const rawRows = parsePastedSpreadsheetText(pastedText);
      if (rawRows.length === 0) {
        setErrorMessage(
          'Gagal mendeteksi kolom. Pastikan Anda menyertakan baris judul (header) seperti NISN, Nama, Kelas.'
        );
        setIsProcessing(false);
        return;
      }

      if (type === 'murid') {
        const result = processMuridRows(rawRows, targetKelas);
        setPreviewResult(result as ImportResult<Murid | Guru>);
      } else {
        const result = processGuruRows(rawRows);
        setPreviewResult(result as ImportResult<Murid | Guru>);
      }
    } catch (err: any) {
      setErrorMessage(`Gagal memproses data teks: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Execute Import
  const handleExecuteImport = () => {
    if (!previewResult || previewResult.data.length === 0) return;

    if (type === 'murid' && onImportMurid) {
      onImportMurid(previewResult.data as Murid[], importMode);
    } else if (type === 'guru' && onImportGuru) {
      onImportGuru(previewResult.data as Guru[], importMode);
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Impor Data {type === 'murid' ? 'Murid' : 'Guru'} dari Excel / Spreadsheet
              </h3>
              <p className="text-xs text-blue-200">
                {targetKelas
                  ? `Khusus ${targetKelas} SDN Kapuk 06 Pagi`
                  : 'Impor massal langsung ke sistem tanpa input manual satu per satu'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Method Selector Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setActiveInputTab('upload');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeInputTab === 'upload'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Berkas Excel (.xlsx / .csv)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveInputTab('paste');
                  setErrorMessage(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeInputTab === 'paste'
                    ? 'bg-amber-400 text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Salin & Tempel dari Spreadsheet</span>
              </button>
            </div>

            {/* Template Download Button */}
            <button
              type="button"
              onClick={type === 'murid' ? downloadTemplateMuridExcel : downloadTemplateGuruExcel}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Format Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeInputTab === 'upload' && !previewResult && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 transition-all rounded-3xl p-8 text-center cursor-pointer flex flex-col items-center justify-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  Klik untuk Memilih File Excel atau Seret ke Sini
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Mendukung format <b>.xlsx</b>, <b>.xls</b>, atau <b>.csv</b>. Sistem otomatis membaca kolom NISN, Nama, Kelas, JK, Nama Orang Tua, dan Nomor HP.
                </p>
                <span className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs">
                  Pilih Berkas Komputer
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Tips Format */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  Petunjuk Format Kolom:
                </div>
                <p className="text-[11px] leading-relaxed">
                  {type === 'murid' ? (
                    <>
                      Header kolom yang dianjurkan di baris pertama: <b>NISN</b>, <b>Nama Lengkap</b>, <b>Kelas</b> (contoh: 1A, 2B, 4A), <b>Jenis Kelamin</b> (L/P), <b>Nama Orang Tua</b>, <b>No HP</b>. PIN otomatis diisi default <b>1234</b> jika kolom dikosongkan.
                    </>
                  ) : (
                    <>
                      Header kolom yang dianjurkan: <b>NIP</b>, <b>Nama Guru</b>, <b>Jabatan</b>, <b>Kelas Ampu</b>, <b>Email</b>, <b>No HP</b>. Password otomatis default <b>1234</b> jika kosong.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: COPY-PASTE DARI GOOGLE SHEETS / EXCEL */}
          {activeInputTab === 'paste' && !previewResult && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">
                    Tempelkan (Paste) Baris Tabel dari Google Sheets / Excel di Sini:
                  </label>
                  <span className="text-[11px] text-slate-500">Sertakan baris judul kolom (Header)</span>
                </div>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Contoh isi yang dicopy dari Google Sheets:\nNISN\tNama Lengkap\tKelas\tJenis Kelamin\tNama Orang Tua\tNo HP\n0123456789\tAhmad Fadhil\tKelas 1A\tL\tBambang Irawan\t081234567890\n0123456790\tAisyah Zahira\tKelas 1A\tP\tHendra Wijaya\t081298765432`}
                  className="w-full text-xs font-mono p-3.5 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Bersihkan Teks
                </button>
                <button
                  type="button"
                  onClick={handleProcessPasted}
                  disabled={!pastedText.trim()}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-blue-950 font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Proses & Pratinjau Data</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Terjadi Kesalahan: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* PREVIEW HASIL PARSING */}
          {previewResult && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-900">
                      {previewResult.validRows} Data Berhasil Diproses
                    </h4>
                    <p className="text-xs text-emerald-700">
                      File: {selectedFile ? selectedFile.name : 'Data Tempelan Spreadsheet'} • {previewResult.totalRows} baris terdeteksi
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewResult(null);
                    setSelectedFile(null);
                    setPastedText('');
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  Pilih / Tempel Berkas Lain
                </button>
              </div>

              {/* Mode Impor: Replace vs Append */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-xs font-extrabold text-slate-800 block">
                  Pilih Metode Penyimpanan ke Database:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-white border-blue-600 ring-2 ring-blue-400/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-1 text-blue-900"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Gantikan Seluruh Data {type === 'murid' ? (targetKelas ? `di ${targetKelas}` : 'Murid') : 'Guru'}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">
                        Menghapus data lama (termasuk akun demo contoh) dan menggantinya murni dengan data impor ini. (Disarankan)
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-white border-blue-600 ring-2 ring-blue-400/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-1 text-blue-900"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Gabungkan / Tambahkan Data
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">
                        Mempertahankan akun yang ada dan memperbarui/menambahkan data yang baru diimpor.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Warnings & Errors List if any */}
              {previewResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Catatan ({previewResult.warnings.length}):
                  </div>
                  <ul className="list-disc pl-5 max-h-20 overflow-y-auto space-y-0.5">
                    {previewResult.warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                    {previewResult.warnings.length > 5 && (
                      <li>... dan {previewResult.warnings.length - 5} lainnya</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Table Preview */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span>Pratinjau Data (Menampilkan 10 baris pertama):</span>
                    {type === 'murid' && (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          ♂ L: {(previewResult.data as Murid[]).filter((m) => m.jenisKelamin === 'L').length}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold">
                          ♀ P: {(previewResult.data as Murid[]).filter((m) => m.jenisKelamin === 'P').length}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Total {previewResult.validRows} siap diimpor
                  </span>
                </div>
                <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-2xl bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      {type === 'murid' ? (
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">NISN</th>
                          <th className="py-2.5 px-3">Nama Murid</th>
                          <th className="py-2.5 px-3">Kelas</th>
                          <th className="py-2.5 px-3">L/P</th>
                          <th className="py-2.5 px-3">Orang Tua</th>
                          <th className="py-2.5 px-3">No HP</th>
                          <th className="py-2.5 px-3">PIN</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">NIP</th>
                          <th className="py-2.5 px-3">Nama Guru</th>
                          <th className="py-2.5 px-3">Jabatan</th>
                          <th className="py-2.5 px-3">Kelas Ampu</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">PIN</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewResult.data.slice(0, 10).map((item, idx) => {
                        if (type === 'murid') {
                          const m = item as Murid;
                          return (
                            <tr key={m.id || idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">{m.nisn}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{m.nama}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                                  {m.kelas}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                    m.jenisKelamin === 'P'
                                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {m.jenisKelamin === 'P' ? '♀ P' : '♂ L'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600">{m.namaOrangTua}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{m.noHpOraangTua}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-amber-700">{m.pin}</td>
                            </tr>
                          );
                        } else {
                          const g = item as Guru;
                          return (
                            <tr key={g.id || idx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">{g.nip}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{g.nama}</td>
                              <td className="py-2 px-3 text-slate-600">{g.jabatan}</td>
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold">
                                  {g.kelasAmpu}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-500">{g.email}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-blue-700">{g.pin}</td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl"
          >
            Batal
          </button>

          {previewResult && previewResult.data.length > 0 && (
            <button
              type="button"
              onClick={handleExecuteImport}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-transform hover:scale-[1.01]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                Simpan & Terapkan {previewResult.validRows} Data {type === 'murid' ? 'Murid' : 'Guru'}
              </span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
