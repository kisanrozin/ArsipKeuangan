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
  const [showLogin, setShowLogin] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState("");

  const gantiPeran = () => {
    if (isAdmin) {
      if (typeof onGantiPeran === "function") onGantiPeran(false);
      return;
    }
    setShowLogin(true);
    setLoginError("");
    setUsername("");
    setPassword("");
  };

  const submitLogin = (e) => {
    e.preventDefault();
    // Login demo (tanpa database): kredensial tetap untuk keperluan demo.
    if (username.trim() === "admin" && password === "admin") {
      setShowLogin(false);
      if (typeof onGantiPeran === "function") onGantiPeran(true);
    } else {
      setLoginError("Username atau password salah. Demo: admin / admin");
    }
  };
  const menu = isAdmin ? MENU_ADMIN : MENU_TAMU;

  return (
    <>
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

    {showLogin && (
      <div
        className="nav-login-overlay"
        role="presentation"
        onClick={() => setShowLogin(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          className="nav-login-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            width: 320,
            maxWidth: "90vw",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Login Admin (Demo)</h2>
          <p style={{ fontSize: 12, color: "#555", marginTop: 0 }}>
            Demo tanpa database. Username: <b>admin</b>, Password: <b>admin</b>.
          </p>
          <form onSubmit={submitLogin}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
              />
            </div>
            {loginError && (
              <div style={{ color: "#c00", fontSize: 12, marginBottom: 10 }}>{loginError}</div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                style={{ padding: "8px 12px" }}
              >
                Batal
              </button>
              <button type="submit" style={{ padding: "8px 12px" }}>
                Masuk
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}