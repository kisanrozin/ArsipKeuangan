import React, { useState } from "react";
import {
  SHEET_TABS,
  RESUME_VERIFIKASI_JAN_JUNI,
  SHEET_DATA,
  SHEET2_BIDANG_SUMMARY,
  SHEET2_BIDANG_DETAIL,
  AGUSTUS_BIDANG_SUMMARY,
  AGUSTUS_BIDANG_DETAIL,
  JULI_BIDANG_SUMMARY,
  JULI_BIDANG_DETAIL,
  JUNI_BIDANG_SUMMARY,
  JUNI_BIDANG_DETAIL,
  MEI_BIDANG_SUMMARY,
  MEI_BIDANG_DETAIL,
  APRIL_BIDANG_SUMMARY,
  APRIL_BIDANG_DETAIL,
  MARET_BIDANG_SUMMARY,
  MARET_BIDANG_DETAIL,
} from "../data/masterData";

/* ─── Helper: konversi URL Google Sheets ke embed URL yang optimal ─── */
export function getEmbedUrl(rawUrl, gid) {
  if (!rawUrl) return "";
  let url = rawUrl.trim();

  const sheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch && sheetMatch[1]) {
    const sheetId = sheetMatch[1];
    let targetGid = gid;
    if (!targetGid) {
      const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
      if (gidMatch) targetGid = gidMatch[1];
    }
    const gidParam = targetGid ? `gid=${targetGid}&` : "";
    return `https://docs.google.com/spreadsheets/d/${sheetId}/htmlembed?${gidParam}widget=false`;
  }

  if (url.includes("docs.google.com/spreadsheets/d/e/") && url.includes("pubhtml")) {
    const sep = url.includes("?") ? "&" : "?";
    const gidParam = gid ? `gid=${gid}&` : "";
    return `${url}${sep}${gidParam}widget=false`;
  }

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  if (url.includes("onedrive.live.com") || url.includes("sharepoint.com")) {
    if (!url.includes("action=embedview")) {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}action=embedview&wdAllowInteractivity=True`;
    }
  }

  return url;
}

/* ─── Konstanta Default ─── */
const DEFAULT_SHEET_BASE = "https://docs.google.com/spreadsheets/d/1DR7lNNAK4UBbFRGqhG2uDB5ANHmz-g8v/edit";
const DEFAULT_SHEET_NAME = "HASIL VERIFIKASI DIGITALISASI KEUANGAN TW 1.xlsx";

/* ════════════════════════════════════════════════════════════
   DATA BIDANG (SDA / CKPS / UPTU)
   ════════════════════════════════════════════════════════════ */
const BIDANG_ORDER = ["SDA", "CKPS", "UPTU"];
const BIDANG_FILTER_SEMUA = "SEMUA";

const BIDANG_META = (() => {
  const meta = {};
  (RESUME_VERIFIKASI_JAN_JUNI.bidang || []).forEach((b) => {
    meta[b.kode] = {
      nama: b.nama,
      icon: b.icon,
      color: b.color,
    };
  });
  // Cadangan bila resume tidak memuat salah satu bidang.
  const cadangan = {
    SDA: { nama: "Sumber Daya Air (SDA)", icon: "💧", color: "#0284c7" },
    CKPS: { nama: "Cipta Karya & Prasarana Strategis (CKPS)", icon: "🏗️", color: "#059669" },
    UPTU: { nama: "Unit Pelaksana Teknis Umum / Tata Usaha (UPTU)", icon: "🏢", color: "#16a34a" },
  };
  BIDANG_ORDER.forEach((k) => {
    if (!meta[k]) meta[k] = cadangan[k];
  });
  return meta;
})();

/* Data daftar SPM per periode (tab JAN SD ... s.d. AGUSTUS) */
const PERIODE_DATA = {
  agustus: { summary: AGUSTUS_BIDANG_SUMMARY, detail: AGUSTUS_BIDANG_DETAIL },
  juli: { summary: JULI_BIDANG_SUMMARY, detail: JULI_BIDANG_DETAIL },
  juni: { summary: JUNI_BIDANG_SUMMARY, detail: JUNI_BIDANG_DETAIL },
  mei: { summary: MEI_BIDANG_SUMMARY, detail: MEI_BIDANG_DETAIL },
  april: { summary: APRIL_BIDANG_SUMMARY, detail: APRIL_BIDANG_DETAIL },
  maret: { summary: MARET_BIDANG_SUMMARY, detail: MARET_BIDANG_DETAIL },
};

/* ─── Helper format ─── */
function rupiah(v) {
  if (typeof v === "number" && isFinite(v)) return "Rp " + v.toLocaleString("id-ID");
  if (v == null || v === "") return "—";
  return "Rp " + String(v).replace(/[^\d.,-]/g, "");
}

function bidangAktif(filter) {
  return filter === BIDANG_FILTER_SEMUA ? BIDANG_ORDER : [filter];
}

function badgeStatus(text) {
  const s = String(text || "").toUpperCase();
  if (s.includes("LENGKAP") || s.includes("APPROVED") || s.includes("TERVERIFIKASI")) {
    return { bg: "#e8f8ef", color: "#15803d" };
  }
  if (s.includes("TIDAK") || s.includes("REJECT") || s.includes("TOLAK")) {
    return { bg: "#fef2f2", color: "#dc2626" };
  }
  if (s.includes("PENDING") || s.includes("PROSES")) {
    return { bg: "#fef9c3", color: "#a16207" };
  }
  return { bg: "#f1f5f9", color: "#475569" };
}

/* ════════════════════════════════════════════════════════════
   KOMPONEN KECIL
   ════════════════════════════════════════════════════════════ */
function SectionHeading({ icon, title, note }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        margin: "26px 0 10px",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span> {title}
      </h3>
      {note && <span style={{ fontSize: 12, color: "#64748b" }}>{note}</span>}
    </div>
  );
}

function RingkasanCard({ label, value, color, hint }) {
  return (
    <div
      style={{
        flex: "1 1 160px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "12px 14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || "#0f172a", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function FilterBidangBar({ value, onChange }) {
  const items = [
    { id: BIDANG_FILTER_SEMUA, label: "Semua Bidang", icon: "📑" },
    { id: "SDA", label: "SDA", icon: BIDANG_META.SDA.icon },
    { id: "CKPS", label: "CKPS", icon: BIDANG_META.CKPS.icon },
    { id: "UPTU", label: "UPTU", icon: BIDANG_META.UPTU.icon },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "14px 0 4px" }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginRight: 2 }}>Filter Bidang:</span>
      {items.map((it) => (
        <button
          key={it.id}
          className={`vt-filter-bidang-btn${value === it.id ? " active" : ""}`}
          onClick={() => onChange(it.id)}
        >
          {it.icon} {it.label}
        </button>
      ))}
    </div>
  );
}

/* ── 1. Resume Hasil Verifikasi (per bidang) ── */
function ResumeTable({ resume }) {
  return (
    <div className="vt-resume-box">
      <div className="vt-resume-banner">
        <div className="vt-resume-title-wrap">
          <h2>{resume.judul}</h2>
          <p>{resume.periode}</p>
        </div>
        <span className="vt-resume-status-badge">✅ {resume.statusVerifikasi}</span>
      </div>

      <div className="vt-resume-table-wrap">
        <table className="vt-resume-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Bidang</th>
              <th>Realisasi SP2D (Rp)</th>
              <th>Bukti Lengkap (Rp)</th>
              <th>Selisih (Rp)</th>
              <th>Persentase</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(resume.bidang || []).map((b) => {
              const meta = BIDANG_META[b.kode] || {};
              return (
                <tr key={b.kode}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: (b.color || meta.color) + "1a",
                          color: b.color || meta.color,
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {b.icon || meta.icon}
                      </span>
                      <span>
                        <span style={{ fontWeight: 800, color: "#1e293b" }}>{b.kode}</span>
                        <span style={{ color: "#64748b", fontWeight: 500, display: "block", fontSize: 12 }}>
                          {b.nama}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="vt-num-cell">{rupiah(b.realisasiNominal)}</td>
                  <td className="vt-num-cell">{rupiah(b.buktiNominal)}</td>
                  <td className="vt-num-cell">{rupiah(b.selisih)}</td>
                  <td>
                    <span className="vt-percent-badge" style={{ color: b.color || "#0f172a" }}>
                      {b.prosentaseStr}
                    </span>
                  </td>
                  <td>
                    <span className="vt-status-badge" style={badgeStatus(b.status)}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {resume.total && (
            <tfoot>
              <tr>
                <td>TOTAL REKAPITULASI</td>
                <td className="vt-num-cell">{rupiah(resume.total.realisasiNominal)}</td>
                <td className="vt-num-cell">{rupiah(resume.total.buktiNominal)}</td>
                <td className="vt-num-cell">{rupiah(resume.total.selisih)}</td>
                <td>
                  <span className="vt-percent-badge" style={{ color: "#0f172a" }}>
                    {resume.total.prosentaseStr}
                  </span>
                </td>
                <td>—</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* ── 2. Rekap Kelengkapan Dokumen Pertanggungjawaban (Sheet2, per bidang) ── */
function RekapKelengkapan({ filterBidang }) {
  const daftarBidang = bidangAktif(filterBidang);
  const rows = [];
  daftarBidang.forEach((k) => {
    (SHEET2_BIDANG_DETAIL[k] || []).forEach((r) => rows.push({ ...r, bidang: k }));
  });

  const totSpm = daftarBidang.reduce((a, k) => a + (Number(SHEET2_BIDANG_SUMMARY[k]?.jumlahSpmTotal) || 0), 0);
  const totKurang = daftarBidang.reduce((a, k) => a + (Number(SHEET2_BIDANG_SUMMARY[k]?.tidakTersedia) || 0), 0);

  return (
    <section>
      <SectionHeading
        icon="🗂️"
        title="Rekap Kelengkapan Dokumen Pertanggungjawaban (per Bidang)"
        note="Sumber: lembar Sheet2 — REKAPITULASI ... STATUS S.D 12 JULI 2026"
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <RingkasanCard label="Total SPM" value={totSpm.toLocaleString("id-ID")} color="#1B2A6B" hint={daftarBidang.join(" + ")} />
        <RingkasanCard label="Tidak Tersedia" value={totKurang.toLocaleString("id-ID")} color="#dc2626" hint="Perlu tindak lanjut" />
        {daftarBidang.map((k) => {
          const s = SHEET2_BIDANG_SUMMARY[k];
          return (
            <RingkasanCard
              key={k}
              label={`${k} · Target`}
              value={s ? s.target : "—"}
              color={BIDANG_META[k]?.color || "#0f172a"}
              hint={`${k} — ${s ? ((Number(s.jumlahSpmTotal) || 0) - (Number(s.tidakTersedia) || 0)).toLocaleString("id-ID") : "—"} tersedia`}
            />
          );
        })}
      </div>

      <div className="vt-table-wrapper">
        <table className="vt-table">
          <thead>
            <tr>
              <th className="vt-th-no">No</th>
              <th>Bidang</th>
              <th style={{ whiteSpace: "normal", minWidth: 320 }}>Kegiatan</th>
              <th>SPM Tersedia</th>
              <th>Tidak Tersedia</th>
              <th>Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="vt-empty-row">
                  Tidak ada data untuk bidang terpilih.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.bidang}-${r.no}`}>
                <td>{i + 1}</td>
                <td>
                  <span style={{ fontWeight: 700, color: BIDANG_META[r.bidang]?.color || "#334155" }}>
                    {BIDANG_META[r.bidang]?.icon} {r.bidang}
                  </span>
                </td>
                <td style={{ whiteSpace: "normal", color: "#1e293b" }}>{r.kegiatan}</td>
                <td className="vt-num-cell" style={{ fontWeight: 700, color: "#15803d" }}>
                  {r.tersedia}
                </td>
                <td className="vt-num-cell" style={{ fontWeight: 700, color: r.tidakTersedia > 0 ? "#dc2626" : "#94a3b8" }}>
                  {r.tidakTersedia}
                </td>
                <td>
                  <span className="vt-status-badge" style={r.tindakLanjut && r.tindakLanjut !== "—" ? { bg: "#eff6ff", color: "#1d4ed8" } : { bg: "#f1f5f9", color: "#64748b" }}>
                    {r.tindakLanjut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── 3. Ringkasan + Daftar SPM per periode (per bidang) ── */
function RingkasanSPM({ summary, label, filterBidang }) {
  const daftarBidang = bidangAktif(filterBidang);
  const totJumlah = daftarBidang.reduce((a, k) => a + (Number(summary[k]?.jumlahSpm) || 0), 0);
  const totKurang = daftarBidang.reduce((a, k) => a + (Number(summary[k]?.tidakTersedia) || 0), 0);

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
      <RingkasanCard label={`Jumlah SPM · ${label}`} value={totJumlah.toLocaleString("id-ID")} color="#1B2A6B" hint={daftarBidang.join(" + ")} />
      <RingkasanCard label="Tidak Tersedia" value={totKurang.toLocaleString("id-ID")} color="#dc2626" hint="Berkas belum lengkap" />
      {daftarBidang.map((k) => {
        const s = summary[k] || {};
        return (
          <RingkasanCard
            key={k}
            label={`${k} · Verifikasi`}
            value={`${(Number(s.jumlahSpm) || 0).toLocaleString("id-ID")} SPM`}
            color={BIDANG_META[k]?.color || "#0f172a"}
            hint={Number(s.tidakTersedia) > 0 ? `${s.tidakTersedia} tidak tersedia` : "Lengkap semua"}
          />
        );
      })}
    </div>
  );
}

