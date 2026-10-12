/* ══════════════════════════════════════════════════════════════
   BACA PAGU (NOMINAL) DARI BERKAS PDF DIPA DI GOOGLE DRIVE
   ------------------------------------------------------------
   Halaman "History Revisi DIPA" dan Dashboard memakai modul ini
   untuk membaca nominal pagu langsung dari berkas PDF DIPA di
   Google Drive, mis. "DIPA 13 (10 SEPT 2026).pdf", sehingga DIPA
   Revisi 9–13 tampil real-time tanpa perlu diketik manual.

   Alur:
     1. Berkas diunduh lewat endpoint `files/{id}?alt=media`
        (CORS didukung untuk folder publik + API key, terbukti
        berjalan di browser).
     2. Halaman pertama di-parse dengan pdf.js.
     3. Nilai dicari pada blok "Sebesar Rp. <jumlah>" — total pagu
        DIPA pada halaman muka. Spasi antar huruf yang dipakai
        sebagian pencetak PDF ("S e b e s a r  R p .  1 5 . 8 8 9 …")
        dinormalisasi dengan membuang semua spasi.
     4. Hasil di-cache per (fileId + modifiedTime): sinkronisasi
        berkala (polling) tidak mengunduh/parse ulang selama berkas
        di Drive tidak berubah, sehingga otomatis "real-time".
   ══════════════════════════════════════════════════════════════ */

import * as pdfjsLib from "pdfjs-dist";

// pdf.js v4 memakai Promise.withResolvers() (baru di browser modern).
// Polyfill ringkas agar tetap jalan di browser yang sedikit lebih lama.
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function withResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// API key publik (read-only) — sama dengan JenisDokumen / rekapDipa.
const API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";

// Worker pdf.js disajikan dari origin yang sama (disalin ke public/),
// sehingga tidak bergantung pada CDN dan bebas masalah CORS.
const BASE_PUBLIK = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
pdfjsLib.GlobalWorkerOptions.workerSrc = `${BASE_PUBLIK}/pdf.worker.min.mjs`;

/* Cache hasil per berkas: fileId → { modifiedTime, nilai } */
const cacheBerkas = new Map();

/* Simpan cache kecil (hanya nilai, bukan berkasnya) agar muat ulang
   halaman tidak mengunduh & parse ulang semua PDF dari awal. */
const KUNCI_SIMPAN = "pu_pagu_pdf_cache_v1";

function muatCacheTersimpan() {
  try {
    if (typeof localStorage === "undefined") return;
    const mentah = localStorage.getItem(KUNCI_SIMPAN);
    if (!mentah) return;
    const objek = JSON.parse(mentah);
    Object.keys(objek).forEach((id) => cacheBerkas.set(id, objek[id]));
  } catch (e) {
    /* cache lama diabaikan bila rusak */
  }
}

function simpanCacheTersimpan() {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      KUNCI_SIMPAN,
      JSON.stringify(Object.fromEntries(cacheBerkas))
    );
  } catch (e) {
    /* kuota penuh / mode privat → abaikan */
  }
}

muatCacheTersimpan();

/* Promise yang sedang berjalan per berkas — mencegah dua permintaan
   bersamaan mengunduh berkas yang sama dua kali. */
const sedangBerkas = new Map();

/* ── Ambil nominal pagu & stamp digital dari teks halaman PDF ─────
   Halaman muka DIPA memuat:  "Sebesar  Rp.  15.889.706.000".
   Sebagian berkas dihasilkan dengan setiap karakter terpisah dan
   berjarak, jadi semua spasi dibuang sebelum dicocokkan.          */
function ekstrakPaguDanStamp(teks) {
  const rapat = String(teks || "").replace(/\s+/g, "");

  const pagu = rapat.match(/SebesarRp\.?([\d.,]+)/i);
  let nilaiPagu = null;
  if (pagu) {
    // 15.889.706.000 → tetap; 15,889,706,000 → 15.889.706.000
    nilaiPagu = /,\d{3},/.test(pagu[1])
      ? pagu[1].replace(/,/g, ".")
      : pagu[1];
  }

  // Stamp digital di halaman muka, bentuk "DS:7300-9065-9000-7409".
  const stamp = rapat.match(
    /DS:\s*([A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4})/
  );

  return {
    pagu: nilaiPagu,
    digitalStamp: stamp ? stamp[1] : null,
  };
}

/* Unduh isi berkas sebagai ArrayBuffer (untuk di-parse pdf.js). */
async function unduhPdf(fileId) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?alt=media&key=${API_KEY}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

/* Teks halaman pertama PDF (tempat blok "Sebesar Rp. …" berada). */
async function teksHalamanPertama(arrayBuffer) {
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  }).promise;
  try {
    const halaman = await doc.getPage(1);
    const konten = await halaman.getTextContent();
    return konten.items.map((it) => it.str).join(" ");
  } finally {
    doc.destroy();
  }
}

/* ── Baca pagu (+ stamp digital) dari berkas PDF DIPA di Drive ────
   Mengembalikan { pagu, digitalStamp } — nilai null bila tidak
   ditemukan — dan melempar error bila berkas gagal diunduh/di-parse.
   `modifiedTime` dipakai sebagai tanda cache: selama nilai di Drive
   tidak berubah, hasil tidak dibaca ulang.                        */
export async function bacaPaguDariPdf(fileId, modifiedTime) {
  const kunci = String(fileId);

  const tersimpan = cacheBerkas.get(kunci);
  if (tersimpan && tersimpan.modifiedTime === (modifiedTime || null)) {
    return tersimpan.nilai;
  }

  if (sedangBerkas.has(kunci)) return sedangBerkas.get(kunci);

  const proses = (async () => {
    const buffer = await unduhPdf(kunci);
    const teks = await teksHalamanPertama(buffer);
    const nilai = ekstrakPaguDanStamp(teks);
    cacheBerkas.set(kunci, {
      modifiedTime: modifiedTime || null,
      nilai,
    });
    simpanCacheTersimpan();
    return nilai;
  })();

  sedangBerkas.set(kunci, proses);
  try {
    return await proses;
  } finally {
    sedangBerkas.delete(kunci);
  }
}