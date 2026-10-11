import { SchoolSettings, Murid, Guru, Jurnal7KAIH, JurnalMembaca } from '../types';
import {
  normalizeDateStringToWIB,
  normalizeTimeToHHMM,
  formatWaktuKirimWIB,
} from '../utils/dateUtils';

export interface NormalizedGoogleUrl {
  type: 'web_app' | 'spreadsheet' | 'unknown';
  cleanUrl: string;
  spreadsheetId?: string;
  isDomainSpecific: boolean;
  warnings: string[];
}

export interface GoogleSyncResult {
  success: boolean;
  message: string;
  source?: 'web_app' | 'gviz';
  data?: {
    murid: Murid[];
    guru: Guru[];
    jurnal7kaih: Jurnal7KAIH[];
    jurnalMembaca: JurnalMembaca[];
    pengaturan?: Partial<SchoolSettings>;
  };
  counts?: {
    murid: number;
    guru: number;
    kaih: number;
    membaca: number;
  };
  diagnostics?: string;
}

/**
 * Normalisasi URL Google Apps Script dan Google Spreadsheet
 * Memperbaiki masalah peralihan akun Google di Vercel & Chrome:
 * 1. Menghapus /u/0/, /u/1/ yang mengikat ke sesi akun Google tertentu
 * 2. Mendeteksi jika pengguna memasukkan URL Google Spreadsheet biasa (docs.google.com)
 * 3. Mendeteksi domain khusus seperti @guru.sd.belajar.id
 */
export function normalizeGoogleUrl(rawInput: string): NormalizedGoogleUrl {
  const trimmed = (rawInput || '').trim();
  const warnings: string[] = [];

  if (!trimmed) {
    return {
      type: 'unknown',
      cleanUrl: '',
      isDomainSpecific: false,
      warnings: ['URL atau ID kosong'],
    };
  }

  // 1. Cek apakah ini URL Google Spreadsheet (docs.google.com/spreadsheets/d/...)
  const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetMatch && sheetMatch[1]) {
    const spreadsheetId = sheetMatch[1];
    return {
      type: 'spreadsheet',
      cleanUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      spreadsheetId,
      isDomainSpecific: false,
      warnings: [],
    };
  }

  // Cek jika pengguna hanya memasukkan Spreadsheet ID mentah (44 karakter alfanumerik)
  if (/^[a-zA-Z0-9-_]{30,55}$/.test(trimmed)) {
    return {
      type: 'spreadsheet',
      cleanUrl: `https://docs.google.com/spreadsheets/d/${trimmed}/edit`,
      spreadsheetId: trimmed,
      isDomainSpecific: false,
      warnings: [],
    };
  }

  // 2. Cek apakah ini URL Google Apps Script (script.google.com/...)
  if (trimmed.includes('script.google.com')) {
    let clean = trimmed;

    // Bersihkan sesi multi-login Google (/u/0/, /u/1/, dll)
    // Sesi ini menyebabkan error 403 / mismatch saat akun Google berganti!
    if (/\/u\/\d+\//.test(clean)) {
      clean = clean.replace(/\/u\/\d+\//g, '/');
      warnings.push('Parameter multi-login (/u/0/) telah dibersihkan agar dapat diakses semua akun.');
    }

    // Cek domain khusus (seperti belajar.id)
    const isDomainSpecific = clean.includes('/a/macros/');
    if (isDomainSpecific) {
      warnings.push(
        'URL menggunakan domain khusus organisasi (@guru.sd.belajar.id). Akun Gmail biasa mungkin ditolak jika izin publik dibatasi oleh admin dinas.'
      );
    }

    // Standarisasi path /exec
    if (clean.includes('/exec')) {
      const execIndex = clean.indexOf('/exec');
      clean = clean.substring(0, execIndex + 5);
    }

    return {
      type: 'web_app',
      cleanUrl: clean,
      isDomainSpecific,
      warnings,
    };
  }

  return {
    type: 'unknown',
    cleanUrl: trimmed,
    isDomainSpecific: false,
    warnings: ['Format URL tidak dikenali sebagai Google Apps Script atau Google Spreadsheet.'],
  };
}

/**
 * Pengambilan data JSONP dari URL Google Apps Script (Bypass CORS di Vercel & Mobile)
 */
export function fetchJsonp(url: string, timeoutMs = 12000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('JSONP hanya dapat dijalankan di browser.'));
      return;
    }

    const callbackName = 'gSyncCb_' + Math.random().toString(36).substring(2, 9);
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      delete (window as any)[callbackName];
      const el = document.getElementById(callbackName);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };

    timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'Koneksi ke Google Apps Script melebihi batas waktu (12 detik). Pastikan Web App disetel "Jalankan sebagai: Saya" dan "Siapa yang memiliki akses: Siapa saja (Anyone)".'
        )
      );
    }, timeoutMs);

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    const script = document.createElement('script');
    script.id = callbackName;
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}&t=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      reject(
        new Error(
          'Gagal terhubung ke Google Apps Script. Akun Google Anda mungkin tidak memiliki izin atau deploy belum "Siapa saja (Anyone)".'
        )
      );
    };

    document.head.appendChild(script);
  });
}

