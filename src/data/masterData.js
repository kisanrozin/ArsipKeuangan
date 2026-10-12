// ============================================================
// masterData.js – Data master Sistem Pengarsipan Keuangan PU
// ============================================================

export const PROSES_BISNIS = [
  {
    id: 1,
    tahap: "1",
    nama: "Penerimaan Dokumen Keuangan",
    pelaku: "Staf Administrasi",
    deskripsi:
      "Dokumen keuangan diterima dari berbagai unit kerja seperti PPTK, Bendahara Pengeluaran, dan Tim Pelaksana Kegiatan.",
    input: "Dokumen fisik / digital dari unit kerja",
    output: "Dokumen tercatat di buku agenda",
    durasi: "1 hari kerja",
    masalah: [
      "Dokumen sering tidak lengkap saat diterima",
      "Tidak ada sistem tracking real-time",
    ],
    status: "berjalan",
    icon: "📥",
  },
  {
    id: 2,
    tahap: "2",
    nama: "Verifikasi Kelengkapan Dokumen",
    pelaku: "Kepala Sub Bagian Keuangan",
    deskripsi:
      "Pemeriksaan kelengkapan dan keabsahan dokumen sesuai dengan SOP yang berlaku dan peraturan perundang-undangan.",
    input: "Dokumen dari proses penerimaan",
    output: "Dokumen terverifikasi / dikembalikan",
    durasi: "1–3 hari kerja",
    masalah: [
      "Proses manual memakan waktu",
      "Risiko human error dalam pengecekan",
    ],
    status: "berjalan",
    icon: "🔍",
  },
  {
    id: 3,
    tahap: "3",
    nama: "Klasifikasi & Penomoran",
    pelaku: "Staf Kearsipan",
    deskripsi:
      "Dokumen diklasifikasikan berdasarkan jenis, tahun anggaran, dan kode rekening, kemudian diberi nomor urut arsip.",
    input: "Dokumen terverifikasi",
    output: "Dokumen terklasifikasi dengan nomor arsip",
    durasi: "1 hari kerja",
    masalah: [
      "Penomoran manual tidak konsisten",
      "Belum ada standar kode klasifikasi yang baku",
    ],
    status: "berjalan",
    icon: "🗂️",
  },
  {
    id: 4,
    tahap: "4",
    nama: "Penyimpanan Fisik & Digital",
    pelaku: "Staf Kearsipan",
    deskripsi:
      "Dokumen disimpan dalam ordner/box file di ruang arsip dan di-scan untuk penyimpanan digital di komputer lokal.",
    input: "Dokumen terklasifikasi",
    output: "Dokumen tersimpan fisik & digital",
    durasi: "1 hari kerja",
    masalah: [
      "Penyimpanan digital tidak terpusat",
      "Ruang arsip fisik sudah penuh",
      "File digital tidak terproteksi",
    ],
    status: "berjalan",
    icon: "💾",
  },
  {
    id: 5,
    tahap: "5",
    nama: "Peminjaman & Penelusuran",
    pelaku: "Semua Pegawai",
    deskripsi:
      "Proses pencarian dan peminjaman arsip oleh pegawai yang membutuhkan, menggunakan buku peminjaman manual.",
    input: "Permintaan arsip",
    output: "Arsip dipinjamkan / informasi ditemukan",
    durasi: "30 menit – 2 hari",
    masalah: [
      "Pencarian dokumen lambat dan sulit",
      "Dokumen sering tidak dikembalikan tepat waktu",
      "Tidak ada notifikasi jatuh tempo",
    ],
    status: "berjalan",
    icon: "🔎",
  },
  {
    id: 6,
    tahap: "6",
    nama: "Pemusnahan & Retensi",
    pelaku: "Kepala Dinas / Panitia",
    deskripsi:
      "Dokumen yang sudah melewati masa retensi diusulkan untuk dimusnahkan sesuai jadwal retensi arsip (JRA).",
    input: "Daftar arsip yang habis masa retensi",
    output: "Berita acara pemusnahan",
    durasi: "1–2 bulan",
    masalah: [
      "Jadwal retensi belum terdokumentasi dengan baik",
      "Proses persetujuan pemusnahan panjang",
    ],
    status: "berjalan",
    icon: "🗑️",
  },
];

export const KEBUTUHAN_FUNGSIONAL = [
  {
    id: "KF-001",
    kategori: "Manajemen Dokumen",
    kebutuhan: "Sistem dapat menerima upload dokumen dalam format PDF, DOCX, dan XLSX",
    prioritas: "Tinggi",
    sumber: "Kabag Keuangan",
  },
  {
    id: "KF-002",
    kategori: "Manajemen Dokumen",
    kebutuhan: "Sistem dapat melakukan klasifikasi otomatis berdasarkan metadata dokumen",
    prioritas: "Tinggi",
    sumber: "Staf Kearsipan",
  },
  {
    id: "KF-003",
    kategori: "Pencarian",
    kebutuhan: "Fitur pencarian full-text pada isi dan metadata dokumen",
    prioritas: "Tinggi",
    sumber: "Semua Pengguna",
  },
  {
    id: "KF-004",
    kategori: "Pencarian",
    kebutuhan: "Filter pencarian berdasarkan tahun, jenis, dan status dokumen",
    prioritas: "Sedang",
    sumber: "Semua Pengguna",
  },
  {
    id: "KF-005",
    kategori: "Keamanan",
    kebutuhan: "Kontrol akses berbasis peran (RBAC) untuk setiap level pengguna",
    prioritas: "Tinggi",
    sumber: "Kepala Dinas",
  },
  {
    id: "KF-006",
    kategori: "Keamanan",
    kebutuhan: "Log audit untuk setiap aktivitas akses dan perubahan dokumen",
    prioritas: "Tinggi",
    sumber: "Inspektorat",
  },
  {
    id: "KF-007",
    kategori: "Alur Kerja",
    kebutuhan: "Workflow persetujuan digital untuk dokumen yang memerlukan tanda tangan",
    prioritas: "Sedang",
    sumber: "Kabag Keuangan",
  },
  {
    id: "KF-008",
    kategori: "Retensi",
    kebutuhan: "Notifikasi otomatis untuk dokumen yang mendekati masa retensi",
    prioritas: "Sedang",
    sumber: "Staf Kearsipan",
  },
  {
    id: "KF-009",
    kategori: "Laporan",
    kebutuhan: "Dashboard dan laporan statistik pengarsipan (harian/bulanan/tahunan)",
    prioritas: "Rendah",
    sumber: "Kepala Dinas",
  },
  {
    id: "KF-010",
    kategori: "Integrasi",
    kebutuhan: "Integrasi dengan sistem SIPKD / SIMDA untuk sinkronisasi data keuangan",
    prioritas: "Rendah",
    sumber: "Kabag Keuangan",
  },
];

