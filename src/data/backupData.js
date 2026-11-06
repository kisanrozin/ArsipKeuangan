/* ══════════════════════════════════════════════════════════════
   CADANGAN DATA (BACKUP & RESTORE)
   ------------------------------------------------------------
   Data yang diinput lewat aplikasi ini (terutama "+ Tambah Data"
   di halaman Data Kegiatan) disimpan di localStorage browser.
   localStorage mudah hilang bila:
     • tombol "Hapus data situs" / "Clear browsing data" ditekan;
     • browser dipakai di komputer/profil lain;
     • data tidak sengaja ditimpa atau rusak.

   Modul ini mengurangi risiko tersebut dengan:
     1. menyimpan RIWAYAT CADANGAN otomatis sebelum data diubah;
     2. menyediakan EKSPOR berkas .json (bisa disimpan di luar
        browser / komputer / Google Drive);
     3. menyediakan PULIHKAN dari berkas .json maupun riwayat;
     4. memulihkan data yang rusak (JSON tidak valid) dari
        cadangan terakhir yang masih baik.

   Catatan keamanan: cadangan di riwayat tetap berada di browser
   yang sama. Agar aman dari komputer rusak / browser dibersihkan,
   unduh berkas cadangan secara berkala dan simpan di tempat lain.
   ══════════════════════════════════════════════════════════════ */

const KUNCI_RIWAYAT = "pu_riwayat_cadangan_v1";
const KUNCI_HARIAN = "pu_cadangan_harian_v1";
const KUNCI_KEGIATAN = "pu_data_kegiatan_tambahan";
const KUNCI_KEGIATAN_TERAKHIR_BAIK = "pu_data_kegiatan_tambahan_terakhir_baik";
const VERSI = 1;

/* Batasi ukuran agar tidak menghabiskan kuota localStorage
   (kuota umumnya ±5 MB per origin). */
const MAKS_CADANGAN = 12;
const ANGGARAN_BYTE = 1_200_000;

/* Data yang wajib ikut dicadangkan. */
const KUNCI_TETAP = [
  KUNCI_KEGIATAN, // input admin: kegiatan + berkas + realisasi
  "pu_rekap_spm_link", // tautan spreadsheet rekap SPM
  "pu_spreadsheet_link", // tautan spreadsheet utama
  "pu_spreadsheet_name", // nama spreadsheet utama
];

/* Data tambahan dari halaman Dokumen (per folder Drive). */
const PREFIX_DATA = ["pu_local_files_", "pu_deleted_drive_"];

/* Jangan pernah dicadangkan/diekspor:
   token Google bersifat rahasia, peran hanya status tampilan,
   cache besar/derived tidak perlu (bisa dibaca ulang dari Drive). */
const KUNCI_DILARANG = new Set([
  "pu_arsip_drive_token",
  "pu_peran_tampilan",
  "pu_cache_data_kegiatan",
  "pu_pagu_pdf_cache_v1",
  KUNCI_KEGIATAN_TERAKHIR_BAIK,
  KUNCI_RIWAYAT,
  KUNCI_HARIAN,
]);

export function kunciDataValid(kunci) {
  if (typeof kunci !== "string" || !kunci) return false;
  if (KUNCI_DILARANG.has(kunci)) return false;
  if (KUNCI_TETAP.includes(kunci)) return true;
  return (
    kunci.length <= 200 &&
    PREFIX_DATA.some((awalan) => kunci.startsWith(awalan))
  );
}

function ukuranByte(teks) {
  try {
    if (typeof TextEncoder !== "undefined") {
      return new TextEncoder().encode(teks).length;
    }
    return String(teks).length * 2;
  } catch (e) {
    return String(teks).length * 2;
  }
}

