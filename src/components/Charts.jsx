import { ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid } from "recharts";

function Chart({ title, value, data = [], color, warnVal, critVal }) {
  // Convert simple array of numbers into Recharts-friendly objects
  const chartData = data.map((val, idx) => ({
    timeIndex: idx,
    telemetry: val
  }));

  // Determine value-based styling color
  const numericVal = parseFloat(value);
  let valColor = "var(--accent)";
  if (numericVal >= critVal) {
    valColor = "var(--red)";
  } else if (numericVal >= warnVal) {
    valColor = "var(--yellow)";
  }

  // Create a clean id for gradient definitions
  const gradId = `chartGrad-${title.replace(/\s+/g, '')}`;

  return (
    <div className="chart-card fade-in">
      <div className="chart-header">
        <div className="chart-title">◆ {title}</div>
        <div className="chart-val" style={{ color: valColor, transition: "color 0.3s" }}>
          {value}
        </div>
      </div>
      <div style={{ width: "100%", height: "80px", position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            
            {/* SCADA Grid Overlay */}
            <CartesianGrid
              stroke="rgba(255, 255, 255, 0.025)"
              strokeDasharray="2 3"
              vertical={false}
            />

            {/* Glowing neon area */}
            <Area
              type="monotone"
              dataKey="telemetry"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradId})`}
              isAnimationActive={true}
              animationDuration={800}
              style={{
                filter: `drop-shadow(0 0 3px ${color}80)`
              }}
            />

            {/* Futuristic floating tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        background: "rgba(5, 15, 25, 0.9)",
                        border: `1px solid ${color}`,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-main)",
                        boxShadow: `0 0 10px ${color}33`
                      }}
                    >
                      <span>VAL: {roundVal(payload[0].value)}</span>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 1 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Utility to round and display values cleanly
const roundVal = (v) => {
  if (typeof v === "number") {
    return Math.round(v * 100) / 100;
  }
  return v;
};

export default Chart;
