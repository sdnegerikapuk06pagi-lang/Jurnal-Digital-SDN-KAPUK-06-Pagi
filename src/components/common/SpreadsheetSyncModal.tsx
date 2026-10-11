import React, { useState, useEffect } from 'react';
import { SchoolSettings } from '../../types';
import { storageService } from '../../services/storageService';
import {
  X,
  Database,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Link2,
} from 'lucide-react';

interface SpreadsheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onPullSuccess?: (message: string) => void;
  onPushSuccess?: (message: string) => void;
}

export const SpreadsheetSyncModal: React.FC<SpreadsheetSyncModalProps> = ({
  isOpen,
  onClose,
  settings,
  onPullSuccess,
  onPushSuccess,
}) => {
  const [activeUrl, setActiveUrl] = useState(settings.googleWebAppUrl || settings.spreadsheetUrl || '');
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string[];
  } | null>(null);

  useEffect(() => {
    setActiveUrl(settings.googleWebAppUrl || settings.spreadsheetUrl || '');
  }, [settings.googleWebAppUrl, settings.spreadsheetUrl, isOpen]);

  if (!isOpen) return null;

  const handlePull = async () => {
    setIsPulling(true);
    setSyncStatus(null);
    try {
      const res = await storageService.pullDataFromSpreadsheet(activeUrl);
      setIsPulling(false);
      if (res.success) {
        setSyncStatus({
          type: 'success',
          message: res.message,
        });
        if (onPullSuccess) onPullSuccess(res.message);
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message,
          details: [
            'Pastikan Web App di Google Apps Script disetel "Siapa saja (Anyone)" dan "Jalankan sebagai: Saya".',
            'Jika menggunakan link Google Spreadsheet, pastikan Akses Umum disetel "Siapa saja yang memiliki link dapat melihat".',
            'Jika baru saja berganti akun Google, pastikan URL yang dimasukkan berasal dari akun Google yang baru.',
          ],
        });
      }
    } catch (err: any) {
      setIsPulling(false);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Gagal menarik data dari spreadsheet.',
      });
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    setSyncStatus(null);
    try {
      const res = await storageService.syncAllToSpreadsheet(activeUrl);
      setIsPushing(false);
      if (res.success) {
        setSyncStatus({
          type: 'success',
          message: res.message,
        });
        if (onPushSuccess) onPushSuccess(res.message);
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message,
          details: [
            'Untuk mengirim data (Push), dibutuhkan URL Google Apps Script Web App (bukan link spreadsheet biasa).',
            'Pastikan Web App disetel "Siapa saja (Anyone)".',
          ],
        });
      }
    } catch (err: any) {
      setIsPushing(false);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Gagal mengirim data ke spreadsheet.',
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setSyncStatus(null);
    try {
      const res = await storageService.testConnection(activeUrl);
      setIsTesting(false);
      if (res.success) {
        setSyncStatus({
          type: 'success',
          message: res.message,
          details: res.suggestions,
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message,
          details: res.suggestions,
        });
      }
    } catch (err: any) {
      setIsTesting(false);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Uji coba koneksi gagal.',
      });
    }
  };

  const handleSaveUrl = () => {
    const trimmed = activeUrl.trim();
    const norm = storageService.getSettings();
    const isSheet = trimmed.includes('docs.google.com/spreadsheets') || /^[a-zA-Z0-9-_]{30,55}$/.test(trimmed);
    const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const spreadsheetId = sheetMatch ? sheetMatch[1] : (isSheet ? trimmed : norm.spreadsheetId);

    const updated = {
      ...settings,
      googleWebAppUrl: !isSheet ? trimmed : settings.googleWebAppUrl,
      spreadsheetId: spreadsheetId || settings.spreadsheetId,
      spreadsheetUrl: isSheet ? trimmed : settings.spreadsheetUrl,
    };
    storageService.saveSettings(updated);
    setSyncStatus({
      type: 'info',
      message: 'Pengaturan Cloud Google Spreadsheet berhasil disimpan.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                Cloud Database & Sinkronisasi Online Sekolah
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Otomatis
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Penyimpanan cloud terpadu SDN Kapuk 06 Pagi — Otomatis terhubung ke seluruh murid & guru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-extrabold text-emerald-950 text-xs uppercase tracking-wide">
                  Cloud Server Aktif & Terhubung Otomatis
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Semua data tersimpan otomatis. Anda <b>tidak perlu lagi menyalin kode ke Google Apps Script</b> untuk berbagi dengan murid & guru.
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">
                Terakhir disinkronkan: <b>{settings.lastSyncTime || 'Realtime aktif'}</b>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePull}
                disabled={isPulling}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Quick Share Portal Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 text-xs block">
              🔗 Link Portal untuk Dibagikan ke Murid & Guru:
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 truncate">
                {typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://portal-sekolah.id'}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`);
                    setSyncStatus({
                      type: 'success',
                      message: 'Link Portal Sekolah berhasil disalin! Bagikan ke grup WhatsApp guru dan wali murid.',
                    });
                  }
                }}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors shadow-xs"
              >
                Salin Link
              </button>
            </div>
          </div>

          {/* Action Buttons: Tarik vs Kirim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tombol PULL / Tarik Data */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-300/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  Perbarui Data dari Cloud (PULL)
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Otomatis
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tarik data terbaru dari server cloud agar semua catatan jurnal dari murid dan guru langsung sinkron di layar Anda.
              </p>
              <button
                type="button"
                onClick={handlePull}
                disabled={isPulling || isPushing}
                className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'Menyinkronkan...' : 'Perbarui Data Sekarang'}</span>
              </button>
            </div>

            {/* Tombol PUSH / Cadangan Spreadsheet */}
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-300/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Kirim ke Google Sheets (Opsional)
                </span>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                  Cadangan
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Kirim seluruh data lokal (murid, guru, dan entri jurnal baru) ke Google Spreadsheet sebagai cadangan terpusat.
              </p>
              <button
                type="button"
                onClick={handlePush}
                disabled={isPushing || isPulling}
                className="w-full py-2.5 px-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Mengunggah...' : 'Kirim Data Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Alert Status Feedback */}
          {syncStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs animate-in fade-in space-y-1.5 ${
                syncStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : syncStatus.type === 'error'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-blue-50 border-blue-300 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2">
                {syncStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : syncStatus.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="font-bold">{syncStatus.message}</h5>
                  {syncStatus.details && syncStatus.details.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] list-disc list-inside opacity-90 font-medium">
                      {syncStatus.details.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Input Ganti URL / Link Spreadsheet */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-blue-700" />
                Pengaturan URL Web App atau Link Google Spreadsheet:
              </span>
              <button
                type="button"
                onClick={handleSaveUrl}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline"
              >
                Simpan URL
              </button>
            </div>

            <input
              type="text"
              value={activeUrl}
              onChange={(e) => setActiveUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec atau link spreadsheet"
              className="w-full font-mono text-[11px] px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-500">
              * Sistem secara otomatis membersihkan parameter multi-login seperti <code>/u/0/</code> agar dapat diakses oleh semua akun Google.
            </p>
          </div>

          {/* Panduan Susunan Sheet & Mengapa Beda Akun Gmail Tidak Sinkron */}
          <div className="space-y-3">
            {/* Ceklis Susunan Sheet */}
            <div className="p-4 rounded-2xl bg-blue-50/80 border-2 border-blue-200 text-blue-950 space-y-2">
              <h5 className="font-extrabold text-xs flex items-center gap-1.5 text-blue-900">
                <span>📋</span> Ceklis Susunan Sheet Google Spreadsheet (Agar Nama Tidak Kosong)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div className="p-2 bg-white rounded-lg border border-blue-200 space-y-1">
                  <span className="font-bold text-blue-900 block">1. Tab <code>DATA_MURID</code></span>
                  <p className="text-[10px] text-slate-500">
                    Baris 1: <code>ID | NISN | NIS | Nama Murid | Kelas | JK | Nama Orang Tua | No HP Orang Tua | PIN</code>
                  </p>
                  <span className="text-[10px] text-amber-700 font-semibold block">
                    * Hapus baris judul (Kop Surat) di baris 1-2 jika ada! Jadikan <b>Baris 1 langsung Nama Kolom</b>.
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-blue-200 space-y-1">
                  <span className="font-bold text-blue-900 block">2. Tab <code>DATA_GURU</code></span>
                  <p className="text-[10px] text-slate-500">
                    Baris 1: <code>ID | NIP | Nama Guru | Jabatan | Kelas Ampu | Email | No HP | PIN</code>
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    * Kolom wajib: NIP, Nama Guru, Jabatan, Kelas Ampu.
                  </span>
                </div>
              </div>
            </div>

            {/* Panduan Mengapa Beda Akun Gmail Tidak Sinkron & Solusinya */}
            <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 space-y-2.5">
              <h5 className="font-bold text-xs flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Mengapa Saat Dibuka di Akun Gmail Lain Data Belum Sinkron?
              </h5>
              <div className="text-[11px] text-amber-900 leading-relaxed space-y-2">
                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                  <span className="font-bold text-rose-700 block mb-1">
                    1. Akses Deploy Google Terkunci ke Organisasi / Hanya Saya
                  </span>
                  Jika Google Apps Script dibuat menggunakan akun dinas (seperti <code>@guru.sd.belajar.id</code>) atau saat deploy memilih <i>"Akses: Hanya dalam organisasi"</i>, maka <b>akun Gmail lain akan diblokir oleh Google (Error 403)</b>.
                </div>

                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                  <span className="font-bold text-emerald-800 block mb-1">
                    2. Solusi Permanen di Google Apps Script:
                  </span>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Buka Apps Script &gt; <b>Terapkan</b> &gt; <b>Kelola Penerapan</b>.</li>
                    <li>Pastikan <b>Jalankan sebagai: Saya (Me)</b> dan <b>Siapa yang memiliki akses: Siapa saja (Anyone)</b>.</li>
                  </ul>
                </div>

                <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                  <span className="font-bold text-blue-900 block mb-1">
                    3. Solusi Termudah: Gunakan Link Google Spreadsheet Langsung
                  </span>
                  Cukup bagikan Google Spreadsheet Anda dengan akses <b>"Siapa saja yang memiliki link dapat melihat (Viewer)"</b>, lalu salin link Spreadsheet ke kotak di atas.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">SDN Kapuk 06 Pagi Cloud Engine</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
