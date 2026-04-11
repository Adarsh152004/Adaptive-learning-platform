"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Minimize2, 
  Maximize2,
  User, 
  Bot,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import axios from "axios";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence: Load history from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("jee_chat_history");
    if (saved) {
      setHistory(JSON.parse(saved));
    } else {
      setHistory([{ role: "ai", content: "Hello! I am JEE Nexus, your personal PCM coach. How can I help you with your preparation today?" }]);
    }
  }, []);

  // Sync to sessionStorage
  useEffect(() => {
    if (history.length > 0) {
      sessionStorage.setItem("jee_chat_history", JSON.stringify(history));
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = { role: "user" as const, content: query };
    setHistory(prev => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8001/api/jee-assistant", {
        query: query,
        history: history
      });
      
      setHistory(prev => [...prev, { role: "ai", content: res.data.response }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: "ai", content: "I encountered a minor lag in the nexus. Let's try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end text-text-main">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0, 
              filter: "blur(0px)"
            }}
            exit={{ opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 1 }}
            style={{ 
              width: isExpanded ? "600px" : "440px",
              height: isExpanded ? "700px" : "620px"
            }}
            className="mb-6 bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[3rem] shadow-[0_32px_128px_rgba(147,51,234,0.18)] flex flex-col overflow-hidden ring-1 ring-black/5 w-[440px] min-h-[620px]"
          >
            {/* Header */}
            <div className="p-8 bg-gradient-to-br from-primary via-[#A855F7] to-[#7E22CE] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
               <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1.25rem] flex items-center justify-center border border-white/40 shadow-xl">
                  <Bot className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tighter leading-none mb-2">NEXUS PILOT</h3>
                  <div className="flex items-center gap-2 opacity-90 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                    Neural Active
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all border border-white/10"
                  title={isExpanded ? "Standard View" : "Wide View"}
                >
                  {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all hover:rotate-90 border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-gradient-to-b from-transparent to-primary/[0.02]"
            >
              {history.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-6 text-[13px] leading-relaxed shadow-lg transition-all relative group ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-[2rem] rounded-tr-none font-bold shadow-primary/20' 
                      : 'bg-white/80 backdrop-blur-md border border-white border-b-4 border-b-primary/5 text-text-main rounded-[2rem] rounded-tl-none font-medium prose prose-sm prose-slate ring-1 ring-black/[0.02]'
                  }`}>
                    {msg.role === 'ai' ? (
                      <ReactMarkdown 
                        components={{
                          p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                          li: ({node, ...props}) => <li className="" {...props} />,
                          h3: ({node, ...props}) => <h3 className="font-black text-sm mt-6 mb-3 tracking-tight uppercase border-b-2 border-primary/5 pb-2" {...props} />,
                          code: ({node, ...props}) => <code className="bg-primary/5 px-2 py-1 rounded-lg text-primary font-black font-mono text-[11px] border border-primary/10 shadow-inner" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="opacity-95">{msg.content}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] rounded-tl-none flex items-center gap-3 border border-white shadow-xl">
                    <div className="w-2.5 h-2.5 bg-primary/30 rounded-full animate-bounce [animation-duration:0.8s]" />
                    <div className="w-2.5 h-2.5 bg-primary/30 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
                    <div className="w-2.5 h-2.5 bg-primary/30 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-8 border-t border-white/60 bg-white/40 backdrop-blur-2xl flex items-center gap-4">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Nexus anything..."
                  className="w-full bg-white/80 border border-white/80 rounded-full px-8 py-5 text-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all shadow-inner font-bold text-text-main placeholder:text-text-muted/30"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-primary hover:bg-primary-hover text-white p-5 rounded-full shadow-2xl shadow-primary/40 disabled:opacity-50 transition-all hover:scale-110 active:scale-90 flex items-center justify-center border border-white/20"
              >
                <Send className="w-6 h-6 fill-current" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Floating Icon */}
      <motion.button
        whileHover={{ scale: 1.1, y: -6 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-20 h-20 bg-gradient-to-br from-primary to-[#7E22CE] text-white rounded-[2rem] shadow-[0_24px_48px_rgba(147,51,234,0.35)] flex items-center justify-center relative group overflow-hidden border-2 border-white/20"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
        
        {/* Animated Rings */}
        {!isOpen && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="absolute w-full h-full rounded-[2rem] bg-primary animate-ping opacity-25" />
            <span className="absolute w-[125%] h-[125%] rounded-[2.5rem] bg-primary/20 animate-pulse duration-[3000ms]" />
          </div>
        )}

        {isOpen ? <X className="w-8 h-8 relative z-10" /> : <MessageSquare className="w-8 h-8 relative z-10" />}
        
        {!isOpen && (
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="absolute right-26 bg-white/95 backdrop-blur-2xl text-primary text-[11px] font-black uppercase tracking-[0.4em] px-6 py-3 rounded-full shadow-2xl border border-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-all flex items-center gap-3"
           >
             NEXUS ACTIVE <Sparkles className="w-4 h-4 fill-current animate-pulse" />
           </motion.div>
        )}
      </motion.button>
    </div>
  );
}
