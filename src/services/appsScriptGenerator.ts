import { generateAppsScriptHtml } from './appsScriptHtmlTemplate';
export { generateAppsScriptHtml };

export const generateAppsScriptCode = (
  spreadsheetName: string = 'DATABASE DIGITAL SDN KAPUK 06 PAGI',
  spreadsheetUrlOrId: string = ''
) => {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT (Code.gs) - DIGITAL SDN KAPUK 06 PAGI
 * SISTEM INFORMASI SEKOLAH, E-JURNAL 7 KAIH & LITERASI MEMBACA
 * =========================================================================
 * Petunjuk Instalasi & Mengatasi Masalah Akses Akun Google:
 * 1. Buka Google Spreadsheet di https://sheets.new atau gunakan spreadsheet yang sudah ada.
 * 2. Beri nama Spreadsheet: "${spreadsheetName}"
 * 3. Klik menu "Ekstensi" > "Apps Script"
 * 4. Pada file "Code.gs", hapus semua kode bawaan lalu Salin & Tempel seluruh kode ini.
 * 5. Buat file HTML baru: Klik ikon "+" di samping File > pilih "HTML", beri nama "Index".
 * 6. Salin & Tempel seluruh kode Index.html ke dalam file "Index.html".
 * 7. Klik Simpan (Ctrl+S / Cmd+S).
 * 8. Jalankan fungsi "setupDatabaseSheets" satu kali untuk membuat sheet otomatis.
 * 9. Klik "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment):
 *    - Pilih Jenis: "Aplikasi Web" (Web App)
 *    - Deskripsi: Web App & API SDN Kapuk 06 Pagi
 *    - Jalankan sebagai: "SAYA" (Me) <-- WAJIB "Saya"! Jangan pilih "Pengguna yang mengakses"!
 *    - Siapa yang memiliki akses: "SIAPA SAJA" (Anyone) <-- WAJIB "Siapa saja"!
 * 10. Klik "Terapkan", berikan Izin Akses (Review Permissions -> Lanjutkan -> Izinkan).
 * =========================================================================
 */

// =========================================================================
// 1. LINK / ID GOOGLE SPREADSHEET (PENTING!)
// =========================================================================
// Jika script ini dibuat dari menu "Ekstensi" > "Apps Script" di dalam Spreadsheet,
// script akan OTOMATIS membaca spreadsheet tersebut secara langsung.
//
// JIKA LINK BELUM TERBACA ATAU SCRIPT DIBUAT DARI script.google.com (STANDALONE):
// Silakan tempelkan link atau ID Google Spreadsheet Anda di dalam tanda petik di bawah ini:
var SPREADSHEET_URL_OR_ID = "${spreadsheetUrlOrId || ''}";

// =========================================================================
// FUNGSI PENGHUBUNG GOOGLE SPREADSHEET (SANGAT FLEKSIBEL & RESILIEN)
// =========================================================================
function getTargetSpreadsheet(optIdOrUrl) {
  var ss = null;

  // A. Cek dari parameter pemanggilan
  if (optIdOrUrl && typeof optIdOrUrl === "string" && optIdOrUrl.trim() !== "") {
    var rawOpt = optIdOrUrl.trim();
    var matchOpt = rawOpt.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);
    var targetOptId = matchOpt ? matchOpt[1] : rawOpt;
    try {
      ss = SpreadsheetApp.openById(targetOptId);
      if (ss && ss.getId()) return ss;
    } catch (eOpt) {}
  }

  // B. Coba Spreadsheet Aktif (Container-Bound dari menu Ekstensi > Apps Script)
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss && ss.getId()) return ss;
  } catch (eActive) {}

  // C. Coba dari variabel SPREADSHEET_URL_OR_ID di baris atas
  if (typeof SPREADSHEET_URL_OR_ID !== "undefined" && SPREADSHEET_URL_OR_ID && SPREADSHEET_URL_OR_ID.trim() !== "") {
    var rawVar = SPREADSHEET_URL_OR_ID.trim();
    var matchVar = rawVar.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);
    var targetVarId = matchVar ? matchVar[1] : rawVar;
    try {
      ss = SpreadsheetApp.openById(targetVarId);
      if (ss && ss.getId()) return ss;
    } catch (eVar) {
      Logger.log("Gagal openById dari SPREADSHEET_URL_OR_ID: " + eVar);
    }
  }

  // D. Coba dari ScriptProperties (yang disimpan dari tombol 'Hubungkan Spreadsheet' di Web App)
  try {
    var propId = PropertiesService.getScriptProperties().getProperty("TARGET_SPREADSHEET_ID");
    if (propId) {
      ss = SpreadsheetApp.openById(propId);
      if (ss && ss.getId()) return ss;
    }
  } catch (eProp) {}

  // E. Coba dari UserProperties
  try {
    var userPropId = PropertiesService.getUserProperties().getProperty("TARGET_SPREADSHEET_ID");
    if (userPropId) {
      ss = SpreadsheetApp.openById(userPropId);
      if (ss && ss.getId()) return ss;
    }
  } catch (eUser) {}

  return null;
}

function saveSpreadsheetLink(urlOrId) {
  try {
    if (!urlOrId || String(urlOrId).trim() === "") {
      return { status: "error", message: "Link atau ID spreadsheet tidak boleh kosong." };
    }
    var clean = String(urlOrId).trim();
    var match = clean.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);
    var targetId = match ? match[1] : clean;
    var testSs = SpreadsheetApp.openById(targetId);
    PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", targetId);
    setupDatabaseSheets();
    return {
      status: "success",
      message: "Berhasil terhubung ke spreadsheet: " + testSs.getName(),
      name: testSs.getName(),
      id: targetId,
      url: testSs.getUrl()
    };
  } catch (err) {
    return {
      status: "error",
      message: "Gagal menghubungkan spreadsheet: " + err.toString() + ". Pastikan link valid dan spreadsheet diatur 'Siapa saja yang memiliki link dapat melihat'."
    };
  }
}

function getSpreadsheetInfo() {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      return {
        status: "disconnected",
        connected: false,
        name: "-",
        id: "-",
        url: "-",
        message: "Spreadsheet belum terhubung. Silakan masukkan link spreadsheet."
      };
    }
    var sheetNames = [];
    try {
      sheetNames = ss.getSheets().map(function(s) { return s.getName(); });
    } catch (eS) {}
    return {
      status: "connected",
      connected: true,
      name: ss.getName(),
      id: ss.getId(),
      url: ss.getUrl(),
      totalSheets: sheetNames.length,
      sheetNames: sheetNames,
      message: "Spreadsheet terhubung: " + ss.getName()
    };
  } catch (e) {
    return {
      status: "error",
      connected: false,
      message: e.toString()
    };
  }
}

// =========================================================================
// MENU KHUSUS SPREADSHEET (Otomatis muncul di toolbar atas Google Sheets)
// =========================================================================
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("📋 MENU DIGITAL SDN KAPUK 06")
      .addItem("🔄 Pasang / Perbarui Dropdown Murid & Guru", "applySpreadsheetDropdownsManual")
      .addItem("⚙️ Setup Struktur Seluruh Sheet Otomatis", "setupDatabaseSheets")
      .addToUi();
  } catch (e) {
    // Abaikan jika dipanggil di luar konteks Spreadsheet UI
  }
}

function applySpreadsheetDropdownsManual() {
  var ss = getTargetSpreadsheet();
  setupDatabaseSheets();
  if (ss) applySpreadsheetDropdowns(ss);
  try {
    SpreadsheetApp.getUi().alert("✅ Berhasil! Dropdown Nama Murid dan Guru telah dipasang di kolom JURNAL_7KAIH dan JURNAL_MEMBACA.");
  } catch (e) {}
}

