/* ══════════════════════════════════════════════════════════════
   REKAP REALISASI KEGIATAN — SUMBER ANGKA BERSAMA (LIVE)
   ------------------------------------------------------------
   Halaman "Data Kegiatan" dan Dashboard memakai modul ini supaya
   angka realisasinya sama persis dan ikut berubah otomatis begitu
   data di Google Drive / Google Sheets diperbarui.

   SUMBER (live, tanpa login):
     1. SPREADSHEET — tab rekap kumulatif per bulan batas.
        Kolom yang dibaca:
          B = kode rekening · C = realisasi · D = PIC
          E = jumlah SPM · F = status arsip digital
        Baris yang HANYA kolom C-nya terisi dibaca sebagai baris
        TOTAL REKAP KUMULATIF.
        Tab "JAN SD AGUSTUS" berisi realisasi 1 Jan s.d. 31 Agustus,
        dipakai apa adanya sebagai angka kumulatif s.d. Agustus.

     2. GOOGLE DRIVE — nama berkas SPM pada folder SPJ.
        "SPM 321_521211_280726_1369000.pdf" memuat tanggal & nilai,
        sehingga realisasi nyata per bulan bisa dihitung tanpa
        spreadsheet. Dipakai untuk bulan yang BELUM punya tab rekap
        kumulatif (mis. Januari & Februari).

   JANGKAUAN: rekap resmi di Drive baru lengkap sampai AGUSTUS,
   jadi bulan setelahnya sengaja dikosongkan — lebih baik kosong
   daripada menampilkan angka yang tidak ada sumbernya.          */

import { BULAN_ANGGARAN_OPTIONS, TAHUN_ANGGARAN_AKTIF } from "./masterData";

/* ── Konstanta integrasi ───────────────────────────────────── */
export const SPJ_FOLDER_ID = "1gZkmFPnVyWO5fqWLsHGAv_eu56WOdt_8";
export const API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/* Spreadsheet default (dipakai bila tautan lain belum dipasang). */
export const DEFAULT_SHEET_ID = "1DR7lNNAK4UBbFRGqhG2uDB5ANHmz-g8v";

/* Tab rekap kumulatif yang dibaca, dipetakan ke bulan BATASnya.
   ─────────────────────────────────────────────────────────────
   PENTING: data rekap resmi — spreadsheet "Rekap SPM kumulatif
   per bulan" di Drive Arsip Digital — baru lengkap sampai
   AGUSTUS. Tab setelah itu sengaja TIDAK dipakai, dan bulan
   September/desember seterusnya ditampilkan kosong (bukan angka
   turunan), karena tidak ada sumber resmi yang bisa
   dipertanggungjawabkan.

   Untuk memperpanjang jangkauan: perbarui dulu rekap di Drive,
   baru tambahkan satu baris di bawah. Tab yang belum ada di
   spreadsheet otomatis dilewati, jadi tidak akan merusak. */
const TAB_REKAP_KUMULATIF = [
  { bulan: "februari", tab: "JAN SD FEBRUARI" },
  { bulan: "maret", tab: "JAN SD MRT" },
  { bulan: "april", tab: "JAN SD APRIL" },
  { bulan: "mei", tab: "JAN SD MEI" },
  { bulan: "juni", tab: "JAN SD JUNI" },
  { bulan: "juli", tab: "JAN SD JULI" },
  { bulan: "agustus", tab: "JAN SD AGUSTUS" },
];

/* Tab rekap yang dipakai halaman "Data Kegiatan" (kumulatif penuh). */
export const SHEET_TAB_REKAP = "JAN SD AGUSTUS";

/* Urutan bulan (1…12) dari BULAN_ANGGARAN_OPTIONS */
const URUTAN_BULAN = BULAN_ANGGARAN_OPTIONS.map((b) => b.id);
const NOMOR_BULAN = URUTAN_BULAN.reduce((peta, id, i) => {
  peta[id] = i + 1;
  return peta;
}, {});

