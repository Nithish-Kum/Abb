import { useState, useEffect } from "react";

function Timeline({ mode }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const msgs = {
      normal: { color: "var(--green)", msg: "SYSTEM NORMAL: Telemetry stabilized within safe limits." },
      warning: { color: "var(--yellow)", msg: "ANOMALY EXCURSION: AI escalation triggered on elevated sensors." },
      failure: { color: "var(--red)", msg: "CRITICAL BREACH: Safety threshold failure. Emergency routines active." },
      recovery: { color: "var(--blue)", msg: "RECOVERY SYSTEM: Restoring baseline parameters. Bypass engaged." }
    };
    
    const m = msgs[mode.toLowerCase()];
    if (m) {
      setEvents(prev => {
        const newEvent = {
          id: Date.now(),
          ...m,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        // Keep up to 15 events in historical record
        return [newEvent, ...prev].slice(0, 15);
      });
    }
  }, [mode]);

  return (
    <div className="timeline-card fade-in">
      <div className="timeline-title">◆ CHRONOLOGICAL EVENT LOG</div>
      <div className="timeline">
        {events.length === 0 ? (
          <div 
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.7rem",
              padding: "16px 0",
              fontFamily: "var(--font-mono)"
            }}
          >
            Awaiting system events...
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="tl-item">
              <div 
                className="tl-dot" 
                style={{ 
                  background: ev.color, 
                  color: ev.color,
                  transition: "background 0.3s"
                }}
              ></div>
              <div className="tl-content">
                <div className="tl-msg">{ev.msg}</div>
                <div className="tl-time">{ev.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Timeline;
