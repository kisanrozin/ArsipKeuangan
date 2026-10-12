import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

test('layar sambutan tampil dulu, lalu tombol masuk membuka aplikasi', async () => {
  render(<App />);

  // 1. Sebelum masuk, yang tampil adalah layar sambutan (splash).
  expect(
    screen.getByText(/Selamat Datang di Realisasi/i)
  ).toBeInTheDocument();

  // 2. Tekan "Masuk ke Dashboard" → splash ditutup.
  fireEvent.click(
    screen.getByRole('button', { name: /Masuk ke Dashboard/i })
  );

  // 3. Aplikasi terbuka (mode tamu, menampilkan ringkasan DIARKES).
  await waitFor(() => {
    expect(screen.getAllByText(/DIARKES/i).length).toBeGreaterThan(0);
  });
});