import { useState, useEffect } from "react";

function Topbar({ role, mode }) {
  const [timeStr, setTimeStr] = useState("");

  // Live high-precision SCADA clock
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const modeConfigs = {
    normal: { text: "◆ SYSTEM STATE: NORMAL ◆", cls: "mode-normal", dotColor: "var(--green)" },
    warning: { text: "⚠ SYSTEM WARNING", cls: "mode-warning", dotColor: "var(--yellow)" },
    failure: { text: "🚨 CRITICAL FAILURE DETECTED 🚨", cls: "mode-failure", dotColor: "var(--red)" },
    recovery: { text: "SYSTEM RECOVERING...", cls: "mode-recovery", dotColor: "var(--blue)" }
  };
  const cfg = modeConfigs[mode.toLowerCase()] || modeConfigs.normal;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo-small">NEXUS HMI</div>
        <div className="sys-status">
          <div 
            className="status-dot" 
            style={{ 
              background: cfg.dotColor, 
              boxShadow: `0 0 10px ${cfg.dotColor}`,
              transition: "background 0.3s"
            }}
          ></div>
          <span>GRID SECURE</span>
        </div>
      </div>
      
      <div className="topbar-center">
        <div className={`sys-mode ${cfg.cls}`} style={{ transition: "all 0.5s ease" }}>
          {cfg.text}
        </div>
      </div>
      
      <div className="topbar-right">
        <div className="role-badge">{role}</div>
        <div className="clock" style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
          🕐 {timeStr || "00:00:00"}
        </div>
        <button className="logout-btn" onClick={() => window.location.reload()}>⏏ LOGOUT</button>
      </div>
    </div>
  );
}

export default Topbar;