function DaftarSPM({ detail, label, filterBidang }) {
  const rows = [];
  bidangAktif(filterBidang).forEach((k) => {
    (detail[k] || []).forEach((r) => rows.push({ ...r, bidang: k }));
  });

  const totalRealisasi = rows.reduce((a, r) => a + (Number(r.realisasi) || 0), 0);
  const jumlahLengkap = rows.filter((r) => String(r.status || "").toUpperCase().includes("LENGKAP")).length;

  return (
    <section>
      <SectionHeading
        icon="🧾"
        title={`Daftar SPM Pertanggungjawaban — ${label}`}
        note={rows.length > 0 ? `${jumlahLengkap} lengkap dari ${rows.length} baris contoh` : "Tidak ada data"}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <RingkasanCard label="Total Realisasi" value={rupiah(totalRealisasi)} color="#0284c7" hint="Dari baris yang tampil" />
        <RingkasanCard label="Status Lengkap" value={`${jumlahLengkap} / ${rows.length}`} color="#15803d" hint="Bukti berkas tersedia" />
      </div>

      <div className="vt-table-wrapper">
        <table className="vt-table">
          <thead>
            <tr>
              <th className="vt-th-no">No</th>
              <th>Bidang</th>
              <th>Kode Kegiatan</th>
              <th>Realisasi (Rp)</th>
              <th>No. SPM</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="vt-empty-row">
                  Tidak ada data untuk bidang terpilih.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.bidang}-${r.noSpm}-${i}`}>
                <td>{i + 1}</td>
                <td>
                  <span style={{ fontWeight: 700, color: BIDANG_META[r.bidang]?.color || "#334155" }}>
                    {BIDANG_META[r.bidang]?.icon} {r.bidang}
                  </span>
                </td>
                <td style={{ color: "#1e293b" }}>{r.kodeKegiatan || "—"}</td>
                <td className="vt-num-cell">{r.realisasi ? rupiah(r.realisasi) : "—"}</td>
                <td>{r.noSpm}</td>
                <td>
                  <span className="vt-status-badge" style={badgeStatus(r.status)}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── 4. Daftar Dokumen (Sheet1 & Sheet2, kolom bidang) ── */
function DaftarDokumen({ data, label, filterBidang }) {
  const rows = data.filter((r) => filterBidang === BIDANG_FILTER_SEMUA || r.bidang === filterBidang);
  const adaBidang = rows.some((r) => r.bidang);

  return (
    <section>
      <SectionHeading
        icon="📁"
        title={`Daftar Dokumen — ${label}`}
        note={`${rows.length} berkas terverifikasi`}
      />

      <div className="vt-table-wrapper">
        <table className="vt-table">
          <thead>
            <tr>
              <th className="vt-th-no">No</th>
              <th>Dokumen</th>
              <th>Kategori</th>
              {adaBidang && <th>Bidang</th>}
              <th>Ukuran</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={adaBidang ? 6 : 5} className="vt-empty-row">
                  Tidak ada data untuk bidang terpilih.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${label}-${r.id}-${i}`}>
                <td>{i + 1}</td>
                <td style={{ whiteSpace: "normal", minWidth: 280 }}>
                  <div style={{ fontWeight: 700, color: "#1e293b" }}>{r.namaDokumen}</div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{r.tglUpload}</div>
                </td>
                <td style={{ color: "#64748b" }}>{r.kategori || "—"}</td>
                {adaBidang && (
                  <td>
                    <span style={{ fontWeight: 700, color: BIDANG_META[r.bidang]?.color || "#64748b" }}>
                      {r.bidang || "—"}
                    </span>
                  </td>
                )}
                <td>{r.ukuran || "—"}</td>
                <td>
                  <span className="vt-status-badge" style={badgeStatus(r.status)}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT UTAMA
   ════════════════════════════════════════════════════════════ */
