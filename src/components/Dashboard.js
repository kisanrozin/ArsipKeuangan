import React, { useState, useEffect } from "react";

/* ── Reusable Hero Banner ── */
export function HeroBanner({ title, subtitle, crumbs }) {
  return (
    <div className="hero-banner" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/hero_library.jpeg)` }}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-subtitle">{subtitle}</p>
        <div className="hero-breadcrumb">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Konstanta Integrasi Cloud & Drive ── */
const SPJ_FOLDER_ID = "1gZkmFPnVyWO5fqWLsHGAv_eu56WOdt_8";
const DIPA_FOLDER_ID = "1A1KD9grE5z-ldfSfxFORuh4NILc5sIuN";
const API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";
const DEFAULT_SHEET_BASE = "https://docs.google.com/spreadsheets/d/1DR7lNNAK4UBbFRGqhG2uDB5ANHmz-g8v/edit";

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
export default function Dashboard({ setActivePage }) {
  const [stats, setStats] = useState({
    totalArsip: null,
    totalDipa: null,
    persenVerifikasi: null,
    totalBidang: null,
    bidangList: [],
    lastSync: null,
    loading: true,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fungsi pengambilan data live terpadu
  const loadLiveStats = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const timestamp = Date.now();

      // 1. Ambil jumlah berkas/folder secara real-time dari Google Drive Arsip Digital (SPJ)
      let spjCount = 0;
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${SPJ_FOLDER_ID}'+in+parents+and+trashed=false&fields=files(id,mimeType)&pageSize=1000&key=${API_KEY}&_t=${timestamp}`,
          { cache: "no-store", headers: { "Pragma": "no-cache" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.files && Array.isArray(data.files)) {
            spjCount = data.files.length;
          }
        }
      } catch (e) {
        console.warn("Drive SPJ count error:", e);
      }

      // 2. Ambil jumlah dokumen secara real-time dari Google Drive Dokumen DIPA & POK
      let dipaCount = 0;
      try {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${DIPA_FOLDER_ID}'+in+parents+and+trashed=false&fields=files(id,mimeType)&pageSize=1000&key=${API_KEY}&_t=${timestamp}`,
          { cache: "no-store", headers: { "Pragma": "no-cache" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.files && Array.isArray(data.files)) {
            dipaCount = data.files.length;
          }
        }
      } catch (e) {
        console.warn("Drive DIPA count error:", e);
      }

      // 3. Ambil data kalkulasi secara real-time dari Google Spreadsheet (Kelengkapan SP2D & Bidang Kerja)
      let avgPercent = "0%";
      let bidangCount = 0;
      let bidangNames = [];
      try {
        const savedSheetUrl = localStorage.getItem("pu_spreadsheet_link") || DEFAULT_SHEET_BASE;
        const sheetMatch = savedSheetUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        const currentSheetId = sheetMatch ? sheetMatch[1] : "1DR7lNNAK4UBbFRGqhG2uDB5ANHmz-g8v";

        // Menggunakan Google Visualization API (GVIZ out:json) yang CORS-friendly dan real-time
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${currentSheetId}/gviz/tq?tqx=out:json`;
        const res = await fetch(gvizUrl);
        if (res.ok) {
          const rawText = await res.text();
          const startIdx = rawText.indexOf("{");
          const endIdx = rawText.lastIndexOf("}");
          if (startIdx !== -1 && endIdx !== -1) {
            const data = JSON.parse(rawText.substring(startIdx, endIdx + 1));
            if (data && data.table && Array.isArray(data.table.rows)) {
              const validBidang = [];
              data.table.rows.forEach((row) => {
                if (!row || !row.c || !Array.isArray(row.c)) return;
                const cells = row.c;
                // Cari nama bidang secara dinamis
                const nameCell = cells.find(
                  (c) =>
                    c &&
                    typeof c.v === "string" &&
                    c.v.trim().length > 0 &&
                    !c.v.toLowerCase().includes("resume") &&
                    !c.v.toLowerCase().includes("status verifikasi") &&
                    c.v.toUpperCase() !== "BIDANG"
                );
                if (!nameCell) return;
                const colName = nameCell.v.trim();

                // Cari persentase kelengkapan berkas secara dinamis dari kolom baris
                let percentVal = null;
                for (let i = cells.length - 1; i >= 0; i--) {
                  const cell = cells[i];
                  if (!cell) continue;
                  if (cell.f && cell.f.includes("%")) {
                    const m = cell.f.match(/([0-9]+(?:[.,][0-9]+)?)\s*%/);
                    if (m) {
                      percentVal = parseFloat(m[1].replace(",", "."));
                      break;
                    }
                  }
                  if (typeof cell.v === "number" && cell.v > 0 && cell.v <= 1) {
                    percentVal = cell.v * 100;
                    break;
                  }
                  if (typeof cell.v === "number" && cell.v > 1 && cell.v <= 100) {
                    percentVal = cell.v;
                    break;
                  }
                }

                if (percentVal !== null && !isNaN(percentVal)) {
                  validBidang.push({
                    name: colName,
                    percent: percentVal,
                  });
                }
              });

              if (validBidang.length > 0) {
                const sum = validBidang.reduce((acc, curr) => acc + curr.percent, 0);
                const avg = sum / validBidang.length;
                avgPercent = `${avg.toFixed(1)}%`;
                bidangCount = validBidang.length;
                bidangNames = validBidang.map((b) => b.name);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Spreadsheet GVIZ stats fetch error:", e);
      }

      setStats({
        totalArsip: spjCount,
        totalDipa: dipaCount,
        persenVerifikasi: avgPercent,
        totalBidang: bidangCount,
        bidangList: bidangNames,
        lastSync: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        loading: false,
      });
    } catch (err) {
      console.warn("Global stats load error:", err);
      setStats(prev => ({ ...prev, loading: false }));
    } finally {
      if (showSpinner) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  useEffect(() => {
    // 1. Panggil saat pertama kali dimuat
    loadLiveStats(false);

    // 2. Interval polling berkala (setiap 6 detik) agar terus live
    const intervalId = setInterval(() => {
      loadLiveStats(false);
    }, 6000);

    // 3. Re-fetch instan saat jendela/tab browser difokuskan kembali
    const handleFocus = () => loadLiveStats(false);
    const handleVisibility = () => {
      if (!document.hidden) loadLiveStats(false);
    };

    // 4. Re-fetch saat ada mutasi upload/delete dokumen lokal di aplikasi
    const handleLocalUpdate = () => loadLiveStats(false);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pu_files_updated", handleLocalUpdate);
    window.addEventListener("storage", handleLocalUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pu_files_updated", handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
    };
  }, []);

  return (
    <>
      <HeroBanner
        title="DIARKES"
        subtitle="DIGITALISASI ARSIP KEUANGAN PUSAT PENGEMBANGAN KOMPETENSI SUMBER DAYA AIR , CIPTA KARYA DAN PRASARANA STRATEGIS"
        crumbs={["Beranda", "Dashboard"]}
      />

      <div className="site-content">
        {/* ── Section intro: image + text ── */}
        <div className="section-intro">
          <img
            src="/hero_library.jpeg"
            alt="Perpustakaan PUPR"
            className="section-intro-img"
          />
          <div className="section-intro-text">
            <h2>Digitalisasi Arsip Keuangan</h2>
            <p>
              inisiatif pengelolaan dan penyimpanan dokumen keuangan berbasis digital di lingkungan Pusat Pengembangan Kompetensi Sumber Daya Air, Cipta Karya, dan Prasarana Strategis.
            </p>
            <p style={{ marginTop: 10 }}>
              Sistem ini dirancang untuk mengidentifikasi serta mengoptimalkan alur proses bisnis pengarsipan, mengakomodasi kebutuhan tata kelola administrasi keuangan instansi, serta mengelompokkan berbagai jenis dokumen transaksi dan pertanggungjawaban keuangan secara terstruktur, aman, dan mudah diakses.
            </p>
          </div>
        </div>

        <hr className="divider" />

        {/* ── Top Header Stats ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              📊 Ringkasan Statistik Operasional
            </span>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#ecfdf5",
              color: "#059669",
              fontSize: 11.5,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid #a7f3d0"
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.4)",
                display: "inline-block"
              }}></span>
              Live Sync Aktif
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => loadLiveStats(true)}
              disabled={isRefreshing}
              title="Perbarui data dari Drive dan Spreadsheet sekarang"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 13px",
                fontSize: 12,
                fontWeight: 600,
                color: "#1e3a8a",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                cursor: isRefreshing ? "wait" : "pointer",
                transition: "all 0.2s"
              }}
            >
              <span style={{
                display: "inline-block",
                transform: isRefreshing ? "rotate(360deg)" : "none",
                transition: isRefreshing ? "transform 0.6s linear" : "none"
              }}>
                🔄
              </span>
              {isRefreshing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
            </button>
            {stats.lastSync && (
              <span style={{ fontSize: 11.5, color: "#64748b" }}>
                Terakhir diperbarui: pk. {stats.lastSync} WIB
              </span>
            )}
          </div>
        </div>

        {/* ── Dynamic Stats Cards ── */}
        <div className="stat-row" style={{ marginBottom: 40 }}>
          <div
            className="stat-card"
            style={{ "--c": "#1B2A6B", cursor: "pointer" }}
            onClick={() => setActivePage && setActivePage("kebutuhan")}
            title="Klik untuk membuka Berkas Arsip Digital"
          >
            <div className="stat-num">{stats.totalArsip !== null ? stats.totalArsip : "—"}</div>
            <div className="stat-lbl">Berkas Arsip Digital</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: 500 }}>Google Drive SPJ ↗</div>
          </div>

          <div
            className="stat-card"
            style={{ "--c": "#0284c7", cursor: "pointer" }}
            onClick={() => setActivePage && setActivePage("dokumen")}
            title="Klik untuk membuka Dokumen DIPA & POK"
          >
            <div className="stat-num">{stats.totalDipa !== null ? stats.totalDipa : "—"}</div>
            <div className="stat-lbl">Dokumen DIPA & RKKS</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: 500 }}>Google Drive Anggaran ↗</div>
          </div>

          <div
            className="stat-card"
            style={{ "--c": "#10b981", cursor: "pointer" }}
            onClick={() => setActivePage && setActivePage("proses-bisnis")}
            title="Klik untuk membuka Hasil Verifikasi Live Spreadsheet"
          >
            <div className="stat-num">{stats.persenVerifikasi !== null ? stats.persenVerifikasi : "—"}</div>
            <div className="stat-lbl">Kelengkapan SP2D</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: 500 }}>Spreadsheet Live TW 1 ↗</div>
          </div>

          <div
            className="stat-card"
            style={{ "--c": "#d97706", cursor: "pointer" }}
            onClick={() => setActivePage && setActivePage("proses-bisnis")}
            title="Klik untuk melihat Bidang yang Terverifikasi"
          >
            <div className="stat-num">{stats.totalBidang !== null ? stats.totalBidang : "—"}</div>
            <div className="stat-lbl">Bidang Kerja Aktif</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: 500 }}>
              {stats.bidangList && stats.bidangList.length > 0
                ? `${stats.bidangList.join(", ")} ↗`
                : "Memuat Bidang... ↗"}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
