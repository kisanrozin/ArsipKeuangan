/* ══════════════════════════════════════════════════════════════
   REVISI DIPA — SUMBER LIVE (GOOGLE DRIVE)
   ------------------------------------------------------------
   Kolom "Pagu DIPA Revisi (Rp)" pada blok "Realisasi Data Per
   Bulan" memakai modul ini, supaya isinya benar-benar mengikuti
   dokumen yang ada di Drive dan tidak menampilkan pagu untuk bulan
   yang datanya belum tersedia.

   PEMBAGIAN TUGAS:
     • Google Drive (folder DIPA & POK) → daftar revisi yang benar-
       benar ada beserta TANGGAL penetrationnya, diambil dari nama
       berkas di dalam folder, mis. "DIPA 13 (10 SEPT 2026).pdf".
     • Nominal pagu → dibaca otomatis dari berkas PDF "Surat
       Pengesahan Daftar Isian Pelaksanaan Anggaran Petikan" di
       folder Drive lewat src/data/paguPdf.js untuk SEMUA DIPA
       (Awal & Revisi 1–13); HISTORI_REVISI_DIPA hanya jadi cadangan
       bila PDF gagal dibaca.

   ATURAN TAMPIL: sebuah revisi hanya dipakai bila nominal pagu-nya
   benar-benar diketahui. Bila revisi yang berlaku sudah ada di Drive
   tetapi nominalnya belum diisi, bulan tersebut ditampilkan kosong
   — bukan dipaksa memakai pagu revisi lama yang sudah tidak berlaku.
   ══════════════════════════════════════════════════════════════ */

import {
  HISTORI_REVISI_DIPA,
  BULAN_ANGGARAN_OPTIONS,
  TAHUN_ANGGARAN_AKTIF,
} from "./masterData";
import { bacaPaguDariPdf } from "./paguPdf";

/* ── Konstanta integrasi (sama dengan JenisDokumen / HistoriRevisiDipa) */
export const DIPA_FOLDER_ID = "1A1KD9grE5z-ldfSfxFORuh4NILc5sIuN";
export const API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/* Nama bulan untuk memformat tanggal Indonesia */
const NAMA_BULAN = BULAN_ANGGARAN_OPTIONS.map((b) => b.label);

/* Alias nama bulan (Indonesia + Inggris) → indeks 1…12 */
const PETA_BULAN = {
  jan: 1, january: 1, januari: 1,
  feb: 2, february: 2, februari: 2, peb: 2,
  mar: 3, march: 3, maret: 3, mac: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, june: 6, juni: 6,
  jul: 7, july: 7, juli: 7,
  agu: 8, ags: 8, agustus: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, october: 10, oktober: 10,
  nov: 11, nopember: 11, november: 11,
  des: 12, desember: 12, december: 12,
};

/* ── Nomor revisi dari nama folder ──────────────────────────────
   "DIPA AWAL TA 2026"          → 0
   "DIPA REVISI 7 2026"         → 7
   "DIPA REVISI KE 12 TA 2026"  → 12
   "REVISI POK 2026"            → null (diabaikan)              */
export function nomorRevisi(namaFolder) {
  const nama = String(namaFolder || "").toUpperCase();
  if (/AWAL/.test(nama)) return 0;
  const cocok = nama.match(/REVISI\s*(?:KE)?\s*(\d{1,2})/);
  return cocok ? Number(cocok[1]) : null;
}

export function labelDipa(nomor) {
  return nomor === 0 ? "DIPA Awal" : `DIPA Revisi ${nomor}`;
}

/* ── Tanggal penetapan dari nama berkas ──────────────────────────
   "(5 Jan 2026)" · "(31 JULI 2026)" · "(10 SEPT 2026)"         */
export function tanggalDariNama(namaBerkas) {
  const teks = String(namaBerkas || "").replace(/\.[^/.]+$/, "");
  const pola = /(\d{1,2})\s*[- ]\s*([A-Za-z]+)\s*[- ]\s*(\d{4})/g;
  let hasil = null;
  let cocok;
  while ((cocok = pola.exec(teks)) !== null) {
    const bulan = PETA_BULAN[cocok[2].toLowerCase()];
    if (bulan) {
      hasil = `${Number(cocok[1])} ${NAMA_BULAN[bulan - 1]} ${cocok[3]}`;
      break;
    }
  }
  return hasil;
}

/* "8 Juli 2026" → timestamp (NaN bila format tak dikenali) */
function waktuDariTanggal(tanggal) {
  const parts = String(tanggal || "").trim().split(/\s+/);
  if (parts.length < 3) return NaN;
  const hari = parseInt(parts[0], 10);
  const idxBulan = NAMA_BULAN.findIndex(
    (b) => b.toLowerCase() === String(parts[1]).toLowerCase()
  );
  const tahun = parseInt(parts[2], 10);
  if (!hari || idxBulan < 0 || !tahun) return NaN;
  return new Date(tahun, idxBulan, hari).getTime();
}

