import React from "react";
import {
  HISTORI_REVISI_DIPA,
  TAHUN_ANGGARAN_AKTIF,
  DIPA_FOLDER_ARSIP,
} from "../data/masterData";
import { bacaPaguDariPdf, bacaPaguDariFile } from "../data/paguPdf";
import { usePeran } from "../context/PeranContext";

// ============================================================
// Halaman "History Revisi DIPA"
// ------------------------------------------------------------
// Sumber data: Google Drive — folder arsip DIPA ("ARSIP DIPA DAN
// RKKS") yang sama dengan halaman "Dokumen DIPA"
// (src/components/JenisDokumen.js). Root arsip berisi satu folder
// untuk setiap DIPA, mis. "DIPA AWAL TA 2026" dan
// "DIPA REVISI 1..13 TA 2026".
//
//   • Filter Tahun → daftar tahun disusun dari data yang ada di Drive
//                   (tahun tanggal dokumen). DIPA Awal (1 Des 2025) dan
//                   Revisi 1 (28 Des 2025) tampil di 2025; revisi
//                   bertanggal 2026 tampil di 2026. Tahun baru (mis.
//                   2030) otomatis muncul tanpa mengubah kode. Judul ikut
//                   berpindah (History Revisi DIPA TA 2025 → TA 2026 → dst).
//   • Kolom DIPA  → nama folder di Drive.
//   • Tanggal     → nama berkas PDF DIPA di dalam folder,
//                   mis. "DIPA REVISI KE 2, ... (5 Jan 2026).pdf".
//   • Pagu / stamp digital
//                 → dibaca otomatis dari berkas PDF "Surat Pengesahan
//                   Daftar Isian Pelaksanaan Anggaran Petikan" di folder
//                   Drive untuk SEMUA DIPA (Awal & Revisi 1–13).
//                   HISTORI_REVISI_DIPA hanya menjadi cadangan bila PDF
//                   gagal dibaca (dan hanya berlaku untuk TA aktif).
//   • Tambah Data → hanya lewat tombol "Tambah Data" lalu drag &
//                   drop berkas bukti laporan (PDF); DIPA, tanggal, pagu,
//                   dan digital stamp diambil otomatis dari berkas yang
//                   di-drop (dibaca lewat src/data/paguPdf.js → bacaPaguDariFile).
//                   Tidak ada form manual sama sekali.
// ============================================================

// Google Drive Config — API key (sama dengan JenisDokumen.js).
// ID root folder arsip DIPA ada di src/data/masterData.js
// (DIPA_FOLDER_ARSIP). Daftar tahun filter disusun dari isi Drive.
const API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";
const FOLDER_MIME = "application/vnd.google-apps.folder";

/* Sinkronisasi otomatis dari Google Drive (milidetik).
   Halaman mengulang pembacaan folder DIPA secara diam-diam dengan
   interval ini, sehingga perubahan dari Drive langsung terbaca. */
const INTERVAL_SINKRON = 30000;

