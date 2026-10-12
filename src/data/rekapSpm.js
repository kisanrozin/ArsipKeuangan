/* ══════════════════════════════════════════════════════════════
   REALISASI SPM — DARI SPREADSHEET "REKAP SPM KUMULATIF PER BULAN"
   ------------------------------------------------------------
   Sumber: folder SPJ di Google Drive (Arsip Digital)
     https://drive.google.com/drive/folders/1gZkmFPnVyWO5fqWLsHGAv_eu56WOdt_8
   Berkas: "Rekap SPM kumulatif per bulan.xlsx"

   CARA MEMBACA
   Berkasnya berformat .xlsx (bukan Google Sheets asli), sehingga
   endpoint export Drive API membalas 403 Forbidden. Yang tetap bisa
   dibaca browser adalah endpoint Google Visualization (GVIZ), jadi
   modul ini memakainya — hasilnya live, berubah begitu spreadsheet
   di Drive diperbarui.

   STRUKTUR TIAP TAB
     A = No
     B = Kode
     C = Kegiatan / Output / Paket / Akun / Nomor SPM
     D = Realisasi SPM

   Tab-tabnya bersifat KUMULATIF sejak Januari:
     Jan · Jan-Feb · Jan-Maret · … · Jan-Agst · Jan-Sept

   ⚠️ HATI-HATI SAAT MENJUMLAHKAN
   Setiap kode diulang pada semua tingkat hierarkinya dengan nilai
   kumulatif yang sama, contoh:
     7770                                            552.780
     EBA                                             552.780
     12.694423.WA.7770.EBA.994.002.C                 552.780
     12.694423.WA.7770.EBA.994.002.C.522112          552.780
   Menjumlahkan seluruh kolom membuat nilainya berlipat (4x pada
   contoh di atas). TOTAL yang benar hanya menjumlahkan baris
   tingkat paling atas, yaitu kode induk program ("7769", "7770").
   ══════════════════════════════════════════════════════════════ */

import { BULAN_ANGGARAN_OPTIONS, TAHUN_ANGGARAN_AKTIF } from "./masterData";

export const SPJ_FOLDER_ID = "1gZkmFPnVyWO5fqWLsHGAv_eu56WOdt_8";

/* Pola nama berkas rekap di folder SPJ. */
const POLA_NAMA_REKAP = /rekap.*spm.*kumulatif/i;
const MIME_SPREADSHEET =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/* Dipakai kalau folder Drive belum bisa dibaca (offline / API error). */
const REKAP_ID_CADANGAN = "105E2JFMvqK67xxSmoqoE0whcGWm8S8tu";

/* Kode induk program TA 2026 — baris tingkat paling atas.
   Angka 4 digit (7769 / 7770); kode cabang memakai huruf
   (EAF / EBA / EBC) sehingga tidak ikut terhitung. */
const POLA_KODE_INDUK = /^\d{4}$/;

/* Tab kumulatif untuk tiap bulan. beberapa nama alternatif
   dicoba lebih dulu, dipakai yang pertama berhasil dibaca. */
const TAB_PER_BULAN = {
  januari: ["Jan", "JANUARI 2026"],
  februari: ["Jan-Feb", "Jan-Februari"],
  maret: ["Jan-Maret", "Jan-Mrt"],
  april: ["Jan-April", "Jan-Apr"],
  mei: ["Jan-Mei", "Jan-May"],
  juni: ["Jan-Juni", "Jun"],
  juli: ["Jan-Juli", "Jul"],
  agustus: ["Jan-Agst", "Jan-Agustus", "Jan-Agus"],
  september: ["Jan-Sept", "Jan-Sep", "Jan-September"],
};

const URUTAN_BULAN = BULAN_ANGGARAN_OPTIONS.map((b) => b.id);
const NOMOR_BULAN = URUTAN_BULAN.reduce((peta, id, i) => {
  peta[id] = i + 1;
  return peta;
}, {});

/* ── Cari ID berkas rekap di dalam folder SPJ ────────────────────
   1 permintaan saja. Kalau gagal, pakai ID cadangan.             */
