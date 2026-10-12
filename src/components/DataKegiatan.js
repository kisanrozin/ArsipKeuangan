import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { PAGU_KEGIATAN, TAHUN_ANGGARAN_AKTIF, bidangDariKegiatan } from "../data/masterData";
import {
  SPJ_FOLDER_ID,
  API_KEY,
  SHEET_TAB_REKAP,
  ambilRekapKumulatif,
  bacaPaguPerBidang,
  parseBerkasSpm,
  rekapPerBulanDariBaris,
  terbitkanPerBulanDrive,
} from "../data/rekapKegiatan";
import {
  ambilRekapSpm,
  bulanIdDariYm,
  bulanTerakhirDenganData,
  dengarRekapSpm,
  rekapRealisasiSpm,
} from "../data/rekapSpm";
import {
  dengarKegiatanTambahan,
  tulisKegiatanTambahan,
} from "../data/KegiatanTambahan";
import { usePeran } from "../context/PeranContext";

/* ══════════════════════════════════════════════════════════════
   DATA KEGIATAN & ANGGARAN
   Sumber data: Google Drive — folder SPJ (alur mengikuti diagram
   "alurdigital": Folder Kegiatan → Folder Rekening → Berkas SPM)
   ══════════════════════════════════════════════════════════════ */

const DRIVE_FOLDER_ID = SPJ_FOLDER_ID;
const FOLDER_MIME = "application/vnd.google-apps.folder";

/* ── Sumber REALISASI dari spreadsheet (rekap kumulatif) ───────
   Kolom "Realisasi" pada tabel ini diisi dari spreadsheet rekap
   kumulatif (bukan dari penjumlahan nama berkas PDF), sehingga
   selalu sama dengan data Excel terbaru di Drive.
   Tab dipakai: `SHEET_TAB_REKAP`. Ganti bila spreadsheet memakai
   tab lain (nama tab = judul sheet di Google Sheets).
   Pembacaan tabnya orang yang sama dengan Dashboard, lewat
   src/data/rekapKegiatan.js → ambilRekapKumulatif().          */

/* ── Sumber PAGU & PERSENTASE ─────────────────────────────────
   Pagu per KEGIATAN tidak tersedia di sumber mana pun (hanya ada
   per BIDANG: SDA / CKPS / UPTU pada tab pertama spreadsheet —
   "resume SP2D", dibaca live lewat bacaPaguPerBidang()). Karena
   itu tiap kegiatan memakai pagu BIDANG-nya:
     · petanya ada di src/data/masterData.js → PETA_BIDANG_KEGIATAN
       + KATA_KUNCI_BIDANG (bidangDariKegiatan());
     · %  = realisasi kegiatan ÷ pagu bidang;  baris induk (induk /
       cabang / detail) menjumlahkan pagu bidang yang SUDAH didup
       (tiap bidang dihitung sekali), supaya tidak dihitung 2×.   */

/* OAuth Client ID (tipe "Web application") dari Google Cloud Console →
   APIs & Services → Credentials. Kosongkan var ini bila belum diatur:
   formulir tetap bisa diisi, tetapi unggah PDF ke Drive dinonaktifkan.
   Scope drive.file = hanya folder & berkas yang dibuat aplikasi ini. */
const GOOGLE_CLIENT_ID =
  "647903074551-fho1acg1at9k8rlp324jsv37etuu4v0e.apps.googleusercontent.com";
const OAUTH_SCOPE = "https://www.googleapis.com/auth/drive.file";

/* Nama rekening sesuai alur diagram digital */
const NAMA_REKENING = {
  "521211": "Belanja Bahan",
  "522111": "Belanja Perjalanan Dinas",
  "522131": "Belanja Jasa Konsultan",
  "522151": "Belanja Jasa Profesi",
  "522191": "Belanja Jasa Lainnya",
  "524111": "Belanja Perjalanan Dinas Biasa",
};

/* ── Format & helper ────────────────────────────────────────── */
function formatRupiah(n) {
  const num = Number(n);
  if (!isFinite(num)) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

function hitungPersen(realisasi, pagu) {
  const p = Number(pagu) || 0;
  if (p <= 0) return 0;
  return ((Number(realisasi) || 0) / p) * 100;
}

function persenColor(p) {
  if (p >= 100) return "#16a34a";
  if (p >= 50) return "#d97706";
  return "#dc2626";
}

/* "2026-07-28" → "28/07/2026".
   Hanya tanggal kalender yang benar-benar ada yang ditampilkan;
   bagian tanggal dari string ISO (mis. "2026-07-28T…" dari Drive)
   juga diterima. Nilai kosong/tidak lengkap/mustahil (mis.
   "32/13/2026") → "—" supaya tidak ada tanggal "undefined/…"
   maupun tanggal palsu di tabel. */
function isoToTglId(iso) {
  const cocok = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!cocok) return "—";
  const [, y, m, d] = cocok;
  const hari = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  const valid =
    hari.getUTCFullYear() === Number(y) &&
    hari.getUTCMonth() === Number(m) - 1 &&
    hari.getUTCDate() === Number(d);
  return valid ? `${d}/${m}/${y}` : "—";
}

/* Ambil "YYYY-MM" (untuk filter bulan) dari tanggal valid;
   nilai tidak valid → null agar tidak ikut dibandingkan. */
function bulanIso(iso) {
  const cocok = String(iso || "").match(/^(\d{4})-(\d{2})-/);
  if (!cocok) return null;
  const bulan = Number(cocok[2]);
  return bulan >= 1 && bulan <= 12 ? `${cocok[1]}-${cocok[2]}` : null;
}

/* Tanggal hari ini menurut waktu lokal (WIB/WITA/WIT), bukan UTC —
   `toISOString()` bisa menyimpang satu hari pada pagi hari. */
