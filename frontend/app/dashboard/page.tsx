"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Award, 
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const [riskData, setRiskData] = useState<any>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  const analyzeRisk = async () => {
    setLoadingRisk(true);
    try {
      // Sample metrics: [study_hours, attendance_rate, previous_score, engagement_score]
      const res = await axios.post("http://localhost:8001/api/predict-risk", {
        metrics: [7.5, 0.9, 85, 92]
      });
      setRiskData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRisk(false);
    }
  };

  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"],
    datasets: [
      {
        label: "Performance Score",
        data: [65, 78, 72, 85, 82, 90],
        fill: true,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94a3b8" } },
      x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
    },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading">
            Welcome back, <span className="text-gradient">{session?.user?.name || "Student"}</span>!
          </h1>
          <p className="text-slate-400 mt-1">Here&apos;s your learning progress for this month.</p>
        </div>
        <button 
          onClick={analyzeRisk}
          disabled={loadingRisk}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-indigo-600/10 hover:border-indigo-600/20 transition-all font-medium"
        >
          {loadingRisk ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5 text-indigo-400" />}
          AI Risk Analysis
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Clock className="text-indigo-400" />} label="Study Hours" value="42.5h" trend="+12%" />
        <StatCard icon={<TrendingUp className="text-emerald-400" />} label="Avg. Score" value="88%" trend="+5%" />
        <StatCard icon={<Users className="text-purple-400" />} label="Attendance" value="94%" trend="-2%" />
        <StatCard icon={<Award className="text-pink-400" />} label="Courses Done" value="12" trend="+3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold font-heading">Performance Overview</h3>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm outline-none">
              <option>Last 6 Weeks</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          <div className="h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="glass-card p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold font-heading mb-6">AI Learning Insight</h3>
            {riskData ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-4",
                  riskData.risk_level === "High" ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
                )}>
                  {riskData.risk_level === "High" ? <AlertTriangle className="w-8 h-8 text-red-400" /> : <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                  <div>
                    <p className="text-sm text-slate-400">Current Risk Status</p>
                    <p className={cn("text-lg font-bold", riskData.risk_level === "High" ? "text-red-400" : "text-emerald-400")}>
                      {riskData.status} ({Math.round(riskData.risk_probability * 100)}%)
                    </p>
                  </div>
                </div>
                <p className="text-slate-400 leading-relaxed text-sm">
                  Based on your recent engagement and study patterns, the AI suggests you are {riskData.risk_level === "High" ? "at risk of falling behind." : "well on track for your goals."} 
                </p>
              </motion.div>
            ) : (
              <div className="text-center py-10">
                <BrainCircuit className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Click &quot;AI Risk Analysis&quot; to generate your personalized learning report.</p>
              </div>
            )}
          </div>
          
          <button className="vibrant-btn w-full mt-6 py-2 text-sm">
            View Smart Recommendations
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: any) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-lg",
          trend.startsWith("+") ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        )}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold font-heading mt-1">{value}</p>
      </div>
    </div>
  );
}

function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ");
}
