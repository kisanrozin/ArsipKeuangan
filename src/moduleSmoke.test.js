/* Uji asap: pastikan SEMUA modul aplikasi bisa diimpor tanpa error.
   Error di tingkat modul (mis. "X.reduce is not a function") membuat
   seluruh aplikasi gagal render, jadi modul per data wajib bersih. */

jest.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => Promise.resolve({ promise: Promise.resolve({}) }),
  version: "test",
}));

const daftarModul = [
  "./components/Dashboard",
  "./components/DataKegiatan",
  "./components/JenisDokumen",
  "./components/HistoriRevisiDipa",
  "./components/ProsesBisnis",
  "./components/TamuRingkasan",
  "./components/StatistikOperasional",
  "./components/DriveSection",
  "./components/Navbar",
  "./components/Sidebar",
  "./components/SplashScreen",
  "./context/PeranContext",
  "./data/masterData",
  "./data/daftarSheet",
  "./data/rekapKegiatan",
  "./data/rekapSpm",
  "./data/rekapDipa",
  "./data/sp2dLive",
  "./data/paguPdf",
  "./data/kegiatanTambahan",
  "./data/cacheKegiatan",
];

test("semua modul aplikasi dapat diimpor tanpa error", () => {
  daftarModul.forEach((nama) => {
    const mod = require(nama);
    expect(mod).toBeDefined();
  });
});