/**
 * Temukan nilai dalam baris spreadsheet terlepas dari variasi huruf besar/kecil, spasi, atau nama kolom
 */
export function findRowVal(row: Record<string, any>, aliases: string[]): any {
  if (!row || typeof row !== 'object') return '';
  const keys = Object.keys(row);

  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') {
      return row[alias];
    }
  }

  for (const alias of aliases) {
    const aliasLower = alias.toLowerCase();
    for (const key of keys) {
      if (key.toLowerCase() === aliasLower) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      }
    }
  }

  for (const alias of aliases) {
    const aliasClean = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!aliasClean) continue;
    for (const key of keys) {
      const keyClean = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keyClean === aliasClean) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return val;
      }
    }
  }

  return '';
}

export function normalizeCanonicalKelas(val: any): string {
  if (!val) return 'Kelas 1A';
  const str = String(val).trim();
  let clean = str.replace(/^kelas\s*/i, '').trim().toUpperCase();
  clean = clean
    .replace(/^I\s*([A-Z])?$/i, '1$1')
    .replace(/^II\s*([A-Z])?$/i, '2$1')
    .replace(/^III\s*([A-Z])?$/i, '3$1')
    .replace(/^IV\s*([A-Z])?$/i, '4$1')
    .replace(/^V\s*([A-Z])?$/i, '5$1')
    .replace(/^VI\s*([A-Z])?$/i, '6$1');
  if (/^[1-6][A-Z]$/.test(clean)) {
    return `Kelas ${clean}`;
  }
  return str.startsWith('Kelas ') ? str : (clean ? `Kelas ${clean}` : str);
}

/**
 * Mengambil data sheet secara langsung dari Google Spreadsheet via GViz API (Tanpa butuh Apps Script!)
 * Syarat: Spreadsheet diatur "Siapa saja yang memiliki link dapat melihat (Viewer)"
 */
