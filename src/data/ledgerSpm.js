/* ══════════════════════════════════════════════════════════════
   LEDGER SPM — "REKAP SPM KUMULATIF PER BULAN.XLSX"
   ------------------------------------------------------------
   Sumber bukti laporan SPM yang otoritatif: spreadsheet
   "Rekap SPM kumulatif per bulan.xlsx" di folder SPJ Drive.

   Isi tiap tab (Jan, Jan-Feb, Jan-Maret, … Jan-Sept) KUMULATIF
   sejak Januari, dengan baris per SPM:

     7770                                   | 552.780
     EBA                                    | 552.780
     12.694423.WA.7770.EBA.994.002.C        | 552.780
     12.694423.WA.7770.EBA.994.002.C.522112 | 552.780
        Nomor SPM : 00006T Akun 522112 …     | 552.780
                   (12-01-2026)
     Total                                  | 552.780

   Baris "Nomor SPM : …" inilah satu bukti laporan SPM: berisi
   nomor SPM, rekening, TANGGAL SPM, dan nilainya. Karena tanggalnya
   ada di sini,unlike PDF di Drive yang namanya sering tidak
   standar, filter bulan bisa tepat sasaran.

   Cara baca: GVIZ (CORS-friendly & live). Kolom yang dipakai:
     A = No · B = Kode · C = Kegiatan/Output/Paket/Akun/Nomor SPM
     D = Realisasi SPM
   ══════════════════════════════════════════════════════════════ */

import { BULAN_ANGGARAN_OPTIONS } from "./masterData";

export const SPJ_FOLDER_ID = "1gZkmFPnVyWO5fqWLsHGAv_eu56WOdt_8";
const API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";
const MIME_SPREADSHEET =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const POLA_NAMA_REKAP = /rekap.*spm.*kumulatif/i;
/* Dipakai kalau pencarian berkas di folder SPJ gagal (offline/API error). */
const REKAP_ID_CADANGAN = "105E2JFMvqK67xxSmoqoE0whcGWm8S8tu";

const KUNCI_CACHE = "pu_ledger_spm_v2";
const UMUR_CACHE_MS = 5 * 60 * 1000; // 5 menit

const URUTAN_BULAN = BULAN_ANGGARAN_OPTIONS.map((b) => b.id);
const NOMOR_BULAN = URUTAN_BULAN.reduce((peta, id, i) => {
  peta[id] = i + 1;
  return peta;
}, {});

