"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  Timer, Brain, CheckCircle2, RefreshCcw, 
  Target, Square, Calculator, Zap, 
  Shuffle, Languages, Route, Trophy,
  Info, Play, ChevronRight, Activity, ShieldCheck, Heart
} from "lucide-react";

// --- ENHANCED MODULES WITH PSYCHOLOGICAL DATA (LIGHTER THEME COLORS) ---
const MODULE_FEEDBACK: Record<string, any> = {
  reaction: {
    high: { improve: "Your reflexes are sharp! Try to enter a 'flow' state where you anticipate without tension.", relief: "Keep this energy, dear. A quick stretch will keep your circulation perfect." },
    mid: { improve: "Consistent but could be faster. Focus on the center of the screen, not the edges.", relief: "Take a deep breath. Your reaction speed often mirrors your inner calm." },
    low: { improve: "Vigilance is low. Neural processing seems fatigued.", relief: "Wash your eyes with cold water, dear. It stimulates the vagus nerve and wakes up your senses." }
  },
  flex: {
    high: { improve: "Incredible inhibitory control! You're filtering noise perfectly.", relief: "Wonderful work. Your mind is clear. Maintain this with a sip of water." },
    mid: { improve: "The 'Stroop Effect' is catching you. Try reading only the bottom half of the letters.", relief: "Don't rush, dear. Speed follows clarity. Let your mind settle for a moment." },
    low: { improve: "Mental interference is high. You're reacting to impulses rather than logic.", relief: "Close your eyes for 30 seconds. Your brain needs a quick reset from the visual noise." }
  },
  pattern: {
    high: { improve: "Spatial memory is top-tier. Try to visualize the patterns as single shapes.", relief: "Your neural pathways are firing beautifully. Keep focusing on the big picture." },
    mid: { improve: "Your recall is steady but misses the later stages. Try 'chunking' tiles into groups.", relief: "It's okay to miss a few, dear. Your brain is a muscle that's getting stronger." },
    low: { improve: "Visuo-spatial capacity is struggling. High cognitive load detected.", relief: "Look at something far away, like the horizon or a plant. It relaxes the ciliary muscles." }
  },
  math: {
    high: { improve: "Mathematical bandwidth is exceptional. You're processing data like a pro.", relief: "Outstanding! Your logic is crisp. Stay hydrated to keep that focus sharp." },
    mid: { improve: "Calculation speed is good, but accuracy drops under pressure. Take it one digit at a time.", relief: "Take a slow breath between problems, dear. It calms the 'math anxiety' centers." },
    low: { improve: "Numerical processing is sluggish. You might be mentally exhausted.", relief: "Eat a small piece of dark chocolate or fruit. Your brain needs a glucose boost, honey." }
  },
  focus: {
    high: { improve: "Laser focus! Your sustained attention is better than most students.", relief: "I'm so proud of your concentration. Keep that steady heart rate." },
    mid: { improve: "Your focus drifts when the target moves faster. Stay centered on the core.", relief: "If you feel your eyes wandering, blink slowly and refocus. You're doing well." },
    low: { improve: "High focus variance detected. Your mind is likely elsewhere.", relief: "Try the 4-7-8 breathing technique now. It will ground your attention back to the present." }
  },
  memory: {
    high: { improve: "Sequence anchoring is perfect. Your short-term buffer is highly efficient.", relief: "Excellent memory, dear! Your brain is well-rested and sharp." },
    mid: { improve: "You're losing the sequence around turn 5. Try saying the numbers out loud.", relief: "Don't be hard on yourself. Every round is a win for your neural plasticity." },
    low: { improve: "Sequence retention is very low. Stress might be blocking your encoding.", relief: "Listen to a calm sound or just sit in silence. Let the mental clutter dissolve, dear." }
  }
};

