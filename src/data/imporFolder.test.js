/* Uji pembacaan folder / berkas hasil drag & drop untuk impor data kegiatan. */

import { analisaDropKegiatan, gabungImporKeDaftar } from "./imporFolder";

function fileBerkas(name, content, type) {
  return new File([content], name, { type: type || "application/pdf" });
}

test("membaca realisasi dari nama berkas PDF SPM (folder + sub-folder)", async () => {
  const hasil = await analisaDropKegiatan(
    [fileBerkas("SPM 321_521211_280726_1369000.pdf", "%PDF-1.4")],
    { kode: "7769.AFA.001.100.A", nama: "Peny. Kurmod Pelatihan SDA" }
  );

  expect(hasil.kode).toBe("7769.AFA.001.100.A");
  expect(hasil.nama).toBe("Peny. Kurmod Pelatihan SDA");
  expect(hasil.perBulan["2026-07"]).toBe(1369000);
  expect(hasil.totalRealisasi).toBe(1369000);
  expect(hasil.jumlahPdf).toBe(1);
  expect(hasil.jumlahSpm).toBe(1);
  expect(hasil.bulanList).toEqual(["2026-07"]);
});

test("membaca realisasi dari berkas Excel/CSV yang di dalam folder", async () => {
  const csv = new File(
    ["bulan,realisasi\n2026-01,1000000\n2026-02,2500000\n"],
    "Rekap Realisasi.csv",
    { type: "text/csv" }
  );
  Object.defineProperty(csv, "text", {
    value: async () => "bulan,realisasi\n2026-01,1000000\n2026-02,2500000\n",
    configurable: true,
  });

  const hasil = await analisaDropKegiatan([csv], {
    kode: "7770.EBA.962.100.A",
    nama: "Tata Kelola Penyelenggaraan",
  });

  expect(hasil.perBulan["2026-01"]).toBe(1000000);
  expect(hasil.perBulan["2026-02"]).toBe(2500000);
  expect(hasil.totalRealisasi).toBe(3500000);
  expect(hasil.sumber).toMatch(/Excel/i);
});

test("gabungan impor tidak menggandakan bulan yang sama", () => {
  const imporLama = {
    kode: "7769.AFA.001.100.A",
    nama: "Peny. Kurmod Pelatihan SDA",
    perBulan: { "2026-07": 1369000 },
    berkas: [],
    lainnya: [],
  };
  const imporBaru = {
    kode: "7769.AFA.001.100.A",
    nama: "Peny. Kurmod Pelatihan SDA",
    perBulan: { "2026-07": 2000000 },
    berkas: [],
    lainnya: [],
  };

  const hasil = gabungImporKeDaftar([imporLama], imporBaru);
  expect(hasil).toHaveLength(1);
  expect(hasil[0].realisasiPerBulan["2026-07"]).toBe(2000000);
  expect(hasil[0].realisasi).toBe(2000000);
});
