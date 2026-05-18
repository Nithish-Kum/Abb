import { useEffect, useState } from "react";
import AIInsight from "./AIInsight";

const modeAlerts = {
  normal: [],
  warning: [
    { type: "warning", msg: "Motor Core Temp approaching Warning threshold limit (>75°C)", sensor: "Motor Temp" },
    { type: "info", msg: "Lube fluid viscosity variation detected - scheduled check recommended", sensor: "Oil Visc" }
  ],
  failure: [
    { type: "critical", msg: "CRITICAL OVERHEATING: Motor Core Temp exceeded safety ceiling (>100°C)", sensor: "Motor Temp" },
    { type: "critical", msg: "SYSTEM FAILURE: Vibration threshold breach (>2.8g) - immediate shutdown risk", sensor: "Vibration" },
    { type: "warning", msg: "Pressure regulation valve failure causing line feedback", sensor: "Pressure Valve" }
  ],
  recovery: [
    { type: "info", msg: "System recovery cycle triggered - Core temperatures decreasing", sensor: "Motor Temp" },
    { type: "info", msg: "Coolant fluid pump pressure adjusting to standard baseline", sensor: "Coolant" }
  ]
};

const stormAlerts = [
  { type: "critical", msg: "🔴 FLOOD EVENT: Motor Unit overheating cascading cascade risk", sensor: "Motor C-02" },
  { type: "critical", msg: "🔴 DANGER: Structural stress - critical mechanical vibration limit breached", sensor: "Frame A-01" },
  { type: "warning", msg: "⚠ VALVE SURGE: Backpressure valve locked in closed position", sensor: "Pressure Reg" }
];

function AlertsPanel({ mode, stormActive }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const active = stormActive ? stormAlerts : (modeAlerts[mode.toLowerCase()] || []);
    
    setAlerts(active.map((a, i) => ({
      id: Date.now() + i,
      ...a,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      acked: false
    })));
  }, [mode, stormActive]);

  const ackAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

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
            <div key={a.id} className={`alert-item ${a.type} fade-in`}>
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