export const JENIS_DOKUMEN = [
  {
    id: "DOC-001",
    kode: "KU-ANS",
    nama: "Anggaran & Perencanaan",
    subJenis: [
      { nama: "DPA (Dokumen Pelaksanaan Anggaran)", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "DPPA (Dokumen Perubahan Pelaksanaan Anggaran)", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "RKA (Rencana Kerja dan Anggaran)", retensi: "5 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "RKA Perubahan", retensi: "5 Tahun", format: "PDF/XLSX", wajib: false },
    ],
    warna: "#3B82F6",
    icon: "📊",
    jumlah: 4,
  },
  {
    id: "DOC-002",
    kode: "KU-KAS",
    nama: "Kas & Pembayaran",
    subJenis: [
      { nama: "SPP (Surat Permintaan Pembayaran)", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "SPM (Surat Perintah Membayar)", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "SP2D (Surat Perintah Pencairan Dana)", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "Kwitansi Pembayaran", retensi: "10 Tahun", format: "PDF/JPG", wajib: true },
      { nama: "Bukti Transfer Bank", retensi: "5 Tahun", format: "PDF", wajib: true },
    ],
    warna: "#10B981",
    icon: "💰",
    jumlah: 5,
  },
  {
    id: "DOC-003",
    kode: "KU-PKS",
    nama: "Pengadaan & Kontrak",
    subJenis: [
      { nama: "Surat Perjanjian / Kontrak Kerja", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "Addendum Kontrak", retensi: "10 Tahun", format: "PDF", wajib: false },
      { nama: "Berita Acara Serah Terima Pekerjaan", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "Dokumen Lelang / Tender", retensi: "5 Tahun", format: "PDF", wajib: true },
      { nama: "Jaminan Pelaksanaan / Uang Muka", retensi: "5 Tahun", format: "PDF", wajib: false },
    ],
    warna: "#F59E0B",
    icon: "📋",
    jumlah: 5,
  },
  {
    id: "DOC-004",
    kode: "KU-LPJ",
    nama: "Laporan & Pertanggungjawaban",
    subJenis: [
      { nama: "LPJ Bendahara Pengeluaran (Bulanan)", retensi: "5 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "LPJ Bendahara Penerimaan (Bulanan)", retensi: "5 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Laporan Keuangan Akhir Tahun", retensi: "Permanen", format: "PDF", wajib: true },
      { nama: "Nota Perhitungan Anggaran", retensi: "Permanen", format: "PDF", wajib: true },
    ],
    warna: "#8B5CF6",
    icon: "📑",
    jumlah: 4,
  },
  {
    id: "DOC-005",
    kode: "KU-PAJ",
    nama: "Pajak & Retribusi",
    subJenis: [
      { nama: "Bukti Setoran Pajak (SSP)", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "Faktur Pajak", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "Surat Keterangan Bebas Pajak", retensi: "5 Tahun", format: "PDF", wajib: false },
    ],
    warna: "#EF4444",
    icon: "🧾",
    jumlah: 3,
  },
  {
    id: "DOC-006",
    kode: "KU-AST",
    nama: "Aset & Inventaris",
    subJenis: [
      { nama: "Kartu Inventaris Barang (KIB)", retensi: "Permanen", format: "XLSX/PDF", wajib: true },
      { nama: "BAST Penghapusan Aset", retensi: "10 Tahun", format: "PDF", wajib: false },
      { nama: "Dokumen Perolehan Aset", retensi: "Permanen", format: "PDF", wajib: true },
    ],
    warna: "#06B6D4",
    icon: "🏗️",
    jumlah: 3,
  },
];

export const STAKEHOLDERS = [
  { nama: "Kepala Dinas PU", peran: "Approver / Decision Maker", akses: "Full View" },
  { nama: "Kepala Sub Bagian Keuangan", peran: "Manager Keuangan", akses: "Full Access" },
  { nama: "Bendahara Pengeluaran", peran: "Operator Kas", akses: "Input & View" },
  { nama: "Bendahara Penerimaan", peran: "Operator Penerimaan", akses: "Input & View" },
  { nama: "PPTK (Pejabat Pelaksana Teknis Kegiatan)", peran: "Pengaju Dokumen", akses: "Upload & Track" },
  { nama: "Staf Kearsipan", peran: "Pengelola Arsip", akses: "Full Access Arsip" },
  { nama: "Inspektorat", peran: "Auditor Internal", akses: "Read Only (Audit)" },
];

export const DOKUMEN_DIPA = [
  {
    id: "DIPA-001",
    kode: "DIPA-IND",
    nama: "DIPA Induk & Petunjuk Operasional Kegiatan (POK)",
    deskripsi: "Dokumen alokasi anggaran induk satker beserta petunjuk operasional kegiatan yang telah disahkan.",
    subJenis: [
      { nama: "DIPA Petikan Satker Tahun Anggaran Berjalan", retensi: "Permanen", format: "PDF", wajib: true },
      { nama: "Petunjuk Operasional Kegiatan (POK) Awal Satker", retensi: "10 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Rincian Kertas Kerja RKA-K/L Satker Kementerian", retensi: "10 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Surat Pengesahan DIPA oleh Ditjen Anggaran", retensi: "Permanen", format: "PDF", wajib: true },
    ],
    warna: "#1B2A6B",
    icon: "📜",
  },
  {
    id: "DIPA-002",
    kode: "DIPA-REV",
    nama: "Revisi & Perubahan DIPA",
    deskripsi: "Berkas usulan, matriks perubahan anggaran, dan surat pengesahan revisi DIPA dari Kanwil DJPb.",
    subJenis: [
      { nama: "Matriks Perubahan / Revisi Anggaran DIPA", retensi: "10 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Surat Persetujuan / Pengesahan Revisi Kanwil DJPb", retensi: "Permanen", format: "PDF", wajib: true },
      { nama: "Surat Usulan Revisi Anggaran dari Kuasa Pengguna Anggaran (KPA)", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "Catatan Hasil Penelaahan Revisi Anggaran", retensi: "5 Tahun", format: "PDF", wajib: false },
    ],
    warna: "#3B82F6",
    icon: "📑",
  },
  {
    id: "DIPA-003",
    kode: "DIPA-SK",
    nama: "SK Pejabat Perbendaharaan & Pengelola DIPA",
    deskripsi: "Surat Keputusan penetapan aparatur pengelola perbendaharaan dan keuangan DIPA satker.",
    subJenis: [
      { nama: "SK Penetapan Kuasa Pengguna Anggaran (KPA)", retensi: "Permanen", format: "PDF", wajib: true },
      { nama: "SK Pejabat Pembuat Komitmen (PPK)", retensi: "Permanen", format: "PDF", wajib: true },
      { nama: "SK Pejabat Penandatangan SPM (PPSPM)", retensi: "Permanen", format: "PDF", wajib: true },
      { nama: "SK Bendahara Pengeluaran & Bendahara Penerimaan", retensi: "Permanen", format: "PDF", wajib: true },
    ],
    warna: "#0284c7",
    icon: "🖋️",
  },
];

// ============================================================
// History Revisi DIPA TA 2026
// ------------------------------------------------------------
// Riwayat DIPA Awal beserta seluruh revisinya: tanggal penetapan,
// pagu, digital stamp, kode jenis revisi, dan keterangannya.
// Dipakai oleh halaman "HISTORY REVISI DIPA".
// ============================================================
export const HISTORI_REVISI_DIPA = [
  {
    id: 1,
    dipa: "DIPA Awal",
    tanggal: "1 Desember 2025",
    pagu: "20.836.355.000",
    digitalStamp: "3398-0373-4661-3774",
    kodeJenisRevisi: "—",
    keterangan: "—",
  },
  {
    id: 2,
    dipa: "DIPA Revisi 1",
    tanggal: "28 Desember 2025",
    pagu: "16.966.713.000",
    digitalStamp: "9223-4280-0728-0734",
    kodeJenisRevisi: "239, 303, 306, 307, 315",
    keterangan: "Revisi pergeseran pagu anggaran antar satker TA 2026",
  },
  {
    id: 3,
    dipa: "DIPA Revisi 2",
    tanggal: "5 Januari 2026",
    pagu: "16.966.713.000",
    digitalStamp: "9223-4280-0728-0734",
    kodeJenisRevisi: "—",
    keterangan: "Pemutakhiran KPA",
  },
  {
    id: 4,
    dipa: "DIPA Revisi 3",
    tanggal: "30 Januari 2026",
    pagu: "16.966.713.000",
    digitalStamp: "9544-0938-49e1-9626",
    kodeJenisRevisi: "239, 306",
    keterangan: "Revisi Buka Blokir",
  },
  {
    id: 5,
    dipa: "DIPA Revisi 4",
    tanggal: "9 Februari 2026",
    pagu: "16.966.713.000",
    digitalStamp: "9544-0938-49e1-9626",
    kodeJenisRevisi: "211",
    keterangan: "Revisi RPD Hal III DIPA Triwulan I TA 2026, Revisi PO...",
  },
  {
    id: 6,
    dipa: "DIPA Revisi 5",
    tanggal: "3 Maret 2026",
    pagu: "16.966.713.000",
    digitalStamp: "9544-0938-49e1-9626",
    kodeJenisRevisi: "—",
    keterangan: "Pemutakhiran KPA",
  },
  {
    id: 7,
    dipa: "DIPA Revisi 6",
    tanggal: "9 April 2026",
    pagu: "16.966.713.000",
    digitalStamp: "9544-0938-49e1-9626",
    kodeJenisRevisi: "211, 325",
    keterangan: "Revisi Pemutakhiran RPD Triwulan II",
  },
  {
    id: 8,
    dipa: "DIPA Revisi 7",
    tanggal: "23 April 2026",
    pagu: "15.889.706.000",
    digitalStamp: "6350-7989-1063-4365",
    kodeJenisRevisi: "122",
    keterangan: "Revisi Realokasi Bagian Anggaran Bendahara Umum",
  },
  {
    id: 9,
    dipa: "DIPA Revisi 8",
    tanggal: "6 Mei 2026",
    pagu: "15.889.706.000",
    digitalStamp: "6350-7989-1063-4365",
    kodeJenisRevisi: "315, 325",
    keterangan: "Revisi Penyesuaian RPD Triwulan II (Penyesuaian rea...",
  },

  // ── Revisi 9–13 ──────────────────────────────────────────────
  // Foldernya ada di Google Drive dengan tanggal penetapan
  // berikut (diambil dari nama berkas "DIPA n (tanggal).pdf").
  // NOMINAL PAGU-nya dibaca OTOMATIS dari berkas PDF "Surat
  // Pengesahan Daftar Isian Pelaksanaan Anggaran Petikan" tersebut
  // lewat src/data/paguPdf.js (folder Drive publik, unduhan
  // `alt=media` + pdf.js). Kolom `pagu`/`digitalStamp` di sini
  // sengaja "—" agar mengikuti dokumen Drive secara real-time dan
  // dipakai sebagai cadangan bila PDF gagal dibaca.
  //
  // Kolom `kodeJenisRevisi` & `keterangan` TIDAK ada di dalam PDF
  // (isi PDF hanya Nomor SP DIPA, "Revisi ke N", Tanggal, digital
  // stamp, dan pagu), jadi dibiarkan "—" dan hanya dapat diisi
  // manual lewat ikon pensil.
  //
  // ⚠️ Bila PDF belum bisa dibaca (offline, berubah format),
  //    Dashboard sengaja TIDAK menampilkan pagu untuk bulan yang
  //    sudah governed revisi tersebut (lihat src/data/rekapDipa.js).
  //    Isi `pagu` di sini sebagai cadangan bila ingin nilai statis.
  {
    id: 10,
    dipa: "DIPA Revisi 9",
    tanggal: "8 Juli 2026",
    pagu: "—",
    digitalStamp: "—",
    kodeJenisRevisi: "—",
    keterangan: "—",
  },
  {
    id: 11,
    dipa: "DIPA Revisi 10",
    tanggal: "31 Juli 2026",
    pagu: "—",
    digitalStamp: "—",
    kodeJenisRevisi: "—",
    keterangan: "—",
  },
  {
    id: 12,
    dipa: "DIPA Revisi 11",
    tanggal: "1 September 2026",
    pagu: "—",
    digitalStamp: "—",
    kodeJenisRevisi: "—",
    keterangan: "—",
  },
  {
    id: 13,
    dipa: "DIPA Revisi 12",
    tanggal: "8 September 2026",
    pagu: "—",
    digitalStamp: "—",
    kodeJenisRevisi: "—",
    keterangan: "—",
  },
  {
    id: 14,
    dipa: "DIPA Revisi 13",
    tanggal: "10 September 2026",
    pagu: "—",
    digitalStamp: "—",
    kodeJenisRevisi: "—",
    keterangan: "—",
  },
];

// ============================================================
// Helper Pagu DIPA Revisi
// ------------------------------------------------------------
// TIDAK ada helper pagu-revisi per bulan di file ini lagi.
// Pagu DIPA Revisi pada Dashboard sekarang dihitung live dari
// folder DIPA di Google Drive (daftar revisi + tanggal
// penetrationnya) digabung dengan nominal `HISTORI_REVISI_DIPA`
// di atas — lihat src/data/rekapDipa.js → rekapRevisiDipa().
//
// Helpers lama (paguRevisiDipaPerBulan) sengaja dihapus supaya
// tidak ada dua sumber kebenaran yang bisa berbeda.
// ============================================================

export const DOKUMEN_RKKS = [
  {
    id: "RKKS-001",
    kode: "RKKS-RPD",
    nama: "Rencana Penarikan Dana (RPD) & Kebutuhan Kas",
    deskripsi: "Jadwal dan estimasi penarikan dana berkala serta proyeksi likuiditas kas operasional satuan kerja.",
    subJenis: [
      { nama: "Rencana Penarikan Dana (RPD) Bulanan & Triwulanan", retensi: "5 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Jadwal Kebutuhan Kas Mingguan / Bulanan Satker", retensi: "5 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Proyeksi Cash Flow & Likuiditas Rekening Kas Satker", retensi: "5 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Konfirmasi RPD ke KPPN / Bank Operasional Mitra", retensi: "5 Tahun", format: "PDF", wajib: false },
    ],
    warna: "#059669",
    icon: "📊",
  },
  {
    id: "RKKS-002",
    kode: "RKKS-KGT",
    nama: "Rencana Kegiatan Operasional & Fisik",
    deskripsi: "Matriks jadwal kegiatan pengadaan belanja operasional, pemeliharaan, dan proyek konstruksi PU.",
    subJenis: [
      { nama: "Jadwal Pelaksanaan Kegiatan Konstruksi & Prasarana Fisik", retensi: "10 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Rencana Umum Pengadaan Barang & Jasa (RUP) Satker", retensi: "5 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Target Capaian Output & Milestone Proyek Fisik", retensi: "5 Tahun", format: "PDF", wajib: true },
      { nama: "Monitoring & Evaluasi Realisasi RKKS Berkala", retensi: "5 Tahun", format: "PDF/XLSX", wajib: false },
    ],
    warna: "#d97706",
    icon: "🏗️",
  },
  {
    id: "RKKS-003",
    kode: "RKKS-BKU",
    nama: "Buku Kas & Rekonsiliasi Kas Satker",
    deskripsi: "Dokumen buku kas umum, berita acara pemeriksaan kas berkala, dan rekonsiliasi bank satker.",
    subJenis: [
      { nama: "Buku Kas Umum (BKU) Satker Pengeluaran & Penerimaan", retensi: "10 Tahun", format: "PDF/XLSX", wajib: true },
      { nama: "Berita Acara Pemeriksaan Kas & Rekonsiliasi Bank Bulanan", retensi: "10 Tahun", format: "PDF", wajib: true },
      { nama: "Laporan Saldo Rekening Penampungan Kas Satker", retensi: "5 Tahun", format: "PDF", wajib: true },
      { nama: "Register Penutupan Kas Akhir Tahun Anggaran", retensi: "Permanen", format: "PDF", wajib: true },
    ],
    warna: "#7c3aed",
    icon: "💰",
  },
];

// Sheet tab names and exact GIDs from the live Google Spreadsheet
export const SHEET_TABS = [
  { id: "sheet1",   label: "Sheet1",                      gid: "1721184120" },
  { id: "sheet2",   label: "Sheet2",                      gid: "1028099555" },
  { id: "agustus",  label: "Salinan dari JAN SD AGUSTUS", gid: "1550175425" },
  { id: "juli",     label: "JAN SD JULI",                 gid: "1442596412" },
  { id: "juni",     label: "JAN SD JUNI",                 gid: "1727706108" },
  { id: "mei",      label: "JAN SD MEI",                  gid: "1040164856" },
  { id: "april",    label: "JAN SD APRIL",                gid: "150310251"  },
  { id: "maret",    label: "JAN SD MRT",                  gid: "649677384"  },
];

// Resume Hasil Verifikasi Pertanggungjawaban Periode Januari s.d Juni 2026 (Sheet 1)
export const RESUME_VERIFIKASI_JAN_JUNI = {
  judul: "RESUME HASIL VERIFIKASI PERTANGGUNGJAWABAN",
  periode: "PERIODE JANUARI S.D JUNI 2026",
  statusVerifikasi: "16 Juni 2026",
  // Ikon bidang memakai gambar di /public (lihat field `iconImg`).
  // Hanya SDA dan UPTU yang memakai gambar; CKPS tetap memakai emoji 🏗️.
  // Baris TOTAL REKAPITULASI memakai `iconImg` pada objek `total` di bawah.
  // Untuk menukar gambar, cukup ubah nilai `iconImg` — mis. "bangunan.png".
  // `icon` (emoji) dipakai sebagai cadangan bila file gambar gagal dimuat.
  bidang: [
    {
      id: 1,
      kode: "SDA",
      nama: "Sumber Daya Air (SDA)",
      realisasiSp2d: "2.665.112.107",
      realisasiNominal: 2665112107,
      buktiLengkap: "2.617.675.188",
      buktiNominal: 2617675188,
      selisih: "47.436.919",
      prosentase: 98,
      prosentaseStr: "98%",
      color: "#0284c7",
      icon: "💧",
      iconImg: "water.png",
      status: "Terverifikasi (98%)",
    },
    {
      id: 2,
      kode: "CKPS",
      nama: "Cipta Karya & Prasarana Strategis (CKPS)",
      realisasiSp2d: "2.053.174.090",
      realisasiNominal: 2053174090,
      buktiLengkap: "2.004.144.610",
      buktiNominal: 2004144610,
      selisih: "49.029.480",
      prosentase: 98,
      prosentaseStr: "98%",
      color: "#059669",
      icon: "🏗️",
      // CKPS sengaja tanpa `iconImg` → tetap memakai emoji 🏗️ seperti sebelumnya.
      status: "Terverifikasi (98%)",
    },
    {
      id: 3,
      kode: "UPTU",
      nama: "Unit Pelaksana Teknis Umum / Tata Usaha (UPTU)",
      realisasiSp2d: "2.650.030.873",
      realisasiNominal: 2650030873,
      buktiLengkap: "2.650.030.873",
      buktiNominal: 2650030873,
      selisih: "0",
      prosentase: 100,
      prosentaseStr: "100%",
      color: "#16a34a",
      icon: "🏢",
      iconImg: "diagram.png",
      status: "Lengkap 100%",
    },
  ],
  total: {
    icon: "📊",
    iconImg: "bangunan.png",
    realisasiSp2d: "7.368.317.070",
    realisasiNominal: 7368317070,
    buktiLengkap: "7.271.850.671",
    buktiNominal: 7271850671,
    selisih: "96.466.399",
    prosentase: 98.7,
    prosentaseStr: "98.7%",
  },
};

// Per-sheet digital financial verification data
export const SHEET_DATA = {
  sheet1: [
    {
      id: 1,
      file: "DIPA REVISI KE 2, 2026-01-145.12-694423-02-095-1-02 (5 Jan 2026).pdf",
      namaDokumen: "DIPA REVISI KE 2, 2026-01-145.12-694423-02-095-1-02 (5 Jan 2026)",
      eksis: true,
      ukuran: "0.08 Mb",
      ukuranBytes: 81920,
      tglUpload: "2026-09-22",
      tipe: "pdf",
      status: "Approved",
      kategori: "DIPA & POK",
      bidang: "UPTU",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 2,
      file: "KertasKerja Revisi 2 2026.xls",
      namaDokumen: "KertasKerja Revisi 2 2026",
      eksis: true,
      ukuran: "0.82 Mb",
      ukuranBytes: 839680,
      tglUpload: "2026-09-22",
      tipe: "xls",
      status: "Approved",
      kategori: "Kertas Kerja",
      bidang: "UPTU",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 3,
      file: "RINCIAN KERTAS KERJA SATKER REV 2 (5 Jan 2026).pdf",
      namaDokumen: "RINCIAN KERTAS KERJA SATKER REV 2 (5 Jan 2026)",
      eksis: true,
      ukuran: "9.28 Mb",
      ukuranBytes: 9730785,
      tglUpload: "2026-09-22",
      tipe: "pdf",
      status: "Approved",
      kategori: "Kertas Kerja Satker",
      bidang: "UPTU",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 4,
      file: "SP2D-Realisasi-Pekerjaan-Irigasi-dan-Bendungan.pdf",
      namaDokumen: "SP2D Pembayaran Belanja Modal Konstruksi Jaringan Irigasi SDA",
      eksis: true,
      ukuran: "3.45 Mb",
      ukuranBytes: 3617587,
      tglUpload: "2026-06-15",
      tipe: "pdf",
      status: "Approved",
      kategori: "SP2D & SPJ",
      bidang: "SDA",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 5,
      file: "Bukti-Kuitansi-dan-Faktur-Pajak-Jaringan-Air-Baku.pdf",
      namaDokumen: "Kuitansi dan Bukti Potong Pajak Belanja Barang Operasional SDA",
      eksis: true,
      ukuran: "2.18 Mb",
      ukuranBytes: 2285895,
      tglUpload: "2026-06-12",
      tipe: "pdf",
      status: "Approved",
      kategori: "Kwitansi & Pajak",
      bidang: "SDA",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 6,
      file: "SP2D-Termin-Pembangunan-Gedung-Strategis-CKPS.pdf",
      namaDokumen: "SP2D Termin Belanja Modal Gedung Balai Diklat CKPS",
      eksis: true,
      ukuran: "4.10 Mb",
      ukuranBytes: 4299161,
      tglUpload: "2026-06-10",
      tipe: "pdf",
      status: "Approved",
      kategori: "SP2D & SPJ",
      bidang: "CKPS",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 7,
      file: "BAST-Prestasi-Fisik-Prasarana-Kawasan-CKPS.pdf",
      namaDokumen: "Berita Acara Kemajuan Fisik & Pemeriksaan Prestasi Pekerjaan CKPS",
      eksis: true,
      ukuran: "1.95 Mb",
      ukuranBytes: 2044723,
      tglUpload: "2026-06-08",
      tipe: "pdf",
      status: "Approved",
      kategori: "Kontrak & BAST",
      bidang: "CKPS",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 8,
      file: "SP2D-Gaji-Induk-dan-Tunjangan-Pegawai-UPTU.pdf",
      namaDokumen: "SP2D Belanja Pegawai Gaji Induk dan Tunjangan Kinerja UPTU",
      eksis: true,
      ukuran: "2.65 Mb",
      ukuranBytes: 2778726,
      tglUpload: "2026-06-05",
      tipe: "pdf",
      status: "Approved",
      kategori: "Belanja Pegawai",
      bidang: "UPTU",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 9,
      file: "Rekon-Buku-Kas-Umum-dan-Rekening-Bank-UPTU.xlsx",
      namaDokumen: "Rekonsiliasi Buku Kas Umum (BKU) dan LPJ Pengeluaran UPTU",
      eksis: true,
      ukuran: "0.85 Mb",
      ukuranBytes: 891289,
      tglUpload: "2026-06-02",
      tipe: "xlsx",
      status: "Approved",
      kategori: "Rekonsiliasi Kas",
      bidang: "UPTU",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 4,
      file: "SP2D-Gaji-Induk-Januari-2026.pdf",
      namaDokumen: "SP2D Gaji Induk dan Tunjangan Pegawai Satker Januari 2026",
      eksis: true,
      ukuran: "1.45 Mb",
      ukuranBytes: 1520435,
      tglUpload: "2026-09-20",
      tipe: "pdf",
      status: "Approved",
      kategori: "SP2D & Pembayaran",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 5,
      file: "Matriks-Perubahan-Alokasi-Anggaran-TW1.xlsx",
      namaDokumen: "Matriks Komparasi Pagu dan Realisasi Anggaran Satker Triwulan 1",
      eksis: true,
      ukuran: "0.72 Mb",
      ukuranBytes: 754974,
      tglUpload: "2026-09-19",
      tipe: "xlsx",
      status: "Approved",
      kategori: "Anggaran & Perencanaan",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 6,
      file: "Laporan-Rekonsiliasi-Bank-Kas-Januari.pdf",
      namaDokumen: "Berita Acara Rekonsiliasi Bank dan Rekening Kas Satker",
      eksis: true,
      ukuran: "2.10 Mb",
      ukuranBytes: 2202009,
      tglUpload: "2026-09-18",
      tipe: "pdf",
      status: "Approved",
      kategori: "Rekonsiliasi Kas",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 7,
      file: "Surat-Pengesahan-DIPA-DJPb-2026.pdf",
      namaDokumen: "Surat Pengesahan Revisi Anggaran dari Kantor Wilayah Ditjen Perbendaharaan",
      eksis: true,
      ukuran: "0.95 Mb",
      ukuranBytes: 996147,
      tglUpload: "2026-09-15",
      tipe: "pdf",
      status: "Approved",
      kategori: "DIPA & POK",
      statusVerifikasi: "Terverifikasi",
    },
    {
      id: 8,
      file: "Rekap-Bukti-Pengeluaran-Kas-TW1.zip",
      namaDokumen: "Arsip Kompresi Dokumen Pendukung Kuitansi & Faktur Pajak TW 1",
      eksis: true,
      ukuran: "14.30 Mb",
      ukuranBytes: 14994636,
      tglUpload: "2026-09-12",
      tipe: "zip",
      status: "Approved",
      kategori: "Kwitansi & Pajak",
      statusVerifikasi: "Terverifikasi",
    },
  ],
  sheet2: [
    {
      id: 1,
      file: "DIPA-Petikan-Satker-Pusbangkom-2026.pdf",
      namaDokumen: "DIPA Petikan Satker Pusat Pengembangan Kompetensi TA 2026",
      eksis: true,
      ukuran: "3.24 Mb",
      ukuranBytes: 3397386,
      tglUpload: "2026-09-20",
      tipe: "pdf",
      status: "Approved",
      kategori: "DIPA & POK",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 2,
      file: "POK-Rincian-Kegiatan-Operasional-2026.xlsx",
      namaDokumen: "Petunjuk Operasional Kegiatan Rincian Output Pelatihan Teknis",
      eksis: true,
      ukuran: "1.15 Mb",
      ukuranBytes: 1205862,
      tglUpload: "2026-09-19",
      tipe: "xlsx",
      status: "Approved",
      kategori: "DIPA & POK",
      statusVerifikasi: "Terverifikasi",
      bidang: "CKPS",
    },
    {
      id: 3,
      file: "SK-PPK-dan-Bendahara-Pengeluaran-2026.pdf",
      namaDokumen: "Surat Keputusan Pengangkatan Pejabat Perbendaharaan Satker",
      eksis: true,
      ukuran: "2.80 Mb",
      ukuranBytes: 2936012,
      tglUpload: "2026-09-17",
      tipe: "pdf",
      status: "Approved",
      kategori: "SK Pejabat",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 4,
      file: "Register-Penutupan-Kas-Bulanan.pdf",
      namaDokumen: "Register Penutupan Buku Kas Umum (BKU) Satker Periode Berjalan",
      eksis: true,
      ukuran: "0.64 Mb",
      ukuranBytes: 671088,
      tglUpload: "2026-09-14",
      tipe: "pdf",
      status: "Approved",
      kategori: "Buku Kas",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
  ],
  agustus: [
    {
      id: 1,
      file: "SP2D-Belanja-Modal-Gedung-Agustus.pdf",
      namaDokumen: "SP2D Pembayaran Termin Pekerjaan Fisik Gedung Diklat",
      eksis: true,
      ukuran: "4.15 Mb",
      ukuranBytes: 4351590,
      tglUpload: "2026-08-30",
      tipe: "pdf",
      status: "Approved",
      kategori: "Belanja Modal",
      statusVerifikasi: "Terverifikasi",
      bidang: "CKPS",
    },
    {
      id: 2,
      file: "BAST-Pekerjaan-Konstruksi-Gedung-Tahap1.pdf",
      namaDokumen: "Berita Acara Serah Terima Pekerjaan dan Prestasi Fisik",
      eksis: true,
      ukuran: "5.60 Mb",
      ukuranBytes: 5872025,
      tglUpload: "2026-08-28",
      tipe: "pdf",
      status: "Approved",
      kategori: "Kontrak & BAST",
      statusVerifikasi: "Terverifikasi",
      bidang: "CKPS",
    },
    {
      id: 3,
      file: "Kertas-Kerja-Evaluasi-Agustus-2025.xlsx",
      namaDokumen: "Evaluasi Realisasi Penyerapan Anggaran Bulan Agustus",
      eksis: true,
      ukuran: "0.98 Mb",
      ukuranBytes: 1027604,
      tglUpload: "2026-08-25",
      tipe: "xlsx",
      status: "Approved",
      kategori: "Evaluasi Anggaran",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 4,
      file: "Bukti-Setor-Pajak-PPh-PPN-Agustus.pdf",
      namaDokumen: "Surat Setoran Pajak (SSP) Belanja Jasa dan Pengadaan Agustus",
      eksis: true,
      ukuran: "1.82 Mb",
      ukuranBytes: 1908408,
      tglUpload: "2026-08-20",
      tipe: "pdf",
      status: "Approved",
      kategori: "Pajak & Retribusi",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
  ],
  juli: [
    {
      id: 1,
      file: "SPM-Belanja-Operasional-Juli.pdf",
      namaDokumen: "Surat Perintah Membayar Keperluan Bahan Operasional Diklat",
      eksis: true,
      ukuran: "1.25 Mb",
      ukuranBytes: 1310720,
      tglUpload: "2026-07-28",
      tipe: "pdf",
      status: "Approved",
      kategori: "SPM & SP2D",
      statusVerifikasi: "Terverifikasi",
      bidang: "CKPS",
    },
    {
      id: 2,
      file: "Daftar-Realisasi-Anggaran-Semester-1.xlsx",
      namaDokumen: "Laporan Realisasi Semester I Berdasarkan Akun Belanja",
      eksis: true,
      ukuran: "1.78 Mb",
      ukuranBytes: 1866465,
      tglUpload: "2026-07-15",
      tipe: "xlsx",
      status: "Approved",
      kategori: "Laporan Keuangan",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 3,
      file: "Dokumen-Pemeriksaan-Kas-KPPN-Juli.pdf",
      namaDokumen: "Hasil Rekonsiliasi dan Uji Petik Saldo Kas Satker di KPPN",
      eksis: true,
      ukuran: "2.40 Mb",
      ukuranBytes: 2516582,
      tglUpload: "2026-07-10",
      tipe: "pdf",
      status: "Approved",
      kategori: "Rekonsiliasi Kas",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
  ],
  juni: [
    {
      id: 1,
      file: "Kertas-Kerja-Revisi-Anggaran-Ke-1.xls",
      namaDokumen: "Kertas Kerja Revisi DIPA Pergeseran Antar Sub-Komponen",
      eksis: true,
      ukuran: "0.75 Mb",
      ukuranBytes: 786432,
      tglUpload: "2026-06-25",
      tipe: "xls",
      status: "Approved",
      kategori: "Kertas Kerja",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 2,
      file: "SP2D-Gaji-dan-Tunjangan-Ke-13.pdf",
      namaDokumen: "SP2D Pembayaran Gaji Ketiga Belas Aparatur Sipil Negara",
      eksis: true,
      ukuran: "3.10 Mb",
      ukuranBytes: 3250585,
      tglUpload: "2026-06-12",
      tipe: "pdf",
      status: "Approved",
      kategori: "SP2D & Pembayaran",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
  ],
  mei: [
    {
      id: 1,
      file: "LPJ-Bendahara-Pengeluaran-Mei.pdf",
      namaDokumen: "Laporan Pertanggungjawaban Bendahara Pengeluaran Bulan Mei",
      eksis: true,
      ukuran: "2.65 Mb",
      ukuranBytes: 2778726,
      tglUpload: "2026-05-30",
      tipe: "pdf",
      status: "Approved",
      kategori: "LPJ Bendahara",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 2,
      file: "Rekapitulasi-Uang-Persediaan-UP-Mei.xlsx",
      namaDokumen: "Rincian Penggunaan Saldo Uang Persediaan (UP) Satker",
      eksis: true,
      ukuran: "0.88 Mb",
      ukuranBytes: 922746,
      tglUpload: "2026-05-22",
      tipe: "xlsx",
      status: "Approved",
      kategori: "Uang Persediaan",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
  ],
  april: [
    {
      id: 1,
      file: "SP2D-Belanja-Barang-Operasional-April.pdf",
      namaDokumen: "SP2D Langsung (LS) Belanja Pemeliharaan Sarana Gedung Kantor",
      eksis: true,
      ukuran: "1.92 Mb",
      ukuranBytes: 2013265,
      tglUpload: "2026-04-26",
      tipe: "pdf",
      status: "Approved",
      kategori: "Belanja Barang",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 2,
      file: "Buku-Kas-Umum-Pengeluaran-April.pdf",
      namaDokumen: "Buku Kas Umum Penatausahaan Keuangan Satker Bulan April",
      eksis: true,
      ukuran: "3.45 Mb",
      ukuranBytes: 3617587,
      tglUpload: "2026-04-20",
      tipe: "pdf",
      status: "Approved",
      kategori: "Buku Kas",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
  ],
  maret: [
    {
      id: 1,
      file: "DIPA-Awal-TA-2026-Lembar-Alokasi.pdf",
      namaDokumen: "DIPA Induk dan POK Definitif Triwulan I TA 2026",
      eksis: true,
      ukuran: "4.85 Mb",
      ukuranBytes: 5085593,
      tglUpload: "2026-03-28",
      tipe: "pdf",
      status: "Approved",
      kategori: "DIPA & POK",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
    {
      id: 2,
      file: "Laporan-Realisasi-Triwulan-1-2026.xlsx",
      namaDokumen: "Laporan Capaian Kinerja dan Keuangan Triwulan I Satker PU",
      eksis: true,
      ukuran: "1.34 Mb",
      ukuranBytes: 1405091,
      tglUpload: "2026-03-25",
      tipe: "xlsx",
      status: "Approved",
      kategori: "Laporan Keuangan",
      statusVerifikasi: "Terverifikasi",
      bidang: "UPTU",
    },
  ],
};

// Ringkasan Rekapitulasi Kelengkapan Dokumen Pertanggungjawaban Sheet2 (per bidang)
// Sumber: lembar "Sheet2" spreadsheet ASLI (REKAPITULASI ... STATUS S.D 12 JULI 2026)
export const SHEET2_BIDANG_SUMMARY = {
  SDA: { jumlahSpmTotal: 67, tidakTersedia: 27, target: "25 JULI" },
  CKPS: { jumlahSpmTotal: 75, tidakTersedia: 2, target: "25 JULI" },
  UPTU: { jumlahSpmTotal: 206, tidakTersedia: 1, target: "27 JULI" },
};

// Rincian per kegiatan: JUMLAH SPM (tersedia), TIDAK TERSEDIA, TINDAK LANJUT (target)
export const SHEET2_BIDANG_DETAIL = {
  SDA: [
    { no: 1, kegiatan: "Penyusunan Kurmod pelatihan Bid SDA (pelatihan pengelolaan banjir perkotaan)", tersedia: 12, tidakTersedia: 3, tindakLanjut: "25 JULI" },
    { no: 2, kegiatan: "Penyusunan Kurmod pelatihan Bid SDA (pelatihan penyusunan pola pengeloaan sda)", tersedia: 13, tidakTersedia: 3, tindakLanjut: "25 JULI" },
    { no: 3, kegiatan: "Penyusunan Kurmod pelatihan Bid SDA (pelatihan penyusunan rencana pengelolaan sda)", tersedia: 10, tidakTersedia: 5, tindakLanjut: "25 JULI" },
    { no: 4, kegiatan: "Penyusunan Kurmod pelatihan Bid SDA (pelatihan penilaian kelayakan kinerja sistem irigasi)", tersedia: 4, tidakTersedia: 5, tindakLanjut: "25 JULI" },
    { no: 5, kegiatan: "Pemutakhiran kurikulum dan modul pelatihan bida sda (pelatihan hidrologi dasar)", tersedia: 9, tidakTersedia: 3, tindakLanjut: "25 JULI" },
    { no: 6, kegiatan: "Penyiapan materi e-learning pengembangan kompetensi bid sda", tersedia: 7, tidakTersedia: 4, tindakLanjut: "25 JULI" },
    { no: 7, kegiatan: "Penyusunan skema sertifikasi pelatihan bid sda", tersedia: 3, tidakTersedia: 1, tindakLanjut: "25 JULI" },
    { no: 8, kegiatan: "Optimalisasi Pembinaan jafung WI SDA", tersedia: 9, tidakTersedia: 3, tindakLanjut: "25 JULI" },
  ],
  CKPS: [
    { no: 1, kegiatan: "Penyusunan Kurmod pelatihan Bid CKPS (pelatihan PISK)", tersedia: 13, tidakTersedia: 0, tindakLanjut: "25 JULI" },
    { no: 2, kegiatan: "Penyusunan Kurmod pelatihan Bid CKPS (pelatihan perencanaan TPST)", tersedia: 11, tidakTersedia: 1, tindakLanjut: "25 JULI" },
    { no: 3, kegiatan: "Penyusunan Kurmod pelatihan Bid CKPS (pelatihan bangunan gedung cerdas)", tersedia: 14, tidakTersedia: 0, tindakLanjut: "25 JULI" },
    { no: 4, kegiatan: "Penyusunan Kurmod pelatihan Bid CKPS (pelatihan penyelenggaraan penataan bangunan)", tersedia: 8, tidakTersedia: 0, tindakLanjut: "25 JULI" },
    { no: 5, kegiatan: "Penyusunan Kurmod pelatihan Bid CKPS (pelatihan penyelenggaraan SPAM)", tersedia: 11, tidakTersedia: 0, tindakLanjut: "25 JULI" },
    { no: 6, kegiatan: "Penyiapan materi e-learning pengembangan kompetensi bid ckps", tersedia: 12, tidakTersedia: 0, tindakLanjut: "25 JULI" },
    { no: 7, kegiatan: "Peningkatan kompetensi teknis pengajar bid ckps", tersedia: 6, tidakTersedia: 1, tindakLanjut: "25 JULI" },
  ],
  UPTU: [
    { no: 1, kegiatan: "Tata kelola penyelenggaraan keg pusat", tersedia: 1, tidakTersedia: 0, tindakLanjut: "—" },
    { no: 2, kegiatan: "Penyusunan rencana pengembangan kompetensi individual / IDP", tersedia: 6, tidakTersedia: 0, tindakLanjut: "—" },
    { no: 3, kegiatan: "Penyusunan laporan keuangan", tersedia: 11, tidakTersedia: 0, tindakLanjut: "—" },
    { no: 4, kegiatan: "Pembayaran gaji dan tunjangan", tersedia: 25, tidakTersedia: 0, tindakLanjut: "—" },
    { no: 5, kegiatan: "operasional dan pemeliharaan kantor", tersedia: 145, tidakTersedia: 1, tindakLanjut: "27 JULI" },
    { no: 6, kegiatan: "pengadaan perangkat pengolah data", tersedia: 1, tidakTersedia: 0, tindakLanjut: "—" },
    { no: 7, kegiatan: "Peningkatan komptensi SDM", tersedia: 8, tidakTersedia: 0, tindakLanjut: "—" },
    { no: 8, kegiatan: "Optimalisasi Pembinaan jafung analis", tersedia: 9, tidakTersedia: 0, tindakLanjut: "—" },
  ],
};

// ============================================================
// Kode Kegiatan — kode rekening kegiatan PU (program/bidang/output)
// Dipakai sebagai sumber opsi pada dropdown filter "Kode Kegiatan".
// Daftar ini adalah referensi baku; kode tambahan yang muncul dari
// sinkronisasi live akan digabungkan otomatis oleh komponen filter.
// ============================================================
export const KODE_KEGIATAN = [
  // ─── Program 7769 (SDA & CKPS) ───
  { kode: "7769.AFA.001.100.A", bidang: "SDA",  nama: "Belanja Barang & Jasa Bidang SDA (WA 7769 AFA 001.100A)" },
  { kode: "7769.AFA.001.100.B", bidang: "CKPS", nama: "Belanja Barang & Jasa Bidang CKPS (WA 7769 AFA 001.100B)" },
  { kode: "7769.AFA.001.100.C", bidang: "UPTU", nama: "Belanja Barang & Jasa Bidang UPTU (WA 7769 AFA 001.100C)" },
  { kode: "7769.AFA.001.100.D", bidang: "SDA",  nama: "Layanan Operasional Perkantoran SDA" },
  { kode: "7769.AFA.001.100.E.P", bidang: "SDA", nama: "Pengelolaan Prasarana & Keuangan SDA" },
  { kode: "7769.AFA.001.100.F.P", bidang: "SDA", nama: "Pemeliharaan Sarana & Prasarana SDA" },
  { kode: "7769.AFA.001.100.G", bidang: "SDA",  nama: "Dukungan Manajemen & Tata Kelola SDA" },
  { kode: "7769.AFA.002.100.A", bidang: "CKPS", nama: "Operasional & Layanan Perkantoran CKPS" },
  { kode: "7769.AFA.002.100.B", bidang: "CKPS", nama: "Pengawasan & Evaluasi Kegiatan CKPS" },
  { kode: "7769.AFA.002.100.C", bidang: "CKPS", nama: "Pemeliharaan Gedung & Bangunan CKPS" },
  { kode: "7769.AFA.002.100.D", bidang: "CKPS", nama: "Layanan Perencanaan & Pemrograman CKPS" },
  { kode: "7769.AFA.002.100.E", bidang: "CKPS", nama: "Pengembangan Prasarana Pemukiman" },
  { kode: "7769.AFA.002.100.F", bidang: "CKPS", nama: "Pengelolaan Sistem Informasi & Arsip CKPS" },
  { kode: "7769.AFA.002.100.G", bidang: "CKPS", nama: "Dukungan Administrasi Keuangan CKPS" },
  { kode: "7769.EBC.996.101.A.T", bidang: "SDA", nama: "Pembangunan Infrastruktur SDA Utama" },
  { kode: "7769.EBC.996.101.B", bidang: "SDA",  nama: "Belanja Modal Bidang SDA (WA 7769 EBC 996.101B)" },
  { kode: "7769.EBC.996.101.C.B", bidang: "SDA", nama: "Pembangunan Bendungan & Danau" },
  { kode: "7769.EBC.996.101.D", bidang: "SDA",  nama: "Pembangunan Jaringan Irigasi & Rawa" },
  { kode: "7769.EBC.996.101.H", bidang: "SDA",  nama: "Pengendalian Banjir & Pengamanan Pantai" },
  { kode: "7769.EBC.996.101.I", bidang: "SDA",  nama: "Penyediaan Air Baku & Pengendalian Daya Rusak" },

  // ─── Program 7770 (UPTU & Balai Diklat / Pengembangan SDM) ───
  { kode: "7770.EBA.962.100.A", bidang: "UPTU", nama: "Layanan Pendidikan & Pelatihan Bidang PU" },
  { kode: "7770.EBA.962.100.B", bidang: "UPTU", nama: "Penyelenggaraan Pelatihan Teknis & Fungsional" },
  { kode: "7770.EBA.962.100.C", bidang: "UPTU", nama: "Sertifikasi Kompetensi SDM Konstruksi" },
  { kode: "7770.EBA.994.001.A", bidang: "UPTU", nama: "Dukungan Manajemen & Operasional Pusbangkom" },
  { kode: "7770.EBA.994.002.A", bidang: "UPTU", nama: "Pengelolaan Sarana Balai Pelatihan & Diklat" },
  { kode: "7770.EBA.994.002.B", bidang: "UPTU", nama: "Layanan Asrama & Konsumsi Pelatihan" },
  { kode: "7770.EBA.994.002.C", bidang: "UPTU", nama: "Pemeliharaan Fasilitas Kampus & Balai Diklat" },
  { kode: "7770.EBA.994.002.D", bidang: "UPTU", nama: "Operational Smart Class & Laboratorium Diklat" },
  { kode: "7770.EBB.951.100.A", bidang: "UPTU", nama: "Penyusunan Modul & Kurikulum Pelatihan PU" },
  { kode: "7770.EBC.996.100.A", bidang: "UPTU", nama: "Rehabilitasi & Renovasi Bangunan Diklat UPTU" },
  { kode: "7770.EBC.996.100.B", bidang: "UPTU", nama: "Pengadaan Peralatan Diklat & Media Pembelajaran" },
  { kode: "7770.EBC.996.100.C", bidang: "UPTU", nama: "Belanja Modal Prasarana TI Pusbangkom" },
  { kode: "7770.EBC.996.100.D", bidang: "UPTU", nama: "Renovasi Gedung Operasional & Kantor Balai" },
  { kode: "7770.EBD.Z32.100A",  bidang: "UPTU", nama: "Pengelolaan Arsip Digital & Sistem Informasi Keuangan" },

  // ─── Format Alternatif Kode Utama PU (WA ...) ───
  { kode: "WA 7769 AFA 001.100A", bidang: "SDA",  nama: "Belanja Barang & Jasa Bidang SDA" },
  { kode: "WA 7769 AFA 001.100B", bidang: "CKPS", nama: "Belanja Barang & Jasa Bidang CKPS" },
  { kode: "WA 7769 AFA 001.100C", bidang: "UPTU", nama: "Belanja Barang & Jasa Bidang UPTU" },
  { kode: "WA 7769 EBC 996.101B", bidang: "SDA",  nama: "Belanja Modal Bidang SDA" },
];

// Ringkasan daftar SPM per bidang untuk tab "Salinan dari JAN SD AGUSTUS"
// (dihitung dari 564 baris daftar SPM asli; grup "LUKI" dihitung ke bidang UPTU)
export const AGUSTUS_BIDANG_SUMMARY = {
  SDA: { jumlahSpm: 134, tidakTersedia: 12, target: "—" },
  CKPS: { jumlahSpm: 130, tidakTersedia: 0, target: "—" },
  UPTU: { jumlahSpm: 278, tidakTersedia: 6, target: "—" },
};

// Contoh baris daftar SPM (fallback bila sinkronisasi live gagal)
export const AGUSTUS_BIDANG_DETAIL = {
  SDA: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100A", grupKode: "WA 7769 AFA 001.100A", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100A", realisasi: 5147288, noSpm: 51, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1273000, noSpm: 136, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1830000, noSpm: 161, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "WA 7769 EBC 996.101B", grupKode: "WA 7769 EBC 996.101B", realisasi: null, noSpm: "—", status: "—" },
    { no: 6, kodeKegiatan: "—", grupKode: "WA 7769 EBC 996.101B", realisasi: 5664282, noSpm: 300, status: "LENGKAP" },
    { no: 7, kodeKegiatan: "—", grupKode: "WA 7769 EBC 996.101B", realisasi: 9950000, noSpm: 356, status: "TIDAK ADA" },
    { no: 8, kodeKegiatan: "—", grupKode: "WA 7769 EBC 996.101B", realisasi: 4400000, noSpm: 315, status: "TIDAK ADA" },
  ],
  CKPS: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100B", grupKode: "WA 7769 AFA 001.100B", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100B", realisasi: 7001006, noSpm: 109, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 3210325, noSpm: 122, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 1259000, noSpm: 170, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 1320000, noSpm: 240, status: "LENGKAP" },
  ],
  UPTU: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100C", grupKode: "WA 7769 AFA 001.100C", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521219", grupKode: "WA 7769 AFA 001.100C", realisasi: 118479151, noSpm: 17, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 18, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100C", realisasi: 2792869, noSpm: 229, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 4095900, noSpm: 333, status: "LENGKAP" },
    { no: 6, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 2270000, noSpm: 393, status: "TIDAK ADA" },
  ],
};

// Ringkasan daftar SPM per bidang untuk tab "JAN SD JULI"
// (dihitung dari 489 baris daftar SPM asli; grup "LUKI" dihitung ke bidang UPTU)
export const JULI_BIDANG_SUMMARY = {
  SDA: { jumlahSpm: 113, tidakTersedia: 0, target: "—" },
  CKPS: { jumlahSpm: 106, tidakTersedia: 0, target: "—" },
  UPTU: { jumlahSpm: 240, tidakTersedia: 1, target: "—" },
};

// Contoh baris daftar SPM (fallback bila sinkronisasi live gagal)
export const JULI_BIDANG_DETAIL = {
  SDA: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100A", grupKode: "WA 7769 AFA 001.100A", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100A", realisasi: 5147288, noSpm: 51, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1273000, noSpm: 136, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1830000, noSpm: 161, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 5664282, noSpm: 300, status: "LENGKAP" },
    { no: 6, kodeKegiatan: "522131", grupKode: "WA 7769 AFA 001.100A", realisasi: 9950000, noSpm: 129, status: "LENGKAP" },
  ],
  CKPS: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100B", grupKode: "WA 7769 AFA 001.100B", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100B", realisasi: 7001006, noSpm: 109, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 3210325, noSpm: 122, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 1259000, noSpm: 170, status: "LENGKAP" },
  ],
  UPTU: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100C", grupKode: "WA 7769 AFA 001.100C", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521219", grupKode: "WA 7769 AFA 001.100C", realisasi: 118479151, noSpm: 17, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 18, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 42, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 500000, noSpm: 201, status: "TIDAK ADA" },
  ],
};

