import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  RESUME_VERIFIKASI_JAN_JUNI,
  PAGU_ANGGARAN,
  AGUSTUS_BIDANG_DETAIL,
  AGUSTUS_BIDANG_SUMMARY,
  JULI_BIDANG_DETAIL,
  JULI_BIDANG_SUMMARY,
  JUNI_BIDANG_DETAIL,
  JUNI_BIDANG_SUMMARY,
  MEI_BIDANG_DETAIL,
  MEI_BIDANG_SUMMARY,
  APRIL_BIDANG_DETAIL,
  APRIL_BIDANG_SUMMARY,
  MARET_BIDANG_DETAIL,
  MARET_BIDANG_SUMMARY,
  TAHUN_ANGGARAN,
  TAHUN_ANGGARAN_AKTIF,
  BULAN_ANGGARAN_OPTIONS,
  SP2D_SHEET_TAB,
} from "../data/masterData";
import {
  API_KEY,
  ambilRekapKegiatan,
  dengarRekapKegiatan,
  rekapSampaiTahun,
} from "../data/rekapKegiatan";
import {
  ambilRekapSpm,
  bulanTerakhirDenganData,
  dengarRekapSpm,
  rekapRealisasiSpm,
} from "../data/rekapSpm";
import {
  ambilRevisiDipa,
  dengarRevisiDipa,
  rekapRevisiDipa,
  revisiDipaBulan,
} from "../data/rekapDipa";
import { ambilRingkasanLive, dengarRingkasanLive } from "../data/sp2dLive";

/* ══════════════════════════════════════════════════════════════
   BLOK "RINGKASAN STATISTIK OPERASIONAL"
   ------------------------------------------------------------
   Berisi blok yang sama persis dengan yang ada di beranda admin:

     • kartu Total Pagu / Total Realisasi SPM / Persentase Realisasi
     • bagian "Realisasi Data Per Bulan" + filter tahun & bulan
     • kartu Pagu Bulan / Realisasi Bulan / Persentase Bulan
     • tabel "Pagu & Realisasi <Bulan> <Tahun>"

   Dipakai oleh DUA tampilan supaya angkanya dijamin sama:
     • Dashboard (admin)      → readOnly = false (tombol Sinkronkan)
     • TamuRingkasan (tamu)   → readOnly = true (tanpa kendali)

   `bulan` / `tahun` boleh dikendalikan dari luar (controlled) bila
   induk ingin mengatur periodenya sendiri. Bila tidak, filter dikelola
   blok ini dan selalu mengikuti bulan/tahun berjalan (lihat efek
   "samakanPeriode" di bawah) — otomatis ikut berganti saat bulan
   atau tahun bertambah.                              */

const BULAN_OPTIONS = BULAN_ANGGARAN_OPTIONS;
const TAHUN_OPTIONS = [...TAHUN_ANGGARAN].sort((a, b) => b - a);