function tanggalHariIni() {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

function formatBytes(bytes) {
  const b = Number(bytes) || 0;
  if (b <= 0) return "—";
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} Mb`;
  if (b >= 1024) return `${(b / 1024).toFixed(2)} Kb`;
  return `${b} B`;
}

/* ── Parse nama folder kegiatan di Drive ────────────────────────
   Contoh nama folder:
     "7769.AFA.001.100.A.Peny. Kurmod Pelatihan SDA (...)"  → kode + nama
     "7770.EBA.962.100.A Tata Kelola Penyelenggaraan Kegiatan" → kode + nama
   Kode selalu berupa rangkaian segmen: 7769 . EAF . 001 . 100 . A
   ---------------------------------------------------------------- */
const SEGMENT_KODE = /^(?:\d{4}|\d{3}[A-Z]?|[A-Z]\d{2}|\d{1,3}|[A-Z]{1,3})$/;

function parseNamaFolder(namaFolder) {
  const segments = String(namaFolder || "").split(".");
  const kodeParts = [];
  let i = 0; 
  for (; i < segments.length; i += 1) {
    const seg = segments[i];
    if (SEGMENT_KODE.test(seg)) {
      kodeParts.push(seg);
      continue;
    }
    // Segmen berisi spasi → bagian awal bisa jadi kode terakhir, sisanya nama.
    const spasi = seg.match(/^([A-Za-z0-9]{1,4})\s+(.*)$/);
    if (spasi && SEGMENT_KODE.test(spasi[1].toUpperCase())) {
      kodeParts.push(spasi[1].toUpperCase());
      return { kode: kodeParts.join("."), nama: spasi[2].trim() };
    }
    break;
  }
  return {
    kode: kodeParts.join("."),
    nama: segments
      .slice(i)
      .join(".")
      .replace(/^[\s.-]+/, "")
      .trim(),
  };
}

/* ── Akses Google Drive API ─────────────────────────────────── */
async function listAnak(folderId) {
  const hasil = [];
  let pageToken = null;
  let guard = 0;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields:
        "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink)",
      pageSize: "200",
      key: API_KEY,
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    hasil.push(...(data.files || []));
    pageToken = data.nextPageToken || null;
    guard += 1;
  } while (pageToken && guard < 20);
  return hasil;
}

function namaRekening(kode) {
  return NAMA_REKENING[String(kode || "").trim()] || `Rekening ${kode || "—"}`;
}

/* ── Ambil rekap kumulatif dari spreadsheet (live, GVIZ) ──────
   Pembacaan tabnya dilakukan src/data/rekapKegiatan.js (sama
   dengan yang dipakai Dashboard), lalu diterjemahkan ke bentuk
   yang dipakai tabel di halaman ini:
     { totalRekap, perRekening: Map, perPic: Map, baris }       */
async function ambilRekapKumulatifSpreadsheet() {
  const rekap = await ambilRekapKumulatif(SHEET_TAB_REKAP);
  if (!rekap) return null;

  const perPic = new Map();
  rekap.rekening.forEach((v) => {
    if (v.pic) perPic.set(v.pic, (perPic.get(v.pic) || 0) + (v.realisasi || 0));
  });

  return {
    totalRekap: rekap.total,
    perRekening: rekap.rekening,
    perPic,
    baris: rekap.jumlahRekening,
  };
}

/* ══════════════════════════════════════════════════════════════
   FORM "TAMBAH DATA KEGIATAN" — pemisahan kode per tingkat
   ------------------------------------------------------------
   Kode kegiatan dipecah satu per satu, mengikuti alur digital:
     [7769] . [AFA] . [001] . [100] . [A]
       │        │        │       │      └ level 5
       │        │        │       └──────── level 4
       │        │        └──────────────── level 3
       │        └───────────────────────── level 2
       └────────────────────────────────── level 1 (Kode Induk)
   Setiap kotak berisi satu segmen; pilihan diambil dari kode yang
   sudah ada di Drive, dan boleh diketik sendiri bila segmen baru.
   ══════════════════════════════════════════════════════════════ */
const LABEL_SEGMEN = ["Induk", "Cabang", "Detail", "Kegiatan", "Output"];

/* Kunci prefix untuk saran level ke-`i`. Level 1 memakai "". */
function prefixSegmen(segmen, i) {
  const isi = segmen
    .slice(0, i)
    .map((s) => String(s || "").trim().toUpperCase())
    .filter(Boolean)
    .join(".");
  return i === 0 ? "" : `${isi}.`;
}

/* Kumpulan segmen yang sudah dipakai pada tiap level, dari kode di Drive. */
function bangunSaranSegmen(baris) {
  const setPerPrefix = new Map();
  const tambah = (prefix, nilai) => {
    if (!setPerPrefix.has(prefix)) setPerPrefix.set(prefix, new Set());
    setPerPrefix.get(prefix).add(nilai);
  };

  baris.forEach((r) => {
    const segs = String(r.kode || "")
      .split(".")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (segs.length === 0) return;
    tambah("", segs[0]);
    for (let i = 1; i < segs.length; i += 1) {
      tambah(`${segs.slice(0, i).join(".")}.`, segs[i]);
    }
  });

  const hasil = new Map();
  setPerPrefix.forEach((set, prefix) => {
    hasil.set(prefix, [...set].sort((a, b) => a.localeCompare(b, "id")));
  });
  return hasil;
}

/* Nama kegiatan yang kodenya cocok dengan kode yang sudah diketik. */
function sarankanNama(baris, kode) {
  const target = String(kode || "")
    .trim()
    .toUpperCase();
  const set = new Set();
  baris.forEach((r) => {
    const nama = String(r.nama || "").trim();
    if (!nama) return;
    if (!target || String(r.kode || "").toUpperCase().startsWith(target)) {
      set.add(nama);
    }
  });
  return [...set].sort((a, b) => a.localeCompare(b, "id"));
}

/* ══════════════════════════════════════════════════════════════
   UNGGAH BERKAS KE GOOGLE DRIVE (butuh login Google / OAuth)
   ------------------------------------------------------------
   Penulisan ke Drive tidak bisa dilakukan hanya dengan API key,
   jadi dipakai Google Identity Services:
     · login   → token akses (scope drive.file)
     · folder  → cari folder kegiatan, buat bila belum ada
     · berkas  → unggah PDF ke folder kegiatan / sub-folder rekening
   ══════════════════════════════════════════════════════════════ */
function muatPustakaGoogle() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) {
      resolve(window.google);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () =>
      window.google && window.google.accounts
        ? resolve(window.google)
        : reject(new Error("Pustaka Google Identity Services gagal dimuat."));
    s.onerror = () =>
      reject(new Error("Gagal memuat Google Identity Services (cek koneksi)."));
    document.head.appendChild(s);
  });
}

/* Minta access token Google. Callback dipakai GIS (bukan popup manual)
   agar tidak diblokir popup browser. */
function mintaTokenAkses() {
  if (!GOOGLE_CLIENT_ID) {
    return Promise.reject(
      new Error(
        "GOOGLE_CLIENT_ID belum diisi. Isi di src/components/DataKegiatan.js terlebih dahulu."
      )
    );
  }
  return muatPustakaGoogle().then(
    (google) =>
      new Promise((resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: OAUTH_SCOPE,
          callback: (resp) => {
            if (resp.error) {
              reject(
                new Error(
                  resp.error_description || resp.error || "Login Google gagal."
                )
              );
            } else {
              resolve(resp.access_token);
            }
          },
          error_callback: (err) =>
            reject(
              new Error(
                err?.message || "Login Google dibatalkan / gagal. Coba lagi."
              )
            ),
        });
        client.requestAccessToken();
      })
  );
}

/* Cache token di sessionStorage agar tidak meminta login tiap kali. */
const TOKEN_KEY = "pu_arsip_drive_token";
function bacaToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
}
function simpanToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    /* abaikan */
  }
}

/* Buat folder kegiatan bila belum ada di Drive. */
async function buatFolderDrive(token, namaFolder, indukId) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: namaFolder,
        mimeType: FOLDER_MIME,
        parents: [indukId],
      }),
    }
  );
  if (!res.ok) {
    const pesan = await bacaPesanDrive(res);
    throw new Error(`Gagal membuat folder di Drive — ${pesan}`);
  }
  return res.json();
}

/* Unggah satu berkas (PDF) ke folder tertentu di Drive. */
async function unggahBerkasDrive(token, indukId, file) {
  const boundary = `puarsip${Date.now()}`;
  const meta = {
    name: file.name,
    parents: [indukId],
    mimeType: file.type || "application/pdf",
  };
  const body = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
      JSON.stringify(meta),
      `\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
      file,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink&key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  if (!res.ok) {
    const pesan = await bacaPesanDrive(res);
    throw new Error(`Gagal mengunggah berkas — ${pesan}`);
  }
  return res.json();
}

async function bacaPesanDrive(res) {
  try {
    const data = await res.json();
    return data?.error?.message || `HTTP ${res.status}`;
  } catch (e) {
    return `HTTP ${res.status}`;
  }
}

/* Jalankan pekerjaan dengan batas konkurensi ( Drive API dibatasi kuota ) */
async function jalankanKolom(items, worker, concurrency = 4) {
  const antrean = items.map((item, idx) => ({ item, idx }));
  const pekerja = Array.from(
    { length: Math.max(1, Math.min(concurrency, antrean.length)) },
    async () => {
      while (antrean.length > 0) {
        const ambil = antrean.shift();
        await worker(ambil.item, ambil.idx);
      }
    }
  );
  await Promise.all(pekerja);
}

/* ══════════════════════════════════════════════════════════════
   STRUKTUR HIERARKIS (mengikuti diagram alurdigital)
     7769                        → Kode Induk        (program)
      └ 7769.AFA                 → Kode Cabang       (kegiatan)
         └ 7769.AFA.001.100.A    → Kode Kegiatan     (output)
            └ 521211             → Kode Akun Belanja (rekening)
   ══════════════════════════════════════════════════════════════ */
const LABEL_LEVEL = {
  induk: "Kode Induk",
  cabang: "Kode Cabang",
  detail: "Kode Detail",
  kegiatan: "Kode Kegiatan",
  akun: "Kode Akun Belanja",
};

/* Rekap per kode akun belanja dari berkas SPM sebuah kegiatan */
function rekapRekening(r, rekapSheetData) {
  const peta = new Map();
  const ambil = (kode) => {
    const k = String(kode || "").trim();
    if (!k) return null;
    if (!peta.has(k)) {
      peta.set(k, {
        kode: k,
        nama: namaRekening(k),
        jumlahBerkas: 0,
        jumlahUnik: 0,
        salinan: 0,
        lain: 0,
        realisasi: 0,
        tanggal: null,
        link: null,
      });
    }
    return peta.get(k);
  };

  (r.rekening || []).forEach((k) => {
    const n = ambil(k.kode);
    if (!n) return;
    n.jumlahBerkas += k.jumlah || 0;
    n.link = k.link || null;
  });
  (r.berkas || []).forEach((b) => {
    const n = ambil(b.spm.rekening);
    if (!n) return;
    n.realisasi += b.spm.nilai;
    n.jumlahUnik += 1;
    if (b.spm.tanggal && (!n.tanggal || b.spm.tanggal > n.tanggal)) {
      n.tanggal = b.spm.tanggal;
    }
  });
  (r.salinan || []).forEach((b) => {
    const n = ambil(b.spm.rekening);
    if (n) n.salinan += 1;
  });
  (r.lainnya || []).forEach((b) => {
    const n = ambil(b.rekening);
    if (n) n.lain += 1;
  });

  // Angka utama per rekening diambil dari spreadsheet rekap kumulatif;
  // penjumlahan nama berkas PDF tetap disimpan sebagai cadangan.
  peta.forEach((n) => {
    n.realisasiBerkas = n.realisasi;
    const v =
      rekapSheetData && rekapSheetData.perRekening
        ? rekapSheetData.perRekening.get(n.kode)
        : null;
    n.sumberRealisasi = v ? "Spreadsheet" : "Berkas Drive";
    if (v && typeof v.realisasi === "number") n.realisasi = v.realisasi;
  });

  return [...peta.values()].sort((a, b) =>
    a.kode.localeCompare(b.kode, "id")
  );
}

