import React from "react";
import {
  bacaBerkasCadangan,
  buatCadangan,
  pulihkanCadangan,
  ringkasanCadangan,
  unduhCadangan,
} from "../data/backupData";

/* ══════════════════════════════════════════════════════════════
   PANEL CADANGAN DATA (ADMIN)
   ------------------------------------------------------------
   Tombol ini membuka panel untuk:
     • membuat cadangan manual;
     • mengunduh cadangan .json (simpan di luar browser);
     • memulihkan dari berkas .json;
     • memulihkan dari riwayat cadangan otomatis.

   Cadangan otomatis dibuat setiap kali data kegiatan diubah dan
   sekali sehari saat aplikasi dibuka. Riwayatnya tetap berada di
   browser ini, jadi tetap unduh berkas .json secara berkala.
   ══════════════════════════════════════════════════════════════ */

const LABEL_ALASAN = {
  manual: "Dibuat manual",
  otomatis: "Sebelum data diubah",
  harian: "Cadangan harian",
  "sebelum-pulih": "Sebelum pemulihan",
  "sebelum-hapus": "Sebelum menghapus data",
  impor: "Dari berkas impor",
};

function formatWaktu(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return d.toLocaleString();
  }
}

function formatByte(n) {
  const nilai = Number(n) || 0;
  if (nilai < 1024) return `${nilai} B`;
  if (nilai < 1024 * 1024) return `${(nilai / 1024).toFixed(1)} KB`;
  return `${(nilai / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CadanganData() {
  const [buka, setBuka] = React.useState(false);
  const [ringkas, setRingkas] = React.useState(null);
  const [pesan, setPesan] = React.useState(null);
  const [pratinjau, setPratinjau] = React.useState(null);
  const [sibuk, setSibuk] = React.useState(false);
  const fileRef = React.useRef(null);

  const muat = React.useCallback(() => {
    setRingkas(ringkasanCadangan());
  }, []);

  React.useEffect(() => {
    if (buka) muat();
  }, [buka, muat]);

  React.useEffect(() => {
    if (!buka) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setBuka(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [buka]);

  const buatSekarang = () => {
    const hasil = buatCadangan({ alasan: "manual" });
    setPesan({
      jenis: hasil.ok ? "sukses" : "galat",
      teks: hasil.pesan,
    });
    muat();
  };

  const unduh = () => {
    try {
      const hasil = unduhCadangan();
      setPesan({
        jenis: "sukses",
        teks: `Berkas cadangan "${hasil.namaBerkas}" diunduh. Simpan di tempat aman (komputer/Drive).`,
      });
    } catch (e) {
      setPesan({
        jenis: "galat",
        teks: `Gagal membuat berkas cadangan: ${(e && e.message) || e}`,
      });
    }
  };

  const pilihBerkas = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setPesan(null);
    setPratinjau(null);
    try {
      const teks = await file.text();
      const hasil = bacaBerkasCadangan(teks);
      if (!hasil.ok) {
        setPesan({ jenis: "galat", teks: hasil.pesan });
      } else {
        setPratinjau(hasil.cadangan);
      }
    } catch (err) {
      setPesan({
        jenis: "galat",
        teks: `Gagal membaca berkas: ${(err && err.message) || err}`,
      });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const lakukanPulihkan = (cadangan, label) => {
    const setuju = window.confirm(
      `Pulihkan ${label}?\n\n` +
        "Data yang ada sekarang akan dicadangkan terlebih dahulu, " +
        "lalu data yang ada di cadangan ditulis kembali ke aplikasi. " +
        "Setelah dipulihkan, muat ulang halaman agar semua bagian ikut diperbarui."
    );
    if (!setuju) return;

    setSibuk(true);
    const hasil = pulihkanCadangan(cadangan);
    setSibuk(false);
    setPratinjau(null);
    setPesan({
      jenis: hasil.ok ? "sukses" : "galat",
      teks: hasil.ok
        ? `${hasil.pesan} Muat ulang halaman agar perubahan terlihat di semua bagian.`
        : hasil.pesan,
    });
    muat();
  };

  const daftar = (ringkas && ringkas.riwayat) || [];
  const terakhir = ringkas && ringkas.terakhir;

  return (
    <>
      <button
        type="button"
        className="dk-btn dk-btn-cadangan"
        onClick={() => {
          setPesan(null);
          setPratinjau(null);
          setBuka(true);
        }}
        title="Cadangkan, unduh, atau pulihkan data aplikasi"
      >
        🛡 Cadangan Data
      </button>

      {buka && (
        <div className="modal-overlay" onClick={() => !sibuk && setBuka(false)}>
          <div
            className="modal-box cadangan-box"
            role="dialog"
            aria-modal="true"
            aria-label="Cadangan Data"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h4>🛡 Cadangan &amp; Pemulihan Data</h4>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !sibuk && setBuka(false)}
                aria-label="Tutup"
                disabled={sibuk}
              >
                ✕
              </button>
            </div>

            <div className="modal-body cadangan-body">
              <p className="cadangan-penjelasan">
                Data input admin disimpan di browser ini. Cadangan otomatis
                dibuat setiap kali data diubah dan sekali sehari. Agar aman
                bila browser dibersihkan atau komputer rusak,{" "}
                <strong>unduh berkas cadangan</strong> dan simpan di tempat
                lain.
              </p>

              <div className="cadangan-status">
                <div>
                  <span className="cadangan-label">Data saat ini</span>
                  <strong>{ringkas ? `${ringkas.dataSekarang.kegiatan} kegiatan` : "—"}</strong>
                </div>
                <div>
                  <span className="cadangan-label">Cadangan tersimpan</span>
                  <strong>{ringkas ? `${ringkas.jumlahCadangan} titik` : "—"}</strong>
                </div>
                <div>
                  <span className="cadangan-label">Cadangan terakhir</span>
                  <strong>{terakhir ? formatWaktu(terakhir.dibuat) : "Belum ada"}</strong>
                </div>
                <div>
                  <span className="cadangan-label">Ukuran riwayat</span>
                  <strong>{ringkas ? formatByte(ringkas.ukuranRiwayat) : "—"}</strong>
                </div>
              </div>

              <div className="cadangan-aksi">
                <button type="button" className="dk-btn dk-btn-add" onClick={buatSekarang}>
                  Buat Cadangan Sekarang
                </button>
                <button type="button" className="dk-btn dk-btn-filter" onClick={unduh}>
                  ⬇ Unduh Cadangan (.json)
                </button>
                <button
                  type="button"
                  className="dk-btn dk-btn-tree"
                  onClick={() => fileRef.current && fileRef.current.click()}
                >
                  ⬆ Pulihkan dari Berkas
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  style={{ display: "none" }}
                  onChange={pilihBerkas}
                />
              </div>

              {pesan && (
                <div
                  className={`cadangan-pesan cadangan-pesan-${
                    pesan.jenis === "galat" ? "galat" : "sukses"
                  }`}
                  role="alert"
                >
                  {pesan.teks}
                </div>
              )}

              {pratinjau && (
                <div className="cadangan-pratinjau">
                  <strong>Berkas siap dipulihkan</strong>
                  <p>
                    Dibuat: {formatWaktu(pratinjau.dibuat)} ·{" "}
                    {pratinjau.ringkas ? pratinjau.ringkas.kegiatan : 0} kegiatan ·{" "}
                    {Object.keys(pratinjau.data || {}).length} jenis data
                  </p>
                  <div className="cadangan-aksi">
                    <button
                      type="button"
                      className="dk-btn dk-btn-filter"
                      disabled={sibuk}
                      onClick={() => lakukanPulihkan(pratinjau, "berkas cadangan ini")}
                    >
                      Pulihkan Sekarang
                    </button>
                    <button
                      type="button"
                      className="dk-btn dk-btn-tree"
                      disabled={sibuk}
                      onClick={() => setPratinjau(null)}
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              <h5 className="cadangan-subjudul">Riwayat Cadangan</h5>
              {daftar.length === 0 ? (
                <p className="cadangan-kosong">
                  Belum ada cadangan. Buat cadangan sekarang, lalu unduh
                  berkasnya agar data aman di luar browser.
                </p>
              ) : (
                <ul className="cadangan-daftar">
                  {daftar.map((c) => (
                    <li key={c.id || c.dibuat}>
                      <div className="cadangan-item-info">
                        <strong>{formatWaktu(c.dibuat)}</strong>
                        <span>
                          {LABEL_ALASAN[c.alasan] || c.alasan || "Cadangan"} ·{" "}
                          {c.ringkas ? c.ringkas.kegiatan : 0} kegiatan ·{" "}
                          {formatByte(
                            JSON.stringify(c.data || {}).length
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="dk-btn dk-btn-clear cadangan-btn-pulih"
                        disabled={sibuk}
                        onClick={() =>
                          lakukanPulihkan(
                            c,
                            `cadangan ${formatWaktu(c.dibuat)}`
                          )
                        }
                      >
                        Pulihkan
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setBuka(false)}
                disabled={sibuk}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn-submit"
                onClick={() => window.location.reload()}
                disabled={sibuk}
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
