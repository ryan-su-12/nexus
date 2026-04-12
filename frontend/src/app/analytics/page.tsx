"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/AuthContext";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // TODO: wire up to backend chat endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user?.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <h1 className="text-lg font-bold tracking-tight">Axon Chat</h1>
        <p className="text-xs text-muted">Ask anything about your portfolio</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4 opacity-20">◈</div>
            <p className="text-sm text-muted max-w-sm">
              Ask Axon about your portfolio performance, risk analysis, market trends, or anything else.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-accent text-background"
                  : "bg-surface border border-border text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => (
                      <strong className="font-semibold text-accent">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 text-muted">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-accent" />
                <span className="text-xs">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-5 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Axon..."
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted outline-none focus:border-accent/50 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-background disabled:opacity-40 hover:bg-accent/90 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
