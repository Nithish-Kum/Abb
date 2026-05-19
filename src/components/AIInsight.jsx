import { useEffect, useState } from "react";

function AIInsight({ mode }) {
  let label = "SYSTEM STABLE";
  let text = "All systems operating within expected parameters. Thermal dissipation and vibration baseline remain steady. Zero anomalies in queue.";
  let conf = 94;
  let labelColor = "#10b981";

  const lowerMode = (mode || "").toLowerCase();

  if (lowerMode === "failure") {
    label = "CRITICAL CONDITION";
    text = "🔴 CASUALTY PREDICTION: Motor thermal runaway cascade underway or active power line surge detected! Thermal or load limits exceeded. Immediate power shutdown suggested.";
    conf = 98;
    labelColor = "#ef4444";
  } else if (lowerMode === "warning") {
    label = "ANOMALY DETECTED";
    text = "⚠️ WARNING DEVIATION: Abnormal pressure fluctuations detected in Hydraulic Pump, or thermal drift in Motor Stator. Recommend cooling diagnostics.";
    conf = 81;
    labelColor = "#f59e0b";
  } else if (lowerMode === "recovery") {
    label = "SYSTEM STABILIZING";
    text = "♻️ RECOVERY IN PROGRESS: Cooling stabilization underway. Temperatures are dropping and sensors are returning to nominal calibration curves.";
    conf = 88;
    labelColor = "#00e5ff";
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-3.5 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
      <div className="flex justify-between items-center">
        <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-white font-mono text-[9px] uppercase tracking-wider">
          AI DIAGNOSTIC
        </div>
        <span
          className="text-[9px] font-mono tracking-widest font-bold uppercase transition-colors duration-300"
          style={{ color: labelColor }}
        >
          {label}
        </span>
      </div>

      <div className="text-[11px] text-white/90 leading-relaxed font-sans mt-1 pr-1 font-semibold">
        {text}
      </div>

      <div className="flex items-center gap-3 mt-1.5">
        <span className="text-[9px] font-mono tracking-wider text-cyan/50 uppercase">
          AI CONFIDENCE:
        </span>
        <div className="flex-1 bg-cyan/5 h-2 rounded overflow-hidden border border-cyan/10">
          <div
            className="h-full rounded transition-all duration-500 bg-gradient-to-r from-cyan to-blue-500 shadow-[0_0_8px_rgba(0,229,255,0.4)]"
            style={{
              width: `${conf}%`
            }}
          />
        </div>
        <div className="font-mono text-[10px] text-white tracking-wider font-bold">{conf}%</div>
      </div>
    </div>
  );
}

export default AIInsight;