// Ringkasan daftar SPM per bidang untuk tab "JAN SD JUNI"
export const JUNI_BIDANG_SUMMARY = {
  SDA: { jumlahSpm: 78, tidakTersedia: 0, target: "—" },
  CKPS: { jumlahSpm: 74, tidakTersedia: 0, target: "—" },
  UPTU: { jumlahSpm: 198, tidakTersedia: 1, target: "—" },
};

export const JUNI_BIDANG_DETAIL = {
  SDA: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100A", grupKode: "WA 7769 AFA 001.100A", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100A", realisasi: 5147288, noSpm: 51, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1273000, noSpm: 136, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1830000, noSpm: 161, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "522131", grupKode: "WA 7769 AFA 001.100A", realisasi: 9950000, noSpm: 129, status: "LENGKAP" },
  ],
  CKPS: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100B", grupKode: "WA 7769 AFA 001.100B", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100B", realisasi: 7001006, noSpm: 109, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 3210325, noSpm: 122, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 1259000, noSpm: 170, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 1320000, noSpm: 240, status: "LENGKAP" },
  ],
  UPTU: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100C", grupKode: "WA 7769 AFA 001.100C", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521219", grupKode: "WA 7769 AFA 001.100C", realisasi: 118479151, noSpm: 17, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 18, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 42, status: "LENGKAP" },
    { no: 5, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 500000, noSpm: 201, status: "TIDAK ADA" },
  ],
};