/* ── Parser nama berkas SPM ──────────────────────────────────
   "SPM 321_521211_280726_1369000.pdf"
     → no 321 · rekening 521211 · 28/07/26 · Rp 1.369.000
   Salinan ("Copy of SPM …") ikut dikenali agar tidak terhitung
   dobel.                                                    */
export const RE_SPM =
  /^(?:copy\s+of\s+)?SPM\s*(\d+)[_\-\s]+(\d{6})[_\-\s]+(\d{6})[_\-\s]+(\d+)/i;

/* "ddmmyy" → "2026-07-28" (ISO).
   Hanya menghasilkan tanggal KALENDER yang benar-benar ada — nama
   berkas dengan tanggal mustahil (mis. hari 32 atau bulan 13)
   dianggap tanpa tanggal (null), bukan ditampilkan sebagai tanggal
   yang tidak valid. Tahun selalu abad ke-21 ("20yy"). */
export function tglToIso(ddmmyy) {
  const teks = String(ddmmyy || "");
  if (!/^\d{6}$/.test(teks)) return null;

  const d = Number(teks.slice(0, 2));
  const m = Number(teks.slice(2, 4));
  const y = 2000 + Number(teks.slice(4, 6));
  if (m < 1 || m > 12) return null;

  // Hari ke-0 bulan berikutnya = hari terakhir bulan `m`
  // (sekaligus menangani tahun kabisat).
  const maksHari = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d < 1 || d > maksHari) return null;

  const bln = String(m).padStart(2, "0");
  const hri = String(d).padStart(2, "0");
  return `${y}-${bln}-${hri}`;
}

/* Saring tanggal SPM agar hanya yang wajar dipakai:
   • tidak boleh di masa depan (SPM selalu sudah terbit), dan
   • harus di tahun anggaran berjalan (TAHUN_ANGGARAN_AKTIF).
   Nama berkas yang salah ketik (mis. "030529" → 03/05/2029)
   dianggap tidak bertanggal, bukan menampilkan tahun palsu. */
function tanggalSpmWajar(iso) {
  if (!iso) return null;

  const tgl = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(tgl.getTime())) return null;

  const batas = new Date();
  batas.setHours(23, 59, 59, 999);
  if (tgl > batas) return null;
  if (tgl.getFullYear() !== TAHUN_ANGGARAN_AKTIF) return null;

  return iso;
}

export function parseBerkasSpm(namaBerkas, rekeningFolder) {
  const m = String(namaBerkas || "").match(RE_SPM);
  if (!m) return null;
  return {
    noSpm: m[1],
    rekening: rekeningFolder || m[2],
    tanggal: tanggalSpmWajar(tglToIso(m[3])),
    tanggalRaw: m[3],
    nilai: Number(m[4]),
    duplikat: /^copy\s+of\s/i.test(String(namaBerkas)),
  };
}

/* ── Pembaca spreadsheet (Google Visualization API / GVIZ) ────
   CORS-friendly & tanpa login, jadi bisa dipanggil langsung dari
   browser.                                                    */
export function sheetIdAktif() {
  try {
    const tersimpan = localStorage.getItem("pu_spreadsheet_link") || "";
    const cocok = tersimpan.match(
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
    );
    return cocok ? cocok[1] : DEFAULT_SHEET_ID;
  } catch (e) {
    return DEFAULT_SHEET_ID;
  }
}

