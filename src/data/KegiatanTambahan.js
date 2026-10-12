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

const KUNCI = "pu_data_kegiatan_tambahan";

const pendengar = new Set();

/* Bentuk baris: { kode, nama, pagu, realisasi, tanggal } */
export function bacaKegiatanTambahan() {
  try {
    const data = JSON.parse(localStorage.getItem(KUNCI) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("Gagal membaca data kegiatan tambahan:", e);
    return [];
  }
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

export function tulisKegiatanTambahan(daftar) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(daftar || []));
  } catch (e) {
    console.warn("Gagal menyimpan data kegiatan tambahan:", e);
  }
  siarkan();
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
  window.addEventListener("storage", onStorage);

  return () => {
    pendengar.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export { KUNCI as KUNCI_KEGIATAN_TAMBAHAN };