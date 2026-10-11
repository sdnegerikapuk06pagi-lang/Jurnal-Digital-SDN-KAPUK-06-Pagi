import * as XLSX from 'xlsx';
import { Murid, Guru, DAFTAR_KELAS } from '../types';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  warnings: string[];
}

/**
 * Normalizes class strings to match DAFTAR_KELAS format (e.g. "Kelas 1A", "Kelas 4B")
 */
export function normalizeKelas(rawKelas: string | undefined, fallbackKelas?: string): string {
  if (!rawKelas || !rawKelas.trim()) {
    return fallbackKelas || 'Kelas 1A';
  }
  const clean = rawKelas.trim();
  // If already exactly in DAFTAR_KELAS
  if (DAFTAR_KELAS.includes(clean as any)) {
    return clean;
  }

  // Handle patterns like "1A", "1-A", "1 A", "Kelas1A", "IV A", etc.
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const k of DAFTAR_KELAS) {
    const kNormalized = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const shortCode = kNormalized.replace('kelas', '');
    if (lower === kNormalized || lower === shortCode) {
      return k;
    }
  }

  // Handle Roman numerals if any (e.g. "iva" -> "Kelas 4A")
  const romanMap: Record<string, string> = {
    'ia': 'Kelas 1A', 'ib': 'Kelas 1B',
    'iia': 'Kelas 2A', 'iib': 'Kelas 2B',
    'iiia': 'Kelas 3A', 'iiib': 'Kelas 3B',
    'iva': 'Kelas 4A', 'ivb': 'Kelas 4B',
    'va': 'Kelas 5A', 'vb': 'Kelas 5B',
    'via': 'Kelas 6A', 'vib': 'Kelas 6B',
  };
  if (romanMap[lower]) {
    return romanMap[lower];
  }

  return fallbackKelas || clean;
}

/**
 * Extracts and normalizes gender ('L' for Laki-Laki, 'P' for Perempuan)
 * Supports standard Indonesian formats, single columns (L/P), and two-column formats.
 */