let idRekap = null;
async function cariIdRekap(apiKey) {
  if (idRekap) return idRekap;
  try {
    const params = new URLSearchParams({
      q: `'${SPJ_FOLDER_ID}' in parents and trashed=false and mimeType='${MIME_SPREADSHEET}'`,
      fields: "files(id,name,mimeType)",
      pageSize: "50",
      key: apiKey,
      t: String(Date.now()),
    });
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const cocok = (data.files || []).find((f) => POLA_NAMA_REKAP.test(f.name || ""));
    if (cocok) {
      idRekap = cocok.id;
      return idRekap;
    }
  } catch (e) {
    console.warn("Gagal mencari berkas rekap di folder SPJ:", e);
  }
  return REKAP_ID_CADANGAN;
}

/* ── Ambil ID spreadsheet rekap (dari localStorage bila ada) ───── */
function rekapIdAktif() {
  try {
    const tersimpan = localStorage.getItem("pu_rekap_spm_link") || "";
    const cocok = tersimpan.match(
      /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
    );
    if (cocok) return cocok[1];
  } catch (e) {
    /* abaikan */
  }
  return null;
}

/* ── Angka Indonesia → number ────────────────────────────────────
   GVIZ biasanya mengirim `v` sebagai angka, tapi pada tab tertentu
   nilainya arrive sebagai teks berformat ("552.780"). Keduanya
   harus ditangani.                                                */
function angkaDariSel(cell) {
  if (!cell) return null;
  if (typeof cell.v === "number") return isFinite(cell.v) ? cell.v : null;
  const mentah = String(cell.v ?? cell.f ?? "").trim();
  if (!mentah || /^[-—–]$/.test(mentah)) return null;
  const bersih = mentah.replace(/[^\d,.-]/g, "");
  if (!bersih) return null;
  const koma = bersih.includes(",");
  const titik = bersih.includes(".");
  let normal = bersih;
  if (koma && titik) normal = bersih.replace(/\./g, "").replace(",", ".");
  else if (koma) normal = bersih.replace(",", ".");
  else if (titik && /^\d{1,3}(\.\d{3})+$/.test(bersih)) normal = bersih.replace(/\./g, "");
  const hasil = parseFloat(normal);
  return isFinite(hasil) ? hasil : null;
}

