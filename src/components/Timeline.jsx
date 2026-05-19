import { useState, useEffect } from "react";

function Timeline({ mode }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const msgs = {
      normal: { color: "#10b981", msg: "SYSTEM NORMAL: Telemetry stabilized within safe limits." },
      warning: { color: "#f59e0b", msg: "ANOMALY EXCURSION: AI escalation triggered on elevated sensors." },
      failure: { color: "#ef4444", msg: "CRITICAL BREACH: Safety threshold failure. Emergency routines active." },
      recovery: { color: "#3b82f6", msg: "RECOVERY SYSTEM: Restoring baseline parameters. Bypass engaged." }
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
    <div className="bg-card/50 backdrop-blur-xl border border-border p-4 rounded-xl flex flex-col gap-2 relative z-10 hover:border-cyan/30 transition-all duration-300 tilt">
      <div className="font-mono text-[10px] tracking-[0.2em] text-cyan/60 uppercase">◆ CHRONOLOGICAL EVENT LOG</div>
      <div className="flex flex-col gap-3.5 mt-2 max-h-[220px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="text-center text-cyan/50 text-[10px] py-4 font-mono">
            Awaiting system events...
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="flex items-start gap-3 border-l border-cyan/10 pl-3 relative">
              <div
                className="w-1.5 h-1.5 rounded-full absolute -left-[4px] top-1.5 transition-all duration-300"
                style={{
                  backgroundColor: ev.color,
                  boxShadow: `0 0 6px ${ev.color}`
                }}
              />
              <div className="flex flex-col gap-0.5">
                <div className="text-[10px] text-white/90 leading-relaxed font-sans">{ev.msg}</div>
                <div className="text-[8px] font-mono text-cyan/50">{ev.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Timeline;