// 1. TAMPILAN WEB APP (doGet)
function doGet(e) {
  // Simpan parameter link jika ada yang dikirim melalui URL (?sheetUrl=... atau ?sheetId=...)
  if (e && e.parameter) {
    var paramUrl = e.parameter.sheetUrl || e.parameter.sheetId || e.parameter.url || e.parameter.id;
    if (paramUrl) {
      try {
        var matchP = paramUrl.match(/\\/spreadsheets\\/d\\/([a-zA-Z0-9-_]+)/);
        var idP = matchP ? matchP[1] : paramUrl;
        PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", idP);
      } catch (eP) {}
    }
  }

  var ss = getTargetSpreadsheet();
  if (ss) {
    setupDatabaseSheets();
    applySpreadsheetDropdowns(ss);
  }

  var callback = (e && e.parameter && e.parameter.callback) || '';
  var isApiRequest = (e && e.parameter && (e.parameter.api === 'json' || e.parameter.action === 'GET_ALL' || callback !== ''));

  // Jika dipanggil sebagai API (JSON atau JSONP), kembalikan data seluruh sheet
  if (isApiRequest) {
    return handleGetApi(ss, callback);
  }

  // Coba tampilkan file Index jika sudah dibuat di Apps Script
  try {
    var template = HtmlService.createTemplateFromFile("Index");
    return template.evaluate()
      .setTitle("DIGITAL SDN KAPUK 06 PAGI - E-Jurnal 7 KAIH & Literasi")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // Jika file Index belum dibuat, tampilkan halaman web otomatis (All-in-One)
    return HtmlService.createHtmlOutput(getBuiltinWebHtml())
      .setTitle("DIGITAL SDN KAPUK 06 PAGI - E-Jurnal 7 KAIH & Literasi")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// 2. ENDPOINT API POST (Menerima kiriman dari sistem web)
function doPost(e) {
  try {
    var ss = getTargetSpreadsheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;

    if (action === "SET_SPREADSHEET") {
      var sUrl = payload.url || payload.id;
      return responseJSON(saveSpreadsheetLink(sUrl));
    }

    if (action === "PING") {
      return responseJSON({
        status: "success",
        connected: ss ? true : false,
        spreadsheetName: ss ? ss.getName() : "Belum Terhubung",
        message: ss ? "Koneksi Google Spreadsheet SDN Kapuk 06 Pagi Berhasil!" : "Spreadsheet belum terhubung.",
        counts: {
          murid: (ss && ss.getSheetByName("DATA_MURID")) ? Math.max(0, ss.getSheetByName("DATA_MURID").getLastRow() - 1) : 0,
          guru: (ss && ss.getSheetByName("DATA_GURU")) ? Math.max(0, ss.getSheetByName("DATA_GURU").getLastRow() - 1) : 0,
          kaih: (ss && ss.getSheetByName("JURNAL_7KAIH")) ? Math.max(0, ss.getSheetByName("JURNAL_7KAIH").getLastRow() - 1) : 0,
          membaca: (ss && ss.getSheetByName("JURNAL_MEMBACA")) ? Math.max(0, ss.getSheetByName("JURNAL_MEMBACA").getLastRow() - 1) : 0
        }
      });
    }

    if (!ss) {
      return responseJSON({ status: "error", message: "Spreadsheet belum terhubung di Apps Script! Silakan set link spreadsheet." });
    }

    setupDatabaseSheets();

    if (action === "GET_ALL" || action === "PULL_ALL") {
      return handleGetApi(ss, '');
    }

    if (action === "SYNC_ALL") {
      if (payload.murid && Array.isArray(payload.murid)) {
        var sMAll = getOrCreateSheet(ss, "DATA_MURID", ["DATA MURID", "DATAMURID", "DATA SISWA", "MURID", "SISWA"], "murid");
        syncMuridSheet(sMAll, payload.murid);
      }
      if (payload.guru && Array.isArray(payload.guru)) {
        var sGAll = getOrCreateSheet(ss, "DATA_GURU", ["DATA GURU", "DATAGURU", "GURU", "DAFTAR GURU"], "guru");
        syncGuruSheet(sGAll, payload.guru);
      }
      if (payload.jurnal7kaih && Array.isArray(payload.jurnal7kaih)) {
        var sKAll = getOrCreateSheet(ss, "JURNAL_7KAIH", ["JURNAL 7 KAIH", "7KAIH"], "kaih");
        sync7KaihSheet(sKAll, payload.jurnal7kaih);
      }
      if (payload.jurnalMembaca && Array.isArray(payload.jurnalMembaca)) {
        var sBAll = getOrCreateSheet(ss, "JURNAL_MEMBACA", ["JURNAL MEMBACA", "MEMBACA"], "membaca");
        syncMembacaSheet(sBAll, payload.jurnalMembaca);
      }
      return responseJSON({ status: "success", message: "Seluruh data berhasil disinkronkan ke Google Spreadsheet." });
    }

    if (action === "SYNC_MURID" || action === "ADD_MURID" || action === "UPDATE_MURID") {
      var sMuridTarget = getOrCreateSheet(ss, "DATA_MURID", ["DATA MURID", "DATAMURID", "DATA SISWA", "MURID", "SISWA"], "murid");
      var mData = payload.data || payload;
      var mId = String(mData.id || ("m-" + Utilities.getUuid().slice(0, 8))).trim();
      var mNisn = String(mData.nisn || "").trim();
      var mNis = String(mData.nis || (mNisn ? mNisn.slice(-4) : "")).trim();
      var mNama = String(mData.nama || mData["Nama Murid"] || mData.Nama || "").trim();
      var mKelas = String(mData.kelas || mData.Kelas || "Kelas 1A").trim();
      var mJk = String(mData.jenisKelamin || mData.JK || "L").trim().toUpperCase();
      var mOrtu = String(mData.namaOrangTua || mData["Nama Orang Tua"] || "Orang Tua / Wali").trim();
      var mHp = String(mData.noHpOraangTua || mData["No HP Orang Tua"] || "081200000000").trim();
      var mPin = String(mData.pin || mData.PIN || "1234").trim();

      if (mNama) {
        var mRows = sMuridTarget.getDataRange().getValues();
        var foundRowIdx = -1;
        for (var rIdx = 1; rIdx < mRows.length; rIdx++) {
          var rId = String(mRows[rIdx][0] || "").trim();
          var rNisn = String(mRows[rIdx][1] || "").trim();
          var rNama = String(mRows[rIdx][3] || "").trim().toLowerCase();
          if ((mId && rId === mId) || (mNisn && rNisn === mNisn) || (rNama && rNama === mNama.toLowerCase())) {
            foundRowIdx = rIdx + 1;
            break;
          }
        }

        if (foundRowIdx > 0) {
          sMuridTarget.getRange(foundRowIdx, 1, 1, 9).setValues([[
            mId, mNisn, mNis, mNama, mKelas, mJk, mOrtu, mHp, mPin
          ]]);
        } else {
          sMuridTarget.appendRow([
            mId, mNisn, mNis, mNama, mKelas, mJk, mOrtu, mHp, mPin
          ]);
        }
        applySpreadsheetDropdowns(ss);
        return responseJSON({ status: "success", message: "Data murid " + mNama + " berhasil tersimpan di Google Spreadsheet!" });
      }
      return responseJSON({ status: "error", message: "Nama murid tidak boleh kosong." });
    }

    if (action === "SYNC_ALL_MURID" || action === "BULK_IMPORT_MURID") {
      var sMuridBulk = getOrCreateSheet(ss, "DATA_MURID", ["DATA MURID", "DATAMURID", "DATA SISWA", "MURID", "SISWA"], "murid");
      var listMurid = payload.data || payload.murid || payload;
      if (Array.isArray(listMurid) && listMurid.length > 0) {
        syncMuridSheet(sMuridBulk, listMurid);
        return responseJSON({ status: "success", message: "Berhasil menyinkronkan " + listMurid.length + " murid ke Google Spreadsheet!" });
      }
      return responseJSON({ status: "error", message: "Data murid tidak valid." });
    }

    if (action === "SYNC_GURU" || action === "ADD_GURU" || action === "UPDATE_GURU") {
      var sGuruTarget = getOrCreateSheet(ss, "DATA_GURU", ["DATA GURU", "DATAGURU", "GURU", "DAFTAR GURU"], "guru");
      var gData = payload.data || payload;
      var gId = String(gData.id || ("g-" + Utilities.getUuid().slice(0, 8))).trim();
      var gNip = String(gData.nip || "").trim();
      var gNama = String(gData.nama || gData["Nama Guru"] || "").trim();
      var gJab = String(gData.jabatan || "Wali Kelas").trim();
      var gAmpu = String(gData.kelasAmpu || "Semua Kelas").trim();
      var gEmail = String(gData.email || "").trim();
      var gHp = String(gData.noHp || "").trim();
      var gPin = String(gData.pin || "1234").trim();

      if (gNama) {
        var gRows = sGuruTarget.getDataRange().getValues();
        var foundGRow = -1;
        for (var grIdx = 1; grIdx < gRows.length; grIdx++) {
          var grId = String(gRows[grIdx][0] || "").trim();
          var grNip = String(gRows[grIdx][1] || "").trim();
          var grNama = String(gRows[grIdx][2] || "").trim().toLowerCase();
          if ((gId && grId === gId) || (gNip && grNip === gNip) || (grNama && grNama === gNama.toLowerCase())) {
            foundGRow = grIdx + 1;
            break;
          }
        }
        if (foundGRow > 0) {
          sGuruTarget.getRange(foundGRow, 1, 1, 8).setValues([[
            gId, gNip, gNama, gJab, gAmpu, gEmail, gHp, gPin
          ]]);
        } else {
          sGuruTarget.appendRow([
            gId, gNip, gNama, gJab, gAmpu, gEmail, gHp, gPin
          ]);
        }
        applySpreadsheetDropdowns(ss);
        return responseJSON({ status: "success", message: "Data guru " + gNama + " berhasil tersimpan di Google Spreadsheet!" });
      }
      return responseJSON({ status: "error", message: "Nama guru tidak boleh kosong." });
    }

    if (action === "SUBMIT_7KAIH") {
      var res = submit7KaihData(payload.data);
      return responseJSON(res);
    }

    if (action === "SUBMIT_MEMBACA") {
      var resM = submitMembacaData(payload.data);
      return responseJSON(resM);
    }

    if (action === "VERIFY_JURNAL") {
      var resV = verifyJurnalEntry(payload.type, payload.id, payload.feedback, payload.rating, payload.guruNama, payload.status);
      return responseJSON(resV);
    }

    if (action === "DELETE_MURID") {
      var sheetMuridDel = ss.getSheetByName("DATA_MURID");
      if (sheetMuridDel) {
        var pDataM = payload.data || payload;
        var idDel = String(pDataM.id || '').trim();
        var nisnDel = String(pDataM.nisn || '').trim();
        var namaDel = String(pDataM.nama || '').trim().toLowerCase();
        var dataMuridRows = sheetMuridDel.getDataRange().getValues();
        for (var im = dataMuridRows.length - 1; im >= 1; im--) {
          var rowId = String(dataMuridRows[im][0] || '').trim();
          var rowNisn = String(dataMuridRows[im][1] || '').trim();
          var rowNama = String(dataMuridRows[im][3] || '').trim().toLowerCase();
          if (
            (idDel && rowId === idDel) ||
            (nisnDel && rowNisn === nisnDel) ||
            (namaDel && rowNama === namaDel)
          ) {
            sheetMuridDel.deleteRow(im + 1);
          }
        }
        applySpreadsheetDropdowns(ss);
      }
      return responseJSON({ status: "success", message: "Data murid berhasil dihapus dari Google Spreadsheet." });
    }

    if (action === "DELETE_GURU") {
      var sheetGuruDel = ss.getSheetByName("DATA_GURU");
      if (sheetGuruDel) {
        var pDataG = payload.data || payload;
        var gidDel = String(pDataG.id || '').trim();
        var nipDel = String(pDataG.nip || '').trim();
        var gnamaDel = String(pDataG.nama || '').trim().toLowerCase();
        var dataGuruRows = sheetGuruDel.getDataRange().getValues();
        for (var ig = dataGuruRows.length - 1; ig >= 1; ig--) {
          var growId = String(dataGuruRows[ig][0] || '').trim();
          var growNip = String(dataGuruRows[ig][1] || '').trim();
          var growNama = String(dataGuruRows[ig][2] || '').trim().toLowerCase();
          if (
            (gidDel && growId === gidDel) ||
            (nipDel && growNip === nipDel) ||
            (gnamaDel && growNama === gnamaDel)
          ) {
            sheetGuruDel.deleteRow(ig + 1);
          }
        }
        applySpreadsheetDropdowns(ss);
      }
      return responseJSON({ status: "success", message: "Data guru berhasil dihapus dari Google Spreadsheet." });
    }

    if (action === "DELETE_ALL_MURID") {
      var sheetMuridAll = ss.getSheetByName("DATA_MURID");
      if (sheetMuridAll) {
        syncMuridSheet(sheetMuridAll, []);
      }
      return responseJSON({ status: "success", message: "Seluruh data murid berhasil dihapus dari Google Spreadsheet." });
    }

    if (action === "DELETE_ALL_GURU") {
      var sheetGuruAll = ss.getSheetByName("DATA_GURU");
      if (sheetGuruAll) {
        syncGuruSheet(sheetGuruAll, []);
      }
      return responseJSON({ status: "success", message: "Seluruh data guru berhasil dihapus dari Google Spreadsheet." });
    }

    if (action === "DELETE_ALL_7KAIH") {
      var sheetKaihAll = ss.getSheetByName("JURNAL_7KAIH");
      if (sheetKaihAll) {
        sync7KaihSheet(sheetKaihAll, []);
      }
      return responseJSON({ status: "success", message: "Seluruh riwayat Jurnal 7 KAIH berhasil dihapus dari Google Spreadsheet." });
    }

    if (action === "DELETE_ALL_MEMBACA") {
      var sheetMembacaAll = ss.getSheetByName("JURNAL_MEMBACA");
      if (sheetMembacaAll) {
        syncMembacaSheet(sheetMembacaAll, []);
      }
      return responseJSON({ status: "success", message: "Seluruh riwayat Jurnal Membaca berhasil dihapus dari Google Spreadsheet." });
    }

    return responseJSON({ status: "error", message: "Action tidak dikenal: " + action });
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

// =========================================================================
// FUNGSI SERVER UNTUK DIPANGGIL DARI Index.html (google.script.run)
// =========================================================================

function getInitialAppData() {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) {
      return {
        status: "error",
        connected: false,
        message: "Link Spreadsheet belum terbaca di Apps Script! Silakan masukkan link spreadsheet melalui tombol 'Hubungkan Spreadsheet' di bagian atas atau isi variabel SPREADSHEET_URL_OR_ID di baris paling atas Code.gs.",
        data: { pengaturan: {}, murid: [], guru: [], jurnal7kaih: [], jurnalMembaca: [] }
      };
    }

    setupDatabaseSheets();
    ss = getTargetSpreadsheet();
    var sPengaturan = findSheetFlexible(ss, ["PENGATURAN", "DATA_PENGATURAN", "SETTINGS"]);
    var sMurid = findSheetFlexible(ss, ["DATA_MURID", "DATA MURID", "DATAMURID", "DATA SISWA", "MURID", "SISWA", "DAFTAR SISWA", "DAFTAR MURID", "PESERTA DIDIK", "DATA PESERTA DIDIK", "Sheet1", "Lembar1"], "murid");
    var sGuru = findSheetFlexible(ss, ["DATA_GURU", "DATA GURU", "DATAGURU", "GURU", "DAFTAR GURU", "DATA PENDIDIK", "Sheet2", "Lembar2"], "guru");
    var sKaih = findSheetFlexible(ss, ["JURNAL_7KAIH", "JURNAL 7 KAIH", "JURNAL 7KAIH", "7KAIH", "JURNAL7KAIH"]);
    var sMembaca = findSheetFlexible(ss, ["JURNAL_MEMBACA", "JURNAL MEMBACA", "MEMBACA", "LITERASI"]);

    return {
      status: "success",
      connected: true,
      spreadsheetName: ss.getName(),
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      timestamp: new Date().toISOString(),
      school: "SDN KAPUK 06 PAGI",
      data: {
        pengaturan: getPengaturanObject(sPengaturan),
        murid: getSheetDataAsObjects(sMurid, "murid"),
        guru: getSheetDataAsObjects(sGuru, "guru"),
        jurnal7kaih: getSheetDataAsObjects(sKaih, "kaih"),
        jurnalMembaca: getSheetDataAsObjects(sMembaca, "membaca")
      }
    };
  } catch (err) {
    return {
      status: "error",
      connected: false,
      message: "Kesalahan membaca Spreadsheet: " + err.toString(),
      data: { pengaturan: {}, murid: [], guru: [], jurnal7kaih: [], jurnalMembaca: [] }
    };
  }
}

function submit7KaihData(item) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) return { status: "error", message: "Spreadsheet belum terhubung. Silakan masukkan link spreadsheet." };

    var sheet = findSheetFlexible(ss, ["JURNAL_7KAIH", "JURNAL 7 KAIH", "JURNAL 7KAIH", "7KAIH", "JURNAL7KAIH"]);
    if (!sheet) {
      setupDatabaseSheets();
      sheet = findSheetFlexible(ss, ["JURNAL_7KAIH", "JURNAL 7 KAIH", "JURNAL 7KAIH", "7KAIH", "JURNAL7KAIH"]);
    }
    if (!sheet) sheet = ss.getSheetByName("JURNAL_7KAIH");

    var id = item.id || ("kaih-" + Utilities.getUuid().slice(0, 8));
    var tanggal = item.tanggal || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    var ibadahText = Array.isArray(item.ibadahChecklist) ? item.ibadahChecklist.join(", ") : (item.ibadahChecklist || "-");
    var makanText = Array.isArray(item.makanSehatHabits) ? item.makanSehatHabits.join(", ") : (item.makanSehatHabits || "-");

    sheet.appendRow([
      id,
      tanggal,
      item.muridId || "m-01",
      item.muridNama || "Murid",
      item.kelas || "Kelas 4A",
      item.jamBangun || "05:00",
      item.bangunPagiChecked ? "YA" : (item.jamBangun ? "YA" : "TIDAK"),
      ibadahText,
      item.olahragaDesc || "-",
      makanText,
      (item.belajarDesc || "-") + " (" + (item.durasiBelajarMenit || 0) + " mnt)",
      item.bantuOrangTuaDesc || "-",
      item.jamTidur || "21:00",
      item.catatanOrangTua || "-",
      item.status || "pending",
      item.feedbackGuru || "-",
      item.rating || 0,
      item.verifiedAt || "-",
      item.verifiedBy || "-"
    ]);

    return { status: "success", message: "Catatan Harian 7 KAIH berhasil disimpan ke Google Sheets!", id: id };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

function submitMembacaData(item) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) return { status: "error", message: "Spreadsheet belum terhubung. Silakan masukkan link spreadsheet." };

    var sheet = findSheetFlexible(ss, ["JURNAL_MEMBACA", "JURNAL MEMBACA", "MEMBACA", "LITERASI"]);
    if (!sheet) {
      setupDatabaseSheets();
      sheet = findSheetFlexible(ss, ["JURNAL_MEMBACA", "JURNAL MEMBACA", "MEMBACA", "LITERASI"]);
    }
    if (!sheet) sheet = ss.getSheetByName("JURNAL_MEMBACA");

    var id = item.id || ("baca-" + Utilities.getUuid().slice(0, 8));
    var tanggal = item.tanggal || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    var halRange = (item.halamanAwal || "1") + " - " + (item.halamanAkhir || "10");

    sheet.appendRow([
      id,
      tanggal,
      item.muridId || "m-01",
      item.muridNama || "Murid",
      item.kelas || "Kelas 4A",
      item.judulBuku || "-",
      item.penulis || "-",
      item.kategori || "Fiksi",
      halRange,
      item.durasiMenit || 15,
      item.ringkasan || "-",
      item.kesan || "-",
      item.status || "pending",
      item.feedbackGuru || "-",
      item.rating || 0,
      item.verifiedAt || "-",
      item.verifiedBy || "-"
    ]);

    return { status: "success", message: "Jurnal Literasi Membaca berhasil dicatat ke Google Sheets!", id: id };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

