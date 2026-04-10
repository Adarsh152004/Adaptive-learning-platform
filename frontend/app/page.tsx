"use client";

import Link from "next/link";
import { MoveRight, Sparkles, BrainCircuit, GraduationCap, ArrowUpRight, BookOpen, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface font-sans text-text-main overflow-x-hidden">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Learning Evolution
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Learn at the speed of <br />
            <span className="text-primary italic">Thought.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-text-muted leading-relaxed">
            Personalized adaptive learning platform that predicts your success 
            and tailors every chapter to your unique goals.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/auth/signup">
              <button className="primary-btn rounded-sm flex items-center gap-3 group">
                Start Learning Now
                <MoveRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="secondary-btn rounded-sm">
                Log In
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Unique Bento Hub */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
          {/* Main Large Tile */}
          <motion.div 
            whileHover={{ scale: 0.99 }}
            className="md:col-span-2 md:row-span-2 bento-tile p-8 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Adaptive AI Roadmap</h2>
              <p className="text-text-muted">
                Our algorithm analyzes your performance in real-time to generate a 
                curated selection of videos and quizzes that fill your knowledge gaps.
              </p>
            </div>
            <div className="mt-8">
              <div className="flex -space-x-2 mb-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-surface flex items-center justify-center text-[10px] font-bold">
                    USER
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                  +2k
                </div>
              </div>
              <p className="text-xs text-text-muted font-medium">Joined by 2,000+ active learners this week</p>
            </div>
          </motion.div>

          {/* Performance Tile */}
          <div className="md:col-span-2 bento-tile p-8 bg-black text-white border-none group cursor-pointer">
            <div className="flex justify-between items-start">
              <Target className="w-8 h-8 text-accent" />
              <ArrowUpRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-xl font-bold mt-4">Risk Prediction</h3>
            <p className="text-white/60 text-sm mt-2">
              Identify failure points before they manifest with our predictive modeling.
            </p>
          </div>

          {/* Feature Tiles */}
          <div className="bento-tile p-6 hover:bg-surface transition-colors cursor-pointer">
            <Zap className="w-6 h-6 text-amber-500 mb-4" />
            <h4 className="font-bold">Instant Feedback</h4>
            <p className="text-xs text-text-muted mt-1">Get AI-driven insights on every answer.</p>
          </div>

          <div className="bento-tile p-6 hover:bg-surface transition-colors cursor-pointer">
            <BookOpen className="w-6 h-6 text-emerald-500 mb-4" />
            <h4 className="font-bold">Rich Content</h4>
            <p className="text-xs text-text-muted mt-1">Access 10,000+ curated learning videos.</p>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold italic tracking-tighter">LearnSphere AI</div>
          <div className="flex gap-8 text-sm font-medium text-text-muted">
            <a href="#" className="hover:text-primary">Docs</a>
            <a href="#" className="hover:text-primary">Support</a>
            <a href="#" className="hover:text-primary">Privacy</a>
          </div>
          <div className="text-xs text-text-muted italic">© 2026 Innovation Lab. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}
