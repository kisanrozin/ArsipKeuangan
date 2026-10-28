/* ══════════════════════════════════════════════════════════════
   DAFTAR TAB SPREADSHEET — DIBACA OTOMATIS DARI GOOGLE SHEETS
   ------------------------------------------------------------
   Kenapa modul ini perlu ada:
     · Nama tab rekap kumulatif ("JAN SD AGUSTUS", "Jan-Agst", …)
       bertambah terus setiap bulan di spreadsheet Drive.
     · GVIZ TIDAK memberi error bila nama tab tidak ada — ia diam-
       diam mengembalikan TAB PERTAMA spreadsheet. Akibatnya aplikasi
       bisa menampilkan angka tab yang salah (atau angka yang sama
       untuk semua bulan) sehingga terlihat "tidak sesuai data Drive".
     · Solusinya: nama tab selalu diambil dari daftar tab ASLI
       spreadsheet, jadi tidak mungkin salah tab. Bulan yang tabnya
       belum ada di Drive tidak pernah dibaca → angkanya kosong.

   CARA BACA:
     Halaman /edit memuat nama tab pada
     <div class="…docs-sheet-tab-caption">NAMA</div>.
     Endpoint ini mengizinkan CORS (sama seperti GVIZ), jadi bisa
     dipanggil langsung dari browser tanpa login.

   PEMETAAN KE BULAN:
     Tab rekap bersifat kumulatif Jan → … → Des, jadi bulan yang
     disebut paling akhir pada nama tab adalah bulan BATASNYA:
       "Jan"              → Januari
       "Jan-Feb"          → Februari
       "Jan-Agst"         → Agustus
       "JAN SD SEPTEMBER" → September
     Tab tanpa nama bulan ("Sheet1", "LAPORAN REALISASI …") tidak
     dipetakan sama sekali.                                         */

const TTL_MS = 300_000; // 5 menit — daftar tab jarang berubah
const cache = new Map(); // sheetId → { waktu, tabs: [{ nama, gid, urutan }] }
const sedang = new Map(); // sheetId → Promise

/* Alias nama bulan → nomor 1…12 (huruf besar, tanpa angka). */
const ALIAS_BULAN = {
  1: ["JAN", "JANUARI", "JANUARY", "JANVAR"],
  2: ["FEB", "FEBRUARI", "FEBRUARY", "PEB"],
  3: ["MRT", "MARET", "MAR", "MARCH", "MAC"],
  4: ["APR", "APRIL", "APRILIS"],
  5: ["MEI", "MAY"],
  6: ["JUN", "JUNI", "JUNE", "JUNIE"],
  7: ["JUL", "JULI", "JULY", "JULIE"],
  8: ["AGUSTUS", "AGSTUS", "AGST", "AGS", "AGU"],
  9: ["SEPTEMBER", "SEPTEMBRE", "SEPT", "SEP"],
  10: ["OKTOBER", "OKT", "OCTOBER", "OCT"],
  11: ["NOVEMBER", "NOPEMBER", "NOV", "NOP"],
  12: ["DESEMBER", "DESEMBRE", "DES", "DEC", "DECEMBER"],
};

/* Alias → nomor bulan, dibuat otomatis dari ALIAS_BULAN.
   ALIAS_BULAN adalah OBJECT { 1: [...alias], 2: [...] }, jadi harus
   dilewati lewat Object.entries — bukan .reduce langsung (object tidak
   punya .reduce, dan pemanggilannya membuat seluruh modul gagal dimuat). */
const PETA_ALIAS = Object.entries(ALIAS_BULAN).reduce((peta, [nomor, daftar]) => {
  (daftar || []).forEach((alias) => {
    if (!peta[alias]) peta[alias] = Number(nomor);
  });
  return peta;
}, {});

const POLA_TAB = /docs-sheet-tab-caption[^>]*>([^<]*)</g;