export async function fetchSheetViaGviz(spreadsheetId: string, sheetName: string): Promise<any[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve([]);
      return;
    }

    const callbackName = 'gvizCb_' + Math.random().toString(36).substring(2, 9);
    let timer: any = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      delete (window as any)[callbackName];
      const el = document.getElementById(callbackName);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };

    timer = setTimeout(() => {
      cleanup();
      resolve([]); // timeout gracefully with empty array
    }, 8000);

    (window as any)[callbackName] = (response: any) => {
      cleanup();
      try {
        if (!response || !response.table) {
          resolve([]);
          return;
        }

        const table = response.table;
        const cols = (table.cols || []).map((c: any) => (c && c.label ? String(c.label).trim() : ''));
        const rows = table.rows || [];

        // Deteksi baris header sebenarnya (menangani sheet dengan kop surat atau baris judul atas)
        let headers = cols;
        let startIndex = 0;
        const colsHaveKeywords = cols.some((c: string) => {
          const cl = c.toLowerCase();
          return cl.includes('nama') || cl.includes('nisn') || cl.includes('nip') || cl.includes('kelas') || cl.includes('rombel') || cl.includes('judul');
        });

        if (!colsHaveKeywords && rows.length > 0) {
          // Pindai hingga 8 baris pertama untuk mencari baris header yang sesungguhnya
          for (let r = 0; r < Math.min(rows.length, 8); r++) {
            const cellVals = (rows[r].c || []).map((cell: any) =>
              cell && cell.v !== null ? String(cell.v).trim() : (cell && cell.f !== null ? String(cell.f).trim() : '')
            );
            const rowText = cellVals.join(' ').toLowerCase();
            if (
              rowText.includes('nama') ||
              rowText.includes('nisn') ||
              rowText.includes('nip') ||
              rowText.includes('kelas') ||
              rowText.includes('rombel') ||
              rowText.includes('judul')
            ) {
              headers = cellVals;
              startIndex = r + 1;
              break;
            }
          }
        }

        const result: any[] = [];
        for (let i = startIndex; i < rows.length; i++) {
          const rowObj: any = {};
          const cells = rows[i].c || [];
          let hasAnyValue = false;

          for (let j = 0; j < headers.length; j++) {
            const h = headers[j] || `col_${j}`;
            const val = cells[j] && cells[j].v !== null ? cells[j].v : (cells[j] && cells[j].f !== null ? cells[j].f : '');
            rowObj[h] = val;
            if (val !== '') hasAnyValue = true;
          }

          if (hasAnyValue) {
            result.push(rowObj);
          }
        }

        resolve(result);
      } catch (e) {
        console.warn('Gviz parse error for ' + sheetName, e);
        resolve([]);
      }
    };

    const script = document.createElement('script');
    script.id = callbackName;
    const sheetParam = sheetName && sheetName.trim() ? `&sheet=${encodeURIComponent(sheetName.trim())}` : '';
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=responseHandler:${callbackName}${sheetParam}&t=${Date.now()}`;
    script.src = url;
    script.onerror = () => {
      cleanup();
      resolve([]);
    };

    document.head.appendChild(script);
  });
}

/**
 * Coba ambil sheet dari beberapa kandidat nama tab (misal DATA_MURID vs DATA MURID vs Data Siswa)
 */
export async function fetchSheetViaGvizSmart(spreadsheetId: string, candidateNames: string[]): Promise<any[]> {
  for (const name of candidateNames) {
    const data = await fetchSheetViaGviz(spreadsheetId, name);
    if (data && data.length > 0) {
      return data;
    }
  }
  return [];
}

/**
 * Tarik seluruh data dari Google Spreadsheet via GViz API (Direct Google Sheet Access)
 */
export async function pullAllFromGviz(spreadsheetId: string): Promise<GoogleSyncResult> {
  try {
    const [rawMurid, rawGuru, rawKaih, rawMembaca, rawPengaturan] = await Promise.all([
      fetchSheetViaGvizSmart(spreadsheetId, [
        'DATA_MURID',
        'DATA MURID',
        'Data Murid',
        'DATA SISWA',
        'Data Siswa',
        'MURID',
        'Murid',
        'SISWA',
        'Siswa',
        'DAFTAR MURID',
        'Daftar Murid',
        'DAFTAR SISWA',
        'Daftar Siswa',
        'PESERTA DIDIK',
        'Peserta Didik',
        'DATA PESERTA DIDIK',
        'Sheet1',
        'Lembar1',
        'Lembar 1',
        'Sheet 1',
        '', // Jika nama tab tidak ada yang cocok, baca tab pertama / default!
      ]),
      fetchSheetViaGvizSmart(spreadsheetId, [
        'DATA_GURU',
        'DATA GURU',
        'Data Guru',
        'GURU',
        'Guru',
        'DAFTAR GURU',
        'Daftar Guru',
        'DATA PENDIDIK',
        'PENDIDIK',
        'Sheet2',
        'Lembar2',
        'Lembar 2',
        'Sheet 2',
      ]),
      fetchSheetViaGvizSmart(spreadsheetId, [
        'JURNAL_7KAIH',
        'JURNAL 7 KAIH',
        'JURNAL 7KAIH',
        '7KAIH',
        'JURNAL7KAIH',
      ]),
      fetchSheetViaGvizSmart(spreadsheetId, [
        'JURNAL_MEMBACA',
        'JURNAL MEMBACA',
        'MEMBACA',
        'LITERASI',
        'JURNAL LITERASI',
      ]),
      fetchSheetViaGvizSmart(spreadsheetId, [
        'PENGATURAN',
        'DATA_PENGATURAN',
        'SETTINGS',
        'Pengaturan',
      ]),
    ]);

    const parsedMurid = parseRawMurid(rawMurid);
    const parsedGuru = parseRawGuru(rawGuru);
    const parsedKaih = parseRaw7Kaih(rawKaih);
    const parsedMembaca = parseRawMembaca(rawMembaca);

    const pengaturanObj: Partial<SchoolSettings> = {};
    if (Array.isArray(rawPengaturan)) {
      rawPengaturan.forEach((row) => {
        const key = row.Key || row.key;
        const val = row.Value || row.value;
        if (key && val) {
          (pengaturanObj as any)[key] = val;
        }
      });
    }

    const totalCount = parsedMurid.length + parsedGuru.length + parsedKaih.length + parsedMembaca.length;
    if (totalCount === 0) {
      return {
        success: false,
        source: 'gviz',
        message:
          'Spreadsheet ditemukan tetapi sheet DATA_MURID, DATA_GURU, atau JURNAL kosong atau belum dibagikan dengan akses "Siapa saja yang memiliki link sebagai Pelihat".',
      };
    }

    return {
      success: true,
      source: 'gviz',
      message: `Berhasil menarik ${parsedMurid.length} murid, ${parsedGuru.length} guru, dan ${
        parsedKaih.length + parsedMembaca.length
      } jurnal langsung dari Google Spreadsheet!`,
      data: {
        murid: parsedMurid,
        guru: parsedGuru,
        jurnal7kaih: parsedKaih,
        jurnalMembaca: parsedMembaca,
        pengaturan: pengaturanObj,
      },
      counts: {
        murid: parsedMurid.length,
        guru: parsedGuru.length,
        kaih: parsedKaih.length,
        membaca: parsedMembaca.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      source: 'gviz',
      message: `Gagal membaca Google Spreadsheet: ${err?.message || 'Pastikan link spreadsheet sudah dibagikan publik.'}`,
    };
  }
}

/**
 * Tarik seluruh data dari Google Apps Script Web App
 */
export async function pullAllFromAppsScript(webAppUrl: string): Promise<GoogleSyncResult> {
  const norm = normalizeGoogleUrl(webAppUrl);
  const cleanUrl = norm.cleanUrl;

  // Siapkan kandidat URL (Universal macro path dan domain-specific path)
  // Menghilangkan masalah mismatch saat pengguna login dengan akun Google berbeda
  const candidates: string[] = [];
  const deployMatch = cleanUrl.match(/\/s\/([a-zA-Z0-9-_]+)/);
  if (deployMatch && deployMatch[1]) {
    const deployId = deployMatch[1];
    candidates.push(`https://script.google.com/macros/s/${deployId}/exec`);
    if (cleanUrl.includes('belajar.id')) {
      candidates.push(`https://script.google.com/a/macros/guru.sd.belajar.id/s/${deployId}/exec`);
    }
  }
  if (!candidates.includes(cleanUrl) && cleanUrl) {
    candidates.push(cleanUrl);
  }

  let rawResponse: any = null;

  for (const targetUrl of candidates) {
    // 1. Coba ambil via Direct Fetch (GET ?api=json) dengan credentials: 'omit'
    try {
      const separator = targetUrl.includes('?') ? '&' : '?';
      const fetchUrl = `${targetUrl}${separator}api=json&t=${Date.now()}`;
      const res = await fetch(fetchUrl, {
        method: 'GET',
        credentials: 'omit', // Mencegah kirim cookies Google user aktif agar tidak dialihkan ke Google login
        redirect: 'follow',
      });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.status === 'success' || json.data)) {
          rawResponse = json;
          break;
        }
      }
    } catch {
      // CORS blocked on direct fetch in browser/Vercel
    }

    // 2. Fallback via JSONP (Bypass CORS)
    try {
      const jsonpRes = await fetchJsonp(targetUrl, 15000);
      if (jsonpRes && (jsonpRes.status === 'success' || jsonpRes.data)) {
        rawResponse = jsonpRes;
        break;
      }
    } catch {
      // Coba kandidat berikutnya
    }
  }

  if (!rawResponse || !rawResponse.data) {
    return {
      success: false,
      source: 'web_app',
      message: 'Koneksi ke Google Apps Script belum berhasil memuat data. Akun Google aktif kemungkinan ditolak karena Web App belum disetel "Siapa saja (Anyone)" atau dibatasi domain organisasi (@guru.sd.belajar.id). Masukkan link Google Spreadsheet langsung sebagai alternatif termudah yang 100% selalu berhasil.',
    };
  }

  const received = rawResponse.data;
  const parsedMurid = parseRawMurid(received.murid || []);
  const parsedGuru = parseRawGuru(received.guru || []);
  const parsedKaih = parseRaw7Kaih(received.jurnal7kaih || []);
  const parsedMembaca = parseRawMembaca(received.jurnalMembaca || []);

  return {
    success: true,
    source: 'web_app',
    message: `Sinkronisasi berhasil! Berhasil menarik ${parsedMurid.length} murid, ${parsedGuru.length} guru, dan ${
      parsedKaih.length + parsedMembaca.length
    } jurnal dari Google Spreadsheet.`,
    data: {
      murid: parsedMurid,
      guru: parsedGuru,
      jurnal7kaih: parsedKaih,
      jurnalMembaca: parsedMembaca,
      pengaturan: received.pengaturan,
    },
    counts: {
      murid: parsedMurid.length,
      guru: parsedGuru.length,
      kaih: parsedKaih.length,
      membaca: parsedMembaca.length,
    },
  };
}

