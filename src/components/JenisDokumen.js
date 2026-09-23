import React from "react";
import { DOKUMEN_DIPA } from "../data/masterData";
import DriveSection from "./DriveSection";

// ============================================================
// Google Drive Config — Folder ID untuk DIPA
// ============================================================
const DIPA_FOLDER_ID = "1A1KD9grE5z-ldfSfxFORuh4NILc5sIuN";
const DEFAULT_API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";

// ============================================================
// Komponen utama — menampilkan DIPA
// ============================================================
export default function JenisDokumen() {
  return (
    <div className="site-content" style={{ paddingTop: 24, paddingBottom: 60 }}>
      {/* Section DIPA */}
      <DriveSection
        label="DIPA (Daftar Isian Pelaksanaan Anggaran)"
        color="#1B2A6B"
        icon="📜"
        folderId={DIPA_FOLDER_ID}
        apiKey={DEFAULT_API_KEY}
        dokumenData={DOKUMEN_DIPA}
      />
    </div>
  );
}
