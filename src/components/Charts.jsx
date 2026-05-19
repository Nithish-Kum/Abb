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
  let valColor = "var(--color-cyan)";
  if (numericVal >= critVal) {
    valColor = "var(--color-danger)";
  } else if (numericVal >= warnVal) {
    valColor = "var(--color-amber)";
  }

  // Unique gradient id
  const gradId = `chartGrad-${title.replace(/\s+/g, '')}`;

  return (
    <div
      className="bg-card/50 backdrop-blur-xl border border-border rounded-xl p-4 tilt flex flex-col gap-4 shadow-2xl transition-all duration-300 hover:border-cyan/30"
    >
      <div className="flex justify-between items-center border-b border-cyan/10 pb-2">
        <div className="font-display text-[11px] font-bold tracking-wider text-[#00e5ff] uppercase">
          ◆ {title}
        </div>
        <div className="font-display text-xl font-bold tracking-tight shrink-0 pl-2" style={{ color: valColor }}>
          {value}
        </div>
      </div>

      {/* Recharts Area Chart container */}
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
              stroke="rgba(0, 229, 255, 0.05)"
              strokeDasharray="2 3"
              vertical={false}
            />

            {warnVal && (
              <ReferenceLine
                y={warnVal}
                stroke="var(--color-amber)"
                strokeDasharray="3 3"
                label={{ value: 'WARN', fill: 'var(--color-amber)', fontSize: 7, position: 'insideRight', offset: 10 }}
              />
            )}
            {critVal && (
              <ReferenceLine
                y={critVal}
                stroke="var(--color-danger)"
                strokeDasharray="3 3"
                label={{ value: 'CRIT', fill: 'var(--color-danger)', fontSize: 7, position: 'insideRight', offset: 10 }}
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
                  return <circle cx={cx} cy={cy} r={4.5} fill="var(--color-danger)" stroke="#fff" strokeWidth={1} filter="drop-shadow(0 0 5px var(--color-danger))" key={`dot-${cx}-${cy}`} />;
                } else if (warnVal && payload.telemetry >= warnVal) {
                  return <circle cx={cx} cy={cy} r={4.5} fill="var(--color-amber)" stroke="#fff" strokeWidth={1} filter="drop-shadow(0 0 5px var(--color-amber))" key={`dot-${cx}-${cy}`} />;
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
                      className="bg-[#050816] px-3 py-1.5 rounded-lg text-[11px] font-mono text-[#00e5ff] font-bold shadow-2xl border border-cyan/45"
                    >
                      VAL: {payload[0].value.toFixed(2)}
                    </div>
                  );
                }
                return null;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Real-time Animated 3D Bar Columns */}
      <div className="flex justify-center items-end h-[60px] gap-1.5 bg-black/40 rounded-lg p-2 border border-cyan/10">
        {chartData.slice(-12).map((d, i) => {
          const scalePct = Math.min(100, Math.max(10, (d.telemetry / (critVal || 100)) * 100));
          const colColor = d.telemetry >= critVal ? "var(--color-danger)" : d.telemetry >= warnVal ? "var(--color-amber)" : color;
          return (
            <div key={i} className="bar-3d-stage h-[40px]">
              <div
                className="bar-3d-column"
                style={{
                  transform: `scaleY(${scalePct / 100})`,
                  color: colColor
                }}
              >
                <div
                  className="bar-3d-face bar-3d-front"
                  style={{
                    background: `linear-gradient(to top, rgba(7, 9, 26, 0.4), ${colColor})`
                  }}
                />
                <div className="bar-3d-face bar-3d-back" />
                <div className="bar-3d-face bar-3d-left" />
                <div className="bar-3d-face bar-3d-right" />
                <div
                  className="bar-3d-face bar-3d-top"
                  style={{
                    backgroundColor: colColor
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Chart;