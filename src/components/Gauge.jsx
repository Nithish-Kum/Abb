function Gauge({ title, value, max = 100, unit = "%", warnLimit = 70, critLimit = 85 }) {
  const score = Math.min(Math.max(0, value), max);

  // 270 degree arc math (using radius 50)
  // C = 2 * PI * r = 2 * 3.14159 * 50 = 314.16
  // 270 degrees is 3/4 of the circle = 235.62 length, with a 78.54 gap
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // 314.16
  const arcLength = circumference * 0.75; // 235.62
  const strokeDashoffset = arcLength - (score / max) * arcLength;

  // Determine dynamic severity colors
  let valColor = "#10b981";
  if (score >= critLimit) {
    valColor = "#ef4444";
  } else if (score >= warnLimit) {
    valColor = "#f59e0b";
  } else if (title.toLowerCase().includes("risk") && score >= 40) {
    // Risk uses warning color above 40
    valColor = score >= 70 ? "#ef4444" : "#f59e0b";
  }

  // Draw circular ticks for SCADA instrumentation effect
  const ticks = [];
  const totalTicks = 20;
  for (let i = 0; i <= totalTicks; i++) {
    // Math to space ticks around 270 degrees (135deg to 405deg)
    const angleDeg = 135 + (i / totalTicks) * 270;
    const angleRad = (angleDeg * Math.PI) / 180;
    const r1 = 41; // inner radius
    const r2 = 45; // outer radius
    const x1 = 70 + r1 * Math.cos(angleRad);
    const y1 = 70 + r1 * Math.sin(angleRad);
    const x2 = 70 + r2 * Math.cos(angleRad);
    const y2 = 70 + r2 * Math.sin(angleRad);

    // Highlight ticks passed by the current value
    const valPercent = (score / max) * totalTicks;
    const isLit = i <= valPercent;

    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isLit ? valColor : "rgba(255,255,255,0.06)"}
        strokeWidth={isLit ? 1.5 : 1}
        style={{
          transition: "stroke 0.4s ease, stroke-width 0.4s ease",
          filter: isLit ? `drop-shadow(0 0 2px ${valColor})` : "none"
        }}
      />
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
      <div className="font-mono text-[10px] tracking-[0.2em] text-cyan/60 uppercase">◆ {title}</div>
      <div style={{ position: "relative", width: "100%", height: "auto" }}>
        <svg className="w-full h-auto" viewBox="0 0 140 130">
          <defs>
            <linearGradient id={`gaugeGlow-${title.replace(/\s+/g, '')}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0, 229, 255, 0.2)" />
              <stop offset="100%" stopColor={valColor} />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Instrument Ticks */}
          {ticks}

          {/* Track Arc (Background) */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            transform="rotate(135 70 70)"
          />

          {/* Glowing Telemetry Arc */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={`url(#gaugeGlow-${title.replace(/\s+/g, '')})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(135 70 70)"
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
              filter: "drop-shadow(0 0 4px rgba(0, 229, 255, 0.3))"
            }}
          />

          {/* Center Analytics Display */}
          <text
            x="70"
            y="73"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontSize="18"
            fill={valColor}
            fontWeight="900"
            style={{
              transition: "fill 0.4s ease",
              filter: `drop-shadow(0 0 6px ${valColor}50)`
            }}
          >
            {Math.round(score)}
            <tspan fontSize="10" fontWeight="500" fill="rgba(0, 229, 255, 0.5)">{unit}</tspan>
          </text>

          <text
            x="70"
            y="90"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="7"
            fill="rgba(0, 229, 255, 0.5)"
            letterSpacing="0.05em"
          >
            {score >= critLimit ? "CRIT LIMIT" : score >= warnLimit ? "WARNING LIMIT" : "SYS NOMINAL"}
          </text>
        </svg>
      </div>
    </div>
  );
}

export default Gauge;
