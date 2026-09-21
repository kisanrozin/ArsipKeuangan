import React from "react";
import { JENIS_DOKUMEN, PROSES_BISNIS, KEBUTUHAN_FUNGSIONAL } from "../data/masterData";

const menuItems = [
  {
    section: "ANALISIS",
    items: [
      { id: "dashboard", icon: "📊", label: "Dashboard", count: null },
      { id: "proses-bisnis", icon: "🔄", label: "Proses Bisnis", count: PROSES_BISNIS.length },
      { id: "kebutuhan", icon: "📝", label: "Kebutuhan Instansi", count: KEBUTUHAN_FUNGSIONAL.length },
      { id: "dokumen", icon: "📁", label: "Jenis Dokumen", count: JENIS_DOKUMEN.reduce((s, d) => s + d.jumlah, 0) },
    ],
  },
];

export default function Sidebar({ activePage, setActivePage, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? "" : "closed"}`}>
      {menuItems.map((section) => (
        <div key={section.section} className="sidebar-section">
          <div className="sidebar-section-label">{section.section}</div>
          {section.items.map((item) => (
            <div
              key={item.id}
              className={`sidebar-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.count !== null && (
                <span className="sidebar-count">{item.count}</span>
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="sidebar-divider" />

      <div className="sidebar-info">
        <div className="sidebar-info-title">📌 Info Proyek</div>
        <div className="sidebar-info-text">
          Analisis sistem pengarsipan keuangan Dinas PU untuk perancangan SIPKA berbasis digital.
        </div>
      </div>

      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 12px", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Fase:</strong> Analisis Kebutuhan<br />
          <strong style={{ color: "var(--text-secondary)" }}>Tahun:</strong> {new Date().getFullYear()}<br />
          <strong style={{ color: "var(--text-secondary)" }}>Versi:</strong> 1.0.0
        </div>
      </div>
    </aside>
  );
}