async function gviz(sheetId, tab) {
  const params = new URLSearchParams({
    tqx: "out:json",
    headers: "1",
    t: String(Date.now()),
  });
  /* Tanpa nama tab → Google mengembalikan tab PERTAMA spreadsheet,
     dipakai untuk membaca resume pagu per bidang (lihat
     bacaPaguPerBidang di bawah). */
  if (tab) params.set("sheet", tab);
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

/* ── Baca satu tab rekap kumulatif ─────────────────────────────
   Mengembalikan { total, jumlahSpm, jumlahRekening, rekening }. */
export async function bacaRekapKumulatif(sheetId, tab) {
  const data = await gviz(sheetId, tab);
  const rows = (data && data.table && data.table.rows) || [];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const perRekening = new Map();
  let totalBaris = null;
  let jumlahSpm = 0;

  rows.forEach((r) => {
    const sel = (r && r.c) || [];
    const v = (i) => (sel[i] ? sel[i].v : null);

    const rekening = v(1);
    const realisasi = typeof v(2) === "number" ? v(2) : null;
    if (realisasi === null) return;

    const pic = typeof v(3) === "string" ? v(3).trim() : "";
    const spm = typeof v(4) === "number" ? v(4) : null;
    const status = typeof v(5) === "string" ? v(5).trim() : "";

    // Baris total rekap: hanya kolom realisasi yang terisi. Ambil
    // nilai terbesar agar baris total yang terduplikasi tidak ikut
    // dijumlahkan dua kali.
    const adaIsianLain = [v(0), rekening, pic, spm, status].some(
      (x) => x !== null && x !== undefined && x !== ""
    );
    if (rekening === null && !adaIsianLain) {
      totalBaris =
        totalBaris === null ? realisasi : Math.max(totalBaris, realisasi);
      return;
    }

    const kode = rekening === null ? "" : String(rekening).trim();
    if (!kode) return;
    const sedia = perRekening.get(kode);
    if (!sedia) {
      perRekening.set(kode, { kode, realisasi, spm, pic, status });
      jumlahSpm += Number(spm) || 0;
    } else if (realisasi > sedia.realisasi) {
      // Rekening dobel di tab → ambil nilai terbesar.
      sedia.realisasi = realisasi;
      jumlahSpm += Number(spm) || 0;
    }
  });

  if (!perRekening.size && totalBaris === null) return null;

  // Tanpa baris total, total rekap = penjumlahan per rekening.
  const total =
    totalBaris !== null
      ? totalBaris
      : [...perRekening.values()].reduce((s, x) => s + (x.realisasi || 0), 0);

  return {
    total,
    jumlahSpm,
    jumlahRekening: perRekening.size,
    rekening: perRekening,
  };
}

/* Baca satu tab rekap kumulatif memakai spreadsheet yang sedang
   ditautkan di aplikasi (localStorage) — dipakai halaman "Data
   Kegiatan" agar tidak perlu tahu ID spreadsheet-nya sendiri. */
export function ambilRekapKumulatif(tab = SHEET_TAB_REKAP) {
  return bacaRekapKumulatif(sheetIdAktif(), tab);
}

/* ── Pagu per bidang (resume SP2D) — dari tab pertama spreadsheet ──
   Dibaca live lewat GVIZ; struktur yang dikenali:
     B = nama bidang (SDA / CKPS / UPTU)
     C = Pagu bidang · D = Realisasi bidang
   Dipakai tabel "Data Kegiatan" untuk menghitung persentase tiap
   kegiatan terhadap pagu bidangnya (pagu per KEGIATAN tidak tersedia
   di sumber mana pun — hanya per bidang). Kalau struktur tidak
   dikenali (mis. spreadsheet lain ditautkan), kembalikan null.   */
export async function bacaPaguPerBidang() {
  let data = await gviz(sheetIdAktif());
  if (
    !data ||
    !data.table ||
    !Array.isArray(data.table.rows) ||
    data.table.rows.length === 0
  ) {
    data = await gviz(sheetIdAktif(), "Sheet1");
  }
  const rows = (data && data.table && data.table.rows) || [];
  const perBidang = new Map();
  let totalPagu = 0;

  rows.forEach((r) => {
    const sel = (r && r.c) || [];
    const nama = sel[1] ? String(sel[1].v ?? "").trim() : "";
    if (!/^(SDA|CKPS|UPTU)$/i.test(nama)) return;
    const pagu = nilaiDariSel(sel[2]);
    if (pagu === null || pagu <= 0) return;
    const realisasi = nilaiDariSel(sel[3]) || 0;
    totalPagu += pagu;
    perBidang.set(nama.toUpperCase(), { pagu, realisasi });
  });

  return perBidang.size > 0 ? { perBidang, totalPagu } : null;
}

/* Nilai dari sel GVIZ → number (Rp bisa berformat "1.111.111"). */
function nilaiDariSel(cell) {
  if (!cell) return null;
  if (typeof cell.v === "number") return isFinite(cell.v) ? cell.v : null;
  const mentah = String(cell.v ?? cell.f ?? "").trim();
  if (!mentah) return null;
  const bersih = mentah.replace(/[^\d.,-]/g, "");
  if (!bersih) return null;
  const koma = bersih.includes(",");
  const titik = bersih.includes(".");
  let normal = bersih;
  if (koma && titik) normal = bersih.replace(/\./g, "").replace(",", ".");
  else if (koma) normal = bersih.replace(",", ".");
  else if (titik && /^\d{1,3}(\.\d{3})+$/.test(bersih))
    normal = bersih.replace(/\./g, "");
  const hasil = parseFloat(normal);
  return isFinite(hasil) ? hasil : null;
}

/* ── Ambil seluruh anak folder di Google Drive (paginasi) ───── */
async function listAnakDrive(folderId) {
  const hasil = [];
  let pageToken = null;
  let guard = 0;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType)",
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
    const data = await res.json();
    hasil.push(...(data.files || []));
    pageToken = data.nextPageToken || null;
    guard += 1;
  } while (pageToken && guard < 20);
  return hasil;
}

