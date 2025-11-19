import React from "react";

export default function EmergencyCard({ data }) {
  return (
    <div
      style={{
        border: "2px solid #ff4d4d",
        padding: "16px",
        borderRadius: "12px",
        background: "#ffecec",
        color: "#b30000",
        boxShadow: "0 0 12px rgba(255,0,0,0.3)",
        marginBottom: "16px",
        animation: "pulseRed 1.5s infinite"
      }}
    >
      <h2 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>
        🚨 EMERGENCY CASE — ACTION REQUIRED
      </h2>

      <p style={{ whiteSpace: "pre-line", fontSize: "14px" }}>
        <strong>Condition Summary:</strong>
        {"\n"}
        {data["CONDITION SUMMARY"]}
      </p>

      <p style={{ whiteSpace: "pre-line", fontSize: "14px" }}>
        <strong>Possible Causes:</strong>
        {"\n"}
        {data["POSSIBLE CAUSES"]}
      </p>

      <p style={{ whiteSpace: "pre-line", fontSize: "14px" }}>
        <strong>Nurse Actions:</strong>
        {"\n"}
        {data["NURSE ACTIONS"]}
      </p>

      <p style={{ whiteSpace: "pre-line", fontSize: "14px" }}>
        <strong>Escalation Criteria:</strong>
        {"\n"}
        {data["ESCALATION CRITERIA"]}
      </p>

      <style>
        {`
          @keyframes pulseRed {
            0% { box-shadow: 0 0 8px rgba(255,0,0,0.3); }
            50% { box-shadow: 0 0 18px rgba(255,0,0,0.6); }
            100% { box-shadow: 0 0 8px rgba(255,0,0,0.3); }
          }
        `}
      </style>
    </div>
  );
}
