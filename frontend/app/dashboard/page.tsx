"use client";

import { useState } from "react";
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
  Loader2,
  Calendar,
  Zap,
  LayoutGrid,
  ArrowUpRight
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
        borderColor: "#5624d0",
        backgroundColor: "rgba(86, 36, 208, 0.05)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { border: { display: false }, grid: { color: "#f1f1f1" }, ticks: { color: "#6a6f73" } },
      x: { border: { display: false }, grid: { display: false }, ticks: { color: "#6a6f73" } },
    },
  };

  return (
    <main className="min-h-screen bg-surface p-6 md:p-12 font-sans">
      {/* Dynamic Header */}
      <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
            <LayoutGrid className="w-5 h-5" />
            Learning Console
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Hi, <span className="text-primary italic">{session?.user?.name || "Scholar"}</span>
          </h1>
          <p className="text-text-muted mt-2 italic font-medium">Your daily knowledge pulse is ready.</p>
        </div>
        
        <button 
          onClick={analyzeRisk}
          disabled={loadingRisk}
          className="primary-btn flex items-center gap-3 shadow-lg shadow-primary/20"
        >
          {loadingRisk ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
          Run AI Insight
        </button>
      </div>

      {/* Bento Dashboard Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 md:grid-rows-4 gap-4 h-auto md:h-[900px]">
        
        {/* Risk Analysis Status (Large Tile) */}
        <div className="md:col-span-3 md:row-span-2 bento-tile p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center border border-border">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted bg-surface px-2 py-1 rounded border border-border">AI System Active</span>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-4">Risk Status</h3>
            {riskData ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className={`p-6 rounded-sm border-l-4 ${riskData.risk_level === "High" ? "border-error bg-error/5" : "border-success bg-success/5"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {riskData.risk_level === "High" ? <AlertTriangle className="w-6 h-6 text-error" /> : <CheckCircle2 className="w-6 h-6 text-success" />}
                    <p className={`text-xl font-bold ${riskData.risk_level === "High" ? "text-error" : "text-success"}`}>
                      {riskData.status} ({Math.round(riskData.risk_probability * 100)}%)
                    </p>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    Personalized AI prediction suggests you are currently {riskData.risk_level === "High" ? "at risk of performance drops." : "maintaining an excellent learning pace."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-sm">
                <BrainCircuit className="w-12 h-12 text-border mx-auto mb-4" />
                <p className="text-sm text-text-muted font-medium">Click above to initialize AI tracking</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
              <Calendar className="w-4 h-4" /> Next Review: Tomorrow
            </div>
            <button className="text-primary text-xs font-bold hover:underline">View Details</button>
          </div>
        </div>

        {/* Performance Chart (Large Horizontal Tile) */}
        <div className="md:col-span-3 md:row-span-2 bento-tile p-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold">Engagement Velocity</h3>
            <div className="text-[10px] font-bold text-text-muted uppercase border border-border px-2 py-1">Unit: % Score</div>
          </div>
          <div className="h-[280px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Stats Grid (4 Small Tiles) */}
        <StatTile icon={<Clock className="text-blue-500" />} label="Hours Focus" value="42.5h" />
        <StatTile icon={<TrendingUp className="text-emerald-500" />} label="Avg. Velocity" value="88%" />
        <StatTile icon={<Users className="text-purple-500" />} label="Peer Rank" value="#12" />
        <StatTile icon={<Award className="text-amber-500" />} label="Milestones" value="09" />

        {/* Bottom CTA Tile */}
        <div className="md:col-span-2 md:row-span-1 bento-tile bg-primary p-6 group cursor-pointer overflow-hidden">
          <div className="relative z-10">
            <h4 className="text-white font-bold text-lg mb-2">Smart Course Library</h4>
            <p className="text-white/70 text-xs">Explore 24 new chapters tailored for you.</p>
          </div>
          <ArrowUpRight className="absolute bottom-4 right-4 text-white w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>
    </main>
  );
}

function StatTile({ icon, label, value }: any) {
  return (
    <div className="md:col-span-1 md:row-span-1 bento-tile p-6 flex flex-col justify-between">
      <div className="p-2 w-fit rounded bg-surface border border-border">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tighter">{value}</p>
      </div>
    </div>
  );
}