const ALL_MODULES = [
  { 
    id: "reaction", 
    name: "Subconscious Vigilance", 
    pillar: "Alertness / Response Time",
    rule: "Tap the screen instantly when it transitions to Emerald. Measures CNS processing speed and vigilance state.",
    icon: <Timer />, 
    color: "from-blue-500 to-indigo-600",
    bgMuted: "bg-blue-50",
    metric: "ms (Reaction Time)"
  },
  { 
    id: "flex", 
    name: "Cognitive Inhibitor", 
    pillar: "Inhibitory Control",
    rule: "Match the Word Meaning, not the Ink Color. Measures the Stroop Effect and your ability to filter mental distractions.",
    icon: <Shuffle />, 
    color: "from-rose-500 to-orange-500",
    bgMuted: "bg-rose-50",
    metric: "Interference Ratio"
  },
  { 
    id: "pattern", 
    name: "Neural Matrix", 
    pillar: "Visuo-Spatial Memory",
    rule: "Memorize the glowing grid sequence. Measures your brain's capacity to hold and manipulate spatial data points.",
    icon: <Square />, 
    color: "from-cyan-500 to-blue-600",
    bgMuted: "bg-cyan-50",
    metric: "Recall Capacity"
  },
  { 
    id: "math", 
    name: "Processing Stream", 
    pillar: "Working Memory Load",
    rule: "Calculate arithmetic streams at high velocity. Tracks numerical processing bandwidth under pressure.",
    icon: <Calculator />, 
    color: "from-amber-500 to-orange-500",
    bgMuted: "bg-amber-50",
    metric: "Ops/Minute"
  },
  { 
    id: "focus", 
    name: "Drift Guard", 
    pillar: "Sustained Attention",
    rule: "Keep focus on the shifting target while ignoring peripheral visual noise. Tracks sustained concentration levels.",
    icon: <Target />, 
    color: "from-emerald-500 to-teal-600",
    bgMuted: "bg-emerald-50",
    metric: "Focus Variance"
  },
  { 
    id: "memory", 
    name: "Sequence Anchor", 
    pillar: "Working Memory (Chunking)",
    rule: "Replicate the tile sequence exactly. Tests short-term auditory and visual chunking performance.",
    icon: <Brain />, 
    color: "from-purple-500 to-violet-600",
    bgMuted: "bg-purple-50",
    metric: "Chunk Size"
  },
];

