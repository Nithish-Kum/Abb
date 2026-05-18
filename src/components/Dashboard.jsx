import { useState, useEffect, useRef } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import CenterPanel from "./CenterPanel";
import AlertsPanel from "./AlertsPanel";
import ParticleBackground from "./ParticleBackground";

const initialSensors = [
  { id: "motor", name: "MOTOR CORE TEMP", value: 70, unit: "°C", max: 120, warn: 75, critical: 85 },
  { id: "voltage", name: "LINE VOLTAGE", value: 185, unit: "V", max: 250, warn: 200, critical: 220 },
  { id: "pressure", name: "CORE PRESSURE", value: 80, unit: "PSI", max: 150, warn: 85, critical: 100 },
  { id: "flow", name: "COOLANT FLOW", value: 4.2, unit: "L/s", max: 10, warn: 3.5, critical: 2.5 },
  { id: "vibration", name: "ROTOR VIBRATION", value: 1.5, unit: "g", max: 5, warn: 1.2, critical: 2.0 },
  { id: "current", name: "INDUCTION CURRENT", value: 13, unit: "A", max: 30, warn: 22, critical: 26 }
];

const modeAlerts = {
  normal: [],
  warning: [
    { type: "warning", sensor: "MOTOR CORE TEMP", msg: "Telemetry drift excursion detected. Thermal gradient exceeds threshold." },
    { type: "info", sensor: "SYSTEM PRESSURE", msg: "Pressure oscillations rising. Micro-fracture hazard evaluated at 12%." }
  ],
  failure: [
    { type: "critical", sensor: "MOTOR CORE TEMP", msg: "CRITICAL FAILURE: Core temp thermal overload. Stator winding melting." },
    { type: "critical", sensor: "LINE VOLTAGE", msg: "VOLTAGE INSTABILITY: Grid synchronizer drop. Protective relays tripped." }
  ],
  recovery: [
    { type: "info", sensor: "COOLANT FLOW", msg: "Coolant circuit flow restored. Thermal gradient normalized." }
  ]
};