// Ringkasan daftar SPM per bidang untuk tab "JAN SD MEI"
export const MEI_BIDANG_SUMMARY = {
  SDA: { jumlahSpm: 44, tidakTersedia: 0, target: "—" },
  CKPS: { jumlahSpm: 43, tidakTersedia: 0, target: "—" },
  UPTU: { jumlahSpm: 164, tidakTersedia: 0, target: "—" },
};
export const MEI_BIDANG_DETAIL = {
  SDA: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100A", grupKode: "WA 7769 AFA 001.100A", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100A", realisasi: 5147288, noSpm: 51, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1273000, noSpm: 136, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 1830000, noSpm: 161, status: "LENGKAP" },
  ],
  CKPS: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100B", grupKode: "WA 7769 AFA 001.100B", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100B", realisasi: 7001006, noSpm: 109, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 3210325, noSpm: 122, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100B", realisasi: 1259000, noSpm: 170, status: "LENGKAP" },
  ],
  UPTU: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100C", grupKode: "WA 7769 AFA 001.100C", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521219", grupKode: "WA 7769 AFA 001.100C", realisasi: 118479151, noSpm: 17, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 18, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 42, status: "LENGKAP" },
  ],
};

// Ringkasan daftar SPM per bidang untuk tab "JAN SD APRIL"
export const APRIL_BIDANG_SUMMARY = {
  SDA: { jumlahSpm: 19, tidakTersedia: 0, target: "—" },
  CKPS: { jumlahSpm: 23, tidakTersedia: 0, target: "—" },
  UPTU: { jumlahSpm: 116, tidakTersedia: 0, target: "—" },
};
export const APRIL_BIDANG_DETAIL = {
  SDA: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100A", grupKode: "WA 7769 AFA 001.100A", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100A", realisasi: 5147288, noSpm: 51, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "524111", grupKode: "WA 7769 AFA 001.100A", realisasi: 2604990, noSpm: 31, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100A", realisasi: 4549675, noSpm: 84, status: "LENGKAP" },
  ],
  CKPS: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100B", grupKode: "WA 7769 AFA 001.100B", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100B", realisasi: 7001006, noSpm: 109, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "524111", grupKode: "WA 7769 AFA 001.100B", realisasi: 1875000, noSpm: 100, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100B", realisasi: 2614432, noSpm: 80, status: "LENGKAP" },
  ],
  UPTU: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100C", grupKode: "WA 7769 AFA 001.100C", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521219", grupKode: "WA 7769 AFA 001.100C", realisasi: 118479151, noSpm: 17, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 18, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 42, status: "LENGKAP" },
  ],
};