export function extractJenisKelamin(row: Record<string, any>): 'L' | 'P' {
  const rowKeys = Object.keys(row);

  // 1. Check if there are separate dedicated columns for 'P' (Perempuan) and 'L' (Laki-laki)
  // Common in Indonesian Dapodik/Absensi exports: column "P" with '1', 'v', 'x', '✓', etc.
  for (const rKey of rowKeys) {
    const rClean = rKey.trim().toLowerCase();
    if (rClean === 'p' || rClean === 'pr' || rClean === 'perempuan' || rClean === 'wanita') {
      const raw = row[rKey];
      if (raw !== undefined && raw !== null) {
        const val = String(raw).replace(/\u00a0/g, ' ').trim().toLowerCase();
        if (
          val !== '' &&
          val !== '0' &&
          val !== 'false' &&
          val !== '-' &&
          val !== 'tidak'
        ) {
          return 'P';
        }
      }
    }
  }

  for (const rKey of rowKeys) {
    const rClean = rKey.trim().toLowerCase();
    if (
      rClean === 'l' ||
      rClean === 'lk' ||
      rClean === 'laki-laki' ||
      rClean === 'laki - laki' ||
      rClean === 'lakilaki' ||
      rClean === 'pria'
    ) {
      const raw = row[rKey];
      if (raw !== undefined && raw !== null) {
        const val = String(raw).replace(/\u00a0/g, ' ').trim().toLowerCase();
        if (
          val !== '' &&
          val !== '0' &&
          val !== 'false' &&
          val !== '-' &&
          val !== 'tidak'
        ) {
          return 'L';
        }
      }
    }
  }

  // 2. Find gender value from gender column headers
  // Avoid telephone / HP / WA / address columns that contain 'lp' (like 'notelp' or 'telp')!
  const genderHeaderCandidates = [
    'jenis kelamin (l/p)',
    'jenis kelamin (l / p)',
    'jenis kelamin (lp)',
    'jenis kelamin',
    'jeniskelamin',
    'jk (l/p)',
    'jk (l / p)',
    'jk',
    'l/p',
    'l / p',
    'lp',
    'kelamin',
    'gender',
    'sex',
  ];

  let rawVal: any = undefined;

  // Phase A: Exact normalized match
  for (const cand of genderHeaderCandidates) {
    const candNorm = cand.replace(/[^a-z0-9]/g, '');
    for (const rKey of rowKeys) {
      const rLower = rKey.toLowerCase();
      if (
        rLower.includes('telp') ||
        rLower.includes('telepon') ||
        rLower.includes('phone') ||
        rLower.includes('hp') ||
        rLower.includes('wa') ||
        rLower.includes('whatsapp') ||
        rLower.includes('alamat')
      ) {
        continue;
      }
      const rNorm = rLower.replace(/[^a-z0-9]/g, '');
      if (rNorm === candNorm) {
        const testVal = row[rKey];
        if (testVal !== undefined && String(testVal).trim() !== '') {
          rawVal = testVal;
          break;
        }
      }
    }
    if (rawVal !== undefined && String(rawVal).trim() !== '') break;
  }

  // Phase B: Contains 'kelamin', 'gender', or 'l/p' (safe boundaries)
  if (rawVal === undefined || String(rawVal).trim() === '') {
    for (const rKey of rowKeys) {
      const rLower = rKey.toLowerCase();
      if (
        rLower.includes('telp') ||
        rLower.includes('telepon') ||
        rLower.includes('phone') ||
        rLower.includes('hp') ||
        rLower.includes('wa') ||
        rLower.includes('whatsapp') ||
        rLower.includes('alamat') ||
        rLower.includes('kelompok')
      ) {
        continue;
      }
      if (
        rLower.includes('kelamin') ||
        rLower.includes('gender') ||
        rLower.includes('l/p') ||
        rLower.includes('l / p') ||
        rLower.trim() === 'jk' ||
        rLower.startsWith('jk ') ||
        rLower.endsWith(' jk')
      ) {
        const testVal = row[rKey];
        if (testVal !== undefined && String(testVal).trim() !== '') {
          rawVal = testVal;
          break;
        }
      }
    }
  }

  // 3. Parse cell value
  if (rawVal !== undefined && rawVal !== null) {
    const str = String(rawVal).replace(/\u00a0/g, ' ').trim().toUpperCase();

    // Check for Perempuan (P)
    // Supports: "P", "PEREMPUAN", "PEREMPUAN (P)", "P (PEREMPUAN)", "WANITA", "W", "PR", "FEMALE", "F", "2"
    if (
      str === 'P' ||
      str === 'PR' ||
      str === 'W' ||
      str === 'F' ||
      str === '2' ||
      str.includes('PEREMPUAN') ||
      str.includes('WANITA') ||
      str.includes('FEMALE') ||
      str.endsWith('(P)') ||
      str.endsWith('/P') ||
      str.startsWith('P (') ||
      str.startsWith('P/') ||
      str.startsWith('P -') ||
      str.startsWith('PEREMPUAN') ||
      str.startsWith('P.')
    ) {
      return 'P';
    }

    // Check for Laki-Laki (L)
    // Supports: "L", "LAKI-LAKI", "LAKI - LAKI", "LAKILAKI", "LAKI-LAKI (L)", "L (LAKI-LAKI)", "PRIA", "LK", "MALE", "M", "1"
    if (
      str === 'L' ||
      str === 'LK' ||
      str === 'M' ||
      str === '1' ||
      str.includes('LAKI') ||
      str.includes('PRIA') ||
      str.includes('MALE') ||
      str.endsWith('(L)') ||
      str.endsWith('/L') ||
      str.startsWith('L (') ||
      str.startsWith('L/') ||
      str.startsWith('L -') ||
      str.startsWith('LAKI') ||
      str.startsWith('L.')
    ) {
      return 'L';
    }

    if (str.startsWith('P')) return 'P';
    if (str.startsWith('L')) return 'L';
  }

  return 'L';
}

/**
 * Find matching key from an object regardless of case, spaces, or minor naming differences
 */
function findValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  // Phase 1: Exact normalized match
  for (const pKey of possibleKeys) {
    const pKeyNormalized = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const rKey of rowKeys) {
      const rKeyNormalized = rKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rKeyNormalized === pKeyNormalized) {
        return row[rKey];
      }
    }
  }
  // Phase 2: Substring match (safeguarded: key must be >= 4 chars to prevent 'lp' or 'no' false matches)
  for (const pKey of possibleKeys) {
    const pKeyNormalized = pKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (pKeyNormalized.length < 4) continue;
    for (const rKey of rowKeys) {
      const rKeyNormalized = rKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rKeyNormalized.length < 4) continue;
      if (rKeyNormalized.includes(pKeyNormalized)) {
        return row[rKey];
      }
    }
  }
  return undefined;
}

/**
 * Helper to clean numeric strings from Excel, handling scientific notation like 1.23456789E+09
 */