export default function CognitiveGames({ userId, onComplete }: { userId: string, onComplete?: () => void }) {
  const [activeModule, setActiveModule] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "briefing" | "waiting" | "active" | "result">("idle");
  const [difficulty, setDifficulty] = useState(1);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [gameState, setGameState] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startModule = (mod: any) => {
    setActiveModule(mod);
    setStatus("briefing");
    setFeedback(null);
  };

  const launchExercise = () => {
    if (activeModule.id === "reaction") startReaction();
    else if (activeModule.id === "pattern") startPattern();
    else if (activeModule.id === "math") startMath();
    else if (activeModule.id === "focus") startFocus();
    else if (activeModule.id === "flex") startFlex();
    else if (activeModule.id === "memory") startMemory();
  };

  const finishModule = async (score: number, detail?: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
    const newResult = { score: clampedScore, detail, module: activeModule.name, time: new Date().toLocaleTimeString() };
    
    // Determine Feedback Level
    let level = "low";
    if (clampedScore >= 80) level = "high";
    else if (clampedScore >= 40) level = "mid";

    const gameFeedback = MODULE_FEEDBACK[activeModule.id]?.[level] || { improve: "Keep practicing!", relief: "Take a deep breath." };
    setFeedback(gameFeedback);
    
    setSessionResults(prev => [newResult, ...prev].slice(0, 5));
    setResult(newResult);
    setStatus("result");
    
    if (clampedScore >= 90) setDifficulty(prev => Math.min(prev + 1, 10));
    else if (clampedScore < 40) setDifficulty(prev => Math.max(prev - 1, 1));

    try {
      await axios.post("http://localhost:8001/api/mindguard/game/result", {
        user_id: userId,
        game_type: activeModule.id,
        score: clampedScore,
        metadata: { detail, level: difficulty, pillar: activeModule.pillar, feedback: gameFeedback }
      });
      if (onComplete) onComplete();
    } catch (e) { console.error(e); }
  };

  // --- REFINED LOGIC IMPLEMENTATIONS ---
  const startReaction = () => {
    setStatus("waiting");
    const delay = Math.random() * 3000 + 1000;
    setTimeout(() => { 
      // Ensure we are still in waiting state before activating
      setStatus(current => current === "waiting" ? "active" : current); 
      setGameState({ start: Date.now() }); 
    }, delay);
  };

  const startPattern = () => {
    setStatus("waiting");
    const count = 3 + Math.floor(difficulty / 1.5);
    const targets = Array.from({ length: 16 }, (_, i) => i).sort(() => Math.random() - 0.5).slice(0, count);
    setGameState({ targets, selected: [] });
    setTimeout(() => setStatus("active"), 1500);
  };

  const startMath = () => {
    setStatus("active");
    setGameState({ score: 0, timeLeft: 30, ...generateMathProblem() });
    timerRef.current = setInterval(() => {
      setGameState((prev: any) => {
        if (prev.timeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          finishModule(Math.min(prev.score * 10, 100), `Bandwidth: ${prev.score} Ops/Round`);
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
  };

  const generateMathProblem = () => {
    const n1 = Math.floor(Math.random() * (10 * difficulty)) + 5;
    const n2 = Math.floor(Math.random() * (10 * difficulty)) + 5;
    const ans = n1 + n2;
    const options = [ans, ans + 2, ans - 3, ans + 5].sort(() => Math.random() - 0.5);
    return { n1, n2, ans, options };
  };

  const startMemory = () => {
    const seq = [Math.floor(Math.random() * 9)];
    setGameState({ sequence: seq, userSeq: [], playing: true, round: 1 });
    playSequence(seq);
  };

  const playSequence = async (seq: number[]) => {
    setStatus("waiting");
    setGameState(prev => ({ ...prev, playing: true, userSeq: [] }));
    for (const val of seq) {
      await new Promise(r => setTimeout(r, 800 - (difficulty * 20)));
      setGameState(prev => ({ ...prev, highlight: val }));
      await new Promise(r => setTimeout(r, 500 - (difficulty * 10)));
      setGameState(prev => ({ ...prev, highlight: null }));
    }
    setGameState(prev => ({ ...prev, playing: false }));
    setStatus("active");
  };

  const startFocus = () => {
    setStatus("active");
    setGameState({ score: 0, time: 20 + (difficulty * 2) });
    timerRef.current = setInterval(() => {
      setGameState((prev: any) => {
        if (prev.time <= 1) { 
          if (timerRef.current) clearInterval(timerRef.current);
          finishModule(Math.min(prev.score * 5, 100), "Focus Session Concluded"); 
          return { ...prev, time: 0 }; 
        }
        return { ...prev, time: prev.time - 1 };
      });
    }, 1000);
  };

  const startFlex = () => {
    setStatus("active");
    const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];
    const names = ["RED", "BLUE", "GREEN", "YELLOW"];
    const textIdx = Math.floor(Math.random() * 4);
    const colorIdx = Math.floor(Math.random() * 4);
    setGameState({ text: names[textIdx], color: colors[colorIdx], isMatch: textIdx === colorIdx });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-slate-200 relative overflow-hidden shadow-sm selection:bg-blue-100">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-50/50 blur-[120px] pointer-events-none" />

      <div className="p-12 pb-8 flex items-center justify-between relative z-10 border-b border-slate-100">
        <div className="flex items-center gap-8">
           <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 text-primary">
              <Activity className="w-10 h-10 animate-pulse" />
           </div>
           <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Cognitive <span className="text-primary font-bold italic">Matrix</span></h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">Neuro-State Performance Monitoring — <span className="text-emerald-500">Unrestricted</span></p>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="px-8 py-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-3 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <span className="text-sm font-black text-emerald-700 uppercase tracking-widest leading-none">System Balanced</span>
           </div>
           {status !== "idle" && (
             <button onClick={() => setStatus("idle")} className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-600 transition-all hover:rotate-180 duration-500 shadow-sm">
                <RefreshCcw className="w-6 h-6" />
             </button>
           )}
        </div>
      </div>

      <div className="flex-1 p-10 overflow-hidden flex flex-col relative z-10 bg-slate-50/30">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col items-center">
              <div className="flex items-center gap-6 mb-16 bg-white px-10 py-5 rounded-full shadow-lg border border-slate-100 mt-10">
                 <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                 <p className="text-lg font-black text-slate-800 uppercase tracking-[0.3em]">Initialize Laboratory Protocol</p>
              </div>

              <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 overflow-y-auto pb-12 scrollbar-none px-10">
                {ALL_MODULES.map((mod, idx) => (
                  <ModuleCard key={mod.id} idx={idx} {...mod} onClick={() => startModule(mod)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {status !== "idle" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 md:p-12 lg:p-20 bg-slate-900/40 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-[1400px] h-full bg-white rounded-[4rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col border border-white/20"
            >
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-6">
                    <div className={`p-4 bg-gradient-to-br ${activeModule.color} rounded-2xl text-white`}>
                       {React.cloneElement(activeModule.icon as React.ReactElement, { size: 24 })}
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{activeModule.name}</h4>
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{activeModule.pillar}</p>
                    </div>
                 </div>
                 <button onClick={() => setStatus("idle")} className="p-5 bg-white hover:bg-slate-100 rounded-2xl text-slate-400 transition-all border border-slate-200">
                    <RefreshCcw className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 flex flex-col">
                <AnimatePresence mode="wait">
                  {status === "briefing" && (
                    <motion.div key="briefing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                       <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto">
                          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Laboratory ID: #{activeModule.id.toUpperCase()}-0{difficulty}</p>
                          <h2 className="text-8xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-12">Protocol <br/><span className="text-primary italic">Briefing</span></h2>
                          
                          <div className="grid grid-cols-2 gap-12 p-12 bg-slate-50 rounded-[3rem] border border-slate-100 mb-12">
                             <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Objective</p>
                                <p className="text-2xl font-bold text-slate-800 leading-relaxed">{activeModule.rule}</p>
                             </div>
                             <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                                   <span className="text-xs font-black text-slate-500 uppercase">Difficulty</span>
                                   <span className="text-xl font-black text-slate-900">Stage {difficulty}</span>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
                                   <span className="text-xs font-black text-slate-500 uppercase">Focus</span>
                                   <span className="text-xl font-black text-primary">{activeModule.metric.split(' ')[0]}</span>
                                </div>
                             </div>
                          </div>

                          <button onClick={launchExercise} className="w-full py-10 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-3xl flex items-center justify-center gap-6 hover:bg-primary transition-all shadow-2xl active:scale-95">
                            <Play className="w-8 h-8 fill-current" />
                            Initialize System
                          </button>
                       </div>
                    </motion.div>
                  )}

                  {(status === "active" || status === "waiting") && (
                    <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
                       <div className="w-full h-full max-h-[800px] flex items-center justify-center">
                          {activeModule.id === "reaction" && (
                            <motion.div onClick={() => {
                              if (status === "active") {
                                finishModule(100 - (Date.now() - gameState.start - 150)/10, (Date.now() - gameState.start) + "ms Latency");
                              } else if (status === "waiting") {
                                if (timerRef.current) clearInterval(timerRef.current);
                                finishModule(0, "Premature Impulse (Too Early)");
                              }
                            }} 
                              className={`w-full max-w-6xl aspect-[16/9] rounded-[4rem] flex items-center justify-center cursor-pointer transition-all duration-300 ${status === "active" ? "bg-emerald-500 shadow-[0_0_150px_rgba(16,185,129,0.4)]" : "bg-slate-50 border-8 border-dashed border-slate-200"}`}
                            >
                               <p className={`text-[15rem] font-black italic tracking-tighter ${status === "active" ? "text-white" : "text-slate-200 animate-pulse"}`}>{status === "active" ? "IMPULSE!" : "FOCUS"}</p>
                            </motion.div>
                          )}

                          {activeModule.id === "pattern" && (
                            <div className="grid grid-cols-4 gap-8">
                              {Array.from({ length: 16 }).map((_, i) => (
                                 <button key={i} onClick={() => {
                                   if (status !== "active") return;
                                   if (gameState.targets.includes(i)) {
                                     const nextSelected = [...gameState.selected, i];
                                     if (nextSelected.length === gameState.targets.length) finishModule(100, "Pattern Decoded");
                                     else setGameState({ ...gameState, selected: nextSelected });
                                   } else finishModule(0, "Sequence Breach");
                                 }}
                                    className={`w-40 h-40 rounded-[2.5rem] border-4 transition-all duration-300 ${ (gameState.targets?.includes(i) && status==="waiting") ? "bg-blue-500 border-blue-600 shadow-2xl scale-110" : gameState.selected?.includes(i) ? "bg-primary border-primary shadow-xl" : "bg-white border-slate-100 hover:bg-slate-50" }`} />
                              ))}
                            </div>
                          )}

                          {activeModule.id === "math" && (
                             <div className="text-center w-full max-w-4xl">
                                <div className="mb-12 flex items-center justify-center gap-8">
                                   <div className="px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-black uppercase tracking-widest">{gameState.timeLeft}s Remaining</div>
                                   <div className="px-6 py-2 bg-primary/10 text-primary rounded-full text-sm font-black uppercase tracking-widest">{gameState.score} Ops Successful</div>
                                </div>
                                <p className="text-[15rem] font-black text-slate-900 mb-16 tracking-tighter leading-none">{gameState.n1} + {gameState.n2}</p>
                                <div className="grid grid-cols-2 gap-8">
                                  {gameState.options?.map((o:any, i:any) => (
                                     <button key={i} onClick={() => {
                                       if (o === gameState.ans) {
                                         setGameState({ ...gameState, score: gameState.score + 1, ...generateMathProblem() });
                                       } else finishModule(Math.min(gameState.score * 10, 100), "Logic Fault Detected");
                                     }} className="p-10 bg-white hover:bg-slate-50 border-4 border-slate-100 text-slate-900 font-black text-6xl rounded-[3rem] transition-all hover:scale-105 shadow-lg underline-offset-8">{o}</button>
                                  ))}
                                </div>
                             </div>
                          )}

                          {activeModule.id === "flex" && (
                             <div className="text-center">
                                <motion.p animate={{ scale: [0.8, 1], opacity: [0, 1] }} style={{ color: gameState.color }} className="text-[16rem] font-black mb-20 italic tracking-tighter drop-shadow-2xl">{gameState.text}</motion.p>
                                <div className="flex justify-center gap-12">
                                   <button onClick={() => gameState.isMatch ? startFlex() : finishModule(0, "Inhibitory Error")} className="px-24 py-12 bg-white border-4 border-slate-100 text-slate-900 font-black text-5xl uppercase rounded-[3rem] shadow-xl hover:scale-105 transition-all">MATCH</button>
                                   <button onClick={() => !gameState.isMatch ? startFlex() : finishModule(0, "Inhibitory Error")} className="px-24 py-12 bg-white border-4 border-slate-100 text-slate-900 font-black text-5xl uppercase rounded-[3rem] shadow-xl hover:scale-105 transition-all">DIFF</button>
                                </div>
                             </div>
                          )}

                          {activeModule.id === "memory" && (
                             <div className="grid grid-cols-3 gap-10">
                                {Array.from({ length: 9 }).map((_, i) => (
                                   <button key={i} onClick={() => {
                                      if (status !== "active" || gameState.playing) return;
                                      if (gameState.sequence[gameState.userSeq.length] === i) {
                                         const nextUserSeq = [...gameState.userSeq, i];
                                         if (nextUserSeq.length === gameState.sequence.length) {
                                            if (gameState.round >= 3) finishModule(100, "System Cognition High");
                                            else {
                                               const nextSeq = [...gameState.sequence, Math.floor(Math.random() * 9)];
                                               setGameState({ ...gameState, sequence: nextSeq, round: gameState.round + 1 });
                                               playSequence(nextSeq);
                                            }
                                         } else setGameState({ ...gameState, userSeq: nextUserSeq });
                                      } else finishModule(0, "Chunking Failure");
                                   }}
                                      className={`w-40 h-40 rounded-[3rem] border-4 transition-all duration-300 ${gameState.highlight === i ? "bg-purple-500 border-purple-600 shadow-2xl scale-110" : "bg-white border-slate-100 hover:bg-slate-50"}`} />
                                ))}
                             </div>
                          )}

                          {activeModule.id === "focus" && (
                              <div className="w-full h-full relative p-20 flex items-center justify-center bg-slate-50 rounded-[4rem] overflow-hidden">
                                 <div className="absolute top-10 right-10 text-right">
                                    <p className="text-7xl font-black text-slate-900 tracking-tighter">{gameState.time}s</p>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">{gameState.score} Targets Locked</p>
                                 </div>
                                 <motion.button 
                                    animate={{ 
                                       x: [Math.random()*600-300, Math.random()*600-300, Math.random()*600-300, Math.random()*600-300], 
                                       y: [Math.random()*400-200, Math.random()*400-200, Math.random()*400-200, Math.random()*400-200],
                                       scale: [1, 1.3, 0.8, 1.1, 1] 
                                    }} 
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    onClick={() => setGameState({ ...gameState, score: (gameState.score || 0) + 1 })}
                                    className="w-48 h-48 bg-primary rounded-full shadow-2xl absolute flex items-center justify-center border-8 border-white/40 group active:scale-90 transition-transform"
                                 >
                                    <Target className="w-16 h-16 text-white group-hover:rotate-45 transition-transform" />
                                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                                 </motion.button>
                              </div>
                          )}
                       </div>
                    </motion.div>
                  )}

                  {status === "result" && (
                    <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center">
                       <div className="text-center max-w-4xl mx-auto">
                          <p className="text-sm font-black text-primary uppercase tracking-[0.6em] mb-10">Neural Analysis Complete</p>
                          <h4 className="text-[15rem] font-black text-slate-900 leading-none tracking-tighter mb-10">{result?.score}<span className="text-4xl align-top opacity-20">%</span></h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                             <div className="bg-blue-50/50 rounded-[2.5rem] border border-blue-100 p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                   <Zap className="w-16 h-16 text-blue-500" />
                                </div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Improvement Strategy</p>
                                <p className="text-xl font-bold text-slate-800 leading-tight">
                                   {feedback?.improve || "Keep practicing to refine your neural focus."}
                                </p>
                             </div>

                             <div className="bg-rose-50/50 rounded-[2.5rem] border border-rose-100 p-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                   <Heart className="w-16 h-16 text-rose-500" />
                                </div>
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3">Mental Relief & Recovery</p>
                                <p className="text-xl font-bold text-slate-800 leading-tight">
                                   {feedback?.relief || "Remember to breathe and stay hydrated, dear."}
                                </p>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                             <button onClick={launchExercise} className="py-10 bg-slate-900 text-white font-black rounded-[2.5rem] uppercase tracking-widest hover:bg-primary transition-all text-2xl shadow-2xl">Re-Initiate</button>
                             <button onClick={() => setStatus("idle")} className="py-10 bg-white text-slate-700 border-4 border-slate-100 font-black rounded-[2.5rem] uppercase tracking-widest hover:bg-slate-50 transition-all text-2xl">Return to Hub</button>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 px-10 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-8 overflow-x-auto scrollbar-none">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Session Telemetry</p>
            {sessionResults.slice(0, 3).map((res, i) => (
               <div key={i} className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-xs font-bold text-slate-700 uppercase">{res.module}: <span className="font-black">{res.score}%</span></p>
               </div>
            ))}
            {sessionResults.length === 0 && <p className="text-xs font-medium text-slate-400 italic">No telemetry data recorded yet.</p>}
         </div>
         <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">U{i}</div>)}
            </div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Global Rank: #1,204</p>
         </div>
      </div>
    </div>
  );
}

function ModuleCard({ name, pillar, icon, color, bgMuted, onClick, metric, idx }: any) {
  return (
    <motion.button 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ scale: 1.05, y: -12 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative p-12 rounded-[3.5rem] bg-white border border-slate-200 text-left transition-all hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] flex flex-col min-h-[480px] overflow-hidden hover:border-slate-300`}
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${bgMuted}`} />
      
      <div className={`relative z-10 p-8 bg-gradient-to-br ${color} rounded-[2rem] text-white w-fit mb-12 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon, { size: 48 })}
      </div>

      <div className="relative z-10 mt-auto">
        <p className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-4 opacity-70">{pillar}</p>
        <h5 className="text-4xl font-black text-slate-800 tracking-tighter mb-8 group-hover:text-slate-900 leading-tight">{name}</h5>
        
        <div className="flex items-center justify-between pt-8 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-6 group-hover:translate-y-0">
           <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none text-left">Laboratory Protocol: <br/><span className="text-slate-900">{metric.split(' ')[0]}</span></span>
           </div>
           <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
             <ChevronRight className="w-6 h-6" />
           </div>
        </div>
      </div>
    </motion.button>
  );
}