function Dashboard({ role }) {
  const [mode, setMode] = useState("normal");
  const [prevMode, setPrevMode] = useState("normal");
  const [dataRisk, setDataRisk] = useState(0);

  const [sensors, setSensors] = useState(() => {
    const data = {};
    initialSensors.forEach(s => {
      data[s.id] = { ...s, history: Array(15).fill(s.value), current: s.value };
    });
    return data;
  });

  const [alerts, setAlerts] = useState([]);

  // Audio Context refs for safe lifecycle garbage collection (No memory leaks)
  const failureIntervalRef = useRef(null);
  const failureCtxRef = useRef(null);

  // Sync alerts when mode changes
  useEffect(() => {
    const active = modeAlerts[mode.toLowerCase()] || [];
    setAlerts(active.map((a, index) => ({
      id: `alert-${mode}-${index}-${Date.now()}`,
      ...a,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    })));
  }, [mode]);

  const ackAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Telemetry Polling (every 3 seconds to match CSV generator)
  useEffect(() => {
    const fetchData = () => {
      fetch("http://127.0.0.1:5000/data")
        .then(res => res.json())
        .then(res => {
          if (!res || Object.keys(res).length === 0) return;

          const motor_temp = parseFloat(res.motor_temp) || 0;
          const voltage = parseFloat(res.voltage) || 0;
          const pressure = parseFloat(res.pressure) || 0;
          const flow_rate = parseFloat(res.flow_rate) || 0;
          const vibration = parseFloat(res.vibration) || 0;
          const current = parseFloat(res.current) || 0;
          const risk = parseFloat(res.risk) || 0;
          setDataRisk(risk);

          setSensors(prev => {
            const next = { ...prev };
            const updateSensor = (id, newVal) => {
              if (prev[id]) {
                next[id] = {
                  ...prev[id],
                  current: newVal,
                  history: [...prev[id].history.slice(1), newVal]
                };
              }
            };

            updateSensor("motor", motor_temp);
            updateSensor("voltage", voltage);
            updateSensor("pressure", pressure);
            updateSensor("flow", flow_rate);
            updateSensor("vibration", vibration);
            updateSensor("current", current);

            return next;
          });

          // Rely ONLY on live API data for operational state sync
          const newStatus = res.status ? res.status.toLowerCase() : "normal";
          if (mode !== newStatus) {
            setMode(newStatus);
          }
        })
        .catch(err => console.error("Error fetching telemetry:", err));
    };

    fetchData(); // initial fetch
    const interval = setInterval(fetchData, 3000); // 3-second live updates

    return () => clearInterval(interval);
  }, [mode]);

  // 🔊 DYNAMIC WEB AUDIO ALARM ENGINE (STATUS CHANGE DETECTION)
  useEffect(() => {
    if (mode !== prevMode) {
      // 1. Immediately shut down any playing failure siren or active audio context
      stopAllSounds();

      const normalized = mode.toLowerCase();

      // 2. Play state-specific synthesized sound cues
      if (normalized === "warning") {
        playWarningBeep();
      } else if (normalized === "failure") {
        startFailureAlarm();
      }

      // Update tracking reference
      setPrevMode(mode);
    }
  }, [mode, prevMode]);

  // Clean up all active audio contexts on unmount to prevent leaks
  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, []);

  // Web Audio Synthesizer: 2 beeps then auto stop
  const playWarningBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      const triggerBeep = (delay) => {
        if (!ctx || ctx.state === "closed") return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine"; // Clean medium-intensity sine wave
        osc.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz beep

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.05); // fade in
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.4); // fade out

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.45);
      };

      // Play beep twice, separated by 0.6 seconds
      triggerBeep(0);
      triggerBeep(0.6);

      // Auto-terminate Context after playback completes to free hardware nodes
      setTimeout(() => {
        try {
          ctx.close();
        } catch (e) { }
      }, 1500);
    } catch (e) {
      console.warn("Web Audio warning synthesis failed:", e);
    }
  };

  // Web Audio Synthesizer: Continuous looping high-intensity alert buzzer
  const startFailureAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      failureCtxRef.current = ctx;

      const triggerBuzzerPulse = () => {
        if (!ctx || ctx.state === "closed") return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "square"; // Square wave for sharp buzzer alert tone
        osc.frequency.setValueAtTime(1050, ctx.currentTime); // High pitch 1050Hz

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14); // Short, sharp beep pulse

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      };

      // Trigger rapidly (every 250ms) to create a repeating emergency buzzer alert
      triggerBuzzerPulse();
      failureIntervalRef.current = setInterval(triggerBuzzerPulse, 250);
    } catch (e) {
      console.warn("Web Audio failure buzzer synthesis failed:", e);
    }
  };

  // Safe sound tear down
  const stopAllSounds = () => {
    if (failureIntervalRef.current) {
      clearInterval(failureIntervalRef.current);
      failureIntervalRef.current = null;
    }
    if (failureCtxRef.current) {
      try {
        failureCtxRef.current.close();
      } catch (e) { }
      failureCtxRef.current = null;
    }
  };

  // Dynamic severity class mapping
  const getThemeClass = () => {
    switch (mode) {
      case "normal": return "green";
      case "warning": return "yellow";
      case "failure": return "red";
      case "recovery": return "blue";
      default: return "green";
    }
  };

  const shouldFocus = dataRisk >= 80;

  return (
    <div
      id="app"
      style={{ display: "block", minHeight: "100vh" }}
      className={`dashboard ${getThemeClass()} ${mode === "failure" ? "emergency-mode" : ""}`}
    >
      {/* 🔴 Screen Failure overlay (pulsing red low opacity filter) */}
      {mode === "failure" && <div className="emergency-overlay"></div>}

      {/* Dynamic Futuristic Canvas Particle Background */}
      <ParticleBackground mode={mode} />

      {/* Extreme Risk Focus Notification Ring */}
      {shouldFocus && (
        <div className="focus-mode">
          ⚡ EXTREME SYSTEM RISK BREACH DETECTED ⚡
        </div>
      )}

      {/* SCADA UI Layout */}
      <Topbar role={role} mode={mode} />
      <div className="main">
        <Sidebar
          role={role}
          sensors={sensors}
        />
        <CenterPanel
          role={role}
          mode={mode}
          sensors={sensors}
          alerts={alerts}
          ackAlert={ackAlert}
        />
        <AlertsPanel
          role={role}
          mode={mode}
          alerts={alerts}
          ackAlert={ackAlert}
        />
      </div>
    </div>
  );
}

export default Dashboard;
