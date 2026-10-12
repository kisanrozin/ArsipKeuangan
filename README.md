# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Dua Mode Tampilan: Tamu (Viewer) & Admin

Aplikasi dibuka dalam mode **Tamu** (baca-saja). Untuk masuk ke layar admin, klik
ikon user (👤) di kanan atas navbar — untuk saat ini tanpa login, sesuai
kebutuhan; statusnya disimpan di `sessionStorage` (`pu_peran_tampilan`).

| Mode | Isi | Kontrol input |
| --- | --- | --- |
| **Tamu** | `src/components/TamuRingkasan.js` — blok statistik yang sama dengan beranda admin, rekap per bulan, tabel kegiatan | Tidak ada (tambah/ubah/hapus/unggah disembunyikan) |
| **Admin** | `Dashboard`, `Data Kegiatan`, `History Revisi DIPA` (tampilan yang sudah ada sebelumnya) | Tombol `+ Tambah Data`, ubah, hapus, dan upload aktif |

### Blok yang dipakai bersama

`src/components/StatistikOperasional.js` berisi blok **"Ringkasan Statistik
Operasional"** yang identik di kedua tampilan — kartu *Total Pagu / Total
Realisasi SPM / Persentase*, bagian **"Realisasi Data Per Bulan"** beserta filter
tahun–bulan, dan tabel **"Pagu & Realisasi (Bulan) (Tahun)"** (kolom Pagu Bulan,
Pagu DIPA Revisi, Realisasi, Persentase, SPM, Berkas Drive).

Props `readOnly` yang membedakan keduanya: pada mode tamu tombol "Sinkronkan
Sekarang" dan kartu yang bisa diklik disembunyikan, plus badge "Mode Tamu · baca
saja". Sumber data keduanya — `src/data/sp2dLive.js` (SP2D Sheet + Google
Drive) dan `src/data/rekapKegiatan.js` / `rekapSpm.js` / `rekapDipa.js` — dibaca
sekali lewat toko data bersama, sehingga angkanya dijamin sama persis.

Data lain yang dilihat tamu: baris yang sudah diinput admin lewat `+ Tambah
Data` (`src/data/KegiatanTambahan.js` → `localStorage`), digabung dengan daftar
kode kegiatan referensi.

Kode peran: `src/context/PeranContext.js`. Halaman yang hanya boleh dibuka admin
(dashboard, history revisi DIPA) otomatis dialihkan kembali ke halaman tamu bila
peran diturunkan.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
