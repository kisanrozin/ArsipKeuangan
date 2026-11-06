/* ══════════════════════════════════════════════════════════════
   DATA KEGIATAN TAMBAHAN (INPUT ADMIN)
   ------------------------------------------------------------
   Tombol "+ Tambah Data" di halaman "Data Kegiatan" menulis baris
   tambahan ke localStorage browser ini. Modul ini menjadi tempat
   tunggal untuk membaca/menulis baris tersebut supaya:

     • halaman admin (DataKegiatan) dan halaman tamu
       (TamuRingkasan) memakai sumber data yang sama;
     • halaman tamu ikut berubah begitu admin menambah data, tanpa
       perlu memuat ulang halaman (pendengar + event "storage"
       untuk tab lain).

   CATATAN: localStorage bersifat per browser/per profil, jadi data
   yang diinput admin di satu komputer belum otomatis terlihat di
   komputer lain. Agar menjadi data bersama lintas perangkat, bagian
   ini nanti cukup diganti dengan penulisan ke Google Sheets/Drive.
   ══════════════════════════════════════════════════════════════ */

import {
  buatCadangan,
  cadanganTerbaruUntukKunci,
  kosongkanRiwayatCadangan,
} from "./backupData";

const KUNCI = "pu_data_kegiatan_tambahan";
/* Salinan data terakhir yang berhasil ditulis. Dipakai bila data
   utama rusak/terpotong, supaya perubahan TERAKHIR pun tidak hilang.
   (Riwayat cadangan menyimpan keadaan sebelum perubahan.) */
const KUNCI_TERAKHIR_BAIK = "pu_data_kegiatan_tambahan_terakhir_baik";

const pendengar = new Set();

/* Baca JSON dengan aman. `null` = isi tidak valid / bukan daftar. */
function uraiDaftar(mentah) {
  if (typeof mentah !== "string" || !mentah) return null;
  try {
    const data = JSON.parse(mentah);
    return Array.isArray(data) ? data : null;
  } catch (e) {
    return null;
  }
}

/* Bentuk baris: { kode, nama, pagu, realisasi, tanggal } */
export function bacaKegiatanTambahan() {
  let mentah = null;
  try {
    mentah = localStorage.getItem(KUNCI);
  } catch (e) {
    console.warn("Penyimpanan browser tidak bisa dibaca:", e);
    return [];
  }

  if (!mentah) return [];

  const data = uraiDaftar(mentah);
  if (data) return data;

  /* Data utama rusak (mis. terpotong saat browser ditutup). Coba
     pulihkan dari salinan tulisan terakhir, lalu dari riwayat
     cadangan, supaya input admin tidak hilang begitu saja. */
  let sumberPulih = null;
  try {
    sumberPulih = localStorage.getItem(KUNCI_TERAKHIR_BAIK);
  } catch (e) {
    /* abaikan */
  }
  let dariSalinan = uraiDaftar(sumberPulih);
  if (!dariSalinan) {
    sumberPulih = cadanganTerbaruUntukKunci(KUNCI);
    dariSalinan = uraiDaftar(sumberPulih);
  }

  if (dariSalinan) {
    console.warn(
      "Data kegiatan tambahan rusak — dipulihkan otomatis dari cadangan/salinan terakhir."
    );
    try {
      localStorage.setItem(KUNCI, sumberPulih);
    } catch (e) {
      /* tampilkan data cadangan walau gagal menulis ulang */
    }
    return dariSalinan;
  }

  console.warn("Gagal membaca data kegiatan tambahan: JSON tidak valid.");
  return [];
}

function siarkan() {
  const daftar = bacaKegiatanTambahan();
  pendengar.forEach((fn) => {
    try {
      fn(daftar);
    } catch (e) {
      /* abaikan — satu pendengar rusak tidak menghentikan yang lain */
    }
  });
}

/* Simpan data. Sebelum menimpa, satu cadangan otomatis dibuat
   (lihat src/data/backupData.js) sehingga perubahan/penghapusan
   yang tidak disengaja masih bisa dipulihkan.

   Opsi `izinkanKosong: true` wajib dipakai bila memang ingin
   mengosongkan seluruh data (mis. setelah admin mengonfirmasi
   penghapusan baris terakhir). Tanpa opsi itu, penulisan daftar
   kosong DITOLAK agar bug/kesalahan tidak menghapus semua data. */
