import { useState, useEffect } from "react";
import AIInsight from "./AIInsight";

function AlertsPanel({ role, mode, alerts = [], ackAlert, machinesData = {} }) {
  const isManager = role === "manager";
  const isOperator = role === "operator";

  // Aggregations for Manager View based on real machine CSV status
  const criticalCount = Object.values(machinesData).filter(m => m.mode === "failure").length;
  const warningCount = Object.values(machinesData).filter(m => m.mode === "warning").length;
  const infoCount = Object.values(machinesData).filter(m => m.mode === "recovery" || m.mode === "normal").length;

  const overallMode = Object.values(machinesData).some(m => m.mode === "failure")
    ? "failure"
    : (Object.values(machinesData).some(m => m.mode === "warning")
        ? "warning"
        : (Object.values(machinesData).some(m => m.mode === "recovery")
            ? "recovery"
            : "normal"));

  // 1. MANAGER VIEW RENDER
  if (isManager) {
    return (
      <div className="alerts-panel w-80 p-4 bg-black/40 border-l border-cyan/15 flex flex-col gap-6 overflow-y-auto">
        <div className="flex justify-between items-center border-b border-cyan/15 pb-2">
          <div className="font-display font-bold text-xs tracking-[0.25em] text-white uppercase">🤖 AI INSIGHTS &amp; ALERTS</div>
          <div
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-300"
            style={{
              background: alerts.length > 0 ? "#f59e0b" : "rgba(0, 229, 255, 0.05)",
              color: alerts.length > 0 ? "#050816" : "rgba(0, 229, 255, 0.6)"
            }}
          >
            {alerts.length}
          </div>
        </div>

        {/* AI Panel */}
        <AIInsight mode={overallMode} />

        {/* Executive Alerts Summary Statistics */}
        <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt" style={{ borderColor: alerts.length > 0 ? "rgba(245, 158, 11, 0.3)" : "rgba(0, 229, 255, 0.15)" }}>
          <div className="font-mono text-[9px] tracking-[0.2em] text-cyan/60 uppercase">
            📊 ALERTS SEVERITY ANALYSIS
          </div>

          <div className="flex flex-col gap-2.5 mt-2.5">
            <div className="flex justify-between items-center font-mono text-[10px]">
              <span className="text-[#ef4444]">🔴 CRITICAL OUTSTANDING</span>
              <span className="font-bold text-[#ef4444]">{criticalCount}</span>
            </div>
            <div className="flex justify-between items-center font-mono text-[10px]">
              <span className="text-[#f59e0b]">⚠ WARNING EVENTS</span>
              <span className="font-bold text-[#f59e0b]">{warningCount}</span>
            </div>
            <div className="flex justify-between items-center font-mono text-[10px]">
              <span className="text-cyan/70">ℹ️ INFO LOGS</span>
              <span className="font-bold text-cyan">{infoCount}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-cyan/15 mt-3 pt-2.5 text-[8px] text-cyan/60 font-mono">
            Plant impact: {criticalCount > 0 ? "🛑 IMMEDIATE ATTENTION REQUIRED" : warningCount > 0 ? "⚠️ PERFORMANCE DRIFT MEASURE" : "🟢 ALL STATIONS GREEN"}
          </div>
        </div>
      </div>
    );
  }

  // 2. OPERATOR VIEW RENDER (SIMPLIFIED)
  if (isOperator) {
    const operatorInsightText = mode.toLowerCase() === "failure"
      ? "Meltdown warning active. Immediate power shutdown suggested."
      : mode.toLowerCase() === "warning"
        ? "Temp rising abnormally. Check cooling fan loop."
        : mode.toLowerCase() === "recovery"
          ? "Cooling active. System stabilizing."
          : "All channels nominal. Steady state.";

    const confidenceVal = mode.toLowerCase() === "failure" ? 96 : mode.toLowerCase() === "warning" ? 78 : mode.toLowerCase() === "recovery" ? 87 : 92;

    const actionableHint = mode.toLowerCase() === "failure"
      ? "Strike E-Stop immediately to prevent coil melt!"
      : mode.toLowerCase() === "warning"
        ? "Throttle motor speed or initiate auxiliary cooling circuit!"
        : mode.toLowerCase() === "recovery"
          ? "Let temperature cool below 65°C before resuming load!"
          : "Monitor active telemetry stream to sustain stable production.";

    return (
      <div className="alerts-panel w-80 p-4 bg-black/40 border-l border-cyan/15 flex flex-col gap-6 overflow-y-auto">
        <div className="flex justify-between items-center border-b border-cyan/15 pb-2">
          <div className="font-display font-bold text-xs tracking-[0.25em] text-white uppercase">🤖 AI INSIGHTS &amp; ALERTS</div>
          <div
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-300"
            style={{
              background: alerts.length > 0 ? "#f59e0b" : "rgba(0, 229, 255, 0.05)",
              color: alerts.length > 0 ? "#050816" : "rgba(0, 229, 255, 0.6)"
            }}
          >
            {alerts.length}
          </div>
        </div>

        {/* Simplified AI Pilot Summary */}
        <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
          <div className="font-mono text-[9px] tracking-[0.2em] text-cyan/60 uppercase">
            🤖 AI PILOT SUMMARY
          </div>
          <div className="font-mono text-[10px] text-white mt-1">
            AI: {operatorInsightText}
          </div>

          {/* Animated Confidence Bar */}
          <div className="flex flex-col gap-1 mt-2.5">
            <div className="flex justify-between items-center text-[8px] font-mono">
              <span className="text-cyan/50">CONFIDENCE INDEX</span>
              <span className="text-[#f59e0b] font-bold">{confidenceVal}%</span>
            </div>
            <div className="h-1 bg-cyan/5 rounded overflow-hidden mt-1 border border-cyan/10">
              <div
                className="h-full rounded bg-gradient-to-r from-cyan to-[#f59e0b] shadow-[0_0_8px_rgba(0,229,255,0.4)]"
                style={{
                  width: `${confidenceVal}%`,
                  transition: "width 1s ease-in-out"
                }}
              />
            </div>
          </div>

          <div className="border-t border-dashed border-cyan/15 mt-3 pt-2.5 text-[8px] text-[#f59e0b] font-mono">
            💡 HINT: {actionableHint}
          </div>
        </div>

        {/* Short Alerts Feed (1-3 max) */}
        <div className="flex flex-col gap-3.5 mt-1 pr-1">
          {alerts.length === 0 ? (
            <div className="text-center text-cyan/50 text-[10px] py-8 font-mono border border-dashed border-cyan/15 rounded-xl">
              🟢 ALL CHANNELS NOMINAL
            </div>
          ) : (
            alerts.slice(0, 3).map(a => (
              <div key={a.id} className="bg-black/30 border border-cyan/10 p-3.5 rounded-xl flex flex-col gap-2 hover:border-cyan/30 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold ${a.type === "critical" ? "bg-red-500/10 border border-red-500/30 text-[#ef4444]" : "bg-amber-500/10 border border-amber-500/30 text-[#f59e0b]"}`}>{a.type.toUpperCase()}</span>
                  <span className="text-[8px] text-cyan/50 font-mono">{a.time}</span>
                </div>
                <div className="text-[10px] text-white/90 leading-relaxed font-sans">{a.msg}</div>
                <div className="flex justify-end mt-1">
                  <button className="px-2.5 py-0.5 bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 hover:border-cyan text-white font-mono text-[9px] uppercase tracking-wider rounded transition-all duration-300 cursor-pointer" onClick={() => ackAlert(a.id)}>✓ ACK</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 3. ENGINEER VIEW RENDER (STANDARD DETAILED)
  return (
    <div className="alerts-panel w-80 p-4 bg-black/40 border-l border-cyan/15 flex flex-col gap-6 overflow-y-auto">
      <div className="flex justify-between items-center border-b border-cyan/15 pb-2">
        <div className="font-display font-bold text-xs tracking-[0.25em] text-white uppercase">🤖 AI INSIGHTS &amp; ALERTS</div>
        <div
          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-300"
          style={{
            background: alerts.length > 0 ? "#f59e0b" : "rgba(0, 229, 255, 0.05)",
            color: alerts.length > 0 ? "#050816" : "rgba(0, 229, 255, 0.6)"
          }}
        >
          {alerts.length}
        </div>
      </div>

      {/* AI Panel */}
      <AIInsight mode={mode} />

      {/* Alert Feed */}
      <div className="flex flex-col gap-3.5 mt-1 pr-1">
        {alerts.length === 0 ? (
          <div className="text-center text-cyan/50 text-[10px] py-8 font-mono border border-dashed border-cyan/15 rounded-xl flex flex-col gap-1 items-center justify-center">
            <span>🟢 ALL CHANNELS NOMINAL</span>
            <span className="text-[8px] opacity-60">AI monitoring live telemetry...</span>
          </div>
        ) : (
          alerts.map(a => (
            <div key={a.id} className="bg-black/30 border border-cyan/10 p-3.5 rounded-xl flex flex-col gap-2 hover:border-cyan/30 transition-all duration-300">
              <div className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold w-fit ${a.type === "critical" ? "bg-red-500/10 border border-red-500/30 text-[#ef4444]" : "bg-amber-500/10 border border-amber-500/30 text-[#f59e0b]"}`}>{a.type.toUpperCase()}</div>
              <div className="text-[10px] text-white/90 leading-relaxed font-sans">{a.msg}</div>
              <div className="flex items-center justify-between border-t border-cyan/5 pt-2 mt-1">
                <span className="text-[8px] text-cyan/50 font-mono">🕐 {a.time} | {a.sensor}</span>
                <button className="px-2.5 py-0.5 bg-cyan/10 hover:bg-cyan/20 border border-cyan/30 hover:border-cyan text-white font-mono text-[9px] uppercase tracking-wider rounded transition-all duration-300 cursor-pointer" onClick={() => ackAlert(a.id)}>✓ ACK</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertsPanel;