function formatRupiah(n) {
  const num = Number(n);
  if (!isFinite(num)) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

function hitungPersen(realisasi, pagu) {
  const r = Number(realisasi) || 0;
  const p = Number(pagu) || 0;
  if (p <= 0) return 0;
  return (r / p) * 100;
}

/* Rekapitulasi realisasi SPM per bulan (dari masterData, sudah s.d. bulan tersebut) */
const DETAIL_SPM_PER_BULAN = {
  agustus: AGUSTUS_BIDANG_DETAIL,
  juli: JULI_BIDANG_DETAIL,
  juni: JUNI_BIDANG_DETAIL,
  mei: MEI_BIDANG_DETAIL,
  april: APRIL_BIDANG_DETAIL,
  maret: MARET_BIDANG_DETAIL,
};

const SUMMARY_SPM_PER_BULAN = {
  agustus: AGUSTUS_BIDANG_SUMMARY,
  juli: JULI_BIDANG_SUMMARY,
  juni: JUNI_BIDANG_SUMMARY,
  mei: MEI_BIDANG_SUMMARY,
  april: APRIL_BIDANG_SUMMARY,
  maret: MARET_BIDANG_SUMMARY,
};

function sumRealisasiSPM(detail) {
  if (!detail) return 0;
  return Object.values(detail).reduce((total, rows) => {
    const list = Array.isArray(rows) ? rows : [];
    return total + list.reduce((acc, row) => acc + (Number(row && row.realisasi) || 0), 0);
  }, 0);
}

function sumJumlahSpm(summary) {
  if (!summary) return 0;
  return Object.values(summary).reduce(
    (acc, row) => acc + (Number(row && row.jumlahSpm) || 0),
    0
  );
}

/* Pagu & realisasi per bulan untuk satu tahun.
   • TA aktif   → tab "LAPORAN REALISASI SP2D TA 2026" (live), cadangan
                  masterData (daftar SPM TA aktif).
   • Tahun lain → hanya PAGU_ANGGARAN.perBulan[tahun]; realisasi & SPM
                  dikosongkan karena belum ada sumber data tahun itu
                  (masterData BUKAN data tahun tersebut). */
function susunPerBulan(tahunNum, sp2dLive) {
  const tahunAktif = tahunNum === TAHUN_ANGGARAN_AKTIF;
  return BULAN_OPTIONS.map((b) => {
    const liveBulan = tahunAktif ? sp2dLive.nominal?.[b.id] || null : null;
    const paguManual = Number(PAGU_ANGGARAN.perBulan?.[tahunNum]?.[b.id]) || 0;
    const masterRealisasi = tahunAktif ? sumRealisasiSPM(DETAIL_SPM_PER_BULAN[b.id]) : 0;
    const masterSpm = tahunAktif ? sumJumlahSpm(SUMMARY_SPM_PER_BULAN[b.id]) : 0;
    return {
      id: b.id,
      label: b.label,
      pagu: liveBulan && liveBulan.pagu > 0 ? liveBulan.pagu : paguManual,
      paguManual,
      realisasi: liveBulan ? liveBulan.realisasi : masterRealisasi,
      jumlahSpm: liveBulan && liveBulan.jumlahSpm ? liveBulan.jumlahSpm : masterSpm,
      jumlahBerkas: tahunAktif && sp2dLive.berkas ? sp2dLive.berkas[b.id] ?? 0 : null,
      sumber: liveBulan ? "Sheet SP2D" : tahunAktif ? "masterData" : "—",
    };
  });
}

/* ── Kartu KPI ringkas (dipakai 2x: total & per bulan) ── */
function StatCard({ title, value, color, progress, note, hint, onClick }) {
  return (
    <div
      className="stat-card stat-card-plain"
      style={{ "--c": color, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      title={hint || (onClick ? "Klik untuk membuka detail realisasi" : undefined)}
    >
      <div className="stat-kpi-title">{title}</div>
      <div className="stat-kpi-value">{value}</div>
      {note && <div className="stat-kpi-note">{note}</div>}
      {progress !== undefined && (
        <div className="stat-progress">
          <div
            className="stat-progress-fill"
            style={{
              width: `${Math.max(0, Math.min(100, progress))}%`,
              background: color,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Periode berjalan (mengikuti jam sistem) ─────────────────────
   Dipakai sebagai nilai awal filter "Filter Bulan" & "Filter Tahun",
   dan untuk menyesuaikan filter sendiri saat pergantian bulan/tahun.
   BULAN_ANGGARAN_OPTIONS urut Januari→Desember sehingga indeks jam
   sistem (0 = Januari) langsung cocok. */
function idBulanSaatIni() {
  const i = new Date().getMonth();
  return (BULAN_OPTIONS[i] || BULAN_OPTIONS[0]).id;
}

function tahunSaatIni() {
  const t = new Date().getFullYear();
  // Bila tahun berjalan belum terdaftar di filter, pakai TA aktif.
  return TAHUN_OPTIONS.includes(t) ? String(t) : String(TAHUN_ANGGARAN_AKTIF);
}

/* Kunci periode "TA|bulan" — dipantau untuk mendeteksi pergantian
   bulan atau tahun. */
function kunciPeriode() {
  return `${tahunSaatIni()}|${idBulanSaatIni()}`;
}

export default function StatistikOperasional({
  setActivePage,
  readOnly = false,
  pollMs = 6000,
  bulan: bulanKontrol,
  setBulan: setBulanKontrol,
  tahun: tahunKontrol,
  setTahun: setTahunKontrol,
}) {
  /* Filter bisa "dikendalikan" (controlled) oleh induk. Bila tidak
     diberi, blok ini mengelola sendiri — nilai awalnya selalu
     bulan/tahun berjalan sesuai jam sistem. */
  const [bulanInternal, setBulanInternal] = useState(idBulanSaatIni);
  const [tahunInternal, setTahunInternal] = useState(tahunSaatIni);

  const bulan = typeof bulanKontrol === "string" ? bulanKontrol : bulanInternal;
  const tahun = typeof tahunKontrol === "string" ? tahunKontrol : tahunInternal;

  const gantiBulan = (nilai) => {
    if (typeof bulanKontrol !== "string") setBulanInternal(nilai);
    if (setBulanKontrol) setBulanKontrol(nilai);
  };
  const gantiTahun = (nilai) => {
    if (typeof tahunKontrol !== "string") setTahunInternal(nilai);
    if (setTahunKontrol) setTahunKontrol(nilai);
  };

  const [live, setLive] = useState({
    sp2d: { nominal: null, berkas: null, statusNominal: "menunggu", statusBerkas: "menunggu" },
    induk: {
      totalArsip: null,
      totalDipa: null,
      persenVerifikasi: "0%",
      totalBidang: 0,
      bidangList: [],
      lastSync: null,
      updatedAt: null,
    },
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Rekap kegiatan live (cadangan angka kartu "Realisasi Bulan") dan
  // revisi DIPA live (sumber pagu DIPA per bulan).
  const [rekapKegiatan, setRekapKegiatan] = useState(null);
  useEffect(() => dengarRekapKegiatan(setRekapKegiatan), []);
  /* Realisasi SPM live — "Total Realisasi SPM" dari spreadsheet
     "Rekap SPM kumulatif per bulan" di folder SPJ (Arsip Digital).
     Ini sumber utama angka kartu "Realisasi Bulan (Rp.)". */
  const [rekapSpm, setRekapSpm] = useState(null);
  useEffect(() => dengarRekapSpm(setRekapSpm), []);
  const [revisiLive, setRevisiLive] = useState(null);
  useEffect(() => dengarRevisiDipa(setRevisiLive), []);

  useEffect(() => dengarRingkasanLive(setLive), []);

  /* ── Filter mengikuti bulan & tahun berjalan secara realtime ──
     Saat halaman dibuka, filter sudah menunjuk bulan/tahun sekarang
     (nilai awal di atas). Periodenya dipantau terus supaya filter
     ikut berganti sendiri begitu melewati pergantian bulan atau
     tahun: dicek tiap 30 detik, saat tab difokuskan kembali, dan
     saat tab kembali terlihat dari tab lain/minimized.

     Pilihan manual tetap berlaku sampai pergantian berikutnya —
     perekam periode (`periodeDipantau`) menyimpan terakhir kali
     pergantian terdeteksi, bukan bulan yang sedang dipilih user. */
  const periodeDipantau = useRef(kunciPeriode());
  useEffect(() => {
    const samakanPeriode = () => {
      const kunciBaru = kunciPeriode();
      if (kunciBaru === periodeDipantau.current) return;
      periodeDipantau.current = kunciBaru;

      const bulanBerjalan = idBulanSaatIni();
      const tahunBerjalan = tahunSaatIni();
      if (typeof bulanKontrol !== "string") setBulanInternal(bulanBerjalan);
      if (setBulanKontrol) setBulanKontrol(bulanBerjalan);
      if (typeof tahunKontrol !== "string") setTahunInternal(tahunBerjalan);
      if (setTahunKontrol) setTahunKontrol(tahunBerjalan);
    };

    const id = setInterval(samakanPeriode, 30000);
    const onFokus = () => samakanPeriode();
    const onVisibilitas = () => {
      if (!document.hidden) samakanPeriode();
    };
    window.addEventListener("focus", onFokus);
    document.addEventListener("visibilitychange", onVisibilitas);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFokus);
      document.removeEventListener("visibilitychange", onVisibilitas);
    };
  }, [bulanKontrol, setBulanKontrol, tahunKontrol, setTahunKontrol]);

  // Posisi scroll saat filter berubah, supaya angka yang berubah tidak
  // membuat halaman melompat (tampilannya seakan "refresh").
  const posisiScrollFilter = useRef(0);
  const gantiFilter = (setter) => (e) => {
    posisiScrollFilter.current = window.scrollY || window.pageYOffset || 0;
    setter(e.target.value);
  };

  useLayoutEffect(() => {
    const y = posisiScrollFilter.current;
    posisiScrollFilter.current = 0;
    if (!y) return;

    // Angka kartu/tabel berubah setelah filter diganti; ulangi pemulihan
    // beberapa frame agar halaman tidak terlihat melompat.
    let tries = 0;
    let raf = 0;
    const keTarget = () => {
      const maks = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      // `html { scroll-behavior: smooth }` di App.css membuat scrollTo
      // dianimasikan; "instant" supaya langsung sampai dan tidak terputus.
      window.scrollTo({ top: Math.min(y, maks), left: 0, behavior: "instant" });
    };
    const loop = () => {
      tries += 1;
      keTarget();
      if (tries <= 6) raf = requestAnimationFrame(loop);
    };
    keTarget();
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bulan, tahun]);

  const sp2dLive = live.sp2d;
  const stats = live.induk;

  /* Data live: segarkan saat halaman dibuka, tiap `pollMs`, saat tab
     difokuskan kembali, dan saat ada berkas yang berubah di aplikasi.
     `paksa = true` dipakai tombol "Sinkronkan Sekarang". */
  const segarkan = (paksa = false) => {
    ambilRingkasanLive(paksa).catch(() => {});
    ambilRekapKegiatan(paksa, paksa).catch((e) =>
      console.warn("Rekap kegiatan gagal dimuat:", e)
    );
    ambilRevisiDipa(paksa).catch((e) => console.warn("Revisi DIPA gagal dimuat:", e));
    ambilRekapSpm(API_KEY, paksa).catch((e) =>
      console.warn("Realisasi SPM gagal dimuat:", e)
    );
  };

  const sinkronkan = () => {
    setIsRefreshing(true);
    segarkan(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    segarkan(false);
    if (!pollMs) return undefined;
    const intervalId = setInterval(() => segarkan(false), pollMs);

    const onFokus = () => segarkan(false);
    const onVisibilitas = () => {
      if (!document.hidden) segarkan(false);
    };
    const onPerubahanBerkas = () => segarkan(false);

    window.addEventListener("focus", onFokus);
    document.addEventListener("visibilitychange", onVisibilitas);
    window.addEventListener("pu_files_updated", onPerubahanBerkas);
    window.addEventListener("storage", onPerubahanBerkas);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFokus);
      document.removeEventListener("visibilitychange", onVisibilitas);
      window.removeEventListener("pu_files_updated", onPerubahanBerkas);
      window.removeEventListener("storage", onPerubahanBerkas);
    };
  }, [pollMs]);

  // ── Angka pagu (konstanta masterData) & realisasi (data master) ──
  // Data live (tab spreadsheet + folder Drive) menggantikan angka master
  // bila tersedia; bila tidak, masterData tetap dipakai sebagai cadangan.
  const tahunNum = Number(tahun) || TAHUN_ANGGARAN_AKTIF;
  // Data live (spreadsheet/Drive) & cadangan masterData hanya berisi
  // data TA aktif. Tahun lain hanya memakai angka yang memang diisi
  // per tahun (PAGU_ANGGARAN.perBulan) — selebihnya dikosongkan.
  const tahunAktifDipilih = tahunNum === TAHUN_ANGGARAN_AKTIF;

  const sp2dPerBulan = useMemo(
    () => susunPerBulan(tahunNum, sp2dLive),
    [tahunNum, sp2dLive]
  );

  /* Kartu "Total" selalu untuk TA aktif (catatannya "DIPA / RKKS
     2026"), jadi tidak ikut berubah saat filter tahun diganti. */
  const sp2dTahunAktif = useMemo(
    () => susunPerBulan(TAHUN_ANGGARAN_AKTIF, sp2dLive),
    [sp2dLive]
  );

  const adaDataLive = Boolean(sp2dLive.nominal);
  const paguTotal = adaDataLive
    ? sp2dTahunAktif.reduce((a, r) => a + r.pagu, 0)
    : Number(PAGU_ANGGARAN.total) || 0;
  const realisasiTotal = adaDataLive
    ? sp2dTahunAktif.reduce((a, r) => a + r.realisasi, 0)
    : Number(RESUME_VERIFIKASI_JAN_JUNI.total.realisasiNominal) || 0;
  const persenTotal = hitungPersen(realisasiTotal, paguTotal);

  // Revisi DIPA live → pagu per bulan. Nominal yang belum ada di
  // masterData dibaca otomatis dari berkas PDF DIPA di Drive (lihat
  // rekapDipa.js → muatRevisiDipa), jadi hanya revisi yang nominalnya
  // benar-benar belum terbaca yang membuat bulan terkait kosong.
  const rekapDipa = useMemo(
    () => rekapRevisiDipa(revisiLive, tahunNum),
    [revisiLive, tahunNum]
  );

  const dataBulan = useMemo(() => {
    const opsi = BULAN_OPTIONS.find((b) => b.id === bulan);
    const baris = sp2dPerBulan.find((r) => r.id === bulan) || {};
    const pagu = Number(baris.pagu) || 0;
    // Revisi DIPA yang berlaku s.d. akhir bulan ini (dihitung di
    // memo `rekapDipa` di atas dari folder DIPA di Drive).
    const revisi = revisiDipaBulan(rekapDipa, bulan);

    /* Realisasi utama diambil langsung dari spreadsheet yang sama
       dengan halaman "Data Kegiatan" — tab rekap kumulatif s.d.
       bulan terpilih (JAN SD …, dst). Bila tab bulan ini belum
       tersedia / belum terbaca, turun ke rekap SPM, lalu angka
       masterData sebagai cadangan. */
    const kegiatan = rekapSampaiTahun(rekapKegiatan, tahunNum, bulan);
    const pakaiKegiatan = kegiatan.ada && kegiatan.realisasi > 0;

    const spm = rekapRealisasiSpm(rekapSpm, tahunNum, bulan);
    const pakaiSpm = !pakaiKegiatan && spm.ada && spm.total > 0;

    const realisasi = pakaiKegiatan
      ? kegiatan.realisasi
      : pakaiSpm
      ? spm.total
      : Number(baris.realisasi) || 0;
    // Baris "Total" rekap SPM tidak menyediakan jumlah SPM, jadi hanya
    // diisi dari sumber lain (kegiatan/masterData) bila tersedia.
    const jumlahSpm = pakaiKegiatan
      ? kegiatan.jumlahSpm
      : pakaiSpm
      ? 0
      : Number(baris.jumlahSpm) || 0;

    // Bila pagu per bulan belum diisi, pakai nominal Revisi DIPA —
    // inilah nominal yang ditampilkan pada kartu "Pagu Bulan", jadi
    // persentase ikut memakainya supaya tidak selalu 0,00%.
    const paguDipakai = pagu > 0 ? pagu : revisi ? revisi.nominal : 0;

    /* Persentase hanya dihitung bila bulan terpilih benar-benar punya
       data — ada realisasi DAN ada pagu pembanding. Bila datanya belum
       ada, `persen` dibiarkan null supaya kartu menampilkan "—",
       bukan "0,00%" yang menyesatkan. */
    const adaDataBulan = pakaiKegiatan
      ? kegiatan.bulanTerpilihAdaData && realisasi > 0
      : pakaiSpm
      ? realisasi > 0
      : realisasi > 0;
    const persen =
      adaDataBulan && paguDipakai > 0 ? hitungPersen(realisasi, paguDipakai) : null;

    /* Bulan terakhir yang punya rekap resmi di Drive — dipakai untuk
       menjelaskan kenapa bulan terpilih masih kosong. Sumber utama
       spreadsheet Data Kegiatan; cadangan rekap SPM. */
    const kumulatif = (rekapKegiatan && rekapKegiatan.kumulatif) || {};
    const batasOpsi = BULAN_OPTIONS.filter((b) => kumulatif[b.id]);
    const idSpmTerakhir = bulanTerakhirDenganData(rekapSpm);
    const labelSpmTerakhir = idSpmTerakhir
      ? (BULAN_OPTIONS.find((b) => b.id === idSpmTerakhir) || {}).label ||
        idSpmTerakhir
      : "";
    const bulanBatasRekap = batasOpsi.length
      ? batasOpsi[batasOpsi.length - 1].label
      : labelSpmTerakhir
      ? labelSpmTerakhir
      : "";

    /* Tahun selain TA aktif yang sama sekali belum punya data (pagu,
       revisi DIPA, maupun realisasi) → semua kolom tampil "—" dengan
       keterangan "Data TA <tahun> belum tersedia". */
    const tanpaDataTahun =
      !tahunAktifDipilih && !(paguDipakai > 0) && !(realisasi > 0);

    return {
      label: opsi ? opsi.label : bulan,
      tahunLabel: tahunNum,
      tanpaDataTahun,
      pagu,
      realisasi,
      paguDipakai,
      // Tanpa pagu dari mana pun, kartu menampilkan "—" (bukan Rp 0).
      adaPagu: paguDipakai > 0,
      // Drive/Sheets belum selesai dibaca — menampilkan "Memuat…"
      // supaya "—" tidak tertukar dengan "memang tidak ada datanya".
      memuatDipa: revisiLive === null && tahunAktifDipilih,
      memuatRekap:
        rekapSpm === null && rekapKegiatan === null && tahunAktifDipilih,
      sumber: pakaiKegiatan
        ? kegiatan.sumber
        : pakaiSpm
        ? spm.sumber
        : baris.sumber || "masterData",
      jumlahBerkas: baris.jumlahBerkas ?? null,
      revisi,
      persen,
      adaDataBulan,
      jumlahSpm,
      bulanBatasRekap,
      // Bulan terakhir yang pagu Revisi DIPA-nya masih terisi, dipakai
      // untuk menjelaskan kenapa bulan berikutnya masih kosong.
      bulanBatasDipa: rekapDipa.bulanTerakhirData,
      // Rincian tambahan dari rekap kegiatan (dipakai catatan kartu).
      rekapKegiatan: pakaiKegiatan ? kegiatan : null,
      bulanDasar: pakaiKegiatan
        ? kegiatan.bulanDasar
        : pakaiSpm
        ? spm.bulanDasar
        : "",
      live: pakaiSpm || pakaiKegiatan,
      pakaiKegiatan,
      pakaiSpm,
    };
  }, [bulan, tahunNum, tahunAktifDipilih, sp2dPerBulan, rekapKegiatan, rekapSpm, rekapDipa, revisiLive]);

  const pesanTanpaData = `Data TA ${tahunNum} belum tersedia`;

  const bukaKegiatan = () => {
    if (setActivePage) setActivePage("data-kegiatan");
  };

  return (
    <div>
      {/* ══ 0. Judul blok + badge status + Sinkronkan ══ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <img
              src="/diagram.png"
              alt="Diagram statistik operasional"
              width="24"
              height="24"
              style={{ objectFit: "contain", flexShrink: 0, display: "block" }}
            />
            Ringkasan Statistik Operasional
          </span>
          {readOnly && (
            <span
              className="tm-inline-badge"
              title="Tamu melihat data yang sudah diinput/diunggah admin — tanpa kendali"
            >
              👁 Mode Tamu · baca saja
            </span>
          )}
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
          <span
            title={
              sp2dLive.statusNominal === "live"
                ? `Nominal diambil dari tab "${SP2D_SHEET_TAB}"`
                : `Tab "${SP2D_SHEET_TAB}" belum terbaca (${sp2dLive.statusNominal}) — memakai data master`
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              backgroundColor: sp2dLive.statusNominal === "live" ? "#eff6ff" : "#fef3c7",
              color: sp2dLive.statusNominal === "live" ? "#1d4ed8" : "#92400e",
              fontSize: 11.5,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid #dbeafe",
            }}
          >
            SP2D Sheet: {sp2dLive.statusNominal === "live" ? "Live" : "Master"}
          </span>
          <span
            title={
              sp2dLive.statusBerkas === "live"
                ? "Jumlah berkas dihitung langsung dari folder Google Drive"
                : "Isi SP2D_FOLDER_ID di src/data/masterData.js agar jumlah berkas live dari Drive"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              backgroundColor: sp2dLive.statusBerkas === "live" ? "#eff6ff" : "#f1f5f9",
              color: sp2dLive.statusBerkas === "live" ? "#1d4ed8" : "#475569",
              fontSize: 11.5,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 20,
              border: "1px solid #dbeafe",
            }}
          >
            Berkas Drive:{" "}
            {sp2dLive.statusBerkas === "live"
              ? "Live"
              : sp2dLive.statusBerkas === "belum-diatur"
              ? "Belum diatur"
              : "—"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Tombol sinkron hanya untuk admin — tamu tidak mengubah data. */}
          {!readOnly && (
            <button
              onClick={sinkronkan}
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
          )}
          {stats.lastSync && (
            <span style={{ fontSize: 11.5, color: "#64748b" }}>
              Terakhir diperbarui: pk. {stats.lastSync} WIB
            </span>
          )}
        </div>
      </div>

      {/* ══ 1. Ringkasan Anggaran: Pagu / Realisasi / Persentase ══ */}
      <div className="stat-row stat-row-3" style={{ marginBottom: 34 }}>
        <StatCard
          title="Total Pagu (Rp.)"
          value={formatRupiah(paguTotal)}
          color="#1B2A6B"
          note="DIPA / RKKS 2026"
          hint="Nilai pagu diisi manual di src/data/masterData.js → PAGU_ANGGARAN.total"
          onClick={readOnly ? undefined : () => setActivePage && setActivePage("proses-bisnis")}
        />
        <StatCard
          title="Total Realisasi SPM (Rp.)"
          value={formatRupiah(realisasiTotal)}
          color="#0284c7"
          note={
            adaDataLive
              ? `Akumulasi tab "${SP2D_SHEET_TAB}" (live)`
              : "Akumulasi SP2D terverifikasi ↗"
          }
          onClick={readOnly ? undefined : () => setActivePage && setActivePage("proses-bisnis")}
        />
        <StatCard
          title="Persentase Realisasi"
          value={`${persenTotal.toFixed(2)}%`}
          color="#10b981"
          progress={persenTotal}
          note="Realisasi ÷ Total Pagu"
        />
      </div>

      {/* ══ 2. Realisasi Data Per Bulan (+ filter tahun & bulan) ══ */}
      <div className="stat-subheading-row">
        <h3 className="stat-subheading">Realisasi Data Per Bulan</h3>
        <div className="stat-filter-group">
          <div className="stat-filter">
            <label htmlFor="filter-tahun">Filter Tahun:</label>
            <select
              id="filter-tahun"
              value={tahun}
              onChange={gantiFilter(gantiTahun)}
            >
              {TAHUN_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="stat-filter">
            <label htmlFor="filter-bulan">Filter Bulan:</label>
            <select
              id="filter-bulan"
              value={bulan}
              onChange={gantiFilter(gantiBulan)}
            >
              {BULAN_OPTIONS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="stat-row stat-row-3" style={{ marginBottom: 40 }}>
        <StatCard
          title="Pagu Bulan (Rp.)"
          value={
            dataBulan.adaPagu ? formatRupiah(dataBulan.paguDipakai) : "—"
          }
          color="#d97706"
          note={
            dataBulan.tanpaDataTahun
              ? pesanTanpaData
              : dataBulan.memuatDipa && !dataBulan.adaPagu
              ? "Memuat pagu DIPA dari Google Drive…"
              : dataBulan.adaPagu
              ? `Pagu alokasi ${dataBulan.label} ${dataBulan.tahunLabel} · ${
                  dataBulan.revisi
                    ? `DIPA Revisi ${dataBulan.revisi.nomor} (${dataBulan.revisi.tanggal})`
                    : dataBulan.pagu > 0
                    ? "sumber: masterData"
                    : "belum diisi"
                }`
              : "Belum ada data pagu bulan ini"
          }
          hint={
            dataBulan.tanpaDataTahun
              ? `Belum ada sumber data pagu untuk TA ${dataBulan.tahunLabel}.`
              : dataBulan.adaPagu && dataBulan.revisi
              ? `Pagu bulan ini memakai pagu ${dataBulan.revisi.dipa} yang berlaku sejak ${dataBulan.revisi.tanggal} (sumber: ${dataBulan.revisi.sumber}).`
              : dataBulan.adaPagu
              ? "Nominal diisi manual di src/data/masterData.js → PAGU_ANGGARAN.perBulan"
              : dataBulan.bulanBatasDipa
              ? `Pagu DIPA Revisi baru terisi sampai ${dataBulan.bulanBatasDipa}.`
              : "Belum ada pagu yang tercatat untuk bulan ini."
          }
        />
        <StatCard
          title="Realisasi Bulan (Rp.)"
          value={
            dataBulan.adaDataBulan ? formatRupiah(dataBulan.realisasi) : "—"
          }
          color="#0284c7"
          note={
            dataBulan.tanpaDataTahun
              ? pesanTanpaData
              : dataBulan.memuatRekap
              ? "Memuat rekap Realisasi SPM dari Google Drive…"
              : dataBulan.adaDataBulan
              ? `Kumulatif s.d. ${dataBulan.bulanDasar || dataBulan.label} ${dataBulan.tahunLabel}` +
                (dataBulan.jumlahSpm > 0
                  ? ` · ${dataBulan.jumlahSpm.toLocaleString("id-ID")} SPM`
                  : "")
              : "Belum ada data realisasi bulan ini"
          }
          hint={
            dataBulan.tanpaDataTahun
              ? `Realisasi TA ${dataBulan.tahunLabel} belum tersedia — data live & masterData hanya berisi TA ${TAHUN_ANGGARAN_AKTIF}.`
              : dataBulan.adaDataBulan
              ? `Sumber: ${dataBulan.sumber} — ${
                  dataBulan.pakaiKegiatan
                    ? "tab rekap kumulatif pada spreadsheet yang sama dengan halaman \"Data Kegiatan\""
                    : "\"Total Realisasi SPM\" pada spreadsheet \"Rekap SPM kumulatif per bulan\" (folder Arsip Digital)"
                }, jadi ikut berubah realtime.` +
                (dataBulan.bulanDasar && dataBulan.bulanDasar !== dataBulan.label
                  ? ` Data terbaru tersedia s.d. ${dataBulan.bulanDasar}.`
                  : "")
              : dataBulan.bulanBatasRekap
              ? `Rekap resmi di Google Drive baru lengkap sampai ${dataBulan.bulanBatasRekap}.`
              : "Rekap Realisasi SPM belum terbaca — memakai angka masterData. Klik untuk membuka Data Kegiatan."
          }
          onClick={readOnly ? undefined : bukaKegiatan}
        />
        <StatCard
          title="Persentase Bulan"
          value={
            dataBulan.persen === null ? "—" : `${dataBulan.persen.toFixed(2)}%`
          }
          color="#10b981"
          // Tanpa data, progress bar disembunyikan supaya tidak
          // memberi kesan realisasi sudah dihitung.
          progress={dataBulan.persen === null ? undefined : dataBulan.persen}
          note={
            dataBulan.persen !== null
              ? "Realisasi ÷ Pagu Bulan"
              : /* Persentase kosong karena reasons yang berbeda —
                   bikin pesannya tepat supaya tidak menyesatkan. */
                dataBulan.tanpaDataTahun
              ? pesanTanpaData
              : dataBulan.memuatDipa
              ? "Memuat pagu dari Google Drive…"
              : !dataBulan.adaDataBulan
              ? "Belum ada data realisasi bulan ini"
              : !dataBulan.adaPagu
              ? "Pagu bulan ini belum tersedia"
              : "Realisasi ÷ Pagu Bulan"
          }
        />
      </div>

      {/* ── Tabel Pagu & Realisasi bulan terpilih (dari filter bulan) ── */}
      <div className="stat-table-wrap" style={{ marginBottom: 34 }}>
        <div className="stat-table-caption">
          Pagu &amp; Realisasi {dataBulan.label} {dataBulan.tahunLabel}
          {dataBulan.revisi
            ? ` — pagu ${dataBulan.revisi.dipa} (${dataBulan.revisi.tanggal})`
            : ""}
          {dataBulan.tanpaDataTahun && (
            <span style={{ fontWeight: 400, color: "#64748b" }}>
              {" "}— data TA {dataBulan.tahunLabel} belum tersedia
            </span>
          )}
        </div>
        <table className="stat-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Bulan</th>
              <th style={{ textAlign: "right" }}>Pagu Bulan (Rp)</th>
              <th style={{ textAlign: "right" }}>Pagu DIPA Revisi (Rp)</th>
              <th style={{ textAlign: "right" }}>Realisasi (Rp)</th>
              <th style={{ textAlign: "right", width: 96 }}>Persentase</th>
              <th style={{ textAlign: "right" }}>SPM</th>
              <th style={{ textAlign: "right" }}>Berkas (Drive)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="stat-table-dot" style={{ background: "#d97706" }} />
                {dataBulan.label}
              </td>
              <td className="num">
                {dataBulan.adaPagu ? (
                  <>
                    {formatRupiah(dataBulan.paguDipakai)}
                    {dataBulan.revisi && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          fontWeight: 400,
                        }}
                      >
                        {dataBulan.revisi.dipa} · {dataBulan.revisi.tanggal}
                      </div>
                    )}
                  </>
                ) : (
                  <span
                    className="dk-kosong"
                    title={
                      dataBulan.memuatDipa
                        ? "Memuat pagu DIPA dari Google Drive…"
                        : dataBulan.bulanBatasDipa
                        ? `Pagu DIPA Revisi baru terisi sampai ${dataBulan.bulanBatasDipa}.`
                        : "Belum ada pagu yang tercatat untuk bulan ini."
                    }
                  >
                    —
                  </span>
                )}
              </td>
              <td className="num">
                {dataBulan.revisi ? (
                  <>
                    {formatRupiah(dataBulan.revisi.nominal)}
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        fontWeight: 400,
                      }}
                    >
                      {dataBulan.revisi.dipa} · {dataBulan.revisi.tanggal}
                    </div>
                  </>
                ) : (
                  <span
                    className="dk-kosong"
                    title={
                      dataBulan.bulanBatasDipa
                        ? `Belum ada revisi DIPA dengan nominal pagu yang berlaku pada ${dataBulan.label}. Pagu terisi sampai ${dataBulan.bulanBatasDipa}.`
                        : `Belum ada revisi DIPA yang berlaku pada ${dataBulan.label}.`
                    }
                  >
                    —
                  </span>
                )}
              </td>
              <td className="num">
                {dataBulan.adaDataBulan ? (
                  formatRupiah(dataBulan.realisasi)
                ) : (
                  <span
                    className="dk-kosong"
                    title={
                      dataBulan.tanpaDataTahun
                        ? pesanTanpaData
                        : dataBulan.bulanBatasRekap
                        ? `Rekap resmi di Drive baru lengkap sampai ${dataBulan.bulanBatasRekap}`
                        : "Belum ada data realisasi bulan ini"
                    }
                  >
                    —
                  </span>
                )}
              </td>
              <td className="num pct">
                {dataBulan.persen === null ? (
                  <span className="dk-kosong" title="Belum ada data realisasi bulan ini">
                    —
                  </span>
                ) : (
                  <>
                    <span style={{ color: "#10b981" }}>
                      {dataBulan.persen.toFixed(2)}%
                    </span>
                    <span className="stat-mini-bar">
                      <span
                        style={{
                          width: `${Math.max(0, Math.min(100, dataBulan.persen))}%`,
                          background: "#10b981",
                        }}
                      />
                    </span>
                  </>
                )}
              </td>
              <td className="num">{dataBulan.jumlahSpm || "—"}</td>
              <td className="num">
                {dataBulan.jumlahBerkas === null ? "—" : dataBulan.jumlahBerkas}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}