import React from "react";
import HeroBanner from "./HeroBanner";
import StatistikOperasional from "./StatistikOperasional";

/* ══════════════════════════════════════════════════════════════
   HALAMAN TAMU (VIEWER)
   ------------------------------------------------------------
   Berisi blok yang SAMA dengan beranda admin. Semua bersifat
   baca-saja:

     1. Blok "Ringkasan Statistik Operasional"
        (src/components/StatistikOperasional.js) — kartu pagu /
        realisasi / persentase, bagian "Realisasi Data Per Bulan"
        beserta filter tahun-bulan, dan tabel
        "Pagu & Realisasi <Bulan> <Tahun>". Angka & tabel ini
        identik dengan yang dilihat admin karena keduanya memakai
        sumber data yang sama (Google Sheets + Google Drive).
        Perbedaannya hanya `readOnly` — tanpa tombol sinkron dan
        tanpa kartu yang bisa diklik.

        Filter bulan & tahun dikelola blok itu sendiri (tanpa props
        `bulan`/`tahun`) supaya otomatis menunjuk bulan/tahun
        berjalan dan ikut berganti realtime saat pergantian
        bulan/tahun tiba.

   Untuk mengelola data, tamu diarahkan lewat ikon user di kanan
   atas navbar.
   ══════════════════════════════════════════════════════════════ */

export default function TamuRingkasan({ setActivePage }) {
  return (
    <>
      <HeroBanner
        title="DIGITALISASI ARSIP KEUANGAN"
        subtitle="PUSAT PENGEMBANGAN KOMPETENSI SUMBER DAYA AIR , CIPTA KARYA DAN PRASARANA STRATEGIS"
        crumbs={["Beranda", "Viewers"]}
      />

      <div className="site-content">
        {/* ── Section intro: image + text (dipindah dari dashboard admin) ── */}
        <div className="section-intro">
          <img
            src="/hero_library.jpeg"
            alt="Perpustakaan PUPR"
            className="section-intro-img"
          />
          <div className="section-intro-text">
            <h2>Digitalisasi Arsip Keuangan</h2>
            <p>
              Pusat Pengembangan Kompetensi Sumber Daya Air, Cipta Karya, dan Prasarana Strategis mengimplementasikan sistem pengelolaan dokumen keuangan berbasis digital.
            </p>
            <p style={{ marginTop: 10 }}>
              Sistem ini dirancang untuk mengidentifikasi serta mengoptimalkan alur proses bisnis pengarsipan, mengakomodasi kebutuhan tata kelola administrasi keuangan instansi, serta mengelompokkan berbagai jenis dokumen transaksi dan pertanggungjawaban keuangan secara terstruktur, aman, dan mudah diakses.
            </p>
          </div>
        </div>

        <hr className="divider" />

        {/* ══ Blok yang sama dengan beranda admin ══ */}
        <div style={{ marginTop: 26 }}>
          <StatistikOperasional
            setActivePage={setActivePage}
            readOnly
            pollMs={60000}
          />
        </div>

        <p className="tm-hint">
          Sumber data: rekap resmi di Google Sheets dan folder SPM di Google
          Drive, ditambah data yang diinput admin. Untuk melihat atau mengelola
          data, masuk lewat ikon user di kanan atas navbar.
        </p>
      </div>
    </>
  );
}