function verifyJurnalEntry(type, id, feedback, rating, guruNama, statusVal) {
  try {
    var ss = getTargetSpreadsheet();
    if (!ss) return { status: "error", message: "Spreadsheet belum terhubung. Silakan masukkan link spreadsheet." };

    var isMembaca = (type === "membaca");
    var sheet = isMembaca ?
      findSheetFlexible(ss, ["JURNAL_MEMBACA", "JURNAL MEMBACA", "MEMBACA", "LITERASI"]) :
      findSheetFlexible(ss, ["JURNAL_7KAIH", "JURNAL 7 KAIH", "JURNAL 7KAIH", "7KAIH", "JURNAL7KAIH"]);
    var sheetName = isMembaca ? "JURNAL_MEMBACA" : "JURNAL_7KAIH";
    if (!sheet) sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { status: "error", message: "Sheet " + sheetName + " tidak ditemukan." };

    var data = sheet.getDataRange().getValues();
    var idCol = 0; // Kolom A
    var foundRow = -1;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return { status: "error", message: "Data ID " + id + " tidak ditemukan di sheet " + sheetName };
    }

    var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    var finalStatus = statusVal || "verified";
    var finalRating = parseInt(rating || 5);
    var finalFeedback = feedback || "Sangat baik, pertahankan pembiasaan positif ini!";

    if (isMembaca) {
      // JURNAL_MEMBACA (17 Kolom):
      // Col 13: Status, 14: Feedback Guru, 15: Rating, 16: Verified At, 17: Verified By
      sheet.getRange(foundRow, 13).setValue(finalStatus);
      sheet.getRange(foundRow, 14).setValue(finalFeedback);
      sheet.getRange(foundRow, 15).setValue(finalRating);
      sheet.getRange(foundRow, 16).setValue(now);
      sheet.getRange(foundRow, 17).setValue(guruNama || "Wali Kelas");
    } else {
      // JURNAL_7KAIH (19 Kolom):
      // Col 15: Status, 16: Feedback Guru, 17: Rating, 18: Verified At, 19: Verified By
      sheet.getRange(foundRow, 15).setValue(finalStatus);
      sheet.getRange(foundRow, 16).setValue(finalFeedback);
      sheet.getRange(foundRow, 17).setValue(finalRating);
      sheet.getRange(foundRow, 18).setValue(now);
      sheet.getRange(foundRow, 19).setValue(guruNama || "Wali Kelas");
    }

    return { status: "success", message: "Jurnal berhasil diverifikasi dan dinilai!" };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

// =========================================================================
// SETUP & STRUKTUR TABEL GOOGLE SHEETS
// =========================================================================

function setupDatabaseSheets() {
  var ss = getTargetSpreadsheet();
  if (!ss) return;
  
  // 1. Sheet PENGATURAN
  var sheetPengaturan = getOrCreateSheet(ss, "PENGATURAN", ["DATA_PENGATURAN", "SETTINGS", "PENGATURAN SEKOLAH"]);
  if (sheetPengaturan.getLastRow() === 0) {
    sheetPengaturan.appendRow(["Key", "Value"]);
    sheetPengaturan.appendRow(["namaSekolah", "SDN KAPUK 06 PAGI"]);
    sheetPengaturan.appendRow(["npsn", "20105291"]);
    sheetPengaturan.appendRow(["kepalaSekolah", "Emirita Br. Ginting, S.Ag"]);
    sheetPengaturan.appendRow(["nipKepalaSekolah", "197104212003122001"]);
    sheetPengaturan.appendRow(["alamat", "Jl. Kapuk Poglar RT.002/RW.04, Kapuk, Cengkareng, Jakarta Barat"]);
    sheetPengaturan.appendRow(["logoUrl", "https://i.imgur.com/GlCn0x3.png"]);
    sheetPengaturan.appendRow(["posterUrl", "https://i.imgur.com/pJOJiuF.jpeg"]);
    formatHeader(sheetPengaturan);
  }

  // 2. Sheet DATA_MURID
  var sheetMurid = getOrCreateSheet(ss, "DATA_MURID", ["DATA MURID", "DATAMURID", "DATA SISWA", "MURID", "SISWA", "DAFTAR SISWA", "DAFTAR MURID", "PESERTA DIDIK", "DATA PESERTA DIDIK", "Sheet1", "Lembar1"], "murid");
  if (sheetMurid.getLastRow() === 0) {
    sheetMurid.appendRow(["ID", "NISN", "NIS", "Nama Murid", "Kelas", "JK", "Nama Orang Tua", "No HP Orang Tua", "PIN"]);
    formatHeader(sheetMurid);
  }

  // 3. Sheet DATA_GURU
  var sheetGuru = getOrCreateSheet(ss, "DATA_GURU", ["DATA GURU", "DATAGURU", "GURU", "DAFTAR GURU", "DATA PENDIDIK", "Sheet2", "Lembar2"], "guru");
  if (sheetGuru.getLastRow() === 0) {
    sheetGuru.appendRow(["ID", "NIP", "Nama Guru", "Jabatan", "Kelas Ampu", "Email", "No HP", "PIN"]);
    formatHeader(sheetGuru);
  }

  // 4. Sheet JURNAL_7KAIH
  var sheetKaih = getOrCreateSheet(ss, "JURNAL_7KAIH", ["JURNAL 7 KAIH", "JURNAL 7KAIH", "7KAIH", "JURNAL7KAIH"]);
  if (sheetKaih.getLastRow() === 0) {
    sheetKaih.appendRow([
      "ID", "Tanggal", "Murid ID", "Nama Murid", "Kelas", "Jam Bangun", "Bangun Pagi",
      "Ibadah", "Olahraga", "Makan Sehat Habits", "Belajar (Materi & Menit)",
      "Bantu Orang Tua", "Jam Tidur", "Catatan Ortu", "Status", "Feedback Guru", "Rating", "Verified At", "Verified By"
    ]);
    formatHeader(sheetKaih);
  }

  // 5. Sheet JURNAL_MEMBACA
  var sheetMembaca = getOrCreateSheet(ss, "JURNAL_MEMBACA", ["JURNAL MEMBACA", "MEMBACA", "LITERASI"]);
  if (sheetMembaca.getLastRow() === 0) {
    sheetMembaca.appendRow([
      "ID", "Tanggal", "Murid ID", "Nama Murid", "Kelas", "Judul Buku", "Penulis",
      "Kategori", "Hal Awal-Akhir", "Durasi (Menit)", "Ringkasan & Hikmah", "Kesan",
      "Status", "Feedback Guru", "Rating", "Verified At", "Verified By"
    ]);
    formatHeader(sheetMembaca);
  }

  // Pasang validasi dropdown otomatis untuk murid, guru, dan kelas
  applySpreadsheetDropdowns(ss);
}

// =========================================================================
// VALIDASI DATA & DROPDOWN OTOMATIS SPREADSHEET (FALLBACK JIKA VERCEL OFFLINE)
// =========================================================================
function applySpreadsheetDropdowns(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetMurid = ss.getSheetByName("DATA_MURID");
    var sheetGuru = ss.getSheetByName("DATA_GURU");
    var sheetKaih = ss.getSheetByName("JURNAL_7KAIH");
    var sheetMembaca = ss.getSheetByName("JURNAL_MEMBACA");

    var daftarKelas = [
      "Kelas 1A", "Kelas 1B", "Kelas 2A", "Kelas 2B",
      "Kelas 3A", "Kelas 3B", "Kelas 4A", "Kelas 4B",
      "Kelas 5A", "Kelas 5B", "Kelas 6A", "Kelas 6B"
    ];
    var kelasRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(daftarKelas, true)
      .setAllowInvalid(true)
      .build();

    var yaTidakRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["YA", "TIDAK"], true)
      .setAllowInvalid(true)
      .build();

    var statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["pending", "verified"], true)
      .setAllowInvalid(true)
      .build();

    var ratingRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["1", "2", "3", "4", "5"], true)
      .setAllowInvalid(true)
      .build();

    var jkRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["L", "P"], true)
      .setAllowInvalid(true)
      .build();

    var kategoriRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Fiksi", "Non-Fiksi", "Biografi", "Agama", "Cerpen", "Dongeng", "Buku Pelajaran", "Lainnya"], true)
      .setAllowInvalid(true)
      .build();

    var jabatanRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["Kepala Sekolah", "Guru Kelas / Wali Kelas", "Guru Mata Pelajaran", "Guru PAI", "Guru PJOK", "Tenaga Kependidikan"], true)
      .setAllowInvalid(true)
      .build();

    // 1. DATA_MURID (Kelas & JK)
    if (sheetMurid) {
      sheetMurid.getRange("E2:E500").setDataValidation(kelasRule);
      sheetMurid.getRange("F2:F500").setDataValidation(jkRule);
    }

    // 2. DATA_GURU (Jabatan & Kelas Ampu)
    if (sheetGuru) {
      sheetGuru.getRange("D2:D100").setDataValidation(jabatanRule);
      sheetGuru.getRange("E2:E100").setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(daftarKelas.concat(["Semua Kelas"]), true)
          .setAllowInvalid(true)
          .build()
      );
    }

    // 3. JURNAL_7KAIH (Nama Murid dari DATA_MURID, Guru dari DATA_GURU, Kelas, Bangun Pagi, Status, Rating)
    if (sheetKaih) {
      if (sheetMurid) {
        var muridRefRule = SpreadsheetApp.newDataValidation()
          .requireValueInRange(sheetMurid.getRange("D2:D500"), true)
          .setAllowInvalid(true)
          .build();
        sheetKaih.getRange("D2:D1000").setDataValidation(muridRefRule);
      }
      sheetKaih.getRange("E2:E1000").setDataValidation(kelasRule);
      sheetKaih.getRange("G2:G1000").setDataValidation(yaTidakRule);
      sheetKaih.getRange("O2:O1000").setDataValidation(statusRule);
      sheetKaih.getRange("Q2:Q1000").setDataValidation(ratingRule);

      if (sheetGuru) {
        var guruRefRule = SpreadsheetApp.newDataValidation()
          .requireValueInRange(sheetGuru.getRange("C2:C100"), true)
          .setAllowInvalid(true)
          .build();
        sheetKaih.getRange("S2:S1000").setDataValidation(guruRefRule);
      }
    }

    // 4. JURNAL_MEMBACA (Nama Murid dari DATA_MURID, Guru dari DATA_GURU, Kelas, Kategori, Status, Rating)
    if (sheetMembaca) {
      if (sheetMurid) {
        var muridRefRuleB = SpreadsheetApp.newDataValidation()
          .requireValueInRange(sheetMurid.getRange("D2:D500"), true)
          .setAllowInvalid(true)
          .build();
        sheetMembaca.getRange("D2:D1000").setDataValidation(muridRefRuleB);
      }
      sheetMembaca.getRange("E2:E1000").setDataValidation(kelasRule);
      sheetMembaca.getRange("H2:H1000").setDataValidation(kategoriRule);
      sheetMembaca.getRange("M2:M1000").setDataValidation(statusRule);
      sheetMembaca.getRange("O2:O1000").setDataValidation(ratingRule);

      if (sheetGuru) {
        var guruRefRuleB = SpreadsheetApp.newDataValidation()
          .requireValueInRange(sheetGuru.getRange("C2:C100"), true)
          .setAllowInvalid(true)
          .build();
        sheetMembaca.getRange("Q2:Q1000").setDataValidation(guruRefRuleB);
      }
    }
  } catch (err) {
    Logger.log("applySpreadsheetDropdowns error: " + err);
  }
}