/* Jam lokal untuk indikator "terakhir disinkronkan" */
function formatJam(d) {
  if (!d) return "";
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Alias nama bulan (Indonesia + Inggris) → indeks bulan (1-12)
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
function nomorRevisi(namaFolder) {
  const nama = String(namaFolder || "").toUpperCase();
  if (/AWAL/.test(nama)) return 0;
  const cocok = nama.match(/REVISI\s*(?:KE)?\s*(\d{1,2})/);
  return cocok ? Number(cocok[1]) : null;
}

/* ── Tahun anggaran dari nama folder ────────────────────────────
   "DIPA AWAL TA 2026"       → 2026
   "DIPA REVISI 7 2026"      → 2026
   "DIPA REVISI 1 TA 2027"   → 2027                          */
function tahunDariNamaFolder(namaFolder) {
  const cocok = String(namaFolder || "").match(/\b(20\d{2})\b/);
  return cocok ? Number(cocok[1]) : null;
}

/* ── Tahun dari tanggal dokumen ─────────────────────────────────
   Dipakai untuk pengelompokan filter tahun: DIPA Awal (1 Des 2025)
   dan Revisi 1 (28 Des 2025) masuk tahun 2025, sedangkan revisi
   yang bertanggal 2026 masuk tahun 2026.                        */
function tahunDariTanggal(tanggal) {
  const cocok = String(tanggal || "").match(/\b(20\d{2})\b/);
  return cocok ? Number(cocok[1]) : null;
}

function labelDipa(nomor) {
  return nomor === 0 ? "DIPA Awal" : `DIPA Revisi ${nomor}`;
}

/* Buka berkas bukti laporan "Surat Pengesahan Daftar Isian
   Pelaksanaan Anggaran Petikan" dari Google Drive (modal tabel History). */
function bukaBuktiDipa(item) {
  const url =
    item && item.dipaBerkasWebViewLink
      ? String(item.dipaBerkasWebViewLink)
      : item && item.dipaBerkasId
      ? `https://drive.google.com/file/d/${item.dipaBerkasId}/view`
      : null;
  if (url && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/* ── Upload bukti laporan ke folder DIPA di Google Drive ─────────
   Data tambahan (drag & drop) sebaiknya juga dikirim ke Drive supaya
   History Revisi DIPA — yang membaca folder DIPA di Drive — otomatis
   menampilkannya (sinkron real-time).                                           */
const TOKEN_KEY_DRIVE = "pu_arsip_drive_token";

function bacaTokenDrive() {
  try {
    return sessionStorage.getItem(TOKEN_KEY_DRIVE) || null;
  } catch (e) {
    return null;
  }
}

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

async function uploadBuktiKeDrive(file, namaFolder, indukId) {
  const token = bacaTokenDrive();
  if (!token) {
    throw new Error(
      "Token Google Drive belum tersedia. Silakan login lewat halaman Drive terlebih dahulu."
    );
  }
  const folder = await buatFolderDrive(token, namaFolder, indukId);
  const up = await unggahBerkasDrive(token, folder.id || indukId, file);
  return up;
}

/* ── Tanggal penetapan dari nama berkas ──────────────────────────
   "(5 Jan 2026)" · "(30 JANUARI 2026)" · "(10 SEPT 2026)"      */
function tanggalDariNama(namaBerkas) {
  const teks = String(namaBerkas || "").replace(/\.[^/.]+$/, "");
  const pola = /(\d{1,2})\s*[- ]\s*([A-Za-z]+)\s*[- ]\s*(\d{4})/g;
  let hasil = null;
  let cocok;
  while ((cocok = pola.exec(teks)) !== null) {
    const bulan = PETA_BULAN[cocok[2].toLowerCase()];
    if (bulan) {
      hasil = `${Number(cocok[1])} ${BULAN[bulan - 1]} ${cocok[3]}`;
      break;
    }
  }
  return hasil;
}

/* ── Peta nilai master per nomor revisi (pagu, stamp, kode, ket) ──
   HISTORI_REVISI_DIPA hanya berisi TA aktif, jadi peta master dipakai
   hanya bila TA pada nama folder = TA aktif. Untuk TA lain peta
   dikosongkan supaya pagu/stamp dibaca dari PDF Drive dan kolom
   kode/keterangan tampil "—". */
function petaMaster(tahun) {
  const peta = new Map();
  if (Number(tahun) !== Number(TAHUN_ANGGARAN_AKTIF)) return peta;
  HISTORI_REVISI_DIPA.forEach((row) => {
    const cocok = String(row.dipa || "").match(/^DIPA\s+REVISI\s*(\d{1,2})/i);
    peta.set(cocok ? Number(cocok[1]) : 0, row);
  });
  return peta;
}

/* ── Akses Google Drive API ─────────────────────────────────────── */
async function listAnak(folderId) {
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

/* ── Susun satu baris tabel dari folder DIPA di Drive ──────────── */
function barisDariFolder(folder, isiFolder, master) {
  const nomor = nomorRevisi(folder.name);
  const berkas = (isiFolder || []).filter((f) => f.mimeType !== FOLDER_MIME);

  // Berkas DIPA = PDF yang namanya diawali "DIPA" (bukan RKKS/KertasKerja).
  const dipaBerkas =
    berkas.find((f) => /^DIPA\b/i.test(f.name) && /pdf/i.test(f.mimeType)) ||
    null;

  let tanggal = dipaBerkas ? tanggalDariNama(dipaBerkas.name) : null;
  if (!tanggal) {
    // Cadangan: berkas lain yang namanya memuat tanggal,
    // mis. "RKKS 8 (6 Mei 2026).pdf".
    const lain = berkas.find((f) => tanggalDariNama(f.name));
    tanggal = lain ? tanggalDariNama(lain.name) : null;
  }

  const ref = master.get(nomor) || {};
  const isiNilai = (v) => (v && v !== "—" ? v : "—");
  return {
    id: `drive_${folder.id}`,
    nomor,
    dipa: labelDipa(nomor),
    tanggal: tanggal || ref.tanggal || "—",
    pagu: isiNilai(ref.pagu),
    keterangan: isiNilai(ref.keterangan),
    link:
      folder.webViewLink ||
      `https://drive.google.com/drive/folders/${folder.id}`,
    jumlahBerkas: berkas.length,
    // Berkas PDF DIPA → sumber pembacaan nominal pagu dari Drive.
    dipaBerkasId: dipaBerkas ? dipaBerkas.id : null,
    dipaBerkasModified: dipaBerkas ? dipaBerkas.modifiedTime : null,
    dipaBerkasName: dipaBerkas ? dipaBerkas.name : null,
    dipaBerkasWebViewLink: dipaBerkas ? dipaBerkas.webViewLink || null : null,
    lokal: false,
  };
}

export default function HistoriRevisiDipa({ setActivePage, periode = null }) {
  /* Mode tamu → tabel tetap tampil, tombol tambah/ubah/hapus disembunyikan. */
  const { isAdmin } = usePeran();
  const [baris, setBaris] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [terakhirUpdate, setTerakhirUpdate] = React.useState(null);
  const [modalTambah, setModalTambah] = React.useState(false);
  const [fileBukti, setFileBukti] = React.useState(null);
  const [dragBukti, setDragBukti] = React.useState(false);

  // Filter tahun anggaran — judul & data tabel ikut berpindah TA.
  // Daftar pilihannya (opsiTahun) disusun dari tahun yang benar-benar
  // ada di Google Drive, jadi tahun baru otomatis muncul.
  /* Tahun dari filter beranda ("Realisasi Data Per Bulan") dipakai
     sebagai nilai awal, supaya History langsung menampilkan TA yang
     sama dengan beranda. Bulan tidak dipakai di halaman ini karena
     dokumen DIPA hanya dikelompokkan per tahun. */
  const tahunPeriode = Number(periode && periode.tahun);
  const [tahun, setTahun] = React.useState(
    Number.isFinite(tahunPeriode) && tahunPeriode > 0
      ? tahunPeriode
      : TAHUN_ANGGARAN_AKTIF
  );
  const [opsiTahun, setOpsiTahun] = React.useState([]);

  /* Bila filter tahun di beranda berubah saat halaman ini terbuka
     (mis. lewat pergantian bulan/tahun otomatis), ikuti tahun itu. */
  React.useEffect(() => {
    const t = Number(periode && periode.tahun);
    if (Number.isFinite(t) && t > 0) setTahun(t);
  }, [periode]);

  // Nilai yang diisi manual, dibaca ulang tiap data dimuat dari Drive.
  const perubahanRef = React.useRef({});

  const pindahHalaman = (halaman) => {
    if (typeof setActivePage === "function") setActivePage(halaman);
  };

  /* ── Muat riwayat revisi dari folder DIPA di Google Drive ──────
     • panggilan normal (tanpa argumen) → tampilkan status "memuat".
     • panggilan { senyap: true } → sinkronisasi otomatis di latar
       belakang: tidak mematikan loading, tidak menampilkan error
       sementara, dan tabel hanya diperbarui bila datanya benar-benar
       berubah (menghindari kedip/refresh yang tidak perlu). */
  const muatData = React.useCallback(async ({ senyap = false } = {}) => {
    if (!senyap) {
      setLoading(true);
      setError(null);
    }
    try {
      // Root folder arsip DIPA di Google Drive.
      const isi = await listAnak(DIPA_FOLDER_ARSIP);
      const folders = isi
        .filter((f) => f.mimeType === FOLDER_MIME)
        .map((f) => ({
          ...f,
          nomor: nomorRevisi(f.name),
          ta: tahunDariNamaFolder(f.name),
        }))
        .filter((f) => f.nomor !== null)
        .sort((a, b) => a.nomor - b.nomor);

      const perubahan = perubahanRef.current;

      // Susun tiap baris lebih dulu (tanpa mengunduh PDF), lalu
      // kelompokkan menurut TAHUN TANGGAL DOKUMEN — bukan tahun pada
      // nama folder. Dengan begitu DIPA Awal (1 Des 2025) dan
      // Revisi 1 (28 Des 2025) tampil di tahun 2025, sedangkan revisi
      // bertanggal 2026 tampil di tahun 2026.
      const dasar = await Promise.all(
        folders.map(async (folder) => {
          let isiFolder = [];
          try {
            isiFolder = await listAnak(folder.id);
          } catch (e) {
            console.warn(`Gagal membaca folder "${folder.name}":`, e);
          }
          const row = barisDariFolder(folder, isiFolder, petaMaster(folder.ta));
          const tahunDokumen = tahunDariTanggal(row.tanggal);
          // Pakai tahun tanggal dokumen; cadangan: tahun nama folder.
          row.tahun = tahunDokumen != null ? tahunDokumen : folder.ta;
          return row;
        })
      );

      // Daftar tahun untuk filter disusun dari data Drive itu sendiri,
      // jadi tahun baru (mis. 2030) otomatis muncul tanpa mengubah kode.
      const tersedia = Array.from(
        new Set(dasar.map((r) => r.tahun).filter((t) => t != null))
      ).sort((a, b) => b - a);
      setOpsiTahun((lama) =>
        lama.length === tersedia.length &&
        lama.every((v, i) => v === tersedia[i])
          ? lama
          : tersedia
      );

      // Pastikan tahun terpilih selalu valid: jika tidak ada di Drive,
      // pakai TA aktif (bila tersedia) atau tahun terbaru yang ada.
      const diminta = Number(tahun);
      const tahunEfektif = tersedia.includes(diminta)
        ? diminta
        : tersedia.includes(TAHUN_ANGGARAN_AKTIF)
        ? TAHUN_ANGGARAN_AKTIF
        : tersedia[0] ?? diminta;
      if (tahunEfektif !== diminta) setTahun(tahunEfektif);

      const terpilih = dasar.filter(
        (r) => Number(r.tahun) === Number(tahunEfektif)
      );

      // Baca nominal pagu & digital stamp dari PDF hanya untuk baris
      // yang benar-benar tampil (hemat unduhan). Semua DIPA (Awal &
      // Revisi 1–13) dibaca dari berkas PDF "Surat Pengesahan Daftar
      // Isian Pelaksanaan Anggaran Petikan" di folder Drive; masterData
      // hanya dipakai sebagai cadangan bila PDF gagal.
      const hasil = await Promise.all(
        terpilih.map(async (row) => {
          if (row.dipaBerkasId) {
            try {
              const pdf = await bacaPaguDariPdf(
                row.dipaBerkasId,
                row.dipaBerkasModified
              );
              if (pdf) {
                if (pdf.pagu) {
                  row.pagu = pdf.pagu;
                  row.paguDariPdf = true;
                }
              }
            } catch (e) {
              console.warn(
                `Gagal membaca pagu dari PDF DIPA Revisi ${row.nomor}:`,
                e
              );
            }
          }

          return perubahan[row.id] ? { ...row, ...perubahan[row.id] } : row;
        })
      );

      setBaris((lama) => {
        const baru = lama
          .filter((r) => r.lokal && Number(r.tahun) === Number(tahunEfektif))
          .concat(hasil)
          .sort((a, b) => {
            if (a.lokal !== b.lokal) return a.lokal ? 1 : -1;
            if (a.lokal) return (a.urutan || 0) - (b.urutan || 0);
            return a.nomor - b.nomor;
          });

        /* Bila isinya sama, kembalikan referensi lama → tidak re-render. */
        const sama =
          baru.length === lama.length &&
          baru.every((r, i) => JSON.stringify(r) === JSON.stringify(lama[i]));
        return sama ? lama : baru;
      });

      setTerakhirUpdate(new Date());
    } catch (e) {
      if (!senyap) {
        console.error("Gagal memuat History Revisi DIPA:", e);
        setError(
          "Gagal mengambil data History Revisi DIPA dari Google Drive. " +
            "Periksa koneksi internet atau API Key."
        );
      } else {
        console.warn("Sinkronisasi otomatis History Revisi DIPA gagal:", e);
      }
    } finally {
      if (!senyap) setLoading(false);
    }
  }, [tahun]);

  /* Muat data pertama kali. */
  React.useEffect(() => {
    muatData();
  }, [muatData]);

  /* Sinkronisasi real-time: polling otomatis dari Google Drive. */
  React.useEffect(() => {
    const id = setInterval(() => muatData({ senyap: true }), INTERVAL_SINKRON);
    return () => clearInterval(id);
  }, [muatData]);

  // Muat ulang saat tab kembali aktif / ada berkas berubah di aplikasi.
  React.useEffect(() => {
    const onUpdate = () => muatData({ senyap: true });
    const onFocus = () => muatData({ senyap: true });
    window.addEventListener("pu_files_updated", onUpdate);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("pu_files_updated", onUpdate);
      window.removeEventListener("focus", onFocus);
    };
  }, [muatData]);

  /* ── Form tambah data: drag & drop bukti laporan PDF ─────────── */
  const bukaTambah = () => {
    setFileBukti(null);
    setDragBukti(false);
    setModalTambah(true);
  };

  /* Tambah baris baru DIPA Revisi dari nilai yang sudah final (hasil
     baca otomatis dari bukti laporan yang di-drop). */
  const tambahBarisDariNilai = (nilai) => {
    const cocok = String(nilai.dipa || "").match(/(\d{1,2})\s*$/);
    setBaris((lama) => [
      ...lama,
      {
        ...nilai,
        id: `lokal_${Date.now()}`,
        nomor: cocok ? Number(cocok[1]) : null,
        tahun,
        lokal: true,
        urutan: (lama[lama.length - 1]?.urutan || 0) + 1,
        jumlahBerkas: 0,
      },
    ]);
    setModalTambah(false);
  };

  /* Baca bukti laporan ("Surat Pengesahan Daftar Isian Pelaksanaan
     Anggaran Petikan") dari berkas lokal yang baru di-drop → otomatis
     membentuk nilai baris tambahan (DIPA, tanggal, pagu, digital stamp). */
  const simpanBarisDariFile = async (file) => {
    const bukti = await bacaPaguDariFile(file);
    const nama = String(file.name || "").toUpperCase();
    const cocokAwal = /DIPA\s+AWAL/.test(nama);
    const cocokRev = nama.match(/DIPA\s+REVISI\s*(?:KE)?\s*(\d{1,2})/);
    const nomor = cocokAwal ? 0 : cocokRev ? Number(cocokRev[1]) : null;
    const dipa = cocokAwal ? "DIPA Awal" : nomor ? `DIPA Revisi ${nomor}` : "—";
    const tanggal = tanggalDariNama(file.name) || "—";
    const nilai = {
      dipa,
      tanggal,
      pagu: bukti.pagu != null ? String(bukti.pagu) : "—",
      keterangan: "—",
    };
    // Upload ke folder DIPA di Google Drive supaya History (yang membaca
    // folder Drive) menampilkannya secara otomatis (sinkron real-time).
    const tahunUpload = (() => {
      const cocokT = String(tanggal || "").match(/\b(20\d{2})\b/);
      return cocokT
        ? Number(cocokT[1])
        : Number(tahun) || Number(TAHUN_ANGGARAN_AKTIF);
    })();
    const namaFolderUpload = `${dipa} TA ${tahunUpload}`;
    try {
      await uploadBuktiKeDrive(file, namaFolderUpload, DIPA_FOLDER_ARSIP);
    } catch (e) {
      console.warn("Upload ke Drive gagal — menyimpan lokal saja:", e);
    }
    tambahBarisDariNilai(nilai);
  };

  /* Drag & drop handler untuk modal "Tambah Data Revisi DIPA" — hanya
     menerima berkas bukti laporan (PDF) lewat drag & drop. */
  const onDragOverBukti = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragBukti(true);
  };

  const onDragLeaveBukti = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragBukti(false);
  };

  const onDropBukti = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragBukti(false);
    const file =
      e.dataTransfer && e.dataTransfer.files ? e.dataTransfer.files[0] : null;
    if (!file) return;
    setFileBukti(file);
    try {
      await simpanBarisDariFile(file);
    } catch (err) {
      console.error("Gagal membaca bukti laporan dari berkas yang di-drop:", err);
      alert("Gagal membaca bukti laporan dari berkas yang di-drop.");
    }
  };

  const hapusBaris = (row) => {
    setBaris((lama) => lama.filter((r) => r.id !== row.id));
  };

  return (
    <div className="site-content" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <div className="hrd-page">
        {/* ── Breadcrumb ── */}
        <nav className="hrd-breadcrumb" aria-label="Breadcrumb">
          <button
            type="button"
            className="hrd-crumb-link"
            onClick={() => pindahHalaman(isAdmin ? "dashboard" : "tamu")}
          >
            Dashboard
          </button>
          <span className="hrd-crumb-sep">/</span>
          <button
            type="button"
            className="hrd-crumb-link"
            onClick={() => pindahHalaman("data-kegiatan")}
          >
            Data Kegiatan
          </button>
          <span className="hrd-crumb-sep">/</span>
          <span className="hrd-crumb-current">
            History Revisi DIPA TA {tahun}
          </span>
        </nav>

        {/* ── Kartu tabel ── */}
        <section className="hrd-card">
          <header className="hrd-card-head">
            <h1 className="hrd-title">
              History Revisi DIPA TA {tahun}
            </h1>
            <div className="hrd-head-actions">
              <label className="hrd-filter" htmlFor="hrd-filter-tahun">
                <span>Tahun:</span>
                <select
                  id="hrd-filter-tahun"
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  title="Pindah tahun History Revisi DIPA (daftar mengikuti data di Google Drive)"
                >
                  {(opsiTahun.length ? opsiTahun : [tahun]).map((t) => (
                    <option key={t} value={t}>
                      TA {t}
                    </option>
                  ))}
                </select>
              </label>
              {!isAdmin && (
                <span
                  className="tm-inline-badge"
                  title="Tamu hanya bisa melihat data, tidak bisa menambah atau mengubahnya"
                >
                  👁 Mode Tamu · baca saja
                </span>
              )}
              <span className="hrd-source">
                {loading
                  ? "Mengambil data dari Google Drive…"
                  : `Live Google Drive · ${baris.length} data${
                      terakhirUpdate
                        ? ` · sinkron pk. ${formatJam(terakhirUpdate)} WIB`
                        : ""
                    }`}
              </span>
              <button
                type="button"
                className="hrd-btn-ghost hrd-refresh-btn"
                onClick={muatData}
                disabled={loading}
                title="Muat ulang dari Google Drive"
              >
                ⟳ Muat Ulang
              </button>
              {isAdmin && (
                <button type="button" className="hrd-add-btn" onClick={bukaTambah}>
                  + Tambah Data
                </button>
              )}
            </div>
          </header>

          <div className="hrd-table-wrap">
            <table className="hrd-table">
              <thead>
                <tr>
                  <th className="hrd-col-no">No</th>
                  <th className="hrd-col-dipa">DIPA</th>
                  <th className="hrd-col-tanggal">Tanggal Penetapan</th>
                  <th className="hrd-col-pagu">Pagu (Rp)</th>
                  <th className="hrd-col-ket">Keterangan</th>
                  <th className="hrd-col-bukti">Bukti</th>
                  {isAdmin && <th className="hrd-col-aksi">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {baris.length > 0 ? (
                  baris.map((item, index) => (
                    <tr key={item.id}>
                      <td className="hrd-col-no">{index + 1}</td>
                      <td
                        className="hrd-cell-strong"
                        title={
                          item.link
                            ? `Folder Drive: ${item.jumlahBerkas} berkas`
                            : undefined
                        }
                      >
                        {item.dipa}
                      </td>
                      <td>{item.tanggal}</td>
                      <td className="hrd-col-pagu">{item.pagu}</td>
                      <td className="hrd-cell-ket" title={item.keterangan}>
                        {item.keterangan}
                      </td>
                      <td className="hrd-col-bukti">
                        {(item.dipaBerkasId || item.dipaBerkasWebViewLink) ? (
                          <button
                            type="button"
                            className="hrd-row-btn"
                            onClick={() => bukaBuktiDipa(item)}
                            title={
                              item.dipaBerkasName
                                ? `Buka bukti laporan: ${item.dipaBerkasName}`
                                : "Buka bukti laporan: Surat Pengesahan Daftar Isian Pelaksanaan Anggaran Petikan"
                            }
                          >
                            📄
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      {isAdmin && (
                        <td className="hrd-col-aksi">
                          {item.lokal && (
                            <button
                              type="button"
                              className="hrd-row-btn hrd-row-btn-danger"
                              onClick={() => hapusBaris(item)}
                              title="Hapus baris tambahan ini"
                            >
                              🗑
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="hrd-empty">
                      {loading
                        ? `Mengambil data History Revisi DIPA tahun ${tahun} dari Google Drive...`
                        : error
                        ? "Belum ada data. Coba tombol “Muat Ulang”."
                        : `Belum ada dokumen DIPA bertanggal tahun ${tahun} di Google Drive. Pengelompokan mengikuti tanggal dokumen (DIPA Awal 1 Des 2025 → tahun 2025).`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {error && <div className="alert alert-warn hrd-alert">{error}</div>}
        </section>
      </div>

      {/* ── Modal Tambah Data (drag & drop bukti laporan) ── */}
      {modalTambah && (
        <div
          className="hrd-modal-overlay"
          role="presentation"
          onClick={() => setModalTambah(false)}
        >
          <div
            className="hrd-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hrd-modal-head">
              <h2>Tambah Data Revisi DIPA</h2>
              <button
                type="button"
                className="hrd-modal-close"
                aria-label="Tutup"
                onClick={() => setModalTambah(false)}
              >
                ×
              </button>
            </div>

            <div className="hrd-modal-body">
              <div className="hrd-field">
                <span>Bukti laporan — drag &amp; lepas berkas PDF</span>
                <div
                  className={`hrd-dropzone${dragBukti ? " hrd-dropzone-active" : ""}${
                    fileBukti ? " hrd-dropzone-filled" : ""
                  }`}
                  onDragOver={onDragOverBukti}
                  onDragEnter={onDragOverBukti}
                  onDragLeave={onDragLeaveBukti}
                  onDrop={onDropBukti}
                >
                  <span className="hrd-dropzone-logo" aria-hidden="true">
                    📄
                  </span>
                  <span className="hrd-dropzone-text">
                    {dragBukti
                      ? "Lepaskan berkas bukti laporan di sini..."
                      : "Tarik & lepas berkas bukti laporan (Surat Pengesahan Daftar Isian Pelaksanaan Anggaran Petikan) PDF ke sini"}
                  </span>
                  <span className="hrd-dropzone-hint">
                    Sistem hanya menerima drag &amp; drop — DIPA, tanggal, pagu, dan digital stamp diambil otomatis dari berkas.
                  </span>
                  {fileBukti ? (
                    <span className="hrd-dropzone-selected">
                      <span className="hrd-dropzone-filename">{fileBukti.name}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="hrd-modal-foot">
              <button
                type="button"
                className="hrd-btn-ghost"
                onClick={() => setModalTambah(false)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}