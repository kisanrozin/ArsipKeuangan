import {
  nomorBulanDariTab,
  ambilTabSpreadsheet,
  ambilDaftarTab,
  segarkanDaftarTab,
} from "./daftarSheet";

test("nama tab rekap dipetakan ke nomor bulan batasnya", () => {
  expect(nomorBulanDariTab("Jan")).toBe(1);
  expect(nomorBulanDariTab("Jan-Feb")).toBe(2);
  expect(nomorBulanDariTab("Jan-Agst")).toBe(8);
  expect(nomorBulanDariTab("JAN SD AGUSTUS")).toBe(8);
  expect(nomorBulanDariTab("JAN SD SEPTEMBER")).toBe(9);
  expect(nomorBulanDariTab("JAN SD OKTOBER")).toBe(10);
  expect(nomorBulanDariTab("JAN SD DESEMBER")).toBe(12);
  // Tahun ikut dibuang: "SEPT2026" tetap September.
  expect(nomorBulanDariTab("SEPT2026")).toBe(9);
  // Tab tanpa nama bulan tidak dipetakan.
  expect(nomorBulanDariTab("Sheet1")).toBeNull();
  expect(nomorBulanDariTab("LAPORAN REALISASI SP2D TA 2026")).toBeNull();
  expect(nomorBulanDariTab("")).toBeNull();
  expect(nomorBulanDariTab(null)).toBeNull();
});

/* HTML mini meniru struktur halaman /edit: nama tab dari caption, gid dari
   metadata [21350203,"[<idx>,0,\"<gid>\",[{\"1\":[[0,0,\"<NAMA>\"],… */
function htmlSpreadsheetUji() {
  const meta = (i, gid, nama) =>
    `[21350203,"[${i},0,\\"${gid}\\",[{\\"1\\":[[0,0,\\"${nama}\\"],[{\\"1\\":6`;
  return [
    '<div class="docs-sheet-tab-caption">Sheet1</div>',
    '<div class="docs-sheet-tab-caption">Sheet2</div>',
    '<div class="docs-sheet-tab-caption">JAN SD SEPTEMBER</div>',
    '<div class="docs-sheet-tab-caption">JAN SD OKTOBER</div>',
    meta(0, "111", "Sheet1"),
    meta(1, "222", "Sheet2"),
    meta(2, "333", "JAN SD SEPTEMBER"),
    meta(3, "444", "JAN SD OKTOBER"),
  ].join("");
}

test("ambilTabSpreadsheet membaca nama, gid, dan urutan tiap tab", async () => {
  const sheetId = "uji-tab-daftarsheet";
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, text: () => Promise.resolve(htmlSpreadsheetUji()) })
  );

  const tabs = await ambilTabSpreadsheet(sheetId, true);
  expect(tabs.map((t) => t.nama)).toEqual([
    "Sheet1",
    "Sheet2",
    "JAN SD SEPTEMBER",
    "JAN SD OKTOBER",
  ]);
  expect(tabs.map((t) => t.gid)).toEqual(["111", "222", "333", "444"]);
  expect(tabs.map((t) => t.urutan)).toEqual([0, 1, 2, 3]);

  // ambilDaftarTab tetap mengembalikan daftar NAMA saja (dipakai pemetaan bulan).
  const nama = await ambilDaftarTab(sheetId, true);
  expect(nama).toEqual(["Sheet1", "Sheet2", "JAN SD SEPTEMBER", "JAN SD OKTOBER"]);

  segarkanDaftarTab(sheetId);
});