/* ── Bagian 1: seluruh tab rekap kumulatif (murah, boleh sering) ─ */
async function muatKumulatifSheet() {
  const sheetId = sheetIdAktif();
  const kumulatif = {};
  const tabTerbaca = [];

  const hasil = await Promise.allSettled(
    TAB_REKAP_KUMULATIF.map(async ({ bulan, tab }) => {
      const rekap = await bacaRekapKumulatif(sheetId, tab);
      return rekap ? { bulan, tab, rekap } : null;
    })
  );

  hasil.forEach((h) => {
    if (h.status !== "fulfilled" || !h.value) return;
    const { bulan, tab, rekap } = h.value;
    kumulatif[bulan] = {
      realisasi: rekap.total,
      jumlahSpm: rekap.jumlahSpm,
      jumlahRekening: rekap.jumlahRekening,
    };
    tabTerbaca.push(tab);
  });

  return { sheetId, kumulatif, tabTerbaca, updatedAt: Date.now() };
}

/* ── Bagian 2: rekap per bulan dari nama berkas SPM di Drive ────
   Mahal (±150 permintaan Drive) sehingga di-cache lebih lama.
   Alur digital: Kegiatan → Rekening → berkas SPM.              */
async function muatPerBulanDrive() {
  const perBulan = {};
  const pakaiSpm = (nama) => {
    const spm = parseBerkasSpm(nama);
    if (!spm || !spm.tanggal) return;
    const kunci = spm.tanggal.slice(0, 7); // "2026-07"
    if (!perBulan[kunci]) perBulan[kunci] = { realisasi: 0, jumlahSpm: 0 };
    perBulan[kunci].realisasi += Number(spm.nilai) || 0;
    perBulan[kunci].jumlahSpm += 1;
  };

  const isi = await listAnakDrive(SPJ_FOLDER_ID);
  // Antrean folder diisi bertahap: saat folder kegiatan ditelusuri,
  // sub-folder rekening ikut dimasukkan.
  const antrean = isi
    .filter((f) => f.mimeType === FOLDER_MIME)
    .map((f) => f.id);
  const jumlahKegiatan = antrean.length;
  for (let i = 0; i < antrean.length; i += 1) {
    const isiAnak = await listAnakDrive(antrean[i]);
    isiAnak.forEach((f) => {
      if (f.mimeType === FOLDER_MIME) antrean.push(f.id);
      else pakaiSpm(f.name);
    });
  }

  return { perBulan, jumlahKegiatan, updatedAt: Date.now() };
}

