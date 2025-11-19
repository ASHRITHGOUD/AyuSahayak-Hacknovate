import React from "react";

/**
 * MessageBubble
 * - Uses .message-wrapper.bot / .message-wrapper.user to align left/right.
 * - Inside the wrapper we render the .message-bubble (same visuals as before).
 * - Preserves newlines.
 */
export default function MessageBubble({ sender, text }) {
  const isUser = sender === "user";
  const wrapperClass = `message-wrapper ${isUser ? "user" : "bot"}`;
  const bubbleClass = `message-bubble ${isUser ? "user" : "bot"}`;

  const formatted = String(text || "").replace(/\n/g, "<br/>");

  return (
    <div className={wrapperClass} aria-live="polite">
      <div className={bubbleClass}>
        <p
          className="message-text"
          dangerouslySetInnerHTML={{ __html: formatted }}
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
}
