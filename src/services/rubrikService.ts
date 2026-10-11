import { Jurnal7KAIH } from '../types';

export interface RubrikEvaluationResult {
  skorBangunPagi: number; // 0-4
  ketBangunPagi: string;
  skorBeribadah: number; // 0-4
  ketBeribadah: string;
  skorBerolahraga: number; // 0-4
  ketBerolahraga: string;
  skorGemarBelajar: number; // 0-4
  ketGemarBelajar: string;
  skorMakanSehat: number; // 0-4
  ketMakanSehat: string;
  skorBermasyarakat: number; // 0-4
  ketBermasyarakat: string;
  skorTidurCepat: number; // 0-4
  ketTidurCepat: string;
  totalSkor: number; // 0-28
  skorRataRata: number; // 0.0 - 4.0
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Pendampingan' | 'Belum Diisi';
  isFreshBlank?: boolean;
}

/**
 * Menghitung penilaian harian otomatis 7 KAIH sesuai rubrik Gambar 1-6 + Tidur Cepat
 * Mendukung kondisi formulir baru yang belum diisi (hanya teks bayangan / placeholder contoh)
 */
export function calculateRubrik7KAIH(data: Partial<Jurnal7KAIH>): RubrikEvaluationResult {
  // 1. BANGUN PAGI (Gambar 1)
  // 04.30 - 05.00: 4
  // 05.01 - 05.30: 3
  // 05.31 - 06.00: 2
  // Setelah 06.00: 1
  let skorBangunPagi = 0;
  let ketBangunPagi = 'Belum diisi (Contoh bayangan: 05:00)';
  const rawJamBangun = (data.jamBangun || '').trim();

  if (rawJamBangun || data.bangunPagiChecked) {
    if (rawJamBangun) {
      const [bH, bM] = rawJamBangun.split(':').map((v) => parseInt(v, 10) || 0);
      const bangunTotalMin = bH * 60 + bM;

      if (bangunTotalMin <= 5 * 60) {
        skorBangunPagi = 4;
        ketBangunPagi = 'Pukul 04.30 – 05.00 (Sangat Baik - Skor 4)';
      } else if (bangunTotalMin <= 5 * 60 + 30) {
        skorBangunPagi = 3;
        ketBangunPagi = 'Pukul 05.01 – 05.30 (Baik - Skor 3)';
      } else if (bangunTotalMin <= 6 * 60) {
        skorBangunPagi = 2;
        ketBangunPagi = 'Pukul 05.31 – 06.00 (Cukup - Skor 2)';
      } else {
        skorBangunPagi = 1;
        ketBangunPagi = 'Setelah Pukul 06.00 (Perlu Ditingkatkan - Skor 1)';
      }
    } else {
      skorBangunPagi = 3;
      ketBangunPagi = 'Bangun Pagi Tercatat (Baik)';
    }
  }

  // 2. BERIBADAH (Gambar 2)
  // A. Muslim:
  // 5 waktu salat: 4
  // 3-4 waktu salat: 3
  // 1-2 waktu salat: 2
  // Belum salat / kosong: 1 (atau 0 jika form baru)
  // B. Non Muslim:
  // Sering: 4
  // Sedang: 3
  // Jarang-jarang: 2
  // Tidak ibadah: 1
  let skorBeribadah = 0;
  let ketBeribadah = 'Belum dipilih (Pilih sholat/ibadah)';
  const agama = data.agama || 'Muslim';

  if (agama === 'Non Muslim') {
    const frek = data.frekuensiIbadahNonMuslim;
    if (frek === 'Sering') {
      skorBeribadah = 4;
      ketBeribadah = 'Ibadah rutin sesuai ajaran agama (Sering - Skor 4)';
    } else if (frek === 'Sedang') {
      skorBeribadah = 3;
      ketBeribadah = 'Ibadah dilakukan, belum rutin (Sedang - Skor 3)';
    } else if (frek === 'Jarang-jarang') {
      skorBeribadah = 2;
      ketBeribadah = 'Kadang-kadang melakukan ibadah (Jarang-jarang - Skor 2)';
    } else if (frek === 'Tidak melakukan ibadah') {
      skorBeribadah = 1;
      ketBeribadah = 'Tidak melakukan ibadah (Skor 1)';
    } else if (data.jenisIbadahNonMuslim && data.jenisIbadahNonMuslim.trim()) {
      skorBeribadah = 3;
      ketBeribadah = `${data.jenisIbadahNonMuslim} (Baik)`;
    }
  } else {
    // Muslim: jika sedang berhalangan (uzur syar'i)
    const checklist = data.ibadahChecklist || [];
    const isBerhalangan =
      data.sedangBerhalangan === true ||
      checklist.some((item) => item.toLowerCase().includes('berhalangan'));

    if (isBerhalangan) {
      skorBeribadah = 4;
      ketBeribadah = "Sedang Berhalangan (Uzur Syar'i - Sangat Baik - Skor 4)";
    } else {
      // Muslim: hitung salat fardhu
      const salatWajib = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
      const salatDoneCount = checklist.filter((item) => salatWajib.includes(item)).length;

      if (checklist.length > 0) {
        if (salatDoneCount >= 5) {
          skorBeribadah = 4;
          ketBeribadah = '5 Waktu Salat Lengkap (Sangat Baik - Skor 4)';
        } else if (salatDoneCount >= 3) {
          skorBeribadah = 3;
          ketBeribadah = `${salatDoneCount} Waktu Salat (Baik - Skor 3)`;
        } else if (salatDoneCount >= 1) {
          skorBeribadah = 2;
          ketBeribadah = `${salatDoneCount} Waktu Salat (Cukup - Skor 2)`;
        } else {
          skorBeribadah = 2;
          ketBeribadah = `${checklist.length} Ibadah Lain Tercatat (Cukup - Skor 2)`;
        }
      }
    }
  }

  // 3. BEROLAHRAGA (Gambar 3)
  // Durasi:
  // 30 menit atau lebih: 4
  // 20 - 29 menit: 3
  // 10 - 19 menit: 2
  // Kurang dari 10 menit: 1
  let skorBerolahraga = 0;
  let ketBerolahraga = 'Belum diisi (Contoh bayangan: Senam SAIH 30 menit)';
  if (data.olahragaChecked || (data.olahragaDurasiPilihan && data.olahragaDurasiPilihan.trim()) || (data.olahragaDesc && data.olahragaDesc.trim())) {
    const durasiPilihan = data.olahragaDurasiPilihan;
    if (durasiPilihan === '30 menit atau lebih') {
      skorBerolahraga = 4;
      ketBerolahraga = '30 menit atau lebih (Sangat Baik - Skor 4)';
    } else if (durasiPilihan === '20 - 29 menit') {
      skorBerolahraga = 3;
      ketBerolahraga = '20 – 29 menit (Baik - Skor 3)';
    } else if (durasiPilihan === '10 - 19 menit') {
      skorBerolahraga = 2;
      ketBerolahraga = '10 – 19 menit (Cukup - Skor 2)';
    } else if (durasiPilihan === '< 10 menit') {
      skorBerolahraga = 1;
      ketBerolahraga = 'Kurang dari 10 menit (Skor 1)';
    } else {
      skorBerolahraga = 3;
      ketBerolahraga = 'Berolahraga Aktif (Baik - Skor 3)';
    }
  }

  // 4. GEMAR BELAJAR (Gambar 4)
  // Lebih dari 60 menit: 4
  // 31 - 60 menit: 3
  // 15 - 30 menit: 2
  // Kurang dari 15 menit: 1
  let skorGemarBelajar = 0;
  let ketGemarBelajar = 'Belum diisi (Contoh bayangan: Belajar 45 menit)';
  if (data.belajarChecked || (data.durasiBelajarMenit && data.durasiBelajarMenit > 0) || (data.belajarDesc && data.belajarDesc.trim())) {
    const durasi = data.durasiBelajarMenit || 0;
    if (durasi > 60) {
      skorGemarBelajar = 4;
      ketGemarBelajar = 'Lebih dari 60 menit (Sangat Baik - Skor 4)';
    } else if (durasi >= 31) {
      skorGemarBelajar = 3;
      ketGemarBelajar = '31 – 60 menit (Baik - Skor 3)';
    } else if (durasi >= 15) {
      skorGemarBelajar = 2;
      ketGemarBelajar = '15 – 30 menit (Cukup - Skor 2)';
    } else if (durasi > 0) {
      skorGemarBelajar = 1;
      ketGemarBelajar = 'Kurang dari 15 menit (Perlu Ditingkatkan - Skor 1)';
    } else {
      skorGemarBelajar = 3;
      ketGemarBelajar = 'Belajar Mandiri Tercatat (Baik)';
    }
  }

  // 5. MAKAN SEHAT DAN BERGIZI (Gambar 5)
  // Total centang dari tabel 3 waktu makan x 5 jenis = 15 centang maksimal
  // 13 - 15 centang: 4 (Sangat Baik)
  // 10 - 12 centang: 3 (Baik)
  // 7 - 9 centang: 2 (Cukup)
  // 1 - 6 centang: 1 (Perlu Ditingkatkan)
  const totalMakanCentang = typeof data.makanSehatCentangCount === 'number'
    ? data.makanSehatCentangCount
    : (data.makanSehatHabits?.length || 0);
  let skorMakanSehat = 0;
  let ketMakanSehat = 'Belum dicentang (Centang menu piring)';

  if (totalMakanCentang > 0 || data.makanSehatChecked) {
    if (totalMakanCentang >= 13) {
      skorMakanSehat = 4;
      ketMakanSehat = `Sangat Baik (${totalMakanCentang} centang - Makanan sangat lengkap & seimbang)`;
    } else if (totalMakanCentang >= 10) {
      skorMakanSehat = 3;
      ketMakanSehat = `Baik (${totalMakanCentang} centang - Makanan cukup lengkap)`;
    } else if (totalMakanCentang >= 7) {
      skorMakanSehat = 2;
      ketMakanSehat = `Cukup (${totalMakanCentang} centang - Makanan kurang lengkap)`;
    } else {
      skorMakanSehat = 1;
      ketMakanSehat = `Perlu Ditingkatkan (${totalMakanCentang} centang)`;
    }
  }

  // 6. BERMASYARAKAT (Gambar 6)
  // 6 pertanyaan Iya/Tidak:
  // 6 "IYA": 4 (Sangat Baik)
  // 4 - 5 "IYA": 3 (Baik)
  // 2 - 3 "IYA": 2 (Cukup)
  // 0 - 1 "IYA": 1 (Perlu Ditingkatkan)
  let skorBermasyarakat = 0;
  let ketBermasyarakat = 'Belum dijawab (Pilih Iya/Tidak pada 6 butir)';
  const hasAnswers = data.bermasyarakatAnswers && Object.keys(data.bermasyarakatAnswers).length > 0;
  let iyaCount = 0;

  if (hasAnswers) {
    iyaCount = Object.values(data.bermasyarakatAnswers!).filter((v) => v === 'Iya').length;
    if (iyaCount >= 6) {
      skorBermasyarakat = 4;
      ketBermasyarakat = `Sangat Baik (${iyaCount} IYA - Peduli & Aktif Bermasyarakat)`;
    } else if (iyaCount >= 4) {
      skorBermasyarakat = 3;
      ketBermasyarakat = `Baik (${iyaCount} IYA - Hebat)`;
    } else if (iyaCount >= 2) {
      skorBermasyarakat = 2;
      ketBermasyarakat = `Cukup (${iyaCount} IYA - Terus Usahakan)`;
    } else {
      skorBermasyarakat = 1;
      ketBermasyarakat = `Perlu Ditingkatkan (${iyaCount} IYA)`;
    }
  } else if (typeof data.bermasyarakatIyaCount === 'number' && data.bermasyarakatIyaCount > 0) {
    iyaCount = data.bermasyarakatIyaCount;
    skorBermasyarakat = iyaCount >= 6 ? 4 : iyaCount >= 4 ? 3 : iyaCount >= 2 ? 2 : 1;
    ketBermasyarakat = `${iyaCount} IYA (Skor ${skorBermasyarakat})`;
  } else if (data.bantuOrangTuaChecked) {
    skorBermasyarakat = 3;
    ketBermasyarakat = 'Membantu Orang Tua & Bermasyarakat (Baik)';
  }

  // 7. TIDUR CEPAT (Sebelum Pukul 21.00 s/d 24.00)
  // <= 21.00: 4
  // 21.01 - 22.00: 3
  // 22.01 - 23.00: 2
  // 23.01 - 24.00+: 1
  let skorTidurCepat = 0;
  let ketTidurCepat = 'Belum diisi (Contoh bayangan: 21:00)';
  const rawJamTidur = (data.jamTidur || '').trim();

  if (rawJamTidur || data.tidurTepatWaktuChecked) {
    if (rawJamTidur) {
      const [tH, tM] = rawJamTidur.split(':').map((v) => parseInt(v, 10) || 0);
      const tidurTotalMin = tH * 60 + tM;

      if (tidurTotalMin <= 21 * 60 && tidurTotalMin >= 18 * 60) {
        skorTidurCepat = 4;
        ketTidurCepat = 'Pukul 20.00 – 21.00 (Sangat Baik - Skor 4)';
      } else if (tidurTotalMin <= 22 * 60) {
        skorTidurCepat = 3;
        ketTidurCepat = 'Pukul 21.01 – 22.00 (Baik - Skor 3)';
      } else if (tidurTotalMin <= 23 * 60) {
        skorTidurCepat = 2;
        ketTidurCepat = 'Pukul 22.01 – 23.00 (Cukup - Skor 2)';
      } else {
        skorTidurCepat = 1;
        ketTidurCepat = 'Pukul 23.01 – 24.00 / Lewat Tengah Malam (Skor 1)';
      }
    } else {
      skorTidurCepat = 3;
      ketTidurCepat = 'Tidur Tepat Waktu (Baik)';
    }
  }

  // Cek apakah formulir benar-benar masih kosong (Fresh / Bayangan Baru)
  const isFreshBlank =
    skorBangunPagi === 0 &&
    skorBeribadah === 0 &&
    skorBerolahraga === 0 &&
    skorGemarBelajar === 0 &&
    skorMakanSehat === 0 &&
    skorBermasyarakat === 0 &&
    skorTidurCepat === 0;

  if (isFreshBlank) {
    return {
      skorBangunPagi: 0,
      ketBangunPagi,
      skorBeribadah: 0,
      ketBeribadah,
      skorBerolahraga: 0,
      ketBerolahraga,
      skorGemarBelajar: 0,
      ketGemarBelajar,
      skorMakanSehat: 0,
      ketMakanSehat,
      skorBermasyarakat: 0,
      ketBermasyarakat,
      skorTidurCepat: 0,
      ketTidurCepat,
      totalSkor: 0,
      skorRataRata: 0,
      predikat: 'Belum Diisi',
      isFreshBlank: true,
    };
  }

  // Hitung rata-rata dari butir yang sudah terisi (atau minimal bagi 7 jika sebagian terisi)
  const nonZeroScores = [
    skorBangunPagi,
    skorBeribadah,
    skorBerolahraga,
    skorGemarBelajar,
    skorMakanSehat,
    skorBermasyarakat,
    skorTidurCepat,
  ].filter((s) => s > 0);

  const totalSkor =
    skorBangunPagi +
    skorBeribadah +
    skorBerolahraga +
    skorGemarBelajar +
    skorMakanSehat +
    skorBermasyarakat +
    skorTidurCepat;

  // Skor rata-rata dihitung dari butir yang sudah diisi murid
  const divider = nonZeroScores.length > 0 ? nonZeroScores.length : 7;
  const skorRataRata = parseFloat((totalSkor / divider).toFixed(2));

  let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Pendampingan' = 'Baik';
  if (skorRataRata >= 3.5) {
    predikat = 'Sangat Baik';
  } else if (skorRataRata >= 2.8) {
    predikat = 'Baik';
  } else if (skorRataRata >= 2.0) {
    predikat = 'Cukup';
  } else {
    predikat = 'Perlu Pendampingan';
  }

  return {
    skorBangunPagi,
    ketBangunPagi,
    skorBeribadah,
    ketBeribadah,
    skorBerolahraga,
    ketBerolahraga,
    skorGemarBelajar,
    ketGemarBelajar,
    skorMakanSehat,
    ketMakanSehat,
    skorBermasyarakat,
    ketBermasyarakat,
    skorTidurCepat,
    ketTidurCepat,
    totalSkor,
    skorRataRata,
    predikat,
    isFreshBlank: false,
  };
}

