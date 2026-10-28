/* ══════════════════════════════════════════════════════════════
   CACHE DATA KEGIATAN & PEMUATAN DRIVE BACKGROUND
   ------------------------------------------------------------
   Halaman "Data Kegiatan" membaca isi Google Drive (folder kegiatan
   → folder rekening → berkas SPM). Penelusuran lengkap membutuhkan
   banyak permintaan API Google Drive.

   Modul ini:
     1. Menyimpan hasil pembacaan lengkap ke memori dan localStorage,
        sehingga saat halaman "Data Kegiatan" dibuka, data LANGSUNG
        tampil seketika (0 detik) tanpa menunggu penelusuran Drive.
     2. Mendukung pra-muat (pre-fetching) di latar belakang sejak
        aplikasi dibuka (App.js), sehingga cache sudah siap sebelum
        pengguna membuka tab tersebut.
     3. Menyediakan pembaruan bertahap (Tahap 1 folder langsung tampil
        dalam ~1 detik, lalu Tahap 2 rincian rekening & berkas masuk
        secara live tanpa mengosongkan baris yang sudah ada).
   ══════════════════════════════════════════════════════════════ */

import {
  SPJ_FOLDER_ID,
  API_KEY,
  ambilRekapKumulatifTerbaru,
  bacaPaguPerBidang,
  parseBerkasSpm,
} from "./rekapKegiatan";
import { ambilRekapSpm } from "./rekapSpm";
import { PAGU_KEGIATAN, bidangDariKegiatan } from "./masterData";

const KUNCI = "pu_cache_data_kegiatan";
const VERSI = 2;
const FOLDER_MIME = "application/vnd.google-apps.folder";

/* Nama rekening belanja sesuai alur digital */
export const NAMA_REKENING = {
  "521211": "Belanja Bahan",
  "522111": "Belanja Perjalanan Dinas",
  "522131": "Belanja Jasa Konsultan",
  "522151": "Belanja Jasa Profesi",
  "522191": "Belanja Jasa Lainnya",
  "524111": "Belanja Perjalanan Dinas Biasa",
};

export function namaRekening(kode) {
  return NAMA_REKENING[String(kode || "").trim()] || `Rekening ${kode || "—"}`;
}

const SEGMENT_KODE = /^(?:\d{4}|\d{3}[A-Z]?|[A-Z]\d{2}|\d{1,3}|[A-Z]{1,3})$/;