// Ringkasan daftar SPM per bidang untuk tab "JAN SD MRT"
export const MARET_BIDANG_SUMMARY = {
  SDA: { jumlahSpm: 11, tidakTersedia: 0, target: "—" },
  CKPS: { jumlahSpm: 3, tidakTersedia: 0, target: "—" },
  UPTU: { jumlahSpm: 76, tidakTersedia: 0, target: "—" },
};
export const MARET_BIDANG_DETAIL = {
  SDA: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100A", grupKode: "WA 7769 AFA 001.100A", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100A", realisasi: 5147288, noSpm: 51, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "524111", grupKode: "WA 7769 AFA 001.100A", realisasi: 2604990, noSpm: 31, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "524111", grupKode: "WA 7769 AFA 001.100A", realisasi: 2783618, noSpm: 32, status: "LENGKAP" },
  ],
  CKPS: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100B", grupKode: "WA 7769 AFA 001.100B", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "524111", grupKode: "WA 7769 AFA 001.100B", realisasi: 3470000, noSpm: 20, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "521211", grupKode: "WA 7769 AFA 001.100B", realisasi: 3371302, noSpm: 51, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "524111", grupKode: "WA 7769 AFA 001.100B", realisasi: 815500, noSpm: 29, status: "LENGKAP" },
  ],
  UPTU: [
    { no: 1, kodeKegiatan: "WA 7769 AFA 001.100C", grupKode: "WA 7769 AFA 001.100C", realisasi: null, noSpm: "—", status: "—" },
    { no: 2, kodeKegiatan: "521219", grupKode: "WA 7769 AFA 001.100C", realisasi: 118479151, noSpm: 17, status: "LENGKAP" },
    { no: 3, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 18, status: "LENGKAP" },
    { no: 4, kodeKegiatan: "—", grupKode: "WA 7769 AFA 001.100C", realisasi: 103354153, noSpm: 42, status: "LENGKAP" },
  ],
};

