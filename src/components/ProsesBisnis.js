import React, { useState, useMemo } from "react";
import { SHEET_TABS } from "../data/masterData";

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

/* ════════════════════════════════════════ COMPONENT ════════════════════════════════════════ */
export default function ProsesBisnis() {
  /* Sheet aktif */
  const [activeSheetId, setActiveSheetId] = useState("sheet1");

  /* Spreadsheet states */
  const [sheetUrl, setSheetUrl] = useState(() =>
    localStorage.getItem("pu_spreadsheet_link") || DEFAULT_SHEET_BASE
  );
  const [sheetName, setSheetName] = useState(() =>
    localStorage.getItem("pu_spreadsheet_name") || DEFAULT_SHEET_NAME
  );

  const [iframeKey, setIframeKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(sheetUrl);
  const [inputName, setInputName] = useState(sheetName);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* Ambil data sheet aktif */
  const activeTabObj = useMemo(() => {
    return SHEET_TABS.find(t => t.id === activeSheetId) || SHEET_TABS[0];
  }, [activeSheetId]);

  /* Buat embed URL live sesuai sheet dan gid yang dipilih */
  const liveEmbedUrl = useMemo(() => {
    return getEmbedUrl(sheetUrl, activeTabObj?.gid);
  }, [sheetUrl, activeTabObj]);

  /* URL untuk buka di tab baru (Google Sheets langsung ke GID terkait) */
  const openExternalUrl = useMemo(() => {
    const base = sheetUrl.replace(/[?&]gid=[0-9]*/g, "").replace(/[?&]$/, "");
    const sep = base.includes("?") ? "&" : "?";
    return activeTabObj?.gid ? `${base}${sep}gid=${activeTabObj.gid}` : sheetUrl;
  }, [sheetUrl, activeTabObj]);

  /* Ganti Sheet Tab */
  const handleSheetChange = (sheetId) => {
    if (sheetId === activeSheetId) return;
    setIsLoading(true);
    setActiveSheetId(sheetId);
    setTimeout(() => setIsLoading(false), 500);
  };

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
    setIframeKey(k => k + 1);
  };

  return (
    <>
      <div className="vt-page">

        {/* ── BREADCRUMB & HEADER ATAS ── */}
        <div className="table-top-header" style={{ marginBottom: 18 }}>
          <div>
            <div className="table-breadcrumb">🏛️ SIPKA-PU / HASIL VERIFIKASI DIGITALISASI</div>
            <h1 className="table-page-title">Hasil Verifikasi Digitalisasi</h1>
            <div className="vt-active-sheet-label" style={{ marginTop: 6 }}>
              <span className="vt-sheet-dot" />
              <span style={{ fontWeight: 600, color: "#1e293b" }}>{sheetName}</span>
              <span style={{ color: "#94a3b8" }}>•</span>
              <span className="vt-connected-badge">🟢 Live Spreadsheet</span>
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

            <button
              className="vt-act-btn"
              onClick={() => {
                setIsLoading(true);
                setIframeKey(k => k + 1);
                setTimeout(() => setIsLoading(false), 500);
              }}
              title="Muat ulang spreadsheet"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>

            <button
              className="vt-act-btn"
              onClick={() => setIsFullscreen(true)}
              title="Tampilkan layar penuh"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              Fullscreen
            </button>

            <button
              className="vt-act-btn vt-act-green"
              onClick={() => window.open(openExternalUrl, "_blank")}
              title="Buka langsung di Google Sheets tab baru"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Buka Tab Baru ↗
            </button>
          </div>
        </div>

        {/* ══════════════ TABEL YANG SUDAH DIPERBARUI DENGAN SPREADSHEET LIVE DI DALAMNYA ══════════════ */}
        <div className="vt-live-card-container">
          
          {/* Card Top Toolbar */}
          <div className="vt-live-card-toolbar">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="vt-live-icon-small">📊</div>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>
                  {activeTabObj.label}
                </span>
                <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
                  (GID: {activeTabObj.gid})
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
              <span className="vt-badge-sync">
                <span className="vt-sync-dot" /> Sinkronisasi Real-Time
              </span>
              <span
                className="vt-copy-link"
                onClick={() => {
                  navigator.clipboard.writeText(openExternalUrl);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
              >
                {copySuccess ? "✓ Tautan Disalin!" : "Salin Link Sheet"}
              </span>
            </div>
          </div>

          {/* Area Live Spreadsheet (Di dalam Card Tabel) */}
          <div className="vt-live-embed-body">
            {isLoading && (
              <div className="vt-embed-loading">
                <div className="vt-spinner" />
                <span>Memuat {activeTabObj.label}...</span>
              </div>
            )}

            {liveEmbedUrl ? (
              <iframe
                key={`${iframeKey}-${activeSheetId}`}
                src={liveEmbedUrl}
                className="vt-live-iframe"
                title={`${sheetName} - ${activeTabObj.label}`}
                allow="autoplay; fullscreen"
              />
            ) : (
              <div className="vt-iframe-empty">
                <p>Belum ada tautan spreadsheet.</p>
                <button className="vt-act-btn vt-act-primary" onClick={() => setIsModalOpen(true)}>
                  Tautkan Sekarang
                </button>
              </div>
            )}
          </div>

          {/* ── SHEET TABS BAR (Persis seperti Google Sheets di bagian bawah tabel) ── */}
          <div className="vt-sheet-bar-embedded">
            <div className="vt-sheet-bar-inner">
              {SHEET_TABS.map(sheet => {
                const isActive = activeSheetId === sheet.id;
                return (
                  <button
                    key={sheet.id}
                    className={`vt-sheet-tab${isActive ? " active" : ""}`}
                    onClick={() => handleSheetChange(sheet.id)}
                    title={`Buka lembar: ${sheet.label}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="9" x2="9" y2="21"/>
                    </svg>
                    <span>{sheet.label}</span>
                    {isActive && <span className="vt-sheet-active-indicator" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── FOOTER TIPS ── */}
        <div className="vt-bottom-info">
          <span>
            💡 <strong>Petunjuk:</strong> Klik tab lembar kerja di bagian bawah tabel di atas untuk berpindah antar sheet (Sheet1, Sheet2, Salinan dari JAN SD AGUSTUS, dll). Seluruh data disajikan langsung secara <em>real-time</em> dari Google Spreadsheet resmi.
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

      {/* ── MODAL: Layar Penuh (Fullscreen) ── */}
      {isFullscreen && (
        <div className="sheet-fullscreen-modal">
          <div className="sheet-fullscreen-content">
            <div style={{ padding: "12px 20px", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>📊</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{sheetName}</h4>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>{activeTabObj.label} – Mode Layar Penuh</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="vt-act-btn vt-act-green" onClick={() => window.open(openExternalUrl, "_blank")}>
                  Buka Tab Baru ↗
                </button>
                <button
                  className="vt-act-btn"
                  style={{ background: "#334155", color: "#fff", borderColor: "#475569" }}
                  onClick={() => setIsFullscreen(false)}
                >
                  ✕ Tutup
                </button>
              </div>
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <iframe
                src={liveEmbedUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                title={`${sheetName} Fullscreen`}
                allow="autoplay; fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
