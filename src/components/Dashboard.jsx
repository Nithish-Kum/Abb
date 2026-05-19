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
      { id: "pressure", name: "CORE PRESSURE", value: 80, unit: "PSI", max: 150, warn: 85, critical: 100 },
      { id: "vibration", name: "ROTOR VIBRATION", value: 1.2, unit: "g", max: 5, warn: 1.5, critical: 2.0 },
      { id: "voltage", name: "LINE VOLTAGE", value: 185, unit: "V", max: 250, warn: 200, critical: 220 },
      { id: "current", name: "INDUCTION CURRENT", value: 13, unit: "A", max: 30, warn: 22, critical: 26 }
    ]
  },
  {
    id: "pump",
    name: "HYDRAULIC FLOW PUMP",
    sensors: [
      { id: "flow_rate", name: "FLOW RATE", value: 4.0, unit: "L/s", max: 6.0, warn: 3.5, critical: 2.5 },
      { id: "pressure", name: "DISCHARGE PRESSURE", value: 90, unit: "PSI", max: 140, warn: 95, critical: 100 },
      { id: "efficiency", name: "EFFICIENCY", value: 85, unit: "%", max: 100, warn: 75, critical: 70 }
    ]
  },
  {
    id: "generator",
    name: "TURBINE GENERATOR POWER",
    sensors: [
      { id: "power", name: "POWER OUTPUT", value: 220, unit: "kW", max: 300, warn: 240, critical: 260 },
      { id: "load", name: "GRID LOAD", value: 60, unit: "%", max: 100, warn: 75, critical: 85 },
      { id: "frequency", name: "LINE FREQUENCY", value: 50, unit: "Hz", max: 60, warn: 49, critical: 48 }
    ]
  }
];

