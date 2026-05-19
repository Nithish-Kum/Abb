import { useState, useEffect } from "react";
import ParticleBackground from "./ParticleBackground";

function Login({ onLogin }) {
  const [coords, setCoords] = useState({ x: -1000, y: -1000 });
  const [booting, setBooting] = useState(() => {
    const hasBooted = sessionStorage.getItem("bootShown");
    return hasBooted !== "true";
  });
  const [bootLogs, setBootLogs] = useState([]);
  const [timeStr, setTimeStr] = useState("");
  const [systemHealth, setSystemHealth] = useState(84);

  // Live ticking clock (seconds precision)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live dynamic telemetry system health fetch
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const fetchRisk = async (mId) => {
          const res = await fetch(`/datasets/${mId}_data.csv?ts=${Date.now()}`);
          if (!res.ok) return 0;
          const text = await res.text();
          const lines = text.trim().split("\n");
          if (lines.length < 2) return 0;
          const headers = lines[0].split(",").map(h => h.trim());
          const lastLine = lines[lines.length - 1].split(",").map(v => v.trim());
          const riskIndex = headers.indexOf("risk");
          if (riskIndex !== -1 && lastLine[riskIndex] !== undefined) {
            return Number(lastLine[riskIndex]) || 0;
          }
          return 0;
        };

        const [motorRisk, pumpRisk, genRisk] = await Promise.all([
          fetchRisk("motor"),
          fetchRisk("pump"),
          fetchRisk("generator")
        ]);

        const avgRisk = (motorRisk + pumpRisk + genRisk) / 3;
        setSystemHealth(Math.round(100 - avgRisk));
      } catch (err) {
        console.error("Telemetry failed on login page:", err);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 2000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#050816] text-foreground font-sans overflow-hidden p-8 gap-8">
      {/* Real-time Clock + Live Telemetry Health Pulse widget (Top-Right) */}
      <div className="absolute top-6 right-8 text-right z-30 font-mono flex flex-col gap-1 select-none pointer-events-none fade-in">
        <div className="text-sm font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
          {timeStr || "12:00:00 AM"}
        </div>
        <div className="flex items-center gap-1.5 justify-end text-[12px] tracking-[0.2em] font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-cyan/60 uppercase">SYSTEM HEALTH:</span>
          <span
            className="transition-colors duration-300 font-black text-[13px]"
            style={{
              color: systemHealth > 80 ? "#10b981" : systemHealth > 50 ? "#f59e0b" : "#ef4444",
              textShadow: `0 0 10px ${systemHealth > 80 ? "#10b981" : systemHealth > 50 ? "#f59e0b" : "#ef4444"}40`
            }}
          >
            {systemHealth}%
          </span>
        </div>
      </div>

      {/* Moving background node particles */}
      <ParticleBackground mode="normal" />

      {/* Ambient glowing deep-space matrices */}
      <div className="absolute w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.08)_0%,transparent_70%)] blur-[80px] top-[-200px] right-[-160px] animate-pulse pointer-events-none" />
      <div className="absolute w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_70%)] blur-[80px] bottom-[-180px] left-[-140px] animate-pulse pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] pointer-events-none" />

      {/* Premium CSS 3D rotating plasma core models */}
      <div className="relative w-72 h-72 flex items-center justify-center pointer-events-none float z-10">
        <div className="absolute inset-0 core-3d">
          <div className="core-ring r1" />
          <div className="core-ring r2" />
          <div className="core-ring r3" />
          <div className="core-glow" />
        </div>
      </div>

      {/* Futuristic cursor glowing aura */}
      <div
        className="fixed w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,229,255,0.08)_0%,transparent_70%)] pointer-events-none z-0 mix-blend-screen -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ease-out"
        style={{
          left: `${coords.x}px`,
          top: `${coords.y}px`
        }}
      />

      {/* Header section with text shadow glows and sweeps */}
      <div className="relative z-20 text-center max-w-2xl flex flex-col items-center gap-4 fade-in">
        <h1 className="font-display font-black text-5xl md:text-6xl tracking-widest text-white drop-shadow-[0_0_30px_rgba(0,229,255,0.4)]">
          NEXUS HMI
        </h1>
        <div className="w-24 h-[2px] bg-gradient-to-r from-cyan to-violet rounded-full shadow-[0_0_12px_rgba(0,229,255,0.4)]" />
        <p className="font-mono text-[10px] tracking-[0.3em] text-cyan/70 uppercase">
          AI-POWERED INDUSTRIAL CONTROL INTERFACE v2.0
        </p>

        {/* Active SCADA status indicator pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-4 p-2 bg-black/60 border border-cyan/20 rounded-full backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan/5 border border-cyan/20 text-white font-mono text-[10px] tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>SYSTEM ONLINE</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan/5 border border-cyan/20 text-white font-mono text-[10px] tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>AI ACTIVE</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan/5 border border-cyan/20 text-white font-mono text-[10px] tracking-wider uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>DATA CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Boot log terminal or Role Select Box */}
      {booting ? (
        <div className="relative z-30 w-full max-w-xl bg-black/60 border border-cyan/25 rounded-xl p-6 font-mono text-xs text-cyan shadow-2xl backdrop-blur-md fade-in">
          <div className="flex items-center justify-between border-b border-cyan/15 pb-2.5 mb-4 text-cyan/50 text-[10px] tracking-widest uppercase">
            <span>💻 CORE DIAGNOSTIC TERMINAL</span>
            <span>v2.0.42</span>
          </div>
          {bootLogs.map((log, i) => (
            <div key={i} className="flex gap-3 py-1 text-cyan/90 animate-pulse">
              <span className="text-cyan">❯</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-30 w-full max-w-3xl p-8 bg-black/55 border border-cyan/25 rounded-2xl backdrop-blur-2xl shadow-2xl flex flex-col gap-6 fade-in">
          <div className="font-mono text-[9px] tracking-[0.35em] text-cyan/60 text-center uppercase">
            SELECT YOUR ROLE TO SECURE ACCESS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="relative bg-black/35 border border-cyan/15 hover:border-cyan hover:shadow-[0_0_30px_rgba(0,229,255,0.25)] rounded-xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1 hover:bg-cyan/5 group overflow-hidden cursor-pointer"
              onClick={() => onLogin("operator")}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="block text-4xl mb-3 drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]">🧑‍💼</span>
              <span className="block font-display font-bold text-lg text-white mb-2 tracking-wide group-hover:text-cyan">
                OPERATOR
              </span>
              <span className="block text-xs text-cyan/60 group-hover:text-cyan/80 leading-relaxed">
                Critical alerts, gauges, and live system monitoring feed.
              </span>
            </button>
            <button
              className="relative bg-black/35 border border-cyan/15 hover:border-cyan hover:shadow-[0_0_30px_rgba(0,229,255,0.25)] rounded-xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1 hover:bg-cyan/5 group overflow-hidden cursor-pointer"
              onClick={() => onLogin("engineer")}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="block text-4xl mb-3 drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]">⚙️</span>
              <span className="block font-display font-bold text-lg text-white mb-2 tracking-wide group-hover:text-cyan">
                ENGINEER
              </span>
              <span className="block text-xs text-cyan/60 group-hover:text-cyan/80 leading-relaxed">
                Full diagnostics, sensor metrics, and HMI telemetry graphs.
              </span>
            </button>
            <button
              className="relative bg-black/35 border border-cyan/15 hover:border-cyan hover:shadow-[0_0_30px_rgba(0,229,255,0.25)] rounded-xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1 hover:bg-cyan/5 group overflow-hidden cursor-pointer"
              onClick={() => onLogin("manager")}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="block text-4xl mb-3 drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]">📊</span>
              <span className="block font-display font-bold text-lg text-white mb-2 tracking-wide group-hover:text-cyan">
                MANAGER
              </span>
              <span className="block text-xs text-cyan/60 group-hover:text-cyan/80 leading-relaxed">
                Comprehensive reports, uptime metrics, and KPI analytics.
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;