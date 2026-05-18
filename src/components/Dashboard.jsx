import { useState, useEffect, useRef } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import CenterPanel from "./CenterPanel";
import AlertsPanel from "./AlertsPanel";
import ParticleBackground from "./ParticleBackground";

// 1. DYNAMIC SYSTEM SCADA CONFIGURATION (SCALABLE JSON PATTERN)
const MACHINES_CONFIG = [
  {
    id: "motor",
    name: "THERMAL CORE MOTOR",
    sensors: [
      { id: "temp", name: "MOTOR CORE TEMP", value: 70, unit: "°C", max: 120, warn: 75, critical: 85 },
      { id: "voltage", name: "LINE VOLTAGE", value: 185, unit: "V", max: 250, warn: 200, critical: 220 },
      { id: "pressure", name: "CORE PRESSURE", value: 80, unit: "PSI", max: 150, warn: 85, critical: 100 },
      { id: "flow", name: "COOLANT FLOW", value: 4.2, unit: "L/s", max: 10, warn: 3.5, critical: 2.5 },
      { id: "vibration", name: "ROTOR VIBRATION", value: 1.5, unit: "g", max: 5, warn: 1.2, critical: 2.0 },
      { id: "current", name: "INDUCTION CURRENT", value: 13, unit: "A", max: 30, warn: 22, critical: 26 }
    ]
  },
  {
    id: "pump",
    name: "HYDRAULIC FLOW PUMP",
    sensors: [
      { id: "temp", name: "PUMP TEMP", value: 58, unit: "°C", max: 100, warn: 65, critical: 80 },
      { id: "voltage", name: "MOTOR VOLTAGE", value: 190, unit: "V", max: 250, warn: 210, critical: 230 },
      { id: "pressure", name: "DISCHARGE PRESSURE", value: 92, unit: "PSI", max: 200, warn: 110, critical: 140 },
      { id: "flow", name: "DISCHARGE FLOW", value: 6.8, unit: "L/s", max: 15, warn: 5.0, critical: 3.5 },
      { id: "vibration", name: "PUMP VIBRATION", value: 1.8, unit: "g", max: 5, warn: 1.5, critical: 2.5 },
      { id: "current", name: "PUMP CURRENT", value: 16, unit: "A", max: 35, warn: 25, critical: 30 }
    ]
  },
  {
    id: "generator",
    name: "TURBINE GENERATOR POWER",
    sensors: [
      { id: "temp", name: "BEARING TEMP", value: 62, unit: "°C", max: 110, warn: 70, critical: 90 },
      { id: "voltage", name: "GENERATED VOLTAGE", value: 215, unit: "V", max: 280, warn: 240, critical: 260 },
      { id: "pressure", name: "STEAM PRESSURE", value: 115, unit: "PSI", max: 250, warn: 140, critical: 180 },
      { id: "flow", name: "STEAM FLOW", value: 8.5, unit: "L/s", max: 20, warn: 6.5, critical: 4.5 },
      { id: "vibration", name: "TURBINE VIBRATION", value: 1.2, unit: "g", max: 5, warn: 1.0, critical: 1.8 },
      { id: "current", name: "GENERATED CURRENT", value: 24, unit: "A", max: 50, warn: 35, critical: 42 }
    ]
  }
];

