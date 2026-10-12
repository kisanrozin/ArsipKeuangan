import React from "react";
import StatistikOperasional from "./StatistikOperasional";

/* ══════════════════════════════════════════════════════════════
   BERANDA ADMIN (DASHBOARD)
   ------------------------------------------------------------
   Halaman pertama untuk Mode Admin. Hanya berisi blok
   "Ringkasan Statistik Operasional":

     • kartu Total Pagu / Total Realisasi SPM / Persentase Realisasi
     • "Realisasi Data Per Bulan" (filter tahun-bulan + 3 kartu bulan)
     • tabel "Pagu & Realisasi <Bulan> <Tahun>"

   Hero banner & penjelasan "Digitalisasi Arsip Keuangan" dipindah
   ke halaman tamu (TamuRingkasan.js).
   ══════════════════════════════════════════════════════════════ */

export default function Dashboard({ setActivePage }) {
  return (
    <div className="site-content">
      <StatistikOperasional setActivePage={setActivePage} />
    </div>
  );
}
