/* ══════════════════════════════════════════════════════════════
   IMPOR FOLDER KEGIATAN (DRAG & DROP)
   ------------------------------------------------------------
   Membaca folder yang dijatuhkan di modal "+ Tambah Data":

     • folder kegiatan beserta SUB-FOLDER rekening;
     • bukti laporan PDF (nama berkas pola SPM_no_rekening_ddmmyy_nilai);
     • berkas Excel/CSV berisi data realisasi (bila ada).

   Angka realisasi per bulan disusun dari:
     1) Excel/CSV di dalam folder (bila ada dan terbaca), atau
     2) jumlah nilai pada nama berkas PDF SPM (bila tidak ada Excel).

   Hasilnya dipakai untuk:
     • menyimpan data kegiatan (localStorage, lihat KegiatanTambahan.js);
     • mengunggah folder & subfolder ke Google Drive;
     • memperbarui realisasi bulanan di Data Kegiatan dan Dashboard.
   ══════════════════════════════════════════════════════════════ */

import * as XLSX from "xlsx";
import { RE_SPM, tglToIso } from "./rekapKegiatan";
import {
  parseNamaFolder,
  kodeRekeningDariNama,
} from "./namaFolderKegiatan";

const EKST_PDF = /\.pdf$/i;
const EKST_CSV = /\.csv$/i;
const EKST_EXCEL = /\.(xlsx|xls|csv)$/i;

const NAMA_BULAN = {
  januari: 1, jan: 1, january: 1,
  februari: 2, feb: 2, february: 2,
  maret: 3, mar: 3, march: 3,
  april: 4, apr: 4,
  mei: 5, may: 5,
  juni: 6, jun: 6, june: 6,
  juli: 7, jul: 7, july: 7,
  agustus: 8, agu: 8, agt: 8, aug: 8, august: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, oct: 10, october: 10,
  november: 11, nov: 11,
  desember: 12, des: 12, dec: 12, december: 12,
};

function duaDigit(n) {
  return String(n).padStart(2, "0");
}

