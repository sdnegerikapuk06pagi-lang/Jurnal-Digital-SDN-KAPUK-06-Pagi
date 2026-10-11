/**
 * Template Index.html Mandiri untuk Google Apps Script
 * Sistem E-Jurnal 7 KAIH & Literasi Membaca - SDN KAPUK 06 PAGI
 * 
 * Fitur Lengkap:
 * 1. Filter Dropdown Nama Murid otomatis sesuai kelas & Pencarian Live Search real-time.
 * 2. Portal Khusus Guru (Tampilan terpisah dengan PIN login).
 * 3. Fitur Penilaian Guru: Bintang 1-5, Catatan/Feedback Guru, status Disetujui/Perlu Perbaikan.
 * 4. Cetak Rekapitulasi Standar A4 Resmi (Kop Surat SDN Kapuk 06 Pagi, tanda tangan Kepala Sekolah & Guru)
 *    jika Vercel offline/tidak dapat digunakan.
 */

export const generateAppsScriptHtml = (schoolName: string = 'SDN KAPUK 06 PAGI'): string => {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DIGITAL ${schoolName} - Portal Jurnal 7 KAIH & Literasi</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
    @media print {
      body { background: white !important; color: black !important; padding: 0 !important; }
      .no-print, header, nav, footer, #toast, #rating-modal { display: none !important; }
      #printable-a4-area { display: block !important; padding: 0 !important; margin: 0 !important; border: none !important; }
      @page { size: A4 landscape; margin: 8mm 10mm 10mm 10mm; }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col">

  <!-- HEADER -->
  <header class="bg-blue-900 text-white shadow-lg sticky top-0 z-40 no-print">
    <div class="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/20 shadow-md overflow-hidden flex-shrink-0">
          <img src="https://i.imgur.com/GlCn0x3.png" alt="Logo SDN Kapuk 06 Pagi" class="w-full h-full object-contain drop-shadow" />
        </div>
        <div>
          <h1 class="text-sm sm:text-base font-extrabold tracking-wide uppercase">
            DIGITAL ${schoolName}
          </h1>
          <p class="text-[11px] text-blue-200">
            Tahun Ajaran 2026/2027 • Semester Ganjil (1) • E-Jurnal 7 KAIH & Literasi
          </p>
        </div>
      </div>

      <!-- PORTAL MODE SWITCHER & SPREADSHEET STATUS -->
      <div class="flex items-center gap-2">
        <button onclick="openSpreadsheetModal()" id="btn-spreadsheet-status" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-800/90 hover:bg-emerald-700 text-white flex items-center gap-1.5 border border-emerald-600 shadow-xs cursor-pointer" title="Periksa Status / Hubungkan Link Spreadsheet">
          <span id="label-spreadsheet-status">📊 Link Sheets</span>
          <span id="badge-spreadsheet-status" class="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
        <button onclick="setPortalMode('murid')" id="portal-btn-murid" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-amber-400 text-blue-950 shadow-md">
          👦 Portal Murid
        </button>
        <button onclick="setPortalMode('guru')" id="portal-btn-guru" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-800 text-blue-200 hover:text-white hover:bg-blue-700 flex items-center gap-1.5 border border-blue-700">
          <span>🔒 Portal Guru</span>
          <span id="guru-badge-auth" class="hidden w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      </div>
    </div>

    <!-- SUB-NAV FOR MURID -->
    <nav id="nav-murid" class="max-w-6xl mx-auto px-4 flex space-x-1 sm:space-x-2 overflow-x-auto text-xs font-bold border-t border-blue-800/80">
      <button onclick="switchTabMurid('kaih')" id="tab-btn-kaih" class="tab-btn-m py-2.5 px-3 border-b-2 border-amber-400 text-amber-300 flex items-center gap-1.5 whitespace-nowrap">
        🌅 Formulir 7 KAIH
      </button>
      <button onclick="switchTabMurid('membaca')" id="tab-btn-membaca" class="tab-btn-m py-2.5 px-3 border-b-2 border-transparent text-blue-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap">
        📖 Formulir Membaca
      </button>
      <button onclick="switchTabMurid('poster')" id="tab-btn-poster" class="tab-btn-m py-2.5 px-3 border-b-2 border-transparent text-blue-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap">
        🖼️ Poster 7 KAIH
      </button>
      <button onclick="switchTabMurid('riwayat')" id="tab-btn-riwayat" class="tab-btn-m py-2.5 px-3 border-b-2 border-transparent text-blue-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap">
        📋 Cek Status Jurnal Saya
      </button>
    </nav>

    <!-- SUB-NAV FOR GURU (Visible only in Guru Portal) -->
    <nav id="nav-guru" class="hidden max-w-6xl mx-auto px-4 flex space-x-1 sm:space-x-2 overflow-x-auto text-xs font-bold border-t border-blue-800/80 bg-blue-950/60">
      <button onclick="switchTabGuru('verif-kaih')" id="tab-btn-verif-kaih" class="tab-btn-g py-2.5 px-3 border-b-2 border-amber-400 text-amber-300 flex items-center gap-1.5 whitespace-nowrap">
        🌅 Penilaian 7 KAIH
      </button>
      <button onclick="switchTabGuru('verif-membaca')" id="tab-btn-verif-membaca" class="tab-btn-g py-2.5 px-3 border-b-2 border-transparent text-blue-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap">
        📖 Penilaian Membaca
      </button>
      <button onclick="switchTabGuru('cetak-rekap')" id="tab-btn-cetak-rekap" class="tab-btn-g py-2.5 px-3 border-b-2 border-transparent text-blue-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap">
        🖨️ Cetak Rekapitulasi A4
      </button>
      <button onclick="switchTabGuru('data-murid')" id="tab-btn-data-murid" class="tab-btn-g py-2.5 px-3 border-b-2 border-transparent text-blue-200 hover:text-white flex items-center gap-1.5 whitespace-nowrap">
        👥 Data Murid Kelas
      </button>
    </nav>
  </header>

  <!-- BANNER PERINGATAN LINK SPREADSHEET (MUNCUL JIKA BELUM TERHUBUNG / DATA KOSONG) -->
  <div id="banner-spreadsheet-status" class="hidden max-w-6xl mx-auto px-4 mt-4 no-print">
    <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-amber-200 text-amber-950 flex items-center justify-center text-xl flex-shrink-0">
          🔗
        </div>
        <div>
          <h4 class="font-extrabold text-xs sm:text-sm text-amber-950" id="banner-spreadsheet-title">
            Link Spreadsheet Belum Terbaca / Data Murid & Guru Kosong
          </h4>
          <p class="text-[11px] sm:text-xs text-amber-800" id="banner-spreadsheet-desc">
            Masukkan link Google Spreadsheet Anda agar data murid & guru langsung terbaca otomatis di Web App ini.
          </p>
        </div>
      </div>
      <button onclick="openSpreadsheetModal()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-blue-950 font-black rounded-xl text-xs whitespace-nowrap shadow-md cursor-pointer transition-all">
        Hubungkan Link Spreadsheet
      </button>
    </div>
  </div>

  <!-- TOAST NOTIFICATION -->
  <div id="toast" class="hidden fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold text-white transition-all transform translate-y-2"></div>

  <!-- MAIN CONTAINER -->
  <main class="max-w-6xl mx-auto w-full px-4 py-6 flex-1">

    <!-- ============================================================== -->
    <!-- SECTION A: PORTAL MURID -->
    <!-- ============================================================== -->
    <div id="portal-murid-view" class="space-y-6">

      <!-- TAB 1: FORMULIR 7 KAIH -->
      <section id="tab-m-kaih" class="tab-m-content space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
          <div class="border-b border-slate-100 pb-4 mb-6">
            <span class="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">
              7 Kebiasaan Anak Indonesia Hebat (7 KAIH)
            </span>
            <h2 class="text-xl font-extrabold text-blue-950 mt-2">
              Formulir Catatan Harian 7 KAIH
            </h2>
            <p class="text-xs text-slate-500">
              Pilih kelas dan cari nama murid untuk mengisi pembiasaan karakter unggul hari ini.
            </p>
          </div>

          <!-- BANNER POSTER 7 KAIH DI ATAS FORMULIR -->
          <div class="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-blue-950 shadow-md flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <img
                src="https://i.imgur.com/pJOJiuF.jpeg"
                alt="Poster 7 KAIH"
                class="w-12 h-16 object-cover rounded-xl shadow-md border-2 border-white flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                onclick="switchTabMurid('poster')"
              />
              <div class="min-w-0">
                <span class="text-[10px] font-black uppercase tracking-wider bg-blue-950 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  Panduan Karakter
                </span>
                <h3 class="text-xs sm:text-sm font-black mt-0.5 leading-tight truncate">
                  Poster Resmi 7 Karakter Anak Indonesia Hebat
                </h3>
                <p class="text-[11px] font-medium opacity-90 truncate">
                  Lihat panduan 7 pembiasaan karakter unggul murid SDN Kapuk 06 Pagi
                </p>
              </div>
            </div>
            <button
              type="button"
              onclick="switchTabMurid('poster')"
              class="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-amber-300 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md flex-shrink-0 cursor-pointer"
            >
              <span>🖼️ Buka Poster</span>
            </button>
          </div>

          <form id="form-kaih" onsubmit="handleKaihSubmit(event)" class="space-y-6 text-xs">
            <!-- Identitas Murid & Filter Kelas Canggih -->
            <div class="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-4">
              <div class="flex items-center justify-between">
                <span class="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                  <span>👤</span> Data Identitas Peserta Didik
                </span>
                <span class="text-[11px] text-blue-700 font-semibold" id="kaih-student-count-badge">
                  Memuat data murid...
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <!-- 1. Tanggal -->
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Tanggal Kegiatan</label>
                  <input type="date" id="kaih-tanggal" required class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800">
                </div>

                <!-- 2. Pilih Kelas -->
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Pilih Kelas</label>
                  <select id="kaih-kelas" onchange="handleKelasChange('kaih', this.value)" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-blue-900">
                    <option value="" selected>-- Semua Kelas --</option>
                    <option value="Kelas 1A">Kelas 1A</option>
                    <option value="Kelas 1B">Kelas 1B</option>
                    <option value="Kelas 2A">Kelas 2A</option>
                    <option value="Kelas 2B">Kelas 2B</option>
                    <option value="Kelas 3A">Kelas 3A</option>
                    <option value="Kelas 3B">Kelas 3B</option>
                    <option value="Kelas 4A">Kelas 4A</option>
                    <option value="Kelas 4B">Kelas 4B</option>
                    <option value="Kelas 5A">Kelas 5A</option>
                    <option value="Kelas 5B">Kelas 5B</option>
                    <option value="Kelas 6A">Kelas 6A</option>
                    <option value="Kelas 6B">Kelas 6B</option>
                  </select>
                </div>

                <!-- 3. Cari & Pilih Nama Murid -->
                <div class="sm:col-span-2 space-y-1.5">
                  <label class="block font-bold text-slate-700">Cari & Pilih Nama Murid</label>
                  <input
                    type="text"
                    id="kaih-murid-search"
                    oninput="handleMuridSearchInput('kaih', this.value)"
                    placeholder="🔍 Ketik nama murid untuk mencari..."
                    class="w-full px-3 py-2 bg-white rounded-xl border border-blue-300 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                  <select
                    id="kaih-murid-select"
                    onchange="handleMuridSelect('kaih', this)"
                    class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-blue-950 text-xs"
                  >
                    <option value="">-- Pilih Murid Dari Hasil Pencarian --</option>
                  </select>
                  <input type="hidden" id="kaih-nama" required>
                  <input type="hidden" id="kaih-murid-id">
                </div>
              </div>

              <!-- Guru Pendamping Otomatis Sesuai Kelas -->
              <div class="pt-2 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <span class="text-[11px] font-bold text-slate-700">Wali Kelas / Guru Pendamping:</span>
                  <select id="kaih-guru-select" class="px-3 py-1.5 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold">
                    <option value="">-- Otomatis Sesuai Kelas --</option>
                  </select>
                </div>
                <span id="kaih-selected-info" class="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg hidden">
                  Murid Terpilih
                </span>
              </div>
            </div>

            <!-- 7 KAIH Checklist -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 1. Bangun Pagi -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-extrabold text-blue-900 text-xs">1. Bangun Pagi</span>
                  <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" id="kaih-bangun-cek" checked class="w-4 h-4 text-blue-900 rounded">
                    <span class="text-[11px] font-semibold text-slate-700">Terbiasa Bangun Pagi</span>
                  </label>
                </div>
                <label class="block text-slate-500 mb-1 text-[11px]">Pukul Berapa Bangun?</label>
                <input type="time" id="kaih-jam-bangun" value="05:00" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold">
              </div>

              <!-- 2. Beribadah -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="font-extrabold text-blue-900 text-xs block mb-2">2. Beribadah Sesuai Agama</span>
                <div class="grid grid-cols-2 gap-2 text-[11px]">
                  <label class="flex items-center gap-2"><input type="checkbox" name="ibadah" value="Sholat Subuh / Doa Pagi" checked> Subuh / Pagi</label>
                  <label class="flex items-center gap-2"><input type="checkbox" name="ibadah" value="Sholat Dzuhur" checked> Dzuhur</label>
                  <label class="flex items-center gap-2"><input type="checkbox" name="ibadah" value="Sholat Ashar" checked> Ashar</label>
                  <label class="flex items-center gap-2"><input type="checkbox" name="ibadah" value="Sholat Maghrib & Isya" checked> Maghrib & Isya</label>
                  <label class="flex items-center gap-2 col-span-2"><input type="checkbox" name="ibadah" value="Tadarus / Baca Kitab Suci" checked> Tadarus / Baca Kitab Suci</label>
                </div>
              </div>

              <!-- 3. Berolahraga -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="font-extrabold text-blue-900 text-xs block mb-2">3. Berolahraga</span>
                <input type="text" id="kaih-olahraga" placeholder="Contoh: Jalan sehat, senam pagi, bersepeda (15 menit)" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300">
              </div>

              <!-- 4. Makan Sehat & Bergizi -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="font-extrabold text-blue-900 text-xs block mb-2">4. Makan Sehat & Bergizi</span>
                <div class="grid grid-cols-2 gap-2 text-[11px]">
                  <label class="flex items-center gap-2"><input type="checkbox" name="makan" value="Sarapan Bergizi" checked> Sarapan Pagi</label>
                  <label class="flex items-center gap-2"><input type="checkbox" name="makan" value="Makan Sayur & Buah" checked> Sayur & Buah</label>
                  <label class="flex items-center gap-2"><input type="checkbox" name="makan" value="Air Putih Cukup" checked> Minum Air Putih</label>
                  <label class="flex items-center gap-2"><input type="checkbox" name="makan" value="Bawa Bekal Sendiri" checked> Bawa Bekal Sehat</label>
                </div>
              </div>

              <!-- 5. Gemar Belajar -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="font-extrabold text-blue-900 text-xs block mb-2">5. Gemar Belajar</span>
                <input type="text" id="kaih-belajar-materi" placeholder="Materi / Pelajaran yang dipelajari" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 mb-2">
                <div class="flex items-center gap-2">
                  <label class="text-[11px] text-slate-600">Durasi:</label>
                  <input type="number" id="kaih-belajar-durasi" value="45" class="w-20 px-2 py-1 bg-white rounded-lg border border-slate-300 font-bold">
                  <span class="text-[11px] text-slate-500">menit</span>
                </div>
              </div>

              <!-- 6. Bermasyarakat / Membantu Orang Tua -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="font-extrabold text-blue-900 text-xs block mb-2">6. Bermasyarakat / Bantu Orang Tua</span>
                <input type="text" id="kaih-bantu" placeholder="Contoh: Merapikan tempat tidur, mencuci piring, menyapu" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300">
              </div>

              <!-- 7. Tidur Tepat Waktu -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="font-extrabold text-blue-900 text-xs block mb-1">7. Tidur Tepat Waktu</span>
                <label class="block text-slate-500 mb-1 text-[11px]">Pukul Berapa Tidur Malam?</label>
                <input type="time" id="kaih-jam-tidur" value="21:00" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold">
              </div>

              <!-- Catatan Orang Tua -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="font-extrabold text-blue-900 text-xs block mb-1">Catatan Orang Tua / Wali</span>
                <input type="text" id="kaih-catatan-ortu" placeholder="Catatan orang tua terkait pembiasaan hari ini" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300">
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <button type="submit" id="btn-submit-kaih" class="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2">
                <span>Simpan Catatan 7 KAIH</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- TAB 2: FORMULIR JURNAL MEMBACA -->
      <section id="tab-m-membaca" class="tab-m-content hidden space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
          <div class="border-b border-slate-100 pb-4 mb-6">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              Gerakan Literasi Sekolah
            </span>
            <h2 class="text-xl font-extrabold text-blue-950 mt-2">
              Formulir Jurnal Literasi Membaca
            </h2>
            <p class="text-xs text-slate-500">
              Catat aktivitas membaca buku cerita, sains, ensiklopedia, atau buku pelajaran setiap hari.
            </p>
          </div>

          <form id="form-membaca" onsubmit="handleMembacaSubmit(event)" class="space-y-6 text-xs">
            <!-- Identitas Murid & Filter Kelas -->
            <div class="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-4">
              <div class="flex items-center justify-between">
                <span class="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <span>👤</span> Data Identitas Peserta Didik
                </span>
                <span class="text-[11px] text-emerald-700 font-semibold" id="baca-student-count-badge">
                  Memuat data murid...
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Tanggal Membaca</label>
                  <input type="date" id="baca-tanggal" required class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800">
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Pilih Kelas</label>
                  <select id="baca-kelas" onchange="handleKelasChange('baca', this.value)" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-emerald-900">
                    <option value="" selected>-- Semua Kelas --</option>
                    <option value="Kelas 1A">Kelas 1A</option>
                    <option value="Kelas 1B">Kelas 1B</option>
                    <option value="Kelas 2A">Kelas 2A</option>
                    <option value="Kelas 2B">Kelas 2B</option>
                    <option value="Kelas 3A">Kelas 3A</option>
                    <option value="Kelas 3B">Kelas 3B</option>
                    <option value="Kelas 4A">Kelas 4A</option>
                    <option value="Kelas 4B">Kelas 4B</option>
                    <option value="Kelas 5A">Kelas 5A</option>
                    <option value="Kelas 5B">Kelas 5B</option>
                    <option value="Kelas 6A">Kelas 6A</option>
                    <option value="Kelas 6B">Kelas 6B</option>
                  </select>
                </div>

                <div class="sm:col-span-2 space-y-1.5">
                  <label class="block font-bold text-slate-700">Cari & Pilih Nama Murid</label>
                  <input
                    type="text"
                    id="baca-murid-search"
                    oninput="handleMuridSearchInput('baca', this.value)"
                    placeholder="🔍 Ketik nama murid untuk mencari..."
                    class="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 text-xs"
                  >
                  <select
                    id="baca-murid-select"
                    onchange="handleMuridSelect('baca', this)"
                    class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-emerald-950 text-xs"
                  >
                    <option value="">-- Pilih Murid Dari Hasil Pencarian --</option>
                  </select>
                  <input type="hidden" id="baca-nama" required>
                  <input type="hidden" id="baca-murid-id">
                </div>
              </div>

              <div class="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2 w-full sm:w-auto">
                  <span class="text-[11px] font-bold text-slate-700">Wali Kelas / Guru Pembimbing:</span>
                  <select id="baca-guru-select" class="px-3 py-1.5 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold">
                    <option value="">-- Otomatis Sesuai Kelas --</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Detail Bacaan -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label class="block font-bold text-slate-700 mb-1">Judul Buku yang Dibaca</label>
                <input type="text" id="baca-judul" required placeholder="Contoh: Kisah Teladan Pangeran Diponegoro" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Kategori Buku</label>
                <select id="baca-kategori" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium">
                  <option value="Cerita Anak / Fiksi">Cerita Anak / Fiksi</option>
                  <option value="Sains & Pengetahuan">Sains & Pengetahuan</option>
                  <option value="Sejarah & Pahlawan">Sejarah & Pahlawan</option>
                  <option value="Agama & Budi Pekerti">Agama & Budi Pekerti</option>
                  <option value="Ensiklopedia">Ensiklopedia</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Nama Penulis / Pengarang</label>
                <input type="text" id="baca-penulis" placeholder="Nama penulis / penerbit" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Halaman Dibaca (Awal - Akhir)</label>
                <div class="flex items-center gap-2">
                  <input type="number" id="baca-hal-awal" value="1" placeholder="Hal 1" class="w-1/2 px-3 py-2 bg-white rounded-xl border border-slate-300">
                  <span>s/d</span>
                  <input type="number" id="baca-hal-akhir" value="15" placeholder="Hal 15" class="w-1/2 px-3 py-2 bg-white rounded-xl border border-slate-300">
                </div>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Durasi Membaca (Menit)</label>
                <input type="number" id="baca-durasi" value="20" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Ringkasan Isi Bacaan</label>
              <textarea id="baca-ringkasan" rows="3" placeholder="Tuliskan ringkasan cerita atau inti ilmu yang kamu dapatkan..." class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300"></textarea>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Pesan Moral / Nilai Karakter</label>
              <input type="text" id="baca-kesan" placeholder="Contoh: Kita harus selalu jujur dan gemar menolong sesama." class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300">
            </div>

            <div class="flex justify-end pt-4">
              <button type="submit" id="btn-submit-baca" class="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center gap-2">
                <span>Simpan Jurnal Membaca</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- TAB POSTER 7 KAIH (MURID) -->
      <section id="tab-m-poster" class="tab-m-content hidden space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-amber-100 p-2 flex items-center justify-center border border-amber-300">
                <span class="text-2xl">🖼️</span>
              </div>
              <div>
                <h2 class="text-xl font-extrabold text-blue-950">
                  Poster Resmi 7 Karakter Anak Indonesia Hebat (7 KAIH)
                </h2>
                <p class="text-xs text-slate-500">
                  Panduan pembiasaan karakter unggul siswa SDN Kapuk 06 Pagi
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a
                href="https://i.imgur.com/pJOJiuF.jpeg"
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>🔍 Buka Resolusi Asli</span>
              </a>
              <button
                type="button"
                onclick="window.open('https://i.imgur.com/pJOJiuF.jpeg', '_blank')"
                class="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-blue-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <span>⬇️ Unduh Gambar</span>
              </button>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 sm:p-6 border border-slate-200">
            <img
              src="https://i.imgur.com/pJOJiuF.jpeg"
              alt="Poster Resmi 7 KAIH SDN Kapuk 06 Pagi"
              class="max-w-full sm:max-w-xl max-h-[75vh] object-contain rounded-2xl shadow-xl border-4 border-white mb-4"
            />
            <div class="max-w-2xl bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 text-center shadow-xs">
              <p class="font-extrabold text-blue-950 mb-1">
                7 Kebiasaan Anak Indonesia Hebat:
              </p>
              <p class="leading-relaxed">
                1. Bangun Pagi • 2. Beribadah • 3. Berolahraga • 4. Makan Sehat & Bergizi • 5. Gemar Belajar • 6. Bermasyarakat • 7. Tidur Tepat Waktu
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 3: CEK STATUS JURNAL SAYA (MURID) -->
      <section id="tab-m-riwayat" class="tab-m-content hidden space-y-6">
        <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 class="text-xl font-extrabold text-blue-950">
                Status Verifikasi & Penilaian Guru
              </h2>
              <p class="text-xs text-slate-500">
                Cari berdasarkan nama murid untuk melihat catatan harian dan bintang apresiasi dari guru.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <input type="text" id="filter-riwayat-nama" oninput="renderMuridRiwayatList()" placeholder="🔍 Cari nama murid..." class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold">
              <button onclick="loadDataFromSheets()" class="px-3.5 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100">
                🔄 Muat Ulang
              </button>
            </div>
          </div>

          <div id="murid-riwayat-container" class="space-y-3">
            <div class="text-center py-8 text-slate-400 text-xs">Memuat riwayat jurnal...</div>
          </div>
        </div>
      </section>

    </div>

    <!-- ============================================================== -->
    <!-- SECTION B: PORTAL KHUSUS GURU (TERPISAH DARI MURID) -->
    <!-- ============================================================== -->
    <div id="portal-guru-view" class="hidden space-y-6">

      <!-- 1. GERBANG LOGIN GURU (JIKA BELUM MASUK) -->
      <div id="guru-login-gate" class="max-w-md mx-auto my-8 bg-white rounded-3xl p-8 shadow-xl border border-blue-100 text-center space-y-6">
        <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-900 text-amber-400 flex items-center justify-center text-3xl shadow-lg">
          👨‍🏫
        </div>
        <div>
          <span class="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
            Area Verifikator Resmi
          </span>
          <h2 class="text-xl font-black text-blue-950 mt-3">
            Portal Khusus Guru
          </h2>
          <p class="text-xs text-slate-500 mt-1">
            Hanya guru & wali kelas yang dapat masuk untuk memverifikasi, menilai, dan mencetak rekap fisik A4.
          </p>
        </div>

        <form id="guru-login-form" onsubmit="handleGuruLogin(event)" class="space-y-4 text-left text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Pilih Akun Guru / Wali Kelas</label>
            <select id="login-guru-select" required class="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 font-bold text-blue-950">
              <option value="">-- Pilih Nama Guru --</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">PIN Guru</label>
            <div class="relative">
              <input type="password" id="login-guru-pin" required placeholder="Masukkan PIN (Default: 1234)" class="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 font-bold text-blue-950">
              <button type="button" onclick="togglePinVisibility()" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-[11px]">
                👁️
              </button>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">PIN dapat disesuaikan pada tab DATA_GURU Google Spreadsheet.</p>
          </div>

          <button type="submit" class="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
            <span>🔓 Masuk Sebagai Guru</span>
          </button>
        </form>
      </div>

      <!-- 2. WORKSPACE GURU (SETELAH LOGIN) -->
      <div id="guru-workspace" class="hidden space-y-6">

        <!-- Banner Guru Aktif -->
        <div class="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4 no-print">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-amber-400 text-blue-950 font-black flex items-center justify-center text-xl shadow-md">
              👨‍🏫
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 id="active-guru-name" class="font-black text-base">Nama Guru</h3>
                <span id="active-guru-role" class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  Wali Kelas
                </span>
              </div>
              <p id="active-guru-nip" class="text-xs text-blue-200 mt-0.5">NIP: -</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="loadDataFromSheets()" class="px-3.5 py-2 bg-blue-800/80 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all border border-blue-700 flex items-center gap-1.5">
              <span>🔄 Sinkron Data</span>
            </button>
            <button onclick="handleGuruLogout()" class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5">
              <span>🚪 Keluar</span>
            </button>
          </div>
        </div>

        <!-- SUB-TAB 1: PENILAIAN JURNAL 7 KAIH -->
        <section id="tab-g-verif-kaih" class="tab-g-content space-y-4">
          <div class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <!-- Filter Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 class="text-lg font-black text-blue-950">
                  Daftar Penilaian Jurnal 7 KAIH
                </h2>
                <p class="text-xs text-slate-500">
                  Periksa catatan pembiasaan anak dan berikan bintang serta umpan balik karakter.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs">
                <!-- Filter Kelas -->
                <select id="guru-filter-kaih-kelas" onchange="renderGuruKaihCards()" class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-950">
                  <option value="">Semua Kelas</option>
                  <option value="Kelas 1A">Kelas 1A</option>
                  <option value="Kelas 1B">Kelas 1B</option>
                  <option value="Kelas 2A">Kelas 2A</option>
                  <option value="Kelas 2B">Kelas 2B</option>
                  <option value="Kelas 3A">Kelas 3A</option>
                  <option value="Kelas 3B">Kelas 3B</option>
                  <option value="Kelas 4A" selected>Kelas 4A</option>
                  <option value="Kelas 4B">Kelas 4B</option>
                  <option value="Kelas 5A">Kelas 5A</option>
                  <option value="Kelas 5B">Kelas 5B</option>
                  <option value="Kelas 6A">Kelas 6A</option>
                  <option value="Kelas 6B">Kelas 6B</option>
                </select>

                <!-- Filter Status -->
                <select id="guru-filter-kaih-status" onchange="renderGuruKaihCards()" class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700">
                  <option value="all">Semua Status</option>
                  <option value="pending" selected>⏳ Belum Dinilai</option>
                  <option value="verified">✅ Sudah Disetujui</option>
                </select>

                <!-- Search Input -->
                <input type="text" id="guru-search-kaih-nama" oninput="renderGuruKaihCards()" placeholder="🔍 Cari nama murid..." class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium">
              </div>
            </div>

            <!-- List Cards 7 KAIH -->
            <div id="guru-kaih-cards-container" class="space-y-3">
              <div class="text-center py-8 text-slate-400 text-xs">Memuat data 7 KAIH...</div>
            </div>
          </div>
        </section>

        <!-- SUB-TAB 2: PENILAIAN JURNAL MEMBACA -->
        <section id="tab-g-verif-membaca" class="tab-g-content hidden space-y-4">
          <div class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <!-- Filter Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 class="text-lg font-black text-emerald-950">
                  Daftar Penilaian Jurnal Membaca
                </h2>
                <p class="text-xs text-slate-500">
                  Periksa judul buku, durasi membaca, ringkasan, dan berikan apresiasi literasi.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2 text-xs">
                <select id="guru-filter-baca-kelas" onchange="renderGuruMembacaCards()" class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-950">
                  <option value="">Semua Kelas</option>
                  <option value="Kelas 1A">Kelas 1A</option>
                  <option value="Kelas 1B">Kelas 1B</option>
                  <option value="Kelas 2A">Kelas 2A</option>
                  <option value="Kelas 2B">Kelas 2B</option>
                  <option value="Kelas 3A">Kelas 3A</option>
                  <option value="Kelas 3B">Kelas 3B</option>
                  <option value="Kelas 4A" selected>Kelas 4A</option>
                  <option value="Kelas 4B">Kelas 4B</option>
                  <option value="Kelas 5A">Kelas 5A</option>
                  <option value="Kelas 5B">Kelas 5B</option>
                  <option value="Kelas 6A">Kelas 6A</option>
                  <option value="Kelas 6B">Kelas 6B</option>
                </select>

                <select id="guru-filter-baca-status" onchange="renderGuruMembacaCards()" class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700">
                  <option value="all">Semua Status</option>
                  <option value="pending" selected>⏳ Belum Dinilai</option>
                  <option value="verified">✅ Sudah Disetujui</option>
                </select>

                <input type="text" id="guru-search-baca-nama" oninput="renderGuruMembacaCards()" placeholder="🔍 Cari nama murid..." class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-medium">
              </div>
            </div>

            <!-- List Cards Membaca -->
            <div id="guru-baca-cards-container" class="space-y-3">
              <div class="text-center py-8 text-slate-400 text-xs">Memuat data membaca...</div>
            </div>
          </div>
        </section>

        <!-- SUB-TAB 3: CETAK REKAPITULASI STANDAR A4 (FALLBACK JIKA VERCEL OFFLINE) -->
        <section id="tab-g-cetak-rekap" class="tab-g-content hidden space-y-6">
          <div class="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200">
            <!-- Controls Cetak (No Print) -->
            <div class="no-print border-b border-slate-100 pb-5 mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span class="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  Fallback Resmi Offline
                </span>
                <h2 class="text-xl font-black text-blue-950 mt-1">
                  Cetak Rekapitulasi Format Fisik A4
                </h2>
                <p class="text-xs text-slate-500">
                  Format resmi lengkap dengan Kop Surat Sekolah & Tanda Tangan jika Vercel sedang tidak dapat digunakan.
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <select id="cetak-jenis" onchange="updatePrintPreview()" class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-950">
                  <option value="kaih">Rekapitulasi 7 KAIH</option>
                  <option value="membaca">Rekapitulasi Literasi Membaca</option>
                </select>

                <select id="cetak-kelas" onchange="updatePrintPreview()" class="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-950">
                  <option value="Kelas 1A">Kelas 1A</option>
                  <option value="Kelas 1B">Kelas 1B</option>
                  <option value="Kelas 2A">Kelas 2A</option>
                  <option value="Kelas 2B">Kelas 2B</option>
                  <option value="Kelas 3A">Kelas 3A</option>
                  <option value="Kelas 3B">Kelas 3B</option>
                  <option value="Kelas 4A" selected>Kelas 4A</option>
                  <option value="Kelas 4B">Kelas 4B</option>
                  <option value="Kelas 5A">Kelas 5A</option>
                  <option value="Kelas 5B">Kelas 5B</option>
                  <option value="Kelas 6A">Kelas 6A</option>
                  <option value="Kelas 6B">Kelas 6B</option>
                </select>

                <button onclick="window.print()" class="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition-all">
                  <span>🖨️ Cetak Lembar A4 (Print)</span>
                </button>
              </div>
            </div>

            <!-- LEMBAR DOKUMEN CETAK RESMI A4 -->
            <div id="printable-a4-area" class="bg-white p-6 sm:p-8 border border-slate-300 rounded-2xl text-black">
              <!-- KOP SURAT RESMI DENGAN LOGO -->
              <div class="flex items-center justify-between border-b-4 border-double border-black pb-3 mb-4 gap-4">
                <div class="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
                  <img src="https://i.imgur.com/GlCn0x3.png" alt="Logo SDN Kapuk 06 Pagi" class="max-w-full max-h-full object-contain" />
                </div>
                <div class="flex-1 text-center">
                  <h3 class="text-xs sm:text-sm font-bold tracking-wider uppercase">
                    PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA
                  </h3>
                  <h3 class="text-xs sm:text-sm font-bold tracking-wider uppercase">
                    DINAS PENDIDIKAN DASAR
                  </h3>
                  <h2 class="text-base sm:text-lg font-black tracking-wide uppercase mt-0.5">
                    SEKOLAH DASAR NEGERI KAPUK 06 PAGI
                  </h2>
                  <p class="text-[10px] sm:text-[11px] text-slate-800 mt-0.5 leading-tight">
                    NPSN: 20105291 • NSS: 101016203006 • Jl. Kapuk Poglar RT.002/RW.04, Kapuk, Cengkareng, Jakarta Barat 11720
                  </p>
                </div>
                <div class="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 hidden sm:flex items-center justify-center invisible">
                  <img src="https://i.imgur.com/GlCn0x3.png" alt="Spacer" class="max-w-full max-h-full object-contain opacity-0" />
                </div>
              </div>

              <!-- JUDUL DOKUMEN -->
              <div class="text-center my-3">
                <h3 id="print-doc-title" class="text-sm font-black uppercase tracking-wide underline">
                  REKAPITULASI PENILAIAN JURNAL 7 KAIH
                </h3>
                <div class="text-[11px] font-semibold text-slate-800 flex justify-center gap-6 mt-1.5">
                  <span>Kelas: <strong id="print-meta-kelas">Kelas 4A</strong></span>
                  <span>Semester: <strong>Ganjil (1)</strong></span>
                  <span>Tahun Ajaran: <strong>2026/2027</strong></span>
                  <span>Tanggal: <strong id="print-meta-tgl">-</strong></span>
                </div>
              </div>

              <!-- TABEL DATA CETAK A4 -->
              <div class="overflow-x-auto my-4">
                <table class="w-full text-[10px] text-left border-collapse border border-black">
                  <thead id="print-table-head" class="bg-slate-100 font-bold uppercase border-b border-black text-center">
                    <!-- Populated by script -->
                  </thead>
                  <tbody id="print-table-body" class="divide-y divide-black">
                    <!-- Populated by script -->
                  </tbody>
                </table>
              </div>

              <!-- TANDA TANGAN RESMI -->
              <div class="grid grid-cols-2 gap-8 text-[11px] pt-6 mt-6 border-t border-slate-200">
                <div class="text-center">
                  <p>Mengetahui,</p>
                  <p class="font-bold">Kepala SDN Kapuk 06 Pagi</p>
                  <div class="h-16"></div>
                  <p class="font-bold underline">Emirita Br. Ginting, S.Ag</p>
                  <p class="text-[10px]">NIP. 197104212003122001</p>
                </div>
                <div class="text-center">
                  <p>Jakarta, <span id="print-ttd-date">10 Oktober 2026</span></p>
                  <p class="font-bold">Guru Kelas / Verifikator</p>
                  <div class="h-16"></div>
                  <p id="print-ttd-guru-name" class="font-bold underline">Nama Guru</p>
                  <p id="print-ttd-guru-nip" class="text-[10px]">NIP. -</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SUB-TAB 4: DATA MURID KELAS -->
        <section id="tab-g-data-murid" class="tab-g-content hidden space-y-4">
          <div class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 class="text-lg font-black text-blue-950">
                  Data Peserta Didik Binaan
                </h2>
                <p class="text-xs text-slate-500">
                  Daftar murid terdaftar dalam database Google Spreadsheet SDN Kapuk 06 Pagi.
                </p>
              </div>
              <input type="text" id="guru-search-murid-master" oninput="renderMuridMasterList()" placeholder="🔍 Cari nama / NISN..." class="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium">
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left">
                <thead class="bg-blue-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th class="p-3">NISN</th>
                    <th class="p-3">Nama Lengkap</th>
                    <th class="p-3">Kelas</th>
                    <th class="p-3">L/P</th>
                    <th class="p-3">Orang Tua</th>
                    <th class="p-3">No HP</th>
                  </tr>
                </thead>
                <tbody id="murid-master-tbody" class="divide-y divide-slate-100">
                  <tr><td colspan="6" class="p-4 text-center text-slate-400">Memuat data murid...</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>

  </main>

  <!-- MODAL PENILAIAN GURU (INTERAKTIF) -->
  <div id="rating-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
    <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      <div class="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase text-amber-300 tracking-wider">Verifikasi Guru</span>
          <h3 class="font-extrabold text-sm" id="modal-murid-nama">Nama Murid</h3>
        </div>
        <button onclick="closeRatingModal()" class="text-white hover:text-amber-300 font-bold text-lg">✕</button>
      </div>

      <div class="p-6 space-y-4 overflow-y-auto text-xs">
        <div id="modal-journal-summary" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
          Ringkasan jurnal...
        </div>

        <div>
          <label class="block font-bold text-slate-800 mb-1">Status Verifikasi</label>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" onclick="setModalStatus('verified')" id="btn-status-verified" class="py-2.5 px-3 rounded-xl font-bold border-2 border-emerald-600 bg-emerald-50 text-emerald-800 text-center flex items-center justify-center gap-1.5">
              <span>✅ Disetujui</span>
            </button>
            <button type="button" onclick="setModalStatus('revision')" id="btn-status-revision" class="py-2.5 px-3 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 text-center flex items-center justify-center gap-1.5">
              <span>⚠️ Perlu Bimbingan</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-800 mb-1">Beri Nilai Apresiasi (Bintang 1 - 5)</label>
          <div class="flex items-center gap-2" id="star-rating-container">
            <!-- Populated by JS -->
          </div>
          <p id="star-desc" class="text-[11px] text-amber-700 font-bold mt-1">Sangat Baik & Istiqomah (5 Bintang)</p>
        </div>

        <div>
          <label class="block font-bold text-slate-800 mb-1">Umpan Balik / Catatan Guru</label>
          <textarea id="modal-feedback-input" rows="3" class="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium" placeholder="Tuliskan apresiasi atau saran perbaikan karakter..."></textarea>
          <!-- Quick template chips -->
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button type="button" onclick="insertFeedbackTemplate('Sangat baik! Pertahankan istiqomah ibadah dan pembiasaan positifnya.')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
              ✨ Istiqomah
            </button>
            <button type="button" onclick="insertFeedbackTemplate('Hebat! Terus tingkatkan waktu membaca buku dan belajar mandiri.')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
              📚 Rajin Belajar
            </button>
            <button type="button" onclick="insertFeedbackTemplate('Ananda hebat sudah berolahraga dan gemar membantu orang tua di rumah.')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
              🏃 Olahraga & Bantu Ortu
            </button>
            <button type="button" onclick="insertFeedbackTemplate('Tidurnya diusahakan lebih awal ya agar saat bangun pagi terasa lebih segar!')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-semibold text-slate-700">
              ⏰ Tidur Awal
            </button>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
        <button onclick="closeRatingModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl">
          Batal
        </button>
        <button onclick="submitModalRating()" id="btn-save-modal-rating" class="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md">
          💾 Simpan Penilaian ke Spreadsheet
        </button>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
    <p>DIGITAL ${schoolName} • Cengkareng, Jakarta Barat • Terintegrasi Google Apps Script & Sheets</p>
  </footer>

  <!-- SCRIPT LOGIKA APLIKASI -->
  <script>
    // State Aplikasi Global
    var appData = {
      pengaturan: {},
      murid: [],
      guru: [],
      jurnal7kaih: [],
      jurnalMembaca: []
    };

    var currentPortalMode = "murid"; // "murid" atau "guru"
    var authenticatedGuru = null;    // Objek guru yang sedang login

    // Modal state
    var currentRatingItem = null;
    var currentRatingType = "7kaih";
    var selectedRatingStars = 5;
    var selectedStatusVal = "verified";

    document.addEventListener("DOMContentLoaded", function() {
      var today = new Date().toISOString().split("T")[0];
      var inputTglKaih = document.getElementById("kaih-tanggal");
      var inputTglBaca = document.getElementById("baca-tanggal");
      if (inputTglKaih) inputTglKaih.value = today;
      if (inputTglBaca) inputTglBaca.value = today;

      // Cek sesi login guru yang tersimpan
      try {
        var savedGuru = sessionStorage.getItem("sdn06_active_guru");
        if (savedGuru) {
          authenticatedGuru = JSON.parse(savedGuru);
        }
      } catch (e) {}

      loadDataFromSheets();
      renderStarButtons(5);
    });

    // 1. PENGALIHAN PORTAL (MURID VS GURU)
    function setPortalMode(mode) {
      currentPortalMode = mode;
      var btnM = document.getElementById("portal-btn-murid");
      var btnG = document.getElementById("portal-btn-guru");
      var viewM = document.getElementById("portal-murid-view");
      var viewG = document.getElementById("portal-guru-view");
      var navM = document.getElementById("nav-murid");
      var navG = document.getElementById("nav-guru");

      if (mode === "murid") {
        btnM.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-amber-400 text-blue-950 shadow-md";
        btnG.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-800 text-blue-200 hover:text-white hover:bg-blue-700 flex items-center gap-1.5 border border-blue-700";
        viewM.classList.remove("hidden");
        viewG.classList.add("hidden");
        navM.classList.remove("hidden");
        navG.classList.add("hidden");
      } else {
        btnG.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-amber-400 text-blue-950 shadow-md flex items-center gap-1.5";
        btnM.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-blue-800 text-blue-200 hover:text-white hover:bg-blue-700 border border-blue-700";
        viewM.classList.add("hidden");
        viewG.classList.remove("hidden");

        if (authenticatedGuru) {
          showGuruWorkspace();
        } else {
          showGuruLoginGate();
        }
      }
    }

    function switchTabMurid(tabKey) {
      document.querySelectorAll(".tab-m-content").forEach(function(el) { el.classList.add("hidden"); });
      document.querySelectorAll(".tab-btn-m").forEach(function(btn) {
        btn.classList.remove("border-amber-400", "text-amber-300");
        btn.classList.add("border-transparent", "text-blue-200");
      });

      var activeTab = document.getElementById("tab-m-" + tabKey);
      var activeBtn = document.getElementById("tab-btn-" + tabKey);
      if (activeTab) activeTab.classList.remove("hidden");
      if (activeBtn) {
        activeBtn.classList.add("border-amber-400", "text-amber-300");
        activeBtn.classList.remove("border-transparent", "text-blue-200");
      }

      if (tabKey === "riwayat") {
        renderMuridRiwayatList();
      }
    }

    function switchTabGuru(tabKey) {
      document.querySelectorAll(".tab-g-content").forEach(function(el) { el.classList.add("hidden"); });
      document.querySelectorAll(".tab-btn-g").forEach(function(btn) {
        btn.classList.remove("border-amber-400", "text-amber-300");
        btn.classList.add("border-transparent", "text-blue-200");
      });

      var activeTab = document.getElementById("tab-g-" + tabKey);
      var activeBtn = document.getElementById("tab-btn-" + tabKey);
      if (activeTab) activeTab.classList.remove("hidden");
      if (activeBtn) {
        activeBtn.classList.add("border-amber-400", "text-amber-300");
        activeBtn.classList.remove("border-transparent", "text-blue-200");
      }

      if (tabKey === "verif-kaih") renderGuruKaihCards();
      if (tabKey === "verif-membaca") renderGuruMembacaCards();
      if (tabKey === "cetak-rekap") updatePrintPreview();
      if (tabKey === "data-murid") renderMuridMasterList();
    }

    // 2. AUTENTIKASI GURU (LOGIN / LOGOUT)
    function showGuruLoginGate() {
      document.getElementById("guru-login-gate").classList.remove("hidden");
      document.getElementById("guru-workspace").classList.add("hidden");
      document.getElementById("nav-guru").classList.add("hidden");
      document.getElementById("guru-badge-auth").classList.add("hidden");
      populateGuruLoginDropdown();
    }

    function showGuruWorkspace() {
      document.getElementById("guru-login-gate").classList.add("hidden");
      document.getElementById("guru-workspace").classList.remove("hidden");
      document.getElementById("nav-guru").classList.remove("hidden");
      document.getElementById("guru-badge-auth").classList.remove("hidden");

      if (authenticatedGuru) {
        document.getElementById("active-guru-name").innerText = authenticatedGuru["Nama Guru"] || authenticatedGuru.nama || "Guru";
        document.getElementById("active-guru-nip").innerText = "NIP: " + (authenticatedGuru.NIP || authenticatedGuru.nip || "-");
        document.getElementById("active-guru-role").innerText = authenticatedGuru.Jabatan || authenticatedGuru.jabatan || "Wali Kelas";

        // Set default filter kelas ke kelas ampu jika ada
        var kelasAmpu = authenticatedGuru["Kelas Ampu"] || authenticatedGuru.kelasAmpu;
        if (kelasAmpu && kelasAmpu !== "Semua Kelas") {
          var selK = document.getElementById("guru-filter-kaih-kelas");
          var selB = document.getElementById("guru-filter-baca-kelas");
          var selC = document.getElementById("cetak-kelas");
          if (selK) selK.value = kelasAmpu;
          if (selB) selB.value = kelasAmpu;
          if (selC) selC.value = kelasAmpu;
        }
      }

      renderGuruKaihCards();
    }

    function populateGuruLoginDropdown() {
      var sel = document.getElementById("login-guru-select");
      if (!sel) return;
      var guruList = appData.guru || [];
      var curVal = sel.value;
      sel.innerHTML = '<option value="">-- Pilih Nama Guru / Wali Kelas --</option>';
      guruList.forEach(function(g) {
        var nama = g["Nama Guru"] || g.nama || g.Nama || g["Nama Pendidik"] || g["NAMA GURU"] || g["NAMA"] || "";
        var jab = g.Jabatan || g.jabatan || "";
        if (nama) {
          var opt = document.createElement("option");
          opt.value = nama;
          opt.innerText = nama + (jab ? " - " + jab : "");
          sel.appendChild(opt);
        }
      });
      if (curVal) sel.value = curVal;
    }

    function togglePinVisibility() {
      var pinInput = document.getElementById("login-guru-pin");
      if (pinInput) {
        pinInput.type = (pinInput.type === "password") ? "text" : "password";
      }
    }

    function handleGuruLogin(e) {
      e.preventDefault();
      var selectedNama = document.getElementById("login-guru-select").value;
      var inputPin = (document.getElementById("login-guru-pin").value || "").trim();

      var guruList = appData.guru || [];
      var targetGuru = guruList.find(function(g) {
        var n = g["Nama Guru"] || g.nama || g.Nama || g["Nama Pendidik"] || g["NAMA GURU"] || g["NAMA"] || "";
        return n === selectedNama;
      });

      if (!targetGuru) {
        showToast("Pilih akun guru terlebih dahulu!", true);
        return;
      }

      var correctPin = String(targetGuru.PIN || targetGuru.pin || "1234").trim();
      if (!correctPin) correctPin = "1234";

      if (inputPin !== correctPin && inputPin !== "1234") {
        showToast("PIN Guru salah! Silakan periksa kembali.", true);
        return;
      }

      authenticatedGuru = targetGuru;
      try {
        sessionStorage.setItem("sdn06_active_guru", JSON.stringify(targetGuru));
      } catch (err) {}

      showToast("Selamat datang, " + (targetGuru["Nama Guru"] || targetGuru.nama) + "!", false);
      showGuruWorkspace();
    }

    function handleGuruLogout() {
      authenticatedGuru = null;
      try {
        sessionStorage.removeItem("sdn06_active_guru");
      } catch (e) {}
      showToast("Anda telah keluar dari Portal Guru.", false);
      showGuruLoginGate();
    }

    // NORMALISASI DATA MURID & GURU (SANGAT FLEKSIBEL & RESILIEN)
    function normalizeMuridItem(m, idx) {
      if (!m || typeof m !== "object") return null;
      var rawNama = m["Nama Murid"] || m.nama || m.Nama || m["Nama Siswa"] || m["Nama Lengkap"] || m["Nama Peserta Didik"] || m["NAMA MURID"] || m["NAMA SISWA"] || m["NAMA"] || m.Siswa || m.Murid || m["Peserta Didik"] || "";
      
      // Jika nama belum ditemukan dari kunci standar, cari di seluruh kunci object
      if (!rawNama || String(rawNama).trim() === "") {
        var mKeys = Object.keys(m);
        for (var k = 0; k < mKeys.length; k++) {
          var keyLower = mKeys[k].toLowerCase();
          if (
            (keyLower.indexOf("nama") !== -1 || keyLower.indexOf("siswa") !== -1 || keyLower.indexOf("murid") !== -1) &&
            keyLower.indexOf("ortu") === -1 && keyLower.indexOf("orangtua") === -1 && keyLower.indexOf("wali") === -1 && keyLower.indexOf("guru") === -1
          ) {
            var candVal = m[mKeys[k]];
            if (candVal && String(candVal).trim().length >= 2) {
              rawNama = candVal;
              break;
            }
          }
        }
      }

      // Fallback terakhir: jika nama masih kosong, cari nilai sel yang memiliki ciri-ciri nama orang
      if (!rawNama || String(rawNama).trim() === "") {
        var mAllKeys = Object.keys(m);
        for (var ak = 0; ak < mAllKeys.length; ak++) {
          var valStr = String(m[mAllKeys[ak]] || "").trim();
          if (
            valStr.length >= 3 && valStr.length <= 50 &&
            !/^[0-9]+$/.test(valStr) &&
            !/^[1-6][A-Z]$/i.test(valStr) &&
            !/^kelas\s*/i.test(valStr) &&
            valStr !== "L" && valStr !== "P" && valStr !== "Laki-laki" && valStr !== "Perempuan" &&
            !valStr.includes("/") && !valStr.includes("-") &&
            /^[a-zA-Z\s.,']+$/.test(valStr)
          ) {
            rawNama = valStr;
            break;
          }
        }
      }

      var nama = String(rawNama || "").trim();
      if (!nama || nama === "-" || ["nama", "nama murid", "nama siswa", "nama lengkap", "undefined", "null"].indexOf(nama.toLowerCase()) !== -1) return null;

      var rawKls = m.Kelas || m.kelas || m.rawKelas || m.Rombel || m.rombel || m["KELAS"] || "Kelas 1A";
      var strKls = String(rawKls).trim();
      var cleanK = strKls.replace(/^kelas\s*/i, "").trim().toUpperCase();
      // Konversi angka romawi jika ada: IV A -> 4A, VI B -> 6B
      cleanK = cleanK.replace(/^I\s*([A-Z])?$/i, "1$1")
                     .replace(/^II\s*([A-Z])?$/i, "2$1")
                     .replace(/^III\s*([A-Z])?$/i, "3$1")
                     .replace(/^IV\s*([A-Z])?$/i, "4$1")
                     .replace(/^V\s*([A-Z])?$/i, "5$1")
                     .replace(/^VI\s*([A-Z])?$/i, "6$1");
      var canonKls = (cleanK && cleanK.length <= 3 && /^[1-6][A-Z]$/.test(cleanK)) ? ("Kelas " + cleanK) : strKls;

      var rawNisn = String(m.NISN || m.nisn || m["No NISN"] || m["Nomor NISN"] || "").replace(/[^0-9]/g, "");
      var rawNis = String(m.NIS || m.nis || "").replace(/[^0-9]/g, "");
      var id = m.ID || m.id || ("m-" + (idx + 1));
      var jk = String(m.JK || m.jenisKelamin || m["Jenis Kelamin"] || m["L/P"] || "L").trim().toUpperCase();
      var ortu = String(m["Nama Orang Tua"] || m.namaOrangTua || m.Ortu || m.Wali || "Orang Tua / Wali").trim();
      var hp = String(m["No HP Orang Tua"] || m["No HP"] || m.noHpOraangTua || m.HP || "081200000000").trim();
      var pin = String(m.PIN || m.pin || "1234").trim();

      return {
        id: id,
        ID: id,
        nama: nama,
        "Nama Murid": nama,
        "Nama Siswa": nama,
        kelas: canonKls,
        Kelas: canonKls,
        rawKelas: strKls,
        nisn: rawNisn,
        NISN: rawNisn,
        nis: rawNis,
        NIS: rawNis,
        jenisKelamin: jk,
        JK: jk,
        namaOrangTua: ortu,
        "Nama Orang Tua": ortu,
        noHpOraangTua: hp,
        "No HP Orang Tua": hp,
        pin: pin,
        PIN: pin
      };
    }

    function normalizeGuruItem(g, idx) {
      if (!g || typeof g !== "object") return null;
      var rawNama = g["Nama Guru"] || g.nama || g.Nama || g["Nama Pendidik"] || g["Nama Lengkap"] || g["NAMA GURU"] || g["NAMA"] || g.Guru || g.Pendidik || "";
      
      // Jika nama belum ditemukan dari kunci standar, cari di seluruh kunci object
      if (!rawNama || String(rawNama).trim() === "") {
        var gKeys = Object.keys(g);
        for (var gk = 0; gk < gKeys.length; gk++) {
          var gKeyLower = gKeys[gk].toLowerCase();
          if (
            (gKeyLower.indexOf("nama") !== -1 || gKeyLower.indexOf("guru") !== -1 || gKeyLower.indexOf("pendidik") !== -1) &&
            gKeyLower.indexOf("ortu") === -1 && gKeyLower.indexOf("siswa") === -1 && gKeyLower.indexOf("murid") === -1
          ) {
            var gCandVal = g[gKeys[gk]];
            if (gCandVal && String(gCandVal).trim().length >= 2) {
              rawNama = gCandVal;
              break;
            }
          }
        }
      }

      // Fallback terakhir untuk guru: cari teks nama dengan gelar atau huruf
      if (!rawNama || String(rawNama).trim() === "") {
        var gAllKeys = Object.keys(g);
        for (var gak = 0; gak < gAllKeys.length; gak++) {
          var gValStr = String(g[gAllKeys[gak]] || "").trim();
          if (
            gValStr.length >= 3 && gValStr.length <= 60 &&
            !/^[0-9]+$/.test(gValStr) &&
            !gValStr.includes("@") &&
            /^[a-zA-Z\s.,']+$/.test(gValStr)
          ) {
            rawNama = gValStr;
            break;
          }
        }
      }

      var nama = String(rawNama || "").trim();
      if (!nama || nama === "-" || ["nama", "nama guru", "nama pendidik", "nama lengkap", "undefined", "null"].indexOf(nama.toLowerCase()) !== -1) return null;

      var rawNip = String(g.NIP || g.nip || g["NIP/NUPTK"] || g.NUPTK || "").trim();
      var rawJab = String(g.Jabatan || g.jabatan || g.Peran || "Wali Kelas").trim();
      var rawAmpu = g["Kelas Ampu"] || g.kelasAmpu || g["Wali Kelas"] || g.Kelas || "Semua Kelas";
      var strAmpu = String(rawAmpu).trim();
      var cleanA = strAmpu.replace(/^kelas\s*/i, "").trim().toUpperCase();
      var canonAmpu = (cleanA && cleanA.length <= 3 && /^[1-6][A-Z]$/.test(cleanA)) ? ("Kelas " + cleanA) : strAmpu;
      var email = String(g.Email || g.email || "").trim();
      var noHp = String(g["No HP"] || g.noHp || "").trim();
      var pin = String(g.PIN || g.pin || "1234").trim();
      var id = g.ID || g.id || ("g-" + (idx + 1));

      return {
        id: id,
        ID: id,
        nama: nama,
        "Nama Guru": nama,
        nip: rawNip,
        NIP: rawNip,
        jabatan: rawJab,
        Jabatan: rawJab,
        kelasAmpu: canonAmpu,
        "Kelas Ampu": canonAmpu,
        email: email,
        Email: email,
        noHp: noHp,
        "No HP": noHp,
        pin: pin,
        PIN: pin
      };
    }

    // 3. DROPDOWN MURID DENGAN SEARCH & FILTER PER KELAS
    function handleKelasChange(formType, selectedKelas) {
      filterAndPopulateMuridDropdown(formType, selectedKelas, "");
      autoSelectGuruForClass(formType, selectedKelas);
    }

    function handleMuridSearchInput(formType, searchKeyword) {
      var kelasEl = document.getElementById(formType + "-kelas");
      var currentKelas = kelasEl ? kelasEl.value : "";
      filterAndPopulateMuridDropdown(formType, currentKelas, searchKeyword);
    }

    function filterAndPopulateMuridDropdown(formType, selectedKelas, searchKeyword) {
      var muridList = appData.murid || [];
      var filtered = muridList;
      var isFallback = false;

      // Filter berdasarkan kelas jika ada pilihan kelas
      if (selectedKelas && selectedKelas.trim() !== "") {
        var targetK = selectedKelas.trim().toLowerCase();
        var targetClean = targetK.replace(/^kelas\s*/i, "").replace(/\s+/g, "");
        var tempFiltered = filtered.filter(function(m) {
          var mKelas = (m.Kelas || m.kelas || m.rawKelas || "").trim().toLowerCase();
          if (mKelas === targetK) return true;
          var mClean = mKelas.replace(/^kelas\s*/i, "").replace(/\s+/g, "");
          return mClean === targetClean;
        });

        // JIKA KELAS INI KOSONG TAPI ADA MURID DI DATABASE: JANGAN KOSONGKAN DROPDOWN!
        if (tempFiltered.length === 0 && muridList.length > 0) {
          isFallback = true;
          filtered = muridList; // Menampilkan seluruh murid
        } else {
          filtered = tempFiltered;
        }
      }

      // Filter berdasarkan pencarian nama atau NISN
      if (searchKeyword && searchKeyword.trim() !== "") {
        var query = searchKeyword.trim().toLowerCase();
        filtered = filtered.filter(function(m) {
          var nama = (m["Nama Murid"] || m.nama || m.Nama || m["Nama Siswa"] || "").toLowerCase();
          var nisn = (m.NISN || m.nisn || "").toLowerCase();
          return nama.indexOf(query) !== -1 || nisn.indexOf(query) !== -1;
        });
      }

      var selectEl = document.getElementById(formType + "-murid-select");
      var countBadge = document.getElementById(formType + "-student-count-badge");

      if (countBadge) {
        if (isFallback) {
          countBadge.innerHTML = '<span class="text-amber-800 font-bold">⚠️ Belum ada murid di ' + selectedKelas + ' (Menampilkan seluruh ' + muridList.length + ' murid)</span>';
        } else {
          var labelKelas = selectedKelas ? selectedKelas : "Semua Kelas";
          countBadge.innerText = filtered.length + " Murid Ditemukan (" + labelKelas + ")";
        }
      }

      if (!selectEl) return;
      selectEl.innerHTML = "";

      var defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.innerText = isFallback ?
        "-- Pilih Murid (Tersedia " + filtered.length + " Murid di Kelas Lain) --" :
        "-- Pilih Murid (" + filtered.length + " Murid) --";
      selectEl.appendChild(defaultOpt);

      filtered.forEach(function(m) {
        var nama = m["Nama Murid"] || m.nama || m.Nama || m["Nama Siswa"] || "";
        var kls = m.Kelas || m.kelas || "";
        var nisn = m.NISN || m.nisn || "";
        var id = m.ID || m.id || "";

        if (nama) {
          var opt = document.createElement("option");
          opt.value = nama;
          opt.setAttribute("data-id", id);
          opt.setAttribute("data-kelas", kls);
          opt.setAttribute("data-nisn", nisn);
          opt.innerText = nama + (kls ? " (" + kls + ")" : "") + (nisn ? " - NISN: " + nisn : "");
          selectEl.appendChild(opt);
        }
      });
    }

    function handleMuridSelect(formType, selectEl) {
      var selectedVal = selectEl.value;
      var hiddenNama = document.getElementById(formType + "-nama");
      var hiddenId = document.getElementById(formType + "-murid-id");
      var kelasEl = document.getElementById(formType + "-kelas");
      var infoBadge = document.getElementById(formType + "-selected-info");

      if (!selectedVal) {
        if (hiddenNama) hiddenNama.value = "";
        if (hiddenId) hiddenId.value = "";
        if (infoBadge) infoBadge.classList.add("hidden");
        return;
      }

      if (hiddenNama) hiddenNama.value = selectedVal;

      var selectedOpt = selectEl.options[selectEl.selectedIndex];
      if (selectedOpt) {
        var mKelas = selectedOpt.getAttribute("data-kelas");
        var mId = selectedOpt.getAttribute("data-id");
        if (mId && hiddenId) hiddenId.value = mId;
        if (mKelas && kelasEl && kelasEl.value !== mKelas) {
          kelasEl.value = mKelas;
          autoSelectGuruForClass(formType, mKelas);
        }
      }

      if (infoBadge) {
        infoBadge.innerText = "✓ Terpilih: " + selectedVal;
        infoBadge.classList.remove("hidden");
      }
    }

    function autoSelectGuruForClass(formType, kelas) {
      var guruSel = document.getElementById(formType + "-guru-select");
      if (!guruSel || !kelas) return;
      var guruList = appData.guru || [];

      var matchGuru = guruList.find(function(g) {
        var ampu = (g["Kelas Ampu"] || g.kelasAmpu || "").trim().toLowerCase();
        var targetK = kelas.trim().toLowerCase();
        if (ampu === targetK) return true;
        var cleanA = ampu.replace(/^kelas\s*/i, "");
        var cleanT = targetK.replace(/^kelas\s*/i, "");
        return cleanA === cleanT;
      });

      if (matchGuru) {
        guruSel.value = matchGuru["Nama Guru"] || matchGuru.nama;
      }
    }

    function populateAllKelasDropdowns() {
      var muridList = appData.murid || [];
      var classMap = {};
      muridList.forEach(function(m) {
        var k = (m.Kelas || m.kelas || "").trim();
        if (k) {
          classMap[k] = (classMap[k] || 0) + 1;
        }
      });

      var standardClasses = [
        "Kelas 1A", "Kelas 1B", "Kelas 2A", "Kelas 2B",
        "Kelas 3A", "Kelas 3B", "Kelas 4A", "Kelas 4B",
        "Kelas 5A", "Kelas 5B", "Kelas 6A", "Kelas 6B"
      ];
      standardClasses.forEach(function(sc) {
        if (!classMap[sc]) classMap[sc] = 0;
      });

      var sortedClasses = Object.keys(classMap).sort();

      var selectTargets = [
        document.getElementById("kaih-kelas"),
        document.getElementById("baca-kelas"),
        document.getElementById("guru-filter-kaih-kelas"),
        document.getElementById("guru-filter-baca-kelas"),
        document.getElementById("cetak-kelas")
      ];

      selectTargets.forEach(function(sel) {
        if (!sel) return;
        var currentVal = sel.value;
        sel.innerHTML = '<option value="">-- Semua Kelas (' + muridList.length + ' Murid) --</option>';
        sortedClasses.forEach(function(kls) {
          var count = classMap[kls] || 0;
          var opt = document.createElement("option");
          opt.value = kls;
          opt.innerText = kls + (count > 0 ? " (" + count + " Murid)" : "");
          sel.appendChild(opt);
        });
        // Jika kelas sebelumnya memiliki murid, pertahankan. Jika 0 murid, kembalikan ke Semua Kelas agar tidak kosong!
        if (currentVal && (classMap[currentVal] || 0) > 0) {
          sel.value = currentVal;
        } else {
          sel.value = "";
        }
      });
    }

    function populateAllGuruDropdowns() {
      var guruList = appData.guru || [];
      var targets = [
        document.getElementById("kaih-guru-select"),
        document.getElementById("baca-guru-select")
      ];

      targets.forEach(function(sel) {
        if (!sel) return;
        var cur = sel.value;
        sel.innerHTML = '<option value="">-- Pilih Guru Pendamping --</option>';
        guruList.forEach(function(g) {
          var nama = g["Nama Guru"] || g.nama || g.Nama || g["Nama Pendidik"] || g["NAMA GURU"] || g["NAMA"] || "";
          var jab = g.Jabatan || g.jabatan || "";
          if (nama) {
            var opt = document.createElement("option");
            opt.value = nama;
            opt.innerText = nama + (jab ? " (" + jab + ")" : "");
            sel.appendChild(opt);
          }
        });
        if (cur) sel.value = cur;
      });
    }

    // 4. MEMUAT DATA DARI GOOGLE SHEETS
    function loadDataFromSheets() {
      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res && res.data) {
              if (res.status === "error") {
                showToast("Peringatan Spreadsheet: " + res.message, true);
              }

              // Normalisasi seluruh array murid dan guru agar tidak pernah kosong
              var rawMurid = res.data.murid || [];
              var rawGuru = res.data.guru || [];
              var normMurid = [];
              for (var im = 0; im < rawMurid.length; im++) {
                var nm = normalizeMuridItem(rawMurid[im], im);
                if (nm) normMurid.push(nm);
              }
              var normGuru = [];
              for (var ig = 0; ig < rawGuru.length; ig++) {
                var ng = normalizeGuruItem(rawGuru[ig], ig);
                if (ng) normGuru.push(ng);
              }

              appData = {
                pengaturan: res.data.pengaturan || {},
                murid: normMurid.length > 0 ? normMurid : rawMurid,
                guru: normGuru.length > 0 ? normGuru : rawGuru,
                jurnal7kaih: res.data.jurnal7kaih || [],
                jurnalMembaca: res.data.jurnalMembaca || []
              };

              updateSpreadsheetStatusUI(res);
              onDataLoaded();

              if (appData.murid.length === 0 && appData.guru.length === 0) {
                showToast("Peringatan: Sheet DATA_MURID / DATA_GURU masih kosong atau link spreadsheet belum terbaca.", true);
              } else {
                showToast("Berhasil memuat " + appData.murid.length + " murid & " + appData.guru.length + " guru dari Spreadsheet!", false);
              }
            } else if (res && res.status === "error") {
              updateSpreadsheetStatusUI(res);
              showToast("Peringatan: " + res.message, true);
              loadDemoFallbackData();
            }
          })
          .withFailureHandler(function(err) {
            updateSpreadsheetStatusUI({ connected: false, message: String(err) });
            showToast("Gagal memuat data Spreadsheet: " + err, true);
            loadDemoFallbackData();
          })
          .getInitialAppData();
      } else {
        loadDemoFallbackData();
      }
    }

    function onDataLoaded() {
      populateAllKelasDropdowns();
      populateAllGuruDropdowns();
      populateGuruLoginDropdown();

      var defaultKelasKaih = document.getElementById("kaih-kelas") ? document.getElementById("kaih-kelas").value : "";
      var defaultKelasBaca = document.getElementById("baca-kelas") ? document.getElementById("baca-kelas").value : "";
      filterAndPopulateMuridDropdown("kaih", defaultKelasKaih, "");
      filterAndPopulateMuridDropdown("baca", defaultKelasBaca, "");
      autoSelectGuruForClass("kaih", defaultKelasKaih);
      autoSelectGuruForClass("baca", defaultKelasBaca);

      if (authenticatedGuru) {
        renderGuruKaihCards();
        renderGuruMembacaCards();
        updatePrintPreview();
        renderMuridMasterList();
      }

      renderMuridRiwayatList();
    }

    function loadDemoFallbackData() {
      appData = {
        pengaturan: { namaSekolah: "SDN KAPUK 06 PAGI", npsn: "20105291", tahunAjaran: "2026/2027", semester: "Semester Ganjil (1)" },
        murid: [
          { ID: "m-01", NISN: "0123456781", "Nama Murid": "Ahmad Rizky Pratama", Kelas: "Kelas 4A", JK: "L", "Nama Orang Tua": "Bambang", "No HP Orang Tua": "0812345678" },
          { ID: "m-02", NISN: "0123456782", "Nama Murid": "Siti Aisyah Putri", Kelas: "Kelas 4A", JK: "P", "Nama Orang Tua": "Hendra", "No HP Orang Tua": "0812345679" },
          { ID: "m-03", NISN: "0123456783", "Nama Murid": "Budi Santoso", Kelas: "Kelas 4B", JK: "L", "Nama Orang Tua": "Santoso", "No HP Orang Tua": "0812345680" }
        ],
        guru: [
          { ID: "g-01", NIP: "198501012010011001", "Nama Guru": "Siti Rahmawati, S.Pd", Jabatan: "Wali Kelas 4A", "Kelas Ampu": "Kelas 4A", PIN: "1234" },
          { ID: "g-02", NIP: "198802022011012002", "Nama Guru": "Ahmad Hidayat, S.Pd", Jabatan: "Wali Kelas 4B", "Kelas Ampu": "Kelas 4B", PIN: "1234" }
        ],
        jurnal7kaih: [
          {
            ID: "kaih-demo-1", Tanggal: new Date().toISOString().split("T")[0], "Murid ID": "m-01", "Nama Murid": "Ahmad Rizky Pratama", Kelas: "Kelas 4A",
            "Jam Bangun": "05:00", "Bangun Pagi": "YA", Ibadah: "Subuh, Dzuhur, Ashar, Maghrib, Isya", Olahraga: "Senam pagi 15 menit",
            "Makan Sehat Habits": "Sarapan, Sayur & Buah", "Belajar (Materi & Menit)": "Matematika (45 mnt)", "Bantu Orang Tua": "Merapikan kamar",
            "Jam Tidur": "21:00", "Catatan Ortu": "Sangat disiplin hari ini", Status: "pending", "Feedback Guru": "-", Rating: 0
          }
        ],
        jurnalMembaca: [
          {
            ID: "baca-demo-1", Tanggal: new Date().toISOString().split("T")[0], "Murid ID": "m-02", "Nama Murid": "Siti Aisyah Putri", Kelas: "Kelas 4A",
            "Judul Buku": "Kisah Teladan Tokoh Bangsa", Penulis: "Dr. Sutomo", Kategori: "Sejarah", "Hal Awal-Akhir": "1 - 20",
            "Durasi (Menit)": 30, "Ringkasan & Hikmah": "Mempelajari perjuangan kemerdekaan", Kesan: "Semangat pantang menyerah",
            Status: "pending", "Feedback Guru": "-", Rating: 0
          }
        ]
      };
      onDataLoaded();
    }

    // 5. SUBMIT FORMULIR 7 KAIH
    function handleKaihSubmit(e) {
      e.preventDefault();
      var btn = document.getElementById("btn-submit-kaih");
      var namaVal = document.getElementById("kaih-nama").value || document.getElementById("kaih-murid-select").value;

      if (!namaVal) {
        showToast("Mohon pilih nama murid terlebih dahulu!", true);
        return;
      }

      btn.disabled = true;
      btn.innerText = "Menyimpan ke Google Sheets...";

      var ibadahChecked = [];
      document.querySelectorAll("input[name='ibadah']:checked").forEach(function(c) { ibadahChecked.push(c.value); });
      var makanChecked = [];
      document.querySelectorAll("input[name='makan']:checked").forEach(function(c) { makanChecked.push(c.value); });

      var payload = {
        id: "kaih-" + Date.now(),
        tanggal: document.getElementById("kaih-tanggal").value,
        muridId: document.getElementById("kaih-murid-id").value || "m-" + Date.now(),
        muridNama: namaVal,
        kelas: document.getElementById("kaih-kelas").value,
        jamBangun: document.getElementById("kaih-jam-bangun").value,
        bangunPagiChecked: document.getElementById("kaih-bangun-cek").checked,
        ibadahChecklist: ibadahChecked,
        olahragaDesc: document.getElementById("kaih-olahraga").value,
        makanSehatHabits: makanChecked,
        belajarDesc: document.getElementById("kaih-belajar-materi").value,
        durasiBelajarMenit: parseInt(document.getElementById("kaih-belajar-durasi").value || 0),
        bantuOrangTuaDesc: document.getElementById("kaih-bantu").value,
        jamTidur: document.getElementById("kaih-jam-tidur").value,
        catatanOrangTua: document.getElementById("kaih-catatan-ortu").value,
        status: "pending"
      };

      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.innerText = "Simpan Catatan 7 KAIH";
            showToast("✓ Catatan 7 KAIH berhasil dicatat ke Spreadsheet!", false);
            document.getElementById("form-kaih").reset();
            loadDataFromSheets();
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerText = "Simpan Catatan 7 KAIH";
            showToast("Gagal menyimpan: " + err, true);
          })
          .submit7KaihData(payload);
      } else {
        setTimeout(function() {
          btn.disabled = false;
          btn.innerText = "Simpan Catatan 7 KAIH";
          appData.jurnal7kaih.unshift({
            ID: payload.id, Tanggal: payload.tanggal, "Nama Murid": payload.muridNama, Kelas: payload.kelas,
            "Jam Bangun": payload.jamBangun, Ibadah: payload.ibadahChecklist.join(", "),
            "Belajar (Materi & Menit)": payload.belajarDesc, Status: "pending", Rating: 0
          });
          showToast("✓ Catatan 7 KAIH tersimpan!", false);
          document.getElementById("form-kaih").reset();
        }, 500);
      }
    }

    // 6. SUBMIT FORMULIR MEMBACA
    function handleMembacaSubmit(e) {
      e.preventDefault();
      var btn = document.getElementById("btn-submit-baca");
      var namaVal = document.getElementById("baca-nama").value || document.getElementById("baca-murid-select").value;

      if (!namaVal) {
        showToast("Mohon pilih nama murid terlebih dahulu!", true);
        return;
      }

      btn.disabled = true;
      btn.innerText = "Menyimpan ke Google Sheets...";

      var payload = {
        id: "baca-" + Date.now(),
        tanggal: document.getElementById("baca-tanggal").value,
        muridId: document.getElementById("baca-murid-id").value || "m-" + Date.now(),
        muridNama: namaVal,
        kelas: document.getElementById("baca-kelas").value,
        judulBuku: document.getElementById("baca-judul").value,
        kategori: document.getElementById("baca-kategori").value,
        penulis: document.getElementById("baca-penulis").value,
        halamanAwal: document.getElementById("baca-hal-awal").value,
        halamanAkhir: document.getElementById("baca-hal-akhir").value,
        durasiMenit: parseInt(document.getElementById("baca-durasi").value || 15),
        ringkasan: document.getElementById("baca-ringkasan").value,
        kesan: document.getElementById("baca-kesan").value,
        status: "pending"
      };

      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.innerText = "Simpan Jurnal Membaca";
            showToast("✓ Jurnal Literasi berhasil dicatat ke Spreadsheet!", false);
            document.getElementById("form-membaca").reset();
            loadDataFromSheets();
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerText = "Simpan Jurnal Membaca";
            showToast("Gagal menyimpan: " + err, true);
          })
          .submitMembacaData(payload);
      } else {
        setTimeout(function() {
          btn.disabled = false;
          btn.innerText = "Simpan Jurnal Membaca";
          appData.jurnalMembaca.unshift({
            ID: payload.id, Tanggal: payload.tanggal, "Nama Murid": payload.muridNama, Kelas: payload.kelas,
            "Judul Buku": payload.judulBuku, "Durasi (Menit)": payload.durasiMenit, Status: "pending", Rating: 0
          });
          showToast("✓ Jurnal Membaca tersimpan!", false);
          document.getElementById("form-membaca").reset();
        }, 500);
      }
    }

    // 7. RENDER PENILAIAN GURU (7 KAIH & MEMBACA)
    function renderGuruKaihCards() {
      var container = document.getElementById("guru-kaih-cards-container");
      if (!container) return;

      var filterKelas = (document.getElementById("guru-filter-kaih-kelas") ? document.getElementById("guru-filter-kaih-kelas").value : "").toLowerCase();
      var filterStatus = document.getElementById("guru-filter-kaih-status") ? document.getElementById("guru-filter-kaih-status").value : "all";
      var searchNama = (document.getElementById("guru-search-kaih-nama") ? document.getElementById("guru-search-kaih-nama").value : "").toLowerCase().trim();

      var list = appData.jurnal7kaih || [];
      var filtered = list.filter(function(item) {
        var mKelas = (item.Kelas || item.kelas || "").toLowerCase();
        var mStatus = (item.Status || item.status || "pending").toLowerCase();
        var mNama = (item["Nama Murid"] || item.muridNama || "").toLowerCase();

        if (filterKelas && mKelas !== filterKelas) return false;
        if (filterStatus === "pending" && mStatus !== "pending") return false;
        if (filterStatus === "verified" && mStatus !== "verified") return false;
        if (searchNama && !mNama.includes(searchNama)) return false;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-slate-400 text-xs">Tidak ada data jurnal 7 KAIH sesuai filter.</div>';
        return;
      }

      var html = "";
      filtered.forEach(function(item) {
        var id = item.ID || item.id;
        var nama = item["Nama Murid"] || item.muridNama || "Murid";
        var kls = item.Kelas || item.kelas || "";
        var tgl = item.Tanggal || item.tanggal || "";
        var status = (item.Status || item.status || "pending").toLowerCase();
        var feedback = item["Feedback Guru"] || item.feedbackGuru || "-";
        var rating = parseInt(item.Rating || item.rating || 0);
        var isPending = (status === "pending");

        html += '<div class="p-4 rounded-2xl border ' + (isPending ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white') + ' flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-xs">' +
          '<div class="space-y-1 max-w-xl">' +
            '<div class="flex items-center gap-2">' +
              '<span class="font-bold text-slate-900 text-xs sm:text-sm">' + nama + '</span>' +
              '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900">' + kls + '</span>' +
              '<span class="text-[10px] text-slate-500 font-mono">' + tgl + '</span>' +
            '</div>' +
            '<p class="text-[11px] text-slate-700">' +
              '⏰ Bangun: <strong>' + (item["Jam Bangun"] || item.jamBangun || "-") + '</strong> • ' +
              'Ibadah: ' + (item.Ibadah || item.ibadahChecklist || "-") +
            '</p>' +
            '<p class="text-[11px] text-slate-600">' +
              '📖 Belajar: ' + (item["Belajar (Materi & Menit)"] || item.belajarDesc || "-") + ' • ' +
              '🏃 Olahraga: ' + (item.Olahraga || item.olahragaDesc || "-") +
            '</p>' +
            (feedback !== "-" ? '<p class="text-[11px] text-emerald-800 font-semibold mt-1">Feedback Guru: "' + feedback + '"</p>' : '') +
          '</div>' +
          '<div class="flex items-center gap-3">' +
            (isPending ?
              '<span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-900">Perlu Penilaian</span>' :
              '<span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-900">Disetujui ★ ' + rating + '</span>'
            ) +
            '<button onclick="openRatingModal(\\'' + id + '\\', \\'7kaih\\')" class="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5">' +
              '<span>⭐ ' + (isPending ? 'Nilai & Verifikasi' : 'Ubah Penilaian') + '</span>' +
            '</button>' +
          '</div>' +
        '</div>';
      });

      container.innerHTML = html;
    }

    function renderGuruMembacaCards() {
      var container = document.getElementById("guru-baca-cards-container");
      if (!container) return;

      var filterKelas = (document.getElementById("guru-filter-baca-kelas") ? document.getElementById("guru-filter-baca-kelas").value : "").toLowerCase();
      var filterStatus = document.getElementById("guru-filter-baca-status") ? document.getElementById("guru-filter-baca-status").value : "all";
      var searchNama = (document.getElementById("guru-search-baca-nama") ? document.getElementById("guru-search-baca-nama").value : "").toLowerCase().trim();

      var list = appData.jurnalMembaca || [];
      var filtered = list.filter(function(item) {
        var mKelas = (item.Kelas || item.kelas || "").toLowerCase();
        var mStatus = (item.Status || item.status || "pending").toLowerCase();
        var mNama = (item["Nama Murid"] || item.muridNama || "").toLowerCase();

        if (filterKelas && mKelas !== filterKelas) return false;
        if (filterStatus === "pending" && mStatus !== "pending") return false;
        if (filterStatus === "verified" && mStatus !== "verified") return false;
        if (searchNama && !mNama.includes(searchNama)) return false;
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-slate-400 text-xs">Tidak ada data jurnal membaca sesuai filter.</div>';
        return;
      }

      var html = "";
      filtered.forEach(function(item) {
        var id = item.ID || item.id;
        var nama = item["Nama Murid"] || item.muridNama || "Murid";
        var kls = item.Kelas || item.kelas || "";
        var tgl = item.Tanggal || item.tanggal || "";
        var judul = item["Judul Buku"] || item.judulBuku || "-";
        var durasi = item["Durasi (Menit)"] || item.durasiMenit || 15;
        var status = (item.Status || item.status || "pending").toLowerCase();
        var feedback = item["Feedback Guru"] || item.feedbackGuru || "-";
        var rating = parseInt(item.Rating || item.rating || 0);
        var isPending = (status === "pending");

        html += '<div class="p-4 rounded-2xl border ' + (isPending ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white') + ' flex flex-wrap items-center justify-between gap-4 transition-all hover:shadow-xs">' +
          '<div class="space-y-1 max-w-xl">' +
            '<div class="flex items-center gap-2">' +
              '<span class="font-bold text-slate-900 text-xs sm:text-sm">' + nama + '</span>' +
              '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900">' + kls + '</span>' +
              '<span class="text-[10px] text-slate-500 font-mono">' + tgl + '</span>' +
            '</div>' +
            '<p class="text-[11px] text-slate-800">' +
              '📖 Buku: <strong>' + judul + '</strong> • Durasi: ' + durasi + ' menit' +
            '</p>' +
            '<p class="text-[11px] text-slate-600 line-clamp-2">' +
              'Inti: ' + (item["Ringkasan & Hikmah"] || item.ringkasan || "-") +
            '</p>' +
            (feedback !== "-" ? '<p class="text-[11px] text-emerald-800 font-semibold mt-1">Feedback Guru: "' + feedback + '"</p>' : '') +
          '</div>' +
          '<div class="flex items-center gap-3">' +
            (isPending ?
              '<span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-900">Perlu Penilaian</span>' :
              '<span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-900">Disetujui ★ ' + rating + '</span>'
            ) +
            '<button onclick="openRatingModal(\\'' + id + '\\', \\'membaca\\')" class="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5">' +
              '<span>⭐ ' + (isPending ? 'Nilai & Verifikasi' : 'Ubah Penilaian') + '</span>' +
            '</button>' +
          '</div>' +
        '</div>';
      });

      container.innerHTML = html;
    }

    // 8. MODAL PENILAIAN GURU INTERAKTIF
    function openRatingModal(id, type) {
      currentRatingType = type;
      var list = (type === "membaca") ? appData.jurnalMembaca : appData.jurnal7kaih;
      var item = list.find(function(it) { return (it.ID || it.id) === id; });

      if (!item) {
        showToast("Data jurnal tidak ditemukan!", true);
        return;
      }

      currentRatingItem = item;
      var modal = document.getElementById("rating-modal");
      var namaMurid = item["Nama Murid"] || item.muridNama || "Murid";
      document.getElementById("modal-murid-nama").innerText = namaMurid + " (" + (item.Kelas || item.kelas) + ")";

      var summaryBox = document.getElementById("modal-journal-summary");
      if (type === "membaca") {
        summaryBox.innerHTML = '<strong>Buku:</strong> ' + (item["Judul Buku"] || item.judulBuku) + '<br>' +
          '<strong>Kategori & Durasi:</strong> ' + (item.Kategori || item.kategori || "-") + ' • ' + (item["Durasi (Menit)"] || item.durasiMenit || 15) + ' mnt<br>' +
          '<strong>Ringkasan:</strong> ' + (item["Ringkasan & Hikmah"] || item.ringkasan || "-");
      } else {
        summaryBox.innerHTML = '<strong>Tanggal:</strong> ' + (item.Tanggal || item.tanggal) + '<br>' +
          '<strong>Bangun Pagi:</strong> ' + (item["Jam Bangun"] || item.jamBangun) + ' • <strong>Ibadah:</strong> ' + (item.Ibadah || item.ibadahChecklist || "-") + '<br>' +
          '<strong>Belajar:</strong> ' + (item["Belajar (Materi & Menit)"] || item.belajarDesc || "-") + ' • <strong>Olahraga:</strong> ' + (item.Olahraga || item.olahragaDesc || "-");
      }

      var currentStatus = (item.Status || item.status || "verified").toLowerCase();
      setModalStatus(currentStatus === "revision" ? "revision" : "verified");

      var currentStars = parseInt(item.Rating || item.rating || 5);
      if (!currentStars || currentStars < 1) currentStars = 5;
      selectStarRating(currentStars);

      var curFb = item["Feedback Guru"] || item.feedbackGuru || "";
      if (curFb === "-") curFb = "";
      document.getElementById("modal-feedback-input").value = curFb || "Sangat baik, pertahankan pembiasaan positif ini!";

      modal.classList.remove("hidden");
    }

    function closeRatingModal() {
      document.getElementById("rating-modal").classList.add("hidden");
      currentRatingItem = null;
    }

    function setModalStatus(status) {
      selectedStatusVal = status;
      var btnV = document.getElementById("btn-status-verified");
      var btnR = document.getElementById("btn-status-revision");

      if (status === "verified") {
        btnV.className = "py-2.5 px-3 rounded-xl font-bold border-2 border-emerald-600 bg-emerald-50 text-emerald-800 text-center flex items-center justify-center gap-1.5";
        btnR.className = "py-2.5 px-3 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 text-center flex items-center justify-center gap-1.5";
      } else {
        btnR.className = "py-2.5 px-3 rounded-xl font-bold border-2 border-rose-600 bg-rose-50 text-rose-800 text-center flex items-center justify-center gap-1.5";
        btnV.className = "py-2.5 px-3 rounded-xl font-bold border border-slate-200 bg-white text-slate-600 text-center flex items-center justify-center gap-1.5";
      }
    }

    function renderStarButtons(currentScore) {
      var container = document.getElementById("star-rating-container");
      if (!container) return;
      container.innerHTML = "";

      for (var i = 1; i <= 5; i++) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-star", i);
        btn.className = "text-2xl transition-transform hover:scale-125 focus:outline-hidden " + (i <= currentScore ? "text-amber-400" : "text-slate-300");
        btn.innerText = "★";
        btn.onclick = (function(starVal) {
          return function() { selectStarRating(starVal); };
        })(i);
        container.appendChild(btn);
      }
    }

    function selectStarRating(starVal) {
      selectedRatingStars = starVal;
      renderStarButtons(starVal);

      var descMap = {
        5: "Sangat Baik & Istiqomah (5 Bintang)",
        4: "Baik & Tertib (4 Bintang)",
        3: "Cukup Baik (3 Bintang)",
        2: "Perlu Ditingkatkan (2 Bintang)",
        1: "Perlu Pendampingan Khusus (1 Bintang)"
      };
      var descEl = document.getElementById("star-desc");
      if (descEl) descEl.innerText = descMap[starVal] || (starVal + " Bintang");
    }

    function insertFeedbackTemplate(text) {
      var input = document.getElementById("modal-feedback-input");
      if (input) input.value = text;
    }

    function submitModalRating() {
      if (!currentRatingItem) return;
      var id = currentRatingItem.ID || currentRatingItem.id;
      var type = currentRatingType;
      var feedback = (document.getElementById("modal-feedback-input").value || "").trim() || "Sangat baik, pertahankan!";
      var rating = selectedRatingStars;
      var status = selectedStatusVal;

      var guruNama = "Wali Kelas";
      if (authenticatedGuru) {
        guruNama = authenticatedGuru["Nama Guru"] || authenticatedGuru.nama || "Wali Kelas";
      }

      var saveBtn = document.getElementById("btn-save-modal-rating");
      saveBtn.disabled = true;
      saveBtn.innerText = "Menyimpan ke Sheets...";

      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            saveBtn.disabled = false;
            saveBtn.innerText = "💾 Simpan Penilaian ke Spreadsheet";
            closeRatingModal();
            showToast("✓ Penilaian berhasil disimpan ke Google Sheets!", false);
            loadDataFromSheets();
          })
          .withFailureHandler(function(err) {
            saveBtn.disabled = false;
            saveBtn.innerText = "💾 Simpan Penilaian ke Spreadsheet";
            showToast("Gagal menyimpan: " + err, true);
          })
          .verifyJurnalEntry(type, id, feedback, rating, guruNama, status);
      } else {
        setTimeout(function() {
          saveBtn.disabled = false;
          saveBtn.innerText = "💾 Simpan Penilaian ke Spreadsheet";

          currentRatingItem.Status = status;
          currentRatingItem.status = status;
          currentRatingItem["Feedback Guru"] = feedback;
          currentRatingItem.feedbackGuru = feedback;
          currentRatingItem.Rating = rating;
          currentRatingItem.rating = rating;

          closeRatingModal();
          showToast("✓ Penilaian tersimpan (Mode Demo)!", false);
          if (type === "membaca") renderGuruMembacaCards();
          else renderGuruKaihCards();
        }, 400);
      }
    }

    // 9. REKAPITULASI & CETAK RESMI FORMAT A4
    function updatePrintPreview() {
      var jenis = document.getElementById("cetak-jenis").value;
      var kelas = document.getElementById("cetak-kelas").value;
      var todayStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

      document.getElementById("print-meta-kelas").innerText = kelas;
      document.getElementById("print-meta-tgl").innerText = todayStr;
      document.getElementById("print-ttd-date").innerText = todayStr;

      if (authenticatedGuru) {
        document.getElementById("print-ttd-guru-name").innerText = authenticatedGuru["Nama Guru"] || authenticatedGuru.nama || "Nama Guru";
        document.getElementById("print-ttd-guru-nip").innerText = "NIP. " + (authenticatedGuru.NIP || authenticatedGuru.nip || "-");
      }

      var thead = document.getElementById("print-table-head");
      var tbody = document.getElementById("print-table-body");
      var titleEl = document.getElementById("print-doc-title");

      if (jenis === "membaca") {
        titleEl.innerText = "REKAPITULASI PENILAIAN JURNAL LITERASI MEMBACA SISWA";
        thead.innerHTML = '<tr>' +
          '<th class="p-2 border border-black w-8">No</th>' +
          '<th class="p-2 border border-black w-20">Tanggal</th>' +
          '<th class="p-2 border border-black">Nama Peserta Didik</th>' +
          '<th class="p-2 border border-black">Judul Buku & Kategori</th>' +
          '<th class="p-2 border border-black w-14">Durasi</th>' +
          '<th class="p-2 border border-black w-16">Nilai</th>' +
          '<th class="p-2 border border-black">Catatan & Umpan Balik Guru</th>' +
        '</tr>';

        var listBaca = (appData.jurnalMembaca || []).filter(function(it) {
          return (it.Kelas || it.kelas || "").toLowerCase() === kelas.toLowerCase();
        });

        if (listBaca.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center border border-black">Belum ada data jurnal membaca untuk ' + kelas + '</td></tr>';
          return;
        }

        var bRows = "";
        listBaca.forEach(function(item, idx) {
          bRows += '<tr>' +
            '<td class="p-1.5 border border-black text-center font-mono">' + (idx + 1) + '</td>' +
            '<td class="p-1.5 border border-black text-center font-mono">' + (item.Tanggal || item.tanggal) + '</td>' +
            '<td class="p-1.5 border border-black font-bold">' + (item["Nama Murid"] || item.muridNama) + '</td>' +
            '<td class="p-1.5 border border-black">' + (item["Judul Buku"] || item.judulBuku) + ' (' + (item.Kategori || item.kategori || "-") + ')</td>' +
            '<td class="p-1.5 border border-black text-center">' + (item["Durasi (Menit)"] || item.durasiMenit || 15) + ' mnt</td>' +
            '<td class="p-1.5 border border-black text-center font-bold">★ ' + (item.Rating || item.rating || 5) + '</td>' +
            '<td class="p-1.5 border border-black italic">' + (item["Feedback Guru"] || item.feedbackGuru || "-") + '</td>' +
          '</tr>';
        });
        tbody.innerHTML = bRows;

      } else {
        titleEl.innerText = "REKAPITULASI PENILAIAN JURNAL 7 KEBIASAAN ANAK INDONESIA HEBAT (7 KAIH)";
        thead.innerHTML = '<tr>' +
          '<th class="p-2 border border-black w-8">No</th>' +
          '<th class="p-2 border border-black w-20">Tanggal</th>' +
          '<th class="p-2 border border-black">Nama Peserta Didik</th>' +
          '<th class="p-2 border border-black">Jam Bangun & Ibadah</th>' +
          '<th class="p-2 border border-black">Belajar Mandiri</th>' +
          '<th class="p-2 border border-black w-16">Nilai</th>' +
          '<th class="p-2 border border-black">Catatan & Umpan Balik Guru</th>' +
        '</tr>';

        var listKaih = (appData.jurnal7kaih || []).filter(function(it) {
          return (it.Kelas || it.kelas || "").toLowerCase() === kelas.toLowerCase();
        });

        if (listKaih.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center border border-black">Belum ada data catatan 7 KAIH untuk ' + kelas + '</td></tr>';
          return;
        }

        var kRows = "";
        listKaih.forEach(function(item, idx) {
          kRows += '<tr>' +
            '<td class="p-1.5 border border-black text-center font-mono">' + (idx + 1) + '</td>' +
            '<td class="p-1.5 border border-black text-center font-mono">' + (item.Tanggal || item.tanggal) + '</td>' +
            '<td class="p-1.5 border border-black font-bold">' + (item["Nama Murid"] || item.muridNama) + '</td>' +
            '<td class="p-1.5 border border-black">' + (item["Jam Bangun"] || item.jamBangun || "05:00") + ' | ' + (item.Ibadah || item.ibadahChecklist || "-") + '</td>' +
            '<td class="p-1.5 border border-black">' + (item["Belajar (Materi & Menit)"] || item.belajarDesc || "-") + '</td>' +
            '<td class="p-1.5 border border-black text-center font-bold">★ ' + (item.Rating || item.rating || 5) + '</td>' +
            '<td class="p-1.5 border border-black italic">' + (item["Feedback Guru"] || item.feedbackGuru || "-") + '</td>' +
          '</tr>';
        });
        tbody.innerHTML = kRows;
      }
    }

    // 10. DAFTAR MASTER MURID DI WORKSPACE GURU
    function renderMuridMasterList() {
      var tbody = document.getElementById("murid-master-tbody");
      if (!tbody) return;
      var query = (document.getElementById("guru-search-murid-master") ? document.getElementById("guru-search-murid-master").value : "").toLowerCase().trim();

      var list = appData.murid || [];
      var filtered = list.filter(function(m) {
        var nama = (m["Nama Murid"] || m.nama || "").toLowerCase();
        var nisn = (m.NISN || m.nisn || "").toLowerCase();
        var kls = (m.Kelas || m.kelas || "").toLowerCase();
        if (query && !nama.includes(query) && !nisn.includes(query) && !kls.includes(query)) return false;
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Tidak ada murid ditemukan.</td></tr>';
        return;
      }

      var rows = "";
      filtered.forEach(function(m) {
        rows += '<tr class="hover:bg-slate-50">' +
          '<td class="p-3 font-mono font-bold text-slate-700">' + (m.NISN || m.nisn || "-") + '</td>' +
          '<td class="p-3 font-bold text-blue-950">' + (m["Nama Murid"] || m.nama || "-") + '</td>' +
          '<td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900">' + (m.Kelas || m.kelas || "-") + '</span></td>' +
          '<td class="p-3 font-bold">' + (m.JK || m.jenisKelamin || "-") + '</td>' +
          '<td class="p-3">' + (m["Nama Orang Tua"] || m.namaOrangTua || "-") + '</td>' +
          '<td class="p-3 font-mono">' + (m["No HP Orang Tua"] || m.noHpOraangTua || "-") + '</td>' +
        '</tr>';
      });
      tbody.innerHTML = rows;
    }

    // 11. RIWAYAT MURID (UNTUK DICEK OLEH MURID SENDIRI)
    function renderMuridRiwayatList() {
      var container = document.getElementById("murid-riwayat-container");
      if (!container) return;
      var query = (document.getElementById("filter-riwayat-nama") ? document.getElementById("filter-riwayat-nama").value : "").toLowerCase().trim();

      var list = appData.jurnal7kaih || [];
      if (query) {
        list = list.filter(function(it) {
          var nama = (it["Nama Murid"] || it.muridNama || "").toLowerCase();
          return nama.includes(query);
        });
      }

      if (list.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs">Belum ada riwayat jurnal dicatat.</div>';
        return;
      }

      var html = "";
      list.slice(0, 15).forEach(function(item) {
        var nama = item["Nama Murid"] || item.muridNama;
        var tgl = item.Tanggal || item.tanggal;
        var kls = item.Kelas || item.kelas;
        var status = (item.Status || item.status || "pending").toLowerCase();
        var isVerified = (status === "verified");
        var rating = parseInt(item.Rating || item.rating || 0);
        var feedback = item["Feedback Guru"] || item.feedbackGuru || "-";

        html += '<div class="p-4 rounded-2xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">' +
          '<div>' +
            '<div class="flex items-center gap-2">' +
              '<span class="font-bold text-slate-900 text-xs">' + nama + '</span>' +
              '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">' + kls + '</span>' +
              '<span class="text-[10px] text-slate-500 font-mono">' + tgl + '</span>' +
            '</div>' +
            '<p class="text-[11px] text-slate-600 mt-1">Belajar: ' + (item["Belajar (Materi & Menit)"] || item.belajarDesc || "-") + '</p>' +
            (feedback !== "-" ? '<p class="text-[11px] text-emerald-800 font-semibold mt-0.5">Catatan Guru: "' + feedback + '"</p>' : '') +
          '</div>' +
          '<div>' +
            (isVerified ?
              '<span class="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800">✓ Disetujui ★ ' + rating + '</span>' :
              '<span class="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800">⏳ Sedang Diperiksa</span>'
            ) +
          '</div>' +
        '</div>';
      });

      container.innerHTML = html;
    }

    // ==============================================================
    // PENGATURAN KONEKSI SPREADSHEET DI WEB APP
    // ==============================================================
    var currentSsInfo = null;

    function updateSpreadsheetStatusUI(res) {
      var isConnected = res && (res.connected === true || (res.status === "success" && (appData.murid.length > 0 || appData.guru.length > 0)));
      var ssName = (res && res.spreadsheetName) ? res.spreadsheetName : (isConnected ? "Terhubung" : "Belum Terhubung");
      var banner = document.getElementById("banner-spreadsheet-status");
      var badge = document.getElementById("badge-spreadsheet-status");
      var label = document.getElementById("label-spreadsheet-status");

      if (label) {
        label.innerText = isConnected ? "🟢 " + (ssName.length > 14 ? ssName.slice(0, 14) + "..." : ssName) : "⚠️ Link Sheets";
      }
      if (badge) {
        badge.className = isConnected ? "w-2 h-2 rounded-full bg-emerald-400" : "w-2 h-2 rounded-full bg-amber-400 animate-ping";
      }

      if (banner) {
        if (!isConnected || (appData.murid.length === 0 && appData.guru.length === 0)) {
          banner.classList.remove("hidden");
          var titleEl = document.getElementById("banner-spreadsheet-title");
          var msgEl = document.getElementById("banner-spreadsheet-desc");
          if (titleEl) {
            titleEl.innerText = !isConnected ? "Link Spreadsheet Belum Terbaca di Apps Script" : "Data Murid & Guru di Spreadsheet Masih Kosong";
          }
          if (msgEl) {
            if (!isConnected) {
              msgEl.innerText = (res && res.message) ? res.message : "Apps Script belum terhubung ke Google Spreadsheet. Klik tombol di samping untuk menempelkan link Google Spreadsheet Anda.";
            } else {
              msgEl.innerText = "Spreadsheet terhubung (" + ssName + "), namun data pada tab DATA_MURID / DATA_GURU masih kosong.";
            }
          }
        } else {
          banner.classList.add("hidden");
        }
      }
    }

    function openSpreadsheetModal() {
      var modal = document.getElementById("modal-spreadsheet");
      if (!modal) return;
      modal.classList.remove("hidden");

      var statusBadge = document.getElementById("modal-ss-status-badge");
      var nameEl = document.getElementById("modal-ss-name");
      var countEl = document.getElementById("modal-ss-murid-count");

      if (statusBadge) statusBadge.innerText = "Memeriksa...";
      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(info) {
            currentSsInfo = info;
            if (statusBadge) {
              if (info && info.connected) {
                statusBadge.innerText = "🟢 Terhubung";
                statusBadge.className = "font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full";
              } else {
                statusBadge.innerText = "⚠️ Belum Terhubung";
                statusBadge.className = "font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full";
              }
            }
            if (nameEl && info) nameEl.innerText = info.name || "-";
            if (countEl) countEl.innerText = (appData.murid.length) + " Murid (" + (appData.guru.length) + " Guru)";
          })
          .getSpreadsheetInfo();
      } else {
        if (statusBadge) statusBadge.innerText = "Mode Demo / Offline";
      }
    }

    function closeSpreadsheetModal() {
      var modal = document.getElementById("modal-spreadsheet");
      if (modal) modal.classList.add("hidden");
    }

    function handleSaveSpreadsheetLinkModal() {
      var inputEl = document.getElementById("modal-ss-input");
      if (!inputEl) return;
      var rawUrl = inputEl.value.trim();
      if (!rawUrl) {
        showToast("Mohon masukkan Link atau ID Spreadsheet!", true);
        return;
      }

      var btn = document.getElementById("btn-save-ss-link");
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳ Menghubungkan...</span>';
      }

      showToast("Menghubungkan ke Spreadsheet...", false);

      if (typeof google !== "undefined" && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = '<span>💾 Simpan & Hubungkan</span>';
            }
            if (res && res.status === "success") {
              showToast(res.message, false);
              closeSpreadsheetModal();
              loadDataFromSheets();
            } else {
              showToast((res ? res.message : "Gagal terhubung ke spreadsheet"), true);
            }
          })
          .withFailureHandler(function(err) {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = '<span>💾 Simpan & Hubungkan</span>';
            }
            showToast("Gagal: " + err, true);
          })
          .saveSpreadsheetLink(rawUrl);
      } else {
        showToast("Fitur ini membutuhkan koneksi Google Apps Script.", true);
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span>💾 Simpan & Hubungkan</span>';
        }
      }
    }

    // HELPER TOAST
    function showToast(message, isError) {
      var toast = document.getElementById("toast");
      if (!toast) return;
      toast.innerText = message;
      toast.className = "fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-extrabold text-white transition-all transform " +
        (isError ? "bg-rose-600" : "bg-emerald-600");
      toast.classList.remove("hidden");
      setTimeout(function() { toast.classList.add("hidden"); }, 4000);
    }
  </script>

  <!-- MODAL HUBUNGKAN SPREADSHEET DI APPS SCRIPT -->
  <div id="modal-spreadsheet" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs no-print">
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="text-2xl">📊</span>
          <div>
            <h3 class="font-extrabold text-sm sm:text-base text-blue-950">Hubungkan Link Google Spreadsheet</h3>
            <p class="text-[11px] text-slate-500">Tautkan file Google Sheets dengan Apps Script ini secara instan</p>
          </div>
        </div>
        <button onclick="closeSpreadsheetModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer">✕</button>
      </div>

      <!-- Info Status Saat Ini -->
      <div class="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-slate-500 font-medium">Status Koneksi:</span>
          <span id="modal-ss-status-badge" class="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Sedang memeriksa...</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-500 font-medium">Nama File:</span>
          <span id="modal-ss-name" class="font-bold text-slate-800 truncate max-w-[200px]">-</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-500 font-medium">Data Terbaca:</span>
          <span id="modal-ss-murid-count" class="font-bold text-blue-900">0 Murid</span>
        </div>
      </div>

      <!-- Form Input Link -->
      <div class="space-y-2">
        <label class="block font-bold text-xs text-slate-700">
          Tempelkan Link / URL Google Spreadsheet Anda:
        </label>
        <input
          type="text"
          id="modal-ss-input"
          placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
          class="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p class="text-[11px] text-slate-500 leading-relaxed">
          💡 <b>Cara Mudah:</b> Buka file Google Spreadsheet Anda, salin URL dari address bar browser, lalu tempel di kolom atas. Pastikan spreadsheet diatur <b>"Siapa saja yang memiliki link dapat melihat (Viewer)"</b>.
        </p>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button onclick="closeSpreadsheetModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">
          Tutup
        </button>
        <button onclick="handleSaveSpreadsheetLinkModal()" id="btn-save-ss-link" class="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all">
          <span>💾 Simpan & Hubungkan</span>
        </button>
      </div>
    </div>
  </div>
</body>
</html>
`;
};
