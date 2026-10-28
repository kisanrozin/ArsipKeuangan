/* Uji "Tambah Data" Data Kegiatan: impor folder/berkas memakai drag & drop
   (tanpa file picker) dan hanya tersedia untuk admin. */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../App";

async function masukSebagai(peran) {
  sessionStorage.setItem("pu_peran_tampilan", peran);
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Masuk ke Dashboard/i }));
}

test("admin menambah bukti PDF / folder dengan drag & drop, tanpa file picker", async () => {
  await masukSebagai("admin");

  fireEvent.click(await screen.findByText("DATA KEGIATAN"));
  fireEvent.click(await screen.findByRole("button", { name: /\+ Tambah Data/i }));

  const area = await screen.findByRole("region", {
    name: /Area tarik dan lepas berkas atau folder/i,
  });
  // Kotak Pagu & Realisasi sudah dihapus dari form tambah data.
  expect(screen.queryByText("Pagu (Rp)")).toBeNull();
  expect(screen.queryByText("Realisasi (Rp)")).toBeNull();
  // Tidak ada lagi pemilih berkas biasa.
  expect(document.querySelector('input[type="file"]')).toBeNull();

  // Tarik & lepas berkas SPM → nama berkas, jumlah, & realisasi tampil.
  const pdf = new File(["%PDF-1.4"], "SPM 321_521211_280726_1369000.pdf", {
    type: "application/pdf",
  });
  fireEvent.drop(area, { dataTransfer: { files: [pdf] } });
  await waitFor(() => {
    expect(screen.getByText("SPM 321_521211_280726_1369000.pdf")).toBeInTheDocument();
  });
  expect(screen.getAllByText(/Realisasi:/).length).toBeGreaterThan(0);
});

test("tamu tidak melihat tombol Tambah Data", async () => {
  await masukSebagai("tamu");
  fireEvent.click(await screen.findByText("DATA KEGIATAN"));
  await waitFor(() => {
    expect(screen.queryByRole("button", { name: /\+ Tambah Data/i })).toBeNull();
  });
});
