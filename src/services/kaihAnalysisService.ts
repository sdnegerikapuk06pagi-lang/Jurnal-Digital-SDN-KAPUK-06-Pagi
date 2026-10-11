import { Murid, Jurnal7KAIH, Refleksi7KAIH } from '../types';

export interface HabitAnalysisStats {
  key: string;
  label: string;
  daysChecked: number;
  totalDays: number;
  percentage: number;
  kategori: 'Sudah Terbiasa' | 'Mulai Terbiasa' | 'Perlu Pendampingan';
  detailInfo?: string;
}

export interface MonthAnalysisSummary {
  murid: Murid;
  bulan: string;
  totalDaysInMonth: number;
  totalDaysRecorded: number;
  habits: Record<string, HabitAnalysisStats>;
  averagePercentage: number;
  overallKategori: 'Sudah Terbiasa' | 'Mulai Terbiasa' | 'Perlu Pendampingan';
  generatedRefleksi: Refleksi7KAIH;
}

/**
 * Service to analyze daily fast logs (Catatan Cepat Harian / Jurnal 7 KAIH)
 * and automatically generate Lampiran 3 (Lembar Refleksi Orang Tua)
 */
export const kaihAnalysisService = {
  /**
   * Helper to parse month and year from string like "Oktober 2026"
   */
  getMonthYear(bulanStr: string): { monthIndex: number; year: number; daysCount: number } {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    let monthIndex = 9; // Default Oktober
    let year = 2026;

    for (let i = 0; i < monthNames.length; i++) {
      if (bulanStr.toLowerCase().includes(monthNames[i].toLowerCase())) {
        monthIndex = i;
        break;
      }
    }

    const yearMatch = bulanStr.match(/\d{4}/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    }

    // Days in month
    const daysCount = new Date(year, monthIndex + 1, 0).getDate();
    return { monthIndex, year, daysCount };
  },

  /**
   * Perform comprehensive analysis of student's fast daily logs for a given month
   */
  analyzeMonth(murid: Murid, bulan: string, jurnalList: Jurnal7KAIH[]): MonthAnalysisSummary {
    const { monthIndex, year, daysCount } = this.getMonthYear(bulan);
    const formattedMonth = monthIndex + 1 < 10 ? `0${monthIndex + 1}` : `${monthIndex + 1}`;
    const monthPrefix = `${year}-${formattedMonth}`;

    // Get all journals of this student in the chosen month
    const studentJournals = jurnalList.filter(
      (j) => j.muridId === murid.id && j.tanggal.startsWith(monthPrefix)
    );

    // Calculate habit counts
    const calculateCount = (habitKey: string): { count: number; details: string[] } => {
      let count = 0;
      const details: string[] = [];

      // If user has actual logged journals
      for (const j of studentJournals) {
        let isDone = false;
        switch (habitKey) {
          case 'bangunPagi':
            if (j.bangunPagiChecked) {
              isDone = true;
              if (j.jamBangun) details.push(j.jamBangun);
            }
            break;
          case 'beribadah':
            if (j.ibadahChecklist && j.ibadahChecklist.length > 0) {
              isDone = true;
              details.push(...j.ibadahChecklist);
            }
            break;
          case 'berolahraga':
            if (j.olahragaChecked) {
              isDone = true;
              if (j.olahragaDesc) details.push(j.olahragaDesc);
            }
            break;
          case 'makanSehat':
            if (j.makanSehatChecked) {
              isDone = true;
              if (j.makanSehatHabits) details.push(...j.makanSehatHabits);
            }
            break;
          case 'gemarBelajar':
            if (j.belajarChecked) {
              isDone = true;
              if (j.belajarDesc) details.push(j.belajarDesc);
            }
            break;
          case 'bermasyarakat':
            if (j.bantuOrangTuaChecked) {
              isDone = true;
              if (j.bantuOrangTuaDesc) details.push(j.bantuOrangTuaDesc);
            }
            break;
          case 'tidurCepat':
            if (j.tidurTepatWaktuChecked) {
              isDone = true;
              if (j.jamTidur) details.push(j.jamTidur);
            }
            break;
        }
        if (isDone) count++;
      }

      // If no journals entered yet for this student in this month, return 0 (no fake baseline)
      if (studentJournals.length === 0) {
        count = 0;
      }

      return { count, details };
    };

    const minThreshold = Math.ceil((2 / 3) * daysCount); // 21 days for 31-day month (Kemendikdasmen Standard)

    const habitsData: Record<string, HabitAnalysisStats> = {};
    const habitKeys = [
      { key: 'bangunPagi', label: 'Bangun Pagi' },
      { key: 'beribadah', label: 'Beribadah' },
      { key: 'berolahraga', label: 'Berolahraga' },
      { key: 'makanSehat', label: 'Makan Sehat dan Bergizi' },
      { key: 'gemarBelajar', label: 'Gemar Belajar' },
      { key: 'bermasyarakat', label: 'Bermasyarakat' },
      { key: 'tidurCepat', label: 'Tidur Cepat' },
    ];

    let totalPctSum = 0;

    habitKeys.forEach(({ key, label }) => {
      const { count } = calculateCount(key);
      const percentage = Math.round((count / daysCount) * 100);
      totalPctSum += percentage;

      let kategori: 'Sudah Terbiasa' | 'Mulai Terbiasa' | 'Perlu Pendampingan' = 'Perlu Pendampingan';
      if (count >= minThreshold) {
        kategori = 'Sudah Terbiasa';
      } else if (count >= Math.floor(daysCount * 0.45)) {
        kategori = 'Mulai Terbiasa';
      }

      habitsData[key] = {
        key,
        label,
        daysChecked: count,
        totalDays: daysCount,
        percentage,
        kategori,
      };
    });

    const averagePercentage = Math.round(totalPctSum / habitKeys.length);
    let overallKategori: 'Sudah Terbiasa' | 'Mulai Terbiasa' | 'Perlu Pendampingan' = 'Perlu Pendampingan';
    if (averagePercentage >= 67) {
      overallKategori = 'Sudah Terbiasa';
    } else if (averagePercentage >= 45) {
      overallKategori = 'Mulai Terbiasa';
    }

    // Auto-generate pedagogical texts for Lampiran 3 Lembar Refleksi Orang Tua
    const generatedRefleksi = this.generateRefleksiText(murid, bulan, habitsData, daysCount);

    return {
      murid,
      bulan,
      totalDaysInMonth: daysCount,
      totalDaysRecorded: studentJournals.length,
      habits: habitsData,
      averagePercentage,
      overallKategori,
      generatedRefleksi,
    };
  },

  /**
   * Generates official Indonesian pedagogical conclusions & action plans for parents
   */
  generateRefleksiText(
    murid: Murid,
    bulan: string,
    habits: Record<string, HabitAnalysisStats>,
    daysCount: number
  ): Refleksi7KAIH {
    const nama = murid.nama;

    // 1. BANGUN PAGI
    const bp = habits['bangunPagi'];
    let bpRefleksi = '';
    let bpTindakLanjut = '';
    if (bp.daysChecked >= 21) {
      bpRefleksi = `Berdasarkan analisis catatan harian bulan ${bulan}, ananda ${nama} sangat disiplin bangun pagi mandiri sebanyak ${bp.daysChecked} dari ${daysCount} hari (${bp.percentage}%). Ananda bangun sebelum pukul 05:00 tanpa perlu dibangunkan berulang kali.`;
      bpTindakLanjut = `Mempertahankan ritme tidur teratur di malam hari dan terus memberikan apresiasi positif atas kemandirian ananda setiap pagi.`;
    } else if (bp.daysChecked >= 14) {
      bpRefleksi = `Ananda ${nama} telah cukup baik dalam pembiasaan bangun pagi (${bp.daysChecked} hari tercapai, ${bp.percentage}%). Pada hari libur atau akhir pekan sesekali masih perlu diingatkan untuk tidak bangun terlambat.`;
      bpTindakLanjut = `Membiasakan ananda menggunakan alarm mandiri dan menjaga jam tidur malam yang konsisten termasuk saat akhir pekan.`;
    } else {
      bpRefleksi = `Pembiasaan bangun pagi ananda ${nama} masih memerlukan dorongan (baru tercapai ${bp.daysChecked} hari). Ananda kerap bangun tergesa-gesa karena tidur larut malam.`;
      bpTindakLanjut = `Membatasi aktivitas gawai dan TV di malam hari maksimal pukul 20.30 WIB agar ananda dapat tidur lebih cepat dan bangun dengan segar.`;
    }

    // 2. BERIBADAH
    const ib = habits['beribadah'];
    let ibRefleksi = '';
    let ibTindakLanjut = '';
    if (ib.daysChecked >= 21) {
      ibRefleksi = `Ananda ${nama} sangat taat beribadah dan berdoa harian (${ib.daysChecked} hari tercapai, ${ib.percentage}%). Ananda tertib menunaikan sholat tepat waktu serta selalu berdoa sebelum belajar dan makan.`;
      ibTindakLanjut = `Membimbing ananda untuk menambah hafalan doa harian dan surat pendek, serta membiasakan sholat berjamaah bersama keluarga di rumah.`;
    } else if (ib.daysChecked >= 14) {
      ibRefleksi = `Ananda ${nama} sudah mulai terbiasa beribadah (${ib.daysChecked} hari, ${ib.percentage}%), namun masih sesekali perlu diingatkan terutama saat asyik bermain.`;
      ibTindakLanjut = `Mengajak ananda beribadah bersama secara ramah dan menjadi teladan langsung dalam mendisiplinkan waktu ibadah.`;
    } else {
      ibRefleksi = `Pelaksanaan ibadah ananda ${nama} masih membutuhkan bimbingan intensif (${ib.daysChecked} hari tercatat).`;
      ibTindakLanjut = `Membuat jadwal pengingat ibadah di rumah dan mendampingi ananda belajar tata cara ibadah dengan gembira.`;
    }

    // 3. BEROLAHRAGA
    const ol = habits['berolahraga'];
    let olRefleksi = '';
    let olTindakLanjut = '';
    if (ol.daysChecked >= 21) {
      olRefleksi = `Ananda ${nama} aktif beraktivitas fisik dan berolahraga sebanyak ${ol.daysChecked} hari (${ol.percentage}%). Ananda gemar senam pagi, peregangan tubuh, dan bersepeda sehingga tubuhnya bugar.`;
      olTindakLanjut = `Mendukung minat olahraga ananda dan menjadwalkan kegiatan olahraga bersama keluarga di akhir pekan secara rutin.`;
    } else if (ol.daysChecked >= 14) {
      olRefleksi = `Ananda ${nama} berolahraga sebanyak ${ol.daysChecked} hari (${ol.percentage}%). Aktivitas fisik dilakukan saat ada pelajaran olahraga di sekolah atau diajak bermain aktif di rumah.`;
      olTindakLanjut = `Mengajak ananda melakukan gerakan senam ringan minimal 15-20 menit setiap pagi sebelum berangkat ke sekolah.`;
    } else {
      olRefleksi = `Aktivitas olahraga ananda ${nama} masih kurang (${ol.daysChecked} hari). Ananda lebih sering menghabiskan waktu dengan aktivitas duduk atau menatap layar gawai.`;
      olTindakLanjut = `Mengurangi waktu sedentary (menatap layar) dan melibatkan ananda dalam jalan santai sore atau permainan fisik menyenangkan.`;
    }

    // 4. MAKAN SEHAT DAN BERGIZI
    const ms = habits['makanSehat'];
    let msRefleksi = '';
    let msTindakLanjut = '';
    if (ms.daysChecked >= 21) {
      msRefleksi = `Pola makan ananda ${nama} sangat baik dan bergizi seimbang (${ms.daysChecked} hari, ${ms.percentage}%). Selalu sarapan pagi sebelum ke sekolah, gemar makan buah dan sayuran, serta minum air putih minimal 8 gelas.`;
      msTindakLanjut = `Terus menyajikan menu bervariasi dengan gizi seimbang (Isi Piringku) dan membekali makanan sehat higienis dari rumah.`;
    } else if (ms.daysChecked >= 14) {
      msRefleksi = `Ananda ${nama} sarapan teratur (${ms.daysChecked} hari), namun terkadang masih memilih-milih sayuran dan sesekali tertarik jajan makanan manis/olahan.`;
      msTindakLanjut = `Mengenalkan variasi olahan sayur dan buah yang menarik serta memberikan edukasi tentang bahaya jajan sembarangan.`;
    } else {
      msRefleksi = `Pembiasaan makan sehat ananda ${nama} perlu perbaikan (${ms.daysChecked} hari). Ananda kerap melewatkan sarapan dan kurang minum air putih.`;
      msTindakLanjut = `Mewajibkan sarapan pagi bernutrisi bersama dan menyiapkan botol air minum pribadi untuk dipantau habis setiap hari.`;
    }

    // 5. GEMAR BELAJAR
    const gb = habits['gemarBelajar'];
    let gbRefleksi = '';
    let gbTindakLanjut = '';
    if (gb.daysChecked >= 21) {
      gbRefleksi = `Ananda ${nama} menunjukkan antusiasme belajar mandiri yang tinggi sebanyak ${gb.daysChecked} hari (${gb.percentage}%). Rutin mengulang materi pelajaran sekolah, membaca buku, dan menyelesaikan tugas tanpa menunda-nunda.`;
      gbTindakLanjut = `Menyediakan bahan bacaan berkualitas di rumah dan memberi apresiasi atas rasa ingin tahu serta kreativitas ananda.`;
    } else if (gb.daysChecked >= 14) {
      gbRefleksi = `Ananda ${nama} belajar mandiri dengan cukup baik (${gb.daysChecked} hari), tetapi durasinya terkadang masih singkat dan perlu diarahkan orang tua agar fokus.`;
      gbTindakLanjut = `Menemani ananda belajar dengan metode yang interaktif dan menetapkan waktu belajar tetap (30-45 menit) setiap petang.`;
    } else {
      gbRefleksi = `Pembiasaan gemar belajar ananda ${nama} masih memerlukan perhatian khusus (${gb.daysChecked} hari). Ananda hanya belajar ketika ada PR mendesak.`;
      gbTindakLanjut = `Menciptakan suasana ruang belajar yang tenang, bebas dari gangguan gawai dan kebisingan televisi saat jam belajar.`;
    }

    // 6. BERMASYARAKAT & MEMBANTU ORANG TUA
    const bm = habits['bermasyarakat'];
    let bmRefleksi = '';
    let bmTindakLanjut = '';
    if (bm.daysChecked >= 21) {
      bmRefleksi = `Ananda ${nama} sangat ringan tangan membantu orang tua di rumah sebanyak ${bm.daysChecked} hari (${bm.percentage}%). Mandiri merapikan tempat tidur, membantu menyapu, sopan kepada tetangga, dan rukun dengan saudara.`;
      bpTindakLanjut = `Melibatkan ananda dalam kegiatan sosial kemasyarakatan di lingkungan RT/RW untuk menumbuhkan jiwa gotong royong.`;
      bmTindakLanjut = `Memberikan kepercayaan lebih pada ananda untuk mengemban tugas-tugas rumah tangga sederhana secara berkala.`;
    } else if (bm.daysChecked >= 14) {
      bmRefleksi = `Ananda ${nama} bersedia membantu pekerjaan rumah tangga jika diminta (${bm.daysChecked} hari), serta memiliki sikap ramah terhadap lingkungan sekitar.`;
      bmTindakLanjut = `Menumbuhkan inisiatif spontan ananda agar mau membantu keluarga tanpa perlu selalu diinstruksikan.`;
    } else {
      bmRefleksi = `Kepedulian dan kebiasaan membantu orang tua ananda ${nama} masih perlu diasah (${bm.daysChecked} hari). Masih sering meninggalkan barang berserakan.`;
      bmTindakLanjut = `Memberikan tanggung jawab harian yang jelas (seperti merapikan piring sendiri dan menata sepatu) serta memuji setiap itikad baiknya.`;
    }

    // 7. TIDUR CEPAT
    const tc = habits['tidurCepat'];
    let tcRefleksi = '';
    let tcTindakLanjut = '';
    if (tc.daysChecked >= 21) {
      tcRefleksi = `Ananda ${nama} konsisten tidur tepat waktu sebelum pukul 21.00 WIB sebanyak ${tc.daysChecked} hari (${tc.percentage}%). Kualitas tidurnya sangat baik sehingga bangun dengan ceria.`;
      tcTindakLanjut = `Menjaga rutinitas malam yang menenangkan (membaca buku sebelum tidur, cuci kaki/tangan, dan berdoa).`;
    } else if (tc.daysChecked >= 14) {
      tcRefleksi = `Ananda ${nama} cukup sering tidur tepat waktu (${tc.daysChecked} hari), tetapi terkadang di akhir pekan masih tidur di atas pukul 21.30 WIB.`;
      tcTindakLanjut = `Menegaskan batas waktu tidur maksimal pukul 21.00 WIB secara konsisten agar ritme biologis tubuh ananda tidak terganggu.`;
    } else {
      tcRefleksi = `Ananda ${nama} sering tidur larut malam (${tc.daysChecked} hari tercapai tidur cepat). Hal ini berdampak pada rasa kantuk saat bangun pagi.`;
      tcTindakLanjut = `Menerapkan aturan mematikan perangkat elektronik (smartphone/TV) minimal 1 jam sebelum tidur dan meredupkan lampu kamar.`;
    }

    return {
      id: `ref-${murid.id}-${Date.now()}`,
      muridId: murid.id,
      muridNama: murid.nama,
      kelas: murid.kelas,
      bulan,
      bangunPagiRefleksi: bpRefleksi,
      bangunPagiTindakLanjut: bpTindakLanjut,
      beribadahRefleksi: ibRefleksi,
      beribadahTindakLanjut: ibTindakLanjut,
      berolahragaRefleksi: olRefleksi,
      berolahragaTindakLanjut: olTindakLanjut,
      makanSehatRefleksi: msRefleksi,
      makanSehatTindakLanjut: msTindakLanjut,
      gemarBelajarRefleksi: gbRefleksi,
      gemarBelajarTindakLanjut: gbTindakLanjut,
      bermasyarakatRefleksi: bmRefleksi,
      bermasyarakatTindakLanjut: bmTindakLanjut,
      tidurCepatRefleksi: tcRefleksi,
      tidurCepatTindakLanjut: tcTindakLanjut,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
  },
};
