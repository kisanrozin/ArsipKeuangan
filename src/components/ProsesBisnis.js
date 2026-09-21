import React, { useState } from "react";
import { PROSES_BISNIS } from "../data/masterData";

export default function ProsesBisnis() {
  const [expandedId, setExpandedId] = useState(null);

  const totalMasalah = PROSES_BISNIS.flatMap((p) => p.masalah).length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-breadcrumb">🏛️ <span>SIPKA-PU</span> / Proses Bisnis</div>
        <h1 className="page-title">Identifikasi Proses Bisnis</h1>
        <p className="page-desc">
          Alur proses pengarsipan keuangan yang <strong>berjalan saat ini</strong> di Instansi Dinas Pekerjaan Umum,
          hasil dari observasi lapangan dan wawancara dengan pegawai terkait.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="stat-card" style={{ "--card-accent": "linear-gradient(90deg, #3b82f6, #14b8a6)" }}>
          <span className="stat-icon">🔄</span>
          <div className="stat-value" style={{ fontSize: 28, color: "#60a5fa" }}>{PROSES_BISNIS.length}</div>
          <div className="stat-label">Tahap Proses</div>
        </div>
        <div className="stat-card" style={{ "--card-accent": "linear-gradient(90deg, #ef4444, #f59e0b)" }}>
          <span className="stat-icon">⚠️</span>
          <div className="stat-value" style={{ fontSize: 28, color: "#f87171" }}>{totalMasalah}</div>
          <div className="stat-label">Masalah Teridentifikasi</div>
        </div>
        <div className="stat-card" style={{ "--card-accent": "linear-gradient(90deg, #10b981, #14b8a6)" }}>
          <span className="stat-icon">✅</span>
          <div className="stat-value" style={{ fontSize: 28, color: "#34d399" }}>
            {PROSES_BISNIS.filter((p) => p.status === "berjalan").length}
          </div>
          <div className="stat-label">Proses Aktif</div>
        </div>
      </div>

      {/* Alert */}
      <div className="alert alert-warn" style={{ marginBottom: 24 }}>
        <span>⚠️</span>
        <div>
          <strong>Sistem yang Berjalan Saat Ini (As-Is)</strong> — Proses di bawah ini merupakan kondisi pengarsipan yang saat ini dilakukan secara <em>manual</em>. Masalah yang teridentifikasi akan menjadi dasar perancangan sistem digitalisasi.
        </div>
      </div>

      {/* BPMN Legend */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">📖 Keterangan Diagram Alur</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {[
            { icon: "📥", label: "Start / Input Dokumen" },
            { icon: "🔍", label: "Proses Verifikasi" },
            { icon: "🗂️", label: "Klasifikasi & Koding" },
            { icon: "💾", label: "Penyimpanan" },
            { icon: "🔎", label: "Penelusuran / Peminjaman" },
            { icon: "🗑️", label: "Pemusnahan / Retensi" },
          ].map((leg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{ fontSize: 18 }}>{leg.icon}</span> {leg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Process Flow */}
      <div className="process-flow">
        {PROSES_BISNIS.map((step, index) => {
          const isExpanded = expandedId === step.id;
          const isLast = index === PROSES_BISNIS.length - 1;

          return (
            <div key={step.id} className="process-step">
              {/* Left timeline */}
              <div className="process-step-left">
                <div className="process-step-num">{step.icon}</div>
                {!isLast && <div className="process-step-line" />}
              </div>

              {/* Content */}
              <div
                className="process-step-content"
                style={{ cursor: "pointer" }}
                onClick={() => setExpandedId(isExpanded ? null : step.id)}
              >
                <div className="process-step-header">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span className="badge badge-blue">Tahap {step.tahap}</span>
                      <span className={`badge ${step.status === "berjalan" ? "badge-emerald" : "badge-gray"}`}>
                        {step.status === "berjalan" ? "✓ Berjalan" : step.status}
                      </span>
                    </div>
                    <div className="process-step-name">{step.nama}</div>
                    <div className="process-step-actor">👤 Pelaku: {step.pelaku}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>
                    {isExpanded ? "▲" : "▼"} Detail
                  </div>
                </div>

                <div className="process-step-desc">{step.deskripsi}</div>

                {/* Meta grid */}
                <div className="process-meta-grid">
                  <div className="process-meta-item">
                    <div className="process-meta-label">Input</div>
                    <div className="process-meta-value">{step.input}</div>
                  </div>
                  <div className="process-meta-item">
                    <div className="process-meta-label">Output</div>
                    <div className="process-meta-value">{step.output}</div>
                  </div>
                  <div className="process-meta-item">
                    <div className="process-meta-label">⏱ Durasi</div>
                    <div className="process-meta-value">{step.durasi}</div>
                  </div>
                </div>

                {/* Masalah */}
                {isExpanded && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      ⚠️ Permasalahan yang Teridentifikasi:
                    </div>
                    <ul className="masalah-list">
                      {step.masalah.map((m, i) => (
                        <li key={i} className="masalah-item">
                          <span>❌</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Masalah */}
      <div className="card" style={{ marginTop: 8 }}>
        <div className="card-header">
          <div>
            <div className="card-title">⚠️ Rekapitulasi Masalah</div>
            <div className="card-subtitle">Semua permasalahan yang teridentifikasi dalam proses pengarsipan saat ini</div>
          </div>
          <span className="badge badge-rose">{totalMasalah} Masalah</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tahap Proses</th>
                <th>Masalah</th>
              </tr>
            </thead>
            <tbody>
              {PROSES_BISNIS.flatMap((p) =>
                p.masalah.map((m, i) => ({
                  no: null,
                  tahap: p.nama,
                  masalah: m,
                  key: `${p.id}-${i}`,
                }))
              ).map((row, i) => (
                <tr key={row.key}>
                  <td style={{ color: "var(--text-muted)", width: 40 }}>{i + 1}</td>
                  <td>
                    <span className="badge badge-blue">{row.tahap}</span>
                  </td>
                  <td style={{ color: "#fda4af" }}>❌ {row.masalah}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
