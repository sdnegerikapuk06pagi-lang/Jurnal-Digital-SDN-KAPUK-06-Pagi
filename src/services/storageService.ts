import { SchoolSettings, Murid, Guru, Jurnal7KAIH, JurnalMembaca, AppNotification, Refleksi7KAIH, AdminUser } from '../types';
import {
  getTimestampWIB,
  getJamMenitWIB,
  normalizeDateStringToWIB,
  normalizeTimeToHHMM,
  formatWaktuKirimWIB,
} from '../utils/dateUtils';
import {
  INITIAL_SETTINGS,
  INITIAL_MURID,
  INITIAL_GURU,
  INITIAL_JURNAL_7KAIH,
  INITIAL_JURNAL_MEMBACA,
  INITIAL_NOTIFICATIONS,
  INITIAL_REFLEKSI_7KAIH,
  INITIAL_ADMIN_USERS,
} from '../data/initialData';
import {
  normalizeGoogleUrl,
  pullAllFromAppsScript,
  pullAllFromGviz,
  testGoogleConnectionDetailed,
  GoogleSyncResult,
} from './googleSyncService';

const SETTINGS_KEY = 'sdn06_settings_v1';
const MURID_KEY = 'sdn06_murid_v2';
const GURU_KEY = 'sdn06_guru_v1';
const JURNAL_7KAIH_KEY = 'sdn06_7kaih_v2';
const JURNAL_MEMBACA_KEY = 'sdn06_membaca_v2';
const REFLEKSI_KEY = 'sdn06_refleksi_v2';
const NOTIF_KEY = 'sdn06_notif_v2';
const ADMIN_USERS_KEY = 'sdn06_admin_users_v2';
const DELETED_MURID_KEY = 'sdn06_deleted_murid_ledger_v2';
const DELETED_GURU_KEY = 'sdn06_deleted_guru_ledger_v2';

export const LATEST_GOOGLE_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxW5vDx2PxEJY0S_4i0vjT2NqtJNddI1-ThE_qaQTTPnLZo4LXqvkdU-agUVjs5o9uIYg/exec';

