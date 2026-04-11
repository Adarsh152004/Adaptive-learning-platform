"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import CognitiveGames from "@/components/mindguard/CognitiveGames";
import { Sparkles, Trophy, Target, Zap, Loader2 } from "lucide-react";
import axios from "axios";

export default function GamesArenaPage() {
  const userId = "guest_user_123";
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:8001/api/mindguard/performance-stats/${userId}`);
      setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 lg:p-16">
      <div className="max-w-[1600px] mx-auto">
        {/* Arena Header */}
        <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <div className="flex items-center gap-3 text-primary font-bold mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="uppercase tracking-[0.3em] text-xs">MindGuard Neural Labs</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none">
              Cognitive <span className="text-primary italic font-serif">Assessment</span>
            </h1>
            <p className="text-slate-500 mt-4 text-lg font-medium max-w-2xl">Precision-engineered psychological protocols to measure and optimize your neurological state.</p>
          </div>
          
          <div className="flex gap-6">
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center gap-4 transition-transform hover:scale-105">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Trophy className="w-8 h-8 text-amber-500 fill-current" />
              </div>
              <div>
                <p className="text-xs uppercase font-black text-slate-400 tracking-widest">Global Rank</p>
                <p className="text-3xl font-black tracking-tighter text-slate-900">#014</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 items-start">
          {/* Main Stage - Now much bigger and longer */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-[4rem] overflow-hidden min-h-[900px] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
              <CognitiveGames userId={userId} onComplete={() => fetchStats()} />
            </div>
          </div>

          {/* Sidebar Stats - Clean and spacious */}
          <div className="xl:col-span-1 space-y-8">
             <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <h4 className="font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 mb-10 text-sm">
                  <Target className="w-5 h-5 text-primary" /> Historical Performance
                </h4>
                <div className="space-y-8">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 text-slate-200 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <StatRow 
                        label="Reaction Latency" 
                        value={stats?.reaction?.value || "---"} 
                        trend={stats?.reaction?.trend || "0%"} 
                      />
                      <StatRow 
                        label="Working Memory" 
                        value={stats?.memory?.value || "---"} 
                        trend={stats?.memory?.trend || "0%"} 
                      />
                      <StatRow 
                        label="Sustained Focus" 
                        value={stats?.focus?.value || "---"} 
                        trend={stats?.focus?.trend || "0%"} 
                      />
                    </>
                  )}
                </div>
             </div>

             <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-xl">
                <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6">Real-time Telemetry</h4>
                <div className="flex justify-between items-end gap-4 relative z-10">
                   <div>
                      <p className="text-5xl font-black tracking-tighter mb-1">{stats?.focus?.value === "---" ? "0.0" : stats?.focus?.value.split('/')[0]}</p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Avg. Performance</p>
                   </div>
                   <div className="text-right">
                      <p className="text-5xl font-black tracking-tighter mb-1">{stats ? "32" : "0"}</p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Protocols Run</p>
                   </div>
                </div>
                <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
             </div>

             <div className="p-10 bg-primary/5 rounded-[3rem] border border-primary/10">
                <p className="text-primary font-black uppercase tracking-widest text-[10px] mb-4">Neural Tip</p>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                  Consistent training in the <span className="text-primary font-bold italic">Subconscious Vigilance</span> module has been shown to improve deep focus duration by up to 22%.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, trend }: any) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 hover:bg-slate-50 transition-colors rounded-xl px-2 -mx-2">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black tracking-tight text-slate-900">{value}</p>
      </div>
      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
        isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
      }`}>
        {trend}
      </span>
    </div>
  );
}
