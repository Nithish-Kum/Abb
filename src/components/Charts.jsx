import { ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

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
  let valColor = "var(--brand)";
  if (numericVal >= critVal) {
    valColor = "var(--rose)";
  } else if (numericVal >= warnVal) {
    valColor = "var(--brand)";
  }

  // Unique gradient id
  const gradId = `chartGrad-${title.replace(/\s+/g, '')}`;

  return (
    <div className="chart-card fade-in">
      <div className="chart-header">
        <div className="chart-title">◆ {title}</div>
        <div className="chart-val" style={{ color: valColor }}>
          {value}
        </div>
      </div>

      {/* ✅ FIX: Increased height so visible even in warning */}
      <div style={{ width: "100%", height: "120px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>

            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255, 91, 46, 0.05)"
              strokeDasharray="2 3"
              vertical={false}
            />

            {warnVal && (
              <ReferenceLine 
                y={warnVal} 
                stroke="var(--brand)" 
                strokeDasharray="3 3" 
                label={{ value: 'WARN', fill: 'var(--brand)', fontSize: 7, position: 'insideRight', offset: 10 }} 
              />
            )}
            {critVal && (
              <ReferenceLine 
                y={critVal} 
                stroke="var(--rose)" 
                strokeDasharray="3 3" 
                label={{ value: 'CRIT', fill: 'var(--rose)', fontSize: 7, position: 'insideRight', offset: 10 }} 
              />
            )}

            <Area
              type="monotone"
              dataKey="telemetry"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              isAnimationActive={true}
              animationDuration={600}
              dot={({ cx, cy, payload }) => {
                if (critVal && payload.telemetry >= critVal) {
                  return <circle cx={cx} cy={cy} r={4.5} fill="var(--rose)" stroke="#fff" strokeWidth={1} filter="drop-shadow(0 0 5px var(--rose))" key={`dot-${cx}-${cy}`} />;
                } else if (warnVal && payload.telemetry >= warnVal) {
                  return <circle cx={cx} cy={cy} r={4.5} fill="var(--brand)" stroke="#fff" strokeWidth={1} filter="drop-shadow(0 0 5px var(--brand))" key={`dot-${cx}-${cy}`} />;
                }
                return null;
              }}
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
                        background: "rgba(15, 22, 50, 0.95)",
                        border: `1px solid ${color}`,
                        padding: "6px 10px",
                        borderRadius: "6px",
                        fontSize: "0.68rem",
                        fontFamily: "var(--font-mono)",
                        color: "#fff",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
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