export function parseNamaFolder(namaFolder) {
  const segments = String(namaFolder || "").split(".");
  const kodeParts = [];
  let i = 0;
  for (; i < segments.length; i += 1) {
    const seg = segments[i];
    if (SEGMENT_KODE.test(seg)) {
      kodeParts.push(seg);
      continue;
    }
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

/* Akses Google Drive API dengan pagination */
export async function listAnak(folderId) {
  const hasil = [];
  let pageToken = null;
  let guard = 0;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink)",
      pageSize: "200",
      key: API_KEY,
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

/* Worker antrean konkurensi */
export async function jalankanKolom(items, worker, concurrency = 6) {
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

/* Ambil rekap kumulatif dari spreadsheet (live, GVIZ) */
export async function ambilRekapKumulatifSpreadsheet() {
  const rekap = await ambilRekapKumulatifTerbaru();
  if (!rekap) return null;

  const perPic = new Map();
  if (rekap.rekening && typeof rekap.rekening.forEach === "function") {
    rekap.rekening.forEach((v) => {
      if (v.pic) perPic.set(v.pic, (perPic.get(v.pic) || 0) + (v.realisasi || 0));
    });
  }

  return {
    totalRekap: rekap.total,
    perRekening: rekap.rekening,
    perPic,
    baris: rekap.jumlahRekening,
  };
}

function hitungPersen(realisasi, pagu) {
  const p = Number(pagu) || 0;
  if (p <= 0) return 0;
  return ((Number(realisasi) || 0) / p) * 100;
}

/* ── Serialisasi / Deserialisasi data Map agar aman di localStorage ── */
function serialisasiRekapSheet(rs) {
  if (!rs || !rs.data) return null;
  return {
    total: rs.total,
    rekening: rs.rekening,
    data: {
      totalRekap: rs.data.totalRekap,
      baris: rs.data.baris,
      perRekening: rs.data.perRekening instanceof Map
        ? Array.from(rs.data.perRekening.entries())
        : Array.isArray(rs.data.perRekening) ? rs.data.perRekening : [],
      perPic: rs.data.perPic instanceof Map
        ? Array.from(rs.data.perPic.entries())
        : Array.isArray(rs.data.perPic) ? rs.data.perPic : [],
    },
  };
}

function deserialisasiRekapSheet(rs) {
  if (!rs || !rs.data) return null;
  return {
    total: rs.total,
    rekening: rs.rekening,
    data: {
      totalRekap: rs.data.totalRekap,
      baris: rs.data.baris,
      perRekening: new Map(rs.data.perRekening || []),
      perPic: new Map(rs.data.perPic || []),
    },
  };
}

function serialisasiPaguBidang(pb) {
  if (!pb || !pb.perBidang) return null;
  return {
    totalPagu: pb.totalPagu,
    perBidang: pb.perBidang instanceof Map
      ? Array.from(pb.perBidang.entries())
      : Array.isArray(pb.perBidang) ? pb.perBidang : [],
  };
}

function deserialisasiPaguBidang(pb) {
  if (!pb || !pb.perBidang) return null;
  return {
    totalPagu: pb.totalPagu,
    perBidang: new Map(pb.perBidang || []),
  };
}

/* ── Cache State (In-Memory + LocalStorage) ──────────────────── */
export const UMUR_SEGAR_MS = 5 * 60 * 1000; // 5 menit

let memoriCache = null;
let janjiSedangMuat = null;
const pendengar = new Set();

export function dengarCacheKegiatan(fn) {
  if (typeof fn !== "function") return () => {};
  pendengar.add(fn);
  return () => pendengar.delete(fn);
}

function siarkan(paket) {
  pendengar.forEach((fn) => {
    try {
      fn(paket);
    } catch (e) {
      console.warn("Pendengar cache error:", e);
    }
  });
}

export function simpanCacheKegiatan(rows, extra = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const paket = {
    versi: VERSI,
    disimpan: Date.now(),
    rows,
    rekapSheet: extra.rekapSheet ? deserialisasiRekapSheet(serialisasiRekapSheet(extra.rekapSheet)) : (memoriCache?.rekapSheet || null),
    paguBidang: extra.paguBidang ? deserialisasiPaguBidang(serialisasiPaguBidang(extra.paguBidang)) : (memoriCache?.paguBidang || null),
  };
  memoriCache = paket;
  try {
    const rawToStore = {
      versi: VERSI,
      disimpan: paket.disimpan,
      rows: paket.rows,
      rekapSheet: extra.rekapSheet ? serialisasiRekapSheet(extra.rekapSheet) : (memoriCache?.rekapSheet ? serialisasiRekapSheet(memoriCache.rekapSheet) : null),
      paguBidang: extra.paguBidang ? serialisasiPaguBidang(extra.paguBidang) : (memoriCache?.paguBidang ? serialisasiPaguBidang(memoriCache.paguBidang) : null),
    };
    localStorage.setItem(KUNCI, JSON.stringify(rawToStore));
  } catch (e) {
    console.warn("Gagal menyimpan cache data kegiatan ke localStorage:", e);
  }
  siarkan(paket);
}

export function bacaCacheKegiatan() {
  if (memoriCache && Array.isArray(memoriCache.rows) && memoriCache.rows.length > 0) {
    return memoriCache;
  }
  try {
    const mentah = localStorage.getItem(KUNCI);
    if (!mentah) return null;
    const parsed = JSON.parse(mentah);
    if (!parsed || !Array.isArray(parsed.rows) || parsed.rows.length === 0) {
      return null;
    }
    const paket = {
      versi: parsed.versi || 1,
      disimpan: parsed.disimpan || 0,
      rows: parsed.rows,
      rekapSheet: deserialisasiRekapSheet(parsed.rekapSheet),
      paguBidang: deserialisasiPaguBidang(parsed.paguBidang),
    };
    memoriCache = paket;
    return paket;
  } catch (e) {
    console.warn("Gagal membaca cache data kegiatan:", e);
    return null;
  }
}

export function cacheMasihSegar(cache) {
  if (!cache || !Array.isArray(cache.rows) || cache.rows.length === 0) {
    return false;
  }
  return Date.now() - (cache.disimpan || 0) < UMUR_SEGAR_MS;
}

export function hapusCacheKegiatan() {
  memoriCache = null;
  try {
    localStorage.removeItem(KUNCI);
  } catch (e) {
    /* abaikan */
  }
}

/* Menggabungkan folders baru dari Drive dengan data yang sudah ada di baris lama,
   sehingga rincian rekening, berkas, dan realisasi tidak pernah hilang / ter-reset. */
export function gabungBarisDenganLama(folders, barisLama = []) {
  if (!Array.isArray(barisLama) || barisLama.length === 0) return folders;
  const lamaMap = new Map();
  barisLama.forEach((r) => {
    if (r && r.id) lamaMap.set(r.id, r);
    if (r && r.kode) lamaMap.set(r.kode, r);
  });

  return folders.map((f) => {
    const lama = lamaMap.get(f.id) || lamaMap.get(f.kode);
    if (!lama) return f;
    const adaRek = Array.isArray(lama.rekening) && lama.rekening.length > 0;
    const adaBerkas = Array.isArray(lama.berkas) && lama.berkas.length > 0;
    return {
      ...f,
      rekening: adaRek ? lama.rekening : f.rekening,
      berkas: adaBerkas ? lama.berkas : f.berkas,
      lainnya: lama.lainnya || f.lainnya,
      salinan: lama.salinan || f.salinan,
      realisasi: lama.realisasi !== undefined ? lama.realisasi : f.realisasi,
      realisasiBerkas: lama.realisasiBerkas !== undefined ? lama.realisasiBerkas : f.realisasiBerkas,
      sumberRealisasi: lama.sumberRealisasi || f.sumberRealisasi,
      persen: lama.persen !== undefined ? lama.persen : f.persen,
      tanggal: lama.tanggal || f.tanggal,
      jumlahBerkas: lama.jumlahBerkas !== undefined ? lama.jumlahBerkas : f.jumlahBerkas,
    };
  });
}

/* ── Eksekusi Pemindaian Drive (Latar Belakang / Interaktif) ─── */
export async function muatDataKegiatanDariDrive(opsi = {}) {
  const {
    onTahapSatu,
    onProgress,
    barisTerdahulu = [],
  } = opsi;

  // Tahap 0 — rekap kumulatif spreadsheet + pagu per bidang + realisasi SPM
  let rekap = null;
  let rekapSheetObj = null;
  try {
    rekap = await ambilRekapKumulatifSpreadsheet();
    if (rekap) {
      rekapSheetObj = {
        total: rekap.totalRekap,
        rekening: rekap.perRekening?.size || 0,
        data: rekap,
      };
    }
  } catch (e) {
    console.warn("Gagal membaca rekap spreadsheet:", e);
  }

  let paguBidang = null;
  let mapPagu = new Map();
  try {
    paguBidang = await bacaPaguPerBidang();
    if (paguBidang && paguBidang.perBidang) {
      mapPagu = paguBidang.perBidang;
    }
  } catch (e) {
    console.warn("Gagal membaca pagu bidang:", e);
  }

  ambilRekapSpm(API_KEY).catch((e) =>
    console.warn("Gagal membaca Realisasi SPM:", e)
  );

  // Tahap 1 — daftar folder kegiatan utama (hanya 1 permintaan jaringan)
  const isi = await listAnak(SPJ_FOLDER_ID);
  const folders = isi
    .filter((f) => f.mimeType === FOLDER_MIME)
    .map((f) => {
      const { kode, nama } = parseNamaFolder(f.name);
      const bidang = bidangDariKegiatan(kode, nama);
      const paguManual = Number(PAGU_KEGIATAN[kode]) || 0;
      const paguBidangNilai = bidang ? (mapPagu.get(bidang) || {}).pagu || 0 : 0;
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

  // Gabungkan dengan data lama agar baris yang sudah ada rekening & berkas tetap lengkap
  const foldersMerged = gabungBarisDenganLama(folders, barisTerdahulu);

  if (typeof onTahapSatu === "function") {
    onTahapSatu({
      folders: foldersMerged,
      rekapSheet: rekapSheetObj,
      paguBidang,
    });
  }

  // Tahap 2 — telusuri sub-folder rekening & berkas tiap kegiatan
  const hasilRef = new Map();
  let selesai = 0;
  await jalankanKolom(folders, async (row) => {
    let rekening = [];
    let berkas = [];
    try {
      const isiKegiatan = await listAnak(row.id);
      const subFolder = isiKegiatan.filter((f) => f.mimeType === FOLDER_MIME);
      const berkasLuar = isiKegiatan.filter((f) => f.mimeType !== FOLDER_MIME);

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
            /* ID folder rekening di Drive — dipakai untuk memuat ulang
               berkas secara realtime saat modal bukti SPM dibuka. */
            id: sub.id,
          });
          berkas = berkas.concat(files.map((f) => ({ ...f, rekening: sub.name })));
        },
        4
      );
      rekening = rek.sort((a, b) => a.kode.localeCompare(b.kode, "id"));
      berkas = berkas.concat(berkasLuar.map((f) => ({ ...f, rekening: "" })));
    } catch (e) {
      console.warn(`Gagal membaca folder kegiatan "${row.kode}":`, e);
    }

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

    [
      ...bertanda.filter((b) => !b.spm.duplikat),
      ...bertanda.filter((b) => b.spm.duplikat),
    ].forEach((b) => {
      const key = keyOf(b);
      if (sudah.has(key)) {
        salinan.push(b);
        return;
      }
      sudah.add(key);
      unik.push(b);
    });
    unik.sort((a, b) => (a.spm.tanggal || "").localeCompare(b.spm.tanggal || ""));
    lainnya.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const realisasiBerkas = unik.reduce((s, b) => s + b.spm.nilai, 0);
    const tanggalTerakhir = unik.length ? unik[unik.length - 1].spm.tanggal : null;

    let dariSheet = 0;
    let cocok = 0;
    if (rekap && rekap.perRekening) {
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

    const rowHasil = {
      realisasi,
      realisasiBerkas,
      sumberRealisasi: pakaiSheet ? "Spreadsheet" : "Berkas Drive",
      persen: hitungPersen(realisasi, row.pagu),
      tanggal: tanggalTerakhir,
      jumlahBerkas: unik.length + lainnya.length,
      rekening,
      berkas: unik,
      lainnya,
      salinan,
    };
    hasilRef.set(row.id, rowHasil);

    selesai += 1;
    if (typeof onProgress === "function") {
      onProgress(selesai, folders.length, { id: row.id, ...rowHasil });
    }
  }, 6);

  const lengkap = folders.map((f) =>
    hasilRef.has(f.id) ? { ...f, ...hasilRef.get(f.id) } : f
  );

  // Simpan ke cache
  simpanCacheKegiatan(lengkap, {
    rekapSheet: rekapSheetObj,
    paguBidang,
  });

  return {
    rows: lengkap,
    rekapSheet: rekapSheetObj,
    paguBidang,
  };
}

/* ── Pra-Muat di Latar Belakang (Dipanggil dari App.js) ───────── */
export function praMuatKegiatan(paksa = false) {
  if (process.env.NODE_ENV === "test") return Promise.resolve(null);
  const cache = bacaCacheKegiatan();
  if (!paksa && cacheMasihSegar(cache)) {
    return Promise.resolve(cache);
  }
  if (janjiSedangMuat) {
    return janjiSedangMuat;
  }

  janjiSedangMuat = muatDataKegiatanDariDrive({
    barisTerdahulu: cache?.rows || [],
  })
    .then((res) => {
      janjiSedangMuat = null;
      return res;
    })
    .catch((err) => {
      console.warn("Pra-muat kegiatan gagal:", err);
      janjiSedangMuat = null;
      return null;
    });

  return janjiSedangMuat;
}

export function sedangMemuatKegiatan() {
  return janjiSedangMuat !== null;
}

export { KUNCI as KUNCI_CACHE_KEGIATAN };