// ============================================================
// Filter Tahun & Bulan Anggaran (sumber tunggal untuk Dashboard)
// ------------------------------------------------------------
// Tambah/hapus tahun pada TAHUN_ANGGARAN bila data master
// tahun anggaran baru sudah tersedia. `id` bulan di bawah juga
// dipakai sebagai kunci pagu per bulan (PAGU_ANGGARAN.perBulan).
// ============================================================

// Tahun anggaran yang bisa dipilih pada filter Dashboard (terbaru → terlama)
// 2027 & 2028 = tahun anggaran mendatang (data tampil "belum tersedia"
// sampai pagu/realisasinya diisi).
export const TAHUN_ANGGARAN = [2028, 2027, 2026, 2025, 2024];

// Tahun anggaran aktif (default filter Dashboard & ringkasan pagu)
export const TAHUN_ANGGARAN_AKTIF = 2026;

// ============================================================
// Arsip DIPA di Google Drive
// ------------------------------------------------------------
// Root folder arsip menampung subfolder per tahun, mis.
// "DIPA AWAL TA 2026", "DIPA REVISI 1 TA 2027", dst. Halaman
// "History Revisi DIPA" membaca seluruh subfolder tersebut dan
// menyusun sendiri daftar tahun yang bisa difilter dari tanggal
// dokumen — jadi menambah folder tahun baru (mis. TA 2030) otomatis
// muncul di filter tanpa perlu mengubah kode aplikasi.
// ============================================================
export const DIPA_FOLDER_ARSIP = "1A1KD9grE5z-ldfSfxFORuh4NILc5sIuN";

