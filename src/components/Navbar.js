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

/* ── Kredensial admin ── */
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export default function Navbar({ activePage, setActivePage, onGantiPeran }) {
  const { isAdmin } = usePeran();
  const [showLogin, setShowLogin]   = React.useState(false);
  const [username, setUsername]     = React.useState("");
  const [password, setPassword]     = React.useState("");
  const [tampilSandi, setTampilSandi] = React.useState(false);
  const [loginError, setLoginError] = React.useState("");
  const [loading, setLoading]       = React.useState(false);
  const [animKeluar, setAnimKeluar] = React.useState(false);

  const usernameRef = React.useRef(null);

  /* Buka modal login atau langsung keluar admin */
  const gantiPeran = () => {
    if (isAdmin) {
      if (typeof onGantiPeran === "function") onGantiPeran(false);
      return;
    }
    setShowLogin(true);
    setLoginError("");
    setUsername("");
    setPassword("");
    setTampilSandi(false);
    setLoading(false);
    setAnimKeluar(false);
  };

  /* Fokus input saat modal muncul */
  React.useEffect(() => {
    if (showLogin && usernameRef.current) {
      setTimeout(() => usernameRef.current?.focus(), 80);
    }
  }, [showLogin]);

  /* Tutup dengan Escape */
  React.useEffect(() => {
    if (!showLogin) return;
    const onKey = (e) => { if (e.key === "Escape") tutupModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLogin]);

  const tutupModal = () => {
    setAnimKeluar(true);
    setTimeout(() => {
      setShowLogin(false);
      setAnimKeluar(false);
    }, 250);
  };

  const submitLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    if (!username.trim() || !password.trim()) {
      setLoginError("Username dan kata sandi tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (
        username.trim() === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
      ) {
        setLoading(false);
        tutupModal();
        setTimeout(() => {
          if (typeof onGantiPeran === "function") onGantiPeran(true);
        }, 260);
      } else {
        setLoginError("Username atau kata sandi salah.");
        setLoading(false);
      }
    }, 600);
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
        {/* Badge peran aktif */}
        <span className={`nav-role-badge ${isAdmin ? "nav-role-badge-admin" : ""}`}>
          {isAdmin ? "Mode Admin" : "Mode Tamu"}
        </span>

        {/* Tombol profil / ganti peran */}
        <span
          className={`nav-icon ${isAdmin ? "nav-icon-admin" : ""}`}
          title={
            isAdmin
              ? "Keluar dari Mode Admin · kembali ke tampilan tamu"
              : "Masuk ke Mode Admin · klik untuk login"
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

    {/* ── Modal Login Admin ── */}
    {showLogin && (
      <div
        className={`nlm-overlay${animKeluar ? " nlm-overlay-keluar" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Login Admin"
        onClick={tutupModal}
      >
        <div
          className={`nlm-card${animKeluar ? " nlm-card-keluar" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="nlm-header">
            <img
              src={`${process.env.PUBLIC_URL}/kemenpu.png`}
              alt="Logo Kementerian Pekerjaan Umum"
              className="nlm-logo"
            />
            <div className="nlm-brand">
              <span className="nlm-brand-name">Login Admin</span>
              <span className="nlm-brand-sub">Digitalisasi Arsip Keuangan</span>
              <span className="nlm-brand-sub2">Kementerian Pekerjaan Umum</span>
            </div>
            {/* Tombol tutup */}
            <button
              type="button"
              className="nlm-close"
              onClick={tutupModal}
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>

          <hr className="nlm-divider" />

          <p className="nlm-welcome">Masukkan kredensial admin untuk melanjutkan</p>

          {/* Kotak sandi sementara */}
          <div className="nlm-hint">
            <span className="nlm-hint-icon">🔑</span>
            <div className="nlm-hint-body">
              <div className="nlm-hint-header">
                <span className="nlm-hint-title">Sandi Sementara</span>
                <button
                  type="button"
                  className="nlm-hint-use-btn"
                  onClick={() => {
                    setUsername("admin");
                    setPassword("admin123");
                    setLoginError("");
                  }}
                  title="Klik untuk mengisi otomatis"
                >
                  ⚡ Gunakan Otomatis
                </button>
              </div>
              <div className="nlm-hint-row">
                <span className="nlm-hint-key">Username</span>
                <code
                  className="nlm-hint-val nlm-clickable"
                  onClick={() => { setUsername("admin"); setLoginError(""); }}
                  title="Klik untuk menyalin username"
                >
                  admin
                </code>
              </div>
              <div className="nlm-hint-row">
                <span className="nlm-hint-key">Kata Sandi</span>
                <code
                  className="nlm-hint-val nlm-clickable"
                  onClick={() => { setPassword("admin123"); setLoginError(""); }}
                  title="Klik untuk menyalin kata sandi"
                >
                  admin123
                </code>
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="nlm-form" onSubmit={submitLogin} noValidate>

            {/* Username */}
            <div className="nlm-field">
              <label htmlFor="nlm-username" className="nlm-label">Username</label>
              <div className="nlm-input-wrap">
                <span className="nlm-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  id="nlm-username"
                  ref={usernameRef}
                  type="text"
                  className="nlm-input"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="nlm-field">
              <label htmlFor="nlm-password" className="nlm-label">Kata Sandi</label>
              <div className="nlm-input-wrap">
                <span className="nlm-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="nlm-password"
                  type={tampilSandi ? "text" : "password"}
                  className="nlm-input"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="nlm-toggle-sandi"
                  onClick={() => setTampilSandi((v) => !v)}
                  aria-label={tampilSandi ? "Sembunyikan" : "Tampilkan"}
                  tabIndex={-1}
                >
                  {tampilSandi ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Pesan galat */}
            {loginError && (
              <div className="nlm-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round" style={{flexShrink:0}}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {loginError}
              </div>
            )}

            {/* Tombol */}
            <div className="nlm-actions">
              <button
                type="button"
                className="nlm-btn-batal"
                onClick={tutupModal}
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className={`nlm-btn-masuk${loading ? " nlm-btn-loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="nlm-spinner" />
                    Memverifikasi…
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}