/**
 * Uji koneksi dan tampilkan diagnostik lengkap untuk Google Apps Script & Google Spreadsheet
 */
export async function testGoogleConnectionDetailed(urlOrId: string): Promise<{
  success: boolean;
  message: string;
  type: 'web_app' | 'spreadsheet' | 'unknown';
  cleanUrl: string;
  counts?: { murid: number; guru: number; kaih: number; membaca: number };
  warnings: string[];
  suggestions: string[];
}> {
  const norm = normalizeGoogleUrl(urlOrId);
  const suggestions: string[] = [];

  if (norm.type === 'spreadsheet' && norm.spreadsheetId) {
    const res = await pullAllFromGviz(norm.spreadsheetId);
    if (res.success && res.counts) {
      return {
        success: true,
        message: `Koneksi ke Google Spreadsheet berhasil! Terbaca ${res.counts.murid} murid, ${res.counts.guru} guru, dan ${
          res.counts.kaih + res.counts.membaca
        } jurnal.`,
        type: 'spreadsheet',
        cleanUrl: norm.cleanUrl,
        counts: res.counts,
        warnings: norm.warnings,
        suggestions: [
          'Untuk mendukung kirim data (dua arah), Anda juga dapat menerapkan Google Apps Script Web App.',
        ],
      };
    } else {
      return {
        success: false,
        message: res.message,
        type: 'spreadsheet',
        cleanUrl: norm.cleanUrl,
        warnings: norm.warnings,
        suggestions: [
          'Buka Google Spreadsheet > Klik tombol "Bagikan" di pojok kanan atas.',
          'Ubah Akses Umum menjadi "Siapa saja yang memiliki link" sebagai "Pelihat (Viewer)".',
          'Pastikan nama sheet di spreadsheet adalah: DATA_MURID, DATA_GURU, JURNAL_7KAIH, JURNAL_MEMBACA.',
        ],
      };
    }
  }

  if (norm.type === 'web_app') {
    const res = await pullAllFromAppsScript(norm.cleanUrl);
    if (res.success && res.counts) {
      return {
        success: true,
        message: `Koneksi Google Apps Script berhasil! Terhubung dengan ${res.counts.murid} murid, ${res.counts.guru} guru, ${
          res.counts.kaih + res.counts.membaca
        } jurnal.`,
        type: 'web_app',
        cleanUrl: norm.cleanUrl,
        counts: res.counts,
        warnings: norm.warnings,
        suggestions: [
          'Koneksi dua arah (Tarik & Kirim data) siap digunakan di Vercel dan seluruh perangkat.',
        ],
      };
    } else {
      if (norm.isDomainSpecific) {
        suggestions.push(
          'Akun Google Anda saat ini kemungkinan berbeda domain dari pemilik Web App (@guru.sd.belajar.id). Buat spreadsheet baru di akun Gmail biasa (@gmail.com).'
        );
      }
      suggestions.push(
        'Buka Google Apps Script > Klik "Terapkan (Deploy)" > "Kelola Penerapan".',
        'Pastikan "Jalankan sebagai" adalah: "SAYA" (bukan pengguna yang mengakses).',
        'Pastikan "Siapa yang memiliki akses" adalah: "SIAPA SAJA" (Anyone).'
      );
      return {
        success: false,
        message: res.message,
        type: 'web_app',
        cleanUrl: norm.cleanUrl,
        warnings: norm.warnings,
        suggestions,
      };
    }
  }

  return {
    success: false,
    message: 'URL yang dimasukkan bukan URL Google Apps Script atau Google Spreadsheet yang valid.',
    type: 'unknown',
    cleanUrl: norm.cleanUrl,
    warnings: norm.warnings,
    suggestions: [
      'Contoh URL Web App: https://script.google.com/macros/s/AKfycb.../exec',
      'Contoh URL Spreadsheet: https://docs.google.com/spreadsheets/d/1BxiMVs.../edit',
    ],
  };
}