function nodeBaru(key, kode, tipe, depth) {
  return {
    key,
    kode,
    nama: "",
    tipe,
    depth,
    pagu: 0,
    /* Pagu per bidang (SDA/CKPS/UPTU) yang membentuk node ini —
       dihapus duplikasinya saat aggregasi supaya pagu bidang tidak
       dijumlahkan berkali-kali (Map<bidang, pagu>). */
    bidangPagu: null,
    realisasi: 0,
    realisasiBerkas: 0,
    sumberRealisasi: "—",
    persen: 0,
    tanggal: null,
    jumlahBerkas: 0,
    jumlahKegiatan: 0,
    jumlahRekening: 0,
    children: [],
    berkas: [],
    lainnya: [],
    salinan: [],
    link: null,
    lokal: false,
  };
}

/* Bangun pohon hierarkis dari baris kegiatan (satu daun = satu kegiatan) */
function bangunPohon(baris, rekapSheetData) {
  const akar = [];
  const indeks = new Map();

  baris.forEach((r) => {
    const segs = String(r.kode || "—")
      .split(".")
      .filter(Boolean);
    const total = segs.length;
    let parent = null;
    let key = "";

    for (let i = 0; i < total; i += 1) {
      key = segs.slice(0, i + 1).join(".");
      const tipe =
        i === total - 1 ? "kegiatan" : i === 0 ? "induk" : i === 1 ? "cabang" : "detail";
      let node = indeks.get(key);
      if (!node) {
        node = nodeBaru(key, key, tipe, i);
        indeks.set(key, node);
        if (parent) parent.children.push(node);
        else akar.push(node);
      }
      parent = node;
    }
    if (!parent) return;

    /* Daun = Kode Kegiatan */
    parent.nama = parent.nama || r.nama || "";
    /* Pagu per kegiatan berasal dari pagu BIDANG-nya (SDA/CKPS/UPTU);
       disimpan per bidang supaya baris induk tidak menjumlahkannya
       berulang (banyak kegiatan berbagi pagu bidang yang sama).
       Kegiatan tanpa bidang (atau pagu yang diisi manual lewat form)
       tetap dijumlahkan polos lewat `pagu`. */
    if (r.bidang && r.pagu > 0) {
      parent.bidangPagu = parent.bidangPagu || new Map();
      if ((parent.bidangPagu.get(r.bidang) || 0) < r.pagu) {
        parent.bidangPagu.set(r.bidang, r.pagu);
      }
    } else {
      parent.pagu += r.pagu || 0;
    }
    parent.realisasi += r.realisasi || 0;
    parent.realisasiBerkas += r.realisasiBerkas || 0;
    parent.sumberRealisasi =
      parent.sumberRealisasi === "Spreadsheet" && r.sumberRealisasi === "Spreadsheet"
        ? "Spreadsheet"
        : r.sumberRealisasi || parent.sumberRealisasi;
    parent.jumlahBerkas += r.jumlahBerkas || 0;
    parent.link = r.link || parent.link;
    parent.lokal = parent.lokal || r.lokal;
    parent.berkas = parent.berkas.concat(r.berkas || []);
    parent.lainnya = parent.lainnya.concat(r.lainnya || []);
    parent.salinan = parent.salinan.concat(r.salinan || []);
    if (r.tanggal && (!parent.tanggal || r.tanggal > parent.tanggal)) {
      parent.tanggal = r.tanggal;
    }

    /* Anak daun = Kode Akun Belanja */
    rekapRekening(r, rekapSheetData).forEach((k) => {
      parent.children.push({
        ...nodeBaru(`${parent.key}::${k.kode}`, k.kode, "akun", parent.depth + 1),
        nama: k.nama,
        pagu: null, // pagu hanya tersedia per kegiatan
        basisPagu: r.pagu,
        realisasi: k.realisasi,
        realisasiBerkas: k.realisasiBerkas,
        sumberRealisasi: k.sumberRealisasi,
        persen: hitungPersen(k.realisasi, r.pagu),
        tanggal: k.tanggal,
        jumlahBerkas: k.jumlahUnik + k.lain,
        jumlahUnik: k.jumlahUnik,
        jumlahSalinan: k.salinan,
        link: k.link,
        berkas: (r.berkas || []).filter((b) => b.spm.rekening === k.kode),
        lainnya: (r.lainnya || []).filter((b) => b.rekening === k.kode),
        salinan: (r.salinan || []).filter((b) => b.spm.rekening === k.kode),
      });
    });
  });

  /* Gulung nilai agregat dari bawah ke atas.
     Catatan: anak bertipe "akun" hanya rincian pemecahan nilai kegiatan
     (bukan nilai tambahan), jadi tidak dijumlahkan ke induknya. */
  const gulung = (nodes) => {
    nodes.forEach((n) => {
      if (n.children.length > 0) {
        gulung(n.children);
        n.children.forEach((c) => {
          if (c.tipe === "akun") return;
          /* Anak berbasis pagu bidang → cukup gabungkan ke peta bidang
             (pagu bidang dijumlahkan SEKALI per bidang, bukan per
             anak). Anak berbasis pagu manual dijumlahkan polos. */
          if (c.bidangPagu && c.bidangPagu.size > 0) {
            n.bidangPagu = n.bidangPagu || new Map();
            c.bidangPagu.forEach((v, bidang) => {
              if ((n.bidangPagu.get(bidang) || 0) < v) {
                n.bidangPagu.set(bidang, v);
              }
            });
          } else {
            n.pagu += c.pagu || 0;
          }
          n.realisasi += c.realisasi || 0;
          n.jumlahBerkas += c.jumlahBerkas || 0;
          n.jumlahKegiatan += c.jumlahKegiatan;
          n.jumlahRekening += c.jumlahRekening;
          if (c.tanggal && (!n.tanggal || c.tanggal > n.tanggal)) {
            n.tanggal = c.tanggal;
          }
        });
      }
      /* Pagu node = pagu manual (dijumlah polos) + pagu bidang yang
         sudah dihapus duplikasinya (tiap bidang hanya dihitung sekali). */
      if (n.bidangPagu && n.bidangPagu.size > 0) {
        let total = 0;
        n.bidangPagu.forEach((v) => {
          total += v;
        });
        n.pagu = (n.pagu || 0) + total;
      }
      n.jumlahKegiatan += n.tipe === "kegiatan" ? 1 : 0;
      n.jumlahRekening += n.tipe === "kegiatan" ? n.children.length : 0;
      if (n.pagu !== null) n.persen = hitungPersen(n.realisasi, n.pagu);
    });
  };
  gulung(akar);

  return akar;
}

/* Ratakan pohon sesuai node yang sedang terbuka */
function flattenPohon(akar, isOpen) {
  const keluar = [];
  const jalan = (nodes) => {
    nodes.forEach((n) => {
      keluar.push(n);
      if (n.children.length > 0 && isOpen(n)) jalan(n.children);
    });
  };
  jalan(akar);
  return keluar;
}

