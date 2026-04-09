"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Video, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  Loader2,
  Layers
} from "lucide-react";
import axios from "axios";

export default function CoursesPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);

  const generateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8001/api/generate-course", {
        topic: topic,
        no_of_chapters: 6
      });
      setCourses(res.data.chapters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold font-heading">
          Explore <span className="text-gradient">Unlimited Learning</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Simply enter a topic and our AI will curate a personalized learning path 
          complete with high-quality video content.
        </p>
      </div>

      {/* Search Input */}
      <div className="glass-card p-2 max-w-2xl mx-auto flex items-center gap-2 group focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
        <div className="pl-4">
          <Search className="w-6 h-6 text-slate-500 group-focus-within:text-indigo-400" />
        </div>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What do you want to learn today?"
          className="flex-1 bg-transparent py-4 text-lg outline-none placeholder:text-slate-600"
        />
        <button
          onClick={generateCourse}
          disabled={loading || !topic.trim()}
          className="vibrant-btn flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>
              Generate Course <Sparkles className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Course Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {courses.map((chapter, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card overflow-hidden group hover:bg-white/[0.08]"
            >
              <div className="aspect-video relative bg-slate-800 flex items-center justify-center">
                {chapter.video_url ? (
                  <iframe
                    src={chapter.video_url}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Video className="w-12 h-12 text-slate-700" />
                    <span className="text-xs text-slate-600">No Video Available</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-600 text-[10px] font-bold uppercase rounded-lg">
                  Chapter {idx + 1}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-heading mb-3 line-clamp-2">
                  {chapter.video_title || chapter.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" /> {idx + 1} Chapters
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-4 h-4" /> All Levels
                  </span>
                </div>
                <button className="w-full py-3 rounded-xl border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 group font-medium">
                  Mark as Completed
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {courses.length === 0 && !loading && (
        <div className="text-center py-20">
          <Layers className="w-16 h-16 text-slate-800 mx-auto mb-6" />
          <h3 className="text-xl font-medium text-slate-500">
            Start by entering a topic above to generate your first course.
          </h3>
        </div>
      )}
    </div>
  );
}
