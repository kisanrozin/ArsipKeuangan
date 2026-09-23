import React, { useState, useEffect, useRef } from "react";

// Helper icon component for file types
function FileIcon({ tipe }) {
  const t = (tipe || "").toLowerCase();
  if (t === "pdf") {
    return (
      <span className="fm-file-icon fm-icon-pdf" title="Adobe PDF">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.6"/>
          <path d="M14 2V8H20" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="7" y="17" fill="#DC2626" fontSize="7" fontWeight="bold">PDF</text>
        </svg>
      </span>
    );
  }
  if (t === "zip" || t === "rar" || t === "7z") {
    return (
      <span className="fm-file-icon fm-icon-archive" title="Compressed Archive">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.6"/>
          <path d="M14 2V8H20" stroke="#D97706" strokeWidth="1.6"/>
          <path d="M10 7H12M10 10H12M10 13H12M9 16H13V19H9V16Z" stroke="#D97706" strokeWidth="1.4"/>
        </svg>
      </span>
    );
  }
  if (t === "xlsx" || t === "xls") {
    return (
      <span className="fm-file-icon fm-icon-excel" title="Excel Spreadsheet">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.6"/>
          <path d="M14 2V8H20" stroke="#16A34A" strokeWidth="1.6"/>
          <text x="7" y="17" fill="#16A34A" fontSize="7" fontWeight="bold">XLS</text>
        </svg>
      </span>
    );
  }
  return (
    <span className="fm-file-icon fm-icon-generic" title="Document">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.6">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"/>
        <path d="M14 2V8H20"/>
      </svg>
    </span>
  );
}