export interface RubrikGuideItem {
  no: number;
  kebiasaan: string;
  gambarRef: string;
  kriteria: {
    skor4: string;
    skor3: string;
    skor2: string;
    skor1: string;
  };
}

export const RUBRIK_GUIDELINES: RubrikGuideItem[] = [
  {
    no: 1,
    kebiasaan: 'Bangun Pagi',
    gambarRef: 'Gambar 1',
    kriteria: {
      skor4: 'Pukul 04.30 – 05.00 WIB (Sangat Baik)',
      skor3: 'Pukul 05.01 – 05.30 WIB (Baik)',
      skor2: 'Pukul 05.31 – 06.00 WIB (Cukup)',
      skor1: 'Setelah Pukul 06.00 WIB (Perlu Ditingkatkan)',
    },
  },
  {
    no: 2,
    kebiasaan: 'Beribadah Sesuai Agama',
    gambarRef: 'Gambar 2',
    kriteria: {
      skor4: 'Muslim: 5 Waktu Salat Lengkap | Non-Muslim: Sering beribadah',
      skor3: 'Muslim: 3 – 4 Waktu Salat | Non-Muslim: Sedang',
      skor2: 'Muslim: 1 – 2 Waktu Salat | Non-Muslim: Jarang-jarang',
      skor1: 'Muslim: Tidak Salat | Non-Muslim: Tidak Beribadah',
    },
  },
  {
    no: 3,
    kebiasaan: 'Berolahraga / Aktivitas Fisik',
    gambarRef: 'Gambar 3',
    kriteria: {
      skor4: 'Durasi 30 menit atau lebih',
      skor3: 'Durasi 20 – 29 menit',
      skor2: 'Durasi 10 – 19 menit',
      skor1: 'Kurang dari 10 menit / Belum berolahraga',
    },
  },
  {
    no: 4,
    kebiasaan: 'Gemar Belajar Mandiri',
    gambarRef: 'Gambar 4',
    kriteria: {
      skor4: 'Lebih dari 60 menit belajar mandiri',
      skor3: '31 – 60 menit belajar mandiri',
      skor2: '15 – 30 menit belajar mandiri',
      skor1: 'Kurang dari 15 menit / Belum belajar',
    },
  },
  {
    no: 5,
    kebiasaan: 'Makan Sehat dan Bergizi (Isi Piringku)',
    gambarRef: 'Gambar 5',
    kriteria: {
      skor4: '13 – 15 Centang (3 waktu makan x 5 jenis menu lengkap)',
      skor3: '10 – 12 Centang',
      skor2: '7 – 9 Centang',
      skor1: '0 – 6 Centang',
    },
  },
  {
    no: 6,
    kebiasaan: 'Bermasyarakat & Membantu Orang Tua',
    gambarRef: 'Gambar 6',
    kriteria: {
      skor4: '6 "IYA" (Peduli & Aktif Bermasyarakat)',
      skor3: '4 – 5 "IYA"',
      skor2: '2 – 3 "IYA"',
      skor1: '0 – 1 "IYA"',
    },
  },
  {
    no: 7,
    kebiasaan: 'Tidur Cepat',
    gambarRef: 'Rentang Jam 21.00 – 24.00',
    kriteria: {
      skor4: 'Sebelum / Pukul 21.00 WIB (Poin 4)',
      skor3: 'Pukul 21.01 – 22.00 WIB (Poin 3)',
      skor2: 'Pukul 22.01 – 23.00 WIB (Poin 2)',
      skor1: 'Pukul 23.01 – 24.00 WIB / Lewat Tengah Malam (Poin 1)',
    },
  },
];