// ============================================================
// LAPORAN REALISASI SP2D TA 2026 — sumber data LIVE Dashboard
// ------------------------------------------------------------
// Data SP2D TIDAK bisa dibuat live dari folder `public/`: berkas
// di sana ikut ter-bundle saat build, jadi berubah hanya setelah
// redeploy. Agar Dashboard ikut berubah ketika berkas dihapus atau
// di-update di Google Drive, nominal & jumlah berkas harus diambil
// langsung dari Google (Drive API / Google Sheets) saat runtime.
// ============================================================

// ── (1) ANGKA NOMINAL → Google Spreadsheet ────────────────────
// Buat tab (sheet) dengan nama di bawah pada spreadsheet yang sudah
// ditautkan di aplikasi (tautan diatur di halaman "Hasil Verifikasi
// Digitalisasi" → Ganti Link).
//
// Kolom dibaca berdasarkan NAMA KOLOM (urutan bebas):
//   Bulan | Pagu | Realisasi | Jumlah SPM
// Contoh baris:
//   Agustus | 15889706000 | 2650030873 | 12
//
// Dashboard membacanya lewat GVIZ (CORS-friendly, tanpa login),
// jadi setiap kali baris spreadsheet diubah angkanya langsung tampil.
export const SP2D_SHEET_TAB = "LAPORAN REALISASI SP2D TA 2026";

