import React, { useState, useEffect, useMemo } from "react";
import {
  SHEET_TABS,
  RESUME_VERIFIKASI_JAN_JUNI,
  SHEET_DATA,
  SHEET2_BIDANG_SUMMARY,
  SHEET2_BIDANG_DETAIL,
  SEPTEMBER_BIDANG_SUMMARY,
  SEPTEMBER_BIDANG_DETAIL,
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
import { ambilTabSpreadsheet, nomorBulanDariTab } from "../data/daftarSheet";

/* ─── Helper: ekstrak Google Spreadsheet ID ─── */
export function getSheetId(rawUrl) {
  if (!rawUrl) return "1DR7lNNAK4UBbFRGqhG2uDB5ANHmz-g8v";
  const m = rawUrl.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : "1DR7lNNAK4UBbFRGqhG2uDB5ANHmz-g8v";
}

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

/* ─── Pembaca Live Data Google Spreadsheet via GVIZ ─── */
export async function fetchSheetGviz(sheetUrl, gid, sheetName) {
  const sheetId = getSheetId(sheetUrl);
  const params = new URLSearchParams({
    tqx: "out:json",
    t: String(Date.now()),
  });
  if (gid) params.set("gid", gid);
  else if (sheetName) params.set("sheet", sheetName);

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return JSON.parse(text.slice(start, end + 1));
}

/* ─── Parser baris tab periode dari respon GVIZ ─── */
export function parseMonthlySheetRows(gvizJson) {
  if (!gvizJson || !gvizJson.table || !Array.isArray(gvizJson.table.rows)) {
    return [];
  }
  let currentKode = "";
  const rows = [];

  gvizJson.table.rows.forEach((r, idx) => {
    if (!r || !r.c) return;
    const c = r.c;
    const getV = (i) => (c[i] ? c[i].v : null);

    // Col 1: Kode Kegiatan / Akun
    const col1 = String(getV(1) ?? "").trim();
    if (col1 && !col1.toLowerCase().includes("kode kegiatan")) {
      currentKode = col1;
    }

    // Col 2: Realisasi
    const val2 = getV(2);
    let realisasi = null;
    if (typeof val2 === "number") {
      realisasi = val2;
    } else if (val2 != null && val2 !== "") {
      const num = parseFloat(String(val2).replace(/[^\d.-]/g, ""));
      if (isFinite(num)) realisasi = num;
    }

    // Col 3: PIC / BIDANG
    const pic = String(getV(3) ?? "").trim();
    let bidang = "";
    const pu = pic.toUpperCase();
    if (pu.startsWith("SDA")) bidang = "SDA";
    else if (pu.startsWith("CKPS") || pu.startsWith("CK")) bidang = "CKPS";
    else if (pu.startsWith("UPTU") || pu.startsWith("TU") || pu.startsWith("LUKI") || pu.startsWith("LUKY")) bidang = "UPTU";
    else if (pu.includes("SDA")) bidang = "SDA";
    else if (pu.includes("CK")) bidang = "CKPS";
    else if (pu.includes("TU")) bidang = "UPTU";

    // Col 4: No SPM
    const noSpm = String(getV(4) ?? "").trim();

    // Col 5: Status
    const status = String(getV(5) ?? "").trim();

    // Skip bila baris kosong atau bukan data baris kegiatan
    if (!noSpm && realisasi == null && !status) return;
    if (!bidang) return;

    rows.push({
      id: idx + 1,
      bidang,
      pic: pic || "—",
      kodeKegiatan: currentKode || "—",
      realisasi,
      noSpm: noSpm || "—",
      status: status || "LENGKAP",
    });
  });

  return rows;
}

/* ─── Konstanta Default ─── */
const DEFAULT_SHEET_BASE = "https://docs.google.com/spreadsheets/d/1DR7lNNAK4UBbFRGqhG2uDB5ANHmz-g8v/edit";
const DEFAULT_SHEET_NAME = "HASIL VERIFIKASI DIGITALISASI KEUANGAN TW 1.xlsx";

/* ─── Pemetaan tab spreadsheet → id internal ───
   Nama tab dibaca otomatis dari Google Spreadsheet lalu dipetakan ke id
   yang dipakai PERIODE_DATA / SHEET_DATA. Bulan mengikuti urutan Jan…Des,
   tab dokumen (Sheet1/Sheet2) tetap, sisanya dibuat dari nama tab supaya
   setiap tab punya id yang stabil. */
const ID_BULAN = {
  1: "januari", 2: "februari", 3: "maret", 4: "april", 5: "mei", 6: "juni",
  7: "juli", 8: "agustus", 9: "september", 10: "oktober", 11: "november", 12: "desember",
};

function idTabDariNama(nama) {
  const bersih = String(nama || "").trim();
  const lower = bersih.toLowerCase();
  if (lower === "sheet1") return "sheet1";
  if (lower === "sheet2") return "sheet2";
  const bulan = nomorBulanDariTab(bersih);
  if (bulan) return ID_BULAN[bulan] || `bulan-${bulan}`;
  const slug = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `tab-${slug || "lain"}`;
}

function nomorBulanDariId(id) {
  const idx = Object.values(ID_BULAN).indexOf(id);
  return idx >= 0 ? idx + 1 : null;
}

/* Tab terbaru = periode bulan paling besar (mis. September > Agustus). */
function pilihTabTerbaru(daftar) {
  let terbaik = null;
  let bulanTerbaik = -1;
  daftar.forEach((t) => {
    const n = nomorBulanDariId(t.id);
    if (n != null && n > bulanTerbaik) {
      bulanTerbaik = n;
      terbaik = t;
    }
  });
  return terbaik || daftar[0] || null;
}

/* ════════════════════════════════════════════════════════════
   DATA BIDANG (SDA / CKPS / UPTU)
   ════════════════════════════════════════════════════════════ */
const BIDANG_ORDER = ["SDA", "CKPS", "UPTU"];
const BIDANG_FILTER_SEMUA = "SEMUA";

/* Filter kelengkapan berkas pada tabel Daftar SPM. */
const STATUS_SPM_SEMUA = "SEMUA";
const STATUS_SPM_LENGKAP = "LENGKAP";
const STATUS_SPM_TIDAK_LENGKAP = "TIDAK_LENGKAP";

/* Baris SPM dianggap lengkap bila teks statusnya memuat kata "LENGKAP". */
function statusLengkap(r) {
  return String((r && r.status) || "").toUpperCase().includes("LENGKAP");
}

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

/* Data daftar SPM per periode (tab JAN SD ... s.d. SEPTEMBER) */
const PERIODE_DATA = {
  september: { summary: SEPTEMBER_BIDANG_SUMMARY, detail: SEPTEMBER_BIDANG_DETAIL },
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
    return { background: "#e8f8ef", color: "#15803d" };
  }
  if (s.includes("TIDAK") || s.includes("REJECT") || s.includes("TOLAK")) {
    return { background: "#fef2f2", color: "#dc2626" };
  }
  if (s.includes("PENDING") || s.includes("PROSES")) {
    return { background: "#fef9c3", color: "#a16207" };
  }
  return { background: "#f1f5f9", color: "#475569" };
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

/* ── Tabel rekap kelengkapan untuk SATU bidang (dipakai pada Sheet2) ──
   Setiap bidang punya tabelnya sendiri dengan warna & header yang berbeda. */
function TabelRekapBidang({ bidang, rows, summary }) {
  const meta = BIDANG_META[bidang] || {};
  const color = meta.color || "#334155";

  const totTersedia = rows.reduce((a, r) => a + (Number(r.tersedia) || 0), 0);
  const totTidakTersedia = rows.reduce((a, r) => a + (Number(r.tidakTersedia) || 0), 0);
  const totSpm = Number(summary?.jumlahSpmTotal) || totTersedia + totTidakTersedia;
  const target = summary?.target || "—";

  return (
    <div
      className="vt-bidang-table"
      style={{
        border: `1px solid ${color}33`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header bidang — pembeda tiap tabel */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "12px 16px",
          background: `${color}0d`,
          borderBottom: `1px solid ${color}22`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${color}1a`,
              color,
              fontSize: 17,
              flexShrink: 0,
            }}
          >
            {meta.icon}
          </span>
          <div>
            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
              Bidang {bidang}{" "}
              <span style={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}>· Rekap Kelengkapan</span>
            </div>
            <div style={{ fontSize: 11.5, color: "#64748b" }}>{meta.nama}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span
            className="vt-status-badge"
            style={{ background: "#e8f8ef", color: "#15803d", margin: 0 }}
          >
            {totTersedia.toLocaleString("id-ID")} SPM tersedia
          </span>
          <span
            className="vt-status-badge"
            style={{
              background: totTidakTersedia > 0 ? "#fef2f2" : "#f1f5f9",
              color: totTidakTersedia > 0 ? "#dc2626" : "#64748b",
              margin: 0,
            }}
          >
            {totTidakTersedia.toLocaleString("id-ID")} tidak tersedia
          </span>
          <span
            className="vt-status-badge"
            style={{ background: "#eff6ff", color: "#1d4ed8", margin: 0 }}
          >
            Target: {target}
          </span>
        </div>
      </div>

      <div className="vt-table-wrapper" style={{ borderRadius: 0, boxShadow: "none" }}>
        <table className="vt-table">
          <thead>
            <tr>
              <th className="vt-th-no">No</th>
              <th style={{ whiteSpace: "normal", minWidth: 320 }}>Kegiatan</th>
              <th>SPM Tersedia</th>
              <th>Tidak Tersedia</th>
              <th>Tindak Lanjut</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="vt-empty-row">
                  Tidak ada data kegiatan pada bidang ini.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.no ?? i}>
                <td>{i + 1}</td>
                <td style={{ whiteSpace: "normal", color: "#1e293b" }}>{r.kegiatan}</td>
                <td className="vt-num-cell" style={{ fontWeight: 700, color: "#15803d" }}>
                  {r.tersedia}
                </td>
                <td className="vt-num-cell" style={{ fontWeight: 700, color: r.tidakTersedia > 0 ? "#dc2626" : "#94a3b8" }}>
                  {r.tidakTersedia}
                </td>
                <td>
                  <span
                    className="vt-status-badge"
                    style={
                      r.tindakLanjut && r.tindakLanjut !== "—"
                        ? { background: "#eff6ff", color: "#1d4ed8" }
                        : { background: "#f1f5f9", color: "#64748b" }
                    }
                  >
                    {r.tindakLanjut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: `${color}0a`, borderTop: `2px solid ${color}33` }}>
                <td colSpan={2} style={{ fontWeight: 800, color: "#0f172a" }}>
                  TOTAL {bidang}
                </td>
                <td className="vt-num-cell" style={{ fontWeight: 800, color: "#15803d" }}>
                  {totTersedia.toLocaleString("id-ID")}
                </td>
                <td
                  className="vt-num-cell"
                  style={{ fontWeight: 800, color: totTidakTersedia > 0 ? "#dc2626" : "#94a3b8" }}
                >
                  {totTidakTersedia.toLocaleString("id-ID")}
                </td>
                <td style={{ fontWeight: 700, color: "#64748b" }}>
                  {totSpm.toLocaleString("id-ID")} SPM
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

/* ── 2. Rekap Kelengkapan Dokumen Pertanggungjawaban (Sheet2, tabel terpisah per bidang) ── */
function RekapKelengkapan({ filterBidang }) {
  const daftarBidang = bidangAktif(filterBidang);

  const totSpm = daftarBidang.reduce((a, k) => a + (Number(SHEET2_BIDANG_SUMMARY[k]?.jumlahSpmTotal) || 0), 0);
  const totKurang = daftarBidang.reduce((a, k) => a + (Number(SHEET2_BIDANG_SUMMARY[k]?.tidakTersedia) || 0), 0);
  const totTersedia = Math.max(totSpm - totKurang, 0);

  return (
    <section>
      <SectionHeading
        icon="🗂️"
        title="Rekap Kelengkapan Dokumen Pertanggungjawaban (per Bidang)"
        note="Sumber: lembar Sheet2 — REKAPITULASI ... STATUS S.D 12 JULI 2026"
      />

      {/* Ringkasan keseluruhan — tiap bidang punya tabel terpisah di bawah */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <RingkasanCard label="Total SPM" value={totSpm.toLocaleString("id-ID")} color="#1B2A6B" hint={daftarBidang.join(" + ")} />
        <RingkasanCard label="SPM Tersedia" value={totTersedia.toLocaleString("id-ID")} color="#15803d" hint="Berkas tersedia" />
        <RingkasanCard label="Tidak Tersedia" value={totKurang.toLocaleString("id-ID")} color="#dc2626" hint="Perlu tindak lanjut" />
        {daftarBidang.map((k) => (
          <RingkasanCard
            key={k}
            label={`${k} · Target`}
            value={SHEET2_BIDANG_SUMMARY[k]?.target || "—"}
            color={BIDANG_META[k]?.color || "#0f172a"}
            hint={`${(SHEET2_BIDANG_DETAIL[k] || []).length} kegiatan`}
          />
        ))}
      </div>

      {/* Satu tabel berbeda untuk setiap bidang */}
      {daftarBidang.length === 0 ? (
        <div className="vt-table-wrapper">
          <table className="vt-table">
            <tbody>
              <tr>
                <td className="vt-empty-row">Tidak ada data untuk bidang terpilih.</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {daftarBidang.map((k) => (
            <TabelRekapBidang
              key={k}
              bidang={k}
              rows={SHEET2_BIDANG_DETAIL[k] || []}
              summary={SHEET2_BIDANG_SUMMARY[k]}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── 3. Ringkasan SPM per periode (per bidang) ── */
function RingkasanSPM({ summary, label, filterBidang, liveRows }) {
  const daftarBidang = bidangAktif(filterBidang);

  // Jika data live spreadsheet tersedia, gunakan kalkulasi live
  if (Array.isArray(liveRows) && liveRows.length > 0) {
    const relevantRows =
      filterBidang === BIDANG_FILTER_SEMUA
        ? liveRows
        : liveRows.filter((r) => r.bidang === filterBidang);

    const totJumlah = relevantRows.length;
    const totLengkap = relevantRows.filter(statusLengkap).length;
    const totKurang = totJumlah - totLengkap;

    return (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <RingkasanCard
          label={`Jumlah SPM · ${label}`}
          value={totJumlah.toLocaleString("id-ID")}
          color="#1B2A6B"
          hint={daftarBidang.join(" + ")}
        />
        <RingkasanCard
          label="SPM Lengkap"
          value={totLengkap.toLocaleString("id-ID")}
          color="#15803d"
          hint="Berkas lengkap terverifikasi"
        />
        <RingkasanCard
          label="Tidak Lengkap / Kurang"
          value={totKurang.toLocaleString("id-ID")}
          color="#dc2626"
          hint="Perlu tindak lanjut"
        />
        {daftarBidang.map((k) => {
          const bRows = liveRows.filter((r) => r.bidang === k);
          const bKurang = bRows.filter((r) => !statusLengkap(r)).length;
          return (
            <RingkasanCard
              key={k}
              label={`${k} · Live SPM`}
              value={`${bRows.length.toLocaleString("id-ID")} SPM`}
              color={BIDANG_META[k]?.color || "#0f172a"}
              hint={bKurang > 0 ? `${bKurang} belum lengkap` : "Lengkap semua"}
            />
          );
        })}
      </div>
    );
  }

  // Fallback: menggunakan summary statis
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

/* ── 4. Tabel Daftar SPM Lengkap (Live Google Spreadsheet / Fallback) ── */
function DaftarSPM({
  detail,
  label,
  filterBidang,
  liveRows,
  isLiveLoading,
  isLiveError,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState(STATUS_SPM_SEMUA);

  // Deteksi apakah data berasal dari live spreadsheet
  const isUsingLive = Array.isArray(liveRows) && liveRows.length > 0;

  // Baris dasar: live data atau fallback statis
  const allRows = useMemo(() => {
    if (isUsingLive) {
      return liveRows;
    }
    const r = [];
    bidangAktif(filterBidang).forEach((k) => {
      (detail[k] || []).forEach((row) => r.push({ ...row, bidang: k }));
    });
    return r;
  }, [isUsingLive, liveRows, detail, filterBidang]);

  // Baris dasar: setelah filter bidang + pencarian teks (belum filter status).
  const barisDasar = useMemo(() => {
    return allRows.filter((r) => {
      if (isUsingLive && filterBidang !== BIDANG_FILTER_SEMUA && r.bidang !== filterBidang) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        String(r.noSpm || "").toLowerCase().includes(q) ||
        String(r.kodeKegiatan || "").toLowerCase().includes(q) ||
        String(r.bidang || "").toLowerCase().includes(q) ||
        String(r.pic || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q)
      );
    });
  }, [allRows, isUsingLive, filterBidang, searchTerm]);

  // Terapkan filter kelengkapan (Lengkap / Tidak Lengkap).
  const filteredRows = useMemo(() => {
    if (filterStatus === STATUS_SPM_SEMUA) return barisDasar;
    return barisDasar.filter((r) =>
      filterStatus === STATUS_SPM_LENGKAP ? statusLengkap(r) : !statusLengkap(r)
    );
  }, [barisDasar, filterStatus]);

  // Jumlah per status (dari baris dasar) untuk angka pada tombol filter.
  const jumlahLengkapDasar = useMemo(
    () => barisDasar.filter(statusLengkap).length,
    [barisDasar]
  );

  // Reset pagination ke hal 1 saat filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBidang, searchTerm, pageSize, filterStatus]);

  const totalRealisasi = useMemo(() => {
    return filteredRows.reduce((a, r) => a + (Number(r.realisasi) || 0), 0);
  }, [filteredRows]);

  const jumlahLengkap = useMemo(() => {
    return filteredRows.filter(statusLengkap).length;
  }, [filteredRows]);

  const adaPic = filteredRows.some((r) => r.pic && r.pic !== "—");
  const adaGrupKode = filteredRows.some((r) => r.grupKode && r.grupKode !== r.kodeKegiatan);

  // Paginasi baris
  const effectivePageSize = pageSize === "semua" ? filteredRows.length || 1 : Number(pageSize);
  const totalPages = Math.ceil(filteredRows.length / effectivePageSize) || 1;
  const paginatedRows = useMemo(() => {
    if (pageSize === "semua") return filteredRows;
    const start = (currentPage - 1) * effectivePageSize;
    return filteredRows.slice(start, start + effectivePageSize);
  }, [filteredRows, currentPage, effectivePageSize, pageSize]);

  return (
    <section>
      <SectionHeading
        icon="🧾"
        title={`Daftar SPM Pertanggungjawaban — ${label}`}
        note={
          filteredRows.length > 0
            ? `${filteredRows.length.toLocaleString("id-ID")} baris data · ${jumlahLengkap.toLocaleString("id-ID")} lengkap`
            : "Tidak ada data"
        }
      />

      {/* Info Status Live vs Fallback */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "8px 14px",
          borderRadius: 8,
          marginBottom: 12,
          background: isUsingLive ? "#f0fdf4" : isLiveLoading ? "#eff6ff" : "#fefce8",
          border: `1px solid ${isUsingLive ? "#bbf7d0" : isLiveLoading ? "#bfdbfe" : "#fef08a"}`,
          fontSize: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {isLiveLoading ? (
            <>
              <span style={{ animation: "vtSpin 1s linear infinite", display: "inline-block" }}>⏳</span>
              <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
                Sedang memuat seluruh data dari Google Spreadsheet...
              </span>
            </>
          ) : isUsingLive ? (
            <>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>🟢 Terhubung Live ke Spreadsheet:</span>
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                Menampilkan <strong>{allRows.length.toLocaleString("id-ID")}</strong> baris lengkap dari spreadsheet asli
              </span>
            </>
          ) : (
            <>
              <span style={{ color: "#a16207", fontWeight: 700 }}>💾 Data Lokal (Fallback):</span>
              <span style={{ color: "#854d0e" }}>
                {isLiveError ? `GVIZ: ${isLiveError} · ` : ""}Menampilkan data cadangan aplikasi
              </span>
            </>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLiveLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              cursor: isLiveLoading ? "not-allowed" : "pointer",
              color: "#334155",
            }}
          >
            🔄 Segarkan Data
          </button>
        )}
      </div>

      {/* Ringkasan Cards */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <RingkasanCard
          label="Total Realisasi"
          value={rupiah(totalRealisasi)}
          color="#0284c7"
          hint={`${filteredRows.length.toLocaleString("id-ID")} baris terhitung`}
        />
        <RingkasanCard
          label="Lengkap"
          value={jumlahLengkap.toLocaleString("id-ID")}
          color="#15803d"
          hint="Berkas tersedia"
        />
        <RingkasanCard
          label="Tidak Tersedia / Belum"
          value={(filteredRows.length - jumlahLengkap).toLocaleString("id-ID")}
          color="#dc2626"
          hint="Perlu tindak lanjut"
        />
        <RingkasanCard
          label="Total Baris"
          value={filteredRows.length.toLocaleString("id-ID")}
          color="#1B2A6B"
          hint={filterBidang === BIDANG_FILTER_SEMUA ? "Semua Bidang" : `Bidang ${filterBidang}`}
        />
      </div>

      {/* Bar Pencarian & Opsi Tampilan */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 280px", maxWidth: 420 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No. SPM / Kode Kegiatan / PIC / Status..."
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                fontSize: 12.5,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                padding: "6px 10px",
                fontSize: 11.5,
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              Reset
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#64748b" }}>
          <span>Tampilkan:</span>
          {[50, 100, 250, "semua"].map((opt) => (
            <button
              key={opt}
              onClick={() => setPageSize(opt)}
              style={{
                padding: "4px 9px",
                fontSize: 11.5,
                fontWeight: pageSize === opt ? 700 : 500,
                background: pageSize === opt ? "#1B2A6B" : "#f1f5f9",
                color: pageSize === opt ? "#ffffff" : "#475569",
                border: "1px solid #cbd5e1",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              {opt === "semua" ? `Semua (${filteredRows.length})` : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Kelengkapan Berkas */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 12,
          padding: "8px 12px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginRight: 2 }}>
          Kelengkapan Berkas:
        </span>
        {[
          { id: STATUS_SPM_SEMUA, label: "Semua", icon: "📋", count: barisDasar.length },
          { id: STATUS_SPM_LENGKAP, label: "Lengkap", icon: "✅", count: jumlahLengkapDasar },
          {
            id: STATUS_SPM_TIDAK_LENGKAP,
            label: "Tidak Lengkap",
            icon: "❌",
            count: barisDasar.length - jumlahLengkapDasar,
          },
        ].map((it) => (
          <button
            key={it.id}
            className={`vt-filter-bidang-btn${filterStatus === it.id ? " active" : ""}`}
            onClick={() => setFilterStatus(it.id)}
            title={`Tampilkan hanya berkas ${it.label.toLowerCase()}`}
          >
            {it.icon} {it.label} ({it.count.toLocaleString("id-ID")})
          </button>
        ))}
        {filterStatus !== STATUS_SPM_SEMUA && (
          <button
            onClick={() => setFilterStatus(STATUS_SPM_SEMUA)}
            style={{
              marginLeft: "auto",
              padding: "4px 10px",
              fontSize: 11.5,
              fontWeight: 600,
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: 6,
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            ✕ Hapus Filter
          </button>
        )}
      </div>

      {/* Tabel Data */}
      <div className="vt-table-wrapper">
        <table className="vt-table">
          <thead>
            <tr>
              <th className="vt-th-no">No</th>
              <th>Bidang</th>
              {adaPic && <th>PIC / Bagian</th>}
              {adaGrupKode && <th>Grup / WA Kode</th>}
              <th>Kode Kegiatan / Akun</th>
              <th style={{ textAlign: "right" }}>Realisasi (Rp)</th>
              <th style={{ textAlign: "center" }}>No. SPM</th>
              <th style={{ textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td colSpan={adaPic ? (adaGrupKode ? 8 : 7) : adaGrupKode ? 7 : 6} className="vt-empty-row">
                  {searchTerm
                    ? "Tidak ada baris yang cocok dengan kata kunci pencarian."
                    : filterStatus === STATUS_SPM_LENGKAP
                    ? "Tidak ada berkas dengan status Lengkap untuk filter terpilih."
                    : filterStatus === STATUS_SPM_TIDAK_LENGKAP
                    ? "Tidak ada berkas dengan status Tidak Lengkap untuk filter terpilih."
                    : "Tidak ada data untuk bidang terpilih."}
                </td>
              </tr>
            )}
            {paginatedRows.map((r, i) => {
              const isHeader = !r.realisasi && (!r.noSpm || r.noSpm === "—");
              const globalIndex = pageSize === "semua" ? i + 1 : (currentPage - 1) * effectivePageSize + i + 1;
              return (
                <tr
                  key={`${r.bidang}-${r.noSpm}-${r.id || i}`}
                  style={isHeader ? { background: "#f8fafc", fontWeight: 700 } : {}}
                >
                  <td style={{ color: isHeader ? "#64748b" : undefined }}>{globalIndex}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: BIDANG_META[r.bidang]?.color || "#334155" }}>
                      {BIDANG_META[r.bidang]?.icon} {r.bidang}
                    </span>
                  </td>
                  {adaPic && (
                    <td style={{ color: "#475569", fontSize: 12, fontWeight: 500 }}>
                      {r.pic || "—"}
                    </td>
                  )}
                  {adaGrupKode && (
                    <td style={{ color: "#64748b", fontSize: 12 }}>
                      {r.grupKode || "—"}
                    </td>
                  )}
                  <td style={{ color: isHeader ? "#1e293b" : "#334155", fontWeight: isHeader ? 700 : 500 }}>
                    {r.kodeKegiatan || "—"}
                  </td>
                  <td className="vt-num-cell" style={{ color: r.realisasi ? "#0f172a" : "#94a3b8" }}>
                    {r.realisasi ? rupiah(r.realisasi) : "—"}
                  </td>
                  <td style={{ textAlign: "center", color: !r.noSpm || r.noSpm === "—" ? "#94a3b8" : "#1B2A6B", fontWeight: 700 }}>
                    {r.noSpm || "—"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className="vt-status-badge"
                      style={isHeader ? { background: "#f1f5f9", color: "#64748b" } : badgeStatus(r.status)}
                    >
                      {r.status || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {filteredRows.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={adaPic ? (adaGrupKode ? 5 : 4) : adaGrupKode ? 4 : 3}
                  style={{ fontWeight: 700, color: "#0f172a" }}
                >
                  TOTAL KESELURUHAN ({filteredRows.length.toLocaleString("id-ID")} BARIS)
                </td>
                <td className="vt-num-cell" style={{ fontWeight: 800, color: "#0284c7" }}>
                  {rupiah(totalRealisasi)}
                </td>
                <td colSpan={2} style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}>
                  {jumlahLengkap.toLocaleString("id-ID")} Lengkap
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Controls bila halaman > 1 */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            padding: "8px 4px",
            fontSize: 12.5,
            color: "#64748b",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div>
            Menampilkan baris <strong>{(currentPage - 1) * effectivePageSize + 1}</strong> –{" "}
            <strong>{Math.min(currentPage * effectivePageSize, filteredRows.length)}</strong> dari{" "}
            <strong>{filteredRows.length.toLocaleString("id-ID")}</strong> baris
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: "1px solid #cbd5e1",
                background: currentPage === 1 ? "#f8fafc" : "#ffffff",
                color: currentPage === 1 ? "#94a3b8" : "#334155",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              ◀ Sebelumnya
            </button>
            <span style={{ fontWeight: 600, color: "#0f172a", padding: "0 4px" }}>
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: "4px 10px",
                borderRadius: 5,
                border: "1px solid #cbd5e1",
                background: currentPage === totalPages ? "#f8fafc" : "#ffffff",
                color: currentPage === totalPages ? "#94a3b8" : "#334155",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Berikutnya ▶
            </button>
          </div>
        </div>
      )}
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

/* ── 5. Embed iframe Google Spreadsheet (data live) ── */
function SpreadsheetEmbed({ sheetUrl, gid, label }) {
  const [tampil, setTampil] = useState(true);
  if (!sheetUrl) return null;

  const embedUrl = getEmbedUrl(sheetUrl, gid);
  if (!embedUrl) return null;

  return (
    <section style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "20px 0 8px", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 7 }}>
          <span>📊</span>
          <span>Data Spreadsheet Live — <span style={{ color: "#1d4ed8" }}>{label}</span></span>
        </h3>
        <button
          onClick={() => setTampil((v) => !v)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 12px", fontSize: 12, fontWeight: 600,
            background: tampil ? "#eff6ff" : "#f1f5f9",
            color: tampil ? "#1d4ed8" : "#64748b",
            border: "1px solid #dbeafe", borderRadius: 6, cursor: "pointer"
          }}
        >
          {tampil ? "▲ Sembunyikan" : "▼ Tampilkan Spreadsheet"}
        </button>
      </div>
      {tampil && (
        <div style={{
          border: "1.5px solid #dbeafe", borderRadius: 10,
          overflow: "hidden", background: "#f8fafc",
          boxShadow: "0 2px 8px rgba(29,78,216,0.07)"
        }}>
          <div style={{
            padding: "6px 14px", background: "#eff6ff", borderBottom: "1px solid #dbeafe",
            display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#1d4ed8", fontWeight: 600
          }}>
            <span>🔗</span>
            <span>Data ditampilkan langsung dari Google Spreadsheet</span>
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: "auto", color: "#1d4ed8", fontWeight: 700, fontSize: 11, textDecoration: "none",
                padding: "2px 8px", background: "#dbeafe", borderRadius: 4 }}
            >
              Buka di Google Sheets ↗
            </a>
          </div>
          <iframe
            src={embedUrl}
            title={`Spreadsheet ${label}`}
            style={{ width: "100%", height: 520, border: "none", display: "block" }}
            loading="lazy"
          />
        </div>
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════════════════
   COMPONENT UTAMA
   ════════════════════════════════════════════════════════════ */
export default function ProsesBisnis() {
  /* Sheet / periode aktif */
  const [activeSheetId, setActiveSheetId] = useState("agustus");

  /* Daftar tab lembar: awalnya daftar statis (cadangan), lalu diganti
     otomatis dengan tab ASLI dari Google Spreadsheet begitu berhasil
     dibaca — jadi sheet baru otomatis muncul, sheet yang tidak ada
     tidak ditampilkan. */
  const [tabs, setTabs] = useState(SHEET_TABS);
  /* false selama daftar tab asli masih dibaca (menahan pemuatan live
     agar tidak menarik tab lama lebih dulu). */
  const [tabsSiap, setTabsSiap] = useState(false);

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

  const activeTabObj =
    tabs.find((t) => t.id === activeSheetId) || tabs[0] || SHEET_TABS[0];
  const periode = PERIODE_DATA[activeSheetId];
  const isDokumen = activeSheetId === "sheet1" || activeSheetId === "sheet2";

  /* Live data store per tab */
  const [liveData, setLiveData] = useState({});

  /* Memuat data live spreadsheet via GVIZ untuk tab aktif */
  const loadLiveData = (sheetIdKey, force = false) => {
    const tabObj = tabs.find((t) => t.id === sheetIdKey);
    if (!tabObj) return;
    if (!tabObj.gid && !tabObj.label) return;

    setLiveData((prev) => {
      if (!force && prev[sheetIdKey]?.rows) {
        return prev;
      }
      return {
        ...prev,
        [sheetIdKey]: { ...prev[sheetIdKey], loading: true, error: null },
      };
    });

    fetchSheetGviz(sheetUrl, tabObj.gid, tabObj.label)
      .then((json) => {
        const rows = parseMonthlySheetRows(json);
        setLiveData((prev) => ({
          ...prev,
          [sheetIdKey]: {
            rows: rows && rows.length > 0 ? rows : null,
            loading: false,
            error: rows && rows.length > 0 ? null : "Tidak ada baris data",
            lastUpdated: new Date(),
          },
        }));
      })
      .catch((err) => {
        console.warn("GVIZ fetch error for", sheetIdKey, err);
        setLiveData((prev) => ({
          ...prev,
          [sheetIdKey]: {
            rows: null,
            loading: false,
            error: err.message,
            lastUpdated: new Date(),
          },
        }));
      });
  };

  /* Ubah daftar tab mentah (dari Google Spreadsheet) → objek tab internal.
     Id dibuat unik agar tidak ada tab dengan id sama (mis. dua tab yang
     sama-sama memakai nama bulan). */
  const bentukTab = (daftar) => {
    const dipakai = new Set();
    return daftar.map((t) => {
      let id = idTabDariNama(t.nama);
      if (dipakai.has(id)) {
        let n = 2;
        while (dipakai.has(`${id}-${n}`)) n += 1;
        id = `${id}-${n}`;
      }
      dipakai.add(id);
      return { id, label: t.nama, gid: t.gid || null };
    });
  };

  /* Baca daftar tab ASLI dari Google Spreadsheet → sheet yang tampil hanya
     yang benar-benar ada di spreadsheet, dan sheet baru otomatis ditambah.
     Bila gagal dibaca, daftar statis (SHEET_TABS) tetap dipakai. */
  useEffect(() => {
    let batal = false;
    setTabsSiap(false);
    ambilTabSpreadsheet(getSheetId(sheetUrl))
      .then((daftar) => {
        if (batal || !Array.isArray(daftar) || daftar.length === 0) return;
        const dinamis = bentukTab(daftar);
        setTabs(dinamis);
        // Buka periode terbaru (bulan terbesar) saat halaman dibuka.
        const terbaru = pilihTabTerbaru(dinamis);
        if (terbaru) setActiveSheetId(terbaru.id);
      })
      .catch((e) => console.warn("Gagal membaca daftar tab spreadsheet:", e))
      .finally(() => {
        if (!batal) setTabsSiap(true);
      });
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetUrl]);

  /* Tombol "Segarkan Tab": paksa baca ulang daftar tab (lewati cache) tanpa
     mengubah tab yang sedang dibuka bila tab itu masih ada. */
  const segarkanTab = () => {
    setTabsSiap(false);
    ambilTabSpreadsheet(getSheetId(sheetUrl), true)
      .then((daftar) => {
        if (!Array.isArray(daftar) || daftar.length === 0) return;
        const dinamis = bentukTab(daftar);
        setTabs(dinamis);
        setActiveSheetId((prev) =>
          dinamis.some((t) => t.id === prev)
            ? prev
            : pilihTabTerbaru(dinamis)?.id || prev
        );
      })
      .catch((e) => console.warn("Gagal menyegarkan daftar tab spreadsheet:", e))
      .finally(() => setTabsSiap(true));
  };

  /* Otomatis muat data live saat membuka tab periode (setelah daftar tab
     asli siap, supaya gid/nama tab yang dipakai sudah benar). */
  useEffect(() => {
    if (!tabsSiap) return;
    if (activeSheetId !== "sheet1" && activeSheetId !== "sheet2") {
      loadLiveData(activeSheetId);
    }
    // loadLiveData stabil selama tabs/sheetUrl tidak berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheetId, sheetUrl, tabsSiap]);

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
    // Kosongkan cache agar data live ditarik ulang dari spreadsheet baru
    setLiveData({});
    setIsModalOpen(false);
  };

  /* Jumlah baris per tab (untuk badge di tab) */
  const hitungJumlahTab = (id) => {
    if (id === "sheet1" || id === "sheet2") {
      return (SHEET_DATA[id] || []).length;
    }
    if (liveData[id]?.rows && liveData[id].rows.length > 0) {
      return liveData[id].rows.length;
    }
    // Coba load jika belum pernah dicoba (trigger via useEffect deps tidak langsung;
    // tapi badge bisa tetap tampil fallback; live akan muncul setelah buka tab)
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
              className="vt-act-btn"
              onClick={segarkanTab}
              disabled={!tabsSiap}
              title="Baca ulang daftar tab dari Google Spreadsheet — sheet baru akan langsung muncul"
            >
              <span style={{ display: "inline-block", animation: tabsSiap ? "none" : "vtSpin 1s linear infinite" }}>🔄</span>
              {tabsSiap ? "Segarkan Tab" : "Memuat Tab…"}
            </button>
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
            {tabs.map((sheet) => {
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
        ) : (
          <>
            <RingkasanSPM
              summary={periode?.summary || {}}
              label={activeTabObj.label}
              filterBidang={filterBidang}
              liveRows={liveData[activeSheetId]?.rows}
            />
            <DaftarSPM
              detail={periode?.detail || {}}
              label={activeTabObj.label}
              filterBidang={filterBidang}
              liveRows={liveData[activeSheetId]?.rows}
              isLiveLoading={liveData[activeSheetId]?.loading}
              isLiveError={liveData[activeSheetId]?.error}
              onRefresh={() => loadLiveData(activeSheetId, true)}
            />
            {/* Dokumen pendukung per periode (bila ada di masterData) */}
            {(SHEET_DATA[activeSheetId] || []).length > 0 && (
              <DaftarDokumen
                data={SHEET_DATA[activeSheetId] || []}
                label={`Dokumen Pendukung — ${activeTabObj.label}`}
                filterBidang={filterBidang}
              />
            )}
          </>
        )}

        {/* ══ EMBED SPREADSHEET LIVE (di bawah tabel Daftar SPM) ══ */}
        <SpreadsheetEmbed
          sheetUrl={sheetUrl}
          gid={activeTabObj?.gid}
          label={activeTabObj?.label}
        />

        {/* ── FOOTER TIPS ── */}
        <div className="vt-bottom-info" style={{ marginTop: 26 }}>
          <span>
            💡 <strong>Petunjuk:</strong> Tab lembar kerja di atas dibuat otomatis dari tab yang ada di Google
            Spreadsheet (mis. Sheet1, Sheet2, JAN SD AGUSTUS, JAN SD SEPTEMBER, ...), jadi periode baru akan muncul
            sendiri begitu sheet-nya ditambahkan. Gunakan <strong>Filter Bidang</strong> untuk memisahkan data per
            bidang (SDA / CKPS / UPTU). Seluruh angka mengacu pada hasil verifikasi digitalisasi yang tersimpan.
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