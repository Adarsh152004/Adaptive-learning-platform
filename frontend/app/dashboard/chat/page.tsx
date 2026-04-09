"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from "lucide-react";
import axios from "axios";

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", content: "Hello! I'm your AI learning assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8001/api/chat", { query: input });
      setMessages((prev) => [...prev, { role: "bot", content: res.data.response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center gap-3 mb-6 p-4 border-b border-white/5 bg-white/5 rounded-2xl backdrop-blur-md">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-heading">AI Tutor</h1>
          <p className="text-sm text-slate-400">Context-aware learning assistant</p>
        </div>
        <div className="ml-auto">
          <span className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            Gemini 1.5 Powered
          </span>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === "bot" ? "bg-indigo-600/20 border border-indigo-600/30" : "bg-purple-600/20 border border-purple-600/30"
              }`}>
                {msg.role === "bot" ? <Bot className="w-5 h-5 text-indigo-400" /> : <User className="w-5 h-5 text-purple-400" />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-2xl shadow-sm leading-relaxed ${
                msg.role === "bot" 
                  ? "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none" 
                  : "bg-indigo-600/20 border border-indigo-600/20 text-white rounded-tr-none"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tl-none italic text-slate-500 text-sm">
                Thinking...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="mt-8">
        <form onSubmit={sendMessage} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your course, concepts, or study tips..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600 group-focus-within:bg-white/[0.08]"
          />
          <button
            disabled={!input.trim() || loading}
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-widest font-bold">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