export default function ProsesBisnis() {
  /* Sheet / periode aktif */
  const [activeSheetId, setActiveSheetId] = useState("agustus");

  /* Filter bidang */
  const [filterBidang, setFilterBidang] = useState(BIDANG_FILTER_SEMUA);

  /* Spreadsheet states (link dipakai Dashboard / DataKegiatan untuk
     membaca data live — jangan dihapus) */
  const [sheetUrl, setSheetUrl] = useState(() =>
    localStorage.getItem("pu_spreadsheet_link") || DEFAULT_SHEET_BASE
  );
  const [sheetName, setSheetName] = useState(() =>
    localStorage.getItem("pu_spreadsheet_name") || DEFAULT_SHEET_NAME
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(sheetUrl);
  const [inputName, setInputName] = useState(sheetName);

  const activeTabObj = SHEET_TABS.find((t) => t.id === activeSheetId) || SHEET_TABS[0];
  const periode = PERIODE_DATA[activeSheetId];
  const isDokumen = activeSheetId === "sheet1" || activeSheetId === "sheet2";

  /* Simpan URL & Nama Spreadsheet baru */
  const handleSaveSheet = (newUrl, newName) => {
    const finalUrl = newUrl.trim() || DEFAULT_SHEET_BASE;
    const finalName = newName.trim() || DEFAULT_SHEET_NAME;
    setSheetUrl(finalUrl);
    setSheetName(finalName);
    setInputUrl(finalUrl);
    setInputName(finalName);
    localStorage.setItem("pu_spreadsheet_link", finalUrl);
    localStorage.setItem("pu_spreadsheet_name", finalName);
    setIsModalOpen(false);
  };

  /* Jumlah baris per tab (untuk badge di tab) */
  const hitungJumlahTab = (id) => {
    if (id === "sheet1" || id === "sheet2") {
      return (SHEET_DATA[id] || []).length;
    }
    const p = PERIODE_DATA[id];
    if (!p) return null;
    return BIDANG_ORDER.reduce((a, k) => a + (Number(p.summary[k]?.jumlahSpm) || 0), 0);
  };

  return (
    <>
      <div className="vt-page">

        {/* ── BREADCRUMB & HEADER ATAS ── */}
        <div
          className="table-top-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 18 }}
        >
          <div>
            <div className="table-breadcrumb">🏛️ SIPKA-PU / HASIL VERIFIKASI DIGITALISASI</div>
            <h1 className="table-page-title">Hasil Verifikasi Digitalisasi</h1>
            <div className="vt-active-sheet-label" style={{ marginTop: 6 }}>
              <span className="vt-sheet-dot" />
              <span style={{ fontWeight: 600, color: "#1e293b" }}>{sheetName}</span>
              <span style={{ color: "#94a3b8" }}>•</span>
              <span style={{ color: "#4361c2", fontWeight: 600 }}>Lembar: {activeTabObj.label}</span>
            </div>
          </div>

          {/* Action buttons di kanan atas */}
          <div className="vt-live-actions">
            <button
              className="vt-act-btn vt-act-primary"
              onClick={() => {
                setInputUrl(sheetUrl);
                setInputName(sheetName);
                setIsModalOpen(true);
              }}
              title="Ganti tautan spreadsheet"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Ganti Link
            </button>
          </div>
        </div>

        {/* ══ 1. RESUME HASIL VERIFIKASI PER BIDANG ══ */}
        <ResumeTable resume={RESUME_VERIFIKASI_JAN_JUNI} />

        {/* ══ 2. TAB PERIODE (Sheet1, Sheet2, JAN SD ... ) ══ */}
        <div className="vt-sheet-bar" style={{ marginTop: 12 }}>
          <div className="vt-sheet-bar-inner">
            {SHEET_TABS.map((sheet) => {
              const isActive = activeSheetId === sheet.id;
              const jumlah = hitungJumlahTab(sheet.id);
              return (
                <button
                  key={sheet.id}
                  className={`vt-sheet-tab${isActive ? " active" : ""}`}
                  onClick={() => setActiveSheetId(sheet.id)}
                  title={`Buka lembar: ${sheet.label}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="9" x2="9" y2="21"/>
                  </svg>
                  <span>{sheet.label}</span>
                  {jumlah !== null && <span className="vt-sheet-tab-count">{jumlah}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ FILTER BIDANG ══ */}
        <FilterBidangBar value={filterBidang} onChange={setFilterBidang} />

        {/* ══ KONTEN PER TAB ══ */}
        {isDokumen ? (
          <>
            {activeSheetId === "sheet2" && <RekapKelengkapan filterBidang={filterBidang} />}
            <DaftarDokumen
              data={SHEET_DATA[activeSheetId] || []}
              label={activeTabObj.label}
              filterBidang={filterBidang}
            />
          </>
        ) : periode ? (
          <>
            <RingkasanSPM
              summary={periode.summary}
              label={activeTabObj.label}
              filterBidang={filterBidang}
            />
            <DaftarSPM
              detail={periode.detail}
              label={activeTabObj.label}
              filterBidang={filterBidang}
            />
          </>
        ) : null}

        {/* ── FOOTER TIPS ── */}
        <div className="vt-bottom-info" style={{ marginTop: 26 }}>
          <span>
            💡 <strong>Petunjuk:</strong> Gunakan tab lembar kerja di atas untuk memilih periode (Sheet1, Sheet2,
            Salinan dari JAN SD AGUSTUS, JAN SD JULI, dst.), lalu tombol <strong>Filter Bidang</strong> untuk memisahkan
            data per bidang (SDA / CKPS / UPTU). Seluruh angka mengacu pada hasil verifikasi digitalisasi yang tersimpan.
          </span>
        </div>

      </div>

      {/* ── MODAL: Ganti Link Spreadsheet ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <span className="modal-title">Tautkan Link Spreadsheet</span>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: 22 }}>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 0, marginBottom: 16 }}>
                Masukkan URL Google Spreadsheet yang memiliki akses <em>Siapa saja yang memiliki link</em> sebagai <em>Pelihat</em>. Sistem akan otomatis memformat tautan ke dalam tabel.
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Judul Spreadsheet *
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  placeholder={DEFAULT_SHEET_NAME}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Link Google Sheets *
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setInputUrl(DEFAULT_SHEET_BASE);
                  setInputName(DEFAULT_SHEET_NAME);
                }}
                style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", cursor: "pointer" }}
              >
                🔄 Gunakan Link Default Kementerian PU
              </button>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 22px" }}>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Batal</button>
              <button className="btn-submit" onClick={() => handleSaveSheet(inputUrl, inputName)} disabled={!inputUrl.trim()}>
                Simpan &amp; Tampilkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}