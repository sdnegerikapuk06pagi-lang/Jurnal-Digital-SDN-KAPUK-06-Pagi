export type UserRole = 'murid' | 'guru' | 'admin';

export const DAFTAR_KELAS = [
  'Kelas 1A',
  'Kelas 1B',
  'Kelas 2A',
  'Kelas 2B',
  'Kelas 3A',
  'Kelas 3B',
  'Kelas 4A',
  'Kelas 4B',
  'Kelas 5A',
  'Kelas 5B',
  'Kelas 6A',
  'Kelas 6B',
] as const;

export type KelasType = typeof DAFTAR_KELAS[number];

export interface SchoolSettings {
  namaSekolah: string;
  subJudul: string;
  npsn: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  semester: string;
  tahunAjaran: string;
  logoUrl?: string;
  posterUrl?: string;
  kopSuratMode: 'default' | 'custom_image';
  kopImageUrl?: string;
  tandaTanganUrl?: string;
  stempelUrl?: string;
  adminUsername?: string;
  adminPassword?: string;
  adminUsers?: AdminUser[];
  googleWebAppUrl?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastSyncTime?: string;
  autoSyncOnLoad?: boolean;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: 'admin' | 'kepsek';
  createdAt?: string;
}

export interface Murid {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  kelas: string; // e.g., "Kelas 4A"
  jenisKelamin: 'L' | 'P';
  namaOrangTua: string;
  noHpOraangTua: string;
  pin: string;
}

export interface Guru {
  id: string;
  nip: string;
  nama: string;
  jabatan: string; // e.g., "Wali Kelas 4A", "Kepala Sekolah"
  kelasAmpu: string;
  email: string;
  noHp: string;
  pin: string;
}

export interface Jurnal7KAIH {
  id: string;
  muridId: string;
  muridNama: string;
  kelas: string;
  tanggal: string; // YYYY-MM-DD
  jamBangun: string;
  bangunPagiChecked: boolean;
  
  // 2. Beribadah
  agama?: 'Muslim' | 'Non Muslim';
  ibadahChecklist: string[]; // ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"]
  sedangBerhalangan?: boolean; // Uzur syar'i / berhalangan bagi murid muslimah
  jenisIbadahNonMuslim?: string; // Isian singkat jenis ibadah yang dilakukan (cth: Kebaktian, Doa Pagi, Puja Bakti)
  frekuensiIbadahNonMuslim?: 'Sering' | 'Sedang' | 'Jarang-jarang' | 'Tidak melakukan ibadah'; // Dropdown frekuensi

  // 3. Berolahraga
  olahragaChecked: boolean;
  olahragaDesc: string; // jenis olahraga
  olahragaDurasiPilihan?: '< 10 menit' | '10 - 19 menit' | '20 - 29 menit' | '30 menit atau lebih';

  // 4. Makan Sehat & Bergizi
  makanSehatChecked: boolean;
  makanSehatHabits: string[]; // checklist makanan per waktu
  makanSehatCentangCount?: number; // total centang 0-15

  // 5. Gemar Belajar
  belajarChecked: boolean;
  belajarDesc: string; // mata pelajaran / materi yang dipelajari
  durasiBelajarMenit: number;

  // 6. Bermasyarakat & Membantu Orang Tua
  bantuOrangTuaChecked: boolean;
  bantuOrangTuaDesc: string; // kegiatan membantu di rumah / lingkungan
  bermasyarakatAnswers?: Record<string, 'Iya' | 'Tidak'>; // 6 item pertanyaan bermasyarakat
  bermasyarakatIyaCount?: number; // 0-6

  // 7. Tidur Tepat Waktu
  jamTidur: string;
  tidurTepatWaktuChecked: boolean;

  // Rubrik Skor Otomatis Harian (Skor 1 - 4 tiap butir)
  skorBangunPagi?: number; // 1 - 4 (Gambar 1)
  skorBeribadah?: number; // 1 - 4 (Gambar 2)
  skorBerolahraga?: number; // 1 - 4 (Gambar 3)
  skorGemarBelajar?: number; // 1 - 4 (Gambar 4)
  skorMakanSehat?: number; // 1 - 4 (Gambar 5)
  skorBermasyarakat?: number; // 1 - 4 (Gambar 6)
  skorTidurCepat?: number; // 1 - 4 (Jam 21.00 skor 4 s/d 24.00 skor 1)
  skorRataRata?: number; // 1.0 - 4.0
  predikatOtomatis?: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Pendampingan' | 'Belum Diisi';

  // Refleksi & Orang Tua
  refleksiMurid?: string;
  catatanOrangTua: string;
  parafOrangTua: boolean;
  
  // Status Verifikasi Guru
  status: 'pending' | 'verified' | 'revision';
  submittedAt?: string; // Cap waktu pengiriman WIB
  jamKirim?: string; // Jam pengiriman murid WIB (HH:mm WIB)
  verifiedAt?: string;
  verifiedBy?: string;
  feedbackGuru?: string;
  rating?: number; // 1 to 5 stars
  notifRead?: boolean;
}

export interface JurnalMembaca {
  id: string;
  muridId: string;
  muridNama: string;
  kelas: string;
  tanggal: string;
  judulBuku: string;
  penulis: string;
  penerbit?: string;
  kategori: 'Cerita Rakyat' | 'Fiksi / Dongeng' | 'Ensiklopedia / IPTEK' | 'Buku Pelajaran' | 'Biografi / Pahlawan' | 'Komik Edukasi' | 'Lainnya';
  halamanAwal: number;
  halamanAkhir: number;
  durasiMenit: number;
  ringkasan: string; // ringkasan & pesan moral
  kesan: 'Sangat Seru' | 'Menarik' | 'Bermanfaat' | 'Biasa';
  fotoSampul?: string; // base64 or URL
  
  // Status Verifikasi Guru
  status: 'pending' | 'verified' | 'revision';
  submittedAt?: string; // Cap waktu pengiriman WIB
  jamKirim?: string; // Jam pengiriman murid WIB
  verifiedAt?: string;
  verifiedBy?: string;
  feedbackGuru?: string;
  rating?: number; // 1 to 5 stars
  notifRead?: boolean;
}

export interface Refleksi7KAIH {
  id: string;
  muridId: string;
  muridNama: string;
  kelas: string;
  bulan: string; // e.g. "Oktober 2026"
  bangunPagiRefleksi: string;
  bangunPagiTindakLanjut: string;
  beribadahRefleksi: string;
  beribadahTindakLanjut: string;
  berolahragaRefleksi: string;
  berolahragaTindakLanjut: string;
  makanSehatRefleksi: string;
  makanSehatTindakLanjut: string;
  gemarBelajarRefleksi: string;
  gemarBelajarTindakLanjut: string;
  bermasyarakatRefleksi: string;
  bermasyarakatTindakLanjut: string;
  tidurCepatRefleksi: string;
  tidurCepatTindakLanjut: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  targetRole: UserRole;
  targetUserId?: string; // for specific student
  targetKelas?: string;
  title: string;
  message: string;
  type: 'verification' | 'reminder' | 'system';
  timestamp: string;
  isRead: boolean;
  dataId?: string;
  journalType?: '7kaih' | 'membaca';
}
