/* Uji rekap realisasi per bulan dari data tambahan / impor folder. */

import { rekapRealisasiTambahan } from "./KegiatanTambahan";

test("mengumpulkan realisasi per bulan dari data impor folder", () => {
  const perBulan = rekapRealisasiTambahan([
    {
      kode: "7769.AFA.001.100.A",
      realisasiPerBulan: { "2026-01": 1000000, "2026-02": 2500000 },
    },
    {
      kode: "7770.EBA.962.100.A",
      realisasi: 500000,
      tanggal: "2026-03-15",
    },
  ]);

  expect(perBulan["2026-01"]).toBe(1000000);
  expect(perBulan["2026-02"]).toBe(2500000);
  expect(perBulan["2026-03"]).toBe(500000);
});

test("data tanpa per bulan hanya dihitung dari tanggal baris", () => {
  const perBulan = rekapRealisasiTambahan([
    { realisasi: 750000, tanggal: "2026-05-20" },
  ]);
  expect(perBulan["2026-05"]).toBe(750000);
});
