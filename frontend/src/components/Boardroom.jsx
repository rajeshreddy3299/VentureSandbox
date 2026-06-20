import React, { useRef, useEffect } from "react";
import { Send, User, Bot, HelpCircle } from "lucide-react";

export function Boardroom({ chatHistory, isThinking, onSendMessage }) {
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isThinking]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = inputRef.current.value.trim();
    if (!val || isThinking) return;
    onSendMessage(val);
    inputRef.current.value = "";
  };

  const handleSuggest = (msg) => {
    if (isThinking) return;
    onSendMessage(msg);
  };

  // Quick suggestion chips based on common investor questions
  const suggestions = [
    "Our CAC will be organic via SEO and referrals.",
    "We plan to charge a $29/month SaaS subscription.",
    "Our moat is a proprietary ML model trained on unique clinical data.",
    "We are focusing first on developer advocates in tech startups."
  ];

  return (
    <div className="boardroom-container">
      <div className="boardroom-header">
        <h2 className="section-title">🔊 The Boardroom Debate</h2>
        <div className="panel-avatars">
          <span className="avatar-indicator active" title="Astra (Moonshot VC)">🚀</span>
          <span className="avatar-indicator active" title="Rex (The Bootstrapper)">🥾</span>
          <span className="avatar-indicator active" title="Elena (Financial Auditor)">📊</span>
          <span className="avatar-indicator active" title="Maya (Customer Advocate)">❤️</span>
        </div>
      </div>

      <div className="chat-area">
        {chatHistory.map((chat, idx) => {
          const isUser = chat.sender === "user";
          const isSystem = chat.sender === "system";
          
          let senderClass = "sender-agent";
          if (isUser) senderClass = "sender-user";
          if (isSystem) senderClass = "sender-system";

          return (
            <div key={idx} className={`chat-message ${senderClass}`}>
              <div className="message-header" style={{ color: chat.color }}>
                <span className="message-avatar">{chat.avatar || "🤖"}</span>
                <span className="message-sender-name">{chat.name}</span>
                <span className="message-time">{chat.timestamp}</span>
              </div>
              <div className="message-body">
                <p>{chat.message}</p>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="chat-message sender-agent thinking-message">
            <div className="message-header" style={{ color: "#a855f7" }}>
              <span className="message-avatar animate-pulse">🤖</span>
              <span className="message-sender-name">Investors are debating...</span>
            </div>
            <div className="message-body">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="boardroom-footer">
        <div className="suggestions-row">
          {suggestions.map((s, idx) => (
            <button 
              key={idx} 
              type="button" 
              onClick={() => handleSuggest(s)}
              className="suggestion-chip"
              disabled={isThinking}
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            placeholder={isThinking ? "Debating, please wait..." : "Type your defense or answer the investors..."}
            disabled={isThinking}
            autoComplete="off"
          />
          <button type="submit" disabled={isThinking || !inputRef} className="send-btn">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
