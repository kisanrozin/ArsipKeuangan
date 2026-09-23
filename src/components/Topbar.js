import React, { useEffect, useState } from "react";

export default function Topbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = time.toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const socials = [
    { icon: "f", href: "#", title: "Facebook" },
    { icon: "𝕏", href: "#", title: "X / Twitter" },
    { icon: "▶", href: "#", title: "YouTube" },
    { icon: "◎", href: "#", title: "Instagram" },
    { icon: "♪", href: "#", title: "TikTok" },
  ];

  return (
    <div className="topbar">
      <div className="topbar-left">
        📅 {fmt} WIB
      </div>
      <div className="topbar-right">
        <div className="topbar-socials">
          {socials.map((s, i) => (
            <a key={i} href={s.href} className="topbar-social-icon" title={s.title}>
              {s.icon}
            </a>
          ))}
        </div>
        <div className="topbar-divider" />
        <div className="topbar-lang">
          🌐 Indonesia ▾
        </div>
      </div>
    </div>
  );
}