export const storageService = {
  // SETTINGS
  getSettings(): SchoolSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    try {
      const parsed = JSON.parse(raw);
      const rawUrl = parsed.googleWebAppUrl || INITIAL_SETTINGS.googleWebAppUrl;
      let cleanUrl = rawUrl ? rawUrl.replace(/\/u\/\d+\//g, '/') : '';

      // Auto-migrate ke URL Web App terbaru yang aktif dari Gmail sekolah
      const oldScriptDeployId = 'AKfycbyqMbSFSxpUUy0qagz5U3vMaICah-H0PPL2jz4irGDobtnX-ktMtH-5IUjyAdnya8uD9g';
      if (!cleanUrl || cleanUrl.includes(oldScriptDeployId) || !cleanUrl.includes('script.google.com')) {
        cleanUrl = LATEST_GOOGLE_WEB_APP_URL;
      }

      const rawUser = (parsed.adminUsername || '').trim();
      const cleanUser = (!rawUser || rawUser.toLowerCase() === 'admin') ? 'admin06' : rawUser;
      const rawPass = (parsed.adminPassword || '').trim();
      const cleanPass = (!rawPass || rawPass === 'admin123') ? 'admin123!' : rawPass;
      const cleanTahun = (!parsed.tahunAjaran || parsed.tahunAjaran === '2024/2025') ? '2026/2027' : parsed.tahunAjaran;
      const cleanSemester = (!parsed.semester || parsed.semester === 'Semester Genap (2)') ? 'Semester Ganjil (1)' : parsed.semester;

      const merged: SchoolSettings = {
        ...INITIAL_SETTINGS,
        ...parsed,
        adminUsername: cleanUser,
        adminPassword: cleanPass,
        tahunAjaran: cleanTahun,
        semester: cleanSemester,
        npsn: (!parsed.npsn || parsed.npsn === '20105389') ? '20105291' : parsed.npsn,
        alamat: (!parsed.alamat || parsed.alamat.includes('Gotong Royong')) ? INITIAL_SETTINGS.alamat : parsed.alamat,
        email: (!parsed.email || parsed.email === 'sdnkapuk06pagi@guru.sd.belajar.id' || parsed.email === 'sdnegerikapuk06pagi@gmail.com') ? 'sdnkapuk06pagi@gmail.com' : parsed.email,
        kepalaSekolah: 'Emirita Br. Ginting, S.Ag',
        nipKepalaSekolah: '197104212003122001',
        googleWebAppUrl: cleanUrl,
        logoUrl: parsed.logoUrl || 'https://i.imgur.com/GlCn0x3.png',
        posterUrl: parsed.posterUrl || 'https://i.imgur.com/pJOJiuF.jpeg',
      };

      if (
        parsed.googleWebAppUrl !== cleanUrl ||
        parsed.tahunAjaran !== cleanTahun ||
        parsed.semester !== cleanSemester ||
        parsed.npsn !== merged.npsn ||
        parsed.email !== merged.email ||
        parsed.kepalaSekolah !== merged.kepalaSekolah ||
        parsed.nipKepalaSekolah !== merged.nipKepalaSekolah ||
        parsed.adminUsername !== cleanUser ||
        parsed.adminPassword !== cleanPass
      ) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
      }

      return merged;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: SchoolSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    this.triggerChange();
    this.pushToCloudServer({ settings });
  },

  // MURID
  getMuridList(): Murid[] {
    const raw = localStorage.getItem(MURID_KEY);
    const sanitizeGenders = (students: Murid[]): Murid[] => {
      const femaleKeywords = [
        'PUTRI', 'AISYAH', 'SITI', 'AZZAHRA', 'AZ-ZAHRA', 'ZAHRA', 'NURUL', 'ALINA', 'ALITA',
        'ALMEERA', 'AQILA', 'AZIZAH', 'BILQIS', 'CHARISYA', 'DEVIRA', 'DEWI', 'EDRHEA'
      ];
      let hasChanges = false;
      const sanitized = students.map((m) => {
        if (m.jenisKelamin !== 'P') {
          const upper = (m.nama || '').toUpperCase();
          if (femaleKeywords.some((k) => upper.includes(k))) {
            hasChanges = true;
            return { ...m, jenisKelamin: 'P' as const };
          }
        }
        return m;
      });
      if (hasChanges) {
        try {
          localStorage.setItem(MURID_KEY, JSON.stringify(sanitized));
        } catch {}
      }
      return sanitized;
    };

    if (raw === null) {
      localStorage.setItem(MURID_KEY, JSON.stringify([]));
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? sanitizeGenders(parsed) : [];
    } catch {
      return [];
    }
  },

  saveMuridList(list: Murid[]) {
    localStorage.setItem(MURID_KEY, JSON.stringify(list));
    this.triggerChange();
    this.pushToCloudServer({ murid: list, replaceMurid: true });
  },

  // DELETION LEDGERS (Mencegah data yang telah dihapus admin ditarik kembali dari Google Sheets / GViz)
  getDeletedMuridLedger(): { ids: Set<string>; nisns: Set<string>; names: Set<string> } {
    try {
      const raw = localStorage.getItem(DELETED_MURID_KEY);
      if (!raw) return { ids: new Set(), nisns: new Set(), names: new Set() };
      const parsed = JSON.parse(raw);
      return {
        ids: new Set(parsed.ids || []),
        nisns: new Set(parsed.nisns || []),
        names: new Set(parsed.names || []),
      };
    } catch {
      return { ids: new Set(), nisns: new Set(), names: new Set() };
    }
  },

  recordDeletedMurid(id: string, nisn?: string, nama?: string) {
    try {
      const ledger = this.getDeletedMuridLedger();
      if (id) ledger.ids.add(id);
      if (nisn) ledger.nisns.add(nisn);
      if (nama) ledger.names.add(nama.trim().toLowerCase());
      localStorage.setItem(
        DELETED_MURID_KEY,
        JSON.stringify({
          ids: Array.from(ledger.ids),
          nisns: Array.from(ledger.nisns),
          names: Array.from(ledger.names),
        })
      );
    } catch {}
  },

  unrecordDeletedMurid(id: string, nisn?: string, nama?: string) {
    try {
      const ledger = this.getDeletedMuridLedger();
      if (id) ledger.ids.delete(id);
      if (nisn) ledger.nisns.delete(nisn);
      if (nama) ledger.names.delete(nama.trim().toLowerCase());
      localStorage.setItem(
        DELETED_MURID_KEY,
        JSON.stringify({
          ids: Array.from(ledger.ids),
          nisns: Array.from(ledger.nisns),
          names: Array.from(ledger.names),
        })
      );
    } catch {}
  },

  getDeletedGuruLedger(): { ids: Set<string>; nips: Set<string>; names: Set<string> } {
    try {
      const raw = localStorage.getItem(DELETED_GURU_KEY);
      if (!raw) return { ids: new Set(), nips: new Set(), names: new Set() };
      const parsed = JSON.parse(raw);
      return {
        ids: new Set(parsed.ids || []),
        nips: new Set(parsed.nips || []),
        names: new Set(parsed.names || []),
      };
    } catch {
      return { ids: new Set(), nips: new Set(), names: new Set() };
    }
  },

  recordDeletedGuru(id: string, nip?: string, nama?: string) {
    try {
      const ledger = this.getDeletedGuruLedger();
      if (id) ledger.ids.add(id);
      if (nip) ledger.nips.add(nip);
      if (nama) ledger.names.add(nama.trim().toLowerCase());
      localStorage.setItem(
        DELETED_GURU_KEY,
        JSON.stringify({
          ids: Array.from(ledger.ids),
          nips: Array.from(ledger.nips),
          names: Array.from(ledger.names),
        })
      );
    } catch {}
  },

  unrecordDeletedGuru(id: string, nip?: string, nama?: string) {
    try {
      const ledger = this.getDeletedGuruLedger();
      if (id) ledger.ids.delete(id);
      if (nip) ledger.nips.delete(nip);
      if (nama) ledger.names.delete(nama.trim().toLowerCase());
      localStorage.setItem(
        DELETED_GURU_KEY,
        JSON.stringify({
          ids: Array.from(ledger.ids),
          nips: Array.from(ledger.nips),
          names: Array.from(ledger.names),
        })
      );
    } catch {}
  },

  // ADMIN USERS MANAGEMENT (Admin tidak sendiri saja, bisa tambah akun baru)
  getAdminUsers(): AdminUser[] {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(INITIAL_ADMIN_USERS));
      return INITIAL_ADMIN_USERS;
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Pastikan akun utama admin06 selalu ada dan terjaga
        const hasMaster = parsed.some((u: AdminUser) => u.username.toLowerCase() === 'admin06');
        if (!hasMaster) {
          const migrated = [INITIAL_ADMIN_USERS[0], ...parsed.filter((u: AdminUser) => u.username !== 'admin')];
          localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      }
      return INITIAL_ADMIN_USERS;
    } catch {
      return INITIAL_ADMIN_USERS;
    }
  },

  saveAdminUsers(users: AdminUser[]) {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
    this.triggerChange();
    this.pushToCloudServer({ adminUsers: users });
  },

  addAdminUser(userData: Omit<AdminUser, 'id' | 'createdAt'>): AdminUser {
    const current = this.getAdminUsers();
    const newUser: AdminUser = {
      ...userData,
      id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...current, newUser];
    this.saveAdminUsers(updated);
    return newUser;
  },

  updateAdminUser(id: string, updates: Partial<AdminUser>): void {
    const current = this.getAdminUsers();
    const updated = current.map((u) => (u.id === id ? { ...u, ...updates } : u));
    this.saveAdminUsers(updated);
  },

  deleteAdminUser(id: string): boolean {
    const current = this.getAdminUsers();
    const target = current.find((u) => u.id === id);
    if (!target || target.username.toLowerCase() === 'admin06' || target.id === 'admin-master') {
      return false; // Akun master admin06 dilindungi
    }
    const updated = current.filter((u) => u.id !== id);
    this.saveAdminUsers(updated);
    return true;
  },

  findAdminUser(username: string): AdminUser | undefined {
    const clean = username.trim().toLowerCase();
    const users = this.getAdminUsers();
    return users.find((u) => u.username.toLowerCase() === clean);
  },

  addMurid(murid: Murid) {
    this.unrecordDeletedMurid(murid.id, murid.nisn);
    const list = this.getMuridList();
    const updated = [murid, ...list];
    this.saveMuridList(updated);
    this.syncSingleToSpreadsheet('SYNC_MURID', murid);
    return murid;
  },

  updateMurid(murid: Murid) {
    this.unrecordDeletedMurid(murid.id, murid.nisn);
    const list = this.getMuridList();
    const updated = list.map((m) => (m.id === murid.id ? murid : m));
    this.saveMuridList(updated);
    this.syncSingleToSpreadsheet('SYNC_MURID', murid);
    return murid;
  },

  deleteMurid(id: string): { success: boolean; message: string; remaining: Murid[] } {
    const list = this.getMuridList();
    const target = list.find((m) => m.id === id);
    const updated = list.filter((m) => m.id !== id);
    this.saveMuridList(updated);

    if (target) {
      this.recordDeletedMurid(target.id, target.nisn, target.nama);
      // Kirim action spesifik DELETE_MURID ke Apps Script Web App dengan id, nisn, dan nama
      this.syncSingleToSpreadsheet('DELETE_MURID', {
        id: target.id,
        nisn: target.nisn,
        nama: target.nama,
      });
    }

    return {
      success: true,
      message: target ? `Data murid "${target.nama}" berhasil dihapus dari sistem dan Google Spreadsheet.` : 'Data murid berhasil dihapus.',
      remaining: updated,
    };
  },

  deleteMuridByKelas(kelas: string): Murid[] {
    const list = this.getMuridList();
    const toDelete = list.filter((m) => m.kelas === kelas);
    toDelete.forEach((m) => this.recordDeletedMurid(m.id, m.nisn, m.nama));
    const updated = list.filter((m) => m.kelas !== kelas);
    this.saveMuridList(updated);
    this.syncAllToSpreadsheet().catch(() => {});
    return updated;
  },

  deleteAllMurid(): void {
    const list = this.getMuridList();
    list.forEach((m) => this.recordDeletedMurid(m.id, m.nisn, m.nama));
    this.saveMuridList([]);
    this.syncSingleToSpreadsheet('DELETE_ALL_MURID', {});
  },

  clearDemoAccounts(): Murid[] {
    // Clears all demo mock murid m-01 to m-12
    const currentList = this.getMuridList();
    const demoIds = new Set(['m-01', 'm-02', 'm-03', 'm-04', 'm-05', 'm-06', 'm-07', 'm-08', 'm-09', 'm-10', 'm-11', 'm-12']);
    demoIds.forEach((id) => this.recordDeletedMurid(id));
    const nonDemo = currentList.filter((m) => !demoIds.has(m.id));
    this.saveMuridList(nonDemo);
    return nonDemo;
  },

  bulkImportMurid(newMuridList: Murid[], mode: 'replace' | 'append', targetKelas?: string): Murid[] {
    newMuridList.forEach((m) => this.unrecordDeletedMurid(m.id, m.nisn));
    const currentList = this.getMuridList();
    let finalList: Murid[];

    if (mode === 'replace') {
      if (targetKelas && targetKelas !== 'Semua Kelas') {
        // Replace only students of this specific class
        const otherClasses = currentList.filter((m) => m.kelas !== targetKelas);
        finalList = [...otherClasses, ...newMuridList];
      } else {
        // Replace all students in database
        finalList = newMuridList;
      }
    } else {
      // Append / Merge: update if NISN matches, or append
      const map = new Map<string, Murid>();
      currentList.forEach((m) => map.set(m.nisn, m));
      newMuridList.forEach((m) => map.set(m.nisn, m));
      finalList = Array.from(map.values());
    }

    this.saveMuridList(finalList);
    // Sync batch to Apps Script
    this.syncSingleToSpreadsheet('BULK_IMPORT_MURID', finalList);
    return finalList;
  },

  // GURU
  getGuruList(): Guru[] {
    const raw = localStorage.getItem(GURU_KEY);
    if (raw === null) {
      localStorage.setItem(GURU_KEY, JSON.stringify([]));
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveGuruList(list: Guru[]) {
    localStorage.setItem(GURU_KEY, JSON.stringify(list));
    this.triggerChange();
    this.pushToCloudServer({ guru: list, replaceGuru: true });
  },

  addGuru(guru: Guru): Guru {
    this.unrecordDeletedGuru(guru.id, guru.nip);
    const list = this.getGuruList();
    const updated = [guru, ...list];
    this.saveGuruList(updated);
    this.syncSingleToSpreadsheet('SYNC_GURU', guru);
    return guru;
  },

  deleteGuru(id: string): { success: boolean; message: string; remaining: Guru[] } {
    const list = this.getGuruList();
    const target = list.find((g) => g.id === id);
    const updated = list.filter((g) => g.id !== id);
    this.saveGuruList(updated);

    if (target) {
      this.recordDeletedGuru(target.id, target.nip, target.nama);
      // Kirim action spesifik DELETE_GURU ke Apps Script Web App
      this.syncSingleToSpreadsheet('DELETE_GURU', {
        id: target.id,
        nip: target.nip,
        nama: target.nama,
      });
    }

    return {
      success: true,
      message: target ? `Data guru "${target.nama}" berhasil dihapus dari sistem dan Google Spreadsheet.` : 'Data guru berhasil dihapus.',
      remaining: updated,
    };
  },

  deleteAllGuru(): void {
    const list = this.getGuruList();
    list.forEach((g) => this.recordDeletedGuru(g.id, g.nip, g.nama));
    this.saveGuruList([]);
    this.syncSingleToSpreadsheet('DELETE_ALL_GURU', {});
  },

  deleteAllData(): void {
    this.deleteAllMurid();
    this.deleteAllGuru();
    this.deleteAll7Kaih();
    this.deleteAllMembaca();
  },

  bulkImportGuru(newGuruList: Guru[], mode: 'replace' | 'append'): Guru[] {
    newGuruList.forEach((g) => this.unrecordDeletedGuru(g.id, g.nip));
    const currentList = this.getGuruList();
    let finalList: Guru[];

    if (mode === 'replace') {
      finalList = newGuruList;
    } else {
      const map = new Map<string, Guru>();
      currentList.forEach((g) => map.set(g.nip, g));
      newGuruList.forEach((g) => map.set(g.nip, g));
      finalList = Array.from(map.values());
    }

    this.saveGuruList(finalList);
    this.syncSingleToSpreadsheet('BULK_IMPORT_GURU', finalList);
    return finalList;
  },

  // JURNAL 7 KAIH
  get7KaihList(): Jurnal7KAIH[] {
    const raw = localStorage.getItem(JURNAL_7KAIH_KEY);
    if (raw === null) {
      localStorage.setItem(JURNAL_7KAIH_KEY, JSON.stringify(INITIAL_JURNAL_7KAIH));
      return INITIAL_JURNAL_7KAIH;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return INITIAL_JURNAL_7KAIH;
      return parsed.map((j: Jurnal7KAIH) => {
        const waktuKirim = formatWaktuKirimWIB(j.submittedAt, j.jamKirim, j.id);
        return {
          ...j,
          tanggal: normalizeDateStringToWIB(j.tanggal),
          submittedAt: j.submittedAt || waktuKirim.lengkap,
          jamKirim: j.jamKirim || waktuKirim.jam,
        };
      });
    } catch {
      return INITIAL_JURNAL_7KAIH;
    }
  },

  save7KaihList(list: Jurnal7KAIH[]) {
    localStorage.setItem(JURNAL_7KAIH_KEY, JSON.stringify(list));
    this.triggerChange();
    this.pushToCloudServer({ jurnal7kaih: list, replace7kaih: true });
  },

  delete7KaihByKelas(kelas: string) {
    const list = this.get7KaihList();
    const updated = list.filter((j) => j.kelas !== kelas);
    this.save7KaihList(updated);
  },

  deleteAll7Kaih() {
    this.save7KaihList([]);
    this.syncSingleToSpreadsheet('DELETE_ALL_7KAIH', {});
  },

  add7Kaih(entry: Jurnal7KAIH) {
    const list = this.get7KaihList();
    const wibNow = getTimestampWIB();
    const wibJam = getJamMenitWIB();
    const entryWithWIB: Jurnal7KAIH = {
      ...entry,
      tanggal: normalizeDateStringToWIB(entry.tanggal),
      submittedAt: entry.submittedAt || wibNow,
      jamKirim: entry.jamKirim || `${wibJam} WIB`,
    };

    // Update entri jika sudah ada untuk murid dan tanggal yang sama
    const existingIndex = list.findIndex(
      (j) => j.id === entry.id || (j.muridId === entry.muridId && normalizeDateStringToWIB(j.tanggal) === entryWithWIB.tanggal)
    );
    let updated: Jurnal7KAIH[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = {
        ...list[existingIndex],
        ...entryWithWIB,
        // Pertahankan status verifikasi jika sudah diverifikasi
        status: entry.status || list[existingIndex].status,
      };
    } else {
      updated = [entryWithWIB, ...list];
    }

    this.save7KaihList(updated);
    
    // Auto sync to Apps Script if endpoint configured
    this.syncSingleToSpreadsheet('SUBMIT_7KAIH', entryWithWIB);
    return entryWithWIB;
  },

  verify7Kaih(id: string, feedback: string, rating: number, guruNama: string) {
    const list = this.get7KaihList();
    let verifiedItem: Jurnal7KAIH | null = null;
    const wibNow = getTimestampWIB();
    const updated = list.map((item) => {
      if (item.id === id) {
        verifiedItem = {
          ...item,
          status: 'verified' as const,
          feedbackGuru: feedback,
          rating,
          verifiedAt: wibNow,
          verifiedBy: guruNama,
          notifRead: false,
        };
        return verifiedItem;
      }
      return item;
    });

    this.save7KaihList(updated);

    // Kirim notifikasi otomatis ke murid!
    if (verifiedItem) {
      const v = verifiedItem as Jurnal7KAIH;
      this.addNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        targetRole: 'murid',
        targetUserId: v.muridId,
        targetKelas: v.kelas,
        title: 'Jurnal 7 KAIH Anda Telah Diverifikasi!',
        message: `${guruNama} telah memverifikasi Jurnal 7 KAIH Anda (${v.tanggal}). Nilai: ${'⭐'.repeat(rating)} | Catatan: "${feedback || 'Sangat baik, teruskan kebiasaan positifmu!'}"`,
        type: 'verification',
        timestamp: wibNow,
        isRead: false,
        dataId: v.id,
        journalType: '7kaih',
      });
    }

    return updated;
  },

  // JURNAL MEMBACA
  getMembacaList(): JurnalMembaca[] {
    const raw = localStorage.getItem(JURNAL_MEMBACA_KEY);
    if (raw === null) {
      localStorage.setItem(JURNAL_MEMBACA_KEY, JSON.stringify(INITIAL_JURNAL_MEMBACA));
      return INITIAL_JURNAL_MEMBACA;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return INITIAL_JURNAL_MEMBACA;
      return parsed.map((b: JurnalMembaca) => {
        const waktuKirim = formatWaktuKirimWIB(b.submittedAt, b.jamKirim, b.id);
        return {
          ...b,
          tanggal: normalizeDateStringToWIB(b.tanggal),
          submittedAt: b.submittedAt || waktuKirim.lengkap,
          jamKirim: b.jamKirim || waktuKirim.jam,
        };
      });
    } catch {
      return INITIAL_JURNAL_MEMBACA;
    }
  },

  saveMembacaList(list: JurnalMembaca[]) {
    localStorage.setItem(JURNAL_MEMBACA_KEY, JSON.stringify(list));
    this.triggerChange();
    this.pushToCloudServer({ jurnalMembaca: list, replaceMembaca: true });
  },

  deleteMembacaByKelas(kelas: string) {
    const list = this.getMembacaList();
    const updated = list.filter((b) => b.kelas !== kelas);
    this.saveMembacaList(updated);
  },

  deleteAllMembaca() {
    this.saveMembacaList([]);
    this.syncSingleToSpreadsheet('DELETE_ALL_MEMBACA', {});
  },

  addMembaca(entry: JurnalMembaca) {
    const list = this.getMembacaList();
    const wibNow = getTimestampWIB();
    const wibJam = getJamMenitWIB();
    const entryWithWIB: JurnalMembaca = {
      ...entry,
      tanggal: normalizeDateStringToWIB(entry.tanggal),
      submittedAt: entry.submittedAt || wibNow,
      jamKirim: entry.jamKirim || `${wibJam} WIB`,
    };

    const existingIndex = list.findIndex(
      (b) =>
        b.id === entry.id ||
        (b.muridId === entry.muridId &&
          normalizeDateStringToWIB(b.tanggal) === entryWithWIB.tanggal &&
          b.judulBuku.toLowerCase() === entry.judulBuku.toLowerCase())
    );
    let updated: JurnalMembaca[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = {
        ...list[existingIndex],
        ...entryWithWIB,
        status: entry.status || list[existingIndex].status,
      };
    } else {
      updated = [entryWithWIB, ...list];
    }

    this.saveMembacaList(updated);

    // Auto sync to Apps Script if endpoint configured
    this.syncSingleToSpreadsheet('SUBMIT_MEMBACA', entryWithWIB);
    return entryWithWIB;
  },

  verifyMembaca(id: string, feedback: string, rating: number, guruNama: string) {
    const list = this.getMembacaList();
    let verifiedItem: JurnalMembaca | null = null;
    const wibNow = getTimestampWIB();
    const updated = list.map((item) => {
      if (item.id === id) {
        verifiedItem = {
          ...item,
          status: 'verified' as const,
          feedbackGuru: feedback,
          rating,
          verifiedAt: wibNow,
          verifiedBy: guruNama,
          notifRead: false,
        };
        return verifiedItem;
      }
      return item;
    });

    this.saveMembacaList(updated);

    // Kirim notifikasi otomatis ke murid!
    if (verifiedItem) {
      const v = verifiedItem as JurnalMembaca;
      this.addNotification({
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        targetRole: 'murid',
        targetUserId: v.muridId,
        targetKelas: v.kelas,
        title: 'Jurnal Membaca Telah Diverifikasi!',
        message: `${guruNama} telah memverifikasi ulasan buku "${v.judulBuku}". Nilai: ${'⭐'.repeat(rating)} | Umpan balik: "${feedback || 'Hebat! Gemar membaca membuka jendela dunia.'}"`,
        type: 'verification',
        timestamp: wibNow,
        isRead: false,
        dataId: v.id,
        journalType: 'membaca',
      });
    }

    return updated;
  },

  // REFLEKSI ORANG TUA (LAMPIRAN 3)
  getRefleksiList(): Refleksi7KAIH[] {
    const raw = localStorage.getItem(REFLEKSI_KEY);
    if (!raw) {
      localStorage.setItem(REFLEKSI_KEY, JSON.stringify(INITIAL_REFLEKSI_7KAIH));
      return INITIAL_REFLEKSI_7KAIH;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_REFLEKSI_7KAIH;
    }
  },

  saveRefleksiList(list: Refleksi7KAIH[]) {
    localStorage.setItem(REFLEKSI_KEY, JSON.stringify(list));
    this.triggerChange();
    this.pushToCloudServer({ refleksi: list });
  },

  saveRefleksi(item: Refleksi7KAIH) {
    const list = this.getRefleksiList();
    const existingIndex = list.findIndex(
      (r) => r.muridId === item.muridId && r.bulan === item.bulan
    );
    let updated: Refleksi7KAIH[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...item, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) };
    } else {
      updated = [{ ...item, updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16) }, ...list];
    }
    this.saveRefleksiList(updated);
    return item;
  },

  // NOTIFIKASI
  getNotifications(): AppNotification[] {
    const raw = localStorage.getItem(NOTIF_KEY);
    if (!raw) {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications(list: AppNotification[]) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
    this.triggerChange();
    this.pushToCloudServer({ notifications: list });
  },

  addNotification(notif: AppNotification) {
    const list = this.getNotifications();
    const updated = [notif, ...list];
    this.saveNotifications(updated);
  },

  markNotificationRead(id: string) {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(updated);
  },

  markAllNotificationsRead(userId?: string) {
    const list = this.getNotifications();
    const updated = list.map((n) => {
      if (!userId || n.targetUserId === userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.saveNotifications(updated);
  },

  // RESET
  resetToDefault() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(MURID_KEY, JSON.stringify([]));
    localStorage.setItem(GURU_KEY, JSON.stringify(INITIAL_GURU));
    localStorage.setItem(JURNAL_7KAIH_KEY, JSON.stringify(INITIAL_JURNAL_7KAIH));
    localStorage.setItem(JURNAL_MEMBACA_KEY, JSON.stringify(INITIAL_JURNAL_MEMBACA));
    localStorage.setItem(REFLEKSI_KEY, JSON.stringify(INITIAL_REFLEKSI_7KAIH));
    localStorage.setItem(NOTIF_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    this.triggerChange();
  },

  // EVENT DISPATCHER FOR REACT STATE REFRESH
  listeners: [] as Array<() => void>,
  subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  },
  triggerChange() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error(err);
      }
    });
  },

  // CLOUD SERVER SYNC (OTOMATIS TANPA SALIN APPS SCRIPT)
  async pushToCloudServer(payload: any) {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[CloudSync] Background sync to server error:', err);
    }
  },

  async pullFromCloudServer(force = false): Promise<{
    success: boolean;
    message: string;
    counts?: { murid: number; guru: number; kaih: number; membaca: number };
  }> {
    if (typeof window === 'undefined') {
      return { success: false, message: 'Browser only' };
    }
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Server status HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error('Format data cloud server tidak valid.');
      }
      const data = json.data;

      const localMurid = this.getMuridList();
      const localGuru = this.getGuruList();
      const localKaih = this.get7KaihList();
      const localMembaca = this.getMembacaList();

      const serverMurid = Array.isArray(data.murid) ? data.murid : [];
      const serverGuru = Array.isArray(data.guru) ? data.guru : [];
      const serverKaih = Array.isArray(data.jurnal7kaih) ? data.jurnal7kaih : [];
      const serverMembaca = Array.isArray(data.jurnalMembaca) ? data.jurnalMembaca : [];

      // Jika di server masih kosong tapi di browser lokal ini sudah ada data (misal baru diisi atau impor)
      // maka unggah data lokal ke server pusat agar langsung bisa dibuka oleh semua murid & guru online!
      if (serverMurid.length === 0 && serverGuru.length === 0 && (localMurid.length > 0 || localGuru.length > 0)) {
        await this.pushToCloudServer({
          settings: this.getSettings(),
          murid: localMurid,
          guru: localGuru,
          jurnal7kaih: localKaih,
          jurnalMembaca: localMembaca,
          refleksi: this.getRefleksiList(),
          notifications: this.getNotifications(),
          adminUsers: this.getAdminUsers(),
          deletedMuridLedger: {
            ids: Array.from(this.getDeletedMuridLedger().ids),
            nisns: Array.from(this.getDeletedMuridLedger().nisns),
            names: Array.from(this.getDeletedMuridLedger().names),
          },
          deletedGuruLedger: {
            ids: Array.from(this.getDeletedGuruLedger().ids),
            nips: Array.from(this.getDeletedGuruLedger().nips),
            names: Array.from(this.getDeletedGuruLedger().names),
          },
        });
        return {
          success: true,
          message: 'Data sekolah berhasil disinkronkan ke Cloud Server pusat!',
          counts: {
            murid: localMurid.length,
            guru: localGuru.length,
            kaih: localKaih.length,
            membaca: localMembaca.length,
          },
        };
      }

      // Perbarui localStorage dengan data cloud server
      let changed = false;
      if (serverMurid.length > 0 || force) {
        localStorage.setItem(MURID_KEY, JSON.stringify(serverMurid));
        changed = true;
      }
      if (serverGuru.length > 0 || force) {
        localStorage.setItem(GURU_KEY, JSON.stringify(serverGuru));
        changed = true;
      }
      if (serverKaih.length > 0 || force) {
        localStorage.setItem(JURNAL_7KAIH_KEY, JSON.stringify(serverKaih));
        changed = true;
      }
      if (serverMembaca.length > 0 || force) {
        localStorage.setItem(JURNAL_MEMBACA_KEY, JSON.stringify(serverMembaca));
        changed = true;
      }
      if (Array.isArray(data.refleksi) && (data.refleksi.length > 0 || force)) {
        localStorage.setItem(REFLEKSI_KEY, JSON.stringify(data.refleksi));
        changed = true;
      }
      if (Array.isArray(data.notifications) && (data.notifications.length > 0 || force)) {
        localStorage.setItem(NOTIF_KEY, JSON.stringify(data.notifications));
        changed = true;
      }
      if (Array.isArray(data.adminUsers) && data.adminUsers.length > 0) {
        localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(data.adminUsers));
        changed = true;
      }
      if (data.settings && typeof data.settings === 'object') {
        const cur = this.getSettings();
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...cur, ...data.settings }));
        changed = true;
      }

      if (changed) {
        this.triggerChange();
      }

      return {
        success: true,
        message: 'Data berhasil disinkronkan secara otomatis dari Cloud Server!',
        counts: {
          murid: serverMurid.length,
          guru: serverGuru.length,
          kaih: serverKaih.length,
          membaca: serverMembaca.length,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal sinkronisasi data dari Cloud Server.',
      };
    }
  },

  async getCloudStatus(): Promise<{
    online: boolean;
    lastUpdated?: string;
    counts?: { murid: number; guru: number; kaih: number; membaca: number };
  }> {
    if (typeof window === 'undefined') return { online: false };
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        return {
          online: true,
          lastUpdated: json.lastUpdated,
          counts: json.counts,
        };
      }
      return { online: false };
    } catch {
      return { online: false };
    }
  },

  getShareablePortalUrl(): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return '';
  },

  // GOOGLE APPS SCRIPT SYNC & DIAGNOSTICS (OPSIONAL / CADANGAN)
  isRestrictedWorkspaceUrl(url?: string): boolean {
    if (!url) return false;
    return url.includes('/a/macros/') || url.includes('guru.sd.belajar.id');
  },

  /**
   * JSONP Fetch Fallback - Completely bypasses CORS restrictions and Google Account redirects on Vercel/mobile
   */
  async fetchViaJsonp(baseUrl: string, timeoutMs: number = 12000): Promise<any> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('JSONP hanya dapat dijalankan di browser.'));
        return;
      }

      const callbackName = 'spCallback_' + Math.random().toString(36).substring(2, 9);
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
            'Koneksi ke Google Apps Script melebihi batas waktu (12 detik). Pastikan Web App diatur "Siapa saja (Anyone)" dan tidak diblokir izin organisasi.'
          )
        );
      }, timeoutMs);

      (window as any)[callbackName] = (data: any) => {
        cleanup();
        resolve(data);
      };

      const script = document.createElement('script');
      script.id = callbackName;
      const separator = baseUrl.includes('?') ? '&' : '?';
      script.src = `${baseUrl}${separator}callback=${callbackName}&t=${Date.now()}`;
      script.onerror = () => {
        cleanup();
        reject(
          new Error(
            'Gagal memuat data dari Google Apps Script. Pastikan Web App disetel "Siapa saja (Anyone)" dan "Jalankan sebagai: Saya".'
          )
        );
      };

      document.head.appendChild(script);
    });
  },

  /**
   * PULL / TARIK DATA: Mengambil data dari Cloud Server secara otomatis.
   * Bila ada Google Spreadsheet URL khusus yang ingin ditarik secara manual, fungsi ini juga mendukung.
   */
  async pullDataFromSpreadsheet(customTarget?: string): Promise<{
    success: boolean;
    message: string;
    counts?: { murid: number; guru: number; kaih: number; membaca: number };
  }> {
    const settings = this.getSettings();
    const target = (customTarget || settings.googleWebAppUrl || settings.spreadsheetId || settings.spreadsheetUrl || '').trim();

    let syncResult: GoogleSyncResult | null = null;
    let normTarget: any = null;

    if (target) {
      normTarget = normalizeGoogleUrl(target);
      if (normTarget.type === 'spreadsheet' && normTarget.spreadsheetId) {
        syncResult = await pullAllFromGviz(normTarget.spreadsheetId);
      } else {
        // Default / Web App (Apps Script)
        syncResult = await pullAllFromAppsScript(normTarget.cleanUrl || target);
        // Fallback gviz jika ada spreadsheetId
        const fallbackSheetId =
          settings.spreadsheetId ||
          (settings.spreadsheetUrl ? normalizeGoogleUrl(settings.spreadsheetUrl).spreadsheetId : undefined);
        if (!syncResult.success && fallbackSheetId) {
          const fallbackRes = await pullAllFromGviz(fallbackSheetId);
          if (fallbackRes.success) {
            syncResult = fallbackRes;
          }
        }
      }
    }

    if (syncResult && syncResult.success && syncResult.data) {
      const { murid, guru, jurnal7kaih, jurnalMembaca, pengaturan } = syncResult.data;

      const deletedMuridLedger = this.getDeletedMuridLedger();
      const deletedGuruLedger = this.getDeletedGuruLedger();

      let cleanMurid: Murid[] = [];
      if (murid && Array.isArray(murid) && murid.length > 0) {
        cleanMurid = murid.filter(
          (m) =>
            !deletedMuridLedger.ids.has(m.id) &&
            !deletedMuridLedger.nisns.has(m.nisn) &&
            !deletedMuridLedger.names.has((m.nama || '').trim().toLowerCase())
        );
        if (cleanMurid.length > 0) {
          this.saveMuridList(cleanMurid);
        }
      }

      let cleanGuru: Guru[] = [];
      if (guru && Array.isArray(guru) && guru.length > 0) {
        cleanGuru = guru.filter(
          (g) =>
            !deletedGuruLedger.ids.has(g.id) &&
            !deletedGuruLedger.nips.has(g.nip) &&
            !deletedGuruLedger.names.has((g.nama || '').trim().toLowerCase())
        );
        if (cleanGuru.length > 0) {
          this.saveGuruList(cleanGuru);
        }
      }

      if (jurnal7kaih && jurnal7kaih.length > 0) {
        this.save7KaihList(jurnal7kaih);
      }
      if (jurnalMembaca && jurnalMembaca.length > 0) {
        this.saveMembacaList(jurnalMembaca);
      }

      const updatedSettings: SchoolSettings = {
        ...settings,
        googleWebAppUrl: normTarget && normTarget.type === 'web_app' ? normTarget.cleanUrl : settings.googleWebAppUrl,
        spreadsheetId: (normTarget && normTarget.spreadsheetId) || settings.spreadsheetId,
        lastSyncTime: new Date().toLocaleString('id-ID'),
        ...(pengaturan || {}),
      };
      this.saveSettings(updatedSettings);

      // Sinkronkan juga ke cloud server agar sesi / perangkat lain langsung update
      this.pushToCloudServer({
        settings: updatedSettings,
        murid: cleanMurid.length > 0 ? cleanMurid : this.getMuridList(),
        guru: cleanGuru.length > 0 ? cleanGuru : this.getGuruList(),
        jurnal7kaih: this.get7KaihList(),
        jurnalMembaca: this.getMembacaList(),
      });

      this.triggerChange();

      return {
        success: true,
        message: syncResult.message,
        counts: syncResult.counts,
      };
    }

    // Jika sinkronisasi Google Apps Script tidak berhasil atau offline, coba sinkronisasi Cloud Server
    const cloudRes = await this.pullFromCloudServer();
    if (cloudRes.success) {
      return cloudRes;
    }

    return {
      success: false,
      message: (syncResult && syncResult.message) || cloudRes.message || 'Gagal sinkronisasi data dari Google Spreadsheet.',
    };
  },

  /**
   * TEST KONEKSI GOOGLE CLOUD: Menguji akses URL / Spreadsheet dengan diagnostik multi-akun
   */
  async testConnection(customTarget?: string) {
    const settings = this.getSettings();
    const target = (customTarget || settings.googleWebAppUrl || settings.spreadsheetId || settings.spreadsheetUrl || '').trim();
    return testGoogleConnectionDetailed(target);
  },

  async syncSingleToSpreadsheet(action: string, data: any) {
    const settings = this.getSettings();
    if (!settings.googleWebAppUrl || !settings.googleWebAppUrl.trim().startsWith('http')) {
      return;
    }
    const norm = normalizeGoogleUrl(settings.googleWebAppUrl);
    if (!norm.cleanUrl || !norm.cleanUrl.startsWith('http')) {
      return;
    }
    try {
      await fetch(norm.cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data }),
        mode: 'no-cors',
      });
    } catch (e) {
      console.warn('Apps Script sync skipped or offline:', e);
    }
  },

  /**
   * PUSH / KIRIM DATA: Mengunggah semua data lokal ke Google Spreadsheet
   */
  async syncAllToSpreadsheet(customUrl?: string): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    const url = (customUrl || settings.googleWebAppUrl || '').trim();
    const norm = normalizeGoogleUrl(url);

    if (norm.type !== 'web_app' || !norm.cleanUrl.startsWith('http')) {
      return {
        success: false,
        message: 'URL Google Apps Script Web App belum diatur atau bukan format Web App yang valid!',
      };
    }

    try {
      const payload = {
        action: 'SYNC_ALL',
        settings,
        murid: this.getMuridList(),
        guru: this.getGuruList(),
        jurnal7kaih: this.get7KaihList(),
        jurnalMembaca: this.getMembacaList(),
      };

      await fetch(norm.cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      const updatedSettings = {
        ...settings,
        googleWebAppUrl: norm.cleanUrl,
        lastSyncTime: new Date().toLocaleString('id-ID'),
      };
      this.saveSettings(updatedSettings);

      return {
        success: true,
        message: `Seluruh data (${payload.murid.length} murid, ${payload.guru.length} guru, ${payload.jurnal7kaih.length} jurnal) berhasil dikirim ke Google Spreadsheet!`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal mengirim data ke Google Apps Script: ${err.message || 'Koneksi error'}`,
      };
    }
  },
};
