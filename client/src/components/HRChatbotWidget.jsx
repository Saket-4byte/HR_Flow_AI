import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Bot, User, RefreshCw } from "lucide-react";
import { sendChatMessage } from "../services/api";

export default function HRChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am HRFlow AI Assistant powered by Google Gemini 2.5 Flash. Ask me anything about company leave policies, casual leave limits, or approval workflows!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage.trim();
    setInputMessage("");

    // Append user message
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userText);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: response.reply || "Thank you for your inquiry." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I experienced a temporary issue retrieving the policy response. Standard casual leave is up to 5 days per request and 24 days per year.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-primary-container to-secondary-container hover:from-primary hover:to-secondary text-on-primary rounded-full shadow-2xl hover:scale-105 transition duration-200 flex items-center gap-2 font-mono text-xs border border-white/20"
        >
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>HR Policy AI</span>
        </button>
      )}

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] glass-panel rounded-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden h-[500px]">
          {/* Header */}
          <div className="p-4 bg-surface-container-high/80 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-on-surface">HR Flow AI Chatbot</h3>
                <p className="text-[10px] text-on-surface-variant font-mono">Gemini 2.5 Flash</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-on-surface-variant transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Timeline */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary-container text-on-primary font-medium rounded-tr-none"
                      : "bg-surface-container-low border border-white/10 text-on-surface rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === "user" && (
                  <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start items-center text-xs text-on-surface-variant font-mono">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
                <span className="flex items-center gap-1">
                  Gemini is thinking <RefreshCw className="w-3 h-3 animate-spin" />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-surface-container-low/80 border-t border-white/10 flex gap-2">
            <input
              type="text"
              placeholder="Ask about casual leave policy..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:outline-none transition font-sans"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2 bg-primary-container hover:bg-primary text-on-primary rounded-xl transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
