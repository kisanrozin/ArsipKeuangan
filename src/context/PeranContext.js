import React from "react";

/* ══════════════════════════════════════════════════════════════
   PERAN TAMPILAN — TAMU (VIEWER) & ADMIN
   ------------------------------------------------------------
   Dua mode tampilan:

     • TAMU  — hanya membaca. Melihat halaman ringkasan data
               (src/components/TamuRingkasan.js) dan halaman Data
               Kegiatan dalam mode baca-saja. Semua tombol tambah,
               ubah, hapus, dan unggah disembunyikan.
     • ADMIN — layar yang sudah ada sebelumnya (Dashboard, Data
               Kegiatan, History Revisi DIPA) lengkap dengan
               tombol input data.

   Perpindahan mode dilakukan dengan klik ikon user di kanan atas
   navbar (tidak pakai login dulu, sesuai kebutuhan saat ini).
   Status peran disimpan di sessionStorage supaya halaman yang
   di-refresh tidak langsung kembali ke mode tamu.
   ══════════════════════════════════════════════════════════════ */

const KUNCI_PERAN = "pu_peran_tampilan";

export const TAMU = "tamu";
export const ADMIN = "admin";

const PeranContext = React.createContext({
  peran: TAMU,
  isAdmin: false,
  masukAdmin: () => {},
  jadiTamu: () => {},
});

function bacaPeranAwal() {
  try {
    return sessionStorage.getItem(KUNCI_PERAN) === ADMIN ? ADMIN : TAMU;
  } catch (e) {
    /* penyimpanan browser tidak tersedia — mulai sebagai tamu */
    return TAMU;
  }
}

export function PeranProvider({ children }) {
  const [peran, setPeran] = React.useState(bacaPeranAwal);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(KUNCI_PERAN, peran);
    } catch (e) {
      /* abaikan */
    }
  }, [peran]);

  const nilai = React.useMemo(
    () => ({
      peran,
      isAdmin: peran === ADMIN,
      masukAdmin: () => setPeran(ADMIN),
      jadiTamu: () => setPeran(TAMU),
      setPeran,
    }),
    [peran]
  );

  return (
    <PeranContext.Provider value={nilai}>{children}</PeranContext.Provider>
  );
}

/* Dipakai komponen mana pun untuk mengetahui apakah sedang mode
   admin. `isAdmin` dipakai untuk menyembunyikan kontrol input,
   `peran` untuk teks/label yang berbeda. */
export function usePeran() {
  return React.useContext(PeranContext);
}

export default PeranContext;