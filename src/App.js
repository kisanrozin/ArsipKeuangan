import React from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import ProsesBisnis from "./components/ProsesBisnis";
import KebutuhanInstansi from "./components/KebutuhanInstansi";
import JenisDokumen from "./components/JenisDokumen";

function App() {
  const [activePage, setActivePage] = React.useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":     return <Dashboard setActivePage={setActivePage} />;
      case "proses-bisnis": return <ProsesBisnis />;
      case "kebutuhan":     return <KebutuhanInstansi />;
      case "dokumen":       return <JenisDokumen />;
      case "dipa":          return <JenisDokumen />;
      case "rkks":          return <JenisDokumen />;
      default:              return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <div>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <div className="page-wrapper">
        {renderPage()}
      </div>
      <footer className="footer">
        <div>© {new Date().getFullYear()} <strong>DIARKES</strong> · Digitalisasi Arsip Keuangan Kementerian Pekerjaan Umum</div>
        <div>Pusat Pengembangan Kompetensi SDA, Cipta Karya dan Prasarana Strategis · Versi 1.0</div>
      </footer>
    </div>
  );
}

export default App;
