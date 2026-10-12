/* ══════════════════════════════════════════════════════════════
   DATA LIVE — RINGKASAN STATISTIK OPERASIONAL
   ------------------------------------------------------------
   Berisi pembacaan yang dipakai blok "Ringkasan Statistik
   Operasional" (kartu pagu/realisasi, dan tabel
   "Pagu & Realisasi <Bulan> <Tahun>"):

     1. jumlah berkas di folder SPJ & folder DIPA  → Google Drive
     2. rata-rata kelengkapan berkas per bidang    → Google Sheets (GVIZ)
     3. nominal SP2D per bulan (pagu/realisasi/SPM)→ tab SP2D Sheet (GVIZ)
     4. jumlah berkas SP2D per bulan              → Google Drive

   Modul ini dipakai DUA tampilan sekaligus — Dashboard (admin) dan
   halaman ringkasan tamu (src/components/StatistikOperasional.js) —
   supaya angka di keduanya dijamin sama. Karena itu hasilnya
   disimpan di toko data bersama dengan TTL pendek, bukan diambil
   ulang oleh tiap halaman.                                        */

import {
  SP2D_SHEET_TAB,
  SP2D_SHEET_KOLOM,
  SP2D_FOLDER_ID,
  PETA_BULAN_SP2D,
} from "./masterData";
import { API_KEY, sheetIdAktif } from "./rekapKegiatan";

const SPJ_FOLDER_ID = "1gZkmFPnVyWO5fqWLsHGAv_eu56WOdt_8";
const DIPA_FOLDER_ID = "1A1KD9grE5z-ldfSfxFORuh4NILc5sIuN";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/* ── Parser angka Indonesia ("2.650.030.873" / "2.650.030.873,50") ── */
export function toAngka(v) {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const mentah = String(v ?? "").trim();
  if (!mentah || /^[-—–]$/.test(mentah)) return 0;
  const bersih = mentah.replace(/[^\d,.-]/g, "");
  const koma = bersih.includes(",");
  const titik = bersih.includes(".");
  let normal = bersih;
  if (koma && titik) normal = bersih.replace(/\./g, "").replace(",", ".");
  else if (koma) normal = bersih.replace(",", ".");
  else if (titik && /^\d{1,3}(\.\d{3})+$/.test(bersih)) normal = bersih.replace(/\./g, "");
  const hasil = parseFloat(normal);
  return isFinite(hasil) ? hasil : 0;
}

/* ── Nama berkas/folder → id bulan ("AGST.pdf" → "agustus") ── */
export function bulanDariNama(nama) {
  const n = String(nama || "").toLowerCase();
  for (const [id, kuncis] of Object.entries(PETA_BULAN_SP2D)) {
    for (const kunci of kuncis) {
      const pola = new RegExp(`(^|[^a-z])${kunci}([^a-z]|$)`, "i");
      if (pola.test(n)) return id;
    }
  }
  return null;
}

/* ── Ambil seluruh anak folder di Google Drive (paginasi) ── */
async function listAnakDrive(folderId, apiKey = API_KEY) {
  const hasil = [];
  let pageToken = null;
  let guard = 0;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime)",
      pageSize: "200",
      key: apiKey,
      _t: String(Date.now()),
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    hasil.push(...(data.files || []));
    pageToken = data.nextPageToken || null;
    guard += 1;
  } while (pageToken && guard < 20);
  return hasil;
}

