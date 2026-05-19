import { useState, useEffect } from "react";
import Gauge from "./Gauge";
import Chart from "./Charts";
import Timeline from "./Timeline";

function LinearSCADAIndicator({ title, value, max = 100, unit = "%", warnLimit = 70, critLimit = 85 }) {
  const score = Math.min(Math.max(0, value), max);
  const fillPct = (score / max) * 100;

  let barColor = "var(--emerald)";
  if (score >= critLimit) {
    barColor = "var(--rose)";
  } else if (score >= warnLimit) {
    barColor = "var(--brand)";
  }

  return (
    <div className="scada-linear-container fade-in">
      <div className="scada-linear-header">
        <span className="scada-linear-title">◆ {title}</span>
        <span className="scada-linear-value" style={{ color: barColor }}>
          {score.toFixed(1)}{unit}
        </span>
      </div>
      <div className="scada-linear-track">
        <div
          className="scada-linear-fill"
          style={{
            width: `${fillPct}%`,
            background: barColor,
            boxShadow: `0 0 10px ${barColor}`
          }}
        />
      </div>
      <div className="scada-linear-limits">
        <span>MIN: 0</span>
        <span>WARN: {warnLimit}</span>
        <span>CRIT: {critLimit}</span>
        <span>MAX: {max}</span>
      </div>
    </div>
  );
}

