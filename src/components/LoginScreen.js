import React from "react";

/* ══════════════════════════════════════════════════════════════
   LOGIN SCREEN
   ------------------------------------------------------------
   Tampilan login yang hanya menampilkan logo (tanpa brand text
   dan form login). Setelah logo ditampilkan sebentar, aplikasi
   otomatis masuk sebagai tamu (viewer).
   ══════════════════════════════════════════════════════════════ */

export default function LoginScreen({ onLogin }) {
  const [keluar, setKeluar] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setKeluar(true);
      setTimeout(() => {
        if (typeof onLogin === "function") onLogin("tamu");
      }, 350);
    }, 1200);
    return () => clearTimeout(t);
  }, [onLogin]);

  return (
    <div className={`login-wrapper${keluar ? " login-wrapper-keluar" : ""}`}>
      <div className="login-bg" />
      <div className="login-logo-only">
        <img
          src={`${process.env.PUBLIC_URL}/kemenpu.png`}
          alt="Logo Kementerian Pekerjaan Umum"
          className="login-logo"
        />
      </div>
    </div>
  );
}