/* Hitung rekap per bulan dari baris kegiatan yang sudah di-page
   Data Kegiatan (tiap baris punya `berkas` berisi SPM terparsing). */
export function rekapPerBulanDariBaris(baris) {
  const perBulan = {};
  (baris || []).forEach((r) => {
    (r.berkas || []).forEach((b) => {
      const iso = b && b.spm && b.spm.tanggal;
      if (!iso) return;
      const kunci = String(iso).slice(0, 7);
      if (!perBulan[kunci]) perBulan[kunci] = { realisasi: 0, jumlahSpm: 0 };
      perBulan[kunci].realisasi += Number(b.spm.nilai) || 0;
      perBulan[kunci].jumlahSpm += 1;
    });
  });
  return perBulan;
}

/* ══════════════════════════════════════════════════════════════
   TOKO DATA BERSAMA (cache + langganan)
   ------------------------------------------------------------
   Dashboard meng-poll tiap beberapa detik, sedangkan "Data
   Kegiatan" mengisi tabelnya bertahap. Tanpa cache keduanya akan
   menggandakan permintaan ke Drive/Sheets. Modul ini menyimpan
   hasil selama TTL dan memberitahukan seluruh pendengar lewat
   dengarRekapKegiatan().

   TTL dibedakan: spreadsheet murah (60 detik), Drive mahal (±150
   permintaan) sehingga 5 menit.                                  */
const TTL_SHEET = 30_000;
const TTL_DRIVE = 300_000;

let cacheSheet = null; // { waktu, kumulatif, ... }
let cacheDrive = null; // { waktu, perBulan, ... }
let sedangSheet = null;
let sedangDrive = null;
const pendengar = new Set();

function gabung() {
  if (!cacheSheet && !cacheDrive) return null;
  const kumulatif = (cacheSheet && cacheSheet.kumulatif) || {};
  const perBulan = (cacheDrive && cacheDrive.perBulan) || {};
  return {
    status: Object.keys(kumulatif).length || Object.keys(perBulan).length
      ? "live"
      : "gagal",
    kumulatif,
    perBulan,
    tabTerbaca: (cacheSheet && cacheSheet.tabTerbaca) || [],
    jumlahKegiatan: (cacheDrive && cacheDrive.jumlahKegiatan) || 0,
    adaSheet: Boolean(cacheSheet),
    adaDrive: Boolean(cacheDrive),
    updatedAt: Math.max(
      (cacheSheet && cacheSheet.updatedAt) || 0,
      (cacheDrive && cacheDrive.updatedAt) || 0
    ),
  };
}

function siarkan() {
  const data = gabung();
  if (!data) return;
  pendengar.forEach((fn) => {
    try {
      fn(data);
    } catch (e) {
      /* abaikan — satu pendengar rusak tidak boleh menghentikan yang lain */
    }
  });
}

/* Daftarkan pendenger rekap kegiatan; langsung diberi data cache
   bila sudah ada. Fungsi ini mengembalikan lepas-daftar. */
export function dengarRekapKegiatan(fn) {
  pendengar.add(fn);
  const data = gabung();
  if (data) {
    try {
      fn(data);
    } catch (e) {
      /* abaikan */
    }
  }
  return () => pendengar.delete(fn);
}

function ambilSheet(paksa) {
  const segar = cacheSheet && Date.now() - cacheSheet.waktu < TTL_SHEET;
  if (segar && !paksa) return Promise.resolve(cacheSheet);
  if (sedangSheet) return sedangSheet;
  sedangSheet = muatKumulatifSheet()
    .then((data) => {
      cacheSheet = { ...data, waktu: Date.now() };
      sedangSheet = null;
      siarkan();
      return cacheSheet;
    })
    .catch((e) => {
      console.warn("Gagal membaca tab rekap kumulatif:", e);
      sedangSheet = null;
      return cacheSheet;
    });
  return sedangSheet;
}