function CenterPanel({ role, mode, selectedMachineId, setSelectedMachineId, machinesData, alerts = [], ackAlert }) {
  const isOperator = role === "operator";
  const isManager = role === "manager";
  const isEngineer = role === "engineer";

  // Operator modal state for failures
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const [loadReduced, setLoadReduced] = useState(false);

  // Engineer view states
  const [activeTab, setActiveTab] = useState("trends"); // trends | diagnostics | health | history
  const [logFilter, setLogFilter] = useState("all"); // all | info | warning | critical

  // Reset alarm dismissed state if status moves away from failure
  useEffect(() => {
    if (mode.toLowerCase() !== "failure") {
      setAlarmDismissed(false);
    }
  }, [mode]);

  // Bind active sensors dynamically
  const activeMachine = selectedMachineId ? machinesData[selectedMachineId] : null;
  const sensors = activeMachine ? activeMachine.sensors : (machinesData.motor ? machinesData.motor.sensors : {});

  // Safe telemetry sensor fallbacks - dynamically bound to actual CSV columns in order
  const sensorArray = Object.values(sensors);

  const tempSensor = sensorArray[0] || { current: 70, warn: 75, critical: 85, max: 120, history: Array(20).fill(70), id: "temp", name: "TEMPERATURE", unit: "°C" };
  const tempVal = tempSensor.current;

  const voltSensor = sensorArray[1] || { current: 185, warn: 200, critical: 220, max: 250, history: Array(20).fill(185), id: "voltage", name: "LINE VOLTAGE", unit: "V" };
  const voltVal = voltSensor.current;

  const pressSensor = sensorArray[2] || { current: 80, warn: 85, critical: 100, max: 150, history: Array(20).fill(80), id: "pressure", name: "CORE PRESSURE", unit: "PSI" };
  const pressVal = pressSensor.current;

  const flowSensor = sensorArray[3] || { current: 4.2, warn: 3.5, critical: 2.5, max: 10, history: Array(20).fill(4.2), id: "flow", name: "COOLANT FLOW", unit: "L/s" };
  const flowVal = flowSensor.current;

  const vibSensor = sensorArray[4] || { current: 1.5, warn: 1.2, critical: 2.0, max: 5, history: Array(20).fill(1.5), id: "vibration", name: "ROTOR VIBRATION", unit: "g" };
  const vibVal = vibSensor.current;

  const currSensor = sensorArray[5] || { current: 13, warn: 22, critical: 26, max: 30, history: Array(20).fill(13), id: "current", name: "INDUCTION CURRENT", unit: "A" };
  const currVal = currSensor.current;

  // Active risk of current selected segment
  const currentRisk = activeMachine ? activeMachine.risk : 0;

  // Computed manager summary health metric
  let healthScore = 100;
  sensorArray.forEach(s => {
    if (s.current >= s.critical) healthScore -= 12;
    else if (s.current >= s.warn) healthScore -= 6;
  });
  healthScore = Math.max(30, healthScore);

  // Engineer log buffer dynamic logs
  const baseLogs = [
    { type: "info", time: "16:21:05", module: "SYS", msg: "Primary power sync completed. Synchroscope aligned." },
    { type: "info", time: "16:21:40", module: "SYS", msg: "Modbus connection re-established with Field Cabinet 4." },
    { type: "warn", time: "16:22:10", module: "PUMP", msg: "Coolant valve cavitation detected. Secondary line throttled." },
    { type: "crit", time: "16:22:30", module: "MOTOR", msg: "Motor thermal gradient deviation. Emergency alert generated." }
  ];

  const dynamicLogs = [];
  sensorArray.forEach(s => {
    const isHigherBetter = s.id === "efficiency";
    const isLowerBetter = s.id === "flow_rate" || s.id === "flow";

    if (isLowerBetter || isHigherBetter) {
      if (s.current <= s.critical) {
        dynamicLogs.push({
          type: "crit",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          module: s.id.toUpperCase(),
          msg: `CRITICAL: ${s.name} critical drop at ${s.current.toFixed(1)}${s.unit}!`
        });
      } else if (s.current <= s.warn) {
        dynamicLogs.push({
          type: "warn",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          module: s.id.toUpperCase(),
          msg: `WARNING: ${s.name} low at ${s.current.toFixed(1)}${s.unit}.`
        });
      }
    } else {
      if (s.current >= s.critical) {
        dynamicLogs.push({
          type: "crit",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          module: s.id.toUpperCase(),
          msg: `CRITICAL: ${s.name} overload breakdown active at ${s.current.toFixed(1)}${s.unit}!`
        });
      } else if (s.current >= s.warn) {
        dynamicLogs.push({
          type: "warn",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          module: s.id.toUpperCase(),
          msg: `WARNING: ${s.name} elevated at ${s.current.toFixed(1)}${s.unit}.`
        });
      }
    }
  });

  const allLogs = [...baseLogs, ...dynamicLogs];
  const filteredLogs = allLogs.filter(l => {
    if (logFilter === "all") return true;
    if (logFilter === "info") return l.type === "info";
    if (logFilter === "warning") return l.type === "warn";
    if (logFilter === "critical") return l.type === "crit";
    return true;
  });

  // Render Operator view layout
  const renderOperatorView = () => {
    const criticalAlerts = alerts.filter(a => a.type === "critical");
    const nonCriticalAlerts = alerts.filter(a => a.type === "warning" || a.type === "info");
    const activeAlert = criticalAlerts.length > 0
      ? criticalAlerts[criticalAlerts.length - 1]
      : (nonCriticalAlerts.length > 0 ? nonCriticalAlerts[nonCriticalAlerts.length - 1] : null);

    return (
      <div className="center-body" style={{ flex: "1 0 auto", display: "flex", flexDirection: "column", gap: "16px", overflowY: "visible", position: "relative" }}>

        {/* Horizontal ALERT STRIP (NEW – HIGHEST PRIORITY) */}
        {activeAlert && (
          <div className={`scada-alert-strip ${activeAlert.type === "critical" ? "critical" : "warning"} fade-in-up`}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>{activeAlert.type === "critical" ? "🔴" : "⚠️"}</span>
              <span style={{ fontWeight: 900, letterSpacing: "0.05em" }}>
                {activeAlert.type === "critical" ? "CRITICAL:" : "WARNING:"}
              </span>
              <span className="scada-alert-msg">{activeAlert.msg}</span>
            </div>
            <button
              className="ack-strip-btn"
              onClick={() => ackAlert(activeAlert.id)}
            >
              {activeAlert.type === "critical" ? "ACK NOW" : "ACK"}
            </button>
          </div>
        )}

        {/* Real-time Operator grid: Main Recharts area chart and Risk Score Gauge */}
        <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          <Chart
            title={`${activeMachine?.name || "SYSTEM"} ${tempSensor.name.toUpperCase()} (PRIMARY FOCUS)`}
            value={`${tempVal.toFixed(1)}${tempSensor.unit}`}
            data={tempSensor.history}
            color="var(--red)"
            warnVal={tempSensor.warn}
            critVal={tempSensor.critical}
          />
          <Gauge
            title="System Risk Score"
            value={currentRisk}
            max={100}
            unit="%"
            warnLimit={40}
            critLimit={70}
          />
        </div>

        {/* Supporting SCADA Telemetry Stream (Faint low-opacity panels for density) */}
        {sensorArray.length > 1 && (
          <div className="supporting-telemetry-section fade-in">
            <div className="supporting-telemetry-header">◆ SUPPORTING SYSTEM TELEMETRY (LOW-OPACITY REFERENCE)</div>
            <div className="secondary-visuals-grid">
              {sensorArray.slice(1).map((s, idx) => {
                const colors = ["var(--sky)", "var(--brand)", "var(--emerald)", "var(--indigo)", "var(--brand)"];
                const color = colors[idx % colors.length];
                return (
                  <Chart
                    key={s.id}
                    title={s.name}
                    value={`${s.current.toFixed(1)}${s.unit}`}
                    data={s.history}
                    color={color}
                    warnVal={s.warn}
                    critVal={s.critical}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Action Panel reduced load confirmation toast */}
        {loadReduced && (
          <div className="load-reduced-toast fade-in">
            ⚙️ SYSTEM LOAD REDUCED BY 25% SUCCESSFULLY (baseline throttled)
          </div>
        )}

        {/* Operator Control ACTION PANEL (BOTTOM – NEW) */}
        <div className="scada-action-panel">
          <div className="scada-action-panel-header">⚡ OPERATOR MANUAL INTERVENTION PANEL</div>
          <div className="scada-action-buttons-row">
            <button
              className="action-panel-btn ack"
              onClick={() => {
                setAlarmDismissed(true);
                alerts.forEach(a => ackAlert(a.id));
              }}
            >
              ✓ Acknowledge Alarm
            </button>
            <button
              className={`action-panel-btn reduce ${loadReduced ? "active" : ""}`}
              onClick={() => {
                setLoadReduced(true);
                setTimeout(() => setLoadReduced(false), 3000);
              }}
            >
              ⚙ Reduce Load
            </button>
            {mode.toLowerCase() === "failure" && (
              <button
                className="action-panel-btn estop pulse"
                onClick={() => {
                  alert("⛔ EMERGENCY SHUTDOWN COMMAND ISSUED TO MAIN GRID RELAYS!");
                }}
              >
                ⛔ Emergency Stop
              </button>
            )}
          </div>
        </div>

        {/* Operator Alarm Popup Overlay on Failure */}
        {mode.toLowerCase() === "failure" && !alarmDismissed && (
          <div className="scada-alarm-popup-overlay">
            <div className="scada-alarm-popup">
              <div className="scada-alarm-popup-title">🚨 CRITICAL SCADA EMERGENCY ALARM</div>
              <div className="scada-alarm-popup-text">
                SYSTEM BREACH: Active cascade meltdown detected in Rotor Stator winding. Core temperature exceeds caution limits. Automated suppression loops initialized.
              </div>
              <button
                className="scada-alarm-popup-btn"
                onClick={() => {
                  setAlarmDismissed(true);
                  alerts.forEach(a => ackAlert(a.id));
                }}
              >
                ✓ ACKNOWLEDGE SEVERE EMERGENCY
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Engineer view layout with tabs and target machine switcher
  const renderEngineerView = () => {
    return (
      <div className="center-body" style={{ flex: "1 0 auto", display: "flex", flexDirection: "column", gap: "16px", overflowY: "visible" }}>

        {/* Sleek ENGINEER Machine switcher tabs */}
        <div className="engineer-machine-switcher fade-in" style={{ display: "flex", gap: "10px", marginBottom: "5px", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "12px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--ink-500)", alignSelf: "center", marginRight: "10px" }}>
            📡 ACTIVE TARGET SWITCHER:
          </span>
          {Object.keys(machinesData).map(mId => {
            const m = machinesData[mId];
            const isActive = selectedMachineId === mId;
            let neonColor = "var(--emerald)";
            if (m.mode === "failure") neonColor = "var(--rose)";
            else if (m.mode === "warning") neonColor = "var(--brand)";

            return (
              <button
                key={mId}
                className={`scada-action-tab ${isActive ? "active" : ""}`}
                onClick={() => setSelectedMachineId(mId)}
                style={{
                  border: `1px solid ${isActive ? neonColor : "rgba(255, 91, 46, 0.12)"}`,
                  boxShadow: isActive ? `0 0 10px ${neonColor}` : "none",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  padding: "5px 12px",
                  borderRadius: "4px",
                  background: isActive ? m.mode === "failure" ? "rgba(255, 59, 107, 0.08)" : m.mode === "warning" ? "rgba(255, 91, 46, 0.08)" : "rgba(52, 211, 153, 0.08)" : "transparent",
                  color: isActive ? neonColor : "var(--ink-500)",
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
              >
                ◆ {m.name} ({m.mode.toUpperCase()})
              </button>
            );
          })}
        </div>

        {/* Navigation Tab Menu */}
        <div className="eng-tabs">
          <button className={`eng-tab ${activeTab === "trends" ? "active" : ""}`} onClick={() => setActiveTab("trends")}>📈 LIVE TRENDS</button>
          <button className={`eng-tab ${activeTab === "diagnostics" ? "active" : ""}`} onClick={() => setActiveTab("diagnostics")}>🔍 DIAGNOSTICS</button>
          <button className={`eng-tab ${activeTab === "health" ? "active" : ""}`} onClick={() => setActiveTab("health")}>🛡️ COMPONENT HEALTH</button>
          <button className={`eng-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>🕐 EVENT HISTORY</button>
        </div>

        {/* Tab 1: Live Trends (Renders telemetry graphs dynamically) */}
        {activeTab === "trends" && (
          <div className="chart-grid fade-in">
            {sensorArray.map((s, idx) => {
              const colors = ["var(--rose)", "var(--sky)", "var(--brand)", "var(--emerald)", "var(--indigo)", "var(--brand)"];
              const color = colors[idx % colors.length];
              return (
                <Chart
                  key={s.id}
                  title={`${activeMachine?.name || ""} ${s.name}`}
                  value={`${s.current.toFixed(1)}${s.unit}`}
                  data={s.history}
                  color={color}
                  warnVal={s.warn}
                  critVal={s.critical}
                />
              );
            })}
          </div>
        )}

        {/* Tab 2: Diagnostics (Circular gauges utilized here) */}
        {activeTab === "diagnostics" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="gauge-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Gauge
                title="System Risk Score"
                value={currentRisk}
                max={100}
                unit="%"
                warnLimit={40}
                critLimit={70}
              />
              <Gauge
                title={`Operational ${tempSensor.name}`}
                value={tempVal}
                max={tempSensor.max}
                unit={tempSensor.unit}
                warnLimit={tempSensor.warn}
                critLimit={tempSensor.critical}
              />
            </div>

            <div className="eng-section">
              <div className="gauge-title" style={{ marginBottom: "12px", borderBottom: "none" }}>
                ◆ SCI-FI DIAGNOSTICS - DETAILED CORE LOG
              </div>
              <table className="eng-table">
                <thead>
                  <tr>
                    <th>SUB-SYSTEM CHANNEL</th>
                    <th>INTEGRITY STATUS</th>
                    <th>OPERATIONAL LOAD</th>
                    <th>LATENCY</th>
                    <th>BASELINE ACCURACY</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorArray.map((s, idx) => {
                    const isWarn = s.current >= s.warn;
                    const isCrit = s.current >= s.critical;
                    const statusClass = isCrit ? "status-bad" : isWarn ? "status-warn" : "status-good";
                    const statusText = isCrit ? "CRIT OVERLIMIT" : isWarn ? "WARNING SHIFT" : "ONLINE / NOMINAL";
                    const pct = s.max > 0 ? ((s.current / s.max) * 100).toFixed(0) : 0;

                    const latencies = [12, 35, 4, 18, 22];
                    const latency = latencies[idx % latencies.length];
                    const accuracies = ["99.98%", "99.42%", "99.91%", "99.85%", "99.94%"];
                    const accuracy = accuracies[idx % accuracies.length];

                    return (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td className={statusClass}>{statusText}</td>
                        <td>{pct}%</td>
                        <td>{latency} ms</td>
                        <td>{accuracy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Health - High Impact Gauges utilized */}
        {activeTab === "health" && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {sensorArray.map((s) => {
              const healthVal = s.critical > 0
                ? Math.max(0, Math.min(100, ((s.critical - s.current) / s.critical) * 100 + 50))
                : 100;
              return (
                <Gauge
                  key={s.id}
                  title={`${s.name} Integrity`}
                  value={healthVal}
                  max={100}
                  unit="%"
                  warnLimit={40}
                  critLimit={20}
                />
              );
            })}
          </div>
        )}

        {/* Tab 4: Chronological Event History */}
        {activeTab === "history" && (
          <div className="fade-in">
            <Timeline mode={mode} />
          </div>
        )}

        {/* Engineering log filter section */}
        <div className="eng-section fade-in" style={{ marginTop: "10px" }}>
          <div className="gauge-title" style={{ marginBottom: "12px", borderBottom: "none" }}>
            ⚙️ SCADA TELEMETRY LOG BUFFER
          </div>

          <div className="log-controls">
            <button className={`log-filter-btn ${logFilter === "all" ? "active" : ""}`} onClick={() => setLogFilter("all")}>ALL</button>
            <button className={`log-filter-btn ${logFilter === "info" ? "active" : ""}`} onClick={() => setLogFilter("info")}>INFO</button>
            <button className={`log-filter-btn ${logFilter === "warning" ? "active" : ""}`} onClick={() => setLogFilter("warning")}>WARNING</button>
            <button className={`log-filter-btn ${logFilter === "critical" ? "active" : ""}`} onClick={() => setLogFilter("critical")}>CRITICAL</button>
          </div>

          <div className="scada-log-list">
            {filteredLogs.map((log, i) => (
              <div key={i} className={`scada-log-item ${log.type}`}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className="scada-log-meta">[{log.time}]</span>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>[{log.module}]</span>
                  <span>{log.msg}</span>
                </div>
                <span className="scada-log-meta" style={{ textTransform: "uppercase", fontSize: "0.55rem" }}>
                  {log.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Manager view layout: Executive Dashboard showing ALL machines concurrently
  const renderManagerView = () => {
    return (
      <div className="center-body" style={{ flex: "1 0 auto", display: "flex", flexDirection: "column", gap: "16px", overflowY: "visible" }}>

        {/* Top Operational Status KPI strip */}
        <div className="manager-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          <div className="kpi-card fade-in">
            <span className="kpi-val" style={{ color: "var(--emerald)" }}>99.98%</span>
            <div className="kpi-label">GRID RUNTIME UPTIME</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.05s" }}>
            <span className="kpi-val" style={{ color: "var(--brand)" }}>
              {Object.values(machinesData).filter(m => m.mode === "failure").length}
            </span>
            <div className="kpi-label">ACTIVE SEVERE FAILURES</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="kpi-val" style={{ color: "var(--indigo)" }}>95.6%</span>
            <div className="kpi-label">AI PREDICTIVE RISK SYNCS</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.15s" }}>
            <span className="kpi-val" style={{ color: "var(--emerald)" }}>1.1s</span>
            <div className="kpi-label">AVERAGE RESPONSE LATENCY</div>
          </div>
        </div>

        {/* 📊 EXECUTIVE GRID: MULTI-MACHINE MONITORS */}
        <div className="manager-grid-header fade-in">
          ◆ EXECUTIVE PLANT MONITORS (ALL MACHINERY ACTIVE SEGMENTS)
        </div>

        <div className="manager-machines-grid fade-in">
          {Object.keys(machinesData).map(mId => {
            const m = machinesData[mId];
            const mSensors = m.sensors;
            const tempSens = mSensors.temp || { current: 0, warn: 0, critical: 0, history: [] };
            const pressSens = mSensors.pressure || { current: 0, warn: 0, critical: 0, history: [] };
            const currSens = mSensors.current || { current: 0, warn: 0, critical: 0, history: [] };

            // Dynamic card styling based on live active alerts for this machine segment
            const machineAlerts = alerts.filter(a => a.machineId === mId);
            const hasCriticalAlert = machineAlerts.some(a => a.type === "critical");
            const hasWarningAlert = machineAlerts.some(a => a.type === "warning");

            let activeMode = m.mode;
            if (hasCriticalAlert) {
              activeMode = "failure";
            } else if (hasWarningAlert) {
              activeMode = "warning";
            }

            let borderNeon = "rgba(16, 185, 129, 0.15)";
            let textGlow = "var(--emerald)";

            if (activeMode === "failure") {
              borderNeon = "var(--rose)";
              textGlow = "var(--rose)";
            } else if (activeMode === "warning") {
              borderNeon = "var(--brand)";
              textGlow = "var(--brand)";
            }

            return (
              <div
                key={mId}
                className={`manager-machine-card ${activeMode} fade-in`}
                style={{
                  border: `1px solid ${activeMode !== "normal" ? borderNeon : "rgba(255, 91, 46, 0.15)"}`,
                  boxShadow: activeMode !== "normal" ? `0 0 16px ${borderNeon}40` : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 91, 46, 0.15)", paddingBottom: "8px" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", color: "var(--ink-500)" }}>STATION segment</div>
                    <div style={{ fontFamily: "var(--font-title)", fontSize: "0.95rem", fontWeight: 700, color: "var(--ink-900)", letterSpacing: "0.05em" }}>{m.name}</div>
                  </div>
                  <span
                    className={`selection-status-badge`}
                    style={{
                      background: activeMode === "failure" ? "rgba(255, 59, 107, 0.08)" : activeMode === "warning" ? "rgba(255, 91, 46, 0.08)" : "rgba(52, 211, 153, 0.08)",
                      color: textGlow,
                      border: `1px solid ${textGlow}`,
                      padding: "2px 8px",
                      fontSize: "0.58rem",
                      fontFamily: "var(--font-mono)",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      boxShadow: `0 0 8px ${textGlow}30`
                    }}
                  >
                    {activeMode}
                  </span>
                </div>

                {/* Body section: Left = Circular Gauge, Right = HUD readouts */}
                <div className="manager-machine-card-body">
                  {/* Left Column: Circular SVG Gauge representing System Health */}
                  {(() => {
                    const healthPct = Math.max(0, 100 - m.risk);
                    const strokeDashoffset = 276.4 - (276.4 * healthPct) / 100;

                    let circleMeaning = "SYSTEM HEALTH";
                    if (mId === "motor") {
                      circleMeaning = "THERMAL HEALTH";
                    } else if (mId === "pump") {
                      circleMeaning = "FLOW STABILITY";
                    } else if (mId === "generator") {
                      circleMeaning = "LOAD EFFICIENCY";
                    }

                    return (
                      <div className="manager-gauge-container">
                        <svg className="manager-circular-gauge">
                          <circle
                            className="bg-circle"
                            cx="55"
                            cy="55"
                            r="44"
                          />
                          <circle
                            className="val-circle"
                            cx="55"
                            cy="55"
                            r="44"
                            style={{
                              stroke: textGlow,
                              strokeDashoffset: strokeDashoffset,
                              filter: `drop-shadow(0 0 6px ${textGlow})`
                            }}
                          />
                        </svg>
                        <div className="manager-gauge-overlay">
                          <div className="manager-gauge-percentage" style={{ color: textGlow }}>
                            {healthPct}%
                          </div>
                          <div className="manager-gauge-lbl">
                            {circleMeaning}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Right Column: Simplified key metrics readout */}
                  <div className="manager-stats-container">
                    {Object.values(mSensors).slice(0, 3).map((s) => (
                      <div key={s.id} className="manager-stat-row">
                        <span className="manager-stat-name">{s.name}</span>
                        <span className="manager-stat-val" style={{ color: s.current >= s.warn ? "var(--brand)" : "var(--ink-900)" }}>
                          {s.current.toFixed(1)}{s.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Storytelling Insight footer */}
                {(() => {
                  let insightText = "";
                  if (activeMode === "failure") {
                    if (mId === "motor") {
                      insightText = "🚨 CRITICAL OVERHEATING: COOLANT SYS DEVIATION DETECTED!";
                    } else if (mId === "pump") {
                      insightText = "🚨 HYDRAULIC PRESSURE BEYOND RUPTURE LIMITS!";
                    } else if (mId === "generator") {
                      insightText = "🚨 LOAD ANOMALY: EXTREME OVERCURRENT SHUTDOWN!";
                    }
                  } else if (activeMode === "warning") {
                    if (mId === "motor") {
                      insightText = "⚠️ Overheating trend detected (ventilation check suggested)";
                    } else if (mId === "pump") {
                      insightText = "⚠️ Flow instability rising (cavitation alert)";
                    } else if (mId === "generator") {
                      insightText = "⚠️ Load efficiency dropping (induction loss)";
                    }
                  } else {
                    if (mId === "motor") {
                      insightText = "🟢 Thermal core nominal, stable cooling cycle";
                    } else if (mId === "pump") {
                      insightText = "🟢 Flow hydraulics secure, steady discharge";
                    } else if (mId === "generator") {
                      insightText = "🟢 Load synchronization locked, baseline active";
                    }
                  }

                  return (
                    <div className="manager-insight-footer">
                      {insightText}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Switch rendering flow based on active Role
  return (
    <div className="center">
      {isOperator && renderOperatorView()}
      {isEngineer && renderEngineerView()}
      {isManager && renderManagerView()}
    </div>
  );
}

export default CenterPanel;