/**
 * Helper utilitas untuk zona Waktu Indonesia Barat (WIB / UTC+7).
 * Mencakup Pulau Sumatra, Jawa, Madura, Kalimantan Barat, dan Kalimantan Tengah.
 */

/**
 * Mendapatkan tanggal hari ini dalam zona WIB format 'YYYY-MM-DD'.
 */
export function getTodayWIB(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    // Fallback manual UTC+7 jika Intl tidak tersedia
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 3600000);
    return wib.toISOString().split('T')[0];
  }
}

/**
 * Mendapatkan jam saat ini dalam zona WIB format 'HH:mm:ss'.
 */
export function getJamWIB(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(/\./g, ':');
  } catch {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 3600000);
    const h = String(wib.getHours()).padStart(2, '0');
    const m = String(wib.getMinutes()).padStart(2, '0');
    const s = String(wib.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}

/**
 * Mendapatkan jam dan menit saja dalam format 'HH:mm'.
 */
export function getJamMenitWIB(date: Date = new Date()): string {
  const full = getJamWIB(date);
  return full.substring(0, 5);
}

/**
 * Mendapatkan cap waktu lengkap format 'YYYY-MM-DD HH:mm:ss WIB'.
 */
export function getTimestampWIB(date: Date = new Date()): string {
  return `${getTodayWIB(date)} ${getJamWIB(date)} WIB`;
}

/**
 * Format string tanggal atau ISO string ke tampilan WIB yang ramah.
 * Contoh output: "11 Okt 2026, 21:55 WIB"
 */
export function formatToWIBDisplay(inputDate?: string | Date): string {
  if (!inputDate) return '-';
  try {
    const d = typeof inputDate === 'string' ? new Date(inputDate) : inputDate;
    if (isNaN(d.getTime())) {
      // Jika input string sudah berupa jam atau teks lokal
      return String(inputDate);
    }
    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);

    const formattedTime = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(d)
      .replace(/\./g, ':');

    return `${formattedDate}, ${formattedTime} WIB`;
  } catch {
    return String(inputDate);
  }
}

/**
 * Memformat string jam kegiatan (seperti jamBangun atau jamTidur) ke format bersih 'HH:mm WIB'.
 * Menangani format biasa seperti '05:00', maupun format serial/ISO Google Sheets seperti '1899-12-29T21:47:48.000Z'.
 */
export function formatJamWIB(input?: string): string {
  if (!input || !String(input).trim() || String(input).trim() === '-') return '-';
  const raw = String(input).trim();

  // Jika sudah format HH:mm atau HH:mm WIB
  const simpleMatch = raw.match(/^([01]?[0-9]|2[0-3])[:.]([0-5][0-9])/);
  if (simpleMatch && !raw.includes('T')) {
    const hh = simpleMatch[1].padStart(2, '0');
    const mm = simpleMatch[2];
    return `${hh}:${mm} WIB`;
  }

  // Jika format ISO dari Google Sheets / Date object (cth: 1899-12-29T21:47:48.000Z)
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .format(d)
        .replace(/\./g, ':');
      return `${timeStr} WIB`;
    }
  } catch {}

  return raw.endsWith('WIB') ? raw : `${raw} WIB`;
}

/**
 * Menormalkan nilai waktu input murni ke 'HH:mm' untuk elemen <input type="time">
 */
export function normalizeTimeToHHMM(input?: string): string {
  if (!input || !String(input).trim() || String(input).trim() === '-') return '';
  const raw = String(input).trim();

  const simpleMatch = raw.match(/^([01]?[0-9]|2[0-3])[:.]([0-5][0-9])/);
  if (simpleMatch && !raw.includes('T')) {
    return `${simpleMatch[1].padStart(2, '0')}:${simpleMatch[2]}`;
  }

  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .format(d)
        .replace(/\./g, ':');
      return timeStr.substring(0, 5);
    }
  } catch {}

  return '';
}

/**
 * Menormalkan tanggal dari format apa pun (ISO Google Sheets 2026-10-10T17:00:00.000Z dll) ke 'YYYY-MM-DD' zona WIB.
 */
export function normalizeDateStringToWIB(input?: string): string {
  if (!input || !String(input).trim()) return getTodayWIB();
  const raw = String(input).trim();

  // Jika format sudah YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // Jika format DD/MM/YYYY
  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  try {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(parsed);
    }
  } catch {}

  return raw;
}

/**
 * Mendeteksi dan memformat waktu pengiriman jurnal murid ke zona Waktu Indonesia Barat (WIB, UTC+7).
 * Jika submittedAt atau jamKirim belum tercatat, dapat mengekstrak timestamp langsung dari ID entri (cth: kaih-1791729298492).
 */
export function formatWaktuKirimWIB(submittedAt?: string, jamKirim?: string, entryId?: string): {
  jam: string;
  lengkap: string;
} {
  // 1. Coba dari submittedAt jika valid
  if (submittedAt && submittedAt.trim() && submittedAt !== '-') {
    const raw = submittedAt.trim();
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const jamStr = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
          .format(d)
          .replace(/\./g, ':');
        const tglStr = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(d);
        return {
          jam: `${jamStr} WIB`,
          lengkap: `${tglStr}, ${jamStr} WIB`,
        };
      }
    } catch {}

    if (raw.includes('WIB')) {
      const jamMatch = raw.match(/([01]?[0-9]|2[0-3])[:.]([0-5][0-9])/);
      return {
        jam: jamMatch ? `${jamMatch[1].padStart(2, '0')}:${jamMatch[2]} WIB` : raw,
        lengkap: raw,
      };
    }
  }

  // 2. Coba dari jamKirim
  if (jamKirim && jamKirim.trim() && jamKirim !== '-') {
    const rawJam = jamKirim.trim();
    const cleanJam = rawJam.endsWith('WIB') ? rawJam : `${rawJam} WIB`;
    return {
      jam: cleanJam,
      lengkap: cleanJam,
    };
  }

  // 3. Fallback cerdas: ekstrak timestamp Unix dari ID entri (cth: kaih-1791729298492 atau baca-1791729271550)
  if (entryId) {
    const match = entryId.match(/\d{12,13}/);
    if (match) {
      const ms = parseInt(match[0], 10);
      try {
        const d = new Date(ms);
        if (!isNaN(d.getTime())) {
          const jamStr = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
            .format(d)
            .replace(/\./g, ':');
          const tglStr = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(d);
          return {
            jam: `${jamStr} WIB`,
            lengkap: `${tglStr}, ${jamStr} WIB`,
          };
        }
      } catch {}
    }
  }

  return {
    jam: '- WIB',
    lengkap: 'Waktu belum tercatat',
  };
}