/* ── Baca satu tab lewat GVIZ ─────────────────────────────────── */
async function bacaTab(spreadsheetId, tab) {
  const params = new URLSearchParams({
    tqx: "out:json",
    sheet: tab,
    t: String(Date.now()),
  });
  const res = await fetch(
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const teks = await res.text();
  const awal = teks.indexOf("{");
  const akhir = teks.lastIndexOf("}");
  if (awal === -1 || akhir === -1) return null;
  let data;
  try {
    data = JSON.parse(teks.slice(awal, akhir + 1));
  } catch (e) {
    return null;
  }

  const tabel = data && data.table;
  const kolom = tabel && tabel.cols;
  const baris = tabel && tabel.rows;
  if (!Array.isArray(kolom) || !Array.isArray(baris)) return null;

  // GVIZ menebak baris header sendiri, jadi cari kolom lewat labelnya
  // dan tidak perlu menebak jumlah baris header.
  const labels = kolom.map((c) => String((c && c.label) || "").trim());
  const idxRealisasi = labels.findIndex((l) => /realisasi\s*spm/i.test(l));
  if (idxRealisasi < 0) return null;
  const idxKode = labels.findIndex((l) => /^kode$/i.test(l));
  /* Kolom uraian: header-nya menyatu beberapa kata ("Kegiatan/Output/
     Paket/Akun/Nomor SPM"), sedangkan kolom pertama berisi judul
     merge panjang ("Data Realisasi Per Paket Pekerjaan Per SPM ...").
     Judul merge itu harus dibuang, kalau tidak kolom uraian akan
     tertukar dan baris "Total" tidak terdeteksi. */
  const kandidatNama = labels
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => /kegiatan|output|paket|akun|nomor\s*spm/i.test(l))
    .filter(({ l }) => !/^data\s+/i.test(l.trim()));
  const idxNama = kandidatNama.length ? kandidatNama[0].i : -1;

  const perKode = new Map();
  let jumlahAngka = 0;
  let barisTotal = null;

  baris.forEach((r) => {
    const sel = (r && r.c) || [];
    const selIdx = (i) => (i >= 0 && sel[i] ? sel[i] : null);
    const teksIdx = (i) => {
      const c = selIdx(i);
      return c ? String(c.v ?? "").trim() : "";
    };

    const nilai = angkaDariSel(selIdx(idxRealisasi));
    if (nilai === null) return;

    const kode = teksIdx(idxKode);
    const nama = teksIdx(idxNama);

    // Baris rekap resmi: kolom Kode kosong dan uraiannya "Total".
    // Ini angka utama yang dipakai — bukan penjumlahan, karena tiap
    // kode terulang pada semua tingkat hierarkinya.
    if (!kode && /^(total|jumlah)\b/i.test(nama)) {
      barisTotal = barisTotal === null ? nilai : Math.max(barisTotal, nilai);
      return;
    }

    if (!kode) return;
    jumlahAngka += 1;

    // Satu kode bisa muncul beberapa kali (mis. dipisah per nomor SPM).
    // Ambil nilai terbesar supaya tidak terhitung dobel.
    const sedia = perKode.get(kode);
    if (sedia) {
      if (nilai > sedia.realisasi) sedia.realisasi = nilai;
      sedia.baris += 1;
    } else {
      perKode.set(kode, { kode, nama, realisasi: nilai, baris: 1 });
    }
  });

  if (!perKode.size && barisTotal === null) return null;

  const daftar = [...perKode.values()].map((x) => ({
    ...x,
    segmen: x.kode.split(".").filter(Boolean).length,
  }));

  /* Cadangan kalau baris "Total" tidak ada: jumlahkan kode induk
     program saja (7769 / 7770), bukan seluruh kolom — menjumlahkan
     semua baris membuat nilainya berlipat. */
  let kodeInduk = daftar.filter((x) => POLA_KODE_INDUK.test(x.kode));
  if (!kodeInduk.length && daftar.length) {
    const minSeg = Math.min(...daftar.map((x) => x.segmen));
    kodeInduk = daftar.filter((x) => x.segmen === minSeg);
  }

  const total =
    barisTotal !== null
      ? barisTotal
      : kodeInduk.reduce((s, x) => s + x.realisasi, 0);

  return {
    tab,
    total,
    dariBarisTotal: barisTotal !== null,
    jumlahAngka,
    kodeInduk: kodeInduk.map((x) => ({
      kode: x.kode,
      nama: x.nama,
      realisasi: x.realisasi,
    })),
    perKode: new Map(daftar.map((x) => [x.kode, x])),
  };
}

/* ── Muat seluruh tab bulanan ──────────────────────────────────── */
export async function muatRekapRealisasiSpm(apiKey) {
  const spreadsheetId = rekapIdAktif() || (await cariIdRekap(apiKey));

  const hasil = await Promise.allSettled(
    URUTAN_BULAN.map(async (bulan) => {
      const namaTab = TAB_PER_BULAN[bulan] || [];
      for (const tab of namaTab) {
        try {
          const data = await bacaTab(spreadsheetId, tab);
          if (data) return { bulan, data };
        } catch (e) {
          // Tab ini tidak ada / tidak terbaca — coba nama berikutnya.
        }
      }
      return null;
    })
  );

  const perBulan = {};
  const tabTerbaca = [];
  hasil.forEach((h) => {
    if (h.status !== "fulfilled" || !h.value) return;
    const { bulan, data } = h.value;
    perBulan[bulan] = data;
    tabTerbaca.push(data.tab);
  });

  return {
    status: tabTerbaca.length ? "live" : "gagal",
    spreadsheetId,
    perBulan,
    tabTerbaca,
    updatedAt: Date.now(),
  };
}