// ============================================================
// Reusable File Manager Section — satu panel tabel Drive
// ============================================================
export default function DriveSection({ label, color, icon, folderId, apiKey, dokumenData }) {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("id");
  const [sortAsc, setSortAsc] = useState(true);

  // Folder navigation
  const [folderStack, setFolderStack] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [currentFolderName, setCurrentFolderName] = useState("Root");
  const [folders, setFolders] = useState([]);

  // Index untuk deep search
  const [allIndexedFiles, setAllIndexedFiles] = useState([]);
  const [allIndexedFolders, setAllIndexedFolders] = useState([]);

  const [previewFile, setPreviewFile] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);

  // Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Google Drive state
  const [driveFileId, setDriveFileId] = useState(folderId);
  const [driveApiKey, setDriveApiKey] = useState(apiKey);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveSyncActive, setDriveSyncActive] = useState(false);
  const [driveError, setDriveError] = useState(null);

  const [newFile, setNewFile] = useState({
    file: "", namaDokumen: "", tipe: "pdf", ukuran: "1.50 Mb",
  });

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Format Drive item
  const formatDriveItem = (item, parentFolder, pathStack, idx) => {
    const ext = item.name.includes(".")
      ? item.name.split(".").pop().toLowerCase()
      : item.mimeType.includes("pdf") ? "pdf"
      : item.mimeType.includes("spreadsheet") || item.mimeType.includes("excel") ? "xlsx"
      : item.mimeType.includes("document") || item.mimeType.includes("word") ? "docx"
      : item.mimeType.includes("image") ? "jpg"
      : "file";
    const sizeBytes = parseInt(item.size) || 0;
    const sizeMb = sizeBytes > 0 ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} Mb` : "—";
    const pathNames = pathStack ? pathStack.map(p => p.name).concat(parentFolder.name) : [parentFolder.name];
    const folderPath = pathNames.join(" › ");
    return {
      id: item.id || idx + 1,
      file: item.name || `Dokumen_${idx + 1}`,
      namaDokumen: item.name.replace(/\.[^/.]+$/, "") || "Dokumen Arsip",
      eksis: true,
      ukuran: sizeMb,
      ukuranBytes: sizeBytes,
      tglUpload: (item.modifiedTime || item.createdTime || new Date().toISOString()).slice(0, 10),
      tipe: ext,
      driveLink: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
      downloadLink: item.webContentLink || null,
      folderId: parentFolder.id,
      folderName: parentFolder.name,
      folderPath: folderPath,
      pathStack: pathStack || [],
    };
  };

  // Crawler
  const crawlDriveTree = async (rootId, rootName, aKey) => {
    try {
      let collectedFiles = [];
      let collectedFolders = [];
      let queue = [{ id: rootId, name: rootName, pathStack: [] }];
      let visited = new Set([rootId]);
      while (queue.length > 0 && visited.size < 40) {
        const current = queue.shift();
        try {
          const listUrl = `https://www.googleapis.com/drive/v3/files?q='${current.id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink)&pageSize=100&key=${aKey}`;
          const res = await fetch(listUrl);
          if (!res.ok) continue;
          const data = await res.json();
          const items = data.files || [];
          const subFolders = items.filter(item => item.mimeType === "application/vnd.google-apps.folder");
          const fileItems = items.filter(item => item.mimeType !== "application/vnd.google-apps.folder");
          const nextStack = [...current.pathStack, { id: current.id, name: current.name }];
          fileItems.forEach((f, idx) => {
            collectedFiles.push(formatDriveItem(f, current, current.pathStack, idx));
          });
          for (const sf of subFolders) {
            const currentPathStr = nextStack.map(p => p.name).join(" › ");
            const sfPathStr = `${currentPathStr} › ${sf.name}`;
            collectedFolders.push({
              id: sf.id, name: sf.name, parentId: current.id,
              parentName: current.name, path: sfPathStr, pathStack: nextStack,
            });
            if (!visited.has(sf.id)) {
              visited.add(sf.id);
              queue.push({ id: sf.id, name: sf.name, pathStack: nextStack });
            }
          }
        } catch (e) { console.warn("Crawler subfolder error:", e); }
      }
      if (collectedFiles.length > 0) setAllIndexedFiles(collectedFiles);
      if (collectedFolders.length > 0) setAllIndexedFolders(collectedFolders);
    } catch (e) { console.warn("Crawler error:", e); }
  };

  // Fetch data from Google Drive
  const fetchGoogleDriveData = async (targetId, targetKey) => {
    const fId = (targetId !== undefined ? targetId : driveFileId).trim();
    const aKey = (targetKey !== undefined ? targetKey : driveApiKey).trim();
    if (!fId || !aKey) { setShowDriveModal(true); return; }
    setIsDriveLoading(true);
    setDriveError(null);
    try {
      const metaUrl = `https://www.googleapis.com/drive/v3/files/${fId}?fields=id,name,mimeType&key=${aKey}`;
      const metaRes = await fetch(metaUrl);
      if (!metaRes.ok) {
        const errText = await metaRes.text();
        throw new Error(`HTTP ${metaRes.status}: Gagal mengakses Google Drive.\n${errText}`);
      }
      const meta = await metaRes.json();
      const folderName = meta.name || "Root";
      setCurrentFolderName(folderName);
      let formatted = [];
      if (meta.mimeType === "application/vnd.google-apps.folder") {
        const listUrl = `https://www.googleapis.com/drive/v3/files?q='${fId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink)&pageSize=100&key=${aKey}`;
        const listRes = await fetch(listUrl);
        if (!listRes.ok) throw new Error("Gagal mengambil daftar file dari folder.");
        const listData = await listRes.json();
        const driveItems = listData.files || [];
        const subFolders = driveItems.filter(item => item.mimeType === "application/vnd.google-apps.folder");
        const fileItems = driveItems.filter(item => item.mimeType !== "application/vnd.google-apps.folder");
        const currentFolderObj = { id: fId, name: folderName };
        setFolders(subFolders.map(f => ({ id: f.id, name: f.name, parentId: fId, pathStack: folderStack })));
        formatted = fileItems.map((item, idx) => formatDriveItem(item, currentFolderObj, folderStack, idx));
        if (allIndexedFiles.length === 0) crawlDriveTree(fId, folderName, aKey);
      } else {
        const fileUrl = `https://www.googleapis.com/drive/v3/files/${fId}?alt=media&key=${aKey}`;
        const fileRes = await fetch(fileUrl);
        if (!fileRes.ok) throw new Error("Gagal membaca isi file.");
        const data = await fileRes.json();
        let items = Array.isArray(data) ? data : data.files || data.data || data.arsip || Object.values(data).filter(v => typeof v === "object");
        formatted = (items || []).map((item, idx) => {
          const fileName = item.file || item.name || item.nama_file || `Dokumen_${idx + 1}.pdf`;
          const ext = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "pdf";
          return {
            id: item.id || idx + 1, file: fileName,
            namaDokumen: item.namaDokumen || item.deskripsi || item.nama_dokumen || "Dokumen Arsip",
            eksis: item.eksis !== undefined ? Boolean(item.eksis) : true,
            ukuran: item.ukuran || item.size || "1.50 Mb", ukuranBytes: item.ukuranBytes || 1500000,
            tglUpload: item.tglUpload || item.date || new Date().toISOString().slice(0, 10),
            tipe: ext, driveLink: item.driveLink || null,
            folderId: fId, folderName, folderPath: folderName,
          };
        });
      }
      const deletedDrive = JSON.parse(localStorage.getItem(`pu_deleted_drive_${fId}`) || "[]");
      const activeFormatted = formatted.filter(item => !deletedDrive.includes(item.id));
      const localFiles = JSON.parse(localStorage.getItem(`pu_local_files_${fId}`) || "[]");
      setFiles([...localFiles, ...activeFormatted]);
      setDriveSyncActive(true);
      setShowDriveModal(false);
      showToastMsg(`✓ ${label}: Berhasil memuat ${localFiles.length + activeFormatted.length} data arsip dari Google Drive!`);
    } catch (err) {
      console.error(`Gagal mengambil data ${label}:`, err);
      setDriveError(err.message);
      showToastMsg(`⚠️ ${label}: ${err.message}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  // Otomatis fetch saat mount
  useEffect(() => {
    fetchGoogleDriveData(folderId, apiKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search & filter
  const isSearching = search.trim().length > 0;
  const q = search.toLowerCase().trim();
  const filteredFolders = isSearching
    ? (allIndexedFolders.length > 0 ? allIndexedFolders : folders).filter(f =>
        f.name.toLowerCase().includes(q) || (f.path && f.path.toLowerCase().includes(q))
      )
    : folders;
  const sourceFiles = isSearching && allIndexedFiles.length > 0 ? allIndexedFiles : files;
  const filteredFiles = sourceFiles.filter(f => {
    if (!isSearching) return true;
    return (
      f.file.toLowerCase().includes(q) ||
      f.namaDokumen.toLowerCase().includes(q) ||
      (f.tglUpload && f.tglUpload.includes(q)) ||
      (f.folderName && f.folderName.toLowerCase().includes(q)) ||
      (f.folderPath && f.folderPath.toLowerCase().includes(q))
    );
  });

  // Sort
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let valA = a[sortField]; let valB = b[sortField];
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalEntries = sortedFiles.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedFiles = sortedFiles.slice(startIndex, startIndex + entriesPerPage);
  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  // Handlers
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!newFile.file.trim() || !newFile.namaDokumen.trim()) return;
    const ext = newFile.file.split(".").pop() || "pdf";
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
    const created = {
      id: "local_" + Date.now(),
      file: newFile.file, namaDokumen: newFile.namaDokumen, eksis: true,
      ukuran: newFile.ukuran || "1.25 Mb", ukuranBytes: 1250000,
      tglUpload: formattedDate, tipe: ext.toLowerCase(),
      isLocal: true,
    };
    const targetFid = currentFolderId || folderId;
    const localKey = `pu_local_files_${targetFid}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
    localStorage.setItem(localKey, JSON.stringify([created, ...existing]));
    setFiles([created, ...files]);
    setShowUploadModal(false); setSelectedFile(null);
    setNewFile({ file: "", namaDokumen: "", tipe: "pdf", ukuran: "1.50 Mb" });
    window.dispatchEvent(new CustomEvent("pu_files_updated"));
    showToastMsg(`✓ Berkas "${created.file}" berhasil diupload!`);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    const ext = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "pdf";
    const sizeBytes = file.size;
    let sizeStr;
    if (sizeBytes >= 1024 * 1024) sizeStr = `${(sizeBytes / (1024 * 1024)).toFixed(2)} Mb`;
    else if (sizeBytes >= 1024) sizeStr = `${(sizeBytes / 1024).toFixed(2)} Kb`;
    else sizeStr = `${sizeBytes} B`;
    setNewFile(prev => ({ ...prev, file: file.name, tipe: ext, ukuran: sizeStr }));
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); };

  const handleDownloadSingle = (fileObj) => {
    if (fileObj.downloadLink) window.open(fileObj.downloadLink, "_blank");
    else if (fileObj.driveLink) window.open(fileObj.driveLink, "_blank");
    else showToastMsg(`⬇️ Mengunduh berkas: ${fileObj.file}...`);
  };

  const handleViewSingle = (fileObj) => { setPreviewFile(fileObj); setPreviewZoom(1); };

  const handleFolderClick = (folder) => {
    setFolderStack(prev => [...prev, { id: currentFolderId, name: currentFolderName }]);
    setCurrentFolderId(folder.id); setFiles([]); setFolders([]);
    fetchGoogleDriveData(folder.id, driveApiKey);
  };

  const handleJumpToFolder = (targetFolder) => {
    setFolderStack(targetFolder.pathStack || []);
    setCurrentFolderId(targetFolder.id); setCurrentFolderName(targetFolder.name);
    setFiles([]); setFolders([]); setSearch("");
    fetchGoogleDriveData(targetFolder.id, driveApiKey);
  };

  const handleBreadcrumbNav = (idx) => {
    const target = folderStack[idx];
    setFolderStack(folderStack.slice(0, idx));
    setCurrentFolderId(target.id); setFiles([]); setFolders([]);
    fetchGoogleDriveData(target.id, driveApiKey);
  };

  const handleGoRoot = () => {
    const root = folderStack[0];
    const rootId = root ? root.id : folderId;
    setFolderStack([]); setCurrentFolderId(rootId); setFiles([]); setFolders([]);
    fetchGoogleDriveData(rootId, driveApiKey);
  };

  // Statistik dari data master untuk header
  const totalDok = dokumenData.reduce((s, d) => s + d.subJenis.length, 0);
  const totalWajib = dokumenData.flatMap(d => d.subJenis).filter(s => s.wajib).length;

  return (
    <div className="jd-section" style={{ "--section-color": color }}>
      {toast && <div className="toast">{toast}</div>}

      {/* ── Section Header ── */}
      <div className="jd-section-header" style={{ borderLeftColor: color }}>
        <div className="jd-section-title">
          <span className="jd-section-icon">{icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "#1e293b" }}>{label}</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
              {dokumenData.length} kategori · {totalDok} sub-dokumen · {totalWajib} wajib
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {driveSyncActive ? (
            <span className="fm-drive-badge active">● Google Drive Live</span>
          ) : (
            <span className="fm-drive-badge local">○ Data Lokal</span>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="fm-top-actions">
        {folderStack.length > 0 && (
          <button className="fm-btn fm-btn-back" onClick={() => handleBreadcrumbNav(folderStack.length - 1)} title="Kembali ke folder sebelumnya">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Kembali
          </button>
        )}
        <button className="fm-btn fm-btn-upload" onClick={() => setShowUploadModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload File
        </button>
        <button className="fm-btn fm-btn-drive" onClick={() => setShowDriveModal(true)} title="Tarik data dari Google Drive">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
          {isDriveLoading ? "Mengambil Data..." : "Tarik Data dari Drive"}
        </button>
      </div>

      {/* ── Breadcrumb ── */}
      {(folderStack.length > 0 || folders.length > 0) && (
        <div className="fm-breadcrumb">
          {folderStack.length > 0 && (
            <button className="fm-breadcrumb-back" onClick={() => handleBreadcrumbNav(folderStack.length - 1)} title="Kembali">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Kembali
            </button>
          )}
          {folderStack.length > 0 && <span className="fm-breadcrumb-divider"/>}
          <button className="fm-breadcrumb-item fm-breadcrumb-home" onClick={handleGoRoot}>🏠 Root</button>
          {folderStack.map((f, idx) => (
            <span key={f.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span className="fm-breadcrumb-sep">›</span>
              <button className="fm-breadcrumb-item" onClick={() => handleBreadcrumbNav(idx)}>{f.name}</button>
            </span>
          ))}
          <span className="fm-breadcrumb-sep">›</span>
          <span className="fm-breadcrumb-current">{currentFolderName}</span>
        </div>
      )}

      {/* ── Folder Grid ── */}
      {filteredFolders.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {isSearching && (
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e40af", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📁</span> Folder yang Cocok ({filteredFolders.length})
            </div>
          )}
          <div className="fm-folder-grid">
            {filteredFolders.map(folder => (
              <button key={folder.id} className="fm-folder-card"
                onClick={() => (isSearching ? handleJumpToFolder(folder) : handleFolderClick(folder))}
                title={`Buka folder: ${folder.name}${folder.path ? ` (${folder.path})` : ''}`}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="#3b82f6" opacity="0.85"/>
                  <path d="M2 10h20" stroke="#2563eb" strokeWidth="0.8" opacity="0.5"/>
                </svg>
                <span className="fm-folder-name" title={folder.name}>{folder.name}</span>
                {isSearching && folder.path && (
                  <span className="fm-folder-path-label" title={folder.path}>{folder.path}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Table Controls ── */}
      <div className="fm-table-controls">
        <div className="fm-entries-wrap">
          <span>Show</span>
          <select className="fm-entries-select" value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
          <span>entries</span>
        </div>
        <div className="fm-search-wrap">
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            Search:
            <div style={{ position: "relative", display: "inline-block" }}>
              <input type="text" className="fm-search-input" placeholder="Cari file / folder..."
                value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                style={{ paddingRight: search ? 24 : 10 }}
              />
              {search && (
                <button type="button" onClick={() => { setSearch(""); setCurrentPage(1); }}
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontWeight: "bold", fontSize: 12, padding: 2 }}
                  title="Hapus pencarian"
                >✕</button>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Search Info Bar */}
      {isSearching && (
        <div className="fm-search-info-bar">
          <span>🔍 Hasil pencarian untuk <strong>"{search}"</strong>: Ditemukan <strong>{filteredFiles.length}</strong> berkas dan <strong>{filteredFolders.length}</strong> folder</span>
          <button className="fm-search-clear-btn" onClick={() => setSearch("")}>✕ Hapus Pencarian</button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="fm-table-responsive">
        <table className="fm-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")} style={{ width: 45 }}>
                <span className="th-content">No <span className="sort-icon">⇅</span></span>
              </th>
              <th onClick={() => handleSort("file")}>
                <span className="th-content">File <span className="sort-icon">⇅</span></span>
              </th>
              <th onClick={() => handleSort("namaDokumen")}>
                <span className="th-content">Nama Dokumen <span className="sort-icon">⇅</span></span>
              </th>
              <th onClick={() => handleSort("eksis")} style={{ width: 90, textAlign: "center" }}>
                <span className="th-content" style={{ justifyContent: "center" }}>File Eksis <span className="sort-icon">⇅</span></span>
              </th>
              <th onClick={() => handleSort("ukuran")} style={{ width: 110, textAlign: "center" }}>
                <span className="th-content" style={{ justifyContent: "center" }}>Ukuran File <span className="sort-icon">⇅</span></span>
              </th>
              <th onClick={() => handleSort("tglUpload")} style={{ width: 120, textAlign: "center" }}>
                <span className="th-content" style={{ justifyContent: "center" }}>Tgl. Upload <span className="sort-icon">⇅</span></span>
              </th>
              <th style={{ width: 130, textAlign: "center" }}>
                <span className="th-content" style={{ justifyContent: "center" }}>Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedFiles.length > 0 ? (
              paginatedFiles.map((row, idx) => {
                const displayNo = startIndex + idx + 1;
                return (
                  <tr key={row.id}>
                    <td style={{ color: "#6b7280" }}>{displayNo}</td>
                    <td>
                      <div className="fm-file-cell">
                        <FileIcon tipe={row.tipe} />
                        <div>
                          <span className="fm-file-name" title={row.file}>{row.file}</span>
                          {isSearching && row.folderPath && row.folderPath !== "Root" && (
                            <div>
                              <span className="fm-folder-badge" title={`Klik untuk membuka folder: ${row.folderPath}`}
                                onClick={(e) => { e.stopPropagation(); handleJumpToFolder({ id: row.folderId, name: row.folderName, pathStack: row.pathStack || [] }); }}>
                                📁 {row.folderPath}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="fm-doc-name-cell">{row.namaDokumen}</td>
                    <td style={{ textAlign: "center" }}>
                      {row.eksis ? <span className="fm-badge-ada">Ada</span> : <span className="fm-badge-tidak">Tidak</span>}
                    </td>
                    <td style={{ textAlign: "center", color: "#4b5563", fontSize: 13 }}>{row.ukuran}</td>
                    <td style={{ textAlign: "center", color: "#4b5563", fontSize: 13 }}>{row.tglUpload}</td>
                    <td style={{ textAlign: "center" }}>
                      <div className="fm-action-group">
                        <button className="fm-action-btn fm-action-btn-view" title="Pratinjau File" onClick={() => handleViewSingle(row)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button className="fm-action-btn fm-action-btn-download" title="Download / Buka di Drive" onClick={() => handleDownloadSingle(row)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#9ca3af" }}>
                  {isSearching ? `Tidak ada berkas yang cocok dengan "${search}".` : "Tidak ada data arsip yang ditemukan."}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th>No</th><th>File</th><th>Nama Dokumen</th>
              <th style={{ textAlign: "center" }}>File Eksis</th>
              <th style={{ textAlign: "center" }}>Ukuran File</th>
              <th style={{ textAlign: "center" }}>Tgl. Upload</th>
              <th style={{ textAlign: "center" }}>Action</th>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="fm-pagination">
        <div className="fm-info-text">
          Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
        </div>
        <div className="fm-pagination-btns">
          <button className="fm-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
            <button key={pg} className={`fm-page-btn ${currentPage === pg ? "active" : ""}`} onClick={() => setCurrentPage(pg)}>{pg}</button>
          ))}
          <button className="fm-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>

      {/* ── MODAL: Google Drive ── */}
      {showDriveModal && (
        <div className="modal-overlay" onClick={() => setShowDriveModal(false)}>
          <div className="modal-box" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Ambil Data {label} dari Google Drive</h4>
              <button className="modal-close-btn" onClick={() => setShowDriveModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 14, lineHeight: 1.5 }}>
                Mengambil data berkas arsip <strong>{label}</strong> dari Google Drive publik.
              </p>
              {driveError && (
                <div className="alert alert-danger" style={{ marginTop: 12, marginBottom: 12, fontSize: 12.5 }}>
                  <span>⚠️</span><span>{driveError}</span>
                </div>
              )}
              <div className="form-group" style={{ marginTop: 14, marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Google Drive Folder/File ID *</label>
                <input type="text" className="filter-select" style={{ width: "100%", padding: "8px 12px", fontFamily: "monospace" }}
                  placeholder="Contoh: 1a2B3c4D5e6F7g8H9i0jKlMnOpQrStUv"
                  value={driveFileId} onChange={(e) => setDriveFileId(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>Google Cloud API Key *</label>
                <input type="text" className="filter-select" style={{ width: "100%", padding: "8px 12px", fontFamily: "monospace" }}
                  placeholder="Contoh: AIzaSyD..."
                  value={driveApiKey} onChange={(e) => setDriveApiKey(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn-cancel" onClick={() => setShowDriveModal(false)}>Tutup</button>
              <button type="button" className="btn-submit" style={{ background: "#0ea5e9", borderColor: "#0ea5e9", padding: "8px 18px" }}
                disabled={isDriveLoading} onClick={() => fetchGoogleDriveData(driveFileId, driveApiKey)}>
                {isDriveLoading ? "Menghubungkan..." : "Tarik & Tampilkan Data"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Upload ── */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Upload Berkas {label}</h4>
              <button className="modal-close-btn" onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}>✕</button>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body">
                <div className={`fm-dropzone${isDragOver ? " fm-dropzone-active" : ""}${selectedFile ? " fm-dropzone-filled" : ""}`}
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" style={{ display: "none" }}
                    accept=".pdf,.zip,.rar,.7z,.xlsx,.xls,.doc,.docx,.png,.jpg"
                    onChange={(e) => handleFileSelect(e.target.files[0])} />
                  {selectedFile ? (
                    <div className="fm-dropzone-selected">
                      <FileIcon tipe={selectedFile.name.split(".").pop().toLowerCase()} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div className="fm-dropzone-filename">{selectedFile.name}</div>
                        <div className="fm-dropzone-filesize">{newFile.ukuran}</div>
                      </div>
                      <button type="button" className="fm-dropzone-clear" onClick={(e) => {
                        e.stopPropagation(); setSelectedFile(null);
                        setNewFile(prev => ({ ...prev, file: "", tipe: "pdf", ukuran: "1.50 Mb" }));
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={isDragOver ? "#3b82f6" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <div className="fm-dropzone-text"><strong>Klik untuk pilih file</strong> atau drag &amp; drop di sini</div>
                      <div className="fm-dropzone-hint">PDF, ZIP, RAR, 7Z, XLSX, DOC, IMG</div>
                    </>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Deskripsi / Nama Dokumen *</label>
                  <textarea required rows={3} className="filter-select" style={{ width: "100%", padding: "8px 12px", resize: "vertical" }}
                    placeholder="Deskripsi peruntukan atau rincian dokumen..."
                    value={newFile.namaDokumen} onChange={(e) => setNewFile({ ...newFile, namaDokumen: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => { setShowUploadModal(false); setSelectedFile(null); }}>Batal</button>
                <button type="submit" className="btn-submit" style={{ padding: "8px 20px" }}>Simpan &amp; Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Preview ── */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="modal-box fm-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", flex: 1 }}>
                <FileIcon tipe={previewFile.tipe} />
                <h4 style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewFile.file}</h4>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <button className="fm-zoom-btn" onClick={() => setPreviewZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="Zoom Out" disabled={previewZoom <= 0.5}>−</button>
                <span className="fm-zoom-label">{Math.round(previewZoom * 100)}%</span>
                <button className="fm-zoom-btn" onClick={() => setPreviewZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} title="Zoom In" disabled={previewZoom >= 4}>+</button>
                <button className="fm-zoom-btn fm-zoom-reset" onClick={() => setPreviewZoom(1)} title="Reset Zoom">Reset</button>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewFile(null)}>✕</button>
            </div>
            <div className="fm-preview-body">
              {previewFile.id && typeof previewFile.id === "string" ? (
                <div style={{ width: `${previewZoom * 100}%`, minWidth: "100%", height: `${previewZoom * 100}%`, minHeight: "100%", transition: "width 0.2s, height 0.2s" }}>
                  <iframe src={`https://drive.google.com/file/d/${previewFile.id}/preview`} className="fm-preview-frame" allow="autoplay" title={previewFile.file} />
                </div>
              ) : (
                <div className="fm-preview-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"/><path d="M14 2V8H20"/></svg>
                  <p>Pratinjau tidak tersedia untuk file ini.</p>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn-cancel" onClick={() => setPreviewFile(null)}>Tutup</button>
              {previewFile.driveLink && (
                <button className="btn-submit" style={{ background: "#0284c7", borderColor: "#0284c7" }} onClick={() => window.open(previewFile.driveLink, "_blank")}>Buka di Drive</button>
              )}
              {previewFile.downloadLink && (
                <button className="btn-submit" style={{ background: "#16a34a", borderColor: "#16a34a" }} onClick={() => window.open(previewFile.downloadLink, "_blank")}>⬇ Download</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