/* "15.889.706.000" → 15889706000 */
function paguKeAngka(pagu) {
  return Number(String(pagu ?? "").replace(/[^\d]/g, "")) || 0;
}

/* ── Baris revisi cadangan dari masterData ──────────────────────
   Dipakai bila bacaan Drive belum tersedia, supaya pagu bulan
   tetap tampil walau Drive sedang lambat / gagal dibuka.        */
function barisDariMaster() {
  return HISTORI_REVISI_DIPA.map((row) => {
    const cocok = String(row.dipa || "").match(/^DIPA\s+REVISI\s*(\d{1,2})/i);
    return {
      nomor: cocok ? Number(cocok[1]) : 0,
      dipa: row.dipa,
      tanggal: row.tanggal || null,
      pagu: paguKeAngka(row.pagu),
      jumlahBerkas: 0,
    };
  });
}

/* ── Akses Google Drive API ──────────────────────────────────── */
async function listAnakDrive(folderId) {
  const hasil = [];
  let pageToken = null;
  let guard = 0;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,modifiedTime)",
      pageSize: "200",
      key: API_KEY,
      t: String(Date.now()),
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    hasil.push(...(json.files || []));
    pageToken = json.nextPageToken || null;
    guard += 1;
  } while (pageToken && guard < 20);
  return hasil;
}

/* ── Daftar revisi: gabungkan Drive (tanggal) + masterData (pagu) ── */
export async function muatRevisiDipa() {
  /* Nominal pagu dari masterData, dikunci per nomor revisi. */
  const master = new Map();
  HISTORI_REVISI_DIPA.forEach((row) => {
    const cocok = String(row.dipa || "").match(/^DIPA\s+REVISI\s*(\d{1,2})/i);
    master.set(cocok ? Number(cocok[1]) : 0, row);
  });

  const isi = await listAnakDrive(DIPA_FOLDER_ID);
  const folders = isi
    .filter((f) => f.mimeType === FOLDER_MIME)
    .map((f) => ({ id: f.id, nama: f.name, nomor: nomorRevisi(f.name) }))
    .filter((f) => f.nomor !== null)
    .sort((a, b) => a.nomor - b.nomor);

  // Proses tiap folder secara paralel supaya pembacaan berkas PDF
  // (DIPA Awal & Revisi 1–13) tidak saling menunggu.
  const rows = await Promise.all(
    folders.map(async (folder) => {
      let tanggal = null;
      let jumlahBerkas = 0;
      let berkas = [];
      try {
        const isiFolder = await listAnakDrive(folder.id);
        berkas = isiFolder.filter((f) => f.mimeType !== FOLDER_MIME);
        jumlahBerkas = berkas.length;
        // Tanggal diambil dari berkas DIPA; bila tidak ada, dari
        // berkas lain di folder yang namanya memuat tanggal
        // (mis. "RKKS 8 (6 Mei 2026).pdf").
        const kandidat = [
          berkas.find((f) => /^DIPA\b/i.test(f.name)),
          ...berkas,
        ];
        for (const f of kandidat) {
          const tgl = f ? tanggalDariNama(f.name) : null;
          if (tgl) {
            tanggal = tgl;
            break;
          }
        }
      } catch (e) {
        console.warn(`Gagal membaca folder "${folder.nama}":`, e);
      }

      const ref = master.get(folder.nomor) || null;
      let pagu = ref ? paguKeAngka(ref.pagu) : 0;
      let digitalStamp = (ref && ref.digitalStamp) || null;

      // Nominal pagu SEMUA DIPA (Awal & Revisi 1–13) dibaca dari berkas
      // PDF "Surat Pengesahan Daftar Isian Pelaksanaan Anggaran Petikan"
      // di folder Drive; masterData hanya cadangan bila PDF gagal dibaca.
      const dipaBerkas = berkas.find(
        (f) => /^DIPA\b/i.test(f.name) && /pdf/i.test(f.mimeType)
      );
      if (dipaBerkas) {
        try {
          const pdf = await bacaPaguDariPdf(
            dipaBerkas.id,
            dipaBerkas.modifiedTime
          );
          if (pdf) {
            if (pdf.pagu) pagu = paguKeAngka(pdf.pagu);
            if (pdf.digitalStamp) digitalStamp = pdf.digitalStamp;
          }
        } catch (e) {
          console.warn(`Gagal membaca pagu dari PDF "${dipaBerkas.name}":`, e);
        }
      }

      return {
        nomor: folder.nomor,
        nama: folder.nama,
        // Tanggal Drive lebih baru daripada masterData, jadi dipakai dulu.
        tanggal: tanggal || (ref && ref.tanggal) || null,
        tanggalDrive: tanggal,
        pagu,
        digitalStamp,
        jumlahBerkas,
      };
    })
  );

  return { status: "live", rows, updatedAt: Date.now() };
}

