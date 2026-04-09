"use client";

import Link from "next/link";
import { MoveRight, Sparkles, BrainCircuit, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f172a]">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="container relative z-10 mx-auto px-6 pt-32 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Empowered by Gemini 1.5 Flash
          </span>

          <h1 className="text-6xl md:text-8xl font-bold font-heading mb-8 leading-tight">
            Master Any Subject with <br />
            <span className="text-gradient">AI Personalization</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-slate-400 mb-12">
            Experience a learning journey tailored to your unique pace, 
            strengths, and goals. Driven by state-of-the-art AI for 
            risk prediction and context-aware chat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/auth/signup">
              <button className="vibrant-btn flex items-center gap-2 group text-lg px-8 py-4">
                Get Started for Free
                <MoveRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/about">
              <button className="px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all font-semibold text-lg">
                View Demo
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="glass-card p-10 text-left group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 font-heading">{feature.title}</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer-like Branding */}
      <footer className="container mx-auto px-6 py-12 text-center text-slate-500 border-t border-white/5 mt-20">
        © 2026 LearnSphere AI. All rights reserved.
      </footer>
    </main>
  );
}

const features = [
  {
    icon: <BrainCircuit className="w-8 h-8 text-indigo-400" />,
    title: "Failure Risk Prediction",
    description: "Our ML engine identifies potential learning gaps before they happen, giving you a chance to catch up."
  },
  {
    icon: <Sparkles className="w-8 h-8 text-purple-400" />,
    title: "AI Support Chat",
    description: "Get instant, context-aware answers to your course questions using our integrated RAG pipeline."
  },
  {
    icon: <GraduationCap className="w-8 h-8 text-pink-400" />,
    title: "Personalized Tracks",
    description: "Custom course paths generated specifically for your career goals and current skill level."
  }
];
