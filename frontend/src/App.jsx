import React, { useState, useEffect } from "react";
import { Boardroom } from "./components/Boardroom";
import { LeanCanvas } from "./components/LeanCanvas";
import { CompetitorMap } from "./components/CompetitorMap";
import { ShieldAlert, Zap, Compass, RefreshCw } from "lucide-react";

function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [canvas, setCanvas] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [viabilityScore, setViabilityScore] = useState(50);
  const [isThinking, setIsThinking] = useState(false);

  // Stress test inputs
  const [activeStressScenario, setActiveStressScenario] = useState(null);
  const [stressResponseText, setStressResponseText] = useState("");

  // Sync state on mount (useful if page is refreshed)
  useEffect(() => {
    fetch("/api/state")
      .then(res => res.json())
      .then(data => {
        if (data.companyName) {
          setCompanyName(data.companyName);
          setDescription(data.description);
          setCanvas(data.canvas);
          setChatHistory(data.chatHistory);
          setCompetitors(data.competitors);
          setViabilityScore(data.viabilityScore);
          setShowOnboarding(false);
        }
      })
      .catch(err => console.log("Offline mode or backend not started yet."));
  }, []);

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !description.trim()) return;

    setIsThinking(true);
    setShowOnboarding(false);

    try {
      const res = await fetch("/api/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, description })
      });
      const data = await res.json();
      setCanvas(data.canvas);
      setChatHistory(data.chatHistory);
      setCompetitors(data.competitors);
      setViabilityScore(data.viabilityScore);
    } catch (err) {
      console.error("Failed to initialize session:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendMessage = async (msg) => {
    setIsThinking(true);
    // Optimistic user update
    setChatHistory(prev => [
      ...prev,
      {
        sender: "user",
        avatar: "👤",
        name: "Founder (You)",
        color: "#3b82f6",
        message: msg,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setCanvas(data.canvas);
      setChatHistory(data.chatHistory);
      setCompetitors(data.competitors);
      setViabilityScore(data.viabilityScore);
    } catch (err) {
      console.error("Chat call failed:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleTriggerStress = (scenario) => {
    setActiveStressScenario(scenario);
    setStressResponseText("");
  };

  const handleSubmitStressResponse = async (e) => {
    e.preventDefault();
    if (!stressResponseText.trim() || isThinking) return;

    setIsThinking(true);
    const scenario = activeStressScenario;
    setActiveStressScenario(null);

    try {
      const res = await fetch("/api/stress-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, userResponse: stressResponseText })
      });
      const data = await res.json();
      setCanvas(data.canvas);
      setChatHistory(data.chatHistory);
      setViabilityScore(data.viabilityScore);
    } catch (err) {
      console.error("Stress test call failed:", err);
    } finally {
      setIsThinking(false);
      setStressResponseText("");
    }
  };

  // Determine color of gauge based on viability score
  const getGaugeColor = (score) => {
    if (score >= 70) return "#10b981"; // green
    if (score >= 45) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className="app-root">
      {showOnboarding && (
        <div className="onboarding-overlay">
          <form className="onboarding-container" onSubmit={handleLaunch}>
            <h1 className="onboarding-title">⚡ VentureSandbox</h1>
            <p className="onboarding-desc">
              Pitch your business model to a critical panel of AI investors and stress-test it against market risks.
            </p>
            <div className="form-group">
              <label htmlFor="company-name-input">Startup Name</label>
              <input
                id="company-name-input"
                type="text"
                placeholder="e.g. BarkFlow, TaskAura"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="company-desc-input">Elevator Pitch & Target Customer</label>
              <textarea
                id="company-desc-input"
                placeholder="Describe what you are building, how it works, and who pays for it."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>
            <button type="submit" id="onboard-submit-btn" className="launch-btn">
              <Compass size={18} /> Enter the Boardroom
            </button>
          </form>
        </div>
      )}

      {/* Main dashboard header */}
      <header className="app-header">
        <div className="logo-section">
          <h1>⚡ VentureSandbox</h1>
          <span className="app-subtitle">Active pitch: <strong>{companyName || "N/A"}</strong></span>
        </div>
        <div className="header-actions">
          <div className="viability-container">
            <span className="viability-label">Viability Index</span>
            <div className="viability-gauge">
              <div 
                className="viability-fill" 
                style={{ 
                  width: `${viabilityScore}%`, 
                  backgroundColor: getGaugeColor(viabilityScore)
                }} 
              />
            </div>
            <span className="viability-number" style={{ color: getGaugeColor(viabilityScore) }}>
              {viabilityScore}%
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setShowOnboarding(true)} 
            className="suggestion-chip" 
            style={{ margin: 0, padding: "0.5rem 1rem" }}
          >
            Reset Boardroom
          </button>
        </div>
      </header>

      {/* Main dashboard content split */}
      <main className="dashboard-grid">
        <section className="left-panel-container">
          <Boardroom
            chatHistory={chatHistory}
            isThinking={isThinking}
            onSendMessage={handleSendMessage}
          />
        </section>

        <section className="right-panel">
          <LeanCanvas canvas={canvas} />
          
          <CompetitorMap competitors={competitors} companyName={companyName} />

          {/* Stress tester interface */}
          <section className="stress-panel">
            <div className="stress-header">
              <div>
                <h3 className="section-title">🚨 Microeconomic Stress Tester</h3>
                <span className="subtitle">Evaluate product durability against competitive & financial risks</span>
              </div>
            </div>

            {!activeStressScenario ? (
              <div className="stress-actions">
                <button 
                  type="button" 
                  onClick={() => handleTriggerStress("google_threat")}
                  className="stress-btn"
                  disabled={isThinking}
                >
                  🔥 Trigger "Google Threat"
                </button>
                <button 
                  type="button" 
                  onClick={() => handleTriggerStress("cac_double")}
                  className="stress-btn"
                  disabled={isThinking}
                >
                  📈 Trigger "CAC Inflation"
                </button>
                <button 
                  type="button" 
                  onClick={() => handleTriggerStress("churn_spike")}
                  className="stress-btn"
                  disabled={isThinking}
                >
                  ⚡ Trigger "Churn Crisis"
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitStressResponse} className="form-group" style={{ marginTop: "0.5rem" }}>
                <label htmlFor="stress-defense-input" style={{ color: "#fca5a5" }}>
                  Active Event: {activeStressScenario === "google_threat" ? "Google releases a free copy of your feature" : activeStressScenario === "cac_double" ? "Paid ad costs double globally" : "Customer churn spikes by 15%"}
                </label>
                <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                  <input
                    id="stress-defense-input"
                    type="text"
                    placeholder="Enter your defensive pivot or mitigation strategy..."
                    value={stressResponseText}
                    onChange={e => setStressResponseText(e.target.value)}
                    style={{ flex: 1 }}
                    required
                    autoFocus
                  />
                  <button type="submit" className="launch-btn" style={{ margin: 0, padding: "0.5rem 1.5rem" }}>
                    Submit Defense
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setActiveStressScenario(null)} 
                    className="suggestion-chip" 
                    style={{ border: "1px solid #ef4444", color: "#fca5a5" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;
