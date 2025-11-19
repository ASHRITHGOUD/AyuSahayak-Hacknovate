// ChatWindow.jsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import AgentCard from "./AgentCard";
import EmergencyCard from "./EmergencyCard";

export default function ChatWindow({
  messages,
  onSendMessage,
  isTyping,
  agents,
  toggleAgent
}) {
  const inputRef = useRef();
  const messagesRef = useRef();

  const handleSend = () => {
    const val = inputRef.current.value;
    if (!val?.trim()) return;

    // prevent sending while processing
    if (isTyping) return;

    onSendMessage(val);
    inputRef.current.value = "";
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // Render each chat item
  const renderMessageItem = (m, i) => {

    // EMERGENCY CARD
    if (m.type === "emergency") {
      return (
        <div key={`emergency-${i}`} style={{ margin: "12px 0" }}>
          <EmergencyCard data={m.data} />
        </div>
      );
    }

        // BANNER (routing / nursing summary / confidence)
        if (m.type === "banner") {
      return (
        <div
          key={i}
          className={`banner ${m.risk}`}
          dangerouslySetInnerHTML={{ __html: m.text }}
        />
      );
    }
    
    // AGENT PLACEHOLDER / CARD
    if (m.type === "agent") {

      if (m.agentId === "route") return null;

      const agent = agents.find((a) => a.id === m.agentId);

      if (!agent || !agent.visible) {
        return (
          <div key={`agent-${i}`} style={{ margin: "8px 0" }}>
            <div className="message-bubble bot" style={{ maxWidth: "90%", opacity: 0.5 }}>
              <div className="message-text">⏳ Agent loading…</div>
            </div>
          </div>
        );
      }

      return (
        <div key={`agent-${i}`} style={{ margin: "8px 0" }}>
          <AgentCard agent={agent} onToggle={() => toggleAgent(agent.id)} />
        </div>
      );
    }

    // NORMAL CHAT MESSAGE
    return (
      <div key={i}>
        <MessageBubble sender={m.sender} text={m.text} />
      </div>
    );
  };

  useEffect(() => {
    messagesRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, agents, isTyping]);

  return (
    <div className="chat-window">
      <div className="messages-and-agents">
        <div className="chat-column" style={{ width: "100%" }}>
          <div className="messages" aria-live="polite">
            {messages.map((m, i) => renderMessageItem(m, i))}
            <div ref={messagesRef} />
          </div>

          {/* Bottom Input Bar */}
          <div className="input-bar">
            <input
              ref={inputRef}
              placeholder={
                isTyping
                  ? "⏳ Processing… please wait"
                  : "Describe patient's symptoms and vitals..."
              }
              onKeyDown={handleEnter}
              disabled={isTyping}
            />
            <button onClick={handleSend} disabled={isTyping}>
              ➡️ Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
