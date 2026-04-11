"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, 
  Mic, 
  Activity, 
  Heart, 
  Sparkles, 
  X,
  VideoOff,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Brain,
  MessageSquare,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Award
} from "lucide-react";
import { useEmotionEngine, DetectionResult } from "@/hooks/useEmotionEngine";
import AdaptiveActivities from "./AdaptiveActivities";
import axios from "axios";
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

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function CounselingInterface({ userId }: { userId: string }) {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello dear, I've been waiting for you. How are you feeling today? You can talk to me, I'm listening." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const { videoRef, result, isCameraReady } = useEmotionEngine(isActive);
  const [showActivity, setShowActivity] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isAiMuted, setIsAiMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        // Auto-send logic
        setTimeout(() => handleSendMessage(transcript), 500);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn("Speech recognition already started:", e);
      }
      setIsListening(true);
    }
  };

  // AI Voice Synthesis (TTS)
  const speak = (text: string) => {
    if (typeof window === "undefined" || isAiMuted) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a warm/supportive voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Google US English")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.pitch = 1.1; // Slightly higher/warmer pitch
    utterance.rate = 0.95;  // Slightly slower/calmer rate
    
    window.speechSynthesis.speak(utterance);
  };

  // Trigger speech on new AI messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'ai' && isActive) {
      speak(lastMessage.content);
    }
  }, [messages, isActive]);

  // Auto-advance interview logic
  const lastAiMessage = messages.filter(m => m.role === 'ai').slice(-1)[0]?.content || "";

  const startSession = async () => {
    setIsActive(true);
    // Resume AudioContext (important for browsers)
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    try {
      await axios.post("http://localhost:8001/api/counseling/session/start", {
        user_id: userId,
        start_time: new Date().toISOString(),
        initial_stress: result.stressScore
      });
    } catch (e) {
      console.error("Failed to start session", e);
    }
  };

  const leaveSession = async () => {
    setIsActive(false);
    try {
      // 1. End session in DB
      await axios.post("http://localhost:8001/api/counseling/session/end", {
          user_id: userId,
          end_time: new Date().toISOString(),
          final_stress: result.stressScore,
          duration: 300,
          summary: "Session completed by student."
      });

      // 2. Fetch Report & AI Summary
      const summaryRes = await axios.post("http://localhost:8001/api/counseling/session/summary", { user_id: userId });
      const reportRes = await axios.get(`http://localhost:8001/api/counseling/report/${userId}`);
      
      setReportData({
        summary: summaryRes.data.summary,
        stats: summaryRes.data.stats,
        history: reportRes.data.emotion_history
      });
      setShowReport(true);
    } catch (e) {
      console.error("Failed to generate report", e);
    }
  };

  const handleSendMessage = async (explicitText?: string) => {
    const textToSend = explicitText || inputText;
    if (!textToSend.trim()) return;

    // Snapshot current messages BEFORE state update for history
    const currentMessages = messages;

    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setInputText("");
    setIsTyping(true);
    setIsListening(false);

    try {
      // Build conversation history from last 6 messages for Groq memory
      const history = currentMessages.slice(-6).map(m => ({
        role: m.role,     // "user" | "ai"
        content: m.content
      }));

      const res = await axios.post("http://localhost:8001/api/counseling/chat", {
        query: textToSend,
        emotion: result.emotion,
        stress_score: result.stressScore,
        user_id: userId,
        history              // ← multi-turn memory
      });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
      
      // Log emotion data point after each interaction
      axios.post("http://localhost:8001/api/counseling/emotion-log", {
        user_id: userId,
        emotion: result.emotion,
        stress_score: result.stressScore,
        timestamp: new Date().toISOString()
      });

      if (result.stressScore > 75) {
        setTimeout(() => setShowActivity(true), 1500);
      }
    } catch (e) {
      console.error("Chat error", e);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having a little trouble connecting, dear. Please try again in a moment. 💙" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] relative overflow-hidden text-white font-sans">
      {/* Zoom Styles Header */}
      <div className="p-4 bg-black/40 backdrop-blur-md flex justify-between items-center z-30 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-lg shadow-lg shadow-rose-500/20">
            <VideoOff className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">1:1 Private Counseling</h3>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">End-to-End Encrypted</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-white/10 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest">Live: {userId}</span>
          </div>
        </div>
      </div>

      {!isActive ? (
        <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-8 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md"
          >
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/50">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">Enter Interview Room</h2>
            <p className="text-white/60 mb-10 font-medium">Your mentor is ready to listen. Please ensure your camera and microphone are accessible for emotional analysis.</p>
            <button 
              onClick={startSession}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl hover:bg-primary-dark transition-all shadow-2xl shadow-primary/40"
            >
              Join Meeting
            </button>
          </motion.div>
        </div>
      ) : null}

      {/* Main Video Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-8 relative">
        {/* AI Mentor Window */}
        <motion.div 
          className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <img 
            src="/ai-avatar.png" 
            alt="AI Mentor" 
            className="w-full h-full object-cover"
          />
          
          {/* Breathing Animation Overlay */}
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-blue-500/10 pointer-events-none"
          />

          <div className="absolute top-6 left-6">
             <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">AI Mentor (Speaking)</span>
             </div>
          </div>

          {/* AI Caption Overlay */}
          <div className="absolute bottom-12 left-8 right-8 z-10">
             <motion.div 
               key={lastAiMessage}
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-black/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/20 shadow-2xl"
             >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Insightful Analysis</span>
                </div>
                <p className="text-xl font-bold leading-relaxed text-white">
                  {isTyping ? "Analyzing your response..." : lastAiMessage}
                </p>
             </motion.div>
          </div>
        </motion.div>

        {/* Student Window */}
        <motion.div 
          className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {isCameraOff ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white/20">
              <VideoOff className="w-24 h-24 mb-4" />
              <p className="font-black uppercase tracking-widest text-xs">Camera is Off</p>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              muted 
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}

          <div className="absolute top-6 left-6">
             <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest">{userId} (You)</span>
             </div>
          </div>

          {/* Real-time Sentiment Overlay */}
          <div className="absolute bottom-12 right-8 z-10">
             <div className="bg-black/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
                <div className="flex items-center gap-8 mb-4">
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Emotion</p>
                      <p className="text-lg font-black text-white capitalize">{result.emotion}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Input Interface Over Student Video */}
          <div className="absolute bottom-12 left-8 max-w-[calc(100%-160px)] flex items-center gap-3">
             <div className="bg-white p-2 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? "Listening..." : "Type or speak to your mentor..."}
                  className="bg-transparent px-4 py-2 outline-none text-slate-900 font-bold text-sm w-64"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  className="bg-primary p-2.5 rounded-xl hover:bg-primary-dark transition-all"
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </button>
             </div>
             <div className="flex items-center gap-3">
               <button 
                  onClick={toggleListening}
                  title="Voice Input"
                  className={`p-4 rounded-2xl transition-all shadow-xl ${
                    isListening ? 'bg-rose-500 animate-pulse text-white' : 'bg-white text-slate-900'
                  }`}
                >
                  <Mic className={`w-6 h-6 ${isListening ? 'fill-white' : ''}`} />
               </button>
               <button 
                  onClick={leaveSession}
                  title="End Call"
                  className="p-4 rounded-2xl transition-all shadow-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center"
                >
                  <PhoneOff className="w-6 h-6 fill-white" />
               </button>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Control Bar (Zoom Style) */}
      <div className="p-8 bg-black/80 flex justify-center items-center gap-6 z-30">
        <ControlButton 
          active={!isMuted} 
          onClick={() => setIsMuted(!isMuted)} 
          icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />} 
          label={isMuted ? "Unmute" : "Mute"}
        />
        <ControlButton 
          active={!isCameraOff} 
          onClick={() => setIsCameraOff(!isCameraOff)} 
          icon={isCameraOff ? <VideoOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />} 
          label={isCameraOff ? "Start Video" : "Stop Video"}
        />
        <ControlButton 
          active={!isAiMuted} 
          onClick={() => setIsAiMuted(!isAiMuted)} 
          icon={isAiMuted ? <Heart className="w-5 h-5 text-rose-500" /> : <Sparkles className="w-5 h-5 text-primary" />} 
          label={isAiMuted ? "Unmute AI" : "Mute AI"}
        />
        <div className="w-[1px] h-8 bg-white/10 mx-2"></div>
        <button 
          onClick={leaveSession}
          className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
        >
          <PhoneOff className="w-4 h-4 fill-white" /> End Session
        </button>
      </div>

      <AnimatePresence>
        {showActivity && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-8">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-2xl w-full bg-[#1a1a1a] rounded-[4rem] border border-white/10 shadow-2xl p-12 text-center"
            >
               <AdaptiveActivities type="breathing" onComplete={() => setShowActivity(false)} />
            </motion.div>
          </div>
        )}

        {showReport && reportData && (
          <div className="absolute inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-2xl overflow-y-auto p-4 lg:p-12">
             <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="max-w-5xl mx-auto bg-[#161616] rounded-[3rem] border border-white/10 shadow-3xl overflow-hidden"
             >
                {/* Report Header */}
                <div className="p-12 bg-gradient-to-br from-primary/20 to-transparent border-b border-white/5 flex justify-between items-start">
                   <div>
                      <div className="flex items-center gap-3 mb-4">
                         <Award className="w-8 h-8 text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Session Accomplishment</span>
                      </div>
                      <h2 className="text-5xl font-black tracking-tight mb-2">Wellbeing Summary</h2>
                      <p className="text-white/40 font-medium">Session analysis for {userId} • {new Date().toLocaleDateString()}</p>
                   </div>
                   <button 
                     onClick={() => setShowReport(false)}
                     className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                   >
                     <X className="w-6 h-6" />
                   </button>
                </div>

                <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                   {/* Left Column: AI Summary */}
                   <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5">
                         <div className="flex items-center gap-3 mb-6">
                            <Brain className="w-6 h-6 text-primary" />
                            <h3 className="text-lg font-bold">Mentor's Perspective</h3>
                         </div>
                         <p className="text-xl leading-relaxed text-white/80 font-medium whitespace-pre-line">
                            {reportData.summary}
                         </p>
                      </div>

                      {/* Stress Chart */}
                      <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 h-[400px]">
                         <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                               <Activity className="w-6 h-6 text-rose-500" />
                               <h3 className="text-lg font-bold">Stress Progression</h3>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-rose-500"></div> Stress %
                               </div>
                            </div>
                         </div>
                         <ResponsiveContainer width="100%" height="80%">
                            <AreaChart data={reportData.history}>
                               <defs>
                                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                               <XAxis hide dataKey="time" />
                               <YAxis hide domain={[0, 100]} />
                               <Tooltip 
                                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                  itemStyle={{ color: '#fff' }}
                               />
                               <Area 
                                 type="monotone" 
                                 dataKey="stress" 
                                 stroke="#f43f5e" 
                                 strokeWidth={4}
                                 fillOpacity={1} 
                                 fill="url(#colorStress)" 
                               />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Right Column: Key Stats */}
                   <div className="space-y-6">
                      <StatCard 
                        icon={<TrendingDown className="w-5 h-5" />} 
                        label="Avg Stress" 
                        value={`${Math.round(reportData.stats?.avg_stress || 0)}%`} 
                        color="text-emerald-500"
                      />
                      <StatCard 
                        icon={<Sparkles className="w-5 h-5" />} 
                        label="Dominant Emotion" 
                        value={reportData.stats?.dominant || "Neutral"} 
                        color="text-primary"
                      />
                      <div className="p-8 bg-primary rounded-[2rem] text-white">
                         <h4 className="font-black uppercase tracking-widest text-[10px] mb-4 opacity-60">Emotional Insight</h4>
                         <p className="font-bold text-sm">
                            {reportData.stats?.dominant === 'sad' ? 'Vulnerability observed. Remember to be gentle with yourself today.' :
                             reportData.stats?.dominant === 'angry' ? 'Elevated frustration. Deep breathing can help reset your neural pathways.' :
                             reportData.stats?.dominant === 'stress' ? 'High cognitive load detected. Prioritize stepping away to recharge.' :
                             reportData.stats?.dominant === 'happy' ? 'Positive baseline detected! Ride this momentum through your day.' :
                             'You did a great job being open. Emotional intelligence is a muscle, and you just worked it out.'}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="p-12 bg-white/5 text-center">
                   <button 
                     onClick={() => setShowReport(false)}
                     className="px-12 py-5 bg-white text-black rounded-2xl font-black text-lg hover:scale-105 transition-all"
                   >
                     Done for today
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
       <div className="flex items-center gap-3 mb-4 opacity-60">
          {icon}
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function ControlButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={onClick}
        className={`p-4 rounded-2xl transition-all ${
          active ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-600/20 text-rose-500 border border-rose-600/30'
        }`}
      >
        {icon}
      </button>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{label}</span>
    </div>
  );
}