function ambilDrive(paksa) {
  const segar = cacheDrive && Date.now() - cacheDrive.waktu < TTL_DRIVE;
  if (segar && !paksa) return Promise.resolve(cacheDrive);
  if (sedangDrive) return sedangDrive;
  sedangDrive = muatPerBulanDrive()
    .then((data) => {
      cacheDrive = { ...data, waktu: Date.now() };
      sedangDrive = null;
      siarkan();
      return cacheDrive;
    })
    .catch((e) => {
      console.warn("Gagal membaca nama berkas SPM di Drive:", e);
      sedangDrive = null;
      return cacheDrive;
    });
  return sedangDrive;
}

/* Ambil rekap kegiatan (live). Bagian spreadsheet selalu dicoba
   karena murah; bagian Drive diambil dari cache bila masih segar. */
export function ambilRekapKegiatan(paksaSheet = false, paksaDrive = false) {
  return Promise.all([
    ambilSheet(paksaSheet),
    ambilDrive(paksaDrive),
  ]).then(() => gabung() || terbitanFallback());
}

/* Halaman "Data Kegiatan" sudah menelusuri Drive-nya sendiri, jadi
   hasilnya diterbitkan di sini agar halaman lain (Dashboard) tidak
   perlu menelusuri Drive lagi. */
export function terbitkanPerBulanDrive(perBulan, jumlahKegiatan) {
  if (!perBulan || !Object.keys(perBulan).length) return;
  cacheDrive = {
    perBulan,
    jumlahKegiatan: jumlahKegiatan || 0,
    updatedAt: Date.now(),
    waktu: Date.now(),
  };
  siarkan();
}

function terbitanFallback() {
  return {
    status: "gagal",
    kumulatif: {},
    perBulan: {},
    updatedAt: Date.now(),
    jumlahKegiatan: 0,
  };
}

/* ── Angka realisasi untuk satu bulan tertentu ─────────────────
   `bulanId` = "januari" … "desember" (lihat BULAN_ANGGARAN_OPTIONS).
   Tab rekap kumulatif sudah bersifat kumulatif sejak Januari, jadi
   dipakai apa adanya — tidak boleh ditambah dengan angka Drive,
   karena akan menghitung dua kali.

   Pilihan sumber, berurutan dari yang paling resmi:
     · bulan punya tab rekap kumulatif  → angka tab itu
     · bulan setelah jangkauan rekap     → dikosongkan (rekap resmi
                                           di Drive baru lengkap s.d. Agustus)
     · selain itu                         → penjumlahan nama SPM di Drive */
