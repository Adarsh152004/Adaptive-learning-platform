"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, 
  Target, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Sparkles,
  Coffee,
  Atom,
  FlaskConical,
  Sigma,
  ArrowRight
} from "lucide-react";

const JEE_SYLLABUS = {
  physics: [
    "Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Mechanics", 
    "Gravitation", "Thermodynamics", "SHM & Waves", "Electrostatics", 
    "Magnetism", "Optics"
  ],
  chemistry: [
    "Structure of Atom", "Chemical Bonding", "States of Matter", "Chemical Thermodynamics", 
    "Equilibrium", "Redox Reactions", "Organic (GOC)", "Hydrocarbons", 
    "Coordination Compounds", "Electrochemistry"
  ],
  maths: [
    "Sets & Relations", "Complex Numbers", "Quadratic Equations", "Permutation & Combination", 
    "Binomial Theorem", "Sequences & Series", "Coordinate Geometry", "Calculus (Limits & Cont.)", 
    "Integral Calculus", "Vectors & 3D Geometry"
  ]
};

export default function AdaptiveQuizPage() {
  const [activeTab, setActiveTab] = useState<"physics" | "chemistry" | "maths">("physics");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [difficulty, setDifficulty] = useState("Hard");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Dummy Quiz State
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  const startQuizForTopic = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setLoading(true);
    // Simulate loading first question
    setTimeout(() => {
      setQuizStarted(true);
      setCurrentQuestion({
        text: `Consider a complex problem in ${selectedTopic}. If the standard assumptions hold true, what happens to the scalar invariant when the limit evaluates to infinity?`,
        options: ["Converges to 0", "Diverges infinitely", "Approaches a non-zero constant", "Undefined state"],
        answer_index: 2
      });
      setLoading(false);
    }, 1500);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    const correct = selectedAnswer === currentQuestion.answer_index;
    setIsCorrect(correct);
    if(correct) setScore(s => s + 4); 
    else setScore(s => s - 1);
  };

  const nextQuestion = () => {
    setLoading(true);
    setTimeout(() => {
      setQuestionCount(c => c + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      
      if (!isCorrect) {
        setDifficulty("Medium");
        setCurrentQuestion({
          text: `Let's dial back to the fundamentals of ${topic}. Which foundational principle must be applied to isolate the variable before integration?`,
          options: ["Conservation of Energy", "First Derivative Test", "Partial Fraction Decomposition", "Superposition Principle"],
          answer_index: 2,
          adaptive_insight: "The AI detected hesitation on the advanced application. Let's practice the mathematical fundamentals first. Don't stress, you'll master this!"
        });
      } else {
        setDifficulty("Hard");
        setCurrentQuestion({
          text: `Excellent. Now applying advanced constraints in ${topic}: If the system is perturbed by a factor of e^(-x), the new boundary condition is?`,
          options: ["Strictly increasing", "Oscillatory decay", "Exponentially growing", "Static equilibrium"],
          answer_index: 1,
          adaptive_insight: "Perfect! The AI is pushing your limits to prepare you for actual JEE Advanced scenarios."
        });
      }
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 py-8 px-4 md:px-0">
      {/* Quiz Header */}
      <div className="flex items-center gap-4 border-b border-border pb-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-border">
          <Target className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold font-heading">Concept <span className="italic text-primary">Mastery Quizzes</span></h1>
          <p className="text-text-muted mt-1 font-medium">Select a chapter from the JEE Syllabus to generate adaptive mock tests.</p>
        </div>
      </div>

      {!quizStarted ? (
        <div className="space-y-8">
          {/* Syllabus Tabs */}
          <div className="flex bg-surface p-2 rounded-lg border border-border gap-2 w-fit mx-auto">
            <button 
              onClick={() => setActiveTab("physics")}
              className={`flex items-center gap-2 px-8 py-3 rounded-md font-bold transition-all ${activeTab === 'physics' ? 'bg-blue-500 text-white shadow-lg' : 'text-text-muted hover:bg-white'}`}
            >
              <Atom className="w-5 h-5" /> Physics
            </button>
            <button 
              onClick={() => setActiveTab("chemistry")}
              className={`flex items-center gap-2 px-8 py-3 rounded-md font-bold transition-all ${activeTab === 'chemistry' ? 'bg-emerald-500 text-white shadow-lg' : 'text-text-muted hover:bg-white'}`}
            >
              <FlaskConical className="w-5 h-5" /> Chemistry
            </button>
            <button 
              onClick={() => setActiveTab("maths")}
              className={`flex items-center gap-2 px-8 py-3 rounded-md font-bold transition-all ${activeTab === 'maths' ? 'bg-purple-500 text-white shadow-lg' : 'text-text-muted hover:bg-white'}`}
            >
              <Sigma className="w-5 h-5" /> Mathematics
            </button>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {JEE_SYLLABUS[activeTab].map((t, idx) => (
                <motion.div
                  key={`${activeTab}-${idx}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => startQuizForTopic(t)}
                  className="bento-tile bg-white p-6 cursor-pointer group hover:border-primary transition-all flex flex-col justify-between h-40"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-3xl font-extrabold text-border group-hover:text-primary/20 transition-colors">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    {loading && topic === t ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    )}
                  </div>
                  <div>
                     <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{t}</h3>
                     <p className="text-xs text-text-muted mt-2 font-medium">Adaptive Mock Available</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={questionCount}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bento-tile bg-white overflow-hidden"
            >
              <div className="bg-surface border-b border-border p-4 flex justify-between items-center text-sm font-bold uppercase tracking-widest text-text-muted">
                 <div className="flex gap-4 items-center">
                    <button onClick={() => setQuizStarted(false)} className="hover:text-primary transition-colors mr-4">
                      &larr; Back to Syllabus
                    </button>
                    <span>Q{questionCount + 1}</span>
                    <span className="text-primary italic whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{topic}</span>
                 </div>
                 <div className="flex gap-4 items-center">
                    <span>Score: {score}</span>
                    <div className={`px-2 py-1 rounded text-xs text-white ${difficulty === "Hard" ? "bg-red-500" : "bg-orange-500"}`}>
                       Level: {difficulty}
                    </div>
                 </div>
              </div>

              <div className="p-6 md:p-10">
                {currentQuestion.adaptive_insight && (
                  <div className="mb-8 p-4 bg-primary/5 border-l-4 border-primary rounded-r text-sm font-medium flex gap-3 text-primary">
                    <Coffee className="w-5 h-5 shrink-0" />
                    <p>{currentQuestion.adaptive_insight}</p>
                  </div>
                )}

                <h3 className="text-xl md:text-2xl font-semibold mb-8 leading-relaxed">
                  {currentQuestion.text}
                </h3>

                <div className="space-y-3 mb-10">
                  {currentQuestion.options.map((opt: string, idx: number) => {
                    const isSelected = selectedAnswer === idx;
                    let bgClass = "bg-surface hover:border-primary border-border";
                    if (isSelected) bgClass = "bg-primary/5 border-primary text-primary";
                    
                    if (isCorrect !== null) {
                      if (idx === currentQuestion.answer_index) bgClass = "bg-success/10 border-success text-success";
                      else if (isSelected) bgClass = "bg-error/10 border-error text-error";
                      else bgClass = "bg-surface border-border opacity-50";
                    }

                    return (
                      <button 
                        key={idx}
                        onClick={() => isCorrect === null && setSelectedAnswer(idx)}
                        disabled={isCorrect !== null}
                        className={`w-full text-left p-4 md:p-5 rounded-sm border-2 font-medium transition-all flex items-center justify-between ${bgClass}`}
                      >
                        <span><span className="font-bold mr-4 opacity-50">({String.fromCharCode(65+idx)})</span> {opt}</span>
                        {isCorrect !== null && idx === currentQuestion.answer_index && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        {isCorrect !== null && isSelected && idx !== currentQuestion.answer_index && <XCircle className="w-5 h-5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end border-t border-border pt-6">
                  {isCorrect === null ? (
                    <button 
                      onClick={submitAnswer}
                      disabled={selectedAnswer === null}
                      className="primary-btn px-8"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button 
                      onClick={nextQuestion}
                      disabled={loading}
                      className="secondary-btn px-8 flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next Concept"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