/* ── Angka Realisasi SPM kumulatif s.d. bulan tertentu ───────────
   Tab-tab di spreadsheet sudah kumulatif sejak Januari, jadi nilai
   bulan terpilih dipakai apa adanya.

   Bulan yang TIDAK punya tab (mis. Oktober s.d. Desember, sedangkan
   rekap baru sampai September) sengaja dikosongkan — lebih baik "—"
   daripada menyalin angka bulan sebelumnya.                      */
export function rekapRealisasiSpm(data, tahun, bulanId) {
  const kosong = {
    ada: false,
    total: 0,
    bulanIni: 0,
    jumlahBaris: 0,
    kodeInduk: [],
    sumber: "—",
    bulanDasar: "",
    dasar: [],
  };
  if (!data || Number(tahun) !== Number(TAHUN_ANGGARAN_AKTIF)) return kosong;

  const batas = NOMOR_BULAN[bulanId];
  if (!batas) return kosong;

  const perBulan = data.perBulan || {};
  const tab = perBulan[bulanId];
  // Tanpa tab untuk bulan ini → tidak ada data yang bisa ditampilkan.
  if (!tab) return kosong;

  const dasar = [];
  for (let i = 1; i <= batas; i += 1) {
    const id = URUTAN_BULAN[i - 1];
    const t = perBulan[id];
    if (!t) continue;
    dasar.push({
      id,
      label: (BULAN_ANGGARAN_OPTIONS[i - 1] || {}).label || id,
      tab: t.tab,
      total: t.total,
      kodeInduk: t.kodeInduk,
      sumber: "Spreadsheet",
    });
  }
  if (!dasar.length) return kosong;

  const terpilih = dasar[dasar.length - 1];
  const sebelumnya = dasar.length > 1 ? dasar[dasar.length - 2] : null;

  return {
    ada: true,
    total: terpilih.total,
    bulanIni: sebelumnya
      ? Math.max(0, terpilih.total - sebelumnya.total)
      : terpilih.total,
    jumlahBaris: tab.jumlahAngka,
    kodeInduk: terpilih.kodeInduk,
    sumber: `Spreadsheet "${terpilih.tab}"`,
    bulanDasar: terpilih.label,
    dasar,
  };
}

/* ── Helper bulan ─────────────────────────────────────────────── */

/* "2026-07" → "juli" (null bila formatnya tidak dikenali) */
export function bulanIdDariYm(ym) {
  const bulan = Number(String(ym || "").slice(5, 7));
  if (!bulan || bulan < 1 || bulan > 12) return null;
  return URUTAN_BULAN[bulan - 1];
}

/* Bulan terakhir yang benar-benar punya tab di spreadsheet — bukan
   bulan terakhir kalender, supaya tidak menampilkan "—" padahal
   datanya ada. */
export function bulanTerakhirDenganData(data) {
  const perBulan = (data && data.perBulan) || {};
  for (let i = URUTAN_BULAN.length - 1; i >= 0; i -= 1) {
    if (perBulan[URUTAN_BULAN[i]]) return URUTAN_BULAN[i];
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
   TOKO DATA BERSAMA (cache + langganan)
   ══════════════════════════════════════════════════════════════ */
const TTL_MS = 60_000; // 9 tab GVIZ per menit — murah
let cache = null;
let sedang = null;
const pendengar = new Set();

export function dengarRekapSpm(fn) {
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

export function ambilRekapSpm(apiKey, paksa = false) {
  const segar = cache && Date.now() - cache.waktu < TTL_MS;
  if (segar && !paksa) return Promise.resolve(cache.data);
  if (sedang) return sedang;

  sedang = muatRekapRealisasiSpm(apiKey)
    .then((data) => {
      cache = { data, waktu: Date.now() };
      sedang = null;
      pendengar.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          /* abaikan */
        }
      });
      return data;
    })
    .catch((e) => {
      console.warn("Gagal membaca rekap Realisasi SPM:", e);
      sedang = null;
      return cache
        ? cache.data
        : { status: "gagal", perBulan: {}, updatedAt: Date.now() };
    });
  return sedang;
}
