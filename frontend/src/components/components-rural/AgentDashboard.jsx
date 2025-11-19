import React from "react";
import AgentCard from "./AgentCard";

/**
 * AgentDashboard shows 4 agent cards in vertical order:
 * 1) Symptom Agent
 * 2) Complexity Agent
 * 3) Route Agent (PCP/MDT/HIGH)
 * 4) Simplify Agent
 */
export default function AgentDashboard({ agentOutputs }) {
  const { symptom, complexity, route, simplify } = agentOutputs;

  return (
    <div className="agent-dashboard">
      <AgentCard
        title="Symptom Agent"
        subtitle={symptom.status}
        content={
          symptom.data
            ? (
              <>
                {symptom.data.symptoms && symptom.data.symptoms.length > 0 ? (
                  <div className="bullet-list">
                    {symptom.data.symptoms.map((s, idx) => <div key={idx} className="bullet">• {s}</div>)}
                  </div>
                ) : <div className="muted">No explicit symptoms extracted.</div>}
                {symptom.data.possible_diseases && symptom.data.possible_diseases.length > 0 && (
                  <div className="muted">Note: possible_diseases present from older flows.</div>
                )}
              </>
            )
            : <div className="muted">Waiting for symptom extraction…</div>
        }
      />

      <AgentCard
        title="Complexity Agent"
        subtitle={complexity.status}
        content={
          complexity.data ? <div>Classified: <strong>{String(complexity.data.complexity || complexity.data).toUpperCase()}</strong></div>
            : <div className="muted">Determining case complexity…</div>
        }
      />

      <AgentCard
        title="Route Agent"
        subtitle={route.status}
        content={
          route.data ? (
            <>
              <div><strong>Route:</strong> {route.data.route}</div>
              {route.data.specialists && route.data.specialists.length > 0 && (
                <>
                  <div className="subhead">Specialists involved</div>
                  <div className="bullet-list">
                    {route.data.specialists.map((s, i) => <div key={i} className="bullet">• {s}</div>)}
                  </div>
                </>
              )}
              {route.data.specialist_discussion && (
                <>
                  <div className="subhead">Specialists discussion (moderator)</div>
                  <div className="smallbox">{route.data.specialist_discussion}</div>
                </>
              )}
              {route.data.patient_friendly_advice && (
                <>
                  <div className="subhead">Advice</div>
                  <div className="smallbox">{route.data.patient_friendly_advice}</div>
                </>
              )}
              {route.data.medicines_advised && route.data.medicines_advised.length > 0 && (
                <>
                  <div className="subhead">Medicines</div>
                  <div className="bullet-list">
                    {route.data.medicines_advised.map((m, i) => <div key={i} className="bullet">• {m}</div>)}
                  </div>
                </>
              )}
            </>
          ) : <div className="muted">Routing to specialists…</div>
        }
      />

      <AgentCard
        title="Simplify Agent"
        subtitle={simplify.status}
        content={
          simplify.data && simplify.data.simplified_sections ? (
            <>
              <div className="subhead">Simplified 5 Sections</div>
              <div className="smallbox">
                {["CONDITION SUMMARY","POSSIBLE CAUSES","NURSE ACTIONS","ESCALATION CRITERIA","MEDICINES ADVISED"].map((h) => (
                  <div key={h}>
                    <strong>{h}:</strong><br/>
                    <div className="mini">{(simplify.data.simplified_sections[h] || "").toString()}</div>
                    <hr />
                  </div>
                ))}
              </div>
            </>
          ) : <div className="muted">Awaiting simplified summary…</div>
        }
      />
    </div>
  );
}
