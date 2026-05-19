function Sidebar({ role, sensors, machinesData = {} }) {
  const isManager = role === "manager";
  const sensorArray = Object.values(sensors);

  // Calculate dynamic live telemetry stats for Manager view using machinesData!
  const motorRisk = machinesData.motor?.risk || 0;
  const pumpRisk = machinesData.pump?.risk || 0;
  const genRisk = machinesData.generator?.risk || 0;
  const avgRisk = (motorRisk + pumpRisk + genRisk) / 3;
  const integrity = 100 - avgRisk;

  const motorTemp = machinesData.motor?.sensors?.temp?.current || 70;
  const pumpTemp = machinesData.pump?.sensors?.pressure?.current ? (35 + machinesData.pump.sensors.pressure.current * 0.35) : 60;
  const generatorTemp = machinesData.generator?.sensors?.load?.current ? (40 + machinesData.generator.sensors.load.current * 0.45) : 65;
  const tempAvg = (motorTemp + pumpTemp + generatorTemp) / 3;

  let activeWarnings = 0;
  let activeCriticals = 0;
  Object.values(machinesData).forEach(m => {
    if (m.sensors) {
      Object.values(m.sensors).forEach(s => {
        if (s.current >= s.critical) {
          activeCriticals++;
        } else if (s.current >= s.warn) {
          activeWarnings++;
        }
      });
    }
  });

  let opHealthText = "HEALTHY";
  let opHealthColor = "#10b981";
  if (integrity > 80) {
    opHealthText = "HEALTHY";
    opHealthColor = "#10b981";
  } else if (integrity > 60) {
    opHealthText = "STABLE";
    opHealthColor = "#f59e0b";
  } else if (integrity > 40) {
    opHealthText = "WARNING";
    opHealthColor = "#f59e0b";
  } else {
    opHealthText = "SEVERE DISRUPTION";
    opHealthColor = "#ef4444";
  }

  if (isManager) {
    return (
      <div className="sidebar w-80 p-4 bg-black/40 border-r border-cyan/15 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <h3 className="font-display font-bold text-xs tracking-[0.25em] text-white border-b border-cyan/15 pb-2 uppercase">
            📊 EXECUTIVE SUMMARY
          </h3>
          <div className="flex flex-col gap-4">

            {/* System Health Factor */}
            <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
              <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-cyan/60 uppercase">
                <span>SYS INTEGRITY FACTOR</span>
                <span>%</span>
              </div>
              <div className="font-display text-2xl font-bold tracking-tight" style={{ color: opHealthColor }}>
                {integrity.toFixed(1)}%
              </div>
              <div className="w-full bg-cyan/10 h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${integrity}%`,
                    background: opHealthColor,
                    boxShadow: `0 0 6px ${opHealthColor}`
                  }}
                />
              </div>
            </div>

            {/* Aggregated Primary Sensor average */}
            <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
              <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-cyan/60 uppercase">
                <span>MACHINE TEMP AVG</span>
                <span>°C</span>
              </div>
              <div className="font-display text-2xl font-bold tracking-tight text-white">
                {tempAvg.toFixed(1)}°C
              </div>
              <div className="font-mono text-[9px] mt-1 tracking-wider" style={{ color: tempAvg >= 75 ? "#ef4444" : tempAvg >= 65 ? "#f59e0b" : "#10b981" }}>
                {tempAvg >= 75 ? "⚠️ CRITICAL DEVIATION" : tempAvg >= 65 ? "⚠️ WARNING EXCESS" : "🟢 NOMINAL RANGE"}
              </div>
            </div>

            {/* Out of limit counts */}
            <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
              <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-cyan/60 uppercase">
                <span>LIMIT EXCURSIONS</span>
                <span>CHANNELS</span>
              </div>
              <div className="font-display text-2xl font-bold tracking-tight" style={{ color: activeCriticals > 0 ? "#ef4444" : activeWarnings > 0 ? "#f59e0b" : "#10b981" }}>
                {activeWarnings + activeCriticals}
              </div>
              <div className="flex gap-3 font-mono text-[9px] mt-1 tracking-wider">
                <span className="text-[#f59e0b]">⚠ {activeWarnings} WARN</span>
                <span className="text-[#ef4444]">🔴 {activeCriticals} CRIT</span>
              </div>
            </div>

            {/* Plant efficiency factor */}
            <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
              <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-cyan/60 uppercase">
                <span>OPERATIONAL HEALTH</span>
                <span>SYS</span>
              </div>
              <div className="font-mono text-[10px] font-bold mt-1 tracking-wider" style={{ color: opHealthColor }}>
                {opHealthText}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Operator and Engineer Standard detailed sensor-cards sidebar
  return (
    <div className="sidebar w-80 p-4 bg-black/40 border-r border-cyan/15 flex flex-col gap-6 overflow-y-auto">
      <div className="flex flex-col gap-4">
        <h3 className="font-display font-bold text-xs tracking-[0.25em] text-white border-b border-cyan/15 pb-2 uppercase">
          📊 LIVE CHANNELS
        </h3>
        <div className="flex flex-col gap-4">
          {sensorArray.map((s) => {
            const isWarn = s.current >= s.warn;
            const isCrit = s.current >= s.critical;

            const fillPct = Math.min(100, (s.current / s.max) * 100);
            const maxHist = Math.max(...s.history, 1);

            let barColor = "#10b981";
            let stateClass = "border-emerald-500/20";
            if (isCrit) {
              barColor = "#ef4444";
              stateClass = "border-red-500/35";
            } else if (isWarn) {
              barColor = "#f59e0b";
              stateClass = "border-amber-500/30";
            }

            const historyAvg = s.history.reduce((sum, val) => sum + val, 0) / s.history.length;
            const trend = s.current > historyAvg + 0.5
              ? "UPWARD 📈"
              : s.current < historyAvg - 0.5
                ? "DOWNWARD 📉"
                : "STABLE ⚖️";

            return (
              <div 
                key={s.id} 
                className={`bg-card/50 backdrop-blur-xl border ${stateClass} p-4 rounded-xl flex flex-col gap-1 relative z-10 hover:border-cyan/40 transition-all duration-300 tilt group`}
              >
                {/* Thin left status indicator strip */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" 
                  style={{ backgroundColor: barColor }}
                />

                <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-cyan/60 uppercase pl-2">
                  <span>{s.name}</span>
                  <span>{s.unit}</span>
                </div>

                <div className="font-display text-xl font-bold tracking-tight text-white pl-2">
                  {typeof s.current === "number" ? s.current.toFixed(1) : s.current}
                </div>

                {/* Progress bar track */}
                <div className="w-full bg-cyan/5 h-[3px] rounded-full overflow-hidden mt-2 ml-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${fillPct}%`,
                      backgroundColor: barColor,
                      boxShadow: `0 0 6px ${barColor}`
                    }}
                  />
                </div>

                {/* Custom Sparkline block */}
                <div className="flex items-end justify-between h-[20px] mt-3 gap-[2px] ml-2 bg-black/30 p-1 rounded border border-cyan/5">
                  {s.history.map((v, i) => {
                    const barH = Math.max(2, (v / maxHist) * 12);
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-[1px] transition-all duration-300"
                        style={{
                          height: `${barH}px`,
                          backgroundColor: barColor,
                          opacity: 0.35 + (i / s.history.length) * 0.65
                        }}
                      />
                    );
                  })}
                </div>

                {/* Custom cyberpunk hover trend indicators */}
                <div className="text-[8px] font-mono text-cyan/50 mt-1 pl-2 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Trend: {trend}
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