/* ── Jumlah anak (berkas/folder) langsung di dalam sebuah folder ── */
async function hitungAnakFolder(folderId) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,mimeType)&pageSize=1000&key=${API_KEY}&_t=${Date.now()}`,
      { cache: "no-store", headers: { Pragma: "no-cache" } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    return data.files && Array.isArray(data.files) ? data.files.length : 0;
  } catch (e) {
    console.warn("Drive count error:", e);
    return 0;
  }
}

/* ── Jumlah berkas SP2D per bulan, langsung dari Drive ──
   Berkas di folder utama dihitung; bila ada subfolder per bulan,
   isi subfolder tersebut ikut dihitung satu tingkat.            */
async function hitungBerkasSp2dPerBulan(folderId, apiKey) {
  if (!folderId) return null;
  const perBulan = {};
  const tambah = (bulan, n = 1) => {
    if (!bulan) return;
    perBulan[bulan] = (perBulan[bulan] || 0) + n;
  };

  const anak = await listAnakDrive(folderId, apiKey);
  for (const item of anak) {
    if (item.mimeType === FOLDER_MIME) {
      const bulan = bulanDariNama(item.name);
      const isi = await listAnakDrive(item.id, apiKey);
      tambah(bulan, isi.filter((f) => f.mimeType !== FOLDER_MIME).length);
    } else {
      tambah(bulanDariNama(item.name), 1);
    }
  }
  return perBulan;
}

/* ── Pembaca spreadsheet (Google Visualization API / GVIZ) ───
   CORS-friendly & tanpa login, jadi bisa dipanggil langsung dari
   browser.                                                    */
async function gviz(sheetId, tab) {
  const params = new URLSearchParams({
    tqx: "out:json",
    headers: "1",
    sheet: tab,
    t: String(Date.now()),
  });
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const teks = await res.text();
  const awal = teks.indexOf("{");
  const akhir = teks.lastIndexOf("}");
  if (awal === -1 || akhir === -1) return null;
  try {
    return JSON.parse(teks.slice(awal, akhir + 1));
  } catch (e) {
    return null;
  }
}

/* ── Nominal SP2D per bulan dari tab spreadsheet (GVIZ) ──
   Tab: SP2D_SHEET_TAB · Kolom: Bulan | Pagu | Realisasi | Jumlah SPM */
async function ambilNominalSp2d(sheetId, tab) {
  const data = await gviz(sheetId, tab);
  const tabel = data && data.table;
  const kolom = tabel && tabel.cols;
  const baris = tabel && tabel.rows;
  if (!Array.isArray(kolom) || !Array.isArray(baris)) return null;

  // Petakan indeks kolom berdasarkan nama kolom (label pada header).
  const idx = {};
  kolom.forEach((c, i) => {
    const label = String((c && (c.label || c.id)) || "")
      .trim()
      .toUpperCase();
    if (!label) return;
    if (!idx.bulan && label.includes(SP2D_SHEET_KOLOM.bulan.toUpperCase())) idx.bulan = i;
    if (idx.pagu === undefined && label.includes(SP2D_SHEET_KOLOM.pagu.toUpperCase())) idx.pagu = i;
    if (idx.realisasi === undefined && label.includes(SP2D_SHEET_KOLOM.realisasi.toUpperCase())) idx.realisasi = i;
    if (idx.jumlahSpm === undefined && label.includes("SPM")) idx.jumlahSpm = i;
  });

  const perBulan = {};
  baris.forEach((r) => {
    const sel = (r && r.c) || [];
    const nilai = (i) => (i === undefined ? null : sel[i] ? sel[i].v : null);

    const bulan = bulanDariNama(nilai(idx.bulan));
    if (!bulan) return;

    perBulan[bulan] = {
      pagu: idx.pagu === undefined ? 0 : toAngka(nilai(idx.pagu)),
      realisasi: idx.realisasi === undefined ? 0 : toAngka(nilai(idx.realisasi)),
      jumlahSpm: idx.jumlahSpm === undefined ? null : toAngka(nilai(idx.jumlahSpm)),
    };
  });

  return Object.keys(perBulan).length ? perBulan : null;
}

/* ── Rata-rata kelengkapan berkas per bidang kerja ──────────
   Nama bidang & persentase diambil secara dinamis dari baris
   spreadsheet, supaya tetap benar walau tabelnya berubah.     */
async function bacaKelengkapanPerBidang(sheetId) {
  const hasil = { persen: "0%", jumlah: 0, daftar: [] };
  try {
    const data = await gviz(sheetId);
    const baris = (data && data.table && data.table.rows) || [];
    if (!Array.isArray(baris)) return hasil;

    const valid = [];
    baris.forEach((row) => {
      const cells = (row && row.c) || [];
      if (!Array.isArray(cells)) return;

      const namaSel = cells.find(
        (c) =>
          c &&
          typeof c.v === "string" &&
          c.v.trim().length > 0 &&
          !c.v.toLowerCase().includes("resume") &&
          !c.v.toLowerCase().includes("status verifikasi") &&
          c.v.toUpperCase() !== "BIDANG"
      );
      if (!namaSel) return;

      let persen = null;
      for (let i = cells.length - 1; i >= 0; i--) {
        const cell = cells[i];
        if (!cell) continue;
        if (cell.f && cell.f.includes("%")) {
          const m = cell.f.match(/([0-9]+(?:[.,][0-9]+)?)\s*%/);
          if (m) {
            persen = parseFloat(m[1].replace(",", "."));
            break;
          }
        }
        if (typeof cell.v === "number" && cell.v > 0 && cell.v <= 1) {
          persen = cell.v * 100;
          break;
        }
        if (typeof cell.v === "number" && cell.v > 1 && cell.v <= 100) {
          persen = cell.v;
          break;
        }
      }

      if (persen !== null && !isNaN(persen)) {
        valid.push({ name: namaSel.v.trim(), percent: persen });
      }
    });

    if (valid.length > 0) {
      const total = valid.reduce((acc, c) => acc + c.percent, 0);
      hasil.persen = `${(total / valid.length).toFixed(1)}%`;
      hasil.jumlah = valid.length;
      hasil.daftar = valid.map((b) => b.name);
    }
  } catch (e) {
    console.warn("Spreadsheet GVIZ stats fetch error:", e);
  }
  return hasil;
}

/* ══════════════════════════════════════════════════════════════
   PEMBACAAN SATU KALI → SEMUA PENGAMBIL
   ------------------------------------------------------------
   Mengembalikan:
     {
       sp2d: { nominal, berkas, statusNominal, statusBerkas },
       induk: { totalArsip, totalDipa, persenVerifikasi, totalBidang,
               bidangList, lastSync, updatedAt }
     }                                                          */
export async function muatRingkasanLive() {
  const sheetId = sheetIdAktif();
  const waktu = Date.now();

  // 1 & 2 — jumlah berkas di folder SPJ dan folder DIPA.
  const [totalArsip, totalDipa] = await Promise.all([
    hitungAnakFolder(SPJ_FOLDER_ID),
    hitungAnakFolder(DIPA_FOLDER_ID),
  ]);

  // 3 — rata-rata kelengkapan per bidang (GVIZ).
  const kelengkapan = await bacaKelengkapanPerBidang(sheetId);

  // 4 — nominal SP2D per bulan (GVIZ, tab SP2D).
  let nominal = null;
  let statusNominal = "menunggu";
  try {
    nominal = await ambilNominalSp2d(sheetId, SP2D_SHEET_TAB);
    statusNominal = nominal ? "live" : "kosong";
  } catch (e) {
    console.warn("SP2D nominal fetch error:", e);
    statusNominal = "gagal";
  }

  // 5 — jumlah berkas SP2D per bulan (Drive). Folder SP2D belum
  //     diisi di masterData → dilewati, bukan diambil sebagai 0.
  let berkas = null;
  let statusBerkas = SP2D_FOLDER_ID ? "menunggu" : "belum-diatur";
  if (SP2D_FOLDER_ID) {
    try {
      berkas = await hitungBerkasSp2dPerBulan(SP2D_FOLDER_ID, API_KEY);
      statusBerkas = berkas ? "live" : "kosong";
    } catch (e) {
      console.warn("SP2D berkas fetch error:", e);
      statusBerkas = "gagal";
    }
  }

  return {
    sp2d: { nominal, berkas, statusNominal, statusBerkas },
    induk: {
      totalArsip,
      totalDipa,
      persenVerifikasi: kelengkapan.persen,
      totalBidang: kelengkapan.jumlah,
      bidangList: kelengkapan.daftar,
      lastSync: new Date(waktu).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      updatedAt: waktu,
    },
  };
}

/* ══════════════════════════════════════════════════════════════
   TOKO DATA BERSAMA (cache + langganan)
   ------------------------------------------------------------
   TTL pendek (5 detik) karena blok ini menampilkan angka "live"
   dan(admin) menyegarnya tiap beberapa detik — sehingga permintaan
   ke Drive/Sheets tetap satu per siklus, bukan satu per halaman. */
const TTL_MS = 5_000;
let cache = null;
let sedang = null;
const pendengar = new Set();

function siarkan(data) {
  pendengar.forEach((fn) => {
    try {
      fn(data);
    } catch (e) {
      /* abaikan */
    }
  });
}

export function dengarRingkasanLive(fn) {
  pendengar.add(fn);
  if (cache) {
    try {
      fn(cache.data);
    } catch (e) {
      /* abaikan */
    }
  }
  return () => pendengar.delete(fn);
}

export function ambilRingkasanLive(paksa = false) {
  const segar = cache && Date.now() - cache.waktu < TTL_MS;
  if (segar && !paksa) return Promise.resolve(cache.data);
  if (sedang) return sedang;

  sedang = muatRingkasanLive()
    .then((data) => {
      cache = { data, waktu: Date.now() };
      sedang = null;
      siarkan(data);
      return data;
    })
    .catch((e) => {
      console.warn("Gagal membaca ringkasan live:", e);
      sedang = null;
      // Cache lama tidak dikosongkan — data terakhir masih berguna.
      return cache ? cache.data : null;
    });
  return sedang;
}

export { SPJ_FOLDER_ID, DIPA_FOLDER_ID };