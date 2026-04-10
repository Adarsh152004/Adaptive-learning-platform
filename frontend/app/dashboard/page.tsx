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
  CheckCircle2 as CheckCircleIcon,
  CheckSquare,
  BookOpen,
  Atom,
  FlaskConical,
  Sigma,
  Loader2,
  LayoutGrid,
  Zap,
  Calendar
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
  const [activeRoadmap, setActiveRoadmap] = useState("all");

  const chartData = {
    labels: ["Mock 1", "Mock 2", "Mock 3", "Mock 4", "Mock 5", "AITS 1"],
    datasets: [
      {
        label: "Percentile",
        data: [72, 78, 85, 83, 91, 94],
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
          <div className="flex items-center gap-2 text-primary font-bold mb-2 tracking-widest text-[10px] uppercase">
            <LayoutGrid className="w-5 h-5" />
            JEE & NEET Adaptive Console
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Hi, <span className="text-primary italic">{session?.user?.name || "Aspirant"}</span>
          </h1>
          <p className="text-text-muted mt-2 italic font-medium">Your personalized IIT-JEE & NEET preparation schedule is ready.</p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-md rounded-full p-1 shadow-sm border border-border">
          <button className="px-6 py-2 rounded-full text-sm font-bold bg-primary text-white">Daily View</button>
          <button className="px-6 py-2 rounded-full text-sm font-bold text-text-muted hover:text-primary">Weekly</button>
        </div>
      </div>

      {/* Bento Dashboard Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-6 md:grid-rows-4 gap-4 h-auto md:h-[900px]">
        
        {/* Performance Chart (Full Width Tile) */}
        <div className="md:col-span-6 md:row-span-2 bento-tile p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-bold">Academic Performance Trend</h3>
              <p className="text-text-muted text-sm font-medium mt-1">Tracking your AITS Mock Test Percentile over time.</p>
            </div>
            <div className="text-[10px] font-bold text-text-muted uppercase border border-border px-3 py-1.5 rounded-full bg-surface">Unit: %ILE</div>
          </div>
          <div className="h-[280px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Quick Stats Grid (4 Small Tiles) */}
        <StatTile icon={<BrainCircuit className="text-blue-500" />} label="Physics Score" value="68%" />
        <StatTile icon={<TrendingUp className="text-emerald-500" />} label="Chemistry Score" value="82%" />
        <StatTile icon={<Users className="text-purple-500" />} label="Avg Ranking" value="#4,120" />
        <StatTile icon={<LayoutGrid className="text-amber-500" />} label="Tests Taken" value="142" />
      </div>

      {/* NEW INTEGRATION: Syllabus Roadmap Pathway */}
      <div className="max-w-7xl mx-auto mt-6 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Your Curriculum <span className="italic text-primary">Roadmap</span></h2>
          <div className="text-xs font-bold uppercase tracking-widest text-text-muted bg-surface px-4 py-2 border border-border rounded-full">
            Target: Mid-Term Revision
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Physics Track */}
          <div className="bento-tile p-6 hover:border-blue-500/50 transition-colors">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                   <Atom className="w-5 h-5 text-blue-500" />
                 </div>
                 <h3 className="font-bold text-xl">Physics</h3>
               </div>
               <span className="text-xs font-bold text-text-muted bg-surface px-2 py-1 rounded">4/10 Complete</span>
            </div>
            
            <div className="space-y-3">
               <RoadmapItem status="done" title="Kinematics" />
               <RoadmapItem status="done" title="Laws of Motion" />
               <RoadmapItem status="done" title="Work, Energy & Power" />
               <RoadmapItem status="done" title="Rotational Mechanics" />
               <RoadmapItem status="current" title="Gravitation" />
               <RoadmapItem status="locked" title="Thermodynamics" />
               <div className="pt-2 text-center text-xs font-bold text-text-muted cursor-pointer hover:text-primary">
                 + 4 more advanced topics
               </div>
            </div>
          </div>

          {/* Chemistry Track */}
          <div className="bento-tile p-6 hover:border-emerald-500/50 transition-colors">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                   <FlaskConical className="w-5 h-5 text-emerald-500" />
                 </div>
                 <h3 className="font-bold text-xl">Chemistry</h3>
               </div>
               <span className="text-xs font-bold text-text-muted bg-surface px-2 py-1 rounded">6/10 Complete</span>
            </div>
            
            <div className="space-y-3">
               <RoadmapItem status="done" title="Structure of Atom" />
               <RoadmapItem status="done" title="Chemical Bonding" />
               <RoadmapItem status="done" title="States of Matter" />
               <RoadmapItem status="done" title="Thermodynamics" />
               <RoadmapItem status="done" title="Equilibrium" />
               <RoadmapItem status="done" title="Redox Reactions" />
               <RoadmapItem status="current" title="Organic (GOC)" />
               <div className="pt-2 text-center text-xs font-bold text-text-muted cursor-pointer hover:text-primary">
                 + 3 more advanced topics
               </div>
            </div>
          </div>

          {/* Maths Track */}
          <div className="bento-tile p-6 hover:border-purple-500/50 transition-colors">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                   <Sigma className="w-5 h-5 text-purple-500" />
                 </div>
                 <h3 className="font-bold text-xl">Mathematics</h3>
               </div>
               <span className="text-xs font-bold text-text-muted bg-surface px-2 py-1 rounded">2/10 Complete</span>
            </div>
            
            <div className="space-y-3">
               <RoadmapItem status="done" title="Sets & Relations" />
               <RoadmapItem status="done" title="Complex Numbers" />
               <RoadmapItem status="current" title="Quadratic Equations" />
               <RoadmapItem status="locked" title="Permutation & Combination" />
               <RoadmapItem status="locked" title="Binomial Theorem" />
               <RoadmapItem status="locked" title="Sequences & Series" />
               <div className="pt-2 text-center text-xs font-bold text-text-muted cursor-pointer hover:text-primary">
                 + 4 more advanced topics
               </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function RoadmapItem({ status, title }: { status: "done" | "current" | "locked", title: string }) {
  return (
    <div className={`p-3 rounded-md border flex items-center gap-3 transition-colors ${
      status === 'done' ? 'bg-success/5 border-success/20 text-text-main opacity-70' :
      status === 'current' ? 'bg-primary/5 border-primary text-primary font-bold shadow-md shadow-primary/10' :
      'bg-surface border-border text-text-muted opacity-50'
    }`}>
      {status === 'done' ? <CheckSquare className="w-4 h-4 text-success" /> :
       status === 'current' ? <BookOpen className="w-4 h-4" /> :
       <div className="w-4 h-4 rounded border-2 border-border" />}
      <span className="text-sm">{title}</span>
    </div>
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
