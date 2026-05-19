import { useEffect, useState } from "react";

const aiInsights = {
  normal: [
    { label: "SYSTEM STABLE", text: "All systems operating within nominal limits. Thermal dissipation and vibration baseline remain steady. Zero anomalies in queue.", conf: 92 },
    { label: "SYSTEM STABLE", text: "High machine efficiency (94.2%). Voltage oscillations are standard. AI predicts no failures in the next 120 minutes.", conf: 89 }
  ],
  warning: [
    { label: "ANOMALY DETECTED", text: "⚠ Thermal drift detected in Motor Temp. Vibration amplitude shows atypical peaks. Recommend fan diagnostic check.", conf: 78 },
    { label: "ANOMALY DETECTED", text: "⚠ Valve restriction coefficient is high. Transient pressure ripples correlate with a 72% probability of partial line clog.", conf: 83 }
  ],
  failure: [
    { label: "CRITICAL CONDITION", text: "🔴 CASUALTY PREDICTION: Motor thermal runaway cascade underway. Temperature limit exceeded. Immediate power shutdown suggested.", conf: 96 },
    { label: "CRITICAL CONDITION", text: "🔴 MULTIPLE SENSOR RUPTURE: Simultaneous pressure drop and current spike. Emergency bypass valve trigger recommended.", conf: 94 }
  ],
  recovery: [
    { label: "SYSTEM STABILIZING", text: "♻ Cooling circuit active. Core motor temperatures dropped 22°C. Sensors are returning to nominal calibration curves.", conf: 87 }
  ]
};

function AIInsight({ mode }) {
  const [insight, setInsight] = useState(aiInsights.normal[0]);

  useEffect(() => {
    const list = aiInsights[mode.toLowerCase()] || aiInsights.normal;
    // Keep it deterministic on render, but select a random one when mode changes
    const chosen = list[Math.floor(Math.random() * list.length)];
    setInsight(chosen);
  }, [mode]);

  return (
    <div className="ai-insight">
      <div className="ai-insight-header">
        <div className="ai-chip">AI DIAGNOSTIC</div>
        <span
          style={{
            fontSize: "0.62rem",
            color: "var(--indigo)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.15em",
            fontWeight: "700",
            transition: "color 0.3s"
          }}
        >
          {insight.label}
        </span>
      </div>
      <div className="ai-insight-text">{insight.text}</div>
      <div className="ai-insight-conf">
        <span
          style={{
            fontSize: "0.58rem",
            fontFamily: "var(--font-mono)",
            color: "var(--ink-500)",
            letterSpacing: "0.05em"
          }}
        >
          AI CONFIDENCE:
        </span>
        <div className="conf-bar-bg">
          <div
            className="conf-bar-fill"
            style={{
              width: `${insight.conf}%`
            }}
          ></div>
        </div>
        <div className="conf-pct">{insight.conf}%</div>
      </div>
    </div>
  );
}

export default AIInsight;
