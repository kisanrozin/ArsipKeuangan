/* ══════════════════════════════════════════════════════════════
   PARSER NAMA FOLDER KEGIATAN
   ------------------------------------------------------------
   Dipakai bersama oleh halaman Data Kegiatan dan fitur impor
   folder (drag & drop), supaya kode kegiatan dari nama folder
   selalu dibaca dengan aturan yang sama.

   Contoh nama folder:
     "7769.AFA.001.100.A.Peny. Kurmod Pelatihan SDA (...)"  → kode + nama
     "7770.EBA.962.100.A Tata Kelola Penyelenggaraan Kegiatan" → kode + nama
   Kode selalu berupa rangkaian segmen: 7769 . EAF . 001 . 100 . A
   ══════════════════════════════════════════════════════════════ */

const SEGMENT_KODE = /^(?:\d{4}|\d{3}[A-Z]?|[A-Z]\d{2}|\d{1,3}|[A-Z]{1,3})$/;

export function parseNamaFolder(namaFolder) {
  const segments = String(namaFolder || "").split(".");
  const kodeParts = [];
  let i = 0;
  for (; i < segments.length; i += 1) {
    const seg = segments[i];
    if (SEGMENT_KODE.test(seg)) {
      kodeParts.push(seg);
      continue;
    }
    // Segmen berisi spasi → bagian awal bisa jadi kode terakhir, sisanya nama.
    const spasi = seg.match(/^([A-Za-z0-9]{1,4})\s+(.*)$/);
    if (spasi && SEGMENT_KODE.test(spasi[1].toUpperCase())) {
      kodeParts.push(spasi[1].toUpperCase());
      return { kode: kodeParts.join("."), nama: spasi[2].trim() };
    }
    break;
  }
  return {
    kode: kodeParts.join("."),
    nama: segments
      .slice(i)
      .join(".")
      .replace(/^[\s.-]+/, "")
      .trim(),
  };
}

/* Kode rekening dari nama sub-folder, mis. "521211" atau
   "521211 - Belanja Bahan" → "521211". Nama lain → "". */
export function kodeRekeningDariNama(nama) {
  const cocok = String(nama || "").trim().match(/^(\d{6})\b/);
  return cocok ? cocok[1] : "";
}