function Dashboard({ role }) {
  const isOperator = role === "operator";
  const isManager = role === "manager";
  const isEngineer = role === "engineer";

  // Operator selection flow state, dynamic bind default selection for engineer/manager
  const [selectedMachineId, setSelectedMachineId] = useState(() => {
    return isOperator ? "" : "motor";
  });

  // 2. LIVE INTEGRATED MULTI-MACHINE REAL-TIME TELEMETRY GENERATOR
  const [machinesData, setMachinesData] = useState(() => {
    const data = {};
    MACHINES_CONFIG.forEach(m => {
      const sensorsMap = {};
      m.sensors.forEach(s => {
        sensorsMap[s.id] = {
          ...s,
          current: s.value,
          history: Array(15).fill(s.value)
        };
      });
      data[m.id] = {
        id: m.id,
        name: m.name,
        mode: "normal",
        state_time: Math.floor(Math.random() * 4) + 4, // 4-8 ticks
        sensors: sensorsMap,
        risk: 0
      };
    });
    return data;
  });

  const [alerts, setAlerts] = useState([]);
  
  // Audio alarm references
  const alarmCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const lastStateRef = useRef("normal");

  // Dynamic system status calculations based on selected machine
  const currentMode = selectedMachineId && machinesData[selectedMachineId] 
    ? machinesData[selectedMachineId].mode 
    : "normal";

  const currentRisk = selectedMachineId && machinesData[selectedMachineId]
    ? machinesData[selectedMachineId].risk
    : 0;

  // Real-time generator updates (every 1.5 seconds to feel responsive and fast)
  useEffect(() => {
    const simulateData = () => {
      setMachinesData(prev => {
        const next = { ...prev };
        const newAlerts = [];

        Object.keys(next).forEach(mId => {
          const m = { ...next[mId] };
          const sMap = { ...m.sensors };

          // A. State time transition tick
          m.state_time -= 1;
          if (m.state_time <= 0) {
            if (m.mode === "normal") {
              m.mode = "warning";
              m.state_time = Math.floor(Math.random() * 4) + 5; // warning for 5-8 ticks
            } else if (m.mode === "warning") {
              m.mode = "failure";
              m.state_time = Math.floor(Math.random() * 4) + 4; // failure for 4-7 ticks
            } else if (m.mode === "failure") {
              m.mode = "recovery";
              m.state_time = Math.floor(Math.random() * 3) + 4; // recovery for 4-6 ticks
            } else {
              m.mode = "normal";
              m.state_time = Math.floor(Math.random() * 5) + 6; // normal for 6-10 ticks
            }
          }

          // B. Fluctuate sensors based on machine active state
          Object.keys(sMap).forEach(sId => {
            const s = { ...sMap[sId] };
            let newVal = s.current;

            if (m.mode === "normal") {
              // Drift gently back to baseline specification limits
              const restoreForce = (s.value - s.current) * 0.15;
              const noise = Math.random() * (s.max * 0.04) - (s.max * 0.02);
              newVal += restoreForce + noise;
            } else if (m.mode === "warning") {
              // Rise gently into warning thresholds
              const increment = Math.random() * (s.max * 0.035);
              newVal += increment;
            } else if (m.mode === "failure") {
              // Rise steeply and oscillate aggressively in failures
              const increment = Math.random() * (s.max * 0.08) + (s.max * 0.02);
              newVal += increment;
            } else if (m.mode === "recovery") {
              // Descend rapidly toward nominal values
              const decrement = Math.random() * (s.max * 0.09) + (s.max * 0.01);
              newVal -= decrement;
            }

            // Clamping rules to protect system scaling boundaries
            newVal = Math.max(s.value * 0.5, Math.min(s.max * 1.05, newVal));
            s.current = newVal;
            s.history = [...s.history.slice(1), newVal];

            sMap[sId] = s;

            // Generate contextual alerts when warning/critical thresholds are breached
            if (s.current >= s.critical) {
              newAlerts.push({
                id: `alert-${mId}-${sId}-${Date.now()}`,
                machineId: mId,
                type: "critical",
                sensor: s.name,
                msg: `🔴 CRITICAL OUT-OF-LIMITS: ${m.name} ${s.name} of ${s.current.toFixed(1)}${s.unit} breached critical threshold!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
            } else if (s.current >= s.warn) {
              newAlerts.push({
                id: `alert-${mId}-${sId}-${Date.now()}`,
                machineId: mId,
                type: "warning",
                sensor: s.name,
                msg: `⚠️ TELEMETRY WARN WARNING: ${m.name} ${s.name} at ${s.current.toFixed(1)}${s.unit} exceeds caution limits.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
            }
          });

          m.sensors = sMap;

          // C. Calculate cumulative machine risk score dynamically
          let riskAccum = 0;
          Object.values(sMap).forEach(s => {
            if (s.current >= s.critical) riskAccum += 22;
            else if (s.current >= s.warn) riskAccum += 12;
          });
          m.risk = Math.min(100, Math.max(0, riskAccum + Math.floor(Math.random() * 5)));

          next[mId] = m;
        });

        // Sync generated alerts state safely
        if (newAlerts.length > 0) {
          setAlerts(prevAlerts => {
            // Filter to keep only one unique alert per machine sensor to avoid spamming
            const keys = new Set();
            const blended = [...newAlerts, ...prevAlerts];
            return blended.filter(a => {
              const key = `${a.machineId}-${a.sensor}`;
              if (keys.has(key)) return false;
              keys.add(key);
              return true;
            }).slice(0, 10);
          });
        }

        return next;
      });
    };

    const interval = setInterval(simulateData, 1500);
    return () => clearInterval(interval);
  }, []);

  const ackAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // 🔊 REAL-TIME INDUSTRIAL WEB AUDIO WARNING/FAILURE SOUND ENGINE
  useEffect(() => {
    if (currentMode !== lastStateRef.current) {
      stopAllSounds();

      if (currentMode === "warning") {
        playWarningBeeps();
      } else if (currentMode === "failure") {
        startFailureBuzzer();
      }
      
      lastStateRef.current = currentMode;
    }
  }, [currentMode]);

  useEffect(() => {
    return () => stopAllSounds();
  }, []);

  const playWarningBeeps = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const trigger = (delay) => {
        if (!ctx || ctx.state === "closed") return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.45);
      };
      trigger(0);
      trigger(0.6);
      setTimeout(() => {
        try { ctx.close(); } catch (e) {}
      }, 1500);
    } catch (e) {}
  };

  const startFailureBuzzer = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      alarmCtxRef.current = ctx;
      const pulse = () => {
        if (!ctx || ctx.state === "closed") return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      };
      pulse();
      alarmIntervalRef.current = setInterval(pulse, 280);
    } catch (e) {}
  };

  const stopAllSounds = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alarmCtxRef.current) {
      try { alarmCtxRef.current.close(); } catch (e) {}
      alarmCtxRef.current = null;
    }
  };

  // Get active dashboard neon styling class
  const getThemeClass = () => {
    switch (currentMode) {
      case "normal": return "green";
      case "warning": return "yellow";
      case "failure": return "red";
      case "recovery": return "blue";
      default: return "green";
    }
  };

  // Filter alerts matching the operator's selected machine
  const activeAlerts = isOperator 
    ? alerts.filter(a => a.machineId === selectedMachineId) 
    : alerts;

  // 3. OPERATOR MACHINE SELECTION SCREEN LAYOUT
  const renderSelectionScreen = () => {
    return (
      <div className="selection-screen-container fade-in">
        <div className="selection-card">
          <div className="selection-glow-logo">⚡ NEXUS SCADA SYSTEMS ⚡</div>
          <h2>SELECT ASSIGNED TELEMETRY STATION</h2>
          <p>AUTHORIZED OPERATOR TERMINAL ACCESS SEGMENT</p>

          <div className="selection-grid">
            {MACHINES_CONFIG.map(m => {
              const live = machinesData[m.id];
              const isW = live.mode === "warning";
              const isF = live.mode === "failure";
              const mClass = isF ? "critical" : isW ? "warn" : "normal";

              return (
                <div 
                  key={m.id} 
                  className={`selection-item-card ${mClass}`}
                  onClick={() => setSelectedMachineId(m.id)}
                >
                  <div className="selection-item-glow-strip" />
                  <div className="selection-item-header">Station Segment</div>
                  <div className="selection-item-title">{live.name}</div>
                  
                  <div className="selection-item-status">
                    Status: <span className="selection-status-badge">{live.mode.toUpperCase()}</span>
                  </div>
                  <div className="selection-item-risk">
                    Risk Index: <span style={{ fontWeight: 900 }}>{live.risk}%</span>
                  </div>

                  <button className="selection-item-btn">INITIALIZE segment</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const shouldFocus = currentRisk >= 80;

  const criticalAlertsList = activeAlerts.filter(a => a.type === "critical");
  const warningAlertsList = activeAlerts.filter(a => a.type === "warning");
  const topAlert = criticalAlertsList.length > 0 
    ? criticalAlertsList[0] 
    : (warningAlertsList.length > 0 ? warningAlertsList[0] : null);

  return (
    <div
      id="app"
      style={{ display: "block", minHeight: "100vh" }}
      className={`dashboard ${getThemeClass()} ${currentMode === "failure" ? "emergency-mode" : ""}`}
    >
      {/* 🔴 Screen Failure overlay (pulsing red low opacity filter) */}
      {currentMode === "failure" && <div className="emergency-overlay"></div>}

      {/* Dynamic Futuristic Canvas Particle Background */}
      <ParticleBackground mode={currentMode} />

      {/* Extreme Risk Focus Notification Ring */}
      {shouldFocus && (
        <div className="focus-mode">
          ⚡ EXTREME SYSTEM RISK BREACH DETECTED ⚡
        </div>
      )}

      {/* 📂 OPERATOR CHOOSE SCREEN FLOW CHECK */}
      {isOperator && !selectedMachineId ? (
        renderSelectionScreen()
      ) : (
        <>
          {/* Main layout Topbar with dynamic switch capabilities */}
          <Topbar 
            role={role} 
            mode={currentMode} 
            selectedMachineId={selectedMachineId} 
            onSwitchMachine={() => setSelectedMachineId("")} 
          />

          {/* ⚡ Glowing Global Top Alert Bar (Mandatory high-visibility alert) */}
          {topAlert && (
            <div className={`global-top-alert-bar ${topAlert.type === "critical" ? "critical" : "warning"} fade-in`}>
              <div className="alert-bar-content">
                <span className="alert-bar-icon">{topAlert.type === "critical" ? "🚨" : "⚠️"}</span>
                <span className="alert-bar-title">{topAlert.type === "critical" ? "CRITICAL SYSTEM MELTDOWN ALERT:" : "SYSTEM ADVISORY WARNING:"}</span>
                <span className="alert-bar-message">{topAlert.msg}</span>
              </div>
              <button className="alert-bar-ack" onClick={() => ackAlert(topAlert.id)}>
                ✓ ACKNOWLEDGE
              </button>
            </div>
          )}

          <div className="main">
            <Sidebar
              role={role}
              sensors={machinesData[selectedMachineId]?.sensors || {}}
            />
            <CenterPanel
              role={role}
              mode={currentMode}
              selectedMachineId={selectedMachineId}
              setSelectedMachineId={setSelectedMachineId}
              machinesData={machinesData}
              alerts={activeAlerts}
              ackAlert={ackAlert}
            />
            <AlertsPanel
              role={role}
              mode={currentMode}
              alerts={activeAlerts}
              ackAlert={ackAlert}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
