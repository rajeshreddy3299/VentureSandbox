import React from "react";
import { Info, ShieldAlert, Award } from "lucide-react";

export function CompetitorMap({ competitors, companyName }) {
  // Safe defaults if no competitors are loaded yet
  const list = competitors || [
    { name: "Incumbents", details: "Established companies in the market.", pricing: "Varies", x: 70, y: 70 },
    { name: "Low Cost Alternatives", details: "Cheap, basic feature templates.", pricing: "Free - Low", x: 20, y: 30 }
  ];

  // Assign coordinate positions for rendering on 2D map if not present
  const positioned = list.map((c, idx) => {
    // Deterministic coordinates based on index and naming
    const hash = c.name.charCodeAt(0) + c.name.charCodeAt(c.name.length - 1 || 0);
    const x = c.x || (30 + (hash % 50));
    const y = c.y || (20 + ((hash * 7) % 60));
    return { ...c, x, y };
  });

  // Your startup's coordinate (placed centrally, or draggable in design)
  const myPosition = { name: `${companyName || "Your Startup"} (Target)`, x: 50, y: 55 };

  return (
    <div className="competitors-container">
      <div className="competitors-header">
        <h2 className="section-title">🗺️ Competitor Positioning Map</h2>
        <span className="subtitle">Visualizing product market fit</span>
      </div>

      <div className="competitor-layout">
        {/* SVG Scatter Plot */}
        <div className="map-view">
          <svg className="scatter-plot" viewBox="0 0 100 100">
            {/* Grid lines */}
            <line x1="10" y1="50" x2="90" y2="50" stroke="#475569" strokeWidth="0.5" strokeDasharray="2" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="#475569" strokeWidth="0.5" strokeDasharray="2" />
            
            {/* Axes */}
            <line x1="10" y1="90" x2="90" y2="90" stroke="#94a3b8" strokeWidth="1" />
            <line x1="10" y1="10" x2="10" y2="90" stroke="#94a3b8" strokeWidth="1" />

            {/* Axis Labels */}
            <text x="90" y="94" fill="#94a3b8" fontSize="3" textAnchor="end">Pricing (High →)</text>
            <text x="6" y="15" fill="#94a3b8" fontSize="3" transform="rotate(-90 6 15)" textAnchor="end">Features (Rich →)</text>

            {/* Plot competitors */}
            {positioned.map((comp, idx) => (
              <g key={idx}>
                <circle cx={comp.x} cy={100 - comp.y} r="3" fill="#38bdf8" className="dot competitor-dot" />
                <text x={comp.x} y={100 - comp.y - 4} fill="#e2e8f0" fontSize="3.5" textAnchor="middle" fontWeight="bold">
                  {comp.name}
                </text>
              </g>
            ))}

            {/* Plot my startup */}
            <g>
              <circle cx={myPosition.x} cy={100 - myPosition.y} r="4" fill="#a855f7" className="dot startup-dot pulse-circle" />
              <text x={myPosition.x} y={100 - myPosition.y - 5} fill="#f3e8ff" fontSize="4.5" textAnchor="middle" fontWeight="bold">
                ⭐ {myPosition.name}
              </text>
            </g>
          </svg>
        </div>

        {/* Competitor Details Cards */}
        <div className="competitors-list">
          <h3 className="sub-header">Identified Rivals</h3>
          <div className="list-scroll">
            {positioned.map((comp, idx) => (
              <div key={idx} className="comp-card">
                <div className="comp-card-header">
                  <span className="comp-name">{comp.name}</span>
                  <span className="comp-price">{comp.pricing}</span>
                </div>
                <p className="comp-details">{comp.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
