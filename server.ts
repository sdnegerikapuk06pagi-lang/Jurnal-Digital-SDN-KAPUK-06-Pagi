import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Path for persistent database file
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

// Interface for DB
interface DatabaseSchema {
  settings: any;
  murid: any[];
  guru: any[];
  jurnal7kaih: any[];
  jurnalMembaca: any[];
  refleksi: any[];
  notifications: any[];
  adminUsers: any[];
  deletedMuridLedger: { ids: string[]; nisns: string[]; names: string[] };
  deletedGuruLedger: { ids: string[]; nips: string[]; names: string[] };
  lastUpdated: string;
}

const DEFAULT_SETTINGS = {
  namaSekolah: 'SDN KAPUK 06 PAGI',
  subJudul: 'SISTEM INFORMASI SEKOLAH & E-JURNAL PEMBIASAAN KARAKTER',
  npsn: '20105291',
  alamat: 'Jalan Tenis Raya Rt 011 Rw 14 Kapuk, Cengkareng - Jakarta Barat',
  kelurahan: 'Kapuk',
  kecamatan: 'Cengkareng',
  kota: 'Kota Jakarta Barat',
  provinsi: 'DKI Jakarta',
  kodePos: '11720',
  telepon: '(021) 5414603',
  email: 'sdnkapuk06pagi@gmail.com',
  website: 'https://sdnkapuk06pagi.sch.id',
  kepalaSekolah: 'Emirita Br. Ginting, S.Ag',
  nipKepalaSekolah: '197104212003122001',
  semester: 'Semester Ganjil (1)',
  tahunAjaran: '2026/2027',
  logoUrl: 'https://i.imgur.com/GlCn0x3.png',
  posterUrl: 'https://i.imgur.com/pJOJiuF.jpeg',
  kopSuratMode: 'default',
  adminUsername: 'admin06',
  adminPassword: 'admin123!',
  googleWebAppUrl: 'https://script.google.com/macros/s/AKfycbxW5vDx2PxEJY0S_4i0vjT2NqtJNddI1-ThE_qaQTTPnLZo4LXqvkdU-agUVjs5o9uIYg/exec',
  spreadsheetId: '',
  spreadsheetUrl: '',
  lastSyncTime: '',
  autoSyncOnLoad: true,
};

const DEFAULT_ADMIN_USERS = [
  {
    id: 'admin-master',
    username: 'admin06',
    password: 'admin123!',
    nama: 'Administrator Utama (SDN Kapuk 06 Pagi)',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'admin-kepsek',
    username: 'kepsek',
    password: 'admin123!',
    nama: 'Emirita Br. Ginting, S.Ag (Kepala Sekolah)',
    role: 'kepsek',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

let db: DatabaseSchema = {
  settings: { ...DEFAULT_SETTINGS },
  murid: [],
  guru: [],
  jurnal7kaih: [],
  jurnalMembaca: [],
  refleksi: [],
  notifications: [],
  adminUsers: [...DEFAULT_ADMIN_USERS],
  deletedMuridLedger: { ids: [], nisns: [], names: [] },
  deletedGuruLedger: { ids: [], nips: [], names: [] },
  lastUpdated: new Date().toISOString(),
};

// Initialize DB file
function initDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      db = {
        ...db,
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        adminUsers: Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
          ? parsed.adminUsers
          : [...DEFAULT_ADMIN_USERS],
      };
      if (
        !db.settings.googleWebAppUrl ||
        db.settings.googleWebAppUrl.includes('AKfycbyqMbSFSxpUUy0qagz5U3vMaICah-H0PPL2jz4irGDobtnX-ktMtH-5IUjyAdnya8uD9g')
      ) {
        db.settings.googleWebAppUrl = 'https://script.google.com/macros/s/AKfycbxW5vDx2PxEJY0S_4i0vjT2NqtJNddI1-ThE_qaQTTPnLZo4LXqvkdU-agUVjs5o9uIYg/exec';
      }
      saveDbToFile();
      console.log(`[DB] Loaded persistent database from ${DB_FILE}`);
    } else {
      saveDbToFile();
      console.log(`[DB] Initialized fresh database at ${DB_FILE}`);
    }
  } catch (err) {
    console.error('[DB] Error initializing database:', err);
  }
}

function saveDbToFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Error saving database to file:', err);
  }
}

initDb();

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API ROUTES
  // 1. Status / Health Check
  app.get('/api/status', (req, res) => {
    res.json({
      success: true,
      online: true,
      lastUpdated: db.lastUpdated,
      counts: {
        murid: db.murid.length,
        guru: db.guru.length,
        jurnal7kaih: db.jurnal7kaih.length,
        jurnalMembaca: db.jurnalMembaca.length,
        refleksi: db.refleksi.length,
        notifications: db.notifications.length,
      },
      message: 'Cloud Database SDN Kapuk 06 Pagi Aktif dan Terhubung Otomatis.',
    });
  });

  // 2. Get All Data
  app.get('/api/data', (req, res) => {
    res.json({
      success: true,
      data: db,
    });
  });

  // 3. Central Cloud Sync & Intelligent Merge
  app.post('/api/sync', (req, res) => {
    try {
      const payload = req.body || {};

      // Merge Settings if provided
      if (payload.settings && typeof payload.settings === 'object') {
        db.settings = {
          ...db.settings,
          ...payload.settings,
        };
      }

      // Merge Deleted Ledgers
      if (payload.deletedMuridLedger) {
        const setIds = new Set([...(db.deletedMuridLedger.ids || []), ...(payload.deletedMuridLedger.ids || [])]);
        const setNisns = new Set([...(db.deletedMuridLedger.nisns || []), ...(payload.deletedMuridLedger.nisns || [])]);
        const setNames = new Set([...(db.deletedMuridLedger.names || []), ...(payload.deletedMuridLedger.names || [])]);
        db.deletedMuridLedger = {
          ids: Array.from(setIds),
          nisns: Array.from(setNisns),
          names: Array.from(setNames),
        };
      }

      if (payload.deletedGuruLedger) {
        const setIds = new Set([...(db.deletedGuruLedger.ids || []), ...(payload.deletedGuruLedger.ids || [])]);
        const setNips = new Set([...(db.deletedGuruLedger.nips || []), ...(payload.deletedGuruLedger.nips || [])]);
        const setNames = new Set([...(db.deletedGuruLedger.names || []), ...(payload.deletedGuruLedger.names || [])]);
        db.deletedGuruLedger = {
          ids: Array.from(setIds),
          nips: Array.from(setNips),
          names: Array.from(setNames),
        };
      }

      // Murid sync
      if (Array.isArray(payload.murid)) {
        if (payload.replaceMurid === true) {
          db.murid = payload.murid;
        } else {
          const deletedIds = new Set(db.deletedMuridLedger.ids || []);
          const deletedNisns = new Set(db.deletedMuridLedger.nisns || []);
          const deletedNames = new Set(db.deletedMuridLedger.names || []);

          const muridMap = new Map<string, any>();
          // Existing murid
          db.murid.forEach((m) => {
            if (!deletedIds.has(m.id) && !deletedNisns.has(m.nisn) && !deletedNames.has((m.nama || '').trim().toLowerCase())) {
              muridMap.set(m.id, m);
            }
          });
          // Incoming murid
          payload.murid.forEach((m: any) => {
            if (!deletedIds.has(m.id) && !deletedNisns.has(m.nisn) && !deletedNames.has((m.nama || '').trim().toLowerCase())) {
              muridMap.set(m.id, { ...(muridMap.get(m.id) || {}), ...m });
            }
          });
          db.murid = Array.from(muridMap.values());
        }
      }

      // Guru sync
      if (Array.isArray(payload.guru)) {
        if (payload.replaceGuru === true) {
          db.guru = payload.guru;
        } else {
          const deletedIds = new Set(db.deletedGuruLedger.ids || []);
          const deletedNips = new Set(db.deletedGuruLedger.nips || []);
          const deletedNames = new Set(db.deletedGuruLedger.names || []);

          const guruMap = new Map<string, any>();
          db.guru.forEach((g) => {
            if (!deletedIds.has(g.id) && !deletedNips.has(g.nip) && !deletedNames.has((g.nama || '').trim().toLowerCase())) {
              guruMap.set(g.id, g);
            }
          });
          payload.guru.forEach((g: any) => {
            if (!deletedIds.has(g.id) && !deletedNips.has(g.nip) && !deletedNames.has((g.nama || '').trim().toLowerCase())) {
              guruMap.set(g.id, { ...(guruMap.get(g.id) || {}), ...g });
            }
          });
          db.guru = Array.from(guruMap.values());
        }
      }

      // Jurnal 7 KAIH sync
      if (Array.isArray(payload.jurnal7kaih)) {
        if (payload.replace7kaih === true) {
          db.jurnal7kaih = payload.jurnal7kaih;
        } else {
          const kaihMap = new Map<string, any>();
          db.jurnal7kaih.forEach((k) => kaihMap.set(k.id, k));
          payload.jurnal7kaih.forEach((k: any) => {
            kaihMap.set(k.id, { ...(kaihMap.get(k.id) || {}), ...k });
          });
          db.jurnal7kaih = Array.from(kaihMap.values());
        }
      }

      // Jurnal Membaca sync
      if (Array.isArray(payload.jurnalMembaca)) {
        if (payload.replaceMembaca === true) {
          db.jurnalMembaca = payload.jurnalMembaca;
        } else {
          const membacaMap = new Map<string, any>();
          db.jurnalMembaca.forEach((m) => membacaMap.set(m.id, m));
          payload.jurnalMembaca.forEach((m: any) => {
            membacaMap.set(m.id, { ...(membacaMap.get(m.id) || {}), ...m });
          });
          db.jurnalMembaca = Array.from(membacaMap.values());
        }
      }

      // Refleksi sync
      if (Array.isArray(payload.refleksi)) {
        const refleksiMap = new Map<string, any>();
        db.refleksi.forEach((r) => {
          const key = r.id || `${r.muridId}_${r.bulan}`;
          refleksiMap.set(key, r);
        });
        payload.refleksi.forEach((r: any) => {
          const key = r.id || `${r.muridId}_${r.bulan}`;
          refleksiMap.set(key, { ...(refleksiMap.get(key) || {}), ...r });
        });
        db.refleksi = Array.from(refleksiMap.values());
      }

      // Notifications sync
      if (Array.isArray(payload.notifications)) {
        const notifMap = new Map<string, any>();
        db.notifications.forEach((n) => notifMap.set(n.id, n));
        payload.notifications.forEach((n: any) => {
          notifMap.set(n.id, { ...(notifMap.get(n.id) || {}), ...n });
        });
        db.notifications = Array.from(notifMap.values());
      }

      // Admin users sync
      if (Array.isArray(payload.adminUsers) && payload.adminUsers.length > 0) {
        db.adminUsers = payload.adminUsers;
      }

      saveDbToFile();

      res.json({
        success: true,
        message: 'Sinkronisasi Cloud Server Otomatis Berhasil!',
        data: db,
      });
    } catch (err: any) {
      console.error('[API /api/sync] Error:', err);
      res.status(500).json({ success: false, message: err.message || 'Gagal sinkronisasi data ke cloud' });
    }
  });

  // 4. Save Single or List of Murid
  app.post('/api/murid', (req, res) => {
    try {
      const { murid, replaceAll } = req.body;
      if (replaceAll && Array.isArray(murid)) {
        db.murid = murid;
      } else if (Array.isArray(murid)) {
        const map = new Map(db.murid.map((m) => [m.id, m]));
        murid.forEach((m) => map.set(m.id, m));
        db.murid = Array.from(map.values());
      } else if (murid && typeof murid === 'object') {
        const idx = db.murid.findIndex((m) => m.id === murid.id);
        if (idx >= 0) {
          db.murid[idx] = { ...db.murid[idx], ...murid };
        } else {
          db.murid.push(murid);
        }
      }
      saveDbToFile();
      res.json({ success: true, murid: db.murid });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 5. Delete Murid
  app.delete('/api/murid/:id', (req, res) => {
    const id = req.params.id;
    const target = db.murid.find((m) => m.id === id);
    if (target) {
      db.deletedMuridLedger.ids.push(target.id);
      if (target.nisn) db.deletedMuridLedger.nisns.push(target.nisn);
      if (target.nama) db.deletedMuridLedger.names.push(target.nama.trim().toLowerCase());
    }
    db.murid = db.murid.filter((m) => m.id !== id);
    saveDbToFile();
    res.json({ success: true, murid: db.murid });
  });

  // Bulk Delete All Murid
  app.delete('/api/murid', (req, res) => {
    db.murid.forEach((m) => {
      db.deletedMuridLedger.ids.push(m.id);
      if (m.nisn) db.deletedMuridLedger.nisns.push(m.nisn);
      if (m.nama) db.deletedMuridLedger.names.push(m.nama.trim().toLowerCase());
    });
    db.murid = [];
    saveDbToFile();
    res.json({ success: true, murid: [] });
  });

  // 6. Save Guru
  app.post('/api/guru', (req, res) => {
    try {
      const { guru, replaceAll } = req.body;
      if (replaceAll && Array.isArray(guru)) {
        db.guru = guru;
      } else if (Array.isArray(guru)) {
        const map = new Map(db.guru.map((g) => [g.id, g]));
        guru.forEach((g) => map.set(g.id, g));
        db.guru = Array.from(map.values());
      } else if (guru && typeof guru === 'object') {
        const idx = db.guru.findIndex((g) => g.id === guru.id);
        if (idx >= 0) {
          db.guru[idx] = { ...db.guru[idx], ...guru };
        } else {
          db.guru.push(guru);
        }
      }
      saveDbToFile();
      res.json({ success: true, guru: db.guru });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 7. Delete Guru
  app.delete('/api/guru/:id', (req, res) => {
    const id = req.params.id;
    const target = db.guru.find((g) => g.id === id);
    if (target) {
      db.deletedGuruLedger.ids.push(target.id);
      if (target.nip) db.deletedGuruLedger.nips.push(target.nip);
      if (target.nama) db.deletedGuruLedger.names.push(target.nama.trim().toLowerCase());
    }
    db.guru = db.guru.filter((g) => g.id !== id);
    saveDbToFile();
    res.json({ success: true, guru: db.guru });
  });

  app.delete('/api/guru', (req, res) => {
    db.guru.forEach((g) => {
      db.deletedGuruLedger.ids.push(g.id);
      if (g.nip) db.deletedGuruLedger.nips.push(g.nip);
      if (g.nama) db.deletedGuruLedger.names.push(g.nama.trim().toLowerCase());
    });
    db.guru = [];
    saveDbToFile();
    res.json({ success: true, guru: [] });
  });

  // 8. Submit / Update Jurnal 7 KAIH
  app.post('/api/jurnal-7kaih', (req, res) => {
    try {
      const item = req.body;
      const idx = db.jurnal7kaih.findIndex((j) => j.id === item.id);
      if (idx >= 0) {
        db.jurnal7kaih[idx] = { ...db.jurnal7kaih[idx], ...item };
      } else {
        db.jurnal7kaih.unshift(item);
      }
      saveDbToFile();
      res.json({ success: true, item, list: db.jurnal7kaih });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 9. Submit / Update Jurnal Membaca
  app.post('/api/jurnal-membaca', (req, res) => {
    try {
      const item = req.body;
      const idx = db.jurnalMembaca.findIndex((j) => j.id === item.id);
      if (idx >= 0) {
        db.jurnalMembaca[idx] = { ...db.jurnalMembaca[idx], ...item };
      } else {
        db.jurnalMembaca.unshift(item);
      }
      saveDbToFile();
      res.json({ success: true, item, list: db.jurnalMembaca });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // 10. Reset Database
  app.post('/api/reset', (req, res) => {
    db = {
      settings: { ...DEFAULT_SETTINGS },
      murid: [],
      guru: [],
      jurnal7kaih: [],
      jurnalMembaca: [],
      refleksi: [],
      notifications: [],
      adminUsers: [...DEFAULT_ADMIN_USERS],
      deletedMuridLedger: { ids: [], nisns: [], names: [] },
      deletedGuruLedger: { ids: [], nips: [], names: [] },
      lastUpdated: new Date().toISOString(),
    };
    saveDbToFile();
    res.json({ success: true, message: 'Database reset berhasil.', data: db });
  });

  // Mount Vite or static file serving
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] DIGITAL SDN Kapuk 06 Pagi running on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER] Fatal error starting server:', err);
  process.exit(1);
});
