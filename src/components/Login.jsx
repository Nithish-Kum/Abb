import { useState, useEffect } from "react";
import ParticleBackground from "./ParticleBackground";

function Login({ onLogin }) {
  const [coords, setCoords] = useState({ x: -1000, y: -1000 });
  const [booting, setBooting] = useState(() => {
    const hasBooted = sessionStorage.getItem("bootShown");
    return hasBooted !== "true";
  });
  const [bootLogs, setBootLogs] = useState([]);

  // Futuristic Cursor Follower Glow Trail
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoords({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Diagnostics Matrix Boot sequence (typing loader logs)
  useEffect(() => {
    if (!booting) return;

    const logs = [
      "SYSTEM RUNLEVEL 5 INITIALIZED...",
      "CONNECTING TO SENSOR TELEMETRY PIPELINE...",
      "SYNCING LIVE DATABASE (sensor_data_live.csv)...",
      "CALIBRATING NEURAL PREDICTIVE MATRIX...",
      "SCADA SECURITY PROTOCOLS LOCKED [AES-256]",
      "DIAGNOSTIC CALIBRATION COMPLETE [CONFIDENCE 98.4%]",
      "SCADA SYSTEM SECURE - READY"
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < logs.length) {
        const nextLog = logs[current];
        if (nextLog) {
          setBootLogs(prev => [...prev, nextLog]);
        }
        current++;
      } else {
        clearInterval(interval);
        sessionStorage.setItem("bootShown", "true");
        setTimeout(() => {
          setBooting(false);
        }, 600);
      }
    }, 380);

    return () => clearInterval(interval);
  }, [booting]);

  return (
    <div id="loginScreen">
      {/* Moving background node particles */}
      <ParticleBackground mode="normal" />

      {/* Ambient depth layers — pure CSS, no extra deps */}
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      <div className="ambient-orb ambient-orb-c" />
      <div className="ambient-grid" />

      {/* CSS 3D rotating model (wireframe cube w/ inner core) */}
      <div className="hero-3d-stage">
        <div className="hero-3d-rings">
          <span className="ring ring-1" />
          <span className="ring ring-2" />
          <span className="ring ring-3" />
        </div>
        <div className="hero-3d-cube">
          <div className="cube-face cube-front" />
          <div className="cube-face cube-back" />
          <div className="cube-face cube-right" />
          <div className="cube-face cube-left" />
          <div className="cube-face cube-top" />
          <div className="cube-face cube-bottom" />
          <div className="cube-core" />
        </div>
        <div className="hero-3d-floor" />
      </div>

      {/* Futuristic cursor glowing aura */}
      <div
        className="cursor-glow"
        style={{
          left: `${coords.x}px`,
          top: `${coords.y}px`
        }}
      />

      {/* Header section with text shadow glows and sweeps */}
      <div className="login-header-block fade-in">
        <h1>NEXUS HMI</h1>
        <p>AI-POWERED INDUSTRIAL CONTROL INTERFACE v2.0</p>

        {/* Active SCADA status indicator pills */}
        <div className="sys-indicators">
          <div className="indicator-badge online">
            <div className="badge-dot"></div>
            <span>🟢 SYSTEM ONLINE</span>
          </div>
          <div className="indicator-badge ai">
            <div className="badge-dot"></div>
            <span>🔵 AI ACTIVE</span>
          </div>
          <div className="indicator-badge data">
            <div className="badge-dot"></div>
            <span>⚡ DATA CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Boot log terminal or Role Select Box */}
      {booting ? (
        <div className="boot-terminal fade-in">
          <div className="terminal-header">
            <span>💻 CORE DIAGNOSTIC TERMINAL</span>
            <span>v2.0.42</span>
          </div>
          {bootLogs.map((log, i) => (
            <div key={i} className="boot-log-entry">
              {log}
            </div>
          ))}
        </div>
      ) : (
        <div className="role-select-box fade-in">
          <div className="role-label">SELECT YOUR ROLE TO SECURE ACCESS</div>
          <div className="role-btns">
            <button className="role-card-btn" onClick={() => onLogin("operator")}>
              <span className="role-card-icon">🧑‍💼</span>
              <span className="role-card-name">OPERATOR</span>
              <span className="role-card-desc">Critical alerts, gauges, and live system monitoring feed.</span>
            </button>
            <button className="role-card-btn" onClick={() => onLogin("engineer")}>
              <span className="role-card-icon">⚙️</span>
              <span className="role-card-name">ENGINEER</span>
              <span className="role-card-desc">Full diagnostics, sensor metrics, and HMI telemetry graphs.</span>
            </button>
            <button className="role-card-btn" onClick={() => onLogin("manager")}>
              <span className="role-card-icon">📊</span>
              <span className="role-card-name">MANAGER</span>
              <span className="role-card-desc">Comprehensive reports, uptime metrics, and KPI analytics.</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;