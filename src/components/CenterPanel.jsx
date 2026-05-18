import Gauge from "./Gauge";
import Chart from "./Charts";
import Timeline from "./Timeline";

function CenterPanel({ role, mode, sensors }) {
  const isOperator = role === "operator";
  const isManager = role === "manager";
  const isEngineer = role === "engineer";

  // Compute systemic risk and AI prediction stats dynamically matching generator thresholds
  const tempVal = sensors.motor.current;
  const vibVal = sensors.vibration.current;
  const pressVal = sensors.pressure.current;
  const voltVal = sensors.voltage.current;

  // Real-time calculated risk score matching data_generator.py logic
  let calculatedRisk = 0;
  if (tempVal > 75) calculatedRisk += 30;
  if (vibVal > 1.2) calculatedRisk += 25;
  if (pressVal > 85) calculatedRisk += 20;
  if (voltVal > 200) calculatedRisk += 15;

  const currentRisk = Math.min(calculatedRisk, 100);

  return (
    <div className="center">
      {/* MANAGER KPI SUMMARY PANEL */}
      {isManager && (
        <div className="manager-kpi" style={{ display: "grid" }}>
          <div className="kpi-card fade-in">
            <span className="kpi-val" style={{ color: "var(--green)" }}>99.78%</span>
            <div className="kpi-label">GRID RUNTIME UPTIME</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.1s" }}>
            <span className="kpi-val" style={{ color: "var(--yellow)" }}>14</span>
            <div className="kpi-label">AI BLOCKED TRANSITIONS</div>
          </div>
          <div className="kpi-card fade-in" style={{ animationDelay: "0.2s" }}>
            <span className="kpi-val" style={{ color: "var(--blue)" }}>96.4%</span>
            <div className="kpi-label">AI FILTER CONFIDENCE</div>
          </div>
        </div>
      )}

      {/* AI CRITICAL / WARNING PREDICTION HUD BANNER */}
      {(mode.toLowerCase() === "failure" || mode.toLowerCase() === "warning") && (
        <div className="prediction-banner active">
          <div className="pred-icon">
            {mode.toLowerCase() === "failure" ? "🔴" : "⚠"}
          </div>
          <div className="pred-content">
            <div className="pred-title">
              {mode.toLowerCase() === "failure" 
                ? "AI PREDICTIVE ALERT: MOTOR CASCADE BREAKDOWN ACTIVE" 
                : "AI TELEMETRY WARN: THERMAL DRIFT EXCURSION DETECTED"}
            </div>
            <div className="pred-subtitle">
              Anomalous temperature gradient correlates with a 92% probability of cooling pump cavitation.
            </div>
          </div>
        </div>
      )}

      {/* CIRCULAR GAUGES (BONUS REQ) */}
      <div className="gauge-row" style={{ display: "grid" }}>
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

      {/* REAL-TIME CHARTS GRID */}
      <div className="chart-grid">
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
          value={`${sensors.flow.current.toFixed(2)} L/s`} 
          data={sensors.flow.history} 
          color="var(--green)" 
          warnVal={sensors.flow.warn} 
          critVal={sensors.flow.critical} 
        />
      </div>

      {/* ENGINEER VIEW DIAGNOSTIC LOG TABLE */}
      {isEngineer && (
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
                  {tempVal > 85 ? "CRIT OVERHEAT" : tempVal > 75 ? "TEMP WARNING" : "ONLINE / STANDARD"}
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
      )}

      {/* CHRONOLOGICAL EVENT TIMELINE */}
      <Timeline mode={mode} />
    </div>
  );
}

export default CenterPanel;
