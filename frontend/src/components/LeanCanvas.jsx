import React from "react";
import { AlertTriangle, CheckCircle, Skull, Info } from "lucide-react";

export function LeanCanvas({ canvas }) {
  const blocks = [
    { key: "Problem", title: "Problem", icon: "❓" },
    { key: "Solution", title: "Solution", icon: "💡" },
    { key: "Value Proposition", title: "Unique Value Proposition", icon: "✨" },
    { key: "Moat/Advantage", title: "Unfair Advantage (Moat)", icon: "🛡️" },
    { key: "Customer Segments", title: "Customer Segments", icon: "👥" },
    { key: "Channels", title: "Channels", icon: "📣" },
    { key: "Key Metrics", title: "Key Metrics", icon: "📈" },
    { key: "Cost Structure", title: "Cost Structure", icon: "💸" },
    { key: "Revenue Streams", title: "Revenue Streams", icon: "💰" }
  ];

  return (
    <div className="canvas-container">
      <div className="canvas-header">
        <h2 className="section-title">Live Business Canvas</h2>
        <span className="subtitle">Real-time agent-validated framework</span>
      </div>
      <div className="canvas-grid">
        {blocks.map(block => {
          const state = canvas[block.key] || { text: "Undefined", status: "warning", flagReason: "Unchecked" };
          let statusClass = "status-ok";
          let StatusIcon = CheckCircle;
          
          if (state.status === "warning") {
            statusClass = "status-warning";
            StatusIcon = AlertTriangle;
          } else if (state.status === "veto") {
            statusClass = "status-veto";
            StatusIcon = Skull;
          }

          return (
            <div key={block.key} className={`canvas-card ${statusClass}`}>
              <div className="card-header">
                <span className="card-icon">{block.icon}</span>
                <span className="card-title">{block.title}</span>
                <div className="status-badge">
                  <StatusIcon className="badge-icon" size={14} />
                  {state.flagReason && (
                    <div className="tooltip">
                      <Info size={12} className="info-icon" />
                      <span className="tooltiptext">{state.flagReason}</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="card-text">{state.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