export function cleanNumericString(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val).replace(/\u00a0/g, ' ').trim();
  if (!str) return '';
  // Check for scientific notation (e.g. 1.23456789E+09 or 1.97104E+17)
  if (/[0-9]+(\.[0-9]+)?e\+[0-9]+/i.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num)) {
        return BigInt(Math.round(num)).toString();
      }
    } catch {
      // ignore
    }
  }
  // Strip trailing .0 from Excel number format
  return str.replace(/\.0+$/, '').replace(/[^0-9]/g, '');
}

/**
 * Parse an Excel (.xlsx, .xls) or CSV file into raw JSON objects.
 * Automatically scans up to the first 15 rows to detect the true header row
 * (preventing failures when school templates have title banners in rows 1-3).
 */
export async function parseExcelOrCsvFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve([]);
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve([]);
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Read sheet as 2D array of rows
        const rawGrid: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
        if (!rawGrid || rawGrid.length === 0) {
          resolve([]);
          return;
        }

        // Identify header row index (scanning first 15 rows)
        let headerRowIndex = 0;
        const headerKeywords = [
          'nama', 'nisn', 'siswa', 'murid', 'peserta', 'nip', 'guru',
          'kelas', 'jk', 'kelamin', 'rombel', 'tingkat', 'no'
        ];
        
        let bestMatchScore = 0;
        for (let r = 0; r < Math.min(rawGrid.length, 15); r++) {
          const rowVals = (rawGrid[r] || []).map((v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
          let matchCount = 0;
          for (const cell of rowVals) {
            if (cell && headerKeywords.some((kw) => cell.includes(kw))) {
              matchCount++;
            }
          }
          if (matchCount > bestMatchScore && matchCount >= 2) {
            bestMatchScore = matchCount;
            headerRowIndex = r;
          }
        }

        const headerRow = (rawGrid[headerRowIndex] || []).map((h) => String(h || '').trim());
        const resultRows: Record<string, any>[] = [];

        for (let r = headerRowIndex + 1; r < rawGrid.length; r++) {
          const rowVals = rawGrid[r];
          if (!rowVals || rowVals.length === 0) continue;
          
          // Check if row has any non-blank value
          const hasAnyValue = rowVals.some((v) => String(v || '').trim() !== '');
          if (!hasAnyValue) continue;

          const rowObj: Record<string, any> = {};
          headerRow.forEach((headerName, colIdx) => {
            const cellVal = rowVals[colIdx] !== undefined ? rowVals[colIdx] : '';
            if (headerName) {
              rowObj[headerName] = cellVal;
            } else if (String(cellVal).trim() !== '') {
              rowObj[`col_${colIdx + 1}`] = cellVal;
            }
          });
          resultRows.push(rowObj);
        }

        resolve(resultRows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse raw text copied directly from Google Sheets or Excel (Tab-delimited / CSV)
 */
export function parsePastedSpreadsheetText(pastedText: string): Record<string, any>[] {
  const lines = pastedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Determine delimiter: tab (\t) or comma (,) or semicolon (;)
  const firstLine = lines[0];
  let delimiter = '\t';
  if (!firstLine.includes('\t')) {
    if (firstLine.includes(';') && !firstLine.includes(',')) {
      delimiter = ';';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    }
  }

  const headers = firstLine.split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine) continue;
    const parts = currentLine.split(delimiter).map((val) => val.replace(/^["']|["']$/g, '').trim());
    const rowObj: Record<string, any> = {};
    headers.forEach((h, index) => {
      rowObj[h] = parts[index] !== undefined ? parts[index] : '';
    });
    rows.push(rowObj);
  }

  return rows;
}

/**
 * Maps raw imported rows to Murid objects
 */
export function processMuridRows(
  rawRows: Record<string, any>[],
  defaultKelas?: string
): ImportResult<Murid> {
  const muridList: Murid[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenNisns = new Set<string>();

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // considering 1-based index and header
    const rawNama = findValue(row, ['nama lengkap', 'nama murid', 'nama siswa', 'nama', 'peserta didik', 'nama peserta didik']);
    const rawNisn = findValue(row, ['nisn', 'nomor induk siswa nasional', 'no nisn', 'nisn siswa']);
    const rawNis = findValue(row, ['nis', 'no nis', 'nomor induk', 'no induk']);
    const rawKelas = findValue(row, ['kelas', 'rombel', 'tingkat', 'kelas murid']);
    const rawOrtu = findValue(row, ['nama orang tua', 'nama ortu', 'orang tua', 'nama ayah', 'nama ibu', 'wali', 'nama wali']);
    const rawHp = findValue(row, ['no hp orang tua', 'no hp', 'hp orang tua', 'telepon', 'no telepon', 'no wa', 'whatsapp', 'no wa ortu']);
    const rawPin = findValue(row, ['pin', 'pin login', 'password', 'sandi']);

    const nama = String(rawNama || '').trim();
    const nisn = cleanNumericString(rawNisn);
    const nis = cleanNumericString(rawNis);

    if (!nama && !nisn) {
      // Empty row, skip silently
      return;
    }

    if (!nama) {
      errors.push(`Baris ${rowNum}: Nama murid kosong.`);
      return;
    }

    if (!nisn) {
      warnings.push(`Baris ${rowNum} (${nama}): NISN kosong, otomatis diisi ID acak.`);
    }

    const finalNisn = nisn || `99${Date.now().toString().slice(-8)}${idx}`;
    if (seenNisns.has(finalNisn)) {
      warnings.push(`Baris ${rowNum} (${nama}): NISN ${finalNisn} duplikat di file import.`);
    } else {
      seenNisns.add(finalNisn);
    }

    const kelas = normalizeKelas(rawKelas ? String(rawKelas) : undefined, defaultKelas);

    // Ekstraksi Jenis Kelamin (L / P): Laki-Laki (L) vs Perempuan (P)
    let jk: 'L' | 'P' = extractJenisKelamin(row);

    // Heuristik cadangan: jika kolom JK tidak disediakan di Excel, deteksi nama perempuan umum
    if (jk === 'L') {
      const namaUpper = nama.toUpperCase();
      const femaleKeywords = [
        'PUTRI', 'AISYAH', 'SITI', 'AZZAHRA', 'AZ-ZAHRA', 'ZAHRA', 'NURUL', 'ALINA', 'ALITA',
        'ALMEERA', 'AQILA', 'AZIZAH', 'BILQIS', 'CHARISYA', 'DEVIRA', 'DEWI', 'EDRHEA',
        'CANTIKA', 'KHAIRUNNISA', 'FATIMAH', 'NADIA', 'SAFIRA', 'SALMA', 'AULIA'
      ];
      if (femaleKeywords.some((kw) => namaUpper.includes(kw))) {
        // Hanya jika tidak ada kolom JK yang secara eksplisit menyatakan 'L'
        const hasExplicitL = Object.keys(row).some((k) => {
          const kl = k.toLowerCase();
          return (kl.includes('kelamin') || kl === 'jk' || kl === 'l/p') && String(row[k]).trim().toUpperCase().startsWith('L');
        });
        if (!hasExplicitL) {
          jk = 'P';
        }
      }
    }

    const rawCleanHp = cleanNumericString(rawHp);
    const cleanHp = rawCleanHp.length >= 8 ? (rawCleanHp.startsWith('0') || rawCleanHp.startsWith('62') ? rawCleanHp : `0${rawCleanHp}`) : '081200000000';
    const cleanPin = String(rawPin || '').trim() || '1234';

    muridList.push({
      id: `m-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      nama,
      nisn: finalNisn,
      nis: nis || finalNisn.slice(-4),
      kelas,
      jenisKelamin: jk,
      namaOrangTua: String(rawOrtu || '').trim() || 'Orang Tua / Wali',
      noHpOraangTua: cleanHp,
      pin: cleanPin,
    });
  });

  return {
    success: muridList.length > 0,
    data: muridList,
    totalRows: rawRows.length,
    validRows: muridList.length,
    invalidRows: errors.length,
    errors,
    warnings,
  };
}

/**
 * Maps raw imported rows to Guru objects
 */
export function processGuruRows(rawRows: Record<string, any>[]): ImportResult<Guru> {
  const guruList: Guru[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const rawNama = findValue(row, ['nama guru', 'nama lengkap', 'nama', 'guru']);
    const rawNip = findValue(row, ['nip', 'nomor induk pegawai', 'no nip']);
    const rawJabatan = findValue(row, ['jabatan', 'tugas', 'role']);
    const rawKelas = findValue(row, ['kelas ampu', 'kelas', 'wali kelas', 'tingkat']);
    const rawEmail = findValue(row, ['email', 'email akun belajar', 'akun belajar', 'surel']);
    const rawHp = findValue(row, ['no hp', 'telepon', 'whatsapp', 'no wa']);
    const rawPin = findValue(row, ['pin', 'password', 'sandi']);

    const nama = String(rawNama || '').trim();
    const nip = cleanNumericString(rawNip);

    if (!nama && !nip) return;

    if (!nama) {
      errors.push(`Baris ${rowNum}: Nama guru kosong.`);
      return;
    }

    const finalNip = nip || `199${Date.now().toString().slice(-8)}${idx}`;
    let kelasAmpu = 'Kelas 1A';
    if (rawKelas) {
      const kStr = String(rawKelas).trim();
      if (kStr.toLowerCase().includes('semua') || kStr.toLowerCase().includes('kepsek')) {
        kelasAmpu = 'Semua Kelas';
      } else {
        kelasAmpu = normalizeKelas(kStr, 'Kelas 1A');
      }
    }

    const cleanPin = String(rawPin || '').trim() || '1234';
    const email = String(rawEmail || '').trim() || `${nama.toLowerCase().replace(/[^a-z]/g, '')}@guru.sd.belajar.id`;
    const rawCleanHp = cleanNumericString(rawHp);
    const cleanHp = rawCleanHp.length >= 8 ? (rawCleanHp.startsWith('0') || rawCleanHp.startsWith('62') ? rawCleanHp : `0${rawCleanHp}`) : '081399001100';

    guruList.push({
      id: `g-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      nama,
      nip: finalNip,
      jabatan: String(rawJabatan || '').trim() || `Wali ${kelasAmpu}`,
      kelasAmpu,
      email,
      noHp: cleanHp,
      pin: cleanPin,
    });
  });

  return {
    success: guruList.length > 0,
    data: guruList,
    totalRows: rawRows.length,
    validRows: guruList.length,
    invalidRows: errors.length,
    errors,
    warnings,
  };
}

/**
 * Downloads a pre-formatted Excel (.xlsx) template for Murid import
 */
export function downloadTemplateMuridExcel() {
  const headers = [
    'NISN',
    'NIS',
    'Nama Lengkap Murid',
    'Kelas',
    'Jenis Kelamin (L/P)',
    'Nama Orang Tua',
    'No HP WhatsApp',
    'PIN Login',
  ];

  const sampleData = [
    ['0123456781', '242501', 'Ahmad Rizky Pratama', 'Kelas 1A', 'L', 'Bambang Pratama', '081234567891', '1234'],
    ['0123456782', '242502', 'Siti Aisyah Putri', 'Kelas 1A', 'P', 'Hendra Wijaya', '081234567892', '1234'],
    ['0123456783', '242503', 'Bima Sakti Pratama', 'Kelas 1B', 'L', 'Sakti Hermawan', '081234567893', '1234'],
    ['0123456784', '242504', 'Dwi Rahayu Lestari', 'Kelas 2A', 'P', 'Surya Saputra', '081234567894', '1234'],
    ['0123456785', '242505', 'Fajar Nur Hidayat', 'Kelas 3A', 'L', 'Hidayatullah', '081234567895', '1234'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // NISN
    { wch: 10 }, // NIS
    { wch: 28 }, // Nama
    { wch: 12 }, // Kelas
    { wch: 20 }, // JK
    { wch: 25 }, // Ortu
    { wch: 18 }, // No HP
    { wch: 12 }, // PIN
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DATA_MURID');
  XLSX.writeFile(workbook, 'Template_Import_Murid_SDN_Kapuk_06.xlsx');
}

/**
 * Downloads a pre-formatted Excel (.xlsx) template for Guru import
 */
export function downloadTemplateGuruExcel() {
  const headers = [
    'NIP',
    'Nama Guru & Gelar',
    'Jabatan',
    'Kelas Ampu',
    'Email Akun Belajar',
    'No HP WhatsApp',
    'PIN / Password',
  ];

  const sampleData = [
    ['199008152018022001', 'Nurul Hidayati, S.Pd', 'Wali Kelas 1A', 'Kelas 1A', 'nurul.hidayati@guru.sd.belajar.id', '081399001101', '1234'],
    ['198705122014022002', 'Dra. Endang Lestari', 'Wali Kelas 1B', 'Kelas 1B', 'endang.lestari@guru.sd.belajar.id', '081399001102', '1234'],
    ['199103202019032003', 'Rina Anggraini, S.Pd', 'Wali Kelas 2A', 'Kelas 2A', 'rina.anggraini@guru.sd.belajar.id', '081399001103', '1234'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 26 },
    { wch: 20 },
    { wch: 15 },
    { wch: 35 },
    { wch: 18 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DATA_GURU');
  XLSX.writeFile(workbook, 'Template_Import_Guru_SDN_Kapuk_06.xlsx');
}