/* ── Revisi DIPA yang berlaku pada akhir bulan ───────────────────
   Sumber baris revisi: hasil bacaan folder DIPA di Google Drive,
   dengan HISTORI_REVISI_DIPA sebagai cadangan bila Drive belum
   terbaca.

   Mengembalikan pagu kosong (tidak ikut dihitung) untuk bulan
   yang revisi berjalannya belum punya nominal pagu — memakai pagu
   revisi lama akan menampilkan angka yang sudah tidak berlaku.
   `bulanTerakhirData` = bulan terakhir yang nominalnya masih
   lengkap, dipakai untuk menjelaskan kenapa bulan berikutnya
   masih kosong.                                                  */
export function rekapRevisiDipa(data, tahun) {
  /* Folder DIPA di Drive & HISTORI_REVISI_DIPA hanya berisi DIPA
     TA aktif ("DIPA ... TA 2026"; Revisi 1 bahkan ditetapkan Desember
     2025). Tahun anggaran lain belum punya data → kosong, supaya
     tidak "mewarisi" pagu TA aktif. */
  if (Number(tahun) !== Number(TAHUN_ANGGARAN_AKTIF)) {
    return { ada: false, rows: [], perBulan: {}, bulanTerakhirData: "", sumber: "—" };
  }

  /* Sumber baris revisi: pakai hasil bacaan Drive kalau ada, kalau
     tidak (Drive belum selesai dibaca / gagal / offline) turun ke
     HISTORI_REVISI_DIPA sebagai cadangan — sama seperti pola
     "data live lebih dulu, masterData cadangan" di halaman lain. */
  const rowsDrive = data && Array.isArray(data.rows) ? data.rows : [];
  const dariDrive = rowsDrive.length > 0;
  const rowsMentah = dariDrive ? rowsDrive : barisDariMaster();

  /* Revisi yang punya tanggal & nominal, diurutkan lama → baru.
     "DIPA Awal" tidak dihitung: pagunya untuk TA 2026 sudah
     digantikan oleh Revisi 1. */
  const rows = rowsMentah
    .filter((r) => r.nomor > 0 && r.tanggal)
    .map((r) => ({ ...r, waktu: waktuDariTanggal(r.tanggal) }))
    .filter((r) => !Number.isNaN(r.waktu))
    .sort((a, b) => a.waktu - b.waktu);

  const perBulan = {};
  BULAN_ANGGARAN_OPTIONS.forEach((opsi, i) => {
    // Akhir bulan terpilih, mis. 31 Juli 2026.
    const akhirBulan = new Date(tahun, i + 1, 0).getTime();

    // Revisi terbaru yang tanggalnya sudah lewat pada akhir bulan ini.
    let berlaku = null;
    for (const r of rows) {
      if (r.waktu <= akhirBulan) berlaku = r;
      else break;
    }
    if (!berlaku) return;

    // Nominal belum diisi → bulan ini sengaja dikosongkan; memakai
    // pagu revisi lama akan menampilkan angka yang sudah tidak berlaku.
    if (!(berlaku.pagu > 0)) return;

    perBulan[opsi.id] = {
      id: opsi.id,
      label: opsi.label,
      nomor: berlaku.nomor,
      dipa: labelDipa(berlaku.nomor),
      tanggal: berlaku.tanggal,
      nominal: berlaku.pagu,
      sumber: dariDrive ? "Drive" : "masterData",
    };
  });

  const adaBulan = Object.keys(perBulan);
  const bulanTerakhirData = adaBulan.length
    ? perBulan[adaBulan[adaBulan.length - 1]].label
    : "";

  return {
    ada: adaBulan.length > 0,
    rows,
    perBulan,
    bulanTerakhirData,
    sumber: dariDrive ? "Drive" : "masterData",
  };
}

/* Revisi yang berlaku pada satu bulan, atau null bila tidak ada. */
export function revisiDipaBulan(rekap, bulanId) {
  if (!rekap || !rekap.ada) return null;
  return rekap.perBulan[bulanId] || null;
}

/* ══════════════════════════════════════════════════════════════
   TOKO DATA BERSAMA (cache + langganan)
   ══════════════════════════════════════════════════════════════ */
const TTL_MS = 300_000; // Drive ±15 permintaan, jadi 5 menit cukup
let cache = null;
let sedang = null;
const pendengar = new Set();

export function dengarRevisiDipa(fn) {
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

function siarkan(data) {
  pendengar.forEach((fn) => {
    try {
      fn(data);
    } catch (e) {
      /* abaikan */
    }
  });
}

export function ambilRevisiDipa(paksa = false) {
  const segar = cache && Date.now() - cache.waktu < TTL_MS;
  if (segar && !paksa) return Promise.resolve(cache.data);
  if (sedang) return sedang;

  sedang = muatRevisiDipa()
    .then((data) => {
      cache = { data, waktu: Date.now() };
      sedang = null;
      siarkan(data);
      return data;
    })
    .catch((e) => {
      console.warn("Gagal membaca revisi DIPA dari Drive:", e);
      sedang = null;
      // Cache lama tidak dikosongkan — data terakhir masih berguna.
      return cache ? cache.data : { status: "gagal", rows: [], updatedAt: Date.now() };
    });
  return sedang;
}
