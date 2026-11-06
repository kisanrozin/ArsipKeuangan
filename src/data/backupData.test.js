/* Uji keamanan data: cadangan otomatis, pemulihan data rusak, dan
   larangan menimpa seluruh data dengan daftar kosong. */

import {
  ambilDataLokal,
  bacaBerkasCadangan,
  bacaRiwayatCadangan,
  buatCadangan,
  pulihkanCadangan,
  teksCadangan,
} from "./backupData";
import {
  bacaKegiatanTambahan,
  tulisKegiatanTambahan,
} from "./KegiatanTambahan";

const KUNCI = "pu_data_kegiatan_tambahan";

beforeEach(() => {
  localStorage.clear();
});

test("cadangan dibuat sebelum data diubah", () => {
  tulisKegiatanTambahan([{ kode: "7769.AFA", nama: "Kegiatan A" }]);
  tulisKegiatanTambahan([
    { kode: "7769.AFA", nama: "Kegiatan A" },
    { kode: "7770.EBA", nama: "Kegiatan B" },
  ]);

  const riwayat = bacaRiwayatCadangan();
  expect(riwayat.length).toBeGreaterThan(0);
  const isiCadangan = JSON.parse(
    riwayat[0].data[KUNCI]
  );
  expect(isiCadangan).toHaveLength(1);
});

test("penulisan daftar kosong ditolak bila masih ada data", () => {
  tulisKegiatanTambahan([{ kode: "7769.AFA", nama: "Kegiatan A" }]);

  const berhasil = tulisKegiatanTambahan([]);
  expect(berhasil).toBe(false);
  expect(bacaKegiatanTambahan()).toHaveLength(1);

  // Bila memang disengaja (mis. admin mengonfirmasi hapus), boleh kosong.
  expect(tulisKegiatanTambahan([], { izinkanKosong: true })).toBe(true);
  expect(bacaKegiatanTambahan()).toHaveLength(0);
});

test("data rusak dipulihkan otomatis dari salinan terakhir", () => {
  tulisKegiatanTambahan([
    { kode: "7769.AFA", nama: "Kegiatan A" },
    { kode: "7770.EBA", nama: "Kegiatan B" },
  ]);

  // Simulasikan data utama terpotong saat browser ditutup.
  localStorage.setItem(KUNCI, '[{"kode":"7769.AFA"');

  const data = bacaKegiatanTambahan();
  expect(data).toHaveLength(2);
  expect(data[1].kode).toBe("7770.EBA");
});

test("berkas cadangan bisa diunduh, dibaca ulang, dan dipulihkan", () => {
  tulisKegiatanTambahan([{ kode: "7769.AFA", nama: "Kegiatan A" }]);

  const teks = teksCadangan();
  expect(teks).toMatch(/arsip-keuangan-pu/);

  // Hapus data, lalu pulihkan dari isi berkas.
  localStorage.removeItem(KUNCI);
  expect(ambilDataLokal()[KUNCI]).toBeUndefined();

  const baca = bacaBerkasCadangan(teks);
  expect(baca.ok).toBe(true);

  const hasil = pulihkanCadangan(baca.cadangan);
  expect(hasil.ok).toBe(true);
  expect(bacaKegiatanTambahan()[0].kode).toBe("7769.AFA");
});

test("berkas cadangan yang rusak ditolak sebelum menimpa data", () => {
  const hasil = bacaBerkasCadangan("{bukan json");
  expect(hasil.ok).toBe(false);
  expect(hasil.pesan).toMatch(/JSON/i);
});

test("cadangan tidak menyertakan token Google", () => {
  localStorage.setItem("pu_arsip_drive_token", "rahasia");
  localStorage.setItem("pu_data_kegiatan_tambahan", "[]");

  buatCadangan({ alasan: "manual" });
  expect(JSON.stringify(ambilDataLokal())).not.toMatch(/rahasia/);
});
