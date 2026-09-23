import React from "react";

export default function Navbar({ activePage, setActivePage }) {
  const isDocActive =
    activePage === "dokumen" || activePage === "dipa" || activePage === "rkks";

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo" onClick={() => setActivePage("dashboard")}>
        <img
          src={`${process.env.PUBLIC_URL}/logo_pu.png`}
          alt="Logo Kementerian Pekerjaan Umum"
          className="logo-icon-img"
        />
        <div className="logo-text">
          <span className="logo-text-line1">Arsip Keuangan</span>
          <span className="logo-text-line2">Pusbangkom</span>
          <span className="logo-text-line2">SDA,CKPS</span>
        </div>
      </div>

      {/* Menu */}
      <div className="navbar-menu">
        <span
          className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
          onClick={() => setActivePage("dashboard")}
        >
          BERANDA
        </span>

        <span
          className={`nav-link ${isDocActive ? "active" : ""}`}
          onClick={() => setActivePage("dokumen")}
        >
          JENIS DOKUMEN
        </span>

        <span
          className={`nav-link ${activePage === "kebutuhan" ? "active" : ""}`}
          onClick={() => setActivePage("kebutuhan")}
        >
          ARSIP DIGITAL
        </span>

        <span
          className={`nav-link ${activePage === "proses-bisnis" ? "active" : ""}`}
          onClick={() => setActivePage("proses-bisnis")}
        >
          HASIL VERIFIKASI DIGITALISASI
        </span>
      </div>

      {/* Icons */}
      <div className="navbar-icons">
        <span className="nav-icon" title="Login">👤</span>
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
