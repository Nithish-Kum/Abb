import { useState, useEffect } from "react";
import AIInsight from "./AIInsight";

function AlertsPanel({ role, mode, alerts = [], ackAlert }) {
  const isManager = role === "manager";
  const isOperator = role === "operator";

  // Aggregations for Manager View
  const warningCount = alerts.filter(a => a.type === "warning").length;
  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const infoCount = alerts.filter(a => a.type === "info").length;

  // 1. MANAGER VIEW RENDER
  if (isManager) {
    return (
      <div className="alerts-panel">
        <div className="alerts-header">
          <div className="alerts-title">🤖 AI INSIGHTS &amp; ALERTS</div>
          <div 
            className="alert-count" 
            style={{ 
              background: alerts.length > 0 ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
              color: alerts.length > 0 ? "var(--bg)" : "var(--text-muted)",
              transition: "all 0.3s"
            }}
          >
            {alerts.length}
          </div>
        </div>

        {/* AI Panel */}
        <AIInsight mode={mode} />

        {/* Executive Alerts Summary Statistics */}
        <div className="sensor-card fade-in" style={{ marginTop: "10px", borderColor: alerts.length > 0 ? "rgba(var(--accent-rgb), 0.3)" : "rgba(255,255,255,0.05)" }}>
          <div className="gauge-title" style={{ borderBottom: "none", marginBottom: "8px" }}>
            📊 ALERTS SEVERITY ANALYSIS
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <span style={{ color: "var(--red)" }}>🔴 CRITICAL OUTSTANDING</span>
              <span style={{ fontWeight: 900, color: "var(--red)" }}>{criticalCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <span style={{ color: "var(--yellow)" }}>⚠ WARNING EVENTS</span>
              <span style={{ fontWeight: 900, color: "var(--yellow)" }}>{warningCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
              <span style={{ color: "var(--blue)" }}>ℹ️ INFO LOGS</span>
              <span style={{ fontWeight: 900, color: "var(--blue)" }}>{infoCount}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.05)", marginTop: "12px", paddingTop: "10px", fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
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
      <div className="alerts-panel">
        <div className="alerts-header">
          <div className="alerts-title">🤖 AI INSIGHTS &amp; ALERTS</div>
          <div 
            className="alert-count" 
            style={{ 
              background: alerts.length > 0 ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
              color: alerts.length > 0 ? "var(--bg)" : "var(--text-muted)"
            }}
          >
            {alerts.length}
          </div>
        </div>

        {/* Simplified AI Pilot Summary */}
        <div className="sensor-card fade-in" style={{ borderColor: "rgba(var(--accent-rgb), 0.3)", marginTop: "10px" }}>
          <div className="gauge-title" style={{ borderBottom: "none", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
            🤖 AI PILOT SUMMARY
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--text-main)", marginBottom: "8px" }}>
            AI: {operatorInsightText}
          </div>
          
          {/* Animated Confidence Bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "10px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.58rem", fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--text-muted)" }}>CONFIDENCE INDEX</span>
              <span style={{ color: "var(--accent)", fontWeight: 900 }}>{confidenceVal}%</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
              <div 
                className="ai-conf-bar-fill" 
                style={{ 
                  width: `${confidenceVal}%`, 
                  height: "100%", 
                  background: "var(--accent)",
                  boxShadow: "0 0 8px var(--accent)",
                  transition: "width 1s ease-in-out" 
                }}
              />
            </div>
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--accent)", borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "8px", marginTop: "8px" }}>
            💡 HINT: {actionableHint}
          </div>
        </div>

        {/* Short Alerts Feed (1-3 max) */}
        <div id="alertList" style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          {alerts.length === 0 ? (
            <div 
              style={{ 
                textAlign: "center", 
                color: "var(--text-muted)", 
                fontSize: "0.7rem", 
                padding: "30px 10px", 
                fontFamily: "var(--font-mono)",
                border: "1px dashed rgba(255,255,255,0.05)",
                borderRadius: "8px"
              }}
            >
              🟢 ALL CHANNELS NOMINAL
            </div>
          ) : (
            alerts.slice(0, 3).map(a => (
              <div key={a.id} className={`alert-item ${a.type}`} style={{ padding: "10px", borderRadius: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span className={`alert-tag tag-${a.type}`} style={{ fontSize: "0.55rem", padding: "2px 6px" }}>{a.type.toUpperCase()}</span>
                  <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{a.time}</span>
                </div>
                <div className="alert-msg" style={{ fontSize: "0.68rem", margin: "6px 0", color: "var(--text-main)" }}>{a.msg}</div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                  <button className="ack-btn" onClick={() => ackAlert(a.id)} style={{ padding: "3px 10px", fontSize: "0.58rem" }}>✓ ACK</button>
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
    <div className="alerts-panel">
      <div className="alerts-header">
        <div className="alerts-title">🤖 AI INSIGHTS &amp; ALERTS</div>
        <div 
          className="alert-count" 
          style={{ 
            background: alerts.length > 0 ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
            color: alerts.length > 0 ? "var(--bg)" : "var(--text-muted)",
            transition: "all 0.3s"
          }}
        >
          {alerts.length}
        </div>
      </div>

      {/* AI Panel */}
      <AIInsight mode={mode} />

      {/* Alert Feed */}
      <div id="alertList" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
        {alerts.length === 0 ? (
          <div 
            style={{ 
              textAlign: "center", 
              color: "var(--text-muted)", 
              fontSize: "0.7rem", 
              padding: "30px 10px", 
              fontFamily: "var(--font-mono)",
              border: "1px dashed rgba(255,255,255,0.05)",
              borderRadius: "8px"
            }}
          >
            🟢 ALL CHANNELS NOMINAL
            <br />
            <span style={{ fontSize: "0.58rem", opacity: 0.5 }}>AI monitoring live telemetry...</span>
          </div>
        ) : (
          alerts.map(a => (
            <div key={a.id} className={`alert-item ${a.type}`}>
              <div className={`alert-tag tag-${a.type}`}>{a.type.toUpperCase()}</div>
              <div className="alert-msg">{a.msg}</div>
              <div className="alert-footer">
                <span className="alert-time">🕐 {a.time} | {a.sensor}</span>
                <button className="ack-btn" onClick={() => ackAlert(a.id)}>✓ ACK</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlertsPanel;
