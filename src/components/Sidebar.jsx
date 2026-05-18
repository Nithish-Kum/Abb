function Sidebar({ role, sensors }) {
  const isManager = role === "manager";
  const sensorArray = Object.values(sensors);

  // Compute aggregated stats for Manager View
  const activeWarnings = sensorArray.filter(s => s.current >= s.warn && s.current < s.critical).length;
  const activeCriticals = sensorArray.filter(s => s.current >= s.critical).length;
  const primarySensor = sensorArray[0] || { current: 70, name: "TEMPERATURE", unit: "°C", warn: 75, critical: 85 };
  const primaryVal = primarySensor.current;

  let healthScore = 100;
  sensorArray.forEach(s => {
    if (s.current >= s.critical) healthScore -= 12;
    else if (s.current >= s.warn) healthScore -= 6;
  });
  healthScore = Math.max(30, healthScore);

  if (isManager) {
    return (
      <div className="sidebar">
        <div className="sidebar-section">
          <h3>📊 EXECUTIVE SUMMARY</h3>
          <div id="sensorCards">
            
            {/* System Health Factor */}
            <div className="sensor-card fade-in">
              <div className="sensor-header">
                <span className="sensor-name">SYS INTEGRITY FACTOR</span>
                <span className="sensor-unit">%</span>
              </div>
              <div className="sensor-value" style={{ color: healthScore > 80 ? "var(--green)" : healthScore > 60 ? "var(--yellow)" : "var(--red)" }}>
                {healthScore.toFixed(0)}%
              </div>
              <div className="scada-linear-track" style={{ marginTop: "8px", height: "4px" }}>
                <div 
                  className="scada-linear-fill" 
                  style={{ 
                    width: `${healthScore}%`, 
                    background: healthScore > 80 ? "var(--green)" : healthScore > 60 ? "var(--yellow)" : "var(--red)",
                    boxShadow: `0 0 6px ${healthScore > 80 ? "var(--green)" : healthScore > 60 ? "var(--yellow)" : "var(--red)"}`
                  }}
                />
              </div>
            </div>

            {/* Aggregated Primary Sensor average */}
            <div className="sensor-card fade-in" style={{ animationDelay: "0.05s" }}>
              <div className="sensor-header">
                <span className="sensor-name">{primarySensor.name.toUpperCase()} AVG</span>
                <span className="sensor-unit">{primarySensor.unit}</span>
              </div>
              <div className="sensor-value">
                {primaryVal.toFixed(1)}{primarySensor.unit}
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                {primaryVal >= primarySensor.critical ? "⚠️ CRITICAL DEVIATION" : primaryVal >= primarySensor.warn ? "⚠️ WARNING EXCESS" : "🟢 NOMINAL RANGE"}
              </div>
            </div>

            {/* Out of limit counts */}
            <div className="sensor-card fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="sensor-header">
                <span className="sensor-name">LIMIT EXCURSIONS</span>
                <span className="sensor-unit">CHANNELS</span>
              </div>
              <div className="sensor-value" style={{ color: activeCriticals > 0 ? "var(--red)" : activeWarnings > 0 ? "var(--yellow)" : "var(--green)" }}>
                {activeWarnings + activeCriticals}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "6px", fontSize: "0.6rem", fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--yellow)" }}>⚠ {activeWarnings} WARN</span>
                <span style={{ color: "var(--red)" }}>🔴 {activeCriticals} CRIT</span>
              </div>
            </div>

            {/* Plant efficiency factor */}
            <div className="sensor-card fade-in" style={{ animationDelay: "0.15s" }}>
              <div className="sensor-header">
                <span className="sensor-name">OPERATIONAL HEALTH</span>
                <span className="sensor-unit">SYS</span>
              </div>
              <div className="sensor-value" style={{ fontSize: "1.05rem", padding: "6px 0", color: activeCriticals > 0 ? "var(--red)" : activeWarnings > 0 ? "var(--yellow)" : "var(--green)" }}>
                {activeCriticals > 0 ? "⚠️ SEVERE DISRUPTION" : activeWarnings > 0 ? "⚠️ PARTIAL LIMIT LOSS" : "🟢 SECURE STATE"}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Operator and Engineer Standard detailed sensor-cards sidebar
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>📊 LIVE CHANNELS</h3>
        <div id="sensorCards">
          {sensorArray.map((s) => {
            const isWarn = s.current >= s.warn;
            const isCrit = s.current >= s.critical;
            const cardClass = isCrit ? "critical" : isWarn ? "warn" : "normal";
            
            const fillPct = Math.min(100, (s.current / s.max) * 100);
            const maxHist = Math.max(...s.history, 1);

            let barColor = "var(--green)";
            if (isCrit) {
              barColor = "var(--red)";
            } else if (isWarn) {
              barColor = "var(--yellow)";
            }

            const historyAvg = s.history.reduce((sum, val) => sum + val, 0) / s.history.length;
            const trend = s.current > historyAvg + 0.5 
              ? "UPWARD 📈" 
              : s.current < historyAvg - 0.5 
              ? "DOWNWARD 📉" 
              : "STABLE ⚖️";

            return (
              <div key={s.id} className={`sensor-card ${cardClass} fade-in`}>
                {/* Thin left status indicator strip */}
                <div className={`sensor-status-strip ${cardClass}`} />

                {/* Custom cyberpunk hover tooltip */}
                <div className="sensor-tooltip">
                  {s.name}: <span style={{ color: barColor }}>{s.current.toFixed(1)}{s.unit}</span> | Trend: {trend}
                </div>

                <div className="sensor-header" style={{ paddingLeft: "6px" }}>
                  <span className="sensor-name">{s.name}</span>
                  <span className="sensor-unit">{s.unit}</span>
                </div>
                
                <div className="sensor-value" style={{ paddingLeft: "6px" }}>
                  {typeof s.current === "number" ? s.current.toFixed(1) : s.current}
                </div>
                
                <div 
                  style={{ 
                    height: "3px", 
                    background: "rgba(255,255,255,0.04)", 
                    borderRadius: "2px", 
                    marginTop: "6px",
                    marginLeft: "6px",
                    overflow: "hidden" 
                  }}
                >
                  <div 
                    style={{ 
                      width: `${fillPct}%`, 
                      height: "100%", 
                      background: barColor,
                      boxShadow: `0 0 6px ${barColor}`,
                      transition: "width 0.5s ease, background 0.3s"
                    }}
                  ></div>
                </div>

                <div className="sparkline" style={{ marginLeft: "6px" }}>
                  {s.history.map((v, i) => {
                    const h = Math.max(4, (v / maxHist) * 20);
                    return (
                      <div 
                        key={i} 
                        className="spark-bar" 
                        style={{ 
                          height: `${h}px`,
                          transition: "height 0.4s ease"
                        }}
                      ></div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