// -------------------------------------------------------------------------
// Helper Parsers
// -------------------------------------------------------------------------

export function parseRawMurid(rawMurid: any[]): Murid[] {
  if (!Array.isArray(rawMurid)) return [];
  return rawMurid
    .map((row: any, idx: number) => {
      if (!row || typeof row !== 'object') return null;

      // 1. Coba cari nama dari alias populer
      let rawNama = findRowVal(row, [
        'Nama Murid',
        'Nama Siswa',
        'Nama Lengkap',
        'Nama Peserta Didik',
        'Nama',
        'NAMA',
        'nama',
        'Peserta Didik',
        'Siswa',
        'Murid',
      ]);

      // 2. Jika nama belum ditemukan, cari di semua kunci object
      if (!rawNama || String(rawNama).trim() === '') {
        const keys = Object.keys(row);
        for (const k of keys) {
          const kLower = k.toLowerCase();
          if (
            (kLower.includes('nama') || kLower.includes('siswa') || kLower.includes('murid')) &&
            !kLower.includes('ortu') && !kLower.includes('orangtua') && !kLower.includes('wali') && !kLower.includes('guru')
          ) {
            const cand = row[k];
            if (cand && String(cand).trim().length >= 2) {
              rawNama = cand;
              break;
            }
          }
        }
      }

      // 3. Fallback pemindai isi sel: cari teks yang berkarakteristik nama orang
      if (!rawNama || String(rawNama).trim() === '') {
        const allKeys = Object.keys(row);
        for (const ak of allKeys) {
          const valStr = String(row[ak] || '').trim();
          if (
            valStr.length >= 3 && valStr.length <= 50 &&
            !/^[0-9]+$/.test(valStr) &&
            !/^[1-6][A-Z]$/i.test(valStr) &&
            !/^kelas\s*/i.test(valStr) &&
            valStr !== 'L' && valStr !== 'P' && valStr !== 'Laki-laki' && valStr !== 'Perempuan' &&
            !valStr.includes('/') && !valStr.includes('-') &&
            /^[a-zA-Z\s.,']+$/.test(valStr)
          ) {
            rawNama = valStr;
            break;
          }
        }
      }

      const nama = String(rawNama || '').trim();
      if (
        !nama ||
        nama === '-' ||
        nama === '--' ||
        ['nama murid', 'nama siswa', 'nama lengkap', 'nama peserta didik', 'nama', 'undefined', 'null'].includes(
          nama.toLowerCase()
        )
      ) {
        return null;
      }

      const id = String(findRowVal(row, ['ID', 'id']) || `m-${Date.now()}-${idx}`);
      const rawNisn = String(findRowVal(row, ['NISN', 'nisn', 'No NISN', 'Nomor NISN', 'No. NISN']) || '');
      const nisn = rawNisn.replace(/[^0-9]/g, '');
      const rawNis = String(findRowVal(row, ['NIS', 'nis', 'No NIS', 'Nomor NIS', 'No. NIS']) || '');
      const nis = rawNis.replace(/[^0-9]/g, '') || nisn.slice(-4) || `00${idx + 1}`;

      const rawKelas = findRowVal(row, ['Kelas', 'kelas', 'Rombel', 'rombel', 'Kelas/Rombel', 'Tingkat']);
      const kelas = normalizeCanonicalKelas(rawKelas || 'Kelas 1A');

      const rawJk = String(
        findRowVal(row, [
          'Jenis Kelamin (L/P)',
          'Jenis Kelamin',
          'JK',
          'jk',
          'L/P',
          'L / P',
          'Gender',
          'gender',
          'Kelamin',
        ]) || ''
      );
      const jkStr = rawJk.trim().toUpperCase();
      let jk: 'L' | 'P' = 'L';
      if (
        jkStr === 'P' ||
        jkStr === 'PR' ||
        jkStr === 'W' ||
        jkStr.includes('PEREMPUAN') ||
        jkStr.includes('WANITA') ||
        jkStr.endsWith('(P)') ||
        jkStr.startsWith('P (') ||
        jkStr.startsWith('P')
      ) {
        jk = 'P';
      } else if (
        jkStr === 'L' ||
        jkStr === 'LK' ||
        jkStr.includes('LAKI') ||
        jkStr.includes('PRIA') ||
        jkStr.endsWith('(L)') ||
        jkStr.startsWith('L')
      ) {
        jk = 'L';
      }

      // Cek kata kunci nama wanita jika kolom jenis kelamin kosong
      if (!rawJk && nama) {
        const nUp = nama.toUpperCase();
        if (
          ['PUTRI', 'AISYAH', 'SITI', 'AZZAHRA', 'AZ-ZAHRA', 'ALINA', 'ALITA', 'ALMEERA', 'AQILA', 'AZIZAH', 'BILQIS', 'CHARISYA', 'DEVIRA', 'DEWI', 'EDRHEA'].some(
            (k) => nUp.includes(k)
          )
        ) {
          jk = 'P';
        }
      }

      const namaOrangTua = String(
        findRowVal(row, [
          'Nama Orang Tua',
          'Nama Orang Tua / Wali',
          'Nama Ayah / Ibu',
          'Nama Ortu',
          'Ortu',
          'Wali',
          'Orang Tua',
          'Ayah',
          'Ibu',
        ]) || 'Orang Tua / Wali'
      ).trim();

      const noHpOraangTua = String(
        findRowVal(row, [
          'No HP Orang Tua',
          'No HP',
          'No WA',
          'No WhatsApp',
          'Nomor HP',
          'Telepon',
          'HP',
          'Kontak Ortu',
        ]) || '081200000000'
      ).trim();

      const pin = String(findRowVal(row, ['PIN', 'pin', 'Password']) || '1234').trim();

      return {
        id,
        nisn: nisn || `01${idx.toString().padStart(8, '0')}`,
        nis,
        nama,
        kelas,
        jenisKelamin: jk as 'L' | 'P',
        namaOrangTua,
        noHpOraangTua,
        pin: pin || '1234',
      };
    })
    .filter((m): m is Murid => Boolean(m && m.nama && m.nama.length >= 2 && m.nama.toLowerCase() !== 'nama murid'));
}

export function parseRawGuru(rawGuru: any[]): Guru[] {
  if (!Array.isArray(rawGuru)) return [];
  return rawGuru
    .map((row: any, idx: number) => {
      if (!row || typeof row !== 'object') return null;

      // 1. Coba cari nama guru dari alias
      let rawNama = findRowVal(row, [
        'Nama Guru',
        'Nama Pendidik',
        'Nama Lengkap',
        'Nama',
        'NAMA',
        'nama',
        'Guru',
        'GURU',
      ]);

      // 2. Scan kunci object
      if (!rawNama || String(rawNama).trim() === '') {
        const keys = Object.keys(row);
        for (const k of keys) {
          const kLower = k.toLowerCase();
          if (
            (kLower.includes('nama') || kLower.includes('guru') || kLower.includes('pendidik')) &&
            !kLower.includes('ortu') && !kLower.includes('siswa') && !kLower.includes('murid')
          ) {
            const cand = row[k];
            if (cand && String(cand).trim().length >= 2) {
              rawNama = cand;
              break;
            }
          }
        }
      }

      // 3. Scan isi sel
      if (!rawNama || String(rawNama).trim() === '') {
        const allKeys = Object.keys(row);
        for (const ak of allKeys) {
          const valStr = String(row[ak] || '').trim();
          if (
            valStr.length >= 3 && valStr.length <= 60 &&
            !/^[0-9]+$/.test(valStr) &&
            !valStr.includes('@') &&
            /^[a-zA-Z\s.,']+$/.test(valStr)
          ) {
            rawNama = valStr;
            break;
          }
        }
      }

      const nama = String(rawNama || '').trim();
      if (
        !nama ||
        nama.length < 2 ||
        ['nama guru', 'nama lengkap', 'nama pendidik', 'nama', 'undefined', 'null', '-'].includes(
          nama.toLowerCase()
        )
      ) {
        return null;
      }

      const id = String(findRowVal(row, ['ID', 'id']) || `g-${Date.now()}-${idx}`);
      const nip = String(findRowVal(row, ['NIP', 'nip', 'NIP/NUPTK', 'NUPTK', 'nuptk']) || '').trim();
      const jabatan = String(findRowVal(row, ['Jabatan', 'jabatan', 'Peran', 'Posisi', 'Tugas']) || 'Wali Kelas').trim();
      const rawAmpu = findRowVal(row, ['Kelas Ampu', 'kelasAmpu', 'Wali Kelas', 'Kelas', 'kelas']);
      const kelasAmpu = rawAmpu ? normalizeCanonicalKelas(rawAmpu) : 'Semua Kelas';
      const email = String(findRowVal(row, ['Email', 'email', 'Surel']) || '').trim();
      const noHp = String(findRowVal(row, ['No HP', 'noHp', 'No WA', 'HP', 'Telepon']) || '').trim();
      const pin = String(findRowVal(row, ['PIN', 'pin', 'Password']) || '1234').trim();

      return {
        id,
        nip: nip || `1985${idx.toString().padStart(14, '0')}`,
        nama,
        jabatan,
        kelasAmpu,
        email: email || `${nama.toLowerCase().replace(/[^a-z]/g, '')}@guru.sd.belajar.id`,
        noHp: noHp || '081399001100',
        pin: pin || '1234',
      };
    })
    .filter((g): g is Guru => Boolean(g && g.nama && g.nama.length >= 2 && g.nama.toLowerCase() !== 'nama guru'));
}

export function parseRaw7Kaih(rawKaih: any[]): Jurnal7KAIH[] {
  if (!Array.isArray(rawKaih)) return [];
  return rawKaih
    .map((row: any, idx: number) => {
      const id = row.ID || row.id || `kaih-${Date.now()}-${idx}`;
      const rawTanggal = String(row.Tanggal || row.tanggal || '').trim();
      const tanggal = normalizeDateStringToWIB(rawTanggal);
      const muridId = String(row['Murid ID'] || row.muridId || '').trim();
      const muridNama = String(row['Nama Murid'] || row.muridNama || '').trim();
      const kelas = String(row.Kelas || row.kelas || '').trim();
      const rawJamBangun = row['Jam Bangun'] || row.jamBangun;
      const jamBangun = normalizeTimeToHHMM(rawJamBangun) || (typeof rawJamBangun === 'string' && rawJamBangun.length === 5 ? rawJamBangun : '05:00');
      const bangunPagiChecked = String(row['Bangun Pagi'] || row.bangunPagiChecked || '').toUpperCase() === 'YA';

      const ibadahRaw = row.Ibadah || row.ibadahChecklist || '';
      const ibadahChecklist = Array.isArray(ibadahRaw)
        ? ibadahRaw
        : String(ibadahRaw).split(',').map((s) => s.trim()).filter(Boolean);

      const isBerhalangan =
        String(row.sedangBerhalangan || '').toLowerCase() === 'true' ||
        ibadahChecklist.some((item: string) => item.toLowerCase().includes('berhalangan'));

      const olahragaDesc = String(row.Olahraga || row.olahragaDesc || '').trim();

      const makanRaw = row['Makan Sehat Habits'] || row.makanSehatHabits || '';
      const makanSehatHabits = Array.isArray(makanRaw)
        ? makanRaw
        : String(makanRaw).split(',').map((s) => s.trim()).filter(Boolean);

      const belajarDesc = String(row['Belajar (Materi & Menit)'] || row.Belajar || row.belajarDesc || '').trim();
      const bantuOrangTuaDesc = String(row['Bantu Orang Tua'] || row.bantuOrangTuaDesc || '').trim();
      const rawJamTidur = row['Jam Tidur'] || row.jamTidur;
      const jamTidur = normalizeTimeToHHMM(rawJamTidur) || (typeof rawJamTidur === 'string' && rawJamTidur.length === 5 ? rawJamTidur : '21:00');
      const catatanOrangTua = String(row['Catatan Ortu'] || row.catatanOrangTua || '').trim();
      const status = (String(row.Status || row.status || 'pending').toLowerCase() === 'verified'
        ? 'verified'
        : 'pending') as 'pending' | 'verified';
      const feedbackGuru = String(row['Feedback Guru'] || row.feedbackGuru || '').trim();
      const rating = Number(row.Rating || row.rating || 0);
      const verifiedAt = String(row['Verified At'] || row.verifiedAt || '').trim();
      const verifiedBy = String(row['Verified By'] || row.verifiedBy || '').trim();

      const rawSubmittedAt = String(row.SubmittedAt || row.submittedAt || row['Waktu Kirim'] || row.Timestamp || row.timestamp || '').trim();
      const rawJamKirim = String(row.JamKirim || row.jamKirim || row['Jam Kirim'] || '').trim();
      const waktuKirim = formatWaktuKirimWIB(rawSubmittedAt, rawJamKirim, id);

      return {
        id,
        tanggal,
        muridId,
        muridNama,
        kelas,
        jamBangun,
        bangunPagiChecked,
        ibadahChecklist,
        sedangBerhalangan: isBerhalangan,
        olahragaChecked: olahragaDesc !== '-' && olahragaDesc !== '',
        olahragaDesc,
        makanSehatChecked: makanSehatHabits.length > 0,
        makanSehatHabits,
        belajarChecked: belajarDesc !== '-' && belajarDesc !== '',
        belajarDesc,
        durasiBelajarMenit: 30,
        bantuOrangTuaChecked: bantuOrangTuaDesc !== '-' && bantuOrangTuaDesc !== '',
        bantuOrangTuaDesc,
        jamTidur,
        tidurTepatWaktuChecked: !!jamTidur,
        refleksiMurid: '',
        catatanOrangTua,
        parafOrangTua: true,
        status,
        submittedAt: rawSubmittedAt || waktuKirim.lengkap,
        jamKirim: waktuKirim.jam,
        feedbackGuru,
        rating,
        verifiedAt,
        verifiedBy,
      };
    })
    .filter((k: Jurnal7KAIH) => k.muridNama && k.muridNama.toLowerCase() !== 'nama murid');
}

export function parseRawMembaca(rawMembaca: any[]): JurnalMembaca[] {
  if (!Array.isArray(rawMembaca)) return [];
  return rawMembaca
    .map((row: any, idx: number) => {
      const id = row.ID || row.id || `baca-${Date.now()}-${idx}`;
      const rawTanggal = String(row.Tanggal || row.tanggal || '').trim();
      const tanggal = normalizeDateStringToWIB(rawTanggal);
      const muridId = String(row['Murid ID'] || row.muridId || '').trim();
      const muridNama = String(row['Nama Murid'] || row.muridNama || '').trim();
      const kelas = String(row.Kelas || row.kelas || '').trim();
      const judulBuku = String(row['Judul Buku'] || row.judulBuku || '').trim();
      const penulis = String(row.Penulis || row.penulis || '').trim();
      const rawKategori = String(row.Kategori || row.kategori || 'Fiksi / Dongeng').trim();
      const validCategories: JurnalMembaca['kategori'][] = [
        'Cerita Rakyat',
        'Fiksi / Dongeng',
        'Ensiklopedia / IPTEK',
        'Buku Pelajaran',
        'Biografi / Pahlawan',
        'Komik Edukasi',
        'Lainnya',
      ];
      const kategori: JurnalMembaca['kategori'] =
        validCategories.find((c) => c.toLowerCase() === rawKategori.toLowerCase()) ||
        (rawKategori.toLowerCase().includes('fiksi')
          ? 'Fiksi / Dongeng'
          : rawKategori.toLowerCase().includes('rakyat')
          ? 'Cerita Rakyat'
          : rawKategori.toLowerCase().includes('pelajaran')
          ? 'Buku Pelajaran'
          : rawKategori.toLowerCase().includes('ensiklopedia')
          ? 'Ensiklopedia / IPTEK'
          : rawKategori.toLowerCase().includes('biografi')
          ? 'Biografi / Pahlawan'
          : rawKategori.toLowerCase().includes('komik')
          ? 'Komik Edukasi'
          : 'Lainnya');

      const rawSubmittedAt = String(row.SubmittedAt || row.submittedAt || row['Waktu Kirim'] || row.Timestamp || row.timestamp || '').trim();
      const rawJamKirim = String(row.JamKirim || row.jamKirim || row['Jam Kirim'] || '').trim();
      const waktuKirim = formatWaktuKirimWIB(rawSubmittedAt, rawJamKirim, id);

      return {
        id,
        tanggal,
        muridId,
        muridNama,
        kelas,
        judulBuku,
        penulis,
        penerbit: String(row.Penerbit || row.penerbit || '').trim(),
        kategori,
        halamanAwal: Number(findRowVal(row, ['Halaman Awal', 'Hal Awal', 'halamanAwal']) || 1),
        halamanAkhir: Number(findRowVal(row, ['Halaman Akhir', 'Hal Akhir', 'halamanAkhir']) || 10),
        durasiMenit: Number(findRowVal(row, ['Durasi', 'durasiMenit', 'Durasi (Menit)']) || 15),
        ringkasan: String(row.Ringkasan || row.ringkasan || '').trim(),
        kesan: (row.Kesan || row.kesan || 'Sangat Seru') as any,
        status: (String(row.Status || row.status || 'pending').toLowerCase() === 'verified'
          ? 'verified'
          : 'pending') as 'pending' | 'verified',
        submittedAt: rawSubmittedAt || waktuKirim.lengkap,
        jamKirim: waktuKirim.jam,
        feedbackGuru: String(row['Feedback Guru'] || row.feedbackGuru || '').trim(),
        rating: Number(row.Rating || row.rating || 0),
        verifiedAt: String(row['Verified At'] || row.verifiedAt || '').trim(),
        verifiedBy: String(row['Verified By'] || row.verifiedBy || '').trim(),
      };
    })
    .filter((b: JurnalMembaca) => b.muridNama && b.muridNama.toLowerCase() !== 'nama murid');
}
