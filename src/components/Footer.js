import React from "react";

export default function Footer() {
  return (
    <div className="footer">
      <div>
        © {new Date().getFullYear()} <strong style={{ color: "#fff" }}>SIPKA-PU</strong> — Sistem Informasi Pengarsipan Keuangan · Dinas Pekerjaan Umum
      </div>
      <div>
        Analisis Kebutuhan Sistem · Versi 1.0
      </div>
    </div>
  );
}