function tanggalLokal() {
  const d = new Date();
  const bulan = String(d.getMonth() + 1).padStart(2, "0");
  const hari = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${bulan}-${hari}`;
}

function capWaktu() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

function ringkasData(data) {
  let kegiatan = 0;
  try {
    const isi = JSON.parse((data && data.pu_data_kegiatan_tambahan) || "[]");
    if (Array.isArray(isi)) kegiatan = isi.length;
  } catch (e) {
    /* biarkan 0 — data mungkin rusak; cadangan lama tetap dipakai */
  }
  return {
    kegiatan,
    jumlahKunci: Object.keys(data || {}).length,
  };
}

/* ── Ambil seluruh data aplikasi yang boleh dicadangkan ───────── */
export function ambilDataLokal() {
  const data = {};
  let kunci = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      kunci.push(localStorage.key(i));
    }
  } catch (e) {
    return data;
  }

  kunci.forEach((k) => {
    if (!kunciDataValid(k)) return;
    try {
      const nilai = localStorage.getItem(k);
      if (typeof nilai === "string") data[k] = nilai;
    } catch (e) {
      /* abaikan satu kunci yang tidak bisa dibaca */
    }
  });
  return data;
}

/* ── Riwayat cadangan ─────────────────────────────────────────── */
export function bacaRiwayatCadangan() {
  try {
    const mentah = localStorage.getItem(KUNCI_RIWAYAT);
    if (!mentah) return [];
    const daftar = JSON.parse(mentah);
    if (!Array.isArray(daftar)) return [];
    return daftar
      .filter(
        (c) =>
          c &&
          c.versi &&
          c.data &&
          typeof c.data === "object" &&
          !Array.isArray(c.data)
      )
      .slice(0, MAKS_CADANGAN);
  } catch (e) {
    console.warn("Gagal membaca riwayat cadangan:", e);
    return [];
  }
}

function tulisRiwayatCadangan(daftar) {
  let isi = (daftar || []).slice(0, MAKS_CADANGAN);

  /* Buang cadangan terlama sampai muat dalam anggaran. */
  while (
    isi.length > 1 &&
    ukuranByte(JSON.stringify(isi)) > ANGGARAN_BYTE
  ) {
    isi = isi.slice(0, -1);
  }

  /* Bila kuota browser penuh, coba lagi sambil membuang yang lama. */
  for (let coba = 0; coba < 3 && isi.length > 0; coba += 1) {
    try {
      localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(isi));
      return true;
    } catch (e) {
      if (isi.length === 1) {
        console.warn("Gagal menyimpan cadangan (kuota penuh):", e);
        return false;
      }
      isi = isi.slice(0, -1);
    }
  }
  return false;
}

/* ── Buat satu titik cadangan ─────────────────────────────────── */
export function buatCadangan(opsi = {}) {
  const alasan = opsi.alasan || "manual";
  const data = ambilDataLokal();

  /* Cadangan otomatis tidak perlu dibuat bila memang belum ada data. */
  if (!Object.keys(data).length && alasan !== "manual") {
    return { ok: true, dilewati: true, pesan: "Belum ada data untuk dicadangkan." };
  }

  const cadangan = {
    versi: VERSI,
    id: `cad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dibuat: new Date().toISOString(),
    alasan,
    ringkas: ringkasData(data),
    data,
  };

  const riwayat = bacaRiwayatCadangan();
  riwayat.unshift(cadangan);
  const ok = tulisRiwayatCadangan(riwayat);

  return {
    ok,
    cadangan,
    pesan: ok
      ? "Cadangan berhasil dibuat."
      : "Cadangan gagal disimpan — kuota browser mungkin penuh. Unduh berkas cadangan sebagai gantinya.",
  };
}

/* Satu cadangan per hari saat aplikasi dibuka. Berguna ketika data
   berubah dari tab/perangkat lain atau karena kode lama. */
export function pastikanCadanganHarian() {
  const hari = tanggalLokal();
  try {
    if (localStorage.getItem(KUNCI_HARIAN) === hari) {
      return { ok: true, dilewati: true };
    }
    if (!Object.keys(ambilDataLokal()).length) {
      return { ok: true, dilewati: true };
    }
    const hasil = buatCadangan({ alasan: "harian" });
    if (hasil.ok) localStorage.setItem(KUNCI_HARIAN, hari);
    return hasil;
  } catch (e) {
    return { ok: false, pesan: String((e && e.message) || e) };
  }
}

/* Nilai cadangan terbaru untuk satu kunci — dipakai untuk memulihkan
   data yang rusak tanpa harus membuka halaman cadangan. */
export function cadanganTerbaruUntukKunci(kunci) {
  const riwayat = bacaRiwayatCadangan();
  for (let i = 0; i < riwayat.length; i += 1) {
    const nilai = riwayat[i].data && riwayat[i].data[kunci];
    if (typeof nilai === "string") return nilai;
  }
  return null;
}

/* ── Ringkasan untuk tampilan ─────────────────────────────────── */
export function ringkasanCadangan() {
  const riwayat = bacaRiwayatCadangan();
  const data = ambilDataLokal();
  return {
    riwayat,
    jumlahCadangan: riwayat.length,
    terakhir: riwayat[0] || null,
    dataSekarang: ringkasData(data),
    ukuranRiwayat: ukuranByte(JSON.stringify(riwayat)),
  };
}

/* ── Ekspor ke berkas .json ───────────────────────────────────── */
export function berkasCadangan() {
  const data = ambilDataLokal();
  return {
    aplikasi: "arsip-keuangan-pu",
    versi: VERSI,
    dibuat: new Date().toISOString(),
    ringkas: ringkasData(data),
    data,
  };
}

export function teksCadangan() {
  return JSON.stringify(berkasCadangan(), null, 2);
}

