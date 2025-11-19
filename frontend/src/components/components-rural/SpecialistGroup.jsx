import React from "react";

/* Simple visual of 3 specialist avatars while MDT runs */
export default function SpecialistGroup({ specialists = [] }) {
  const list = specialists.length ? specialists : ["Gen Surgery","Cardio","Infectious"];
  return (
    <div className="specialist-group">
      {list.map((s, i) => (
        <div key={i} className="specialist-avatar" title={s}>
          <div className="abbr">{s.split("_")[0].slice(0,2).toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}