function findSheetFlexible(ss, names, contentType) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;
  if (!names) names = [];
  if (!Array.isArray(names)) names = [names];

  var allSheets = ss.getSheets();
  if (!allSheets || allSheets.length === 0) return null;

  // 1. Prioritas TERTINGGI: Cari sheet yang MEMILIKI DATA (> 1 baris) dengan nama cocok persis
  for (var i = 0; i < names.length; i++) {
    var s = ss.getSheetByName(names[i]);
    if (s && s.getLastRow() > 1) return s;
  }

  // 2. Cari sheet yang MEMILIKI DATA (> 1 baris) dengan nama normalisasi cocok
  for (var k = 0; k < names.length; k++) {
    var targetNorm = String(names[k]).toLowerCase().replace(/[^a-z0-9]/g, "");
    for (var j = 0; j < allSheets.length; j++) {
      var sNorm = allSheets[j].getName().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (sNorm === targetNorm && allSheets[j].getLastRow() > 1) {
        return allSheets[j];
      }
    }
  }

  // 3. Cari sheet yang MEMILIKI DATA (> 1 baris) dengan nama mengandung kata kunci
  for (var k2 = 0; k2 < names.length; k2++) {
    var targetNorm2 = String(names[k2]).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (targetNorm2.length < 3) continue;
    for (var j2 = 0; j2 < allSheets.length; j2++) {
      var sNorm2 = allSheets[j2].getName().toLowerCase().replace(/[^a-z0-9]/g, "");
      if ((sNorm2.indexOf(targetNorm2) !== -1 || targetNorm2.indexOf(sNorm2) !== -1) && allSheets[j2].getLastRow() > 1) {
        return allSheets[j2];
      }
    }
  }

  // 4. SMART SCAN ISI: Pindai semua sheet yang punya data (> 1 baris) untuk mencari konten murid / guru
  // Ini menangani jika pengguna menyimpan data di Sheet1, Lembar 1, Rekap Siswa, Daftar Kelas, dll.
  if (contentType === "murid") {
    for (var sIdx = 0; sIdx < allSheets.length; sIdx++) {
      var curSheet = allSheets[sIdx];
      if (curSheet.getLastRow() < 2) continue;
      var curName = curSheet.getName().toLowerCase();
      if (curName.indexOf("jurnal") !== -1 || curName.indexOf("guru") !== -1 || curName.indexOf("pengaturan") !== -1) continue;

      var numR = Math.min(curSheet.getLastRow(), 10);
      var numC = Math.min(curSheet.getLastColumn() || 1, 20);
      var preview = curSheet.getRange(1, 1, numR, numC).getValues();
      for (var rIdx = 0; rIdx < preview.length; rIdx++) {
        var rowStr = (preview[rIdx] || []).join(" ").toLowerCase();
        if (
          rowStr.indexOf("nisn") !== -1 ||
          rowStr.indexOf("peserta didik") !== -1 ||
          rowStr.indexOf("nama murid") !== -1 ||
          rowStr.indexOf("nama siswa") !== -1 ||
          (rowStr.indexOf("nama") !== -1 && (rowStr.indexOf("kelas") !== -1 || rowStr.indexOf("rombel") !== -1 || rowStr.indexOf("nis") !== -1 || rowStr.indexOf("jk") !== -1 || rowStr.indexOf("kelamin") !== -1))
        ) {
          return curSheet;
        }
      }
    }
  }

  if (contentType === "guru") {
    for (var gIdx = 0; gIdx < allSheets.length; gIdx++) {
      var curG = allSheets[gIdx];
      if (curG.getLastRow() < 2) continue;
      var curGName = curG.getName().toLowerCase();
      if (curGName.indexOf("jurnal") !== -1 || curGName.indexOf("murid") !== -1 || curGName.indexOf("siswa") !== -1 || curGName.indexOf("pengaturan") !== -1) continue;

      var numGR = Math.min(curG.getLastRow(), 10);
      var numGC = Math.min(curG.getLastColumn() || 1, 20);
      var previewG = curG.getRange(1, 1, numGR, numGC).getValues();
      for (var rgIdx = 0; rgIdx < previewG.length; rgIdx++) {
        var rowGStr = (previewG[rgIdx] || []).join(" ").toLowerCase();
        if (
          rowGStr.indexOf("nip") !== -1 ||
          rowGStr.indexOf("nuptk") !== -1 ||
          rowGStr.indexOf("nama guru") !== -1 ||
          rowGStr.indexOf("nama pendidik") !== -1 ||
          (rowGStr.indexOf("nama") !== -1 && (rowGStr.indexOf("jabatan") !== -1 || rowGStr.indexOf("wali") !== -1 || rowGStr.indexOf("guru") !== -1 || rowGStr.indexOf("ampu") !== -1))
        ) {
          return curG;
        }
      }
    }
  }

  // 5. Jika ada sheet dengan data > 1 baris dan hanya ada 1 sheet di spreadsheet (untuk murid)
  if (allSheets.length === 1 && allSheets[0].getLastRow() > 1 && contentType === "murid") {
    return allSheets[0];
  }

  // 6. Terakhir: kembalikan sheet dengan nama cocok walaupun masih kosong (0 atau 1 baris)
  for (var iFinal = 0; iFinal < names.length; iFinal++) {
    var sFinal = ss.getSheetByName(names[iFinal]);
    if (sFinal) return sFinal;
  }
  for (var kFinal = 0; kFinal < names.length; kFinal++) {
    var targetNormF = String(names[kFinal]).toLowerCase().replace(/[^a-z0-9]/g, "");
    for (var jF = 0; jF < allSheets.length; jF++) {
      var sNormF = allSheets[jF].getName().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (sNormF === targetNormF) return allSheets[jF];
    }
  }

  return null;
}