export function unduhCadangan() {
  const teks = teksCadangan();
  const namaBerkas = `cadangan-arsip-keuangan-${capWaktu()}.json`;

  if (typeof document === "undefined" || typeof URL === "undefined") {
    return { namaBerkas, teks };
  }

  const blob = new Blob([teks], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = namaBerkas;
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { namaBerkas, teks };
}

/* ── Baca & validasi berkas cadangan sebelum dipulihkan ───────── */
export function bacaBerkasCadangan(teks) {
  let objek;
  try {
    objek = JSON.parse(teks);
  } catch (e) {
    return { ok: false, pesan: "Berkas bukan JSON yang valid." };
  }

  if (!objek || typeof objek !== "object" || Array.isArray(objek)) {
    return { ok: false, pesan: "Isi berkas cadangan tidak dikenali." };
  }

  const sumber =
    objek.data && typeof objek.data === "object" && !Array.isArray(objek.data)
      ? objek.data
      : objek;

  const data = {};
  Object.entries(sumber || {}).forEach(([kunci, nilai]) => {
    if (!kunciDataValid(kunci)) return;
    if (typeof nilai === "string") {
      data[kunci] = nilai;
    } else if (nilai !== null && typeof nilai === "object") {
      /* Toleransi untuk berkas lama yang menyimpan objek, bukan string. */
      try {
        data[kunci] = JSON.stringify(nilai);
      } catch (e) {
        /* lewati nilai yang tidak bisa diserialisasi */
      }
    }
  });

  if (!Object.keys(data).length) {
    return {
      ok: false,
      pesan: "Tidak ada data aplikasi yang cocok di dalam berkas cadangan.",
    };
  }

  const kegiatan = data.pu_data_kegiatan_tambahan;
  if (kegiatan !== undefined) {
    try {
      if (!Array.isArray(JSON.parse(kegiatan))) {
        return {
          ok: false,
          pesan: "Data kegiatan di berkas cadangan tidak berbentuk daftar.",
        };
      }
    } catch (e) {
      return {
        ok: false,
        pesan: "Data kegiatan di berkas cadangan rusak (JSON tidak valid).",
      };
    }
  }

  return {
    ok: true,
    cadangan: {
      versi: VERSI,
      id: `impor_${Date.now()}`,
      dibuat: objek.dibuat || new Date().toISOString(),
      alasan: "impor",
      ringkas: ringkasData(data),
      data,
    },
  };
}

/* ── Pulihkan data dari cadangan ──────────────────────────────── */
export function pulihkanCadangan(cadangan, opsi = {}) {
  const data = cadangan && cadangan.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, pesan: "Cadangan tidak memiliki data yang valid." };
  }

  const bersih = {};
  Object.entries(data).forEach(([kunci, nilai]) => {
    if (kunciDataValid(kunci) && typeof nilai === "string") {
      bersih[kunci] = nilai;
    }
  });

  if (!Object.keys(bersih).length) {
    return { ok: false, pesan: "Tidak ada data yang bisa dipulihkan." };
  }

  /* Simpan keadaan sekarang dulu supaya pemulihan pun bisa dibatalkan. */
  if (opsi.buatCadanganDulu !== false) {
    buatCadangan({ alasan: "sebelum-pulih" });
  }

  const gagal = [];
  Object.entries(bersih).forEach(([kunci, nilai]) => {
    try {
      localStorage.setItem(kunci, nilai);
      /* Samakan salinan "terakhir baik" dengan data hasil pemulihan,
         supaya pemulihan otomatis tidak mengembalikan versi lain. */
      if (kunci === KUNCI_KEGIATAN) {
        try {
          localStorage.setItem(KUNCI_KEGIATAN_TERAKHIR_BAIK, nilai);
        } catch (e) {
          /* kuota penuh — data utama sudah dipulihkan */
        }
      }
    } catch (e) {
      gagal.push(kunci);
    }
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("pu_data_dipulihkan", {
        detail: { kunci: Object.keys(bersih), gagal },
      })
    );
  }

  return {
    ok: gagal.length === 0,
    jumlah: Object.keys(bersih).length - gagal.length,
    gagal,
    pesan:
      gagal.length === 0
        ? "Data berhasil dipulihkan."
        : `Sebagian data gagal dipulihkan (${gagal.length} kunci).`,
  };
}

/* Dipakai sebagai upaya terakhir saat kuota penuh: prioritaskan data
   utama, korbankan riwayat cadangan daripada gagal menyimpan data. */
export function kosongkanRiwayatCadangan() {
  try {
    localStorage.removeItem(KUNCI_RIWAYAT);
    return true;
  } catch (e) {
    return false;
  }
}

export { KUNCI_RIWAYAT as KUNCI_RIWAYAT_CADANGAN };