export function tulisKegiatanTambahan(daftar, opsi = {}) {
  if (!Array.isArray(daftar)) {
    console.warn("Data kegiatan tambahan tidak disimpan: bukan daftar.");
    return false;
  }

  const mentahBaru = JSON.stringify(daftar);
  let mentahLama = null;
  let lama = [];
  try {
    mentahLama = localStorage.getItem(KUNCI);
    lama = uraiDaftar(mentahLama) || [];
  } catch (e) {
    /* penyimpanan tidak tersedia — percobaan tulis di bawah akan gagal */
  }

  if (mentahLama === mentahBaru) return true;

  if (daftar.length === 0 && lama.length > 0 && !opsi.izinkanKosong) {
    console.warn(
      "Penulisan data kegiatan kosong ditolak untuk mencegah kehilangan data. " +
        "Gunakan opsi { izinkanKosong: true } bila memang ingin mengosongkan."
    );
    return false;
  }

  /* Cadangkan keadaan SEBELUM perubahan (untuk "urungkan").
     Untuk perubahan yang MENGURANGI data (hapus baris), cadangan
     wajib berhasil. Bila kuota browser penuh, perubahan dibatalkan
     agar data lama tidak hilang tanpa salinan. */
  const destruktif = daftar.length < lama.length;
  const hasilCadangan = buatCadangan({
    alasan: opsi.alasan || "otomatis",
  });
  if (destruktif && !hasilCadangan.ok) {
    console.warn(
      "Penghapusan dibatalkan: cadangan pengaman gagal dibuat (kuota penyimpanan penuh)."
    );
    return false;
  }

  let tersimpan = false;
  try {
    localStorage.setItem(KUNCI, mentahBaru);
    tersimpan = true;
  } catch (e) {
    /* Kuota penuh: riwayat cadangan bisa memakan ruang. Prioritaskan
       data utama — kosongkan riwayat lalu coba sekali lagi. */
    console.warn(
      "Penyimpanan data kegiatan hampir penuh; mencoba mengosongkan riwayat cadangan.",
      e
    );
    if (kosongkanRiwayatCadangan()) {
      try {
        localStorage.setItem(KUNCI, mentahBaru);
        tersimpan = true;
      } catch (e2) {
        /* Salinan "terakhir baik" juga bisa memakan ruang — lepaskan
           juga sebagai upaya terakhir. */
        try {
          localStorage.removeItem(KUNCI_TERAKHIR_BAIK);
        } catch (e3) {
          /* abaikan */
        }
        try {
          localStorage.setItem(KUNCI, mentahBaru);
          tersimpan = true;
        } catch (e4) {
          console.warn("Gagal menyimpan data kegiatan tambahan:", e4);
        }
      }
    }
  }

  if (!tersimpan) return false;

  /* Salinan data terbaru untuk pemulihan otomatis bila data utama
     rusak. Gagal menyimpan salinan tidak menggagalkan penyimpanan
     utama. */
  try {
    localStorage.setItem(KUNCI_TERAKHIR_BAIK, mentahBaru);
  } catch (e) {
    /* kuota penuh — data utama sudah tersimpan */
  }
  siarkan();
  return true;
}

/* Daftararkan pendengar; langsung diberi data yang ada sekarang.
   Mengembalikan fungsi lepas-daftar. */
export function dengarKegiatanTambahan(fn) {
  pendengar.add(fn);
  try {
    fn(bacaKegiatanTambahan());
  } catch (e) {
    /* abaikan */
  }

  /* Tab lain yang menulis localStorage → perbarui juga. */
  const onStorage = (e) => {
    if (!e.key || e.key === KUNCI) fn(bacaKegiatanTambahan());
  };
  /* Pemulihan cadangan menulis langsung ke localStorage → beri tahu
     komponen yang sedang terbuka tanpa perlu memuat ulang halaman. */
  const onDipulihkan = (e) => {
    const kunci = (e && e.detail && e.detail.kunci) || [];
    if (!kunci.length || kunci.includes(KUNCI)) fn(bacaKegiatanTambahan());
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("pu_data_dipulihkan", onDipulihkan);

  return () => {
    pendengar.delete(fn);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("pu_data_dipulihkan", onDipulihkan);
  };
}

/* ── Rekap realisasi per bulan dari data tambahan ─────────────
   Dipakai Dashboard ("Realisasi Data Per Bulan") supaya angka hasil
   impor folder langsung ikut ter-update. Data lama yang hanya punya
   `tanggal` + `realisasi` tetap didukung.

   Bentuk hasil: { "2026-01": 1250000, "2026-02": 750000, ... } */
export function rekapRealisasiTambahan(daftar) {
  const perBulan = {};
  (daftar || []).forEach((t) => {
    if (!t) return;

    const peta = t.realisasiPerBulan;
    if (peta && typeof peta === "object" && Object.keys(peta).length) {
      Object.entries(peta).forEach(([ym, nilai]) => {
        if (!/^\d{4}-\d{2}$/.test(ym)) return;
        perBulan[ym] = (perBulan[ym] || 0) + (Number(nilai) || 0);
      });
      return;
    }

    const ym = t.tanggal ? String(t.tanggal).slice(0, 7) : "";
    if (/^\d{4}-\d{2}$/.test(ym) && Number(t.realisasi)) {
      perBulan[ym] = (perBulan[ym] || 0) + Number(t.realisasi);
    }
  });
  return perBulan;
}

export { KUNCI as KUNCI_KEGIATAN_TAMBAHAN };