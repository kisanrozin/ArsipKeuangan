import React from "react";
import { usePeran } from "../context/PeranContext";

/* Menu berdasar peran:
   • Tamu  → beranda (ringkasan data), data kegiatan & history revisi
             DIPA (semuanya baca-saja).
   • Admin → layar yang sudah ada sebelumnya, lengkap dengan
             input data (dashboard, data kegiatan, history revisi DIPA). */
const MENU_TAMU = [
  { id: "tamu", label: "BERANDA" },
  { id: "data-kegiatan", label: "DATA KEGIATAN" },
  { id: "proses-bisnis", label: "HASIL VERIFIKASI DIGITALISASI" },
  { id: "histori-dipa", label: "HISTORY REVISI DIPA" },
];

const MENU_ADMIN = [
  { id: "dashboard", label: "BERANDA" },
  { id: "data-kegiatan", label: "DATA KEGIATAN" },
  { id: "proses-bisnis", label: "HASIL VERIFIKASI DIGITALISASI" },
  { id: "histori-dipa", label: "HISTORY REVISI DIPA" },
];

export default function Navbar({ activePage, setActivePage, onGantiPeran }) {
  const { isAdmin } = usePeran();
  const menu = isAdmin ? MENU_ADMIN : MENU_TAMU;

  /* Ikon user: tanpa login dulu — klik pertama masuk ke Mode Admin,
     klik berikutnya kembali ke Mode Tamu. */
  const gantiPeran = () => {
    if (typeof onGantiPeran === "function") onGantiPeran(!isAdmin);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo" onClick={() => setActivePage(isAdmin ? "dashboard" : "tamu")}>
        <img
          src={`${process.env.PUBLIC_URL}/logo_pu.png`}
          alt="Logo Kementerian Pekerjaan Umum"
          className="logo-icon-img"
        />
        <div className="logo-text">
          <span className="logo-text-line1">Arsip Keuangan</span>
          <span className="logo-text-line2">Kementerian</span>
          <span className="logo-text-line2">Pekerjaan Umum</span>
        </div>
      </div>

      {/* Menu */}
      <div className="navbar-menu">
        {menu.map((item) => (
          <span
            key={item.id}
            className={`nav-link ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
          >
            {item.label}
          </span>
        ))}
      </div>

      {/* Icons */}
      <div className="navbar-icons">
        {/* Badge peran aktif — biar jelas sedang lihat data atau manage data */}
        <span className={`nav-role-badge ${isAdmin ? "nav-role-badge-admin" : ""}`}>
          {isAdmin ? "Mode Admin" : "Mode Tamu"}
        </span>

        <span
          className={`nav-icon ${isAdmin ? "nav-icon-admin" : ""}`}
          title={
            isAdmin
              ? "Keluar dari Mode Admin · kembali ke tampilan tamu"
              : "Masuk ke Mode Admin · layar admin (tambah/ubah data)"
          }
          role="button"
          tabIndex={0}
          aria-label={isAdmin ? "Kembali ke mode tamu" : "Masuk ke mode admin"}
          onClick={gantiPeran}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              gantiPeran();
            }
          }}
        >
          👤
        </span>

        <span className="nav-icon" title="Cari">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
        </span>
      </div>
    </nav>
  );
}