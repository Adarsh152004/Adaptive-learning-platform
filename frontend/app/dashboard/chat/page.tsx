"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles 
} from "lucide-react";
import axios from "axios";

export default function ChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", content: "Hello! I'm your AI learning assistant. I can help you understand complex topics, summarize chapters, or plan your study schedule. What's on your mind?" }
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
      setMessages((prev) => [...prev, { role: "bot", content: "Apologies, I encountered a connection issue. Please ensure the backend server is active." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-160px)] flex flex-col pt-8">
      {/* Header Pill */}
      <div className="flex items-center gap-4 mb-8 p-6 bento-tile bg-white border-primary/10">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/20">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">AI Knowledge Pulse</h1>
          <p className="text-sm text-text-muted font-bold italic">Context-Aware Neural Tutor</p>
        </div>
        <div className="ml-auto hidden md:block">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full shadow-sm shadow-primary/5 ring-1 ring-primary/5">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Gemini 1.5 Integration</span>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-8 pr-6 custom-scrollbar scroll-smooth"
      >
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-start gap-5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                msg.role === "bot" 
                  ? "bg-white border-primary/20 text-primary" 
                  : "bg-primary border-primary text-white"
              }`}>
                {msg.role === "bot" ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div className={`max-w-[75%] p-6 rounded-3xl text-sm font-medium leading-relaxed bento-tile bg-white ${
                msg.role === "bot" 
                  ? "border-l-4 border-l-primary rounded-tl-none text-text-main" 
                  : "border-r-4 border-r-primary rounded-tr-none text-text-main bg-surface/30"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
              <div className="p-6 rounded-3xl rounded-tl-none italic text-text-muted text-xs font-bold tracking-tight bg-white border border-border">
                Synthesizing response...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Pill */}
      <div className="mt-8 relative group">
        <form onSubmit={sendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your inquiry here..."
            className="w-full bg-white border-2 border-border rounded-2xl py-6 pl-10 pr-24 focus:border-primary outline-none transition-all placeholder:text-text-muted/40 font-bold text-lg shadow-2xl shadow-primary/5"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              disabled={!input.trim() || loading}
              type="submit"
              className="primary-btn flex items-center justify-center w-14 h-14 rounded-xl shadow-lg shadow-primary/20 disabled:scale-90 disabled:opacity-50"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </form>
        <p className="text-center text-[9px] font-black text-text-muted mt-5 uppercase tracking-[0.2em] opacity-40">
          Precision Education &bull; AI Verification Recommended
        </p>
      </div>
    </div>
  );
}
