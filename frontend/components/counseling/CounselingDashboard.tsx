"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  CloudRain, 
  Sun,
  Smile,
  Zap,
  Activity,
  Brain,
  Sparkles
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import axios from "axios";

export default function CounselingDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [aiRecs, setAiRecs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`http://localhost:8001/api/counseling/report/${userId}`);
        setData(res.data);
        setIsLoading(false); // Unblock UI immediately after getting stats

        // Fetch AI summary and recommendations in parallel
        const [sumRes, recRes] = await Promise.allSettled([
          axios.post(`http://localhost:8001/api/counseling/session/summary`, { user_id: userId }),
          axios.get(`http://localhost:8001/api/mindguard/recommendations/${userId}`)
        ]);

        if (sumRes.status === "fulfilled") setSummaryData(sumRes.value.data);
        if (recRes.status === "fulfilled") {
          const recs = recRes.value.data?.recommendations;
          if (Array.isArray(recs) && recs.length > 0) setAiRecs(recs);
        }
      } catch (e) {
        console.error("Failed to fetch report", e);
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [userId]);

  const mockData = [
    { day: "Mon", stress: 65, mood: 2 },
    { day: "Tue", stress: 45, mood: 4 },
    { day: "Wed", stress: 75, mood: 1 },
    { day: "Thu", stress: 30, mood: 5 },
    { day: "Fri", stress: 55, mood: 3 },
    { day: "Sat", stress: 20, mood: 5 },
    { day: "Sun", stress: 15, mood: 5 },
  ];

  const stats = React.useMemo(() => {
    if (!data?.emotion_history || data.emotion_history.length === 0) {
      return {
        distribution: { happy: 0, neutral: 0, stressed: 0 },
        resilience: "Calibrating",
        avgStress: 0
      };
    }

    const history = data.emotion_history;
    const counts = { happy: 0, neutral: 0, stressed: 0 };
    let totalStress = 0;

    history.forEach((entry: any) => {
      const e = entry.emotion?.toLowerCase();
      if (e === 'happy' || e === 'excited') counts.happy++;
      else if (e === 'stressed' || e === 'anxious' || e === 'angry' || e === 'sad') counts.stressed++;
      else counts.neutral++;
      
      totalStress += entry.stress_score || 0;
    });

    const total = history.length;
    const avgStress = Math.round(totalStress / total);
    
    // Resilience logic: inverse of stress frequency
    let resilience = "High";
    const stressRatio = counts.stressed / total;
    if (stressRatio > 0.6) resilience = "Low";
    else if (stressRatio > 0.3) resilience = "Medium";

    return {
      distribution: {
        happy: Math.round((counts.happy / total) * 100),
        neutral: Math.round((counts.neutral / total) * 100),
        stressed: Math.round((counts.stressed / total) * 100)
      },
      resilience,
      avgStress,
      dominantEmotion: Object.keys(counts).reduce((a, b) => (counts as any)[a] > (counts as any)[b] ? a : b)
    };
  }, [data]);

  if (isLoading) return <div className="p-12 text-center font-bold text-slate-400">Analyzing emotional records...</div>;


  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none mb-4">
            Emotional <span className="text-primary italic font-serif">Intelligence</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-2xl">A deep dive into your mental landscape and stress resilience over time.</p>
        </div>
        
        <div className="flex gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="p-3 bg-emerald-50 rounded-2xl">
                 <TrendingUp className="w-6 h-6 text-emerald-500" />
               </div>
               <div>
                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Resilience</p>
                 <p className={`text-2xl font-black tracking-tighter ${
                   stats.resilience === 'High' ? 'text-emerald-500' : 
                   stats.resilience === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                 }`}>{stats.resilience}</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="p-3 bg-blue-50 rounded-2xl">
                 <Brain className="w-6 h-6 text-blue-500" />
               </div>
               <div>
                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Average Stress</p>
                 <p className="text-2xl font-black tracking-tighter text-slate-900">{stats.avgStress}%</p>
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
               <div className="p-3 bg-purple-50 rounded-2xl">
                 <Sparkles className="w-6 h-6 text-purple-500" />
               </div>
               <div>
                 <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Typical Emotion</p>
                 <p className="text-2xl font-black tracking-tighter text-slate-900 capitalize">{stats.dominantEmotion || "Neutral"}</p>
               </div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stress Trend Card */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" /> Stress Score Trend
              </h3>
              <div className="flex gap-2">
                 <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400">Weekly</span>
              </div>
           </div>
           
           <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data?.emotion_history?.length > 0 ? [...data.emotion_history].reverse() : mockData}>
                    <defs>
                      <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '15px' }}
                    />
                    <Area type="monotone" dataKey="stress" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorStress)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="space-y-8">
           <div className="bg-primary p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 flex justify-between items-center">
                 <span>Mentor's Note</span>
                 {summaryData?.provider && <span className="text-[8px] bg-white/10 px-2 py-1 rounded-full">{summaryData.provider}</span>}
              </h4>
              <p className="text-xl font-bold leading-tight mb-8 relative z-10 italic">
                "{summaryData?.summary || 'You are doing great. Keep up the good work and remember to take deep breaths.'}"
              </p>
              <div className="flex items-center gap-2 relative z-10">
                 <Smile className="w-4 h-4 text-white/40" />
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                   {stats.resilience === 'High' ? 'Excellent Resilience' : 'Keep Focusing on Balance'}
                 </span>
              </div>
              <Activity className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5" />
           </div>

           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8">Mood Distribution</h4>
              <div className="space-y-6">
                 <MoodStat label="Happy/Productive" percentage={stats.distribution.happy} icon={<Smile className="text-emerald-500" />} color="bg-emerald-500" />
                 <MoodStat label="Focused/Neutral" percentage={stats.distribution.neutral} icon={<Sun className="text-amber-500" />} color="bg-amber-500" />
                 <MoodStat label="Stressed/Anxious" percentage={stats.distribution.stressed} icon={<CloudRain className="text-rose-500" />} color="bg-rose-500" />
              </div>
           </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <section>
         <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
           <Sparkles className="w-4 h-4 text-primary" /> AI Personalized Recommendations
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiRecs.length > 0 ? (
              aiRecs.map((rec, i) => (
                <RecommendationCard
                  key={i}
                  title={`Recommendation ${i + 1}`}
                  desc={rec}
                  icon={
                    i === 0 ? <Clock className="text-primary" /> :
                    i === 1 ? <Zap className="text-amber-500" /> :
                    <Brain className="text-emerald-500" />
                  }
                />
              ))
            ) : (
              // Loading skeletons while AI fetches recs
              [0, 1, 2].map(i => (
                <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 mb-6" />
                  <div className="h-4 bg-slate-100 rounded-full mb-3 w-2/3" />
                  <div className="h-3 bg-slate-50 rounded-full mb-2" />
                  <div className="h-3 bg-slate-50 rounded-full w-4/5" />
                </div>
              ))
            )}
         </div>
      </section>
    </div>
  );
}

function MoodStat({ label, percentage, icon, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
         <span className="flex items-center gap-2">{icon} {label}</span>
         <span>{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
         <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function RecommendationCard({ title, desc, icon }: any) {
  return (
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
       <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
          {icon}
       </div>
       <h5 className="font-black text-slate-900 mb-2">{title}</h5>
       <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