/* ── ID spreadsheet rekap ─────────────────────────────────────── */
let idRekap = null;
async function cariIdRekap() {
  if (idRekap) return idRekap;
  try {
    const params = new URLSearchParams({
      q: `'${SPJ_FOLDER_ID}' in parents and trashed=false and mimeType='${MIME_SPREADSHEET}'`,
      fields: "files(id,name,mimeType)",
      pageSize: "50",
      key: API_KEY,
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

/* ── Angka Indonesia ("552.780") → number ─────────────────────── */
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

/* ── Kunci pembanding kode ───────────────────────────────────── */
export function kunciKode(kode) {
  return String(kode || "")
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

/* ── Baca satu tab lewat GVIZ ────────────────────────────────── */
async function bacaTabGviz(sheetId, tab) {
  const params = new URLSearchParams({
    tqx: "out:json",
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
  if (awal === -1) throw new Error("Balasan GVIZ tidak valid");
  const json = JSON.parse(teks.slice(awal, akhir + 1));
  const tabel = json && json.table;
  if (!tabel || !Array.isArray(tabel.rows)) return [];
  return tabel.rows.map((r) => (r && r.c) || []);
}

/* ── Parse baris tab → ledger per kode kegiatan ─────────────────
   Mengembalikan:
     { per: Map(kode kegiatan → { kode, rows: [{noSpm, rekening,
              tanggal, nilai, uraian}] }), jumlahSpm, total }
   Baris "Total" & baris hierarki (kode induk/cabang) diabaikan;
   yang diambil hanya baris "Nomor SPM : …".                      */
export function parseLedgerTab(rows) {
  const per = new Map();
  let kodeKegiatan = "";
  let rekeningKonteks = "";
  let jumlahSpm = 0;
  let total = 0;

  const ambilBlok = () => {
    if (!kodeKegiatan) return null;
    if (!per.has(kodeKegiatan)) per.set(kodeKegiatan, { kode: kodeKegiatan, rows: [] });
    return per.get(kodeKegiatan);
  };

  rows.forEach((sel) => {
    const kode = String((sel[1] && sel[1].v) || "").trim();
    const uraian = String((sel[2] && sel[2].v) || "").trim();
    const nilai = angkaDariSel(sel[3]);

    /* Baris SPM: "Nomor SPM : 00006T Akun 522112 … (12-01-2026)" */
    if (!kode && /nomor\s*spm/i.test(uraian)) {
      const blok = ambilBlok();
      if (!blok || nilai === null) return;
      const mNo = uraian.match(/nomor\s*spm\s*:?\s*([A-Za-z0-9-]+)/i);
      const mRek = uraian.match(/akun\s+(\d{6})/i);
      const mTgl = uraian.match(/\((\d{1,2})-(\d{1,2})-(\d{4})\)/);
      let tanggal = null;
      if (mTgl) {
        const d = String(mTgl[1]).padStart(2, "0");
        const bl = String(mTgl[2]).padStart(2, "0");
        tanggal = `${mTgl[3]}-${bl}-${d}`;
      }
      const rekening = mRek ? mRek[1] : rekeningKonteks;
      blok.rows.push({
        noSpm: mNo ? mNo[1] : "—",
        rekening,
        tanggal,
        nilai,
        uraian,
      });
      jumlahSpm += 1;
      total += nilai;
      return;
    }

    /* Baris hierarki: kode pada kolom B. */
    if (kode) {
      if (kode.includes(".WA.")) {
        const bagian = kode.split(".WA.").pop();
        const seg = bagian.split(".").filter(Boolean);
        if (seg.length > 5 && /^\d{6}$/.test(seg[seg.length - 1])) {
          rekeningKonteks = seg.pop();
        } else {
          rekeningKonteks = "";
        }
        kodeKegiatan = seg.join(".");
      } else if (/^\d{4}$/.test(kode) || /^[A-Z]{2,3}$/.test(kode)) {
        /* Kode induk / cabang — konteks kegiatan tidak berubah. */
      }
    }
  });

  return { per, jumlahSpm, total };
}

/* ── Ambil ledger SPM untuk satu tab ───────────────────────────
   `tabNama` = nama tab persis di spreadsheet ("Jan", "Jan-Agst").
   Mengembalikan:
     { tabNama, per: Map(kode→blok), jumlahSpm, total, updatedAt }
   atau null bila tab tidak terbaca.                              */
export async function ambilLedgerSpm({ tabNama, paksa = false }) {
  if (!tabNama) return null;
  const sheetId = rekapIdAktif() || (await cariIdRekap());
  if (!sheetId) return null;

  /* Cache lokal: 5 menit, per tab. */
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(KUNCI_CACHE) || "{}");
  } catch (e) {
    cache = {};
  }
  const terdahulu = cache[tabNama];
  if (
    !paksa &&
    terdahulu &&
    Date.now() - (terdahulu.updatedAt || 0) < UMUR_CACHE_MS
  ) {
    return {
      tabNama,
      per: new Map(
        (terdahulu.blok || []).map((b) => [b.kode, { kode: b.kode, rows: b.rows }])
      ),
      jumlahSpm: terdahulu.jumlahSpm,
      total: terdahulu.total,
      updatedAt: terdahulu.updatedAt,
    };
  }

  try {
    const rows = await bacaTabGviz(sheetId, tabNama);
    if (!rows.length) return null;
    const hasil = parseLedgerTab(rows);
    if (!hasil.per.size) return null;
    const payload = {
      tabNama,
      jumlahSpm: hasil.jumlahSpm,
      total: hasil.total,
      blok: [...hasil.per.values()].map((b) => ({ kode: b.kode, rows: b.rows })),
      updatedAt: Date.now(),
    };
    cache[tabNama] = payload;
    try {
      localStorage.setItem(KUNCI_CACHE, JSON.stringify(cache));
    } catch (e) {
      /* abaikan */
    }
    return {
      tabNama,
      per: hasil.per,
      jumlahSpm: hasil.jumlahSpm,
      total: hasil.total,
      updatedAt: payload.updatedAt,
    };
  } catch (e) {
    console.warn(`Gagal membaca ledger SPM tab "${tabNama}":`, e);
    return null;
  }
}

/* ── Bulan (1…12) → id bulan aplikasi ("januari", …) ──────────── */
export function idBulanDariNomor(nomor) {
  return URUTAN_BULAN[Number(nomor) - 1] || null;
}
export function nomorBulanDariId(id) {
  return NOMOR_BULAN[id] || null;
}
