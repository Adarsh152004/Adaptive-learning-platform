"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Send, User, Bot, Sparkles } from "lucide-react";

export default function MindChat() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([
    { role: "bot", text: "Hi! I'm MindGuard. How are you feeling today? I'm here to listen. ❤️" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8001/api/mindguard/chat", {
        query: userMessage,
      });
      setMessages((prev) => [...prev, { role: "bot", text: res.data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "I'm having a little trouble connecting, but I'm still here for you. Take a deep breath. 🌸" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600/50 to-purple-600/50 flex items-center gap-3 border-b border-white/10">
        <div className="p-2 bg-white/20 rounded-full">
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </div>
        <div>
          <h3 className="font-bold text-white">MindGuard Support</h3>
          <p className="text-xs text-white/70">Empathetic AI Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl flex gap-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white/10 text-white border border-white/10 rounded-tl-none"
                }`}
              >
                {msg.role === "bot" && <Bot className="w-5 h-5 mt-1 shrink-0 text-blue-300" />}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.role === "user" && <User className="w-5 h-5 mt-1 shrink-0 text-white/70" />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Talk to me..."
            className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-6 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-full transition-all shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
