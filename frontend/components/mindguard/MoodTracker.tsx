"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const moods = [
  { emoji: "😊", label: "Happy", value: 5 },
  { emoji: "😐", label: "Neutral", value: 3 },
  { emoji: "😞", label: "Sad", value: 2 },
  { emoji: "😣", label: "Stressed", value: 1 },
  { emoji: "😴", label: "Tired", value: 3 },
];

export default function MoodTracker({ userId }: { userId: string }) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleMoodSubmit = async (value: number) => {
    setSelectedMood(value);
    setLoading(true);
    try {
      await axios.post("http://localhost:8001/api/mindguard/mood", {
        user_id: userId,
        mood: value,
        questionnaire: [],
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit mood", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Thanks for sharing! ❤️</h3>
        <p className="text-white/70">Your mood has been logged. It helps us personalize your learning path.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
      <h3 className="text-xl font-semibold text-white mb-4">How are you feeling today?</h3>
      <div className="flex justify-between items-center gap-4">
        {moods.map((mood) => (
          <motion.button
            key={mood.label}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleMoodSubmit(mood.value)}
            disabled={loading}
            className={`text-4xl p-3 rounded-xl transition-colors ${
              selectedMood === mood.value ? "bg-white/20" : "hover:bg-white/10"
            }`}
            title={mood.label}
          >
            {mood.emoji}
          </motion.button>
        ))}
      </div>
      <p className="mt-4 text-xs text-white/50 text-center italic">
        Select an emoji to log your daily check-in.
      </p>
    </div>
  );
}
