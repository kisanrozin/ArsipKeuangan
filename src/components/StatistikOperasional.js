import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import {
  RESUME_VERIFIKASI_JAN_JUNI,
  PAGU_ANGGARAN,
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
import {
  dengarKegiatanTambahan,
  rekapRealisasiTambahan,
} from "../data/KegiatanTambahan";

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

/* id bulan ("januari" … "desember") → nomor 1…12, dipakai untuk
   menentukan bulan mana yang sudah ter-update dan mana yang belum. */
const NOMOR_BULAN = BULAN_OPTIONS.reduce((peta, b, i) => {
  peta[b.id] = i + 1;
  return peta;
}, {});

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

/* Pagu & realisasi per bulan untuk satu tahun.
   SEMUA angka diambil dari data live (spreadsheet / Google Drive):
     · pagu      → tab SP2D di spreadsheet, lalu Pagu DIPA Revisi
                   dari folder DIPA di Drive;
     · realisasi → tab rekap kumulatif / rekap SPM di spreadsheet.
   Bila sumbernya belum punya data untuk bulan itu, nilainya 0 sehingga
   ditampilkan "—" — TIDAK memakai angka manual masterData, supaya yang
   tampil selalu sama dengan isi Drive. */
function susunPerBulan(tahunNum, sp2dLive) {
  const tahunAktif = tahunNum === TAHUN_ANGGARAN_AKTIF;
  return BULAN_OPTIONS.map((b) => {
    const liveBulan = tahunAktif ? sp2dLive.nominal?.[b.id] || null : null;
    return {
      id: b.id,
      label: b.label,
      pagu: liveBulan && liveBulan.pagu > 0 ? liveBulan.pagu : 0,
      paguManual: 0,
      realisasi: liveBulan ? liveBulan.realisasi : 0,
      jumlahSpm: liveBulan && liveBulan.jumlahSpm ? liveBulan.jumlahSpm : 0,
      jumlahBerkas:
        tahunAktif && sp2dLive.berkas ? sp2dLive.berkas[b.id] ?? 0 : null,
      sumber: liveBulan ? "Sheet SP2D" : "—",
    };
  });
}

/* ── Kartu KPI ringkas (dipakai 2x: total & per bulan) ── */
function StatCard({ title, value, color, progress, note, hint, onClick, after }) {
  return (
    <div
      className="stat-card stat-card-plain"
      style={{ "--c": color, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      title={hint || (onClick ? "Klik untuk membuka detail realisasi" : undefined)}
    >
      <div className="stat-kpi-title">{title}</div>
      <div className="stat-kpi-value">{value}</div>
      {after && <div className="stat-kpi-after">{after}</div>}
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
  /* Dipanggil setiap kali pengguna mengganti filter tahun/bulan.
     Dipakai beranda admin untuk meneruskan periode yang sama ke
     halaman Data Kegiatan. */
  onFilterChange,
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
    /* Teruskan periode terpilih ke induk (beranda admin) supaya
       filter di halaman Data Kegiatan ikut berganti. */
    if (onFilterChange) onFilterChange({ bulan: nilai, tahun });
  };
  const gantiTahun = (nilai) => {
    if (typeof tahunKontrol !== "string") setTahunInternal(nilai);
    if (setTahunKontrol) setTahunKontrol(nilai);
    if (onFilterChange) onFilterChange({ tahun: nilai, bulan });
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
  /* Data kegiatan yang diimpor lewat drag & drop folder (localStorage).
     Realisasi per bulan dari sumber ini ditambahkan ke angka Drive agar
     Dashboard ikut berubah seketika setelah folder dijatuhkan. */
  const [tambahanLive, setTambahanLive] = useState([]);
  useEffect(() => dengarKegiatanTambahan(setTambahanLive), []);
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
      /* Periode berjalan baru juga diteruskan ke induk supaya filter
         di halaman lain (Data Kegiatan/Histori) ikut menyesuaikan. */
      if (onFilterChange) {
        onFilterChange({ bulan: bulanBerjalan, tahun: tahunBerjalan });
      }
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
  }, [bulanKontrol, setBulanKontrol, tahunKontrol, setTahunKontrol, onFilterChange]);

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

  // ── Angka pagu & realisasi: SELALU dari data live (Drive) ──
  // Tidak ada lagi angka manual per bulan sebagai cadangan; bulan
  // yang datanya belum ada di Drive ditampilkan "—".
  const tahunNum = Number(tahun) || TAHUN_ANGGARAN_AKTIF;
  // Data live (spreadsheet/Drive) hanya berisi data TA aktif, jadi
  // tahun anggaran lain otomatis dikosongkan.
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

  /* Realisasi per bulan dari data impor folder (drag & drop). */
  const imporPerBulan = useMemo(
    () => rekapRealisasiTambahan(tambahanLive),
    [tambahanLive]
  );

  /* Hitung angka satu bulan. Dipakai dua tempat:
       · `dataBulan` — mengikuti filter Bulan (kartu-kartu);
       · `dataTabel`  — bulan terakhir yang datanya sudah ter-update
                        (tabel "Pagu & Realisasi"). */
  const hitungDataBulan = useCallback((bulanId, opsiHitung = {}) => {
    const opsi = BULAN_OPTIONS.find((b) => b.id === bulanId);
    const baris = sp2dPerBulan.find((r) => r.id === bulanId) || {};
    const pagu = Number(baris.pagu) || 0;
    // Revisi DIPA yang berlaku s.d. akhir bulan ini (dihitung di
    // memo `rekapDipa` di atas dari folder DIPA di Drive).
    const revisi = revisiDipaBulan(rekapDipa, bulanId);

    /* Realisasi hanya boleh berasal dari SPREADSHEET di Drive:
       1) tab rekap kumulatif bulan ini (spreadsheet Data Kegiatan);
       2) tab rekap SPM bulan ini ("Rekap SPM kumulatif per bulan").
       Bila keduanya belum punya tab untuk bulan ini → kosong (0),
       tanpa cadangan angka manual, supaya tidak pernah menampilkan
       angka yang bukan isi Drive. */
    const kegiatan = rekapSampaiTahun(rekapKegiatan, tahunNum, bulanId);
    const pakaiKegiatan = kegiatan.ada && kegiatan.realisasi > 0;

    const spm = rekapRealisasiSpm(rekapSpm, tahunNum, bulanId);
    const pakaiSpm = !pakaiKegiatan && spm.ada && spm.total > 0;

    const nomorBulanIni = NOMOR_BULAN[bulanId] || 0;
    const kunciImpor = nomorBulanIni
      ? `${tahunNum}-${String(nomorBulanIni).padStart(2, "0")}`
      : "";
    const realisasiImpor = kunciImpor
      ? Number(imporPerBulan[kunciImpor]) || 0
      : 0;

    const realisasiDrive = pakaiKegiatan
      ? kegiatan.realisasi
      : pakaiSpm
      ? spm.total
      : 0;
    /* Realisasi impor folder ditambahkan ke angka Drive: berkas hasil
       drag & drop tidak otomatis menulis ke spreadsheet, jadi angka
       inilah yang membuat realisasi bulan langsung ter-update. */
    const realisasi = realisasiDrive + realisasiImpor;
    // Baris "Total" rekap SPM tidak menyediakan jumlah SPM, jadi hanya
    // diisi dari sumber rekap kumulatif bila tersedia.
    const jumlahSpm = pakaiKegiatan ? kegiatan.jumlahSpm : 0;

    /* ── Batas bulan yang datanya sudah ter-update di Drive ──────
       "Ter-update" = bulan yang angkanya benar-benar sudah masuk ke
       spreadsheet: ada tab rekap kumulatif (mis. "JAN SD SEPTEMBER"),
       ada rekap SPM, atau ada baris SP2D. Bulan SESUDAH batas itu
       (mis. Oktober–Desember saat rekap terakhir masih September)
       BELUM ter-update.                                                */
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

    const nomorBulan = NOMOR_BULAN;
    // Bulan yang punya data impor folder juga dianggap sudah ter-update,
    // supaya pagu/realisasi bulan itu tidak dikosongkan.
    const nomorBulanImpor = Object.keys(imporPerBulan)
      .filter((ym) => ym.startsWith(`${tahunNum}-`))
      .map((ym) => Number(ym.slice(5, 7)) || 0);
    const bulanTerakhirTerupdate = [
      batasOpsi.length ? nomorBulan[batasOpsi[batasOpsi.length - 1].id] : 0,
      idSpmTerakhir ? nomorBulan[idSpmTerakhir] : 0,
      ...Object.keys(sp2dLive.nominal || {}).map((id) => nomorBulan[id] || 0),
      ...nomorBulanImpor,
    ].reduce((a, b) => Math.max(a, b), 0);

    const bulanBelumTerupdate =
      !opsiHitung.abaikanBatasUpdate &&
      bulanTerakhirTerupdate > 0 &&
      (nomorBulan[bulanId] || 0) > bulanTerakhirTerupdate;

    /* Pagu bulan ini: tab SP2D di spreadsheet, lalu nominal pagu DIPA
       Revisi dari folder DIPA di Drive sebagai cadangan (keduanya data
       Drive).

       Hanya bulan yang BELUM ter-update yang dikosongkan. Sundanya
       ditahan: bulan yang sudah ter-update tetap memakai pagu DIPA
       Revisi bila tab SP2D belum memuat kolom pagu — kalau tidak,
       satu bulan yang pagu SP2D-nya kosong ikut membuat SELURUH
       kolom pagu kosong, padahal bulan lain datanya sudah ada.       */
    const paguDipakai = bulanBelumTerupdate
      ? 0
      : pagu > 0
      ? pagu
      : revisi
      ? revisi.nominal
      : 0;

    /* Persentase hanya dihitung bila bulan terpilih benar-benar punya
       data — ada realisasi DAN ada pagu pembanding. Bila datanya belum
       ada, `persen` dibiarkan null supaya kartu menampilkan "—",
       bukan "0,00%" yang menyesatkan. */
    const adaDataBulan = realisasi > 0;
    const persen =
      adaDataBulan && paguDipakai > 0 ? hitungPersen(realisasi, paguDipakai) : null;

    /* Tahun selain TA aktif yang sama sekali belum punya data (pagu,
       revisi DIPA, maupun realisasi) → semua kolom tampil "—" dengan
       keterangan "Data TA <tahun> belum tersedia". */
    const tanpaDataTahun =
      !tahunAktifDipilih && !(paguDipakai > 0) && !(realisasi > 0);

    return {
      label: opsi ? opsi.label : bulanId,
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
        rekapSpm === null &&
        rekapKegiatan === null &&
        tahunAktifDipilih &&
        realisasiImpor <= 0,
      sumber:
        realisasiImpor > 0
          ? `${
              pakaiKegiatan
                ? kegiatan.sumber
                : pakaiSpm
                ? spm.sumber
                : "Impor folder (drag & drop)"
            } + impor folder`
          : pakaiKegiatan
          ? kegiatan.sumber
          : pakaiSpm
          ? spm.sumber
          : "Belum ada data di spreadsheet Drive",
      realisasiDrive,
      realisasiImpor,
      jumlahBerkas: baris.jumlahBerkas ?? null,
      revisi,
      persen,
      adaDataBulan,
      jumlahSpm,
      bulanBatasRekap,
      // Bulan ini belum ter-update di spreadsheet/Drive → pagu (dan
      // persentase) dikosongkan, bukan menampilkan angka carry-forward.
      bulanBelumTerupdate,
      bulanTerakhirTerupdate: bulanTerakhirTerupdate
        ? (BULAN_OPTIONS[bulanTerakhirTerupdate - 1] || {}).label || ""
        : "",
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
      live: pakaiSpm || pakaiKegiatan || realisasiImpor > 0,
      pakaiKegiatan,
      pakaiSpm,
      adaImpor: realisasiImpor > 0,
    };
  }, [
    tahunNum,
    tahunAktifDipilih,
    sp2dPerBulan,
    sp2dLive,
    rekapKegiatan,
    rekapSpm,
    rekapDipa,
    revisiLive,
    imporPerBulan,
  ]);

  /* `dataBulan` mengikuti filter Bulan (dipakai kartu-kartu di atas). */
  const dataBulan = useMemo(
    () => hitungDataBulan(bulan),
    [hitungDataBulan, bulan]
  );

  /* Bulan dari revisi DIPA TERAKHIR yang nominal pagunya sudah
     ter-update di Drive (contoh: DIPA Revisi 10 ditetapkan 31 Juli
     2026 → bulan Juli). Dipakai tabel "Pagu & Realisasi": yang
     ditampilkan hanya bulan pagu revisi terakhir beserta realisasi
     bulan tersebut, supaya langsung terlihat data sudah berganti
     sampai revisi/bulan mana. */
  const bulanRevisiTerbaru = useMemo(() => {
    if (!tahunAktifDipilih) return bulan;
    const baris = (rekapDipa.rows || []).filter(
      (r) =>
        Number(r.nomor) > 0 &&
        Number(r.pagu) > 0 &&
        !Number.isNaN(Number(r.waktu))
    );
    if (baris.length === 0) return bulan;
    /* Revisi dengan tanggal penetapan paling baru. */
    const terbaru = baris.reduce((a, b) =>
      Number(b.waktu) > Number(a.waktu) ? b : a
    );
    const tanggalRevisi = new Date(Number(terbaru.waktu));
    /* Revisi 1 kadang ditetapkan Desember tahun sebelumnya — pagunya
       berlaku mulai Januari tahun anggaran berjalan. */
    const idx =
      tanggalRevisi.getFullYear() < tahunNum ? 0 : tanggalRevisi.getMonth();
    return (BULAN_OPTIONS[idx] || {}).id || bulan;
  }, [tahunAktifDipilih, tahunNum, rekapDipa, bulan]);

  /* Data yang ditampilkan tabel "Pagu & Realisasi": bulan pagu revisi
     terakhir + realisasinya. Pagu revisi tetap ditampilkan walau
     realisasi bulan itu belum ter-update. */
  const dataTabel = useMemo(
    () => hitungDataBulan(bulanRevisiTerbaru, { abaikanBatasUpdate: true }),
    [hitungDataBulan, bulanRevisiTerbaru]
  );

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
        </div>
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
        {/* Kartu "Pagu Bulan (Rp.)": keterangan revisi DIPA yang berlaku
            pada bulan ini tampil tepat di bawah nominal pagu, mis.
            "DIPA Revisi 10 · 31 Juli 2026". */}
        <StatCard
          title="Pagu Bulan (Rp.)"
          value={
            dataBulan.adaPagu ? formatRupiah(dataBulan.paguDipakai) : "—"
          }
          after={
            dataBulan.revisi
              ? `${dataBulan.revisi.dipa} · ${dataBulan.revisi.tanggal}`
              : undefined
          }
          color="#d97706"
          note={
            dataBulan.tanpaDataTahun
              ? pesanTanpaData
              : dataBulan.memuatDipa && !dataBulan.adaPagu
              ? "Memuat pagu DIPA dari Google Drive…"
              : dataBulan.bulanBelumTerupdate
              ? "Kosong — bulan ini belum ter-update di spreadsheet"
              : dataBulan.pagu > 0
              ? "Dari tab SP2D di spreadsheet Drive"
              : dataBulan.adaPagu
              ? ""
              : "Belum ada pagu yang tercatat untuk bulan ini"
          }
          hint={
            dataBulan.tanpaDataTahun
              ? `Belum ada sumber data pagu untuk TA ${dataBulan.tahunLabel}.`
              : dataBulan.bulanBelumTerupdate
              ? `Data di spreadsheet/Drive baru ter-update sampai ${dataBulan.bulanTerakhirTerupdate} ${dataBulan.tahunLabel}, jadi pagu ${dataBulan.label} dikosongkan — bukan menampilkan angka bulan sebelumnya.` +
                (dataBulan.revisi
                  ? ` Pagu ${dataBulan.revisi.dipa} yang berlaku tetap tampil di kolom "Pagu DIPA Revisi".`
                  : "")
              : dataBulan.pagu > 0
              ? "Nominal pagu bulan ini dibaca dari tab SP2D di spreadsheet Drive."
              : dataBulan.adaPagu && dataBulan.revisi
              ? `Tab SP2D belum memuat pagu per bulan, jadi pagu bulan ini memakai pagu ${dataBulan.revisi.dipa} yang berlaku sejak ${dataBulan.revisi.tanggal} (sumber: ${dataBulan.revisi.sumber}).`
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
                  : "") +
                (dataBulan.adaImpor
                  ? ` · termasuk impor folder ${formatRupiah(
                      dataBulan.realisasiImpor
                    )}`
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
                    : dataBulan.pakaiSpm
                    ? "\"Total Realisasi SPM\" pada spreadsheet \"Rekap SPM kumulatif per bulan\" (folder Arsip Digital)"
                    : "data impor folder yang dijatuhkan di halaman \"Data Kegiatan\" (tersimpan di browser ini)"
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
              ? dataBulan.bulanBelumTerupdate
                ? "Bulan ini belum ter-update di spreadsheet"
                : "Pagu bulan ini belum tersedia"
              : "Realisasi ÷ Pagu Bulan"
          }
        />
      </div>

      {/* ── Tabel Pagu & Realisasi — hanya bulan terakhir yang sudah
             ter-update, supaya terlihat data berganti sampai bulan mana ── */}
      <div className="stat-table-wrap" style={{ marginBottom: 34 }}>
        <div className="stat-table-caption">
          Pagu &amp; Realisasi {dataTabel.label} {dataTabel.tahunLabel}
          {dataTabel.revisi
            ? ` — DIPA berlaku: ${dataTabel.revisi.dipa} (${dataTabel.revisi.tanggal})`
            : ""}
          {(dataTabel.adaPagu || dataTabel.adaDataBulan) && (
            <span style={{ fontWeight: 400, color: "#64748b" }}>
              {" "}— pagu revisi ter-update terakhir
            </span>
          )}
          {dataTabel.bulanBelumTerupdate && (
            <span style={{ fontWeight: 400, color: "#64748b" }}>
              {" "}— data ter-update s.d. {dataTabel.bulanTerakhirTerupdate}{" "}
              {dataTabel.tahunLabel}
            </span>
          )}
          {dataTabel.tanpaDataTahun && (
            <span style={{ fontWeight: 400, color: "#64748b" }}>
              {" "}— data TA {dataTabel.tahunLabel} belum tersedia
            </span>
          )}
        </div>
        <table className="stat-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Bulan</th>
              <th style={{ textAlign: "right" }}>Pagu DIPA Revisi (Rp)</th>
              <th style={{ textAlign: "right" }}>Realisasi (Rp)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span className="stat-table-dot" style={{ background: "#d97706" }} />
                {dataTabel.label}
              </td>
              <td className="num">
                {dataTabel.revisi ? (
                  <>
                    {formatRupiah(dataTabel.revisi.nominal)}
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        fontWeight: 400,
                      }}
                    >
                      {dataTabel.revisi.dipa} · {dataTabel.revisi.tanggal}
                    </div>
                  </>
                ) : (
                  <span
                    className="dk-kosong"
                    title={
                      dataTabel.bulanBatasDipa
                        ? `Belum ada revisi DIPA dengan nominal pagu yang berlaku pada ${dataTabel.label}. Pagu terisi sampai ${dataTabel.bulanBatasDipa}.`
                        : `Belum ada revisi DIPA yang berlaku pada ${dataTabel.label}.`
                    }
                  >
                    —
                  </span>
                )}
              </td>
              <td className="num">
                {dataTabel.adaDataBulan ? (
                  formatRupiah(dataTabel.realisasi)
                ) : (
                  <span
                    className="dk-kosong"
                    title={
                      dataTabel.tanpaDataTahun
                        ? pesanTanpaData
                        : dataTabel.bulanBatasRekap
                        ? `Rekap resmi di Drive baru lengkap sampai ${dataTabel.bulanBatasRekap}`
                        : "Belum ada data realisasi bulan ini"
                    }
                  >
                    —
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}