function decodeHtml(teks) {
  return String(teks || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* Metadata tab pada HTML /edit memuat pasangan [indeks, gid, NAMA TAB],
   contoh mentah: [21350203,"[2,0,\"1226516203\",[{\"1\":[[0,0,\"JAN SD
   SEPTEMBER\"],…  → gid "1226516203" untuk tab "JAN SD SEPTEMBER".
   Dipakai untuk mengetahui gid tiap tab (butuh gid untuk embed/GVIZ). */
const PENANDA_META = '[21350203,"[';
const TANDA_QUOTE = String.fromCharCode(92) + '"'; // rangkaian \" di HTML

function petaGidDariHtml(html) {
  const peta = new Map(); // nama tab → gid
  html.split(PENANDA_META).slice(1).forEach((bagian) => {
    const segmen = bagian.slice(0, 260).split(TANDA_QUOTE);
    // segmen → [ "<idx>,0,", "<gid>", ",[{", "1", ":[[0,0,", "<NAMA>" , … ]
    const gid = Number(segmen[1]) ? segmen[1] : null;
    const nama = decodeHtml(segmen[5]).trim();
    if (gid && nama && !peta.has(nama)) peta.set(nama, gid);
  });
  return peta;
}

/* Nama tab → nomor bulan batasnya (1…12), atau null bila tab itu
   bukan tab rekap bulanan ("Sheet1", "LAPORAN REALISASI …"). */
export function nomorBulanDariTab(namaTab) {
  const potongan = String(namaTab || "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  let nomor = 0;
  potongan.forEach((kata) => {
    // "SEPT2026" → "SEPT", "AGST2026" → "AGST".
    const bersih = kata.replace(/[^A-Z]/g, "");
    if (!bersih) return;
    const n = PETA_ALIAS[bersih];
    if (n && n > nomor) nomor = n;
  });
  return nomor || null;
}

/* Daftar tab asli spreadsheet lengkap (nama + gid + urutan), atau null
   bila tidak bisa dibaca. Urutan mengikuti urutan tab di spreadsheet. */
export async function ambilTabSpreadsheet(sheetId, paksa = false) {
  if (!sheetId) return null;
  const tersimpan = cache.get(sheetId);
  if (!paksa && tersimpan && Date.now() - tersimpan.waktu < TTL_MS) {
    return tersimpan.tabs;
  }
  if (sedang.has(sheetId)) return sedang.get(sheetId);

  const kerja = (async () => {
    try {
      const res = await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Nama tab (urutan tampil) dari caption; gid dari metadata.
      const namaTab = [];
      POLA_TAB.lastIndex = 0;
      let cocok;
      while ((cocok = POLA_TAB.exec(html)) !== null) {
        const nama = decodeHtml(cocok[1]).trim();
        if (nama && !namaTab.includes(nama)) namaTab.push(nama);
      }
      if (!namaTab.length) throw new Error("Nama tab tidak ditemukan di HTML");

      const petaGid = petaGidDariHtml(html);
      const tabs = namaTab.map((nama, i) => ({
        nama,
        gid: petaGid.get(nama) || null,
        urutan: i,
      }));
      cache.set(sheetId, { waktu: Date.now(), tabs });
      return tabs;
    } catch (e) {
      console.warn("Gagal membaca daftar tab spreadsheet:", e);
      // Cache lama tetap dipakai; tidak dikunci supaya dibaca ulang
      // pada siklus berikutnya.
      return tersimpan ? tersimpan.tabs : null;
    } finally {
      sedang.delete(sheetId);
    }
  })();

  sedang.set(sheetId, kerja);
  return kerja;
}

/* Daftar NAMA tab asli spreadsheet, atau null bila tidak bisa dibaca.
   (Nama saja — dipakai pemetaan bulan rekap di modul lain.) */
export async function ambilDaftarTab(sheetId, paksa = false) {
  const tabs = await ambilTabSpreadsheet(sheetId, paksa);
  return tabs ? tabs.map((t) => t.nama) : null;
}

/* { 1: "Jan", 2: "Jan-Feb", … } — bulan → nama tab rekap.
   Bulan yang tabnya belum ada di spreadsheet TIDAK ikutDipetakan,
   sehingga angkanya kosong (bukan diisi tab lain). */
export async function petaTabRekap(sheetId, paksa = false) {
  const tabs = await ambilDaftarTab(sheetId, paksa);
  const peta = {};
  (tabs || []).forEach((nama) => {
    const nomor = nomorBulanDariTab(nama);
    if (nomor) peta[nomor] = nama;
  });
  return peta;
}

/* Tab rekap paling baru (bulan terbesar), atau null. */
export async function tabRekapTerbaru(sheetId, paksa = false) {
  const peta = await petaTabRekap(sheetId, paksa);
  const nomor = Object.keys(peta)
    .map(Number)
    .sort((a, b) => b - a)[0];
  return nomor ? { bulan: nomor, nama: peta[nomor] } : null;
}

/* Paksa baca ulang daftar tab (mis. setelah spreadsheet diubah). */
export function segarkanDaftarTab(sheetId) {
  if (sheetId) cache.delete(sheetId);
}