function Dashboard({ role }) {
  const [activeRole, setActiveRole] = useState(role);
  const isOperator = activeRole === "operator";
  const isManager = activeRole === "manager";
  const isEngineer = activeRole === "engineer";

  const [coords, setCoords] = useState({ x: -1000, y: -1000 });

  // Futuristic Cursor Follower Glow Trail
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Operator selection flow state, dynamic bind default selection for engineer/manager
  const [selectedMachineId, setSelectedMachineId] = useState(() => {
    return role === "operator" ? "" : "motor";
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
  const [alarmDismissed, setAlarmDismissed] = useState(false);

  // Audio alarm references
  const alarmCtxRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const lastStateRef = useRef("normal");

  // Dynamic system status calculations based on selected machine
  const currentMode = activeRole === "manager"
    ? "normal"
    : (selectedMachineId && machinesData[selectedMachineId]
        ? machinesData[selectedMachineId].mode
        : "normal");

  const currentRisk = activeRole === "manager"
    ? 0
    : (selectedMachineId && machinesData[selectedMachineId]
        ? machinesData[selectedMachineId].risk
        : 0);

  // Reset alarm dismissed state if status moves away from failure
  useEffect(() => {
    if (currentMode !== "failure") {
      setAlarmDismissed(false);
    }
  }, [currentMode]);

  // Auto-navigate to warning/failure machine selection (without changing active role)
  useEffect(() => {
    // DO NOT auto-redirect if active role is operator (let operator choose manually)
    if (activeRole === "operator") return;

    // Check for failure first (higher priority)
    const failureMachine = Object.keys(machinesData).find(
      mId => machinesData[mId].mode === "failure"
    );
    if (failureMachine && selectedMachineId !== failureMachine) {
      setSelectedMachineId(failureMachine);
      return;
    }

    // Check for warning second
    const warningMachine = Object.keys(machinesData).find(
      mId => machinesData[mId].mode === "warning"
    );
    if (warningMachine && selectedMachineId !== warningMachine) {
      setSelectedMachineId(warningMachine);
    }
  }, [machinesData, selectedMachineId, activeRole]);

  // Dynamic CSV Parser
  const parseCSV = (text) => {
    if (!text) return [];
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(",").map(v => v.trim());
      const row = {};
      headers.forEach((h, index) => {
        row[h] = values[index];
      });
      rows.push(row);
    }
    return rows;
  };

  // Helper to determine dynamic unit
  const getUnit = (k) => {
    const c = k.toLowerCase();
    if (c.includes("temp")) return "°C";
    if (c.includes("voltage") || c === "volt") return "V";
    if (c.includes("pressure") || c === "psi") return "PSI";
    if (c.includes("flow")) return "L/s";
    if (c.includes("vibration")) return "g";
    if (c.includes("current") || c === "amp") return "A";
    if (c.includes("frequency") || c === "hz") return "Hz";
    if (c.includes("load") || c.includes("efficiency") || c.includes("pct") || c.includes("ratio")) return "%";
    if (c.includes("power") || c === "watt" || c === "kw") return "kW";
    return "";
  };

  const SENSOR_METRIC_RULES = {
    temp: { name: "MOTOR CORE TEMP", unit: "°C", max: 120, warn: 75, critical: 85 },
    vibration: { name: "ROTOR VIBRATION", unit: "g", max: 5, warn: 1.2, critical: 2.0 },
    pressure: { name: "CORE PRESSURE", unit: "PSI", max: 200, warn: 85, critical: 100 },
    voltage: { name: "LINE VOLTAGE", unit: "V", max: 250, warn: 200, critical: 220 },
    current: { name: "INDUCTION CURRENT", unit: "A", max: 30, warn: 22, critical: 26 },
    flow_rate: { name: "FLOW RATE", unit: "L/s", max: 10, warn: 3.5, critical: 2.5 },
    efficiency: { name: "EFFICIENCY", unit: "%", max: 100, warn: 75, critical: 70 },
    power: { name: "POWER OUTPUT", unit: "kW", max: 300, warn: 240, critical: 260 },
    load: { name: "GRID LOAD", unit: "%", max: 100, warn: 75, critical: 85 },
    frequency: { name: "LINE FREQUENCY", unit: "Hz", max: 60, warn: 49, critical: 48 }
  };

  // Real-time telemetry fetch updates (every 2 seconds) for ALL configured machines
  useEffect(() => {
    const fetchMachineData = (mId) => {
      const csvPath = `/datasets/${mId}_data.csv?ts=${Date.now()}`;
      fetch(csvPath)
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch CSV for ${mId}`);
          return res.text();
        })
        .then(text => {
          const rows = parseCSV(text);
          if (rows.length === 0) return;
          const latestRow = rows[rows.length - 1];

          const sensorKeys = Object.keys(latestRow).filter(k => k !== "timestamp" && k !== "status" && k !== "risk");
          const sensorsMap = {};

          sensorKeys.forEach(key => {
            const histRows = rows.slice(-20);
            const historyValues = histRows.map(r => Number(r[key]) || 0);
            const currentVal = Number(latestRow[key]) || 0;
            const normKey = key.toLowerCase();

            const rule = SENSOR_METRIC_RULES[normKey] || {
              name: key.toUpperCase().replace("_", " "),
              unit: getUnit(key),
              max: Math.max(...historyValues, 10) * 1.25,
              warn: Math.max(...historyValues, 10) * 0.7,
              critical: Math.max(...historyValues, 10) * 0.85
            };

            sensorsMap[key] = {
              id: key,
              name: rule.name,
              value: rule.max * 0.7,
              current: currentVal,
              unit: rule.unit,
              max: rule.max,
              warn: rule.warn,
              critical: rule.critical,
              history: historyValues
            };
          });

          const mode = latestRow.status ? latestRow.status.toLowerCase() : "normal";
          const risk = Number(latestRow.risk) || 0;

          // Contextual alerts generation when warning/critical thresholds are breached
          const newAlerts = [];
          Object.values(sensorsMap).forEach(s => {
            if (s.current >= s.critical) {
              newAlerts.push({
                id: `alert-${mId}-${s.id}-${Date.now()}`,
                machineId: mId,
                type: "critical",
                sensor: s.name,
                msg: `🔴 CRITICAL OUT-OF-LIMITS: ${mId.toUpperCase()} ${s.name} of ${s.current.toFixed(1)}${s.unit} breached critical threshold!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
            } else if (s.current >= s.warn) {
              newAlerts.push({
                id: `alert-${mId}-${s.id}-${Date.now()}`,
                machineId: mId,
                type: "warning",
                sensor: s.name,
                msg: `⚠️ TELEMETRY WARN WARNING: ${mId.toUpperCase()} ${s.name} at ${s.current.toFixed(1)}${s.unit} exceeds caution limits.`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              });
            }
          });

          setMachinesData(prev => {
            const next = { ...prev };
            if (next[mId]) {
              const prevMode = next[mId].mode;
              next[mId] = {
                ...next[mId],
                mode: mode,
                risk: risk,
                sensors: sensorsMap
              };

              // Trigger Speech Synthesis voice on entering failure!
              if (mode === "failure" && prevMode !== "failure" && !alarmDismissed) {
                if (window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(`${next[mId].name} facing failure`);
                  utterance.rate = 1.0;
                  utterance.pitch = 0.95;
                  window.speechSynthesis.speak(utterance);
                }
              }
            }
            return next;
          });

          if (newAlerts.length > 0) {
            setAlerts(prevAlerts => {
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
        })
        .catch(err => {
          console.error(`Error fetching telemetry CSV for ${mId}:`, err);
        });
    };

    const fetchAllData = () => {
      MACHINES_CONFIG.forEach(m => {
        fetchMachineData(m.id);
      });
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 2000);
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
        try { ctx.close(); } catch (e) { }
      }, 1500);
    } catch (e) { }
  };

  const startFailureBuzzer = () => {
    // Disabled (Voice alert is handled globally via high-fidelity Synthesis loop above)
  };

  const stopAllSounds = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
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
      <div className="selection-screen-container fade-in" style={{ position: "relative" }}>
        {/* Floating Logout Button at Top Right */}
        <button
          className="logout-btn"
          onClick={() => window.location.reload()}
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            zIndex: 10
          }}
        >
          ⏏ LOGOUT
        </button>

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

  const shouldFocus = currentRisk >= 80 && currentMode === "failure";

  const criticalAlertsList = activeAlerts.filter(a => a.type === "critical");
  const warningAlertsList = activeAlerts.filter(a => a.type === "warning");
  const topAlert = criticalAlertsList.length > 0
    ? criticalAlertsList[0]
    : (warningAlertsList.length > 0 ? warningAlertsList[0] : null);

  return (
    <div
      id="app"
      className={`dashboard ${getThemeClass()} ${currentMode === "failure" ? "emergency-mode" : ""} ${currentMode === "warning" ? "warning-alarm-mode" : ""}`}
    >
      {/* Moving background node particles */}
      <ParticleBackground mode={currentMode} />

      {/* Ambient depth layers — pure CSS, no extra deps */}
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      <div className="ambient-orb ambient-orb-c" />
      <div className="ambient-grid" />

      {/* Futuristic cursor glowing aura */}
      <div
        className="cursor-glow"
        style={{
          left: `${coords.x}px`,
          top: `${coords.y}px`
        }}
      />

      {/* 🔴 Screen Failure overlay (pulsing red low opacity filter) */}
      {currentMode === "failure" && <div className="emergency-overlay"></div>}

      {/* Extreme Risk Focus Notification Ring */}
      {shouldFocus && (
        <>
          <div className="focus-overlay"></div>
          <div className="focus-banner">
            ⚡ EXTREME SYSTEM RISK BREACH DETECTED ⚡
          </div>
        </>
      )}

      {/* 📂 OPERATOR CHOOSE SCREEN FLOW CHECK */}
      {isOperator && !selectedMachineId ? (
        renderSelectionScreen()
      ) : (
        <>
          {/* Main layout Topbar with dynamic switch capabilities */}
          <Topbar
            role={activeRole}
            mode={currentMode}
            selectedMachineId={selectedMachineId}
            onSwitchMachine={() => setSelectedMachineId("")}
          />


          <div className="main">
            <Sidebar
              role={activeRole}
              sensors={machinesData[selectedMachineId]?.sensors || {}}
              machinesData={machinesData}
            />
            <CenterPanel
              role={activeRole}
              mode={currentMode}
              selectedMachineId={selectedMachineId}
              setSelectedMachineId={setSelectedMachineId}
              machinesData={machinesData}
              alerts={activeAlerts}
              ackAlert={ackAlert}
              alarmDismissed={alarmDismissed}
              setAlarmDismissed={setAlarmDismissed}
            />
            <AlertsPanel
              role={activeRole}
              mode={currentMode}
              alerts={activeAlerts}
              ackAlert={ackAlert}
              machinesData={machinesData}
            />
          </div>
        </>
      )}

      {/* Operator Alarm Popup Overlay on Failure */}
      {isOperator && currentMode === "failure" && !alarmDismissed && (
        <div className="fixed inset-0 bg-[#050816]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#050816]/95 border-2 border-red-500/40 max-w-md w-full p-6 rounded-2xl flex flex-col gap-4 text-center shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-pulse">
            <div className="font-display font-black text-sm tracking-[0.25em] text-[#ef4444]">🚨 CRITICAL SCADA EMERGENCY ALARM</div>
            <div className="font-sans text-xs text-white/90 leading-relaxed">
              SYSTEM BREACH: Active cascade meltdown detected in Rotor Stator winding. Core temperature exceeds caution limits. Automated suppression loops initialized.
            </div>
            <button
              className="w-full mt-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-500 text-white font-mono text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer"
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
}

export default Dashboard;
