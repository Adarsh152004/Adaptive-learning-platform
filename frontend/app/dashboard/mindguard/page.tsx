"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import MoodTracker from "@/components/mindguard/MoodTracker";
import MindChat from "@/components/mindguard/MindChat";
import CognitiveGames from "@/components/mindguard/CognitiveGames";
import { Brain, Heart, Activity, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function MindGuardPage() {
  const [mentalState, setMentalState] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = "guest_user_123"; // Reusing dummy ID as per bypass logic

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const stateRes = await axios.get(`http://localhost:8001/api/mindguard/mental-state/${userId}`);
      setMentalState(stateRes.data);

      const recRes = await axios.get(`http://localhost:8001/api/mindguard/recommendations/${userId}`);
      setRecommendations(recRes.data.recommendations);
    } catch (error) {
      console.error("Failed to fetch MinGuard data", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Mood Level",
        data: [4, 3, 5, 2, 4, 3, 4],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">MindGuard <span className="text-blue-500">AI Agent</span></h1>
              <p className="text-white/60">AI-powered mental state tracking and wellness optimization.</p>
            </div>
          </div>
        </header>

        {/* Mental State Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-bold uppercase tracking-widest text-white/80">Mental State Analysis</h2>
                </div>
                {mentalState?.mental_state === "High Risk" && (
                  <div className="px-4 py-1 bg-red-500/20 border border-red-500/50 rounded-full flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-400 uppercase">Alert: High Stress</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm text-white/50 mb-1">Status</p>
                  <p className={`text-2xl font-black ${mentalState?.mental_state === "Healthy" ? "text-green-400" : "text-yellow-400"}`}>
                    {mentalState?.mental_state || "Healthy"}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm text-white/50 mb-1">Health Score</p>
                  <p className="text-3xl font-black text-blue-400">{mentalState?.scores?.mental_health_score || 85}%</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm text-white/50 mb-1">Cognitive Score</p>
                  <p className="text-3xl font-black text-purple-400">{mentalState?.scores?.cognitive || 92}%</p>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-sm leading-relaxed text-blue-100/80 italic">
                  "{mentalState?.reason || "You are currently showing high levels of focus and positive engagement."}"
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 h-full"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Recommendations
            </h3>
            <ul className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/70 border-b border-white/5 pb-3">
                    <span className="text-blue-400 font-bold">{i + 1}.</span>
                    {rec}
                  </li>
                ))
              ) : (
                <>
                  <li className="text-sm text-white/70">Take a 5-minute deep breathing break.</li>
                  <li className="text-sm text-white/70">Hydrate and reset your focus.</li>
                  <li className="text-sm text-white/70">Reward yourself for your progress today!</li>
                </>
              )}
            </ul>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
            <MoodTracker userId={userId} />
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold mb-4">Mood Trends</h3>
              <div className="h-40">
                <Line data={chartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <CognitiveGames userId={userId} />
            <div className="p-8 bg-gradient-to-br from-green-600/20 to-teal-600/20 rounded-[2rem] border border-green-500/20">
              <h3 className="text-xl font-bold mb-2">Performance Bonus 🏆</h3>
              <p className="text-white/60 text-sm">Your memory score has increased by 15% this week. Keep it up!</p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <MindChat />
          </div>
        </div>
      </div>
    </div>
  );
}
