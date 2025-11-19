// AgentCard.jsx
import React from "react";

export default function AgentCard({ agent, onToggle }) {
  const { id, title, subtitle, status, output, expanded = true, icon } = agent;
  const statusColor = status === "idle" ? "badge-idle" : status === "running" ? "badge-run" : "badge-done";

  return (
    <div className={`agent-card ${expanded ? "" : "collapsed"}`} role="group" aria-labelledby={`agent-${id}`}>
      <div className="agent-head">
        <div className="agent-left">
          <div className="agent-icon">{icon}</div>
          <div className="agent-meta">
            <div id={`agent-${id}`} className="agent-title">{title}</div>
            <div className="agent-sub">{subtitle}</div>
          </div>
        </div>
        <div className="agent-right">
          <div className={`agent-badge ${statusColor}`}>{status}</div>
        </div>
      </div>

      {(expanded ?? true) && (
        <div className="agent-body">
          {output ? (
            // CSS-based typewriter effect for agent output
            <pre className="agent-output">{output}</pre>
          ) : (
            <div className="agent-wait">No output yet.</div>
          )}
        </div>
      )}

      <div style={{ textAlign: "right", marginTop: 8 }}>
       
      </div>
    </div>
  );
}