export function rekapSampaiTahun(data, tahun, bulanId) {
  const kosong = {
    ada: false,
    realisasi: 0,
    jumlahSpm: 0,
    jumlahBerkas: 0,
    jumlahRekening: 0,
    bulanIni: 0,
    spmBulanIni: 0,
    sumber: "—",
    bulanDasar: "",
    bulanTerpilihAdaData: false,
    dasar: [],
  };
  // Tab rekap kumulatif & nama berkas SPM hanya berlaku untuk TA aktif.
  if (!data || Number(tahun) !== Number(TAHUN_ANGGARAN_AKTIF)) return kosong;

  const batas = NOMOR_BULAN[bulanId];
  if (!batas) return kosong;

  const kumulatif = data.kumulatif || {};
  const perBulanDrive = data.perBulan || {};

  /* Bulan paling akhir yang punya angka resmi dari spreadsheet —
     menentukan batas jangkauan rekap. */
  const bulanResmi = URUTAN_BULAN.filter((id) => kumulatif[id]);
  const terakhir = bulanResmi.length
    ? NOMOR_BULAN[bulanResmi[bulanResmi.length - 1]]
    : null;

  /* Sebulan dari Drive, atau null bila tidak ada berkas SPM. */
  const driveBulan = (nomor) => {
    const kunci = `${tahun}-${String(nomor).padStart(2, "0")}`;
    const v = perBulanDrive[kunci];
    return v ? { ...v, jumlahRekening: 0 } : null;
  };

  /* Susun angka bulan terpilih (kumulatif sejak Januari). */
  let dasar = [];
  if (kumulatif[bulanId]) {
    // 1) Bulan ini punya tab rekap resmi → dipakai apa adanya.
    dasar = [
      {
        id: bulanId,
        label: (BULAN_ANGGARAN_OPTIONS[batas - 1] || {}).label || bulanId,
        ...kumulatif[bulanId],
        jumlahBerkas: kumulatif[bulanId].jumlahSpm,
        sumber: "Spreadsheet",
      },
    ];
  } else if (terakhir && batas > terakhir) {
    // 2) Bulan SETELAH jangkauan rekap resmi (data di Drive baru
    //    sampai Agustus) → tidak ada sumber yang bisa dipakai, jadi
    //    dikosongkan. Lebih baik "—" daripada angka turunan yang
    //    tidak bisa dipertanggungjawabkan.
    return kosong;
  } else {
    // 3) Bulan sebelum tab rekap pertama, atau sama sekali tidak ada
    //    tab rekap → jumlahkan nama berkas SPM di Drive.
    for (let i = 1; i <= batas; i += 1) {
      const d = driveBulan(i);
      if (!d) continue;
      dasar.push({
        id: URUTAN_BULAN[i - 1],
        label: (BULAN_ANGGARAN_OPTIONS[i - 1] || {}).label,
        realisasi: d.realisasi,
        jumlahSpm: d.jumlahSpm,
        jumlahBerkas: d.jumlahSpm,
        jumlahRekening: 0,
        sumber: "Berkas SPM Drive",
      });
    }
  }

  if (!dasar.length) return kosong;

  const jumlahkan = (list, kunci) =>
    list.reduce((s, b) => s + (Number(b[kunci]) || 0), 0);

  const memakaiSheet = dasar.filter((b) => b.sumber === "Spreadsheet").length;
  const memakaiDrive = dasar.length - memakaiSheet;
  const terakhirDasar = dasar[dasar.length - 1];

  /* Bulan terpilih dikurangi kumulatif s.d. bulan sebelumnya. */
  const bulanSebelumnya =
    batas > 1
      ? rekapSampaiTahun(data, tahun, URUTAN_BULAN[batas - 2])
      : kosong;

  return {
    ada: true,
    realisasi: jumlahkan(dasar, "realisasi"),
    jumlahSpm: jumlahkan(dasar, "jumlahSpm"),
    jumlahBerkas: jumlahkan(dasar, "jumlahBerkas"),
    jumlahRekening: jumlahkan(dasar, "jumlahRekening"),
    bulanIni: Math.max(0, jumlahkan(dasar, "realisasi") - bulanSebelumnya.realisasi),
    spmBulanIni: Math.max(0, jumlahkan(dasar, "jumlahSpm") - bulanSebelumnya.jumlahSpm),
    sumber:
      memakaiDrive === 0
        ? "Spreadsheet rekap"
        : memakaiSheet === 0
        ? "Berkas SPM Drive"
        : "Spreadsheet + Berkas SPM Drive",
    // Bulan terakhir yang benar-benar punya angka. Bila berbeda dari
    // bulan yang sedang difilter (mis. tab rekap belum dibuat untuk
    // Oktober), angka di atas adalah data s.d. bulan ini.
    bulanDasar: terakhirDasar.label || "",
    // True hanya bila bulan yang difilter itu sendiri punya angka —
    // bukan sekadar mewarisi angka bulan sebelumnya.
    bulanTerpilihAdaData: dasar.some((b) => b.id === bulanId),
    dasar,
  };
}
