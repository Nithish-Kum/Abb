function Sidebar({ role, sensors }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3>📊 LIVE CHANNELS</h3>
        <div id="sensorCards">
          {Object.values(sensors).map((s) => {
            const isWarn = s.current >= s.warn;
            const isCrit = s.current >= s.critical;
            const cardClass = isCrit ? "critical" : isWarn ? "warn" : "";
            
            // Limit calculation for the progressive safety bar
            const fillPct = Math.min(100, (s.current / s.max) * 100);
            const maxHist = Math.max(...s.history, 1);

            let barColor = "var(--green)";
            if (isCrit) {
              barColor = "var(--red)";
            } else if (isWarn) {
              barColor = "var(--yellow)";
            }

            return (
              <div key={s.id} className={`sensor-card ${cardClass} fade-in`}>
                <div className="sensor-header">
                  <span className="sensor-name">{s.name}</span>
                  <span className="sensor-unit">{s.unit}</span>
                </div>
                
                <div className="sensor-value">
                  {typeof s.current === "number" ? s.current.toFixed(1) : s.current}
                </div>

                {/* relative telemetry progress bar */}
                <div 
                  style={{ 
                    height: "3px", 
                    background: "rgba(255,255,255,0.04)", 
                    borderRadius: "2px", 
                    marginTop: "6px",
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

                {/* sparkline history */}
                <div className="sparkline">
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
