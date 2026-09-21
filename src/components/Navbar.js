import React, { useEffect, useState } from "react";

export default function Navbar({ toggleSidebar }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fmt = time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = time.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <button className="menu-btn" onClick={toggleSidebar} title="Toggle Sidebar">
          ☰
        </button>
        <div className="navbar-logo">🏛️</div>
        <div>
          <div className="navbar-title">SIPKA-PU</div>
          <div className="navbar-subtitle">Sistem Pengarsipan Keuangan · Dinas Pekerjaan Umum</div>
        </div>
      </div>

      <div className="navbar-right">
        <div style={{ textAlign: "right" }}>
          <div className="navbar-time" style={{ fontWeight: 700, fontSize: 15 }}>{fmt}</div>
          <div className="navbar-time">{fmtDate}</div>
        </div>
        <div className="navbar-badge">Analisis Sistem</div>
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #14b8a6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, color: "#fff", cursor: "pointer",
          }}
          title="Admin"
        >
          AS
        </div>
      </div>
    </nav>
  );
}