/* ══════════════════════════════════════════════════════════════ */
export default function DataKegiatan() {
  /* Mode tamu → tabel tetap tampil, tetapi semua kontrol input
     (tambah data, hapus baris) disembunyikan. */
  const { isAdmin } = usePeran();
  const [rows, setRows] = useState([]);
  const [rekapSheet, setRekapSheet] = useState(null);
  const rekapSheetData = rekapSheet?.data ?? null;
  const rekapRef = useRef(null);
  /* Pagu per bidang (SDA/CKPS/UPTU) dari tab pertama spreadsheet rekap —
     dipakai mengisi kolom Pagu & Persentase tiap kegiatan. */
  const paguBidangRef = useRef(null);

  /* Realisasi SPM dari spreadsheet "Rekap SPM kumulatif per bulan"
     di folder SPJ Drive — dibaca live lewat GVIZ, jadi angkanya
     ikut berubah begitu spreadsheetnya diperbarui. */
  const [rekapSpm, setRekapSpm] = useState(null);
  useEffect(() => dengarRekapSpm(setRekapSpm), []);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filter: draft (isian user) → applied (dipakai tabel)
  const [draft, setDraft] = useState({ cari: "", dari: "", sampai: "" });
  const [applied, setApplied] = useState({ cari: "", dari: "", sampai: "" });

  const [modalBerkas, setModalBerkas] = useState(null);
  const [modalTambah, setModalTambah] = useState(false);
  const [formTambah, setFormTambah] = useState({
    segmen: [], // diisi satu per satu: ["7769","AFA","001","100","A"]
    nama: "",
    pagu: "",
    realisasi: "",
  });
  const [fileTambah, setFileTambah] = useState(null);
  const [subFolderRekening, setSubFolderRekening] = useState("");
  const [daftarRekening, setDaftarRekening] = useState([]);
  const [statusUpload, setStatusUpload] = useState(null);
  const [santaiUpload, setSantaiUpload] = useState(false);
  const [tambahan, setTambahan] = useState([]);

  // Pohon hierarkis: node mana yang sedang dibuka
  const [terbuka, setTerbuka] = useState({});
  const [semuaBuka, setSemuaBuka] = useState(false);

  const isOpen = useCallback(
    (node) =>
      semuaBuka
        ? true
        : terbuka[node.key] !== undefined
        ? terbuka[node.key]
        : node.depth < 1, // default: kode induk terbuka, sisanya tertutup
    [terbuka, semuaBuka]
  );

  const toggleNode = useCallback(
    (node) => {
      const next = !isOpen(node);
      setSemuaBuka(false);
      setTerbuka((prev) => ({ ...prev, [node.key]: next }));
    },
    [isOpen]
  );

  /* Data tambahan yang diinput admin — lewat toko data bersama
     (src/data/KegiatanTambahan.js) supaya halaman tamu ikut berubah
     begitu baris baru ditambah, termasuk dari tab lain. */
  useEffect(() => dengarKegiatanTambahan(setTambahan), []);

  const tampilkanToast = useCallback((pesan) => {
    setToast(pesan);
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Muat data kegiatan dari Drive (2 tahap) ──────────────── */
  const muatData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      // Tahap 0 — rekap kumulatif dari spreadsheet (sumber angka Realisasi).
      try {
        const rekap = await ambilRekapKumulatifSpreadsheet();
        rekapRef.current = rekap;
        setRekapSheet(
          rekap
            ? {
                total: rekap.totalRekap,
                rekening: rekap.perRekening.size,
                data: rekap,
              }
            : null
        );
      } catch (e) {
        console.warn("Gagal membaca rekap kumulatif spreadsheet:", e);
        rekapRef.current = null;
        setRekapSheet(null);
      }

      // Tahap 0a — Pagu per bidang (resume SP2D, tab pertama spreadsheet).
      // Pagu hanya tersedia per bidang, jadi tiap kegiatan memakai pagu
      // bidangnya (lihat bidangDariKegiatan di masterData.js).
      let mapPagu = new Map();
      try {
        const paguBidang = await bacaPaguPerBidang();
        paguBidangRef.current = paguBidang || null;
        if (paguBidang) mapPagu = paguBidang.perBidang || mapPagu;
      } catch (e) {
        console.warn("Gagal membaca pagu per bidang:", e);
        paguBidangRef.current = null;
      }

      // Tahap 0b — "Realisasi SPM" per bulan dari spreadsheet
      // "Rekap SPM kumulatif per bulan.xlsx" di folder SPJ. Dipakai
      // untuk angka di sebelah Persentase pada info bar.
      ambilRekapSpm(API_KEY).catch((e) =>
        console.warn("Gagal membaca Realisasi SPM:", e)
      );

      // Tahap 1 — daftar folder kegiatan (1 permintaan).
      const isi = await listAnak(DRIVE_FOLDER_ID);
      const folders = isi
        .filter((f) => f.mimeType === FOLDER_MIME)
        .map((f) => {
          const { kode, nama } = parseNamaFolder(f.name);
          /* Bidang kegiatan → pagu bidangnya dari spreadsheet (resume
             SP2D). Pagu manual PAGU_KEGIATAN tetap diprioritaskan bila
             diisi. */
          const bidang = bidangDariKegiatan(kode, nama);
          const paguManual = Number(PAGU_KEGIATAN[kode]) || 0;
          const paguBidangNilai = bidang
            ? (mapPagu.get(bidang) || {}).pagu || 0
            : 0;
          /* Pagu manual (PAGU_KEGIATAN) bersifat per kegiatan → tidak
             memakai bidang (supaya tidak ikut ter-deduplikasi). */
          const pakaiBidang = paguManual === 0;
          return {
            id: f.id,
            kode,
            nama: nama || f.name,
            folderNama: f.name,
            link: f.webViewLink || `https://drive.google.com/drive/folders/${f.id}`,
            bidang: pakaiBidang ? bidang : "",
            pagu: paguManual || paguBidangNilai,
            realisasi: 0,
            realisasiBerkas: 0,
            sumberRealisasi: "—",
            persen: 0,
            tanggal: null,
            jumlahBerkas: 0,
            rekening: [],
            berkas: [],
            lainnya: [],
            salinan: [],
            lokal: false,
          };
        })
        .sort((a, b) => a.kode.localeCompare(b.kode, "id"));

      setRows(folders);
      setProgress(0);
      if (folders.length === 0) setLoading(false);

      // Tahap 2 — telusuri folder rekening + berkas tiap kegiatan.
      let selesai = 0;
      await jalankanKolom(folders, async (row) => {
        let rekening = [];
        let berkas = [];
        try {
          const isiKegiatan = await listAnak(row.id);
          const subFolder = isiKegiatan.filter(
            (f) => f.mimeType === FOLDER_MIME
          );
          const berkasLuar = isiKegiatan.filter(
            (f) => f.mimeType !== FOLDER_MIME
          );

          // Alur diagram: kegiatan → rekening → berkas SPM
          const rek = [];
          await jalankanKolom(
            subFolder,
            async (sub) => {
              const isiRek = await listAnak(sub.id);
              const files = isiRek.filter((f) => f.mimeType !== FOLDER_MIME);
              rek.push({
                kode: sub.name,
                nama: namaRekening(sub.name),
                jumlah: files.length,
                link: sub.webViewLink,
              });
              berkas = berkas.concat(
                files.map((f) => ({ ...f, rekening: sub.name }))
              );
            },
            3
          );
          rekening = rek.sort((a, b) => a.kode.localeCompare(b.kode, "id"));
          berkas = berkas.concat(
            berkasLuar.map((f) => ({ ...f, rekening: "" }))
          );
        } catch (e) {
          console.warn(`Gagal membaca folder kegiatan "${row.kode}":`, e);
        }

        // Pisahkan berkas SPM yang bisa dibaca namanya vs berkas lain.
        const sudah = new Set();
        const unik = [];
        const lainnya = [];
        const salinan = [];
        const keyOf = (b) => `${b.spm.noSpm}|${b.spm.rekening}|${b.spm.nilai}`;
        const bertanda = [];
        berkas.forEach((f) => {
          const spm = parseBerkasSpm(f.name, f.rekening);
          if (spm) bertanda.push({ ...f, spm });
          else lainnya.push(f);
        });
        // Berkas asli dulu, baru salinannya (agar yang tertuang bukan "Copy of").
        [
          ...bertanda.filter((b) => !b.spm.duplikat),
          ...bertanda.filter((b) => b.spm.duplikat),
        ].forEach((b) => {
          const key = keyOf(b);
          if (sudah.has(key)) {
            // Salinan dari SPM yang sama → dicatat, tidak masuk realisasi.
            salinan.push(b);
            return;
          }
          sudah.add(key);
          unik.push(b);
        });
        unik.sort(
          (a, b) => (a.spm.tanggal || "").localeCompare(b.spm.tanggal || "")
        );
        lainnya.sort((a, b) => String(a.name).localeCompare(String(b.name)));

        const realisasiBerkas = unik.reduce((s, b) => s + b.spm.nilai, 0);
        const tanggalTerakhir = unik.length
          ? unik[unik.length - 1].spm.tanggal
          : null;

        // Angka utama diambil dari spreadsheet (rekap kumulatif);
        // penjumlahan nama berkas PDF dipakai sebagai cadangan.
        const rekap = rekapRef.current;
        let dariSheet = 0;
        let cocok = 0;
        if (rekap) {
          rekening.forEach((k) => {
            const v = rekap.perRekening.get(String(k.kode).trim());
            if (v) {
              dariSheet += v.realisasi || 0;
              cocok += 1;
            }
          });
        }
        const pakaiSheet = rekap && cocok > 0 && dariSheet > 0;
        const realisasi = pakaiSheet ? dariSheet : realisasiBerkas;

        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  realisasi,
                  realisasiBerkas,
                  sumberRealisasi: pakaiSheet ? "Spreadsheet" : "Berkas Drive",
                  persen: hitungPersen(realisasi, r.pagu),
                  tanggal: tanggalTerakhir,
                  jumlahBerkas: unik.length + lainnya.length,
                  rekening,
                  berkas: unik,
                  lainnya: lainnya,
                  salinan: salinan,
                }
              : r
          )
        );
        selesai += 1;
        setProgress(selesai);
      }, 4);

      setLoading(false);
    } catch (e) {
      console.error("Gagal memuat Data Kegiatan:", e);
      setError(
        "Gagal mengambil data kegiatan dari Google Drive. " +
          "Periksa koneksi internet atau API Key."
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatData();
  }, [muatData]);

  /* Realtime: "Realisasi SPM" disegarkan tiap menit (paksa baca ulang)
     selama halaman ini terbuka, supaya angka di sebelah Persentase
     ikut berubah begitu spreadsheet di Drive diperbarui. */
  useEffect(() => {
    const id = setInterval(() => {
      ambilRekapSpm(API_KEY, true).catch((e) =>
        console.warn("Gagal menyegarkan Realisasi SPM:", e)
      );
    }, 60000);
    return () => clearInterval(id);
  }, []);

  /* Bekalkan rekap per bulan ke modul rekap bersama supaya kartu
     "Realisasi Bulan" di Dashboard memakai angka yang sama — tanpa
     perlu menelusuri folder Drive untuk kedua kalinya. */
  useEffect(() => {
    if (loading) return;
    terbitkanPerBulanDrive(rekapPerBulanDariBaris(rows), rows.length);
  }, [rows, loading]);

  // Re-fetch saat ada berkas yang berubah di aplikasi / tab regain focus.
  useEffect(() => {
    const onUpdate = () => muatData();
    const onFocus = () => muatData();
    window.addEventListener("pu_files_updated", onUpdate);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("pu_files_updated", onUpdate);
      window.removeEventListener("focus", onFocus);
    };
  }, [muatData]);

  /* ── Gabungkan baris dari Drive + baris yang ditambahkan user ── */
  const semuaRows = useMemo(() => {
    const extra = (tambahan || []).map((t) => ({
      id: `local_${t.kode}`,
      kode: t.kode,
      nama: t.nama,
      folderNama: null,
      link: null,
      pagu: Number(t.pagu) || 0,
      realisasi: Number(t.realisasi) || 0,
      persen: hitungPersen(t.realisasi, t.pagu),
      tanggal: t.tanggal || null,
      jumlahBerkas: 0,
      rekening: [],
      berkas: [],
      lainnya: [],
      salinan: [],
      lokal: true,
    }));
    return [...rows, ...extra].sort((a, b) =>
      String(a.kode).localeCompare(String(b.kode), "id")
    );
  }, [rows, tambahan]);

  /* ── Saran kode kegiatan per level (dari kode di Drive) ──── */
  const saranSegmen = useMemo(() => bangunSaranSegmen(semuaRows), [semuaRows]);

  /* Kode gabungan dari kotak-kotak segmen yang sudah diisi. */
  const kodeGabung = useMemo(
    () =>
      formTambah.segmen
        .map((s) => String(s || "").trim().toUpperCase())
        .filter(Boolean)
        .join("."),
    [formTambah.segmen]
  );

  const saranNama = useMemo(
    () => sarankanNama(semuaRows, kodeGabung),
    [semuaRows, kodeGabung]
  );

  /* Jumlah kotak = jumlah level terpanjang di Drive, minimal 4. */
  const jumlahLevel = useMemo(() => {
    const maks = semuaRows.reduce((m, r) => {
      const n = String(r.kode || "")
        .split(".")
        .filter(Boolean).length;
      return Math.max(m, n);
    }, 0);
    return Math.max(4, Math.min(maks || 5, 6));
  }, [semuaRows]);

  /* Isi satu kotak segmen (satu per satu).
     Bila sebuah kotak dikosongkan, kotak setelahnya ikut dibersihkan
     supaya level berikutnya diketik ulang dari awal. */
  const ubahSegmen = useCallback((index, nilaiBaru) => {
    setFormTambah((lama) => {
      const segmen = lama.segmen.slice(0, index + 1);
      while (segmen.length < index + 1) segmen.push("");
      segmen[index] = nilaiBaru.toUpperCase();
      // Bila kotak ini dikosongkan, level setelahnya dibuang.
      const bersih =
        String(segmen[index] || "").trim() === ""
          ? segmen.slice(0, index)
          : segmen;
      return { ...lama, segmen: bersih };
    });
  }, []);

  /* ── Terapkan filter ────────────────────────────────────── */
  const tabelRows = useMemo(() => {
    const q = applied.cari.trim().toLowerCase();
    return semuaRows.filter((r) => {
      if (q) {
        const haystack = `${r.kode} ${r.nama}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Filter berdasarkan bulan-tahun (YYYY-MM) — hanya tanggal valid
      // yang ikut dibandingkan, agar tidak ada bulan palsu.
      const rowMonth = bulanIso(r.tanggal);
      if (applied.dari && (!rowMonth || rowMonth < applied.dari)) return false;
      if (applied.sampai && (!rowMonth || rowMonth > applied.sampai)) return false;
      return true;
    });
  }, [semuaRows, applied]);

  /* ── Pohon hierarkis (kode induk → cabang → detail → akun) ── */
  const pohon = useMemo(() => bangunPohon(tabelRows, rekapSheetData), [tabelRows, rekapSheetData]);
  const barisTampil = useMemo(
    () => flattenPohon(pohon, isOpen),
    [pohon, isOpen]
  );

  const bukaSemua = () => {
    setSemuaBuka(true);
    setTerbuka({});
  };

  const tutupSemua = () => {
    const kunci = [];
    const kumpulkan = (nodes) =>
      nodes.forEach((n) => {
        if (n.children.length > 0) {
          kunci.push(n.key);
          kumpulkan(n.children);
        }
      });
    kumpulkan(pohon);
    setSemuaBuka(false);
    setTerbuka(kunci.reduce((a, k) => ({ ...a, [k]: false }), {}));
  };

  /* Total pagu: pagu per kegiatan berasal dari pagu bidangnya, jadi
     jumlahkan tiap bidang SEKALI (banyak kegiatan berbagi pagu bidang
     yang sama). Pagu manual (tanpa bidang) dijumlahkan polos. */
  const totalPagu = (() => {
    const perBidang = new Map();
    let manual = 0;
    tabelRows.forEach((r) => {
      const v = Number(r.pagu) || 0;
      if (r.bidang && v > 0) {
        if ((perBidang.get(r.bidang) || 0) < v) perBidang.set(r.bidang, v);
      } else {
        manual += v;
      }
    });
    let total = manual;
    perBidang.forEach((v) => {
      total += v;
    });
    return total;
  })();
  const totalRealisasi = tabelRows.reduce((s, r) => s + (r.realisasi || 0), 0);
  const totalBerkas = tabelRows.reduce((s, r) => s + (r.jumlahBerkas || 0), 0);

  /* ── Realisasi SPM dari spreadsheet rekap bulanan ───────────
     Bulan patokan diambil dari filter "Bulan"/"s.d." di toolbar
     (format YYYY-MM). Kalau filter kosong, pakai bulan terakhir
     yang benar-benar punya tab di spreadsheet, bukan bulan
     terakhir kalender. */
  const bulanRekapSpm = useMemo(() => {
    const perBulan = (rekapSpm && rekapSpm.perBulan) || {};
    const dariSampai = bulanIdDariYm(applied.sampai);
    if (dariSampai && perBulan[dariSampai]) return dariSampai;
    const dariDari = bulanIdDariYm(applied.dari);
    if (dariDari && perBulan[dariDari]) return dariDari;
    return bulanTerakhirDenganData(rekapSpm);
  }, [rekapSpm, applied.dari, applied.sampai]);

  const rekapSpmBulan = useMemo(
    () => rekapRealisasiSpm(rekapSpm, TAHUN_ANGGARAN_AKTIF, bulanRekapSpm),
    [rekapSpm, bulanRekapSpm]
  );

  const adaFilter =
    Boolean(applied.cari || applied.dari || applied.sampai) ||
    Boolean(draft.cari || draft.dari || draft.sampai);

  /* Reset form + pilihan berkas saat modal ditutup. */
  const resetFormTambah = useCallback(() => {
    setFormTambah({ segmen: [], nama: "", pagu: "", realisasi: "" });
    setFileTambah(null);
    setSubFolderRekening("");
    setDaftarRekening([]);
    setStatusUpload(null);
  }, []);

  /* Tutup modal + bersihkan form (dipakai tombol Batal & tutup). */
  const tutupModalTambah = useCallback(() => {
    if (santaiUpload) return; // jangan tutup saat unggahan berjalan
    setModalTambah(false);
    resetFormTambah();
  }, [santaiUpload, resetFormTambah]);

  /* Cari folder kegiatan di Drive berdasarkan kode; buat bila belum ada. */
  const siapkanFolderKegiatan = useCallback(async (token, kode, nama) => {
    const isi = await listAnak(DRIVE_FOLDER_ID);
    const cocok = isi
      .filter((f) => f.mimeType === FOLDER_MIME)
      .find((f) => parseNamaFolder(f.name).kode.toUpperCase() === kode.toUpperCase());
    if (cocok) return { folder: cocok, dibuat: false };

    const folderBaru = await buatFolderDrive(
      token,
      `${kode}.${nama}`.trim(),
      DRIVE_FOLDER_ID
    );
    return { folder: folderBaru, dibuat: true };
  }, []);

  /* Ambil daftar sub-folder rekening milik sebuah folder kegiatan. */
  const muatSubFolderRekening = useCallback(async (folderId) => {
    const isi = await listAnak(folderId);
    return isi
      .filter((f) => f.mimeType === FOLDER_MIME)
      .map((f) => ({ id: f.id, kode: parseNamaFolder(f.name).kode || f.name }));
  }, []);

  /*
// Ketika kode kegiatan sudah terisi lengkap, cari folder-nya di Drive
  // lalu tampilkan daftar sub-folder rekening sebagai tujuan unggah.
  // */
  useEffect(() => {
    if (!modalTambah || !fileTambah || !kodeGabung) return undefined;
    let batal = false;
    setDaftarRekening([]);
    setSubFolderRekening("");

    (async () => {
      try {
        const isi = await listAnak(DRIVE_FOLDER_ID);
        const folder = isi
          .filter((f) => f.mimeType === FOLDER_MIME)
          .find(
            (f) =>
              parseNamaFolder(f.name).kode.toUpperCase() === kodeGabung
          );
        if (!folder) return;
        const rek = await muatSubFolderRekening(folder.id);
        if (!batal) setDaftarRekening(rek);
      } catch (e) {
        console.warn("Gagal membaca sub-folder rekening:", e);
      }
    })();

    return () => {
      batal = true;
    };
  }, [modalTambah, fileTambah, kodeGabung, muatSubFolderRekening]);

  const handleSimpanTambah = async (e) => {
    e.preventDefault();
    if (santaiUpload) return;
    const kode = kodeGabung;
    if (!kode || !formTambah.nama.trim()) return;

    const baru = {
      kode,
      nama: formTambah.nama.trim(),
      pagu: Number(formTambah.pagu) || 0,
      realisasi: Number(formTambah.realisasi) || 0,
      tanggal: tanggalHariIni(),
    };
    const next = [...tambahan.filter((t) => t.kode !== baru.kode), baru];
    setTambahan(next);
    tulisKegiatanTambahan(next);

    /* ── Bila ada PDF, unggah ke folder kegiatan di Google Drive ── */
    if (fileTambah) {
      setSantaiUpload(true);
      setStatusUpload("Menyiapkan koneksi ke Google Drive…");
      try {
        let token = bacaToken();
        if (!token) {
          setStatusUpload("Silakan login dengan akun Google Anda…");
          token = await mintaTokenAkses();
          simpanToken(token);
        }
        setStatusUpload("Mencari folder kegiatan di Drive…");
        const { folder, dibuat } = await siapkanFolderKegiatan(
          token,
          baru.kode,
          baru.nama
        );
        setStatusUpload(
          dibuat
            ? "Folder kegiatan dibuat di Drive. Mengunggah PDF…"
            : "Folder kegiatan ditemukan. Mengunggah PDF…"
        );
        const induk = subFolderRekening || folder.id;
        const hasil = await unggahBerkasDrive(token, induk, fileTambah);

        setModalTambah(false);
        resetFormTambah();
        muatData(); // muat ulang tabel agar folder/berkas baru ikut terlihat
        tampilkanToast(
          `✓ Data kegiatan "${baru.kode}" disimpan & PDF ` +
            `"${hasil.name || fileTambah.name}" terunggah ke Drive.`
        );
      } catch (err) {
        console.error("Gagal mengunggah PDF:", err);
        setStatusUpload(`Gagal: ${err.message}`);
        tampilkanToast(
          `Data kegiatan "${baru.kode}" tersimpan, tetapi unggah PDF gagal: ${err.message}`
        );
      } finally {
        setSantaiUpload(false);
      }
      return;
    }

    setModalTambah(false);
    resetFormTambah();
    tampilkanToast(`✓ Data kegiatan "${baru.kode}" berhasil ditambahkan.`);
  };

  const handleHapusTambahan = (kode) => {
    const next = tambahan.filter((t) => t.kode !== kode);
    setTambahan(next);
    tulisKegiatanTambahan(next);
    tampilkanToast(`Data kegiatan "${kode}" dihapus.`);
  };

  return (
    <div className="site-content" style={{ paddingTop: 24, paddingBottom: 60 }}>
      {toast && <div className="toast">{toast}</div>}

      {/* ── Judul halaman ── */}
      <div className="page-header dk-header">
        <div>
          <h2>Data Kegiatan &amp; Anggaran</h2>
          <p>
            Pagu, realisasi, dan bukti kerja setiap kegiatan — sumber data: Google
            Drive (folder SPJ), dipecah berjenjang sesuai alur digital:{" "}
            <strong>Kode Induk → Kode Cabang → Kode Detail → Kode Kegiatan → Kode
            Akun Belanja</strong>. Klik tanda untuk membuka rinciannya.
          </p>
        </div>
        <div className="dk-header-badges">
          {!isAdmin && (
            <span className="tm-inline-badge" title="Tamu hanya bisa melihat data, tidak bisa menambah atau mengubahnya">
              👁 Mode Tamu · baca saja
            </span>
          )}
          <div className="dk-live-badge">
            <span className="dk-live-dot" />
            {loading
              ? `Mengambil data… ${progress}/${rows.length || "?"}`
              : `Live Google Drive · ${semuaRows.length} kegiatan`}
          </div>
        </div>
      </div>

      {/* ── Toolbar: rentang tanggal + filter + tambah ── */}
      <div className="dk-toolbar">
        <div className="dk-toolbar-filters">
          <input
            type="text"
            className="dk-input"
            placeholder="Cari kode / kegiatan..."
            value={draft.cari}
            onChange={(e) => setDraft({ ...draft, cari: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && setApplied(draft)}
          />
          <label className="dk-date-wrap">
            <span className="dk-date-label">Bulan</span>
            <input
              type="month"
              className="dk-input dk-input-date"
              value={draft.dari}
              onChange={(e) => setDraft({ ...draft, dari: e.target.value })}
            />
          </label>
          <label className="dk-date-wrap">
            <span className="dk-date-label">s.d.</span>
            <input
              type="month"
              className="dk-input dk-input-date"
              value={draft.sampai}
              onChange={(e) => setDraft({ ...draft, sampai: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="dk-btn dk-btn-filter"
            onClick={() => setApplied(draft)}
            title="Terapkan filter"
          >
            🔍 Filter
          </button>
          <button
            type="button"
            className="dk-btn dk-btn-clear"
            onClick={() => {
              const kosong = { cari: "", dari: "", sampai: "" };
              setDraft(kosong);
              setApplied(kosong);
            }}
            disabled={!adaFilter}
            title="Hapus semua filter"
          >
            ✕ Hapus Filter
          </button>
        </div>
        <div className="dk-toolbar-right">
          <button
            type="button"
            className="dk-btn dk-btn-tree"
            onClick={semuaBuka ? tutupSemua : bukaSemua}
            title={
              semuaBuka
                ? "Tutup semua rincian"
                : "Buka rincian sampai kode akun belanja"
            }
          >
            {semuaBuka ? "▴ Tutup Semua" : "▾ Buka Semua"}
          </button>
          {isAdmin && (
            <button
              type="button"
              className="dk-btn dk-btn-add"
              onClick={() => setModalTambah(true)}
            >
              + Tambah Data
            </button>
          )}
        </div>
      </div>

      {/* ── Info bar ── */}
      <div className="dk-infobar">
        Menampilkan <strong>{tabelRows.length}</strong> dari{" "}
        <strong>{semuaRows.length}</strong> kegiatan
        {adaFilter && <span className="dk-infobar-tag">Filter aktif</span>}
        <span className="dk-infobar-spacer" />
        <span>
          Total Pagu: <strong>{formatRupiah(totalPagu)}</strong>
        </span>
        <span>
          Total Realisasi: <strong>{formatRupiah(totalRealisasi)}</strong>
          {rekapSheet && <span className="dk-infobar-tag">Spreadsheet</span>}
        </span>
        {rekapSheet && (
          <span title={`Sumber: spreadsheet "${SHEET_TAB_REKAP}" · ${rekapSheet.rekening} kode rekening`}>
            Total Rekap Kumulatif:{" "}
            <strong>{formatRupiah(rekapSheet.total || 0)}</strong>
          </span>
        )}
        {/* Realisasi SPM — live dari spreadsheet rekap bulanan */}
        <span
          title={
            rekapSpmBulan.ada
              ? `Sumber: spreadsheet "Rekap SPM kumulatif per bulan.xlsx" (folder SPJ) · tab ${
                  rekapSpmBulan.dasar[rekapSpmBulan.dasar.length - 1].tab
                } · kumulatif 1 Jan s.d. ${rekapSpmBulan.bulanDasar} ${TAHUN_ANGGARAN_AKTIF}. Angka ini ikut berubah realtime begitu spreadsheetnya diperbarui.`
              : "Spreadsheet rekap bulanan belum terbaca atau bulan ini belum punya data."
          }
        >
          Realisasi SPM:{" "}
          {rekapSpmBulan.ada ? (
            <strong>{formatRupiah(rekapSpmBulan.total)}</strong>
          ) : (
            <span className="dk-kosong">—</span>
          )}
          {rekapSpmBulan.ada && (
            <span className="dk-infobar-tag">
              {rekapSpmBulan.bulanDasar}
            </span>
          )}
        </span>
        <span>
          Persentase:{" "}
          <strong style={{ color: persenColor(hitungPersen(totalRealisasi, totalPagu)) }}>
            {hitungPersen(totalRealisasi, totalPagu).toFixed(2)}%
          </strong>
        </span>
        <span>
          Bukti Kerja: <strong>{totalBerkas} berkas</strong>
        </span>
      </div>

      {/* ── Tabel ── */}
      <div className="dk-table-wrap">
        <table className="dk-table">
          <thead>
            <tr>
              <th style={{ minWidth: 150 }}>Kode</th>
              <th>Kegiatan</th>
              <th
                style={{ textAlign: "right", minWidth: 130 }}
                title="Pagu bidang (SDA/CKPS/UPTU) — dibaca live dari tab pertama spreadsheet rekap"
              >
                Pagu
              </th>
              <th style={{ textAlign: "right", minWidth: 130 }}>Realisasi</th>
              <th
                style={{ textAlign: "right", width: 110 }}
                title="Persentase realisasi terhadap pagu bidang (SDA/CKPS/UPTU)"
              >
                %
              </th>
              <th style={{ textAlign: "center", width: 110 }}>Tanggal</th>
              <th style={{ textAlign: "center", width: 130 }}>Bukti Kerja</th>
            </tr>
          </thead>
          <tbody>
            {barisTampil.length > 0 ? (
              barisTampil.map((n) => {
                const expandable = n.children.length > 0;
                const terbuka = expandable && isOpen(n);
                return (
                  <tr
                    key={n.key}
                    className={`dk-row dk-row-${n.tipe}`}
                    data-level={n.depth}
                  >
                    {/* Kode — dipersingkat mengikuti level hierarki */}
                    <td className="dk-kode-cell">
                      <span
                        className="dk-kode-indent"
                        style={{ width: n.depth * 15 }}
                      />
                      {expandable ? (
                        <button
                          type="button"
                          className="dk-toggle"
                          onClick={() => toggleNode(n)}
                          aria-expanded={terbuka}
                          aria-label={`${terbuka ? "Tutup" : "Buka"} rincian ${n.kode}`}
                          title={`${terbuka ? "Tutup" : "Buka"} rincian (${n.children.length})`}
                        >
                          {terbuka ? "▾" : "▸"}
                        </button>
                      ) : (
                        <span className="dk-toggle dk-toggle-empty">·</span>
                      )}
                      <span className="dk-kode">{n.kode}</span>
                      {n.lokal && <span className="dk-tag-local">Input</span>}
                    </td>

                    {/* Kegiatan / uraian */}
                    <td>
                      {n.tipe === "kegiatan" ? (
                        <>
                          <span className="dk-kegiatan" title={n.nama}>
                            {n.nama || "—"}
                          </span>
                          <span className="dk-level-tag">Kode Kegiatan</span>
                        </>
                      ) : n.tipe === "akun" ? (
                        <>
                          <span className="dk-kegiatan" title={n.nama}>
                            {n.nama}
                          </span>
                          <span className="dk-level-tag dk-level-tag-akun">
                            Kode Akun Belanja
                          </span>
                          <span className="dk-sub">
                            {n.jumlahUnik || 0} SPM unik
                            {n.jumlahSalinan
                              ? ` · ${n.jumlahSalinan} salinan`
                              : ""}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="dk-level-tag">
                            {LABEL_LEVEL[n.tipe]}
                          </span>
                          <span className="dk-sub">
                            {[n.jumlahKegiatan, n.jumlahRekening]
                              .filter((x) => x > 0)
                              .map((x) => `${x} anak`)
                              .join(" · ")}
                          </span>
                        </>
                      )}
                    </td>

                    <td className="dk-num">
                      {n.pagu ? (
                        <span
                          title={
                            n.bidang
                              ? `Pagu bidang ${n.bidang} — dari spreadsheet rekap`
                              : undefined
                          }
                        >
                          {formatRupiah(n.pagu)}
                        </span>
                      ) : (
                        <span
                          className="dk-kosong"
                          title="Pagu bidang belum tersedia untuk kegiatan ini"
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td
                      className="dk-num"
                      title={
                        n.tipe === "kegiatan" && n.sumberRealisasi
                          ? `Sumber: ${n.sumberRealisasi}` +
                            (n.realisasiBerkas && n.realisasiBerkas !== n.realisasi
                              ? ` · dari nama berkas PDF: ${formatRupiah(n.realisasiBerkas)}`
                              : "")
                          : undefined
                      }
                    >
                      {formatRupiah(n.realisasi)}
                    </td>
                    <td
                      className="dk-num dk-persen"
                      title={
                        n.tipe === "akun"
                          ? "Persentase realisasi kode akun terhadap pagu kegiatan"
                          : undefined
                      }
                    >
                      {n.pagu || n.persen > 0 ? (
                        <>
                          <span style={{ color: persenColor(n.persen) }}>
                            {n.persen.toFixed(2)}%
                          </span>
                          <span className="dk-mini-bar">
                            <span
                              style={{
                                width: `${Math.max(0, Math.min(100, n.persen))}%`,
                                background: persenColor(n.persen),
                              }}
                            />
                          </span>
                        </>
                      ) : (
                        <span className="dk-kosong">—</span>
                      )}
                    </td>
                    <td className="dk-tanggal">{isoToTglId(n.tanggal)}</td>
                    <td className="dk-bukti">
                      {n.jumlahBerkas > 0 ? (
                        <button
                          type="button"
                          className="dk-btn-dok"
                          onClick={() => setModalBerkas(n)}
                          title={
                            n.salinan && n.salinan.length > 0
                              ? `Lihat daftar bukti kerja (SPM) — ${n.salinan.length} salinan tidak dihitung`
                              : "Lihat daftar bukti kerja (SPM)"
                          }
                        >
                          📎 {n.jumlahBerkas} berkas
                        </button>
                      ) : n.link ? (
                        <span className="dk-kosong">Belum ada</span>
                      ) : (
                        <span className="dk-kosong">—</span>
                      )}
                      {n.link && (
                        <a
                          className="dk-link-drive"
                          href={n.link}
                          target="_blank"
                          rel="noreferrer"
                          title={`Buka folder Drive: ${n.kode}`}
                        >
                          ↗
                        </a>
                      )}
                      {isAdmin && n.lokal && (
                        <button
                          type="button"
                          className="dk-btn-hapus"
                          onClick={() => handleHapusTambahan(n.kode)}
                          title="Hapus data tambahan ini"
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="dk-empty">
                  {loading
                    ? "Mengambil data kegiatan dari Google Drive..."
                    : adaFilter
                    ? "Tidak ada kegiatan yang cocok dengan filter."
                    : "Belum ada data kegiatan di Google Drive."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {error && <div className="alert alert-danger dk-alert">{error}</div>}

      <p className="dk-hint">
        Kode dipangkas berjenjang seperti alur digital: <code>7769</code> (kode
        induk) → <code>7769.AFA</code> (kode cabang) →{" "}
        <code>7769.AFA.001.100</code> (kode detail) → kode kegiatan →{" "}
        <code>521211</code> (kode akun belanja). Pagu diisi manual di{" "}
        <code>src/data/masterData.js → PAGU_KEGIATAN</code> (kunci = kode
        kegiatan lengkap). Realisasi &amp; bukti kerja dibaca langsung dari nama
        berkas SPM di Google Drive (
        <code>SPM [no]_[rekening]_[tanggal]_[nilai]</code>).
      </p>

      {/* ── Modal: daftar bukti kerja ── */}
      {modalBerkas && (
        <div className="modal-overlay" onClick={() => setModalBerkas(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: 720 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h4>
                Bukti Kerja — {modalBerkas.kode}
                {modalBerkas.nama ? ` · ${modalBerkas.nama}` : ""}
                {modalBerkas.tipe ? ` (${LABEL_LEVEL[modalBerkas.tipe]})` : ""}
              </h4>
              <button
                className="modal-close-btn"
                onClick={() => setModalBerkas(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {modalBerkas.berkas && modalBerkas.berkas.length > 0 && (
                <table className="dk-table dk-table-modal">
                <thead>
                  <tr>
                    <th>No. SPM</th>
                    <th>Rekening</th>
                    <th style={{ textAlign: "right" }}>Nilai</th>
                    <th style={{ textAlign: "center" }}>Tanggal</th>
                    <th style={{ textAlign: "right" }}>Ukuran</th>
                  </tr>
                </thead>
                <tbody>
                  {(modalBerkas.berkas || []).map((b) => (
                    <tr key={b.id}>
                      <td>
                        <a
                          href={b.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          title={b.name}
                        >
                          {b.spm.noSpm}
                        </a>
                      </td>
                      <td>
                        {b.spm.rekening} · {namaRekening(b.spm.rekening)}
                      </td>
                      <td className="dk-num">{formatRupiah(b.spm.nilai)}</td>
                      <td className="dk-tanggal">
                        {isoToTglId(b.spm.tanggal)}
                      </td>
                      <td className="dk-num dk-muted">
                        {formatBytes(b.size)}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              )}
              {modalBerkas.lainnya && modalBerkas.lainnya.length > 0 && (
                <>
                  <div className="dk-modal-subhead">
                    Berkas lain ({modalBerkas.lainnya.length}) — nama tidak
                    sesuai pola SPM, tidak dihitung ke realisasi
                  </div>
                  <table className="dk-table dk-table-modal">
                    <thead>
                      <tr>
                        <th>Nama Berkas</th>
                        <th>Rekening</th>
                        <th style={{ textAlign: "right" }}>Ukuran</th>
                        <th style={{ textAlign: "center" }}>Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalBerkas.lainnya.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <a
                              href={b.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              title={b.name}
                            >
                              {b.name}
                            </a>
                          </td>
                          <td>{b.rekening || "—"}</td>
                          <td className="dk-num dk-muted">
                            {formatBytes(b.size)}
                          </td>
                          <td className="dk-tanggal">
                            {b.modifiedTime
                              ? isoToTglId(b.modifiedTime.slice(0, 10))
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              <div className="dk-modal-total">
                Total {modalBerkas.jumlahBerkas} berkas · Realisasi{" "}
                <strong>{formatRupiah(modalBerkas.realisasi)}</strong>
                {modalBerkas.salinan && modalBerkas.salinan.length > 0 && (
                  <span className="dk-muted">
                    {" "}
                    · {modalBerkas.salinan.length} salinan berkas tidak
                    dihitung
                  </span>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              {modalBerkas.link && (
                <button
                  className="btn-submit"
                  style={{ background: "#0284c7", borderColor: "#0284c7" }}
                  onClick={() => window.open(modalBerkas.link, "_blank")}
                >
                  Buka Folder di Drive
                </button>
              )}
              <button className="btn-cancel" onClick={() => setModalBerkas(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: tambah data ── */}
      {modalTambah && (
        <div className="modal-overlay" onClick={tutupModalTambah}>
          <div
            className="modal-box"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h4>Tambah Data Kegiatan</h4>
              <button
                className="modal-close-btn"
                onClick={tutupModalTambah}
                disabled={santaiUpload}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSimpanTambah}>
              <div className="modal-body">
                {/* Kode kegiatan — diisi satu level per satu */}
                <div className="form-group">
                  <label>Kode Kegiatan *</label>
                  <div className="dk-segbar">
                    {Array.from({ length: jumlahLevel }, (_, i) => {
                      const nilai = formTambah.segmen[i] || "";
                      const saran = prefixSegmen(formTambah.segmen, i);
                      const opsi = saranSegmen.get(saran) || [];
                      const listId = `dk-seg-${i}`;
                      return (
                        <React.Fragment key={listId}>
                          {i > 0 && <span className="dk-segdot">.</span>}
                          <span className="dk-segbox">
                            <input
                              type="text"
                              className="filter-select dk-seginput"
                              list={listId}
                              autoComplete="off"
                              spellCheck={false}
                              placeholder={
                                i === 0 ? "7769" : String(i + 1).padStart(2, "0")
                              }
                              value={nilai}
                              onChange={(e) => ubahSegmen(i, e.target.value)}
                              aria-label={LABEL_SEGMEN[i] || `Level ${i + 1}`}
                            />
                            <datalist id={listId}>
                              {opsi.map((o) => (
                                <option key={o} value={o} />
                              ))}
                            </datalist>
                            <small>
                              {LABEL_SEGMEN[i] || `Level ${i + 1}`}
                            </small>
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="dk-segpreview">
                    Kode lengkap:{" "}
                    <code>{kodeGabung || "— belum ada —"}</code>
                  </div>
                  <p className="dk-seghint">
                    Isi satu per satu (pilih dari daftar atau ketik sendiri).
                    Kosongkan sebuah kotak untuk mengulang level tersebut.
                  </p>
                </div>
                <div className="form-group">
                  <label>Nama Kegiatan *</label>
                  <input
                    type="text"
                    className="filter-select"
                    style={{ width: "100%" }}
                    list="dk-saran-nama"
                    placeholder="Contoh: Peny. Kurmod Pelatihan SDA"
                    value={formTambah.nama}
                    onChange={(e) =>
                      setFormTambah({ ...formTambah, nama: e.target.value })
                    }
                    required
                  />
                  <datalist id="dk-saran-nama">
                    {saranNama.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Pagu (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="filter-select"
                      style={{ width: "100%" }}
                      value={formTambah.pagu}
                      onChange={(e) =>
                        setFormTambah({ ...formTambah, pagu: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Realisasi (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="filter-select"
                      style={{ width: "100%" }}
                      value={formTambah.realisasi}
                      onChange={(e) =>
                        setFormTambah({
                          ...formTambah,
                          realisasi: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                {/* Unggah PDF ke folder kegiatan di Google Drive */}
                <div className="form-group">
                  <label>Unggah PDF ke Google Drive (opsional)</label>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="filter-select dk-fileinput"
                    disabled={santaiUpload}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFileTambah(f);
                      setStatusUpload(null);
                      setSubFolderRekening("");
                    }}
                  />
                  {!GOOGLE_CLIENT_ID && (
                    <p className="dk-seghint dk-seghint-warn">
                      Unggahan dinonaktifkan: GOOGLE_CLIENT_ID belum diisi di{" "}
                      <code>src/components/DataKegiatan.js</code>.
                    </p>
                  )}
                  {fileTambah && (
                    <p className="dk-seghint">
                      {fileTambah.name} · {formatBytes(fileTambah.size)}
                    </p>
                  )}
                  {daftarRekening.length > 0 && (
                    <div className="form-group" style={{ marginTop: 8 }}>
                      <label>Simpan ke rekening</label>
                      <select
                        className="filter-select"
                        style={{ width: "100%" }}
                        value={subFolderRekening}
                        disabled={santaiUpload}
                        onChange={(e) => setSubFolderRekening(e.target.value)}
                      >
                        <option value="">— Folder kegiatan (langsung) —</option>
                        {daftarRekening.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.kode} — {namaRekening(r.kode)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {statusUpload && (
                    <p className="dk-uploadstatus">
                      {santaiUpload ? "⏳ " : ""}
                      {statusUpload}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Data disimpan di browser ini (localStorage). Bila kegiatan sudah
                    ada di Google Drive, gunakan folder-nya agar bukti kerja ikut
                    terambil otomatis.
                  </p>
                </div>
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={tutupModalTambah}
                  disabled={santaiUpload}
                >
                  Batal
                </button>
                <button type="submit" className="btn-submit" disabled={santaiUpload}>
                  {santaiUpload ? "Mengunggah…" : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