// Nama kolom yang dikenali pada tab di atas (huruf besar/kecil bebas).
export const SP2D_SHEET_KOLOM = {
  bulan: "Bulan",
  pagu: "Pagu",
  realisasi: "Realisasi",
  jumlahSpm: "Jumlah SPM",
};

// ── (2) JUMLAH BERKAS → Google Drive ──────────────────────────
// Isi ID folder "LAPORAN REALISASI SP2D TA 2026" di Drive.
// Cara mendapat ID: buka foldernya di browser, lalu salin bagian
// setelah "/folders/" pada URL.
//   contoh: https://drive.google.com/drive/folders/1AbCdEfGhIjKl
//           → SP2D_FOLDER_ID = "1AbCdEfGhIjKl"
//
// Nama berkas/folder di dalamnya dipetakan ke bulan lewat
// PETA_BULAN_SP2D (JAN.pdf, FEB.pdf, ... AGST.pdf sudah cukup).
// Hapus atau update berkas di Drive → jumlah berkas di Dashboard
// berubah otomatis (polling tiap 6 detik + saat tab browser difokuskan).
export const SP2D_FOLDER_ID = "";

// Kata kunci nama berkas/folder → id bulan (BULAN_ANGGARAN_OPTIONS)
export const PETA_BULAN_SP2D = {
  januari: ["jan", "januari"],
  februari: ["feb", "februari"],
  maret: ["mar", "maret"],
  april: ["apr", "april"],
  mei: ["mei"],
  juni: ["jun", "juni"],
  juli: ["jul", "juli"],
  agustus: ["agu", "agt", "agst", "agustus"],
  september: ["sep", "sept"],
  oktober: ["okt", "oct", "oktober"],
  november: ["nov", "nop"],
  desember: ["des", "desember"],
};

// Daftar bulan untuk dropdown "Filter Bulan" (Januari → Desember)
export const BULAN_ANGGARAN_OPTIONS = [
  { id: "januari", label: "Januari" },
  { id: "februari", label: "Februari" },
  { id: "maret", label: "Maret" },
  { id: "april", label: "April" },
  { id: "mei", label: "Mei" },
  { id: "juni", label: "Juni" },
  { id: "juli", label: "Juli" },
  { id: "agustus", label: "Agustus" },
  { id: "september", label: "September" },
  { id: "oktober", label: "Oktober" },
  { id: "november", label: "November" },
  { id: "desember", label: "Desember" },
];

// ============================================================
// Pagu Anggaran (Pagu) — SUMBER KONSTANTA YANG DIEDIT MANUAL
// ------------------------------------------------------------
// Nilai Pagu TIDAK tersedia di data live maupun di data master
// lain (yang tersedia baru "realisasi"). Karena itu Pagu dibuat
// sebagai konstanta di bawah dan dapat diisi manual sesuai DIPA /
// RKKS terbaru.
//
// ⚠️ Sebagian nilai masih 0 (placeholder) — perbarui sesuai DIPA /
//    RKKS terbaru. Ganti `0` dengan angka Pagu resmi (tanpa titik
//    pemisah), contoh: 1_500_000_000
//    · total     → sudah diisi (pagu DIPA Revisi 8).
//    · perBidang / perBulan → masih 0, isi manual bila tersedia.
//
// Struktur:
//   PAGU_ANGGARAN.total              → Pagu keseluruhan (Total Pagu)
//   PAGU_ANGGARAN.perBidang          → Pagu per bidang (tabel "Per Kegiatan")
//   PAGU_ANGGARAN.perBulan[tahun][id] → Pagu per bulan per tahun anggaran
//                                      (kartu "Per Bulan", id bulan
//                                       lihat BULAN_ANGGARAN_OPTIONS)
// ============================================================

export const PAGU_ANGGARAN = {
  // Pagu total keseluruhan (angka rupiah penuh)
  // Diisi dari pagu DIPA Revisi 8 (6 Mei 2026) — revisi terbaru yang
  // nominal pagu-nya sudah diketahui. Revisi 9–13 belum diisi nominal.
  total: 15889706000,

  // Pagu per bidang — kunci: SDA | CKPS | UPTU
  perBidang: {
    SDA: 0,
    CKPS: 0,
    UPTU: 0,
  },

  // Pagu per bulan, dikelompokkan per tahun anggaran.
  // Kunci luar = tahun anggaran, kunci dalam = id bulan.
  perBulan: {
    2028: { januari: 0, februari: 0, maret: 0, april: 0, mei: 0, juni: 0, juli: 0, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
    2027: { januari: 0, februari: 0, maret: 0, april: 0, mei: 0, juni: 0, juli: 0, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
    2026: { januari: 0, februari: 0, maret: 0, april: 0, mei: 0, juni: 0, juli: 0, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
    2025: { januari: 0, februari: 0, maret: 0, april: 0, mei: 0, juni: 0, juli: 0, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
    2024: { januari: 0, februari: 0, maret: 0, april: 0, mei: 0, juni: 0, juli: 0, agustus: 0, september: 0, oktober: 0, november: 0, desember: 0 },
  },
};

// Pagu per kode kegiatan untuk halaman "Data Kegiatan & Anggaran".
// ⚠️ KOSONG DENGAN SENGAJA — belum ada sumber pagu di repo ini.
// Isi manual sesuai DIPA / RKKS 2026, contoh:
//   "7769.AFA.001.100.A": 25_000_000,
//   "7770.EBA.962.100.A": 40_000_000,
// Kunci = kode kegiatan persis seperti nama folder di Google Drive SPJ
// (bagian kode pada nama foldernya).
export const PAGU_KEGIATAN = {};

// ============================================================
// Bidang kegiatan — untuk Persentase di halaman "Data Kegiatan"
// ------------------------------------------------------------
// Pagu di spreadsheet rekap hanya tersedia PER BIDANG (resume SP2D:
// SDA / CKPS / UPTU), bukan per kegiatan. Supaya tiap kegiatan tetap
// bisa dihitung persentasenya, kegiatan dipetakan ke bidangnya lewat
// dua aturan di bawah (dicoba berurutan):
//   1. PETA_BIDANG_KEGIATAN → prefix kode kegiatan yang cocok
//      paling panjang menang (kode = persis nama folder Drive SPJ).
//   2. KATA_KUNCI_BIDANG → kata kunci pada nama kegiatan.
// Kegiatan yang tidak cocok di aturan mana pun tidak punya pagu
// (kolom Pagu & Persentase tampil "—"). Tambahkan baris di
// PETA_BIDANG_KEGIATAN bila ada kegiatan yang belum terpetakan.
// ============================================================
export const PETA_BIDANG_KEGIATAN = [
  { prefix: "7770.EBC.996.100.C", bidang: "SDA" },
  { prefix: "7770.EBC.996.100.D", bidang: "CKPS" },
  { prefix: "7770.EBC.996.100.A", bidang: "UPTU" },
  { prefix: "7770.EBC.996.100.B", bidang: "UPTU" },
  { prefix: "7769.AFA.001", bidang: "SDA" },
  { prefix: "7769.AFA.002", bidang: "CKPS" },
  { prefix: "7770.EBA", bidang: "UPTU" },
  { prefix: "7770.EBB", bidang: "UPTU" },
];

export const KATA_KUNCI_BIDANG = [
  { pola: /ckps/i, bidang: "CKPS" },
  { pola: /\buptu\b/i, bidang: "UPTU" },
  { pola: /\bsda\b/i, bidang: "SDA" },
  { pola: /irigasi|hidrologi|rawa|gambut|sungai|banjir|bendung|morfologi/i, bidang: "SDA" },
  {
    pola: /air minum|sanitasi|spam|pams|pisk|tpst|bangunan gedung cerdas|penataan bangunan/i,
    bidang: "CKPS",
  },
  {
    pola: /tata kelola|laporan keuangan|pembayaran gaji|operasional|perkantoran|peralatan kantor|kendaraan|daya dan jasa|perangkat pengolah data/i,
    bidang: "UPTU",
  },
];

/* Tentukan bidang (SDA | CKPS | UPTU) milik sebuah kegiatan, dari
   kode folder Drive dan nama kegiatannya. Tidak ditemukan → "". */
export function bidangDariKegiatan(kode, nama) {
  const k = String(kode || "").toUpperCase();
  let pilihan = null;
  for (const atur of PETA_BIDANG_KEGIATAN) {
    if (
      k.startsWith(atur.prefix) &&
      (!pilihan || atur.prefix.length > pilihan.prefix.length)
    ) {
      pilihan = atur;
    }
  }
  if (pilihan) return pilihan.bidang;

  const n = String(nama || "");
  for (const atur of KATA_KUNCI_BIDANG) {
    if (atur.pola.test(n)) return atur.bidang;
  }
  return "";
}

export const HASIL_VERIFIKASI_DATA = SHEET_DATA.sheet1;
