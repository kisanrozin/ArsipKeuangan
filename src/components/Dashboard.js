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

export default function Dashboard({ setActivePage, onFilterChange, periode }) {
  /* `periode` (tahun + bulan) berasal dari App, sehingga filter yang
     dipilih di beranda tetap sama saat halaman ditinggalkan lalu
     dibuka lagi (komponen ini ikut ter-unmount saat pindah halaman). */
  return (
    <div className="site-content">
      <StatistikOperasional
        setActivePage={setActivePage}
        onFilterChange={onFilterChange}
        bulan={periode ? periode.bulan : undefined}
        tahun={periode ? periode.tahun : undefined}
      />
    </div>
  );
}
