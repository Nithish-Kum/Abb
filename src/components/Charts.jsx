import { ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid } from "recharts";

function Chart({ title, value, data = [], color, warnVal, critVal }) {

  // ✅ ALWAYS ensure valid numeric value
  const numericVal = parseFloat(value) || 0;

  // ✅ FIX: Safe fallback data (CRITICAL FIX)
  const safeData =
    Array.isArray(data) && data.length > 0
      ? data
      : Array(20).fill(numericVal); // fallback so chart never disappears

  // ✅ FIX: Always convert to numbers
  const chartData = safeData.map((val, idx) => ({
    timeIndex: idx,
    telemetry: typeof val === "number" ? val : parseFloat(val) || 0
  }));

  // Determine value-based styling color
  let valColor = "var(--accent)";
  if (numericVal >= critVal) {
    valColor = "var(--red)";
  } else if (numericVal >= warnVal) {
    valColor = "var(--yellow)";
  }

  // Unique gradient id
  const gradId = `chartGrad-${title.replace(/\s+/g, '')}`;

  return (
    <div
      className="chart-card fade-in"
      style={{
        border: "1px solid rgba(255,255,255,0.05)", // debug visibility
        borderRadius: "8px"
      }}
    >
      <div className="chart-header">
        <div className="chart-title">◆ {title}</div>
        <div className="chart-val" style={{ color: valColor }}>
          {value}
        </div>
      </div>

      {/* ✅ FIX: Increased height so visible even in warning */}
      <div style={{ width: "100%", height: "120px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>

            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255, 255, 255, 0.025)"
              strokeDasharray="2 3"
              vertical={false}
            />

            <Area
              type="monotone"
              dataKey="telemetry"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              isAnimationActive={true}
              animationDuration={600}
              style={{
                filter: `drop-shadow(0 0 4px ${color}80)`
              }}
            />

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
                        color: "var(--text-main)"
                      }}
                    >
                      VAL: {Math.round(payload[0].value * 100) / 100}
                    </div>
                  );
                }
                return null;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Chart;