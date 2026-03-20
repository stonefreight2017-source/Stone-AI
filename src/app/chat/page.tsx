"use client";

import { useState } from "react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!message.trim()) {
      setError("Please type a message first.");
      return;
    }

    setLoading(true);
    setError("");
    setReply("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setReply(data.answer || "No reply came back.");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#f4f4f5", marginBottom: "16px" }}>Chat</h1>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type your message here..."
        rows={5}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
          backgroundColor: "#27272a",
          color: "#f4f4f5",
          border: "1px solid #52525b",
          borderRadius: "8px",
          outline: "none",
          resize: "vertical",
        }}
      />

      <button
        onClick={handleSend}
        disabled={loading}
        style={{
          marginTop: "12px",
          padding: "10px 20px",
          fontSize: "16px",
          fontWeight: 500,
          backgroundColor: loading ? "#3b82f680" : "#2563eb",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Sending..." : "Send"}
      </button>

      {error && (
        <p style={{ color: "#f87171", marginTop: "16px" }}>
          {error}
        </p>
      )}

      {reply && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#27272a",
            border: "1px solid #3f3f46",
            borderRadius: "8px",
            color: "#e4e4e7",
            whiteSpace: "pre-wrap",
          }}
        >
          {reply}
        </div>
      )}
    </main>
  );
}