function normalTeks(v) {
  return String(v == null ? "" : v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function kunciFile(path, nama) {
  return [...(path || []), nama].join("/");
}

/* ── Ambil entry drop SECARA SINKRON ─────────────────────────
   `webkitGetAsEntry()` hanya valid selama event drop berlangsung,
   jadi harus dipanggil sebelum proses async apa pun. */
export function ambilEntriDrop(dataTransfer) {
  const hasil = [];
  if (!dataTransfer) return hasil;

  const items = dataTransfer.items;
  if (items && items.length) {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (!item || item.kind !== "file") continue;
      const entry =
        typeof item.webkitGetAsEntry === "function"
          ? item.webkitGetAsEntry()
          : null;
      if (entry) hasil.push(entry);
    }
  }

  /* Fallback: browser/uji tanpa Entry API → pakai daftar File biasa.
     File biasa tidak membawa struktur folder. */
  if (!hasil.length && dataTransfer.files) {
    Array.from(dataTransfer.files).forEach((file) => hasil.push(file));
  }
  return hasil;
}

function fileDariEntry(entry) {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

function bacaSemuaAnak(reader) {
  return new Promise((resolve, reject) => {
    const kumpulan = [];
    const lanjut = () => {
      reader.readEntries((batch) => {
        if (!batch || batch.length === 0) {
          resolve(kumpulan);
          return;
        }
        kumpulan.push(...batch);
        lanjut(); // browser bisa membatasi 100 entri per pembacaan
      }, reject);
    };
    lanjut();
  });
}

async function telusuriEntry(entry, pathInduk, keluar) {
  if (!entry) return;
  if (entry.isFile) {
    const file = await fileDariEntry(entry);
    keluar.push({ file, path: pathInduk.slice() });
    return;
  }
  if (!entry.isDirectory) return;

  const pathBaru = [...pathInduk, entry.name];
  const anak = await bacaSemuaAnak(entry.createReader());
  for (const e of anak) {
    await telusuriEntry(e, pathBaru, keluar);
  }
}

/* Entry drop → [{ file, path }] (path folder, tanpa nama berkas). */
export async function bacaBerkasDrop(entriDrop) {
  const keluar = [];
  for (const entri of entriDrop || []) {
    if (entri && entri.isFile) {
      keluar.push({ file: entri, path: [] });
    } else if (entri && entri.isDirectory) {
      await telusuriEntry(entri, [], keluar);
    } else if (entri) {
      // File biasa (fallback tanpa Entry API)
      keluar.push({ file: entri, path: [] });
    }
  }
  return keluar;
}

/* ── Angka & tanggal dari sel Excel/CSV ─────────────────────── */
function keAngka(nilai) {
  if (typeof nilai === "number") return isFinite(nilai) ? nilai : 0;
  if (nilai == null) return 0;
  let teks = String(nilai).trim();
  if (!teks) return 0;
  teks = teks.replace(/[^\d,.]/g, "");
  if (!teks || teks === "-" || teks === "." || teks === ",") return 0;

  const adaKoma = teks.includes(",");
  const adaTitik = teks.includes(".");
  if (adaKoma && adaTitik) {
    if (teks.lastIndexOf(",") > teks.lastIndexOf(".")) {
      teks = teks.replace(/\./g, "").replace(",", ".");
    } else {
      teks = teks.replace(/,/g, "");
    }
  } else if (adaKoma) {
    // "1,369,000" (pemisah ribuan) vs "1369000,50" (desimal).
    if (/,\d{3}(?:,|$)/.test(teks) && !/,\d{1,2}$/.test(teks)) {
      teks = teks.replace(/,/g, "");
    } else {
      teks = teks.replace(",", ".");
    }
  } else if ((teks.match(/\./g) || []).length > 1) {
    teks = teks.replace(/\./g, "");
  } else if (/^-?\d+\.\d{3}$/.test(teks)) {
    // Format Indonesia: "1.369" = seribu tiga ratus...
    teks = teks.replace(/\./g, "");
  }

  const n = Number(teks);
  return isFinite(n) ? n : 0;
}

function isoDariTanggal(nilai) {
  if (nilai instanceof Date && !isNaN(nilai)) {
    return `${nilai.getFullYear()}-${duaDigit(nilai.getMonth() + 1)}-${duaDigit(
      nilai.getDate()
    )}`;
  }
  if (typeof nilai === "number" && nilai > 0) {
    try {
      const d = XLSX.SSF.parse_date_code(nilai);
      if (d && d.y && d.m && d.d) {
        return `${d.y}-${duaDigit(d.m)}-${duaDigit(d.d)}`;
      }
    } catch (e) {
      /* lanjut ke pembacaan teks */
    }
  }
  const teks = String(nilai == null ? "" : nilai).trim();
  if (!teks) return null;

  let m = teks.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${duaDigit(m[2])}-${duaDigit(m[3])}`;

  m = teks.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const tahun = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    return `${tahun}-${duaDigit(m[2])}-${duaDigit(m[1])}`;
  }

  const d = new Date(teks);
  if (!isNaN(d)) {
    return `${d.getFullYear()}-${duaDigit(d.getMonth() + 1)}-${duaDigit(
      d.getDate()
    )}`;
  }
  return null;
}

function bulanDariNilai(nilai, tahunCadangan) {
  const iso = isoDariTanggal(nilai);
  if (iso) return iso.slice(0, 7);

  const teks = normalTeks(nilai);
  if (!teks) return null;

  // "2026 07", "07 2026"
  let m = teks.match(/^(\d{4})\s+(\d{1,2})$/);
  if (m) return `${m[1]}-${duaDigit(m[2])}`;
  m = teks.match(/^(\d{1,2})\s+(\d{4})$/);
  if (m) return `${m[2]}-${duaDigit(m[1])}`;

  // "juli 2026", "jul 26"
  const kata = teks.split(" ");
  const nomor = NAMA_BULAN[kata[0]];
  if (nomor) {
    const tahun = Number(kata[1]) || Number(tahunCadangan) || new Date().getFullYear();
    const th = String(tahun).length === 2 ? `20${tahun}` : String(tahun);
    return `${th}-${duaDigit(nomor)}`;
  }

  // Angka bulan 1…12
  if (/^\d{1,2}$/.test(teks)) {
    const n = Number(teks);
    if (n >= 1 && n <= 12) {
      return `${Number(tahunCadangan) || new Date().getFullYear()}-${duaDigit(n)}`;
    }
  }
  return null;
}

function cariKolom(header, kandidat) {
  for (let i = 0; i < header.length; i += 1) {
    const h = normalTeks(header[i]);
    if (!h) continue;
    if (kandidat.some((k) => h.includes(k))) return i;
  }
  return -1;
}

/* Cari baris header pada 10 baris pertama, lalu baca baris data. */
function barisRealisasiDariMatriks(matriks) {
  const dasar = (matriks || []).filter(
    (r) => Array.isArray(r) && r.some((c) => String(c == null ? "" : c).trim() !== "")
  );
  if (dasar.length === 0) return [];

  let idxHeader = -1;
  let kolom = null;
  const maks = Math.min(dasar.length, 10);
  for (let i = 0; i < maks; i += 1) {
    const header = dasar[i];
    const cari = {
      tanggal: cariKolom(header, ["tanggal", "tgl", "date", "waktu"]),
      bulan: cariKolom(header, ["bulan", "periode", "month"]),
      tahun: cariKolom(header, ["tahun", "year"]),
      nilai: cariKolom(header, [
        "nilai",
        "realisasi",
        "jumlah",
        "nominal",
        "total",
        "rp",
        "amount",
      ]),
      spm: cariKolom(header, ["no spm", "nomor spm", "nospm", "no. spm", "spm"]),
      rekening: cariKolom(header, ["rekening", "kode akun", "kode"]),
    };
    if (cari.nilai >= 0 && (cari.tanggal >= 0 || cari.bulan >= 0)) {
      idxHeader = i;
      kolom = cari;
      break;
    }
  }
  if (!kolom) return [];

  const hasil = [];
  for (let i = idxHeader + 1; i < dasar.length; i += 1) {
    const row = dasar[i];
    if (!row) continue;
    const nilai = keAngka(row[kolom.nilai]);
    if (!nilai) continue;

    let tahunCadangan = new Date().getFullYear();
    if (kolom.tahun >= 0) {
      const th = Number(String(row[kolom.tahun] || "").replace(/\D/g, ""));
      if (th >= 1900 && th <= 2200) tahunCadangan = th;
    }
    const dariTanggal =
      kolom.tanggal >= 0 ? isoDariTanggal(row[kolom.tanggal]) : null;
    const bulan =
      (dariTanggal && dariTanggal.slice(0, 7)) ||
      (kolom.bulan >= 0
        ? bulanDariNilai(row[kolom.bulan], tahunCadangan)
        : null);
    if (!bulan) continue;

    const spm =
      kolom.spm >= 0 ? String(row[kolom.spm] || "").trim() : "";
    const rekening =
      kolom.rekening >= 0
        ? String(row[kolom.rekening] || "").replace(/\D/g, "").slice(0, 6)
        : "";

    hasil.push({
      bulan,
      tanggal: dariTanggal,
      nilai,
      noSpm: spm,
      rekening,
    });
  }
  return hasil;
}

async function bacaKontenFile(file) {
  if (typeof file.text === "function") {
    try {
      return await file.text();
    } catch (e) {
      /* fallback di bawah */
    }
  }
  if (typeof file.arrayBuffer === "function") {
    try {
      const buf = await file.arrayBuffer();
      const teks = new TextDecoder().decode(buf);
      return teks;
    } catch (e) {
      /* fallback di bawah */
    }
  }
  return String(file);
}

async function bacaExcel(file) {
  const isCsv = EKST_CSV.test(file.name || "");
  let workbook;
  if (isCsv) {
    workbook = XLSX.read(await bacaKontenFile(file), { type: "string" });
  } else {
    let bin = null;
    if (typeof file.arrayBuffer === "function") {
      try {
        bin = await file.arrayBuffer();
      } catch (e) {
        /* lanjut ke mode teks */
      }
    }
    workbook = bin
      ? XLSX.read(bin, { type: "array", cellDates: true })
      : XLSX.read(await bacaKontenFile(file), { type: "string" });
  }

  const hasil = [];
  (workbook.SheetNames || []).forEach((namaSheet) => {
    const sheet = workbook.Sheets[namaSheet];
    if (!sheet) return;
    const matriks = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false,
    });
    hasil.push(...barisRealisasiDariMatriks(matriks));
  });
  return hasil;
}

function akarFolderDari(berkas) {
  for (const b of berkas) {
    for (let i = 0; i < (b.path || []).length; i += 1) {
      const nama = b.path[i];
      const info = parseNamaFolder(nama);
      if (info.kode) return { namaFolder: nama, ...info };
    }
  }
  return { namaFolder: "", kode: "", nama: "" };
}

function rekeningDariPath(path) {
  for (let i = (path || []).length - 1; i >= 0; i -= 1) {
    const kode = kodeRekeningDariNama(path[i]);
    if (kode) return kode;
  }
  return "";
}

/* ── Analisis utama ──────────────────────────────────────────
   `entriDrop` = hasil ambilEntriDrop() (sudah diambil sinkron).
   `opsi.kode` / `opsi.nama` = isian form sebagai cadangan bila
   berkas dijatuhkan tanpa folder kegiatan. */
export async function analisaDropKegiatan(entriDrop, opsi = {}) {
  const berkasDrop = await bacaBerkasDrop(entriDrop);
  if (berkasDrop.length === 0) {
    throw new Error("Tidak ada berkas yang terbaca dari folder yang dijatuhkan.");
  }

  const akar = akarFolderDari(berkasDrop);
  const kode = String(akar.kode || opsi.kode || "").trim();
  const nama = String(akar.nama || opsi.nama || "").trim();

  const berkas = []; // PDF SPM
  const lainnya = []; // Excel/berkas lain
  const files = []; // semua berkas untuk diunggah
  const pdfPerBulan = {};
  const excelKandidat = [];
  let salinan = 0;

  for (const item of berkasDrop) {
    const file = item.file;
    const path = item.path || [];
    files.push({ file, path });

    const ext = String(file.name || "").toLowerCase();
    if (EKST_PDF.test(ext)) {
      const m = String(file.name || "").match(RE_SPM);
      const duplikat = /^copy\s+of\s/i.test(String(file.name || ""));
      if (duplikat) {
        salinan += 1;
        continue;
      }
      if (!m) {
        lainnya.push({
          id: `impor_lain_${kunciFile(path, file.name)}`,
          name: file.name,
          size: file.size,
          path,
          rekening: rekeningDariPath(path),
          webViewLink: null,
        });
        continue;
      }
      const tanggal = tglToIso(m[3]);
      const nilai = Number(m[4]);
      if (!tanggal || !isFinite(nilai)) {
        lainnya.push({
          id: `impor_lain_${kunciFile(path, file.name)}`,
          name: file.name,
          size: file.size,
          path,
          rekening: rekeningDariPath(path),
          webViewLink: null,
        });
        continue;
      }
      const rekening = rekeningDariPath(path) || m[2];
      const spm = {
        noSpm: m[1],
        rekening,
        tanggal,
        nilai,
        duplikat: false,
      };
      berkas.push({
        id: `impor_${spm.noSpm}_${rekening}_${nilai}_${tanggal}`,
        name: file.name,
        size: file.size,
        path,
        rekening,
        spm,
        webViewLink: null,
      });
      const bulan = tanggal.slice(0, 7);
      if (!pdfPerBulan[bulan]) pdfPerBulan[bulan] = 0;
      pdfPerBulan[bulan] += nilai;
      continue;
    }

    if (EKST_EXCEL.test(ext)) {
      let baris = [];
      try {
        baris = await bacaExcel(file);
      } catch (e) {
        console.warn(`Gagal membaca ${file.name}:`, e);
      }
      if (baris.length) {
        excelKandidat.push({ file, path, baris });
      }
      lainnya.push({
        id: `impor_lain_${kunciFile(path, file.name)}`,
        name: file.name,
        size: file.size,
        path,
        rekening: rekeningDariPath(path),
        webViewLink: null,
        excel: true,
        jumlahBaris: baris.length,
      });
      continue;
    }

    lainnya.push({
      id: `impor_lain_${kunciFile(path, file.name)}`,
      name: file.name,
      size: file.size,
      path,
      rekening: rekeningDariPath(path),
      webViewLink: null,
    });
  }

  /* Excel dipakai lebih dulu; bila tidak ada/tidak terbaca, pakai PDF.
     Bila ada beberapa Excel, pilih yang barisnya paling banyak supaya
     tidak menjumlahkan berkas yang isinya saling menimpa. */
  let excelPerBulan = {};
  let excelJumlahSpm = 0;
  let excelSumber = "";
  if (excelKandidat.length) {
    const terpilih = excelKandidat.reduce((a, b) =>
      b.baris.length > a.baris.length ? b : a
    );
    terpilih.baris.forEach((r) => {
      if (!excelPerBulan[r.bulan]) excelPerBulan[r.bulan] = 0;
      excelPerBulan[r.bulan] += r.nilai;
      if (r.noSpm) excelJumlahSpm += 1;
    });
    if (Object.keys(excelPerBulan).length) {
      excelSumber = `Excel/CSV dalam folder (${terpilih.file.name})`;
    }
  }

  const pakaiExcel = Object.keys(excelPerBulan).length > 0;
  const perBulan = pakaiExcel ? excelPerBulan : pdfPerBulan;
  const totalRealisasi = Object.values(perBulan).reduce((a, b) => a + b, 0);
  const bulanList = Object.keys(perBulan).sort();

  return {
    namaFolder: akar.namaFolder || nama,
    kode,
    nama,
    files,
    berkas,
    lainnya,
    salinan,
    perBulan,
    bulanList,
    totalRealisasi,
    jumlahPdf: berkas.length,
    jumlahExcel: excelKandidat.length,
    jumlahSpm: pakaiExcel ? excelJumlahSpm : berkas.length,
    sumber: pakaiExcel
      ? excelSumber
      : berkas.length
      ? "Nama berkas PDF SPM"
      : "Tidak ada bukti nilai (realisasi 0)",
    tanggalTerakhir:
      (bulanList.length ? `${bulanList[bulanList.length - 1]}-01` : null) ||
      new Date().toISOString().slice(0, 10),
  };
}

/* Bersihkan objek File sebelum disimpan (localStorage tidak bisa
   menyimpan File). */
function tanpaFile(b) {
  const { file, ...sisa } = b;
  return sisa;
}

/* Gabungkan hasil impor ke daftar data tambahan.
   Bulan yang ada di impor baru MENIMPA bulan yang sama (bukan
   dijumlahkan), sehingga impor ulang folder yang sama tidak
   menggandakan realisasi. */
export function gabungImporKeDaftar(daftar, impor) {
  const semua = Array.isArray(daftar) ? daftar : [];
  const kode = String(impor.kode || "").trim().toUpperCase();
  const lama = semua.find(
    (t) => String(t.kode || "").trim().toUpperCase() === kode
  );
  const lain = semua.filter(
    (t) => String(t.kode || "").trim().toUpperCase() !== kode
  );

  const perBulan = {
    ...((lama && lama.realisasiPerBulan) || {}),
    ...(impor.perBulan || {}),
  };
  const realisasi = Object.values(perBulan).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  );

  const kunciBerkas = (b) =>
    `${b.spm ? b.spm.noSpm : ""}|${b.spm ? b.spm.rekening : b.rekening || ""}|${
      b.spm ? b.spm.nilai : ""
    }|${b.spm ? b.spm.tanggal : b.name || ""}`;
  const gabungUnik = (a = [], b = []) => {
    const peta = new Map();
    [...a, ...b].forEach((x) => {
      if (x) peta.set(kunciBerkas(x), x);
    });
    return [...peta.values()];
  };

  const baru = {
    ...(lama || {}),
    kode: impor.kode,
    nama: impor.nama || (lama && lama.nama) || "",
    pagu: Number(lama && lama.pagu) || 0,
    realisasi,
    tanggal: impor.tanggalTerakhir || (lama && lama.tanggal) || null,
    realisasiPerBulan: perBulan,
    jumlahSpm: Number(impor.jumlahSpm) || 0,
    sumberRealisasi: impor.sumber || (lama && lama.sumberRealisasi) || "",
    berkas: gabungUnik(lama && lama.berkas, (impor.berkas || []).map(tanpaFile)),
    lainnya: gabungUnik(lama && lama.lainnya, (impor.lainnya || []).map(tanpaFile)),
    jumlahBerkas:
      gabungUnik(lama && lama.berkas, (impor.berkas || []).map(tanpaFile))
        .length,
    imporFolder: true,
    diperbarui: Date.now(),
  };
  return [...lain, baru];
}

/* Penanda agar mudah diuji. */
export { keAngka, isoDariTanggal, bulanDariNilai, barisRealisasiDariMatriks };
