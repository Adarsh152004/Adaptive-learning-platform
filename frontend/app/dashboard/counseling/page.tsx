"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  LayoutDashboard, 
  MessageCircle, 
  Activity, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import CounselingInterface from "@/components/counseling/CounselingInterface";
import CounselingDashboard from "@/components/counseling/CounselingDashboard";

type Tab = "session" | "analytics";

export default function CounselingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("session");
  const userId = "guest_user_123";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Professional Banner */}
      <div className="bg-white border-b border-slate-100 px-12 py-8 z-30">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-end md:items-center gap-8">
           <div>
              <div className="flex items-center gap-2 text-primary font-bold mb-2">
                 <Heart className="w-4 h-4 fill-primary" />
                 <span className="uppercase tracking-[0.4em] text-[10px]">MindBridge Mental Wellness</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-tight">
                Adaptive AI <span className="text-primary italic font-serif">Counseling</span>
              </h1>
           </div>

           <div className="flex bg-slate-100 p-1.5 rounded-full overflow-hidden self-start md:self-auto">
              <TabButton 
                active={activeTab === "session"} 
                onClick={() => setActiveTab("session")} 
                label="Active Session" 
                icon={<MessageCircle className="w-4 h-4" />} 
              />
              <TabButton 
                active={activeTab === "analytics"} 
                onClick={() => setActiveTab("analytics")} 
                label="Emotional Stats" 
                icon={<Activity className="w-4 h-4" />} 
              />
           </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-8 md:p-12 lg:p-16">
        <AnimatePresence mode="wait">
          {activeTab === "session" ? (
             <motion.div 
               key="session"
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -20, opacity: 0 }}
               className="h-[800px] bg-white rounded-[4rem] overflow-hidden border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]"
             >
                <CounselingInterface userId={userId} />
             </motion.div>
          ) : (
             <motion.div 
               key="analytics"
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: -20, opacity: 0 }}
             >
                <CounselingDashboard userId={userId} />
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="p-8 text-center bg-white border-t border-slate-100">
         <div className="flex justify-center items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Privacy Standards Compliant</span>
         </div>
         <p className="text-[10px] text-slate-300 font-medium tracking-wider">
           &copy; 2026 LearnSphere MindGuard Labs. All biological processing occurs at edge.
         </p>
      </footer>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-xs transition-all ${
        active 
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" 
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
