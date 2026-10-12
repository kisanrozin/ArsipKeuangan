import React from "react";
import { TAHUN_ANGGARAN_AKTIF } from "../data/masterData";

/* ══════════════════════════════════════════════════════════════
   SPLASH SCREEN (LAYAR SAMBUTAN)
   ------------------------------------------------------------
   Muncul lebih dulu sebelum halaman aplikasi — untuk Mode Tamu
   maupun Mode Admin — lalu ditutup lewat tombol "Masuk ke Dashboard".

   Latar memakai pola batik (public/batik.webp) yang dipasang penuh
   (background-size: cover) dengan zoom pelan supaya tidak terlihat
   seperti gambar diam. Karena batiknya ramai dan berwarna terang,
   teks diletakkan di atas lapisan gelap (overlay + vignette) agar
   tetap mudah dibaca.
   ══════════════════════════════════════════════════════════════ */

export default function SplashScreen({ onMasuk }) {
  const [keluar, setKeluar] = React.useState(false);
  const tombolRef = React.useRef(null);
  const sudahMasuk = React.useRef(false);

  const masuk = React.useCallback(() => {
    // Cegah masuk dua kali (klik ganda atau Enter berulang).
    if (sudahMasuk.current) return;
    sudahMasuk.current = true;
    setKeluar(true);
    // Tunggu animasi pudar selesai, baru buka halaman.
    window.setTimeout(() => {
      if (typeof onMasuk === "function") onMasuk();
    }, 450);
  }, [onMasuk]);

  // Fokuskan tombol agar bisa langsung ditekan Enter.
  React.useEffect(() => {
    if (tombolRef.current) tombolRef.current.focus();
  }, []);

  /* Esc untuk melewati layar — berguna saat presentasi/demop, dan
     tetap sesuaiWCAG (layer modal harus bisa ditutup dengan keyboard). */
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") masuk();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [masuk]);

  return (
    <div
      className={`splash-screen ${keluar ? "splash-screen-keluar" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Layar sambutan aplikasi"
    >
      {/* Latar batik + lapisan gelap. URL gambar lewat
          process.env.PUBLIC_URL karena batik.webp berada di public/. */}
      <div
        className="splash-bg"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/batik.webp)`,
        }}
      />
      <div className="splash-overlay" />

      <div className="splash-content">
        <h1 className="splash-title">
          Selamat Datang di Realisasi
          <br />
          Anggaran TA {TAHUN_ANGGARAN_AKTIF}
        </h1>

        <p className="splash-subtitle">Dashboard Manajemen Realisasi Anggaran</p>

        <p className="splash-desc">
          Pantau realisasi anggaran Anda dengan dashboard yang komprehensif dan
          real-time. Akses data kegiatan, analisis persentase realisasi, dan
          kelola anggaran dengan mudah.
        </p>

        <button
          type="button"
          ref={tombolRef}
          className="splash-btn"
          onClick={masuk}
        >
          Masuk ke Dashboard
        </button>
      </div>
    </div>
  );
}