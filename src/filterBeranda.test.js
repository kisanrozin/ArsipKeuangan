/* Uji sinkronisasi filter periode beranda ("Realisasi Data Per Bulan")
   ke halaman Data Kegiatan dan History Revisi DIPA. */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

test("filter tahun & bulan beranda ikut ke Data Kegiatan dan Histori", async () => {
  sessionStorage.setItem("pu_peran_tampilan", "admin");
  const { container } = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: /Masuk ke Dashboard/i }));

  await waitFor(() => {
    expect(screen.getByText(/Realisasi Data Per Bulan/i)).toBeInTheDocument();
  });

  // Pilih periode di beranda.
  fireEvent.change(screen.getByLabelText(/Filter Tahun/i), {
    target: { value: "2025" },
  });
  fireEvent.change(screen.getByLabelText(/Filter Bulan/i), {
    target: { value: "maret" },
  });

  // Data Kegiatan memakai rentang kumulatif Januari s.d. bulan terpilih,
  // sama seperti angka realisasi di beranda.
  fireEvent.click(screen.getByText("DATA KEGIATAN"));
  await waitFor(() => {
    const bulanInput = container.querySelectorAll('input[type="month"]');
    expect(bulanInput.length).toBeGreaterThan(0);
    expect(bulanInput[0].value).toBe("2025-01");
    expect(bulanInput[1].value).toBe("2025-03");
  });

  // History Revisi DIPA mengikuti tahunnya (halaman ini tanpa filter bulan).
  fireEvent.click(screen.getByText("HISTORY REVISI DIPA"));
  await waitFor(() => {
    expect(container.querySelector("#hrd-filter-tahun").value).toBe("2025");
  });

  // Kembali ke beranda: filter yang dipilih tetap tampil (tidak reset
  // ke bulan/tahun berjalan saat halaman di-mount ulang).
  fireEvent.click(screen.getByText("BERANDA"));
  await waitFor(() => {
    expect(screen.getByLabelText(/Filter Tahun/i).value).toBe("2025");
    expect(screen.getByLabelText(/Filter Bulan/i).value).toBe("maret");
  });
});
