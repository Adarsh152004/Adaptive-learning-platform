"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wind, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface AdaptiveActivitiesProps {
  type: 'breathing' | 'grounding' | 'affirmation';
  onComplete: () => void;
}

export default function AdaptiveActivities({ type, onComplete }: AdaptiveActivitiesProps) {
  const [step, setStep] = useState(0);

  if (type === 'breathing') {
    return <BreathingExercise onComplete={onComplete} />;
  }
  
  if (type === 'grounding') {
    return <GroundingExercise onComplete={onComplete} />;
  }

  return <AffirmationActivity onComplete={onComplete} />;
}

function BreathingExercise({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [counter, setCounter] = useState(4);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          if (phase === 'inhale') { setPhase('hold'); return 4; }
          if (phase === 'hold') { setPhase('exhale'); return 4; }
          if (phase === 'exhale') { setPhase('pause'); return 4; }
          if (phase === 'pause') { 
            setCycles(c => c + 1);
            setPhase('inhale'); 
            return 4; 
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (cycles >= 3) {
      setTimeout(onComplete, 2000);
    }
  }, [cycles, onComplete]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-80 h-80 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={phase}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: phase === 'inhale' ? 1.5 : phase === 'hold' ? 1.5 : 1,
              opacity: 1
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className={`w-32 h-32 rounded-full flex items-center justify-center ${
              phase === 'inhale' ? 'bg-primary/20 bg-primary/20' : 
              phase === 'hold' ? 'bg-amber-100' : 'bg-emerald-100'
            }`}
          >
             <Wind className={`w-12 h-12 ${
               phase === 'inhale' ? 'text-primary' : 
               phase === 'hold' ? 'text-amber-500' : 'text-emerald-500'
             }`} />
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute inset-0 border-2 border-slate-100 rounded-full scale-[1.6]"></div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-slate-800 pointer-events-none">
          {counter}
        </div>
      </div>

      <div className="mt-16 text-center">
        <h3 className="text-3xl font-black text-slate-900 capitalize mb-2">{phase}...</h3>
        <p className="text-slate-500 font-medium">Cycle {cycles + 1} of 3</p>
      </div>

      {cycles >= 3 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-2 text-emerald-500 font-bold"
        >
          <CheckCircle2 className="w-6 h-6" /> Well done! You're doing great.
        </motion.div>
      )}
    </div>
  );
}

function GroundingExercise({ onComplete }: { onComplete: () => void }) {
  const steps = [
    "Identify 5 things you can see right now.",
    "Identify 4 things you can feel (texture of your clothes, etc.)",
    "Identify 3 things you can hear.",
    "Identify 2 things you can smell.",
    "Identify 1 thing you can taste."
  ];
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="text-center w-full">
      <div className="mb-12">
        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
           <Sparkles className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Grounding 5-4-3-2-1</h3>
        <p className="text-slate-500 font-medium max-w-md mx-auto">This exercise helps quiet the mind by focusing on your senses.</p>
      </div>

      <div className="space-y-4 mb-12">
        {steps.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: i === currentStep ? 1 : i < currentStep ? 0.4 : 0.1,
              scale: i === currentStep ? 1.05 : 1
            }}
            className={`p-6 rounded-[2rem] border-2 transition-all ${
              i === currentStep ? 'bg-white border-primary shadow-xl shadow-primary/10' : 'bg-slate-50 border-transparent'
            }`}
          >
            <p className={`text-lg font-bold ${i === currentStep ? 'text-slate-900' : 'text-slate-400'}`}>{s}</p>
          </motion.div>
        ))}
      </div>

      <button 
        onClick={() => {
          if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
          else onComplete();
        }}
        className="px-12 py-4 bg-primary text-white rounded-full font-bold text-lg hover:bg-primary-dark shadow-xl shadow-primary/20 flex items-center justify-center mx-auto gap-3"
      >
        {currentStep === steps.length - 1 ? "Complete" : "Next Sense"} <ArrowRight className="w-6 h-6" />
      </button>
    </div>
  );
}

function AffirmationActivity({ onComplete }: { onComplete: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const affirmations = [
    "I am capable of handling whatever this day brings.",
    "My feelings are valid, and I am allowed to feel them.",
    "I am doing my best, and that is more than enough.",
    "I choose to be kind to myself today.",
    "This moment is temporary, my strength is permanent."
  ];

  return (
    <div className="text-center py-12">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIdx}
          initial={{ scale: 0.9, opacity: 0, rotateY: 90 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          exit={{ scale: 0.9, opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-primary/10 to-emerald-50 p-16 rounded-[4rem] border-2 border-primary/10 shadow-inner mb-12"
        >
          <Heart className="w-16 h-16 text-primary mx-auto mb-8 animate-pulse" />
          <h3 className="text-4xl font-black text-slate-800 leading-tight tracking-tight">
            "{affirmations[currentIdx]}"
          </h3>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-6">
        <button 
          onClick={() => {
            if (currentIdx < affirmations.length - 1) setCurrentIdx(c => c + 1);
            else onComplete();
          }}
          className="px-10 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-black transition-all flex items-center gap-3"
        >
          {currentIdx === affirmations.length - 1 ? "Finish" : "Next Affirmation"}
        </button>
      </div>
    </div>
  );
}
