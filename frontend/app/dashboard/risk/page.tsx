"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Heart, 
  Brain, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert,
  MessageSquareHeart
} from "lucide-react";
import axios from "axios";

export default function RiskPage() {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string | null>(null);

  const performAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setLoading(true);
    setAnalysis(null);
    setRecommendations(null);

    try {
      const wellRes = await axios.post("http://localhost:8001/api/wellbeing-risk", { feedback });
      setAnalysis(wellRes.data.analysis);

      const recRes = await axios.post("http://localhost:8001/api/support-recommendations", {
        risk_level: wellRes.data.analysis.includes("High") ? "High" : "Low",
        scores: { academic: 85, mental_health: "stressed" }
      });
      setRecommendations(recRes.data.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex items-center gap-4 border-b border-white/5 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center">
          <Heart className="w-8 h-8 text-pink-400" />
        </div>
        <div>
          <h1 className="text-4xl font-bold font-heading">AI Wellbeing <span className="text-gradient">& Support</span></h1>
          <p className="text-slate-400">Our AI analyzes your feedback to help prevent burnout and provide academic support.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold font-heading mb-4 flex items-center gap-2">
              <MessageSquareHeart className="w-6 h-6 text-indigo-400" />
              How are you feeling?
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Describe your current learning state, stress levels, or any challenges you&apos;re facing. 
              The AI will analyze the sentiment and provide tailored support.
            </p>
            <form onSubmit={performAnalysis} className="space-y-6">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ex: I've been feeling a bit overwhelmed with the new math modules, but the project work is exciting..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-6 outline-none focus:border-pink-500/50 transition-all resize-none placeholder:text-slate-700"
              />
              <button 
                disabled={loading || !feedback.trim()}
                className="vibrant-btn w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Analyze My Wellbeing <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          {analysis && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-8 border-indigo-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="w-6 h-6 text-indigo-400" />
                <h3 className="text-xl font-bold font-heading">AI Risk Assessment</h3>
              </div>
              <p className="text-slate-200 bg-white/5 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                {analysis}
              </p>
            </motion.div>
          )}

          {recommendations && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 border-emerald-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-bold font-heading">Personalized Support</h3>
              </div>
              <p className="text-slate-200 bg-white/5 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                {recommendations}
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-3/4" />
                </div>
                <span className="text-xs text-slate-500 font-bold">Priority: High</span>
              </div>
            </motion.div>
          )}

          {!analysis && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
              <Brain className="w-20 h-20 mb-6" />
              <p className="max-w-xs italic text-sm">Enter your feedback to generate an AI-powered wellbeing report and support plan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ");
}
