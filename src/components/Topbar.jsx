import { useState, useEffect } from "react";

function Topbar({ role, mode, selectedMachineId, onSwitchMachine }) {
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
    normal: { text: "◆ SYSTEM STATE: NORMAL ◆", cls: "text-[#10b981]", dotColor: "#10b981" },
    warning: { text: "⚠ SYSTEM WARNING", cls: "text-[#f59e0b]", dotColor: "#f59e0b" },
    failure: { text: "🚨 CRITICAL FAILURE DETECTED 🚨", cls: "text-[#ef4444]", dotColor: "#ef4444" },
    recovery: { text: "SYSTEM RECOVERING...", cls: "text-[#3b82f6]", dotColor: "#3b82f6" }
  };
  const cfg = modeConfigs[mode.toLowerCase()] || modeConfigs.normal;

  return (
    <div className="topbar flex items-center justify-between px-6 py-3 bg-black/60 border-b border-cyan/15 backdrop-blur-xl relative z-40">
      <div className="flex items-center gap-4">
        <div className="font-display font-black text-sm tracking-[0.2em] text-white">NEXUS HMI</div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              background: cfg.dotColor,
              boxShadow: `0 0 10px ${cfg.dotColor}`,
              transition: "background 0.3s"
            }}
          ></div>
          <span className="font-mono text-[9px] tracking-wider text-cyan/70 uppercase">GRID SECURE</span>
        </div>
      </div>

      <div className="hidden md:block">
        <div className={`font-display font-bold text-xs tracking-[0.3em] uppercase ${cfg.cls}`}>
          {cfg.text}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {role === "operator" && selectedMachineId && (
          <button
            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 text-white font-mono text-[9px] tracking-wider uppercase rounded-md transition-all duration-300 cursor-pointer"
            onClick={onSwitchMachine}
          >
            📂 SWITCH STATION
          </button>
        )}
        <div className="px-2.5 py-0.5 rounded-full bg-cyan/10 border border-cyan/25 text-white font-mono text-[9px] tracking-wider uppercase">
          {role}
        </div>
        <div className="font-mono text-[10px] tracking-wider text-white bg-black/40 px-2.5 py-1 rounded border border-cyan/10">
          🕐 {timeStr || "00:00:00"}
        </div>
        <button 
          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-white font-mono text-[9px] tracking-wider uppercase rounded-md transition-all duration-300 cursor-pointer" 
          onClick={() => window.location.reload()}
        >
          ⏏ LOGOUT
        </button>
      </div>
    </div>
  );
}

export default Topbar;
