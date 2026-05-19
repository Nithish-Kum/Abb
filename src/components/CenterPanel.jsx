import { useState, useEffect } from "react";
import Gauge from "./Gauge";
import Chart from "./Charts";
import Timeline from "./Timeline";

function LinearSCADAIndicator({ title, value, max = 100, unit = "%", warnLimit = 70, critLimit = 85 }) {
  const score = Math.min(Math.max(0, value), max);
  const fillPct = (score / max) * 100;

  let barColor = "#10b981";
  if (score >= critLimit) {
    barColor = "#ef4444";
  } else if (score >= warnLimit) {
    barColor = "#f59e0b";
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
      <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-cyan/60 uppercase">
        <span>◆ {title}</span>
        <span className="font-bold font-display" style={{ color: barColor }}>
          {score.toFixed(1)}{unit}
        </span>
      </div>
      <div className="w-full bg-cyan/5 h-1.5 rounded-full overflow-hidden mt-1">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${fillPct}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 10px ${barColor}`
          }}
        />
      </div>
      <div className="flex justify-between font-mono text-[8px] text-cyan/40 mt-1">
        <span>MIN: 0</span>
        <span>WARN: {warnLimit}</span>
        <span>CRIT: {critLimit}</span>
        <span>MAX: {max}</span>
      </div>
    </div>
  );
}

function CenterPanel({ role, mode, selectedMachineId, setSelectedMachineId, machinesData, alerts = [], ackAlert, alarmDismissed, setAlarmDismissed }) {
  const isOperator = role === "operator";
  const isManager = role === "manager";
  const isEngineer = role === "engineer";

  const [loadReduced, setLoadReduced] = useState(false);

  // Low-code Machine Builder states
  const [machineName, setMachineName] = useState("");
  const [machineId, setMachineId] = useState("");
  const [datasetName, setDatasetName] = useState("");
  const [sensorsList, setSensorsList] = useState([
    { name: "", display: "", unit: "", warning: "", critical: "", max: "" }
  ]);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const handleNameChange = (val) => {
    setMachineName(val);
    const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
    setMachineId(slug);
    setDatasetName(`${slug}_data.csv`);
  };

  const handleCreateMachine = (e) => {
    e.preventDefault();
    if (!machineName.trim() || !machineId.trim() || !datasetName.trim()) {
      setStatusMsg({ type: "error", text: "🔴 Error: All machine identification fields are required!" });
      return;
    }

    for (let i = 0; i < sensorsList.length; i++) {
      const s = sensorsList[i];
      if (!s.name.trim()) {
        setStatusMsg({ type: "error", text: `🔴 Error: Sensor #${i + 1} must have a name!` });
        return;
      }
    }

    const payload = {
      machineName: machineName.trim(),
      machineId: machineId.trim(),
      dataset: datasetName.trim(),
      sensors: sensorsList.map(s => {
        const sId = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
        return {
          id: sId,
          name: s.display.trim() || s.name.toUpperCase().replace("_", " "),
          unit: s.unit.trim() || "",
          warn: Number(s.warning) || 80,
          critical: Number(s.critical) || 100,
          max: Number(s.max) || 120
        };
      })
    };

    fetch("/api/add-machine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error("Server error saving config file");
        return res.json();
      })
      .then(() => {
        setStatusMsg({ type: "success", text: `🟢 Success: ${machineName} onboarding configuration generated and saved successfully!` });
        setMachineName("");
        setMachineId("");
        setDatasetName("");
        setSensorsList([{ name: "", display: "", unit: "", warning: "", critical: "", max: "" }]);
        if (typeof window.onMachineCreated === "function") {
          window.onMachineCreated();
        }
      })
      .catch(err => {
        setStatusMsg({ type: "error", text: `🔴 Error: Failed to save machine: ${err.message}` });
      });
  };

  // Engineer view states
  const [activeTab, setActiveTab] = useState("trends"); // trends | diagnostics | health | history
  const [logFilter, setLogFilter] = useState("all"); // all | info | warning | critical

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
    // -------------------------------------------------------------
    // Live Telemetry Calculations & Fallbacks for Digital Twin
    // -------------------------------------------------------------
    let twinRPM = 0;
    let twinVibration = 0;
    let twinTemperature = 0;

    if (selectedMachineId === "motor") {
      twinTemperature = tempVal || 70;
      twinVibration = vibVal || 1.2;
      twinRPM = 1500 + currVal * 40;
    } else if (selectedMachineId === "pump") {
      const flowVal = sensorArray[0]?.current || 4.0;
      const pressVal = sensorArray[1]?.current || 90;
      const effVal = sensorArray[2]?.current || 85;

      twinRPM = 1000 + flowVal * 250;
      twinVibration = pressVal / 85;
      twinTemperature = 45 + (100 - effVal) * 1.5;
    } else if (selectedMachineId === "generator") {
      const powerVal = sensorArray[0]?.current || 220;
      const loadVal = sensorArray[1]?.current || 60;
      const freqVal = sensorArray[2]?.current || 50;

      twinRPM = 3000 * (freqVal / 50);
      twinVibration = 0.5 + (loadVal / 70);
      twinTemperature = 40 + powerVal * 0.12;
    } else {
      twinTemperature = 70;
      twinVibration = 1.2;
      twinRPM = 1500;
    }

    // Secondary calculated metrics
    const bearingHealth = Math.max(10, Math.min(99, Math.round(100 - (twinVibration * 15) - (Math.max(0, twinTemperature - 70) * 0.6))));
    const rotorAlignment = Math.max(10, Math.min(99, Math.round(100 - (twinVibration * 20))));
    const coolingEfficiency = Math.max(10, Math.min(99, Math.round(100 - (twinTemperature * 0.5) - (twinRPM > 2000 ? 8 : 0))));
    
    let powerStability = 95;
    if (selectedMachineId === "generator") {
      const freqVal = sensorArray[2]?.current || 50;
      powerStability = Math.max(10, Math.min(99, Math.round(100 - Math.abs(50 - freqVal) * 25)));
    } else {
      powerStability = Math.max(10, Math.min(99, Math.round(100 - Math.abs(220 - voltVal) * 1.5)));
    }

    // Dynamic State Colors and Speed
    const twinMode = mode.toLowerCase();
    let twinColor = "#10b981";
    let twinColorRgba = "rgba(16,185,129,0.4)";
    let twinRotateClass = "twin-rotate-stable";
    let baseRotationTime = 10; // seconds
    let pulseDuration = "3s";

    if (twinMode === "warning") {
      twinColor = "#f59e0b";
      twinColorRgba = "rgba(245,158,11,0.45)";
      twinRotateClass = "twin-rotate-wobble";
      baseRotationTime = 6;
      pulseDuration = "1.5s";
    } else if (twinMode === "failure") {
      twinColor = "#ef4444";
      twinColorRgba = "rgba(239,68,68,0.55)";
      twinRotateClass = "twin-rotate-shake";
      baseRotationTime = 3;
      pulseDuration = "0.6s";
    } else if (twinMode === "recovery") {
      twinColor = "#3b82f6";
      twinColorRgba = "rgba(59,130,246,0.45)";
      twinRotateClass = "twin-rotate-stable";
      baseRotationTime = 12;
      pulseDuration = "4.0s";
    }

    const rotationDuration = `${(baseRotationTime / (twinRPM / 1500)).toFixed(2)}s`;
    const ringThickness = `${Math.max(1.5, (currentRisk / 100) * 6)}px`;
    const ringGlow = `${Math.max(10, (currentRisk / 100) * 35)}px`;

    // Predictive imbalance calculation
    let predictedFailureRisk = 10 + Math.round((twinVibration / 1.5) * 15);
    if (twinMode === "failure") predictedFailureRisk = 99;
    else if (twinMode === "warning") predictedFailureRisk = 65 + Math.round((twinVibration / 3.0) * 15);
    else if (twinMode === "recovery") predictedFailureRisk = 35 - Math.round((twinVibration) * 10);
    predictedFailureRisk = Math.max(5, Math.min(99, predictedFailureRisk));

    let riskColorClass = "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
    let riskLabel = "LOW RISK";
    if (predictedFailureRisk >= 75) {
      riskColorClass = "text-red-500 border-red-500/30 bg-red-500/5";
      riskLabel = "CRITICAL RISK";
    } else if (predictedFailureRisk >= 40) {
      riskColorClass = "text-amber-500 border-amber-500/30 bg-amber-500/5";
      riskLabel = "MODERATE RISK";
    }

    return (
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6 bg-[#050816]/30">

        {/* Centered Machine Title Segment */}
        <div className="flex items-center justify-center p-4 rounded-xl border border-cyan/15 bg-black/40 backdrop-blur-xl relative z-10">
          <div className="font-display font-black text-sm tracking-[0.3em] text-white uppercase text-center">
             ◆ {activeMachine?.name || "SYSTEM STATION"} ◆
          </div>
        </div>

        {/* Real-time Operator grid: Main Recharts area chart, 3D Core Model, and Risk Score Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Chart
            title={`${activeMachine?.name || "SYSTEM"} ${tempSensor.name.toUpperCase()} (PRIMARY FOCUS)`}
            value={`${tempVal.toFixed(1)}${tempSensor.unit}`}
            data={tempSensor.history}
            color="#ef4444"
            warnVal={tempSensor.warn}
            critVal={tempSensor.critical}
          />

          {/* Interactive animated 3D Telemetry-Driven HMI Digital Twin */}
          <div 
            className="bg-card/50 backdrop-blur-xl border border-cyan/15 p-4 rounded-xl flex flex-col justify-between gap-4 relative z-10 hover:border-cyan/30 transition-all duration-300 min-h-[380px] tilt select-none"
            style={{
              "--twin-color": twinColor,
              "--twin-color-rgba": twinColorRgba,
              "--twin-rotation-speed": rotationDuration,
              "--twin-pulse-duration": pulseDuration,
              "--twin-ring-thickness": ringThickness,
              "--twin-ring-glow": ringGlow
            }}
          >
            <div className="w-full flex justify-between items-center border-b border-cyan/15 pb-2">
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#00e5ff] uppercase font-bold">◆ SCADA DIGITAL TWIN</span>
              <span 
                className="font-mono text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wider" 
                style={{ borderColor: `${twinColor}30`, backgroundColor: `${twinColor}10`, color: twinColor }}
              >
                {twinMode.toUpperCase()}
              </span>
            </div>

            {/* 3D Rotor Sphere */}
            <div className="digital-twin-container py-2 flex justify-center items-center">
              <div className={`twin-core-wrapper ${twinRotateClass}`}>
                {/* Dynamic heat pulsing glow */}
                <div className="twin-thermal-glow" style={{ background: `radial-gradient(circle, ${twinColorRgba} 0%, transparent 70%)` }} />
                
                {/* Outer dynamic risk ring */}
                <div className="twin-ring outer" />
                {/* 3D secondary intersecting core rings */}
                <div className="twin-ring mid" />
                <div className="twin-ring inner" />
              </div>
            </div>

            {/* Dynamic Calculated Live Metrics under the Twin */}
            <div className="w-full grid grid-cols-2 gap-2 text-[9px] font-mono bg-black/30 p-2.5 rounded-lg border border-cyan/10">
              <div className="flex justify-between border-r border-cyan/10 pr-2">
                <span className="text-cyan/60">BEARING HEALTH:</span>
                <span className="text-white font-bold">{bearingHealth}%</span>
              </div>
              <div className="flex justify-between pl-2">
                <span className="text-cyan/60">ALIGNMENT:</span>
                <span className="text-white font-bold">{rotorAlignment}%</span>
              </div>
              <div className="flex justify-between border-r border-cyan/10 pr-2 pt-1 border-t border-cyan/10">
                <span className="text-cyan/60">COOLING EFF:</span>
                <span className="text-white font-bold">{coolingEfficiency}%</span>
              </div>
              <div className="flex justify-between pl-2 pt-1 border-t border-cyan/10">
                <span className="text-cyan/60">POWER STAB:</span>
                <span className="text-white font-bold">{powerStability}%</span>
              </div>
            </div>

            {/* Live Telemetry HUD Bar under metrics */}
            <div className="w-full flex justify-around items-center py-1.5 border-t border-b border-cyan/10 font-mono text-[9px] tracking-wider text-center text-white/90">
              <div>
                <span className="text-cyan/60">RPM:</span> <span className="font-bold">{twinRPM.toFixed(0)}</span>
              </div>
              <div className="border-l border-cyan/10 h-3" />
              <div>
                <span className="text-cyan/60">VIB:</span> <span className="font-bold">{twinVibration.toFixed(2)}g</span>
              </div>
              <div className="border-l border-cyan/10 h-3" />
              <div>
                <span className="text-cyan/60">TEMP:</span> <span className="font-bold">{twinTemperature.toFixed(1)}°C</span>
              </div>
            </div>

            {/* Predictive Failure Insight box */}
            <div className={`w-full p-2 rounded border text-center font-mono text-[9px] ${riskColorClass}`}>
              <div className="tracking-widest font-black uppercase text-[7px] mb-0.5">PREDICTIVE FAILURE INCIDENCE</div>
              <div className="text-white font-medium">
                Rotor imbalance risk: <span className="font-bold">{predictedFailureRisk}%</span> ({riskLabel})
              </div>
            </div>
          </div>

          <Gauge
            title="System Risk Score"
            value={currentRisk}
            max={100}
            unit="%"
            warnLimit={40}
            critLimit={70}
          />
        </div>

        {/* Supporting SCADA Telemetry Stream */}
        {sensorArray.length > 1 && (
          <div className="flex flex-col gap-4">
            <div className="font-mono text-[10px] tracking-[0.25em] text-cyan/70 uppercase">◆ SUPPORTING SYSTEM TELEMETRY (REAL-TIME READOUT)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sensorArray.slice(1).map((s, idx) => {
                const colors = ["#00e5ff", "#f59e0b", "#10b981", "#6366f1", "#ec4899"];
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
          <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#10b981] font-mono text-xs tracking-wider z-50 animate-bounce">
            ⚙️ SYSTEM LOAD REDUCED BY 25% SUCCESSFULLY (baseline throttled)
          </div>
        )}

        {/* Operator Control ACTION PANEL (BOTTOM) */}
        <div className="bg-card/40 backdrop-blur-xl border border-cyan/15 p-5 rounded-xl flex flex-col gap-4 relative z-10">
          <div className="font-display font-bold text-xs tracking-[0.2em] text-white uppercase">⚡ OPERATOR MANUAL INTERVENTION PANEL</div>
          <div className="flex flex-wrap gap-4">
            <button
              className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500 text-white font-mono text-[10px] tracking-wider uppercase cursor-pointer transition-all duration-300"
              onClick={() => {
                setAlarmDismissed(true);
                alerts.forEach(a => ackAlert(a.id));
              }}
            >
              ✓ Acknowledge Alarm
            </button>
            <button
              className={`px-4 py-2 rounded-lg border font-mono text-[10px] tracking-wider uppercase cursor-pointer transition-all duration-300 ${loadReduced ? "bg-amber-500/20 border-amber-500 text-white" : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500 text-white"}`}
              onClick={() => {
                setLoadReduced(true);
                setTimeout(() => setLoadReduced(false), 3000);
              }}
            >
              ⚙ Reduce Load
            </button>
            {mode.toLowerCase() === "failure" && (
              <button
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-500 text-white font-mono text-[10px] tracking-wider uppercase cursor-pointer transition-all duration-300 animate-pulse"
                onClick={() => {
                  alert("⛔ EMERGENCY SHUTDOWN COMMAND ISSUED TO MAIN GRID RELAYS!");
                }}
              >
                ⛔ Emergency Stop
              </button>
            )}
          </div>
        </div>

      </div>
    );
  };

  // Render Engineer view layout with tabs and target machine switcher
  const renderEngineerView = () => {
    return (
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6 bg-[#050816]/30">

        {/* Sleek ENGINEER Machine switcher tabs */}
        <div className="flex items-center gap-4 border-b border-cyan/15 pb-4 flex-wrap">
          <span className="font-mono text-[10px] tracking-wider text-cyan/50">
            📡 ACTIVE TARGET SWITCHER:
          </span>
          <div className="flex gap-2.5 flex-wrap">
            {Object.keys(machinesData).map(mId => {
              const m = machinesData[mId];
              const isActive = selectedMachineId === mId;
              let neonColor = "#10b981";
              let btnClass = "bg-emerald-500/10 border-emerald-500/35 hover:border-emerald-500 text-[#10b981]";
              if (m.mode === "failure") {
                // Failure -> Yellow color
                neonColor = "#f59e0b";
                btnClass = "bg-amber-500/10 border-amber-500/35 hover:border-amber-500 text-[#f59e0b]";
              } else if (m.mode === "warning") {
                // Warning -> Red color
                neonColor = "#ef4444";
                btnClass = "bg-red-500/10 border-red-500/35 hover:border-red-500 text-[#ef4444]";
              }

              const hasAlert = m.mode !== "normal";
              const currentBtnStyle = hasAlert ? btnClass : (isActive ? "bg-emerald-500/10 border-emerald-500/35 hover:border-emerald-500 text-[#10b981]" : "border-cyan/10 bg-transparent text-cyan/70 hover:border-cyan/40 hover:text-white");
              const glowShadow = hasAlert || isActive ? `shadow-[0_0_10px_${neonColor}40]` : "";

              return (
                <button
                  key={mId}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[9px] tracking-wider uppercase cursor-pointer transition-all duration-300 ${currentBtnStyle} ${glowShadow}`}
                  onClick={() => setSelectedMachineId(mId)}
                >
                  ◆ {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Tab Menu */}
        <div className="flex border-b border-cyan/10 gap-2">
          {["trends", "diagnostics", "health", "history", "configuration"].map((tab) => {
            const labels = {
              trends: "📈 LIVE TRENDS",
              diagnostics: "🔍 DIAGNOSTICS",
              health: "🛡️ COMPONENT HEALTH",
              history: "🕐 EVENT HISTORY",
              configuration: "⚙️ ADD MACHINE"
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                className={`px-4 py-2 border-b-2 font-mono text-[10px] tracking-wider uppercase transition-all duration-300 cursor-pointer ${isActive ? "border-cyan text-white bg-cyan/5" : "border-transparent text-cyan/50 hover:text-white hover:bg-cyan/5"}`}
                onClick={() => setActiveTab(tab)}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Live Trends (Renders telemetry graphs dynamically) */}
        {activeTab === "trends" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensorArray.map((s, idx) => {
              const colors = ["#ef4444", "#00e5ff", "#f59e0b", "#10b981", "#6366f1", "#ec4899"];
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
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div className="bg-card/40 backdrop-blur-xl border border-cyan/15 p-5 rounded-xl flex flex-col gap-4 relative z-10">
              <div className="font-mono text-[10px] tracking-[0.2em] text-cyan/60 uppercase">
                ◆ SCI-FI DIAGNOSTICS - DETAILED CORE LOG
              </div>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyan/15 bg-black/40">
                      <th className="text-[10px] text-cyan/70 font-mono tracking-wider p-3">SUB-SYSTEM CHANNEL</th>
                      <th className="text-[10px] text-cyan/70 font-mono tracking-wider p-3">INTEGRITY STATUS</th>
                      <th className="text-[10px] text-cyan/70 font-mono tracking-wider p-3">OPERATIONAL LOAD</th>
                      <th className="text-[10px] text-cyan/70 font-mono tracking-wider p-3">LATENCY</th>
                      <th className="text-[10px] text-cyan/70 font-mono tracking-wider p-3">BASELINE ACCURACY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensorArray.map((s, idx) => {
                      const isWarn = s.current >= s.warn;
                      const isCrit = s.current >= s.critical;
                      const statusClass = isCrit ? "text-[#ef4444] font-black" : isWarn ? "text-[#f59e0b] font-bold" : "text-[#10b981]";
                      const statusText = isCrit ? "CRIT OVERLIMIT" : isWarn ? "WARNING SHIFT" : "ONLINE / NOMINAL";
                      const pct = s.max > 0 ? ((s.current / s.max) * 100).toFixed(0) : 0;

                      const latencies = [12, 35, 4, 18, 22];
                      const latency = latencies[idx % latencies.length];
                      const accuracies = ["99.98%", "99.42%", "99.91%", "99.85%", "99.94%"];
                      const accuracy = accuracies[idx % accuracies.length];

                      return (
                        <tr key={s.id} className="border-b border-cyan/5 hover:bg-cyan/5 transition-all">
                          <td className="text-[10px] text-white p-3 font-mono">{s.name}</td>
                          <td className={`text-[10px] p-3 font-mono ${statusClass}`}>{statusText}</td>
                          <td className="text-[10px] text-white p-3 font-mono">{pct}%</td>
                          <td className="text-[10px] text-white p-3 font-mono">{latency} ms</td>
                          <td className="text-[10px] text-white p-3 font-mono">{accuracy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Health - High Impact Gauges utilized */}
        {activeTab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Tab 5: Low-Code Machine Builder */}
        {activeTab === "configuration" && (
          <div className="bg-card/40 backdrop-blur-xl border border-cyan/15 p-6 rounded-xl flex flex-col gap-6 relative z-10 fade-in select-none">
            <div className="border-b border-cyan/15 pb-3">
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#00e5ff] uppercase font-bold">◆ SCADA CONFIGURATION CONTROL</span>
              <h3 className="font-display font-black text-sm text-white tracking-widest uppercase mt-1">⚙️ LOW-CODE MACHINE ONBOARDING FORM</h3>
            </div>

            <form onSubmit={handleCreateMachine} className="flex flex-col gap-5">
              {statusMsg.text && (
                <div className={`p-3 rounded-lg border font-mono text-[10px] uppercase tracking-wider ${statusMsg.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-[#10b981]" : "bg-red-500/10 border-red-500/30 text-[#ef4444]"}`}>
                  {statusMsg.text}
                </div>
              )}

              {/* Grid 1: Basic Machine identification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] text-cyan/60 uppercase tracking-widest">Machine Name</label>
                  <input
                    type="text"
                    value={machineName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Boiler"
                    className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_8px_rgba(0,229,255,0.15)] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] text-cyan/60 uppercase tracking-widest">Machine ID</label>
                  <input
                    type="text"
                    value={machineId}
                    onChange={(e) => setMachineId(e.target.value)}
                    placeholder="e.g. boiler"
                    className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_8px_rgba(0,229,255,0.15)] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[8px] text-cyan/60 uppercase tracking-widest">Dataset Name</label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g. boiler_data.csv"
                    className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_8px_rgba(0,229,255,0.15)] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                    required
                  />
                </div>
              </div>

              {/* Sensors List Builder Section */}
              <div className="flex flex-col gap-3 mt-2 border-t border-cyan/10 pt-4">
                <span className="font-mono text-[9px] tracking-wider text-cyan font-bold uppercase">◆ CONFIGURED SENSORS SECTION</span>

                <div className="flex flex-col gap-4">
                  {sensorsList.map((s, idx) => (
                    <div key={idx} className="bg-black/20 border border-cyan/5 p-4 rounded-lg flex flex-col gap-3 relative">
                      {sensorsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSensorsList(sensorsList.filter((_, i) => i !== idx))}
                          className="absolute top-3 right-3 text-cyan/40 hover:text-red-500 font-mono text-[10px] uppercase tracking-wider transition-colors duration-300 cursor-pointer"
                        >
                          ✕ Remove
                        </button>
                      )}
                      
                      <div className="font-mono text-[8px] text-cyan/40">SENSOR #{idx + 1}</div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="font-mono text-[8px] text-cyan/50 uppercase">Sensor Name (ID)</label>
                          <input
                            type="text"
                            value={s.name}
                            onChange={(e) => {
                              const list = [...sensorsList];
                              list[idx].name = e.target.value;
                              if (!list[idx].display) {
                                list[idx].display = e.target.value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                              }
                              setSensorsList(list);
                            }}
                            placeholder="e.g. temperature"
                            className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_6px_rgba(0,229,255,0.15)] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-mono text-[8px] text-cyan/50 uppercase">Display Label</label>
                          <input
                            type="text"
                            value={s.display}
                            onChange={(e) => {
                              const list = [...sensorsList];
                              list[idx].display = e.target.value;
                              setSensorsList(list);
                            }}
                            placeholder="e.g. Boiler Temp"
                            className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_6px_rgba(0,229,255,0.15)] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-mono text-[8px] text-cyan/50 uppercase">Unit</label>
                          <input
                            type="text"
                            value={s.unit}
                            onChange={(e) => {
                              const list = [...sensorsList];
                              list[idx].unit = e.target.value;
                              setSensorsList(list);
                            }}
                            placeholder="e.g. °C"
                            className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_6px_rgba(0,229,255,0.15)] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-mono text-[8px] text-cyan/50 uppercase">Warn Limit</label>
                          <input
                            type="number"
                            value={s.warning}
                            onChange={(e) => {
                              const list = [...sensorsList];
                              list[idx].warning = e.target.value;
                              setSensorsList(list);
                            }}
                            placeholder="e.g. 90"
                            className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_6px_rgba(0,229,255,0.15)] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-mono text-[8px] text-cyan/50 uppercase">Critical Limit</label>
                          <input
                            type="number"
                            value={s.critical}
                            onChange={(e) => {
                              const list = [...sensorsList];
                              list[idx].critical = e.target.value;
                              setSensorsList(list);
                            }}
                            placeholder="e.g. 110"
                            className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_6px_rgba(0,229,255,0.15)] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-mono text-[8px] text-cyan/50 uppercase">Max Value</label>
                          <input
                            type="number"
                            value={s.max}
                            onChange={(e) => {
                              const list = [...sensorsList];
                              list[idx].max = e.target.value;
                              setSensorsList(list);
                            }}
                            placeholder="e.g. 150"
                            className="bg-black/30 border border-cyan/10 focus:border-cyan focus:shadow-[0_0_6px_rgba(0,229,255,0.15)] rounded px-2 py-1 text-white font-mono text-xs focus:outline-none transition-all duration-300 placeholder:text-white/20"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setSensorsList([...sensorsList, { name: "", display: "", unit: "", warning: "", critical: "", max: "" }])}
                    className="px-4 py-2 bg-cyan/10 hover:bg-cyan/20 border border-cyan/35 hover:border-cyan text-white font-mono text-[9px] tracking-wider uppercase rounded-xl transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.1)]"
                  >
                    + Add Sensor
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 hover:border-emerald-500 text-white font-mono text-[9px] tracking-wider uppercase rounded-xl transition-all duration-300 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)] ml-auto"
                  >
                    Create Machine
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Engineering log filter section */}
        <div className="bg-card/40 backdrop-blur-xl border border-cyan/15 p-5 rounded-xl flex flex-col gap-4 relative z-10">
          <div className="font-mono text-[10px] tracking-[0.2em] text-cyan/60 uppercase">
            ⚙️ SCADA TELEMETRY LOG BUFFER
          </div>

          <div className="flex gap-2 flex-wrap">
            {["all", "info", "warning", "critical"].map((filter) => (
              <button
                key={filter}
                className={`px-3 py-1 rounded border font-mono text-[9px] tracking-wider uppercase cursor-pointer transition-all duration-300 ${logFilter === filter ? "bg-cyan/25 border-cyan text-white" : "border-cyan/15 bg-transparent text-cyan/50 hover:border-cyan/40 hover:text-white"}`}
                onClick={() => setLogFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 bg-black/30 p-3 rounded-lg border border-cyan/5">
            {filteredLogs.map((log, i) => {
              let logColor = "text-[#10b981]";
              if (log.type === "crit") logColor = "text-[#ef4444]";
              else if (log.type === "warn") logColor = "text-[#f59e0b]";
              return (
                <div key={i} className="flex justify-between items-center text-[10px] font-mono leading-relaxed border-b border-cyan/5 pb-1">
                  <div className="flex gap-2.5 items-center flex-wrap">
                    <span className="text-cyan/50">[{log.time}]</span>
                    <span className="text-cyan font-bold uppercase">[{log.module}]</span>
                    <span className="text-white/90">{log.msg}</span>
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${logColor}`}>
                    {log.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Manager view layout: Executive Dashboard showing ALL machines concurrently
  const renderManagerView = () => {
    return (
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-6 bg-[#050816]/30">

        {/* Top Operational Status KPI strip */}
        <div className="grid-cols-4-fix">
          {(() => {
            const motorRisk = machinesData.motor?.risk || 0;
            const pumpRisk = machinesData.pump?.risk || 0;
            const genRisk = machinesData.generator?.risk || 0;
            const avgRisk = (motorRisk + pumpRisk + genRisk) / 3;
            const uptime = 100 - avgRisk * 0.2;
            const predictiveRiskSync = 100 - avgRisk;

            let latency = 0.8 + (Math.sin(Date.now() / 25000) * 0.15 + 0.15); // Base: 0.8 to 1.1s
            const activeFailures = Object.values(machinesData).filter(m => m.mode === "failure").length;
            const activeWarns = Object.values(machinesData).filter(m => m.mode === "warning").length;
            latency += activeFailures * 0.65 + activeWarns * 0.22;
            latency = Math.min(2.5, Math.max(0.8, latency));

            return (
              <>
                <div className="bg-card/50 backdrop-blur-xl border border-cyan/15 p-4 rounded-xl flex flex-col gap-1 hover:border-cyan/30 transition-all duration-300 tilt">
                  <span className="font-display text-2xl font-bold tracking-tight text-[#10b981]">{uptime.toFixed(2)}%</span>
                  <div className="font-mono text-[9px] tracking-wider text-cyan/60 uppercase">GRID RUNTIME UPTIME</div>
                </div>
                <div className="bg-card/50 backdrop-blur-xl border border-cyan/15 p-4 rounded-xl flex flex-col gap-1 hover:border-cyan/30 transition-all duration-300 tilt">
                  <span className="font-display text-2xl font-bold tracking-tight text-[#ef4444]">
                    {activeFailures}
                  </span>
                  <div className="font-mono text-[9px] tracking-wider text-cyan/60 uppercase">ACTIVE SEVERE FAILURES</div>
                </div>
                <div className="bg-card/50 backdrop-blur-xl border border-cyan/15 p-4 rounded-xl flex flex-col gap-1 hover:border-cyan/30 transition-all duration-300 tilt">
                  <span className="font-display text-2xl font-bold tracking-tight text-[#6366f1]">{predictiveRiskSync.toFixed(1)}%</span>
                  <div className="font-mono text-[9px] tracking-wider text-cyan/60 uppercase">AI PREDICTIVE RISK SYNCS</div>
                </div>
                <div className="bg-card/50 backdrop-blur-xl border border-cyan/15 p-4 rounded-xl flex flex-col gap-1 hover:border-cyan/30 transition-all duration-300 tilt">
                  <span className="font-display text-2xl font-bold tracking-tight text-[#f59e0b]">{latency.toFixed(2)}s</span>
                  <div className="font-mono text-[9px] tracking-wider text-cyan/60 uppercase">AVERAGE RESPONSE LATENCY</div>
                </div>
              </>
            );
          })()}
        </div>

        {/* EXECUTIVE GRID: MULTI-MACHINE MONITORS */}
        <div className="font-mono text-[10px] tracking-[0.25em] text-cyan/70 uppercase">
          ◆ EXECUTIVE PLANT MONITORS (ALL MACHINERY ACTIVE SEGMENTS)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {Object.keys(machinesData).map(mId => {
            const m = machinesData[mId];
            const mSensors = m.sensors;

            // Directly align manager overview cards with live CSV status
            let activeMode = m.mode;

            let borderNeon = "border-emerald-500/20";
            let textGlow = "#10b981";
            let bgRgba = "rgba(16,185,129,0.1)";
            let cardShakeClass = "";

            if (activeMode === "failure") {
              // Failure -> Red (per request) and shakes aggressively
              borderNeon = "border-red-500/60 hover:border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]";
              textGlow = "#ef4444";
              bgRgba = "rgba(239,68,68,0.12)";
              cardShakeClass = "card-shake-failure card-border-failure";
            } else if (activeMode === "warning") {
              // Warning -> Yellow/Amber (per request) and wobbles
              borderNeon = "border-amber-500/50 hover:border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]";
              textGlow = "#f59e0b";
              bgRgba = "rgba(245,158,11,0.12)";
              cardShakeClass = "card-shake-warning card-border-warning";
            } else if (activeMode === "recovery") {
              // Recovery -> Blue (per request)
              borderNeon = "border-blue-500/50 hover:border-blue-500 shadow-[0_0_15px_rgba(0,229,255,0.2)]";
              textGlow = "#00e5ff";
              bgRgba = "rgba(0,229,255,0.12)";
              cardShakeClass = "card-border-recovery";
            }

            return (
              <div
                key={mId}
                className={`bg-card/50 backdrop-blur-xl border ${borderNeon} p-5 rounded-2xl flex flex-col gap-4 relative z-10 transition-all duration-300 hover:border-cyan/30 tilt ${cardShakeClass}`}
                style={{
                  boxShadow: activeMode !== "normal" ? `0 0 15px ${textGlow}25` : "none"
                }}
              >
                <div className="flex justify-between items-center border-b border-cyan/15 pb-3">
                  <div>
                    <div className="font-mono text-[9px] text-cyan/50 uppercase tracking-widest">STATION segment</div>
                    <div className="font-display font-bold text-sm text-white tracking-wide">{m.name}</div>
                  </div>
                  <span
                    className="px-2.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold border transition-colors duration-300"
                    style={{
                      background: bgRgba,
                      color: textGlow,
                      borderColor: textGlow,
                      boxShadow: `0 0 8px ${textGlow}30`
                    }}
                  >
                    {activeMode}
                  </span>
                </div>

                {/* Body section: Left = Circular Gauge, Right = HUD readouts */}
                <div className="flex items-center justify-between gap-4 py-2">
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
                      <div className="relative flex items-center justify-center w-[100px] h-[100px] bg-black/20 rounded-full border border-cyan/5">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            className="text-cyan/5"
                            strokeWidth="6"
                            stroke="currentColor"
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className="transition-all duration-1000"
                            strokeWidth="6"
                            strokeDasharray={251.2}
                            strokeDashoffset={251.2 - (251.2 * healthPct) / 100}
                            strokeLinecap="round"
                            stroke={textGlow}
                            fill="transparent"
                            r="40"
                            cx="50"
                            cy="50"
                            style={{
                              filter: `drop-shadow(0 0 6px ${textGlow})`
                            }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <div className="font-display font-black text-xs tracking-tight" style={{ color: textGlow }}>
                            {healthPct}%
                          </div>
                          <div className="text-[6px] font-mono text-cyan/50 tracking-widest uppercase">
                            {circleMeaning.split(" ")[0]}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Right Column: Dynamic Live Synchronized Metrics */}
                  <div className="flex-1 flex flex-col gap-1.5 bg-black/20 p-3 rounded-xl border border-cyan/5">
                    {(() => {
                      let displaySensors = [];
                      if (mId === "motor") {
                        displaySensors = [
                          { label: "MOTOR TEMP", s: mSensors.temp, unit: "°C" },
                          { label: "CORE PRESSURE", s: mSensors.pressure, unit: "PSI" },
                          { label: "ROTOR VIBRATION", s: mSensors.vibration, unit: "g" }
                        ];
                      } else if (mId === "pump") {
                        displaySensors = [
                          { label: "FLOW RATE", s: mSensors.flow_rate, unit: "L/s" },
                          { label: "CORE PRESSURE", s: mSensors.pressure, unit: "PSI" },
                          { label: "EFFICIENCY", s: mSensors.efficiency, unit: "%" }
                        ];
                      } else if (mId === "generator") {
                        displaySensors = [
                          { label: "POWER OUTPUT", s: mSensors.power, unit: "kW" },
                          { label: "GRID LOAD", s: mSensors.load, unit: "%" },
                          { label: "LINE FREQUENCY", s: mSensors.frequency, unit: "Hz" }
                        ];
                      }

                      return displaySensors.map((item, idx) => {
                        const s = item.s || { current: 0, warn: 9999, critical: 9999 };
                        const val = s.current;

                        // Dynamic metric color rules:
                        // NORMAL: green (#10b981)
                        // WARNING: amber/yellow (#f59e0b)
                        // FAILURE: red (#ef4444)
                        // RECOVERY: blue (#00e5ff)
                        let metricColor = "#10b981";
                        if (activeMode === "recovery") {
                          metricColor = "#00e5ff";
                        } else if (val >= s.critical) {
                          metricColor = "#ef4444";
                        } else if (val >= s.warn) {
                          metricColor = "#f59e0b";
                        }

                        return (
                          <div key={idx} className="flex justify-between items-center text-[9px] font-mono leading-tight">
                            <span className="text-cyan/60">{item.label}</span>
                            <span className="font-bold transition-colors duration-300 font-mono" style={{ color: metricColor }}>
                              {val.toFixed(1)}{item.unit}
                            </span>
                          </div>
                        );
                      });
                    })()}
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
                    <div className="border-t border-cyan/5 pt-2.5 text-[9px] font-mono text-cyan/70 italic">
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
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
      {isOperator && renderOperatorView()}
      {isEngineer && renderEngineerView()}
      {isManager && renderManagerView()}
    </div>
  );
}

export default CenterPanel;