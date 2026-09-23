import React from "react";
import DriveSection from "./DriveSection";

const FILE_ID = "1gZkmFPnVyWO5fqWLsHGAv_eu56WOdt_8";
const MY_API_KEY = "AIzaSyDuWHtZlBJ2MFERVARPT0084MATICbUv5k";

export default function KebutuhanInstansi() {
  return (
    <div className="site-content" style={{ paddingTop: 24, paddingBottom: 60 }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h2>Pencarian Arsip Digital</h2>
        <p>Akses cepat ke database dokumen dan arsip kementerian PUPR.</p>
      </div>

      <DriveSection
        label="Arsip Digital Publik"
        color="#0ea5e9"
        icon="🗂️"
        folderId={FILE_ID}
        apiKey={MY_API_KEY}
        dokumenData={[]}
      />
    </div>
  );
}