function getOrCreateSheet(ss, sheetName, aliases, contentType) {
  var list = [sheetName];
  if (aliases && Array.isArray(aliases)) {
    list = list.concat(aliases);
  }
  var existing = findSheetFlexible(ss, list, contentType);
  if (existing) return existing;
  return ss.insertSheet(sheetName);
}

function formatHeader(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  headerRange.setBackground("#1e3a8a");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function handleGetApi(ss, callback) {
  var sPengaturan = findSheetFlexible(ss, ["PENGATURAN", "DATA_PENGATURAN", "SETTINGS"]);
  var sMurid = findSheetFlexible(ss, ["DATA_MURID", "DATA MURID", "DATAMURID", "DATA SISWA", "MURID", "SISWA", "DAFTAR SISWA", "DAFTAR MURID", "PESERTA DIDIK", "DATA PESERTA DIDIK", "Sheet1", "Lembar1"], "murid");
  var sGuru = findSheetFlexible(ss, ["DATA_GURU", "DATA GURU", "DATAGURU", "GURU", "DAFTAR GURU", "DATA PENDIDIK", "Sheet2", "Lembar2"], "guru");
  var sKaih = findSheetFlexible(ss, ["JURNAL_7KAIH", "JURNAL 7 KAIH", "JURNAL 7KAIH", "7KAIH", "JURNAL7KAIH"]);
  var sMembaca = findSheetFlexible(ss, ["JURNAL_MEMBACA", "JURNAL MEMBACA", "MEMBACA", "LITERASI"]);

  var result = {
    status: "success",
    timestamp: new Date().toISOString(),
    school: "SDN KAPUK 06 PAGI",
    data: {
      pengaturan: getPengaturanObject(sPengaturan),
      murid: getSheetDataAsObjects(sMurid, "murid"),
      guru: getSheetDataAsObjects(sGuru, "guru"),
      jurnal7kaih: getSheetDataAsObjects(sKaih, "kaih"),
      jurnalMembaca: getSheetDataAsObjects(sMembaca, "membaca")
    }
  };
  var outputText = JSON.stringify(result);
  if (callback && String(callback).trim().length > 0) {
    return ContentService.createTextOutput(callback + "(" + outputText + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return responseJSON(result);
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getPengaturanObject(sheet) {
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var obj = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) obj[data[i][0]] = data[i][1];
  }
  return obj;
}

function getSheetDataAsObjects(sheet, contentType) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (!data || data.length <= 1) return [];

  // Keywords untuk mendeteksi baris header kolom sesungguhnya (menghindari kop surat / judul di baris 1-3)
  var headerKeywords = [
    "nama", "name", "siswa", "murid", "guru", "pendidik", "peserta", "nisn", "nip", "nis", "nuptk",
    "kelas", "rombel", "jk", "kelamin", "gender", "ortu", "orang tua", "wali", "hp", "wa", "telepon",
    "pin", "password", "jabatan", "ampu", "judul", "kategori", "durasi", "tanggal", "bangun", "ibadah"
  ];

  var bestHeaderIdx = 0;
  var maxMatches = 0;

  for (var r = 0; r < Math.min(data.length, 12); r++) {
    var row = data[r] || [];
    var matchCount = 0;
    var filledCells = 0;

    for (var c = 0; c < row.length; c++) {
      var cellText = String(row[c] || "").trim().toLowerCase();
      if (!cellText) continue;
      filledCells++;

      // Abaikan jika sel berisi teks panjang seperti kop surat / judul (panjang > 45 karakter)
      if (cellText.length > 45) continue;

      var normCell = cellText.replace(/[^a-z0-9]/g, "");
      for (var k = 0; k < headerKeywords.length; k++) {
        var kw = headerKeywords[k];
        if (normCell === kw || normCell.indexOf(kw) !== -1) {
          matchCount++;
          break;
        }
      }
    }

    // Baris header harus memiliki setidaknya 2 sel berbeda yang cocok dengan kata kunci kolom
    if (matchCount > maxMatches && filledCells >= 2) {
      maxMatches = matchCount;
      bestHeaderIdx = r;
    }
  }

  // Jika tidak ditemukan baris dengan >= 2 kecocokan, cek baris dengan kata kunci kuat
  if (maxMatches < 2) {
    for (var r2 = 0; r2 < Math.min(data.length, 6); r2++) {
      var rowStr2 = (data[r2] || []).join(" ").toLowerCase();
      if (
        rowStr2.indexOf("nisn") !== -1 ||
        rowStr2.indexOf("nip") !== -1 ||
        rowStr2.indexOf("nama murid") !== -1 ||
        rowStr2.indexOf("nama guru") !== -1 ||
        rowStr2.indexOf("nama siswa") !== -1
      ) {
        bestHeaderIdx = r2;
        break;
      }
    }
  }

  var rawHeaders = data[bestHeaderIdx] || [];
  var headers = [];
  for (var h = 0; h < rawHeaders.length; h++) {
    headers.push(String(rawHeaders[h] || "").trim());
  }

  var rows = [];
  for (var i = bestHeaderIdx + 1; i < data.length; i++) {
    var rowVals = data[i] || [];
    var hasValue = false;
    for (var colCheck = 0; colCheck < rowVals.length; colCheck++) {
      if (rowVals[colCheck] !== null && String(rowVals[colCheck]).trim() !== "") {
        hasValue = true;
        break;
      }
    }
    if (!hasValue) continue;

    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var hName = headers[j];
      var cellVal = rowVals[j];
      if (hName) {
        obj[hName] = cellVal;
      }

      var hNorm = String(hName || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      // 1. Pemetaan Kolom Nama Murid / Siswa
      if (
        (hNorm.indexOf("nama") !== -1 || hNorm === "siswa" || hNorm === "murid" || hNorm === "pesertadidik" || hNorm === "student") &&
        hNorm.indexOf("ortu") === -1 &&
        hNorm.indexOf("orangtua") === -1 &&
        hNorm.indexOf("ayah") === -1 &&
        hNorm.indexOf("ibu") === -1 &&
        hNorm.indexOf("wali") === -1 &&
        hNorm.indexOf("guru") === -1
      ) {
        obj["Nama Murid"] = cellVal;
        obj["Nama Siswa"] = cellVal;
        obj["Nama Lengkap"] = cellVal;
        obj["Nama"] = cellVal;
        obj["nama"] = cellVal;
      }

      // 2. Pemetaan Kolom Nama Guru / Pendidik
      if (
        (hNorm.indexOf("nama") !== -1 || hNorm === "guru" || hNorm === "pendidik" || hNorm === "pengajar" || hNorm === "teacher") &&
        (hNorm.indexOf("guru") !== -1 || hNorm.indexOf("pendidik") !== -1 || contentType === "guru") &&
        hNorm.indexOf("ortu") === -1 &&
        hNorm.indexOf("siswa") === -1 &&
        hNorm.indexOf("murid") === -1
      ) {
        obj["Nama Guru"] = cellVal;
        obj["Nama Pendidik"] = cellVal;
        obj["Nama Lengkap"] = cellVal;
        obj["Nama"] = cellVal;
        obj["nama"] = cellVal;
      }

      // 3. Kelas & Rombel (Normalisasi cerdas: 4A, IV A, Kelas 4A)
      if (hNorm === "kelas" || hNorm === "rombel" || hNorm === "tingkat" || hNorm === "kelasmurid") {
        var strKelas = String(cellVal || "").trim();
        var cleanK = strKelas.replace(/^kelas\s*/i, "").trim().toUpperCase();
        // Konversi romawi jika ada: IV A -> 4A, VI B -> 6B
        cleanK = cleanK.replace(/^I\s*([A-Z])?$/i, "1$1")
                       .replace(/^II\s*([A-Z])?$/i, "2$1")
                       .replace(/^III\s*([A-Z])?$/i, "3$1")
                       .replace(/^IV\s*([A-Z])?$/i, "4$1")
                       .replace(/^V\s*([A-Z])?$/i, "5$1")
                       .replace(/^VI\s*([A-Z])?$/i, "6$1");
        var canonKelas = (cleanK && cleanK.length <= 3 && /^[1-6][A-Z]$/.test(cleanK)) ? ("Kelas " + cleanK) : strKelas;
        obj["Kelas"] = canonKelas;
        obj["kelas"] = canonKelas;
        obj["rawKelas"] = strKelas;
      }

      if (hNorm.indexOf("nisn") !== -1) {
        obj["NISN"] = String(cellVal || "").replace(/[^0-9]/g, "");
        obj["nisn"] = obj["NISN"];
      }

      if (hNorm.indexOf("nis") !== -1 && hNorm.indexOf("nisn") === -1) {
        obj["NIS"] = String(cellVal || "").replace(/[^0-9]/g, "");
        obj["nis"] = obj["NIS"];
      }

      if (hNorm === "jk" || hNorm === "jeniskelamin" || hNorm === "lp" || hNorm === "gender") {
        var strJk = String(cellVal || "").trim().toUpperCase();
        var canonJk = (strJk.startsWith("P") || strJk === "WANITA" || strJk === "PEREMPUAN") ? "P" : "L";
        obj["JK"] = canonJk;
        obj["jenisKelamin"] = canonJk;
      }

      if (hNorm.indexOf("nip") !== -1 || hNorm.indexOf("nuptk") !== -1) {
        obj["NIP"] = String(cellVal || "").trim();
        obj["nip"] = obj["NIP"];
      }

      if (hNorm.indexOf("jabatan") !== -1 || hNorm === "role" || hNorm === "posisi") {
        obj["Jabatan"] = String(cellVal || "").trim();
        obj["jabatan"] = obj["Jabatan"];
      }

      if (hNorm.indexOf("ampu") !== -1 || hNorm === "walikelas") {
        var strAmpu = String(cellVal || "").trim();
        var cleanA = strAmpu.replace(/^kelas\s*/i, "").trim().toUpperCase();
        var canonAmpu = (cleanA && cleanA.length <= 3 && /^[1-6][A-Z]$/.test(cleanA)) ? ("Kelas " + cleanA) : strAmpu;
        obj["Kelas Ampu"] = canonAmpu;
        obj["kelasAmpu"] = canonAmpu;
      }

      if (hNorm.indexOf("hp") !== -1 || hNorm.indexOf("wa") !== -1 || hNorm.indexOf("telepon") !== -1) {
        obj["No HP Orang Tua"] = cellVal;
        obj["No HP"] = cellVal;
        obj["noHp"] = cellVal;
      }

      if (hNorm === "pin" || hNorm === "password") {
        obj["PIN"] = String(cellVal || "").trim();
        obj["pin"] = obj["PIN"];
      }

      if (hNorm === "id") {
        obj["ID"] = String(cellVal || "").trim();
        obj["id"] = obj["ID"];
      }
    }

    // =========================================================================
    // SMART VALUE RECOVERY (JIKA NAMA MURID / NAMA GURU MASIH KOSONG!)
    // Pindai semua sel di baris ini untuk menemukan teks nama orang!
    // =========================================================================
    if (contentType === "murid" && (!obj["Nama Murid"] || String(obj["Nama Murid"]).trim() === "")) {
      for (var colIdx = 0; colIdx < rowVals.length; colIdx++) {
        var val = String(rowVals[colIdx] || "").trim();
        // Ciri-ciri nama murid: panjang 3-50 huruf, tidak ada angka, bukan status L/P, bukan tanggal
        if (
          val.length >= 3 &&
          val.length <= 50 &&
          !/^[0-9]+$/.test(val) &&
          !/^[1-6][A-Z]$/i.test(val) &&
          !/^kelas\s*/i.test(val) &&
          val !== "L" && val !== "P" && val !== "Laki-laki" && val !== "Perempuan" &&
          !val.includes("/") && !val.includes("-") &&
          /^[a-zA-Z\s.,']+$/.test(val)
        ) {
          obj["Nama Murid"] = val;
          obj["Nama Siswa"] = val;
          obj["Nama Lengkap"] = val;
          obj["nama"] = val;
          break;
        }
      }
    }

    if (contentType === "guru" && (!obj["Nama Guru"] || String(obj["Nama Guru"]).trim() === "")) {
      for (var colGIdx = 0; colGIdx < rowVals.length; colGIdx++) {
        var gVal = String(rowVals[colGIdx] || "").trim();
        if (
          gVal.length >= 3 &&
          gVal.length <= 60 &&
          !/^[0-9]+$/.test(gVal) &&
          !gVal.includes("@") &&
          /^[a-zA-Z\s.,']+$/.test(gVal)
        ) {
          obj["Nama Guru"] = gVal;
          obj["Nama Pendidik"] = gVal;
          obj["nama"] = gVal;
          break;
        }
      }
    }

    rows.push(obj);
  }

  return rows;
}

function syncMuridSheet(sheet, list) {
  sheet.clearContents();
  sheet.appendRow(["ID", "NISN", "NIS", "Nama Murid", "Kelas", "JK", "Nama Orang Tua", "No HP Orang Tua", "PIN"]);
  formatHeader(sheet);
  list.forEach(function(m) {
    sheet.appendRow([m.id, m.nisn, m.nis, m.nama, m.kelas, m.jenisKelamin, m.namaOrangTua, m.noHpOraangTua, m.pin]);
  });
  applySpreadsheetDropdowns(sheet.getParent());
}

function syncGuruSheet(sheet, list) {
  sheet.clearContents();
  sheet.appendRow(["ID", "NIP", "Nama Guru", "Jabatan", "Kelas Ampu", "Email", "No HP", "PIN"]);
  formatHeader(sheet);
  list.forEach(function(g) {
    sheet.appendRow([g.id, g.nip, g.nama, g.jabatan, g.kelasAmpu, g.email, g.noHp, g.pin]);
  });
  applySpreadsheetDropdowns(sheet.getParent());
}

function sync7KaihSheet(sheet, list) {
  sheet.clearContents();
  sheet.appendRow([
    "ID", "Tanggal", "Murid ID", "Nama Murid", "Kelas", "Jam Bangun", "Bangun Pagi",
    "Ibadah", "Olahraga", "Makan Sehat Habits", "Belajar",
    "Bantu Orang Tua", "Jam Tidur", "Catatan Ortu", "Status", "Feedback Guru", "Rating", "Verified At", "Verified By"
  ]);
  formatHeader(sheet);
  list.forEach(function(k) {
    sheet.appendRow([
      k.id, k.tanggal, k.muridId, k.muridNama, k.kelas, k.jamBangun,
      k.bangunPagiChecked ? "YA" : "TIDAK",
      (k.ibadahChecklist || []).join(", "),
      k.olahragaDesc || "-",
      (k.makanSehatHabits || []).join(", "),
      (k.belajarDesc || "") + " (" + (k.durasiBelajarMenit || 0) + " mnt)",
      k.bantuOrangTuaDesc || "-",
      k.jamTidur || "-",
      k.catatanOrangTua || "-",
      k.status || "pending",
      k.feedbackGuru || "-",
      k.rating || 0,
      k.verifiedAt || "-",
      k.verifiedBy || "-"
    ]);
  });
  applySpreadsheetDropdowns(sheet.getParent());
}

function syncMembacaSheet(sheet, list) {
  sheet.clearContents();
  sheet.appendRow([
    "ID", "Tanggal", "Murid ID", "Nama Murid", "Kelas", "Judul Buku", "Penulis",
    "Kategori", "Hal Awal-Akhir", "Durasi (Menit)", "Ringkasan & Hikmah", "Kesan",
    "Status", "Feedback Guru", "Rating", "Verified At", "Verified By"
  ]);
  formatHeader(sheet);
  list.forEach(function(m) {
    sheet.appendRow([
      m.id, m.tanggal, m.muridId, m.muridNama, m.kelas, m.judulBuku, m.penulis,
      m.kategori, m.halamanAwal + "-" + m.halamanAkhir, m.durasiMenit,
      m.ringkasan, m.kesan, m.status || "pending",
      m.feedbackGuru || "-", m.rating || 0, m.verifiedAt || "-", m.verifiedBy || "-"
    ]);
  });
  applySpreadsheetDropdowns(sheet.getParent());
}

// Built-in Web App HTML jika pengguna tidak membuat file Index terpisah
function getBuiltinWebHtml() {
  return ${JSON.stringify(generateAppsScriptHtml(spreadsheetName))};
}
`;
};

