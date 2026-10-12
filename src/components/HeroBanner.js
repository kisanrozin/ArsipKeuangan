import React from "react";

/* Hero banner penuh di atas halaman — dipakai Dashboard (admin) dan
   halaman ringkasan tamu, supaya keduanya tampil sama. */
export default function HeroBanner({ title, subtitle, crumbs }) {
  return (
    <div className="hero-banner" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/hero_library.jpeg)` }}>
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-subtitle">{subtitle}</p>
        <div className="hero-breadcrumb">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              <span className={i === crumbs.length - 1 ? "current" : ""}>{c}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}