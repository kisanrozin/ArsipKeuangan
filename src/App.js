import React from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import DataKegiatan from "./components/DataKegiatan";
import JenisDokumen from "./components/JenisDokumen";
import HistoriRevisiDipa from "./components/HistoriRevisiDipa";
import ProsesBisnis from "./components/ProsesBisnis";
import TamuRingkasan from "./components/TamuRingkasan";
import SplashScreen from "./components/SplashScreen";
import { PeranProvider, usePeran } from "./context/PeranContext";

/* Scroll tanpa animasi.
   `App.css` memakai `html { scroll-behavior: smooth }`, sehingga
   window.scrollTo(0, y) selalu dianimasikan. Saat posisi dipulihkan
   berulang kali, animasi terus dibatalkan → halaman tidak pernah sampai
   ke target (terlihat kembali ke atas). "instant" memaksa langsung. */
function scrollKePosisi(y) {
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

function IsiApp() {
  const { isAdmin, setPeran } = usePeran();

  /* Layar sambutan (splash) tampil lebih dulu setiap kali aplikasi
     dibuka, lalu ditutup lewat tombol "Masuk ke Dashboard". Selama
     splash masih tampil, halaman aplikasi belum dirender sama sekali
     — jadi tidak ada permintaan ke Drive/Sheets sebelum pengguna
     benar-benar masuk. */
  const [splashTutup, setSplashTutup] = React.useState(false);

  /* Tamu mulai dari halaman ringkasan (baca-saja); admin mulai dari
     dashboard. `activePage` hanya berlaku untuk peran yang sedang aktif. */
  const [activePage, setActivePage] = React.useState(
    isAdmin ? "dashboard" : "tamu"
  );
  /* Posisi scroll DICATAT per halaman, jadi:
     - pindah halaman tidak lempar ke titik atas
     - kembali ke halaman yang sama kembali ke posisi yang sama
       (bukan posisi halaman yang baru saja ditinggalkan) */
  const posisiPerHalaman = React.useRef({});

  /* Ganti peran (ikon user di navbar) → buka halaman bawaan peran
     itu dan mulai dari atas, karena isi halaman & panjangnya berbeda. */
  const gantiPeran = React.useCallback(
    (jadiAdmin) => {
      posisiPerHalaman.current = {};
      setPeran(jadiAdmin ? "admin" : "tamu");
      setActivePage(jadiAdmin ? "dashboard" : "tamu");
      scrollKePosisi(0);
    },
    [setPeran]
  );

  // Halaman yang tidak boleh dibuka pada peran ini → arahkan ke
  // halaman default peran tersebut (mis. tamu tidak boleh buka
  // "dokumen"). "histori-dipa" boleh dibuka tamu (baca-saja).
  React.useEffect(() => {
    const hanyaAdmin = ["dashboard", "dokumen", "dipa", "rkks"];
    if (!isAdmin && hanyaAdmin.includes(activePage)) {
      setActivePage("tamu");
    }
    if (isAdmin && activePage === "tamu") {
      setActivePage("dashboard");
    }
  }, [isAdmin, activePage]);

  // Catat posisi scroll halaman aktif secara terus-menerus.
  React.useEffect(() => {
    posisiPerHalaman.current[activePage] = window.scrollY || 0;
    const onScroll = () => {
      posisiPerHalaman.current[activePage] = window.scrollY || 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [activePage]);

  const gantiPage = React.useCallback((halaman) => {
    if (halaman === activePage) return;
    posisiPerHalaman.current[activePage] = window.scrollY || window.pageYOffset || 0;
    setActivePage(halaman);
  }, [activePage]);

  // Kembalikan posisi scroll setelah halaman baru selesai dirender.
  // Halaman tujuan masih kosong saat pertama dirender (data Drive/Sheet
  // belum selesai dimuat), jadi posisi dipulihkan berulang kali sampai
  // kontennya benar-benar tersedia — bukan langsung ter-clamp ke titik atas.
  React.useEffect(() => {
    const y = posisiPerHalaman.current[activePage] || 0;
    if (!y) return undefined;

    const keTarget = () => {
      const maks = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const target = Math.min(y, maks);
      if (Math.abs(window.scrollY - target) > 1) {
        scrollKePosisi(target);
        return false;
      }
      return true;
    };

    let raf = 0;
    let tries = 0;
    const loop = () => {
      tries += 1;
      const sudahPas = keTarget();
      if (sudahPas && tries > 3) return;   // stabil 3 frame beruntun
      if (tries > 180) return;            // batas sekitar 3 detik
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Height halaman bisa berubah lagi setelah data live dimuat.
    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => keTarget());
      observer.observe(document.body);
      const stop = setTimeout(() => observer && observer.disconnect(), 4000);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(stop);
        if (observer) observer.disconnect();
      };
    }

    return () => cancelAnimationFrame(raf);
  }, [activePage]);

  const renderPage = () => {
    /* Tamu: halaman ringkasan data (baca-saja). Halaman Data Kegiatan
       dan History Revisi DIPA tetap boleh dibuka karena isinya
       read-only (tombol input disembunyikan di dalam komponennya). */
    if (!isAdmin) {
      switch (activePage) {
        case "data-kegiatan":
        case "kebutuhan":
          return <DataKegiatan />;
        case "proses-bisnis":
          return <ProsesBisnis />;
        case "histori-dipa":
          return <HistoriRevisiDipa setActivePage={gantiPage} />;
        default:
          return <TamuRingkasan setActivePage={gantiPage} />;
      }
    }

    switch (activePage) {
      case "dashboard":     return <Dashboard setActivePage={gantiPage} />;
      case "histori-dipa": return <HistoriRevisiDipa setActivePage={gantiPage} />;
      case "kebutuhan":     return <DataKegiatan />;
      case "data-kegiatan":  return <DataKegiatan />;
      case "proses-bisnis":  return <ProsesBisnis />;
      case "dokumen":       return <JenisDokumen />;
      case "dipa":          return <JenisDokumen />;
      case "rkks":          return <JenisDokumen />;
      default:              return <Dashboard setActivePage={gantiPage} />;
    }
  };

  /* Selama splash tampil, aplikasi belum dirender. */
  if (!splashTutup) {
    return <SplashScreen onMasuk={() => setSplashTutup(true)} />;
  }

  return (
    <div>
      <Navbar
        activePage={activePage}
        setActivePage={gantiPage}
        onGantiPeran={gantiPeran}
      />
      <div className="page-wrapper">
        {renderPage()}
      </div>
      <footer className="footer">
        <div>© {new Date().getFullYear()} <strong>DIARKES</strong> · Digitalisasi Arsip Keuangan Kementerian Pekerjaan Umum</div>
        <div>Pusat Pengembangan Kompetensi SDA, Cipta Karya dan Prasarana Strategis · Versi 1.0</div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <PeranProvider>
      <IsiApp />
    </PeranProvider>
  );
}

export default App;