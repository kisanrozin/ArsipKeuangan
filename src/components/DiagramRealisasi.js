import React from "react";

/* ══════════════════════════════════════════════════════════════
   DIAGRAM REALISASI (lingkaran)
   ------------------------------------------------------------
   Dua tampilan dari angka yang sama (pagu & realisasi bulan):

     1. DiagramRealisasi — diagram lingkaran penuh (pie) di bawah
        tabel "Pagu & Realisasi". Tampilannya mengikuti contoh
        public/diagramlingkaran.jpeg: lingkaran penuh berwarna biru
        dengan garis pemisah putih antar irisan.

          • irisan gelap → realisasi
          • irisan terang → sisa pagu (pagu − realisasi)

     2. KartuPersentaseRealisasi — versi ringkas berupa donat yang
        menggantikan kartu "Persentase Bulan": persentase realisasi
        di tengah lingkaran + legenda kecil.

   Angka yang masuk ke komponen ini sudah dihitung oleh
   StatistikOperasional (sumber live Google Sheets/Drive), jadi
   komponen ini hanya bertugas menggambar — tanpa library tambahan,
   murni SVG supaya bundle tetap ringan.
   ══════════════════════════════════════════════════════════════ */

/* Palet biru mengikuti contoh gambar: gelap → realisasi,
   lebih terang → sisa pagu. */
const WARNA_REALISASI = "#1a6d9a";
const WARNA_SISA = "#38a9c8";
const WARNA_KOSONG = "#e2e8f0";

function formatRupiah(n) {
  const num = Number(n);
  if (!isFinite(num) || num === 0) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
}

function formatPersen(n) {
  const num = Number(n);
  if (!isFinite(num)) return "—";
  return (
    num.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + "%"
  );
}

/* Hitung irisan sekali, dipakai kedua tampilan supaya angkanya
   tidak mungkin berbeda. */
function hitungIrisan(realisasi, pagu) {
  const paguNum = Number(pagu) > 0 ? Number(pagu) : 0;
  const realisasiNum = Number(realisasi) > 0 ? Number(realisasi) : 0;
  const sisa = Math.max(0, paguNum - realisasiNum);
  const persen = paguNum > 0 ? (realisasiNum / paguNum) * 100 : 0;

  const irisan = [];
  if (paguNum > 0) {
    if (realisasiNum > 0) {
      irisan.push({
        key: "realisasi",
        label: "Realisasi",
        value: Math.min(realisasiNum, paguNum),
        color: WARNA_REALISASI,
      });
    }
    if (sisa > 0) {
      irisan.push({
        key: "sisa",
        label: "Sisa Pagu",
        value: sisa,
        color: WARNA_SISA,
      });
    }
  }

  return {
    paguNum,
    realisasiNum,
    sisa,
    persen,
    irisan,
    adaPagu: paguNum > 0,
    lebihPagu: paguNum > 0 && realisasiNum > paguNum,
  };
}

/* ── Titik pada lingkaran (0° = jam 12, searah jarum jam) ── */
function titik(cx, cy, r, sudut) {
  const rad = ((sudut - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/* ── Jalur satu potongan donat (ring) ── */
function jalurDonat(cx, cy, rOut, rIn, mulai, selesai) {
  const [x1, y1] = titik(cx, cy, rOut, mulai);
  const [x2, y2] = titik(cx, cy, rOut, selesai);
  const [x3, y3] = titik(cx, cy, rIn, selesai);
  const [x4, y4] = titik(cx, cy, rIn, mulai);
  const besar = selesai - mulai > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${besar} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${besar} 0 ${x4} ${y4} Z`;
}

const UKURAN = 180;
const PUSAT = UKURAN / 2;

/* Radius donat: luar dan dalam (lubang tengah). */
const R_OUT = 78;
const R_IN = 52;

/* ══════════════════════════════════════════════════════════════
   1. PIE PENUH — dipakai di bagian bawah Ringkasan
   ══════════════════════════════════════════════════════════════ */
function Pie({ irisan }) {
  const total = irisan.reduce((jumlah, s) => jumlah + s.value, 0);
  const realisasi = irisan.find((s) => s.key === "realisasi");
  const pctRealisasi = total > 0 && realisasi ? (realisasi.value / total) * 100 : 0;

  return (
    <svg
      viewBox={`0 0 ${UKURAN} ${UKURAN}`}
      className="diagram-pie-svg"
      role="img"
      aria-label="Diagram donat progres realisasi pagu"
    >
      {/* Lingkaran pelacak penuh (sisa pagu sebagai background track) */}
      <circle
        cx={PUSAT}
        cy={PUSAT}
        r={R_OUT}
        fill="none"
        stroke={WARNA_KOSONG}
        strokeWidth={R_OUT - R_IN}
        strokeLinecap="round"
      />

      {/* Busur progres realisasi saja (indikator melingkar) */}
      {total > 0 && realisasi && pctRealisasi > 0 && (
        <path
          d={jalurDonat(PUSAT, PUSAT, R_OUT, R_IN, -90, -90 + pctRealisasi * 3.6)}
          fill="none"
          stroke={WARNA_REALISASI}
          strokeWidth={R_OUT - R_IN}
          strokeLinecap="round"
        >
          <title>{`Realisasi: ${formatRupiah(realisasi.value)} (${formatPersen(pctRealisasi)})`}</title>
        </path>
      )}

      {/* Lubang tengah donat */}
      <circle
        cx={PUSAT}
        cy={PUSAT}
        r={R_IN - 4}
        fill="#fff"
        stroke="#e2e8f0"
        strokeWidth="1"
      />

      {/* Persen realisasi besar di tengah lubang donat (mirip pagu.png) */}
      {total > 0 && (
        <>
          <text
            x={PUSAT}
            y={PUSAT - 6}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="26"
            fontWeight="800"
            fill="#0f172a"
          >
            {formatPersen(pctRealisasi)}
          </text>
          <text
            x={PUSAT}
            y={PUSAT + 18}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="12"
            fontWeight="600"
            fill="#64748b"
          >
            dari pagu
          </text>
        </>
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   2. DONAT RINGKAS — pengganti kartu "Persentase Bulan"
   ══════════════════════════════════════════════════════════════ */




/* ═══════════════════════════════════════════════════════════════
   Diagram BAR MENDATAR — menggantikan donat di kartu "Persentase Bulan"
   (ikuti contoh public/persentasebulan.png)
   Susunan vertikal: Realisasi di atas, Pagu (Sisa Pagu) di bawah.
   ═══════════════════════════════════════════════════════════════ */
function BarHorizontal({ irisan, persenTeks }) {
  const total = irisan.reduce((jumlah, s) => jumlah + s.value, 0);
  const realisasi = irisan.find((s) => s.key === "realisasi");
  const sisa = irisan.find((s) => s.key === "sisa");

  const lebar = 340;
  const tinggi = 140;
  const labelLebar = 70;
  const barMulai = labelLebar + 10;
  const barUsable = lebar - barMulai - 10;
  const barTinggi = 18;
  const jarakBaris = 56;

  const rPct = total > 0 && realisasi ? (realisasi.value / total) * 100 : 0;
  const sPct = total > 0 && sisa ? (sisa.value / total) * 100 : 0;

  return (
    <svg
      viewBox={`0 0 ${lebar} ${tinggi}`}
      className="diagram-baris-svg"
      role="img"
      aria-label={`Diagram persentase bulan: ${persenTeks}`}
    >
      {/* Baris 1: Realisasi (atas) */}
      <rect
        x={barMulai}
        y={24}
        width={barUsable}
        height={barTinggi}
        rx={barTinggi / 2}
        ry={barTinggi / 2}
        fill="#eef2f7"
      />
      {realisasi && rPct > 0 && (
        <rect
          x={barMulai}
          y={20}
          width={(rPct / 100) * barUsable}
          height={barTinggi}
          rx={barTinggi / 2}
          ry={barTinggi / 2}
          fill={WARNA_REALISASI}
        >
          <title>{`Realisasi: ${formatRupiah(realisasi.value)}`}</title>
        </rect>
      )}
      <text
        x={barMulai + (rPct / 100) * barUsable + 6}
        y={24 + barTinggi / 2 + 4}
        fontSize="12"
        fontWeight="800"
        fill={WARNA_REALISASI}
      >
        {formatPersen(rPct)}
      </text>

      {/* Baris 2: Pagu / Sisa Pagu (bawah) */}
      <rect
        x={barMulai}
        y={24 + jarakBaris}
        width={barUsable}
        height={barTinggi}
        rx={barTinggi / 2}
        ry={barTinggi / 2}
        fill="#eef2f7"
      />
      {sisa && sPct > 0 && (
        <rect
          x={barMulai}
          y={20 + jarakBaris}
          width={(sPct / 100) * barUsable}
          height={barTinggi}
          rx={barTinggi / 2}
          ry={barTinggi / 2}
          fill={WARNA_SISA}
        >
          <title>{`Sisa Pagu: ${formatRupiah(sisa.value)}`}</title>
        </rect>
      )}
      <text
        x={barMulai + (sPct / 100) * barUsable + 6}
        y={24 + jarakBaris + barTinggi / 2 + 4}
        fontSize="12"
        fontWeight="800"
        fill={WARNA_SISA}
      >
        {formatPersen(sPct)}
      </text>

      {/* Persen total di bawah tengah */}
      <text
        x={lebar / 2}
        y={tinggi - 8}
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fill="#0f172a"
      >
        {persenTeks}
      </text>
    </svg>
  );
}
/* ── Kartu pengganti "Persentase Bulan" ── */
export function KartuPersentaseRealisasi({
  realisasi,
  pagu,
  catatan,
}) {
  const { realisasiNum, persen, irisan, adaPagu } = hitungIrisan(
    realisasi,
    pagu
  );

  const adaData = adaPagu && realisasiNum > 0;
  const persenTeks = adaData ? formatPersen(persen) : "—";

  return (
    <div
      className="stat-card stat-card-plain diagram-kartu"
      style={{ "--c": WARNA_REALISASI }}
    >
      <div className="stat-kpi-title">Persentase Bulan</div>

      {adaPagu ? (
        <div className="diagram-kartu-body">
          <div className="diagram-kartu-chart">
            <BarHorizontal irisan={irisan} persenTeks={persenTeks} />
          </div>
        </div>
      ) : (
        <div className="diagram-kartu-body">
          <div className="diagram-kartu-chart">
            <BarHorizontal irisan={[]} persenTeks={persenTeks} />
          </div>
          <p className="diagram-kartu-kosong">
            Pagu bulan ini belum tersedia.
          </p>
        </div>
      )}

      {catatan && <div className="stat-kpi-note">{catatan}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Diagram lingkaran penuh (bawaan)
   ══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   GRAFIK BATANG: TINGKAT KELENGKAPAN ARSIP DIGITAL PER BULAN
   --------------------------------------------------------------
   Menggantikan kartu "Persentase Bulan" dengan grafik gambar
   (SVG) yang menunjukkan jumlah berkas arsip digital per bulan
   (dari Google Drive) serta tingkat kelengkapan rata-rata
   (persenVerifikasi dari spreadsheet) ditampilkan besar di tengah.
   Bulan yang sedang difilter disorot pada batangnya.            */

/* ════════════════════════════════════════════════════════════════
/* ═════════════════════════════════════════════════════════════════
   Kartu "Sisa Anggaran DIPA per Bulan"
   ---------------------------------------------------------------
   Menampilkan diagram batang horizontal: Realisasi (atas) dan
   Sisa Anggaran (bawah), dengan persentase sisa ditampilkan besar
   di bawahnya. Rincian nominal Pagu DIPA, Realisasi, dan Sisa
   Anggaran ditampilkan di kanan.                                  */

/* ── Kartu "Sisa Anggaran DIPA per Bulan" ──
   Menampilkan hanya nominal Sisa Anggaran (pagu − realisasi)
   dalam bentuk angka besar, tanpa diagram batang dan tanpa
   rincian Pagu / Realisasi / Total arsip / Total DIPA.             */
export function KartuSisaAnggaranDipa({
  pagu,
  realisasi,
  catatan,
}) {
  const paguNum = Number(pagu) || 0;
  const realisasiNum = Number(realisasi) || 0;
  const sisaNum = Math.max(0, paguNum - realisasiNum);
  const adaPagu = paguNum > 0;

  const formatSisa = (n) => {
    const num = Number(n);
    if (!isFinite(num) || num === 0) return "Rp 0";
    return "Rp " + num.toLocaleString("id-ID");
  };

  return (
    <div
      className="stat-card stat-card-plain diagram-kartu"
      style={{ "--c": WARNA_REALISASI }}
    >
      <div className="stat-kpi-title">Sisa Anggaran DIPA per Bulan</div>

      <div className="diagram-kartu-body">
        <div className="diagram-kartu-isi">
          <div className="diagram-kartu-nilai-besar">
            {adaPagu ? formatSisa(sisaNum) : "—"}
          </div>
          <div className="diagram-kartu-keterangan">
            sisa anggaran dari DIPA
          </div>
        </div>
      </div>

      {!adaPagu && (
        <div className="stat-kpi-note">Pagu DIPA belum tersedia untuk bulan ini.</div>
      )}
      {catatan && <div className="stat-kpi-note">{catatan}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Diagram BATANG: PAGU vs REALISASI per Bulan
   --------------------------------------------------------------
   Dua baris horizontal: Pagu (atas) dan Realisasi (bawah),
   masing-masing dengan label bulan di kiri dan nominal di kanan.
   Mengikuti contoh public/pagudanrealisasi.png.
   ═══════════════════════════════════════════════════════════════ */
function DiagramPaguRealisasi({ dataPerBulan, totalPagu, totalRealisasi }) {
  const lebar = 340;
  const tinggi = 150;
  const labelLebar = 110;
  const barMulai = labelLebar + 8;
  const barUsable = lebar - barMulai - 70;
  const barTinggi = 16;
  const jarakBaris = 50;

  const maxPagu = Math.max(totalPagu, 1);
  const maxReal = Math.max(totalRealisasi, 1);

  const bulanDenganPagu = dataPerBulan.filter((b) => b.pagu > 0);

  return (
    <svg
      viewBox={`0 0 ${lebar} ${tinggi}`}
      className="diagram-pagu-real-svg"
      role="img"
      aria-label="Diagram batang pagu vs realisasi per bulan"
    >
      {/* Judul kecil di tengah atas */}
      <text
        x={lebar / 2}
        y={14}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#0f172a"
      >
        Pagu vs Realisasi per Bulan
      </text>

      {/* Baris Pagu */}
      <text
        x={labelLebar - 6}
        y={22 + jarakBaris * 0}
        textAnchor="end"
        fontSize="11"
        fontWeight="600"
        fill="#d97706"
      >
        Pagu
      </text>
      <rect
        x={barMulai}
        y={20 + jarakBaris * 0}
        width={barUsable}
        height={barTinggi}
        rx={barTinggi / 2}
        ry={barTinggi / 2}
        fill="#f1f5f9"
      />
      {bulanDenganPagu.length > 0 && (
        <rect
          x={barMulai}
          y={20 + jarakBaris * 0}
          width={Math.min((totalPagu / maxPagu) * barUsable, barUsable)}
          height={barTinggi}
          rx={barTinggi / 2}
          ry={barTinggi / 2}
          fill="#d97706"
        >
          <title>{`Pagu: ${formatRupiah(totalPagu)}`}</title>
        </rect>
      )}
      <text
        x={barMulai + barUsable + 4}
        y={24 + jarakBaris * 0}
        fontSize="10"
        fontWeight="800"
        fill="#0f172a"
        fontVariantNumeric="tabular-nums"
      >
        {formatRupiah(totalPagu)}
      </text>

      {/* Baris Realisasi */}
      <text
        x={labelLebar - 6}
        y={22 + jarakBaris * 1}
        textAnchor="end"
        fontSize="11"
        fontWeight="600"
        fill="#0284c7"
      >
        Realisasi
      </text>
      <rect
        x={barMulai}
        y={20 + jarakBaris * 1}
        width={barUsable}
        height={barTinggi}
        rx={barTinggi / 2}
        ry={barTinggi / 2}
        fill="#f1f5f9"
      />
      {totalRealisasi > 0 && (
        <rect
          x={barMulai}
          y={20 + jarakBaris * 1}
          width={Math.min((totalRealisasi / maxReal) * barUsable, barUsable)}
          height={barTinggi}
          rx={barTinggi / 2}
          ry={barTinggi / 2}
          fill="#0284c7"
        >
          <title>{`Realisasi: ${formatRupiah(totalRealisasi)}`}</title>
        </rect>
      )}
      <text
        x={barMulai + barUsable + 4}
        y={24 + jarakBaris * 1}
        fontSize="10"
        fontWeight="800"
        fill="#0f172a"
        fontVariantNumeric="tabular-nums"
      >
        {totalRealisasi > 0 ? formatRupiah(totalRealisasi) : "—"}
      </text>

      {/* Label satuan di bawah */}
      <text
        x={lebar / 2}
        y={tinggi - 6}
        textAnchor="middle"
        fontSize="10"
        fill="#64748b"
      >
        Rupiah (Rp)
      </text>
    </svg>
  );
}

export { DiagramPaguRealisasi };

export default function DiagramRealisasi({
  periode,
  realisasi,
  pagu,
  catatan,
}) {
  const {
    realisasiNum,
    irisan,
    adaPagu,
    lebihPagu,
  } = hitungIrisan(realisasi, pagu);

  const total = irisan.reduce((jumlah, s) => jumlah + s.value, 0);

  return (
    <section className="diagram-realisasi" aria-label="Diagram realisasi">
      <div className="diagram-realisasi-head">
        <h3 className="stat-subheading">Realisasi vs Sisa Pagu</h3>
        {periode && (
          <span className="diagram-realisasi-periode">{periode}</span>
        )}
      </div>

      {!adaPagu ? (
        <div className="diagram-realisasi-empty">
          <div className="diagram-realisasi-chart">
            <svg
              viewBox={`0 0 ${UKURAN} ${UKURAN}`}
              className="diagram-pie-svg"
              role="img"
              aria-label="Diagram realisasi belum tersedia"
            >
              <circle
                cx={PUSAT}
                cy={PUSAT}
                r={78}
                fill={WARNA_KOSONG}
              />
              <text
                x={PUSAT}
                y={PUSAT + 10}
                textAnchor="middle"
                fontSize="30"
                fontWeight="800"
                fill="#fff"
              >
                —
              </text>
            </svg>
          </div>
          <p className="diagram-realisasi-empty-text">
            Pagu periode ini belum tersedia, jadi perbandingan realisasi
            belum bisa digambarkan.
          </p>
        </div>
      ) : (
        <div className="diagram-realisasi-body">
          <div className="diagram-realisasi-chart">
            <Pie irisan={irisan} />
          </div>

          <ul className="diagram-realisasi-legend">
            {irisan.map((s) => {
              const pct = total > 0 ? (s.value / total) * 100 : 0;
              return (
                <li key={s.key} className="diagram-realisasi-item">
                  <span
                    className="diagram-realisasi-dot"
                    style={{ backgroundColor: s.color }}
                  ></span>
                  <span className="diagram-realisasi-label">{s.label}</span>
                  <span className="diagram-realisasi-value">
                    {formatRupiah(s.value)}
                  </span>
                  <span className="diagram-realisasi-pct">
                    {formatPersen(pct)}
                  </span>
                </li>
              );
            })}
            <li className="diagram-realisasi-item diagram-realisasi-total">
              <span className="diagram-realisasi-label">Total Pagu</span>
              <span className="diagram-realisasi-value">
                {formatRupiah(pagu)}
              </span>
              <span className="diagram-realisasi-pct">100,00%</span>
            </li>
            {lebihPagu && (
              <li className="diagram-realisasi-catatan">
                Realisasi melebihi pagu sebesar{" "}
                {formatRupiah(realisasiNum - (Number(pagu) || 0))}.
              </li>
            )}
            {catatan && (
              <li className="diagram-realisasi-catatan">{catatan}</li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}
