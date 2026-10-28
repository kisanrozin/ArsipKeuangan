/* Uji pencarian Data Kegiatan: kode lengkap (Kode Kegiatan + Kode Akun
   Belanja) harus tetap ditemukan walau ditulis dengan/tanpa titik. */

import { cocokCari } from "./DataKegiatan";

const KODE_KEGIATAN = "7769.AFA.001.100.A";
const KODE_LENGKAP = "7769.AFA.001.100.A.521211";

test("kode lengkap persis cocok", () => {
  expect(cocokCari(KODE_LENGKAP, KODE_LENGKAP)).toBe(true);
});

test("kode lengkap tanpa titik/spasi tetap cocok", () => {
  expect(cocokCari("7769afa001100a521211", KODE_LENGKAP)).toBe(true);
  expect(cocokCari("7769 afa 001 100 a 521211", KODE_LENGKAP)).toBe(true);
});

test("urutan kata bebas", () => {
  expect(cocokCari("afa 7769", KODE_KEGIATAN)).toBe(true);
});

test("kode kegiatan saja cocok, tanpa akun tidak", () => {
  expect(cocokCari("7769.AFA", KODE_KEGIATAN)).toBe(true);
  expect(cocokCari(KODE_LENGKAP, KODE_KEGIATAN)).toBe(false);
});

test("pencarian lewat nama akun belanja", () => {
  expect(cocokCari("belanja bahan", "521211", "Belanja Bahan")).toBe(true);
});

test("kode lengkap + kode akun/uraian (seperti gabungan di tabel) cocok", () => {
  const haystack = [KODE_KEGIATAN, "521211", "Belanja Bahan", KODE_LENGKAP];
  expect(cocokCari(KODE_LENGKAP, ...haystack)).toBe(true);
});
