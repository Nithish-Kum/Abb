import { useState, useEffect } from "react";
import Gauge from "./Gauge";
import Chart from "./Charts";
import Timeline from "./Timeline";

function LinearSCADAIndicator({ title, value, max = 100, unit = "%", warnLimit = 70, critLimit = 85 }) {
  const score = Math.min(Math.max(0, value), max);
  const fillPct = (score / max) * 100;
  
  let barColor = "var(--green)";
  if (score >= critLimit) {
    barColor = "var(--red)";
  } else if (score >= warnLimit) {
    barColor = "var(--yellow)";
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

function CenterPanel({ role, mode, sensors, alerts = [], ackAlert }) {
  const isOperator = role === "operator";
  const isManager = role === "manager";
  const isEngineer = role === "engineer";

  // Operator modal state for failures
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const [loadReduced, setLoadReduced] = useState(false);

  // Engineer view states
  const [activeTab, setActiveTab] = useState("trends"); // trends | diagnostics | health | history
  const [selectedChannel, setSelectedChannel] = useState("motor"); // motor | voltage | pressure | flow | vibration | current
  const [logFilter, setLogFilter] = useState("all"); // all | info | warning | critical

  // Reset alarm dismissed state if status moves away from failure
  useEffect(() => {
    if (mode.toLowerCase() !== "failure") {
      setAlarmDismissed(false);
    }
  }, [mode]);

  // Compute telemetry values
  const tempVal = sensors.motor.current;
  const vibVal = sensors.vibration.current;
  const pressVal = sensors.pressure.current;
  const voltVal = sensors.voltage.current;
  const flowVal = sensors.flow.current;
  const currVal = sensors.current.current;

  // Calculate system risk factor
  let calculatedRisk = 0;
  if (tempVal > 75) calculatedRisk += 30;
  if (vibVal > 1.2) calculatedRisk += 25;
  if (pressVal > 85) calculatedRisk += 20;
  if (voltVal > 200) calculatedRisk += 15;
  const currentRisk = Math.min(calculatedRisk, 100);

  // Computed manager summary health metric
  let healthScore = 100;
  const sensorArray = Object.values(sensors);
  sensorArray.forEach(s => {
    if (s.current >= s.critical) healthScore -= 12;
    else if (s.current >= s.warn) healthScore -= 6;
  });
  healthScore = Math.max(30, healthScore);

  // Engineer logs setup
  const baseLogs = [
    { type: "info", time: "16:21:05", module: "SYS", msg: "Primary power sync completed. Synchroscope aligned." },
    { type: "info", time: "16:21:40", module: "SYS", msg: "Modbus connection re-established with Field Cabinet 4." },
    { type: "warn", time: "16:22:10", module: "PUMP", msg: "Coolant valve cavitation detected. Secondary line throttled." },
    { type: "crit", time: "16:22:30", module: "MOTOR", msg: "Motor thermal gradient deviation. Emergency alert generated." }
  ];

  const dynamicLogs = [];
  if (tempVal > sensors.motor.warn) {
    dynamicLogs.push({ type: "warn", time: "16:22:32", module: "THERMAL", msg: `WARNING: Motor Temp elevated at ${tempVal.toFixed(1)}°C.` });
  }
  if (tempVal > sensors.motor.critical) {
    dynamicLogs.push({ type: "crit", time: "16:22:35", module: "THERMAL", msg: `CRITICAL: Thermal overload breakdown active at ${tempVal.toFixed(1)}°C!` });
  }
  if (pressVal > sensors.pressure.warn) {
    dynamicLogs.push({ type: "warn", time: "16:22:38", module: "PRESSURE", msg: `WARNING: System Pressure high at ${pressVal.toFixed(1)} PSI.` });
  }

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
    // 1. Find the active alert for the Alert Strip
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

        {/* Real-time Operator grid: Main Recharts area chart */}
        <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <Chart
            title="Motor Core Temperature (Primary Focus)"
            value={`${tempVal.toFixed(1)}°C`}
            data={sensors.motor.history}
            color="var(--red)"
            warnVal={sensors.motor.warn}
            critVal={sensors.motor.critical}
          />
        </div>

        {/* Supporting SCADA Telemetry Stream (Faint low-opacity panels for density) */}
        <div className="supporting-telemetry-section fade-in">
          <div className="supporting-telemetry-header">◆ SUPPORTING SYSTEM TELEMETRY (LOW-OPACITY REFERENCE)</div>
          <div className="secondary-visuals-grid">
            <Chart
              title="Line Voltage"
              value={`${sensors.voltage.current.toFixed(1)}V`}
              data={sensors.voltage.history}
              color="var(--blue)"
              warnVal={sensors.voltage.warn}
              critVal={sensors.voltage.critical}
            />
            <Chart
              title="Core Pressure"
              value={`${sensors.pressure.current.toFixed(1)} PSI`}
              data={sensors.pressure.history}
              color="var(--yellow)"
              warnVal={sensors.pressure.warn}
              critVal={sensors.pressure.critical}
            />
            <Chart
              title="Coolant Flow"
              value={`${sensors.flow.current.toFixed(2)} L/s`}
              data={sensors.flow.history}
              color="var(--green)"
              warnVal={sensors.flow.warn}
              critVal={sensors.flow.critical}
            />
          </div>
        </div>

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
                // Ack all active alerts
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
                SYSTEM BREACH: Active cascade meltdown detected in Rotor Stator winding. Motor Core temperature exceeds {tempVal.toFixed(1)}°C threshold. Automated suppression loops initialized.
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

  // Render Engineer view layout
  const renderEngineerView = () => {
    return (
      <div className="center-body" style={{ flex: "1 0 auto", display: "flex", flexDirection: "column", gap: "16px", overflowY: "visible" }}>
        
        {/* Navigation Tab Menu */}
        <div className="eng-tabs">
          <button className={`eng-tab ${activeTab === "trends" ? "active" : ""}`} onClick={() => setActiveTab("trends")}>📈 LIVE TRENDS</button>
          <button className={`eng-tab ${activeTab === "diagnostics" ? "active" : ""}`} onClick={() => setActiveTab("diagnostics")}>🔍 DIAGNOSTICS</button>
          <button className={`eng-tab ${activeTab === "health" ? "active" : ""}`} onClick={() => setActiveTab("health")}>🛡️ COMPONENT HEALTH</button>
          <button className={`eng-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>🕐 EVENT HISTORY</button>
        </div>

        {/* Tab 1: Live Trends (Renders all 6 telemetry graphs at once) */}
        {activeTab === "trends" && (
          <div className="chart-grid fade-in">
            <Chart
              title="Motor Core Temperature"
              value={`${tempVal.toFixed(1)}°C`}
              data={sensors.motor.history}
              color="var(--red)"
              warnVal={sensors.motor.warn}
              critVal={sensors.motor.critical}
            />
            <Chart
              title="System Main Voltage"
              value={`${voltVal.toFixed(1)}V`}
              data={sensors.voltage.history}
              color="var(--blue)"
              warnVal={sensors.voltage.warn}
              critVal={sensors.voltage.critical}
            />
            <Chart
              title="System Core Pressure"
              value={`${pressVal.toFixed(1)} PSI`}
              data={sensors.pressure.history}
              color="var(--yellow)"
              warnVal={sensors.pressure.warn}
              critVal={sensors.pressure.critical}
            />
            <Chart
              title="Coolant Flow Rate"
              value={`${flowVal.toFixed(2)} L/s`}
              data={sensors.flow.history}
              color="var(--green)"
              warnVal={sensors.flow.warn}
              critVal={sensors.flow.critical}
            />
            <Chart
              title="Rotor Vibration"
              value={`${vibVal.toFixed(2)}g`}
              data={sensors.vibration.history}
              color="var(--accent)"
              warnVal={sensors.vibration.warn}
              critVal={sensors.vibration.critical}
            />
            <Chart
              title="Induction Current"
              value={`${currVal.toFixed(1)}A`}
              data={sensors.current.history}
              color="var(--purple)"
              warnVal={sensors.current.warn}
              critVal={sensors.current.critical}
            />
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
                title="Motor Temp Instrument"
                value={tempVal}
                max={120}
                unit="°C"
                warnLimit={sensors.motor.warn}
                critLimit={sensors.motor.critical}
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
                  <tr>
                    <td>Secondary Rotor Shaft</td>
                    <td className="status-good">ONLINE / NORMAL</td>
                    <td>{((vibVal / 3) * 100).toFixed(0)}%</td>
                    <td>12 ms</td>
                    <td>99.98%</td>
                  </tr>
                  <tr>
                    <td>Cooling Liquid Circuit</td>
                    <td className={tempVal > 85 ? "status-bad" : tempVal > 75 ? "status-warn" : "status-good"}>
                      {tempVal > 85 ? "CRIT OVERHEAT" : tempVal > 75 ? "TEMP WARNING" : "ONLINE / NOMINAL"}
                    </td>
                    <td>{((tempVal / 120) * 100).toFixed(0)}%</td>
                    <td>35 ms</td>
                    <td>99.42%</td>
                  </tr>
                  <tr>
                    <td>Fluid Intake Valve</td>
                    <td className={pressVal > 120 ? "status-bad" : "status-good"}>
                      {pressVal > 120 ? "VALVE OVERPRESSURE" : "ONLINE / NOMINAL"}
                    </td>
                    <td>{((pressVal / 150) * 100).toFixed(0)}%</td>
                    <td>4 ms</td>
                    <td>99.91%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Health - High Impact Gauges utilized */}
        {activeTab === "health" && (
          <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <Gauge title="Rotor Shaft Integrity" value={100 - (vibVal / 5) * 100} max={100} unit="%" warnLimit={30} critLimit={15} />
            <Gauge title="Coolant Pump Head" value={(flowVal / 10) * 100} max={100} unit="%" warnLimit={35} critLimit={20} />
            <Gauge title="Intake Valve Margin" value={100 - (pressVal / 150) * 100} max={100} unit="%" warnLimit={40} critLimit={25} />
            <Gauge title="Winding Energy Factor" value={100 - (currVal / 30) * 100} max={100} unit="%" warnLimit={40} critLimit={20} />
          </div>
        )}

        {/* Tab 4: Chronological Event History */}
        {activeTab === "history" && (
          <div className="fade-in">
            <Timeline mode={mode} />
          </div>
        )}

        {/* Engineering log filter section (always rendered for deep diagnostics) */}
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

  // Render Manager view layout
  const renderManagerView = () => {
    return (
      <div className="center-body" style={{ flex: "1 0 auto", display: "flex", flexDirection: "column", gap: "16px", overflowY: "visible" }}>
        
        {/* TOP: KPI Summary Block */}
        <div className="manager-kpi">
          <div className="kpi-card fade-in">
            <span className="kpi-val" style={{ color: "var(--green)" }}>99.78%</span>
            <div className="kpi-label">GRID RUNTIME UPTIME</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.05s" }}>
            <span className="kpi-val" style={{ color: "var(--yellow)" }}>
              {mode.toLowerCase() === "failure" ? "3" : mode.toLowerCase() === "warning" ? "1" : "0"}
            </span>
            <div className="kpi-label">ACTIVE SEVERE FAULTS</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="kpi-val" style={{ color: "var(--blue)" }}>94.2%</span>
            <div className="kpi-label">AI PREDICTIVE CONFIDENCE</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.15s" }}>
            <span className="kpi-val" style={{ color: "var(--green)" }}>1.2s</span>
            <div className="kpi-label">OPERATOR RESPONSE SPEED</div>
          </div>
        </div>

        {/* MIDDLE-TOP: Max 2 circular gauges for high impact */}
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
            title="Overall Health Index"
            value={healthScore}
            max={100}
            unit="%"
            warnLimit={45}
            critLimit={35}
          />
        </div>

        {/* MIDDLE: CENTRALIZED PLANT CORE METRICS GRID PANEL */}
        <div className="eng-section fade-in">
          <div className="gauge-title" style={{ marginBottom: "16px", borderBottom: "none" }}>
            ◆ CENTRALIZED PLANT CORE METRICS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            
            <div className="kpi-card" style={{ padding: "16px" }}>
              <div className="kpi-label">MOTOR TEMP</div>
              <div className="kpi-val" style={{ fontSize: "1.45rem", color: tempVal >= sensors.motor.critical ? "var(--red)" : tempVal >= sensors.motor.warn ? "var(--yellow)" : "var(--green)" }}>
                {tempVal.toFixed(1)}°C
              </div>
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                LIMIT: {sensors.motor.critical}°C MAX
              </div>
            </div>

            <div className="kpi-card" style={{ padding: "16px" }}>
              <div className="kpi-label">LINE VOLTAGE</div>
              <div className="kpi-val" style={{ fontSize: "1.45rem", color: voltVal >= sensors.voltage.critical ? "var(--red)" : voltVal >= sensors.voltage.warn ? "var(--yellow)" : "var(--green)" }}>
                {voltVal.toFixed(1)}V
              </div>
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                LIMIT: {sensors.voltage.critical}V MAX
              </div>
            </div>

            <div className="kpi-card" style={{ padding: "16px" }}>
              <div className="kpi-label">CORE PRESSURE</div>
              <div className="kpi-val" style={{ fontSize: "1.45rem", color: pressVal >= sensors.pressure.critical ? "var(--red)" : pressVal >= sensors.pressure.warn ? "var(--yellow)" : "var(--green)" }}>
                {pressVal.toFixed(1)} PSI
              </div>
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                LIMIT: {sensors.pressure.critical} PSI MAX
              </div>
            </div>

            <div className="kpi-card" style={{ padding: "16px" }}>
              <div className="kpi-label">COOLANT FLOW</div>
              <div className="kpi-val" style={{ fontSize: "1.45rem", color: flowVal <= sensors.flow.critical ? "var(--red)" : flowVal <= sensors.flow.warn ? "var(--yellow)" : "var(--green)" }}>
                {flowVal.toFixed(2)} L/s
              </div>
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                LIMIT: {sensors.flow.critical} L/s MIN
              </div>
            </div>

            <div className="kpi-card" style={{ padding: "16px" }}>
              <div className="kpi-label">ROTOR VIBRATION</div>
              <div className="kpi-val" style={{ fontSize: "1.45rem", color: vibVal >= sensors.vibration.critical ? "var(--red)" : vibVal >= sensors.vibration.warn ? "var(--yellow)" : "var(--green)" }}>
                {vibVal.toFixed(2)}g
              </div>
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                LIMIT: {sensors.vibration.critical}g MAX
              </div>
            </div>

            <div className="kpi-card" style={{ padding: "16px" }}>
              <div className="kpi-label">INDUCTION CURRENT</div>
              <div className="kpi-val" style={{ fontSize: "1.45rem", color: currVal >= sensors.current.critical ? "var(--red)" : currVal >= sensors.current.warn ? "var(--yellow)" : "var(--green)" }}>
                {currVal.toFixed(1)}A
              </div>
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                LIMIT: {sensors.current.critical}A MAX
              </div>
            </div>

          </div>
        </div>

        {/* BOTTOM: Executive summary performance chart & Plant status grid */}
        <div className="chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          <Chart
            title="PLANT-WIDE COMBINED PERFORMANCE SUMMARY"
            value={`${(100 - currentRisk).toFixed(1)}%`}
            data={sensors.motor.history.map((val, idx) => {
              const sum = (val / 120 + sensors.voltage.history[idx] / 250) / 2;
              return 100 - sum * 100;
            })}
            color="var(--blue)"
            warnVal={60}
            critVal={40}
          />
        </div>

        <div className="eng-section fade-in">
          <div className="gauge-title" style={{ marginBottom: "12px", borderBottom: "none" }}>
            ◆ PLANT GRID SECTORS DEPLOYMENT STATUS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "10px" }}>
            <div style={{ padding: "14px", background: "rgba(5, 10, 20, 0.4)", border: "1px solid var(--border-color)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SECTOR ALPHA</div>
              <div style={{ fontWeight: 900, color: "var(--green)", fontSize: "0.8rem", marginTop: "6px" }}>🟢 NOMINAL / ONLINE</div>
            </div>
            <div style={{ padding: "14px", background: "rgba(5, 10, 20, 0.4)", border: "1px solid var(--border-color)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SECTOR BETA</div>
              <div style={{ fontWeight: 900, color: "var(--green)", fontSize: "0.8rem", marginTop: "6px" }}>🟢 STANDBY / STABLE</div>
            </div>
            <div style={{ padding: "14px", background: "rgba(5, 10, 20, 0.4)", border: "1px solid var(--border-color)", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>SECTOR GAMMA</div>
              <div style={{ 
                fontWeight: 900, 
                color: mode.toLowerCase() === "failure" ? "var(--red)" : mode.toLowerCase() === "warning" ? "var(--yellow)" : "var(--green)", 
                fontSize: "0.8rem", 
                marginTop: "6px" 
              }}>
                {mode.toLowerCase() === "failure" ? "🔴 OVERLIMIT" : mode.toLowerCase() === "warning" ? "⚠️ DRIFT ALERT" : "🟢 ONLINE / STANDARD"}
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="center" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%", width: "100%" }}>
      
      {/* Dynamic Warning / Failure Banner (Always rendered at the top when active) */}
      {(mode.toLowerCase() === "failure" || mode.toLowerCase() === "warning") && (
        <div className="prediction-banner active" style={{ flexShrink: 0 }}>
          <div className="pred-icon">
            {mode.toLowerCase() === "failure" ? "🔴" : "⚠"}
          </div>
          <div className="pred-content">
            <div className="pred-title">
              {mode.toLowerCase() === "failure"
                ? "AI PREDICTIVE ALERT: MOTOR CASCADE OVERLOAD ACTIVE"
                : "AI TELEMETRY WARN: THERMAL DRIFT EXCURSION DETECTED"}
            </div>
            <div className="pred-subtitle">
              Calculated system risk reached {currentRisk}%. Predictive telemetry algorithms forecast rotor winding cavitation.
            </div>
          </div>
        </div>
      )}

      {/* Render selected role dashboard dynamically */}
      {isOperator && renderOperatorView()}
      {isEngineer && renderEngineerView()}
      {isManager && renderManagerView()}
    </div>
  );
}

export default CenterPanel;