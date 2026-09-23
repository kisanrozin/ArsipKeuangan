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

// Per-sheet mock data
export const SHEET_DATA = {
  sheet1: [
    { id: 1, noRef: "17713", tanggal: "22 Jan 2026", status: "Pending",  pemohon: "Ahmad",  email: "ahmad.123@mail.com",  instansi: "Dinas PU Pusat",       pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Kontrak" },
    { id: 2, noRef: "17714", tanggal: "22 Jan 2026", status: "Approved", pemohon: "Budi",   email: "budi.x@mail.com",     instansi: "Balai Wilayah Sungai", pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Pembayaran" },
    { id: 3, noRef: "17715", tanggal: "23 Jan 2026", status: "Pending",  pemohon: "Citra",  email: "citra.d@mail.com",    instansi: "Dinas Bina Marga",    pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Teknis" },
    { id: 4, noRef: "17716", tanggal: "24 Jan 2026", status: "Rejected", pemohon: "Dani",   email: "dani.k@mail.com",     instansi: "Dinas Cipta Karya",   pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Kontrak" },
    { id: 5, noRef: "17717", tanggal: "24 Jan 2026", status: "Approved", pemohon: "Ahmad",  email: "ahmad.123@mail.com",  instansi: "Dinas PU Pusat",       pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Anggaran" },
    { id: 6, noRef: "17718", tanggal: "25 Jan 2026", status: "Pending",  pemohon: "Erna",   email: "erna.wati@mail.com",  instansi: "Balai Jalan Nasional",pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Teknis" },
    { id: 7, noRef: "17719", tanggal: "25 Jan 2026", status: "Pending",  pemohon: "Fahmi",  email: "fahmi.99@mail.com",   instansi: "Dinas Bina Marga",    pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Pembayaran" },
  ],
  sheet2: [
    { id: 1, noRef: "18001", tanggal: "10 Feb 2026", status: "Approved", pemohon: "Gilang",  email: "gilang@mail.com",   instansi: "BBWS Cimanuk",         pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Kontrak" },
    { id: 2, noRef: "18002", tanggal: "11 Feb 2026", status: "Pending",  pemohon: "Hendra",  email: "hendra@mail.com",   instansi: "Dinas PU Pusat",       pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Teknis" },
    { id: 3, noRef: "18003", tanggal: "12 Feb 2026", status: "Approved", pemohon: "Irma",    email: "irma@mail.com",     instansi: "Balai Jalan Nasional",pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Pembayaran" },
  ],
  agustus: [
    { id: 1, noRef: "AUG-001", tanggal: "01 Agt 2025", status: "Approved", pemohon: "Joko",   email: "joko@mail.com",    instansi: "Dinas PU Jabar",       pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Anggaran" },
    { id: 2, noRef: "AUG-002", tanggal: "05 Agt 2025", status: "Pending",  pemohon: "Kartini",email: "kartini@mail.com", instansi: "BBWS Citanduy",        pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Kontrak" },
    { id: 3, noRef: "AUG-003", tanggal: "12 Agt 2025", status: "Rejected", pemohon: "Lukman",email: "lukman@mail.com",  instansi: "Dinas Bina Marga",    pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Teknis" },
    { id: 4, noRef: "AUG-004", tanggal: "20 Agt 2025", status: "Approved", pemohon: "Maya",   email: "maya@mail.com",    instansi: "Dinas PU Pusat",       pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Pembayaran" },
  ],
  juli: [
    { id: 1, noRef: "JUL-001", tanggal: "03 Jul 2025", status: "Approved", pemohon: "Nanda",  email: "nanda@mail.com",   instansi: "Balai Wilayah Sungai", pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Kontrak" },
    { id: 2, noRef: "JUL-002", tanggal: "10 Jul 2025", status: "Pending",  pemohon: "Oscar",  email: "oscar@mail.com",   instansi: "Dinas Cipta Karya",   pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Anggaran" },
    { id: 3, noRef: "JUL-003", tanggal: "18 Jul 2025", status: "Approved", pemohon: "Putri",  email: "putri@mail.com",   instansi: "Dinas Bina Marga",    pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Teknis" },
  ],
  juni: [
    { id: 1, noRef: "JUN-001", tanggal: "02 Jun 2025", status: "Pending",  pemohon: "Rudi",   email: "rudi@mail.com",    instansi: "Dinas PU Pusat",       pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Pembayaran" },
    { id: 2, noRef: "JUN-002", tanggal: "09 Jun 2025", status: "Approved", pemohon: "Santi",  email: "santi@mail.com",   instansi: "Balai Jalan Nasional",pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Kontrak" },
  ],
  mei: [
    { id: 1, noRef: "MEI-001", tanggal: "05 Mei 2025", status: "Approved", pemohon: "Tono",   email: "tono@mail.com",    instansi: "BBWS Cimanuk",         pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Anggaran" },
    { id: 2, noRef: "MEI-002", tanggal: "15 Mei 2025", status: "Rejected", pemohon: "Umar",   email: "umar@mail.com",    instansi: "Dinas Cipta Karya",   pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Teknis" },
    { id: 3, noRef: "MEI-003", tanggal: "22 Mei 2025", status: "Pending",  pemohon: "Vera",   email: "vera@mail.com",    instansi: "Dinas Bina Marga",    pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Kontrak" },
  ],
  april: [
    { id: 1, noRef: "APR-001", tanggal: "04 Apr 2025", status: "Approved", pemohon: "Widi",   email: "widi@mail.com",    instansi: "Dinas PU Jabar",       pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Pembayaran" },
    { id: 2, noRef: "APR-002", tanggal: "14 Apr 2025", status: "Pending",  pemohon: "Xena",   email: "xena@mail.com",    instansi: "Balai Wilayah Sungai", pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Teknis" },
  ],
  maret: [
    { id: 1, noRef: "MRT-001", tanggal: "03 Mar 2025", status: "Approved", pemohon: "Yoga",   email: "yoga@mail.com",    instansi: "BBWS Citanduy",        pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Kontrak" },
    { id: 2, noRef: "MRT-002", tanggal: "10 Mar 2025", status: "Pending",  pemohon: "Zara",   email: "zara@mail.com",    instansi: "Dinas PU Pusat",       pengiriman: "Kurir Langsung",    sumber: "Upload Manual",   tipe: "Dokumen Anggaran" },
    { id: 3, noRef: "MRT-003", tanggal: "20 Mar 2025", status: "Rejected", pemohon: "Ahmad",  email: "ahmad.123@mail.com",instansi: "Dinas Bina Marga",    pengiriman: "Ekspedisi Internal", sumber: "Sistem Pengadaan", tipe: "Dokumen Teknis" },
  ],
};

export const HASIL_VERIFIKASI_DATA = SHEET_DATA.sheet1;
