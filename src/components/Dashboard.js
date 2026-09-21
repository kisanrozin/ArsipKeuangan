import React from "react";
import { PROSES_BISNIS, JENIS_DOKUMEN, KEBUTUHAN_FUNGSIONAL, STAKEHOLDERS } from "../data/masterData";

const stats = [
  {
    icon: "🔄",
    value: PROSES_BISNIS.length,
    label: "Tahap Proses Bisnis",
    change: "Proses yang diidentifikasi",
    accent: "linear-gradient(90deg, #3b82f6, #14b8a6)",
  },
  {
    icon: "📋",
    value: KEBUTUHAN_FUNGSIONAL.length,
    label: "Kebutuhan Fungsional",
    change: "Dari hasil wawancara",
    accent: "linear-gradient(90deg, #8b5cf6, #6366f1)",
  },
  {
    icon: "📁",
    value: JENIS_DOKUMEN.reduce((s, d) => s + d.subJenis.length, 0),
    label: "Total Sub-Jenis Dokumen",
    change: `Dalam ${JENIS_DOKUMEN.length} kategori`,
    accent: "linear-gradient(90deg, #f59e0b, #ef4444)",
  },
  {
    icon: "👥",
    value: STAKEHOLDERS.length,
    label: "Stakeholder Terlibat",
    change: "Unit kerja & pengguna",
    accent: "linear-gradient(90deg, #10b981, #14b8a6)",
  },
];

const masalahAll = PROSES_BISNIS.flatMap((p) => p.masalah);

export default function Dashboard({ setActivePage }) {
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-breadcrumb">🏛️ <span>SIPKA-PU</span> / Dashboard</div>
        <h1 className="page-title">Dashboard Analisis Sistem</h1>
        <p className="page-desc">
          Ringkasan hasil identifikasi proses bisnis pengarsipan keuangan, pengumpulan kebutuhan,
          dan inventarisasi jenis dokumen Instansi Dinas Pekerjaan Umum.
        </p>
      </div>

      {/* Alert */}
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <span>ℹ️</span>
        <div>
          <strong>Fase Analisis Kebutuhan</strong> — Dokumen ini merupakan hasil identifikasi awal proses bisnis pengarsipan keuangan yang berjalan saat ini di Instansi PU. Data akan digunakan sebagai dasar perancangan sistem informasi pengarsipan digital.
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ "--card-accent": s.accent }}>
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-value" style={{ background: s.accent, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change" style={{ color: "var(--text-muted)" }}>→ {s.change}</div>
          </div>
        ))}
      </div>

      {/* Quick Navigation */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          {
            id: "proses-bisnis",
            icon: "🔄",
            title: "Identifikasi Proses Bisnis",
            desc: "Alur pengarsipan keuangan yang saat ini berjalan di Instansi PU, beserta permasalahan yang teridentifikasi.",
            color: "#3b82f6",
            items: [`${PROSES_BISNIS.length} tahapan proses`, `${masalahAll.length} masalah teridentifikasi`, "Pelaku & durasi proses"],
          },
          {
            id: "kebutuhan",
            icon: "📝",
            title: "Kebutuhan Instansi PU",
            desc: "Hasil pengumpulan kebutuhan fungsional dan non-fungsional dari stakeholder Instansi PU.",
            color: "#8b5cf6",
            items: [`${KEBUTUHAN_FUNGSIONAL.length} kebutuhan fungsional`, `${STAKEHOLDERS.length} stakeholder`, "Prioritas tiap kebutuhan"],
          },
          {
            id: "dokumen",
            icon: "📁",
            title: "Jenis Dokumen",
            desc: "Katalog lengkap jenis dokumen keuangan yang akan diarsipkan beserta informasi retensi dan format.",
            color: "#f59e0b",
            items: [`${JENIS_DOKUMEN.length} kategori dokumen`, `${JENIS_DOKUMEN.reduce((s,d) => s+d.subJenis.length,0)} sub-jenis dokumen`, "Jadwal retensi"],
          },
        ].map((card) => (
          <div
            key={card.id}
            className="card"
            style={{ cursor: "pointer" }}
            onClick={() => setActivePage(card.id)}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, fontSize: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${card.color}22`, border: `1px solid ${card.color}44`,
              marginBottom: 16,
            }}>
              {card.icon}
            </div>
            <div className="card-title" style={{ marginBottom: 8 }}>{card.title}</div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              {card.desc}
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
              {card.items.map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: card.color, display: "inline-block", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <button
              className="btn btn-secondary"
              style={{ marginTop: 18, width: "100%", justifyContent: "center" }}
            >
              Lihat Detail →
            </button>
          </div>
        ))}
      </div>

      {/* Stakeholder Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">👥 Stakeholder Instansi PU</div>
            <div className="card-subtitle">Pihak-pihak yang terlibat dalam proses pengarsipan keuangan</div>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama / Jabatan</th>
                <th>Peran dalam Sistem</th>
                <th>Level Akses</th>
              </tr>
            </thead>
            <tbody>
              {STAKEHOLDERS.map((s, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.nama}</td>
                  <td>{s.peran}</td>
                  <td>
                    <span className={`badge ${
                      s.akses.includes("Full") ? "badge-blue" :
                      s.akses.includes("Upload") ? "badge-teal" :
                      s.akses.includes("Read") ? "badge-gray" : "badge-emerald"
                    }`}>
                      {s.akses}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
