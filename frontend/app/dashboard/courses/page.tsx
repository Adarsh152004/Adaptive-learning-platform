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
  Layers,
  Play
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
    <div className="max-w-7xl mx-auto space-y-16 py-8">
      {/* Search Header */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-extrabold tracking-tight">
          What will you <span className="italic text-primary">Master today?</span>
        </h1>
        <p className="text-text-muted text-lg font-medium max-w-2xl mx-auto italic">
          AI generates customized learning paths based on your interests.
        </p>

        <form onSubmit={generateCourse} className="max-w-3xl mx-auto relative group mt-10">
          <div className="flex items-center bg-white border border-border rounded-sm shadow-xl shadow-primary/5 transition-all group-focus-within:border-primary">
            <div className="pl-6">
              <Search className="w-6 h-6 text-text-muted" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic (e.g. Quantum Physics, Excel for Finance)"
              className="flex-1 bg-transparent py-6 px-4 text-xl outline-none placeholder:text-text-muted/50 font-medium"
            />
            <button
              disabled={loading || !topic.trim()}
              className="primary-btn m-1 flex items-center gap-3 px-8"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Generate <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Course Content - Bento Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {courses.map((chapter, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bento-tile flex flex-col group overflow-hidden bg-white"
            >
              <div className="aspect-video relative bg-surface border-b border-border overflow-hidden">
                {chapter.video_url ? (
                  <iframe
                    src={chapter.video_url}
                    className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-surface">
                    <Video className="w-10 h-10 text-border" />
                    <span className="text-[10px] font-bold text-text-muted uppercase mt-2">Preview Offline</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 bg-primary text-white text-[10px] font-extrabold uppercase rounded shadow-lg">
                  Phase {idx + 1}
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-extrabold mb-3 leading-tight group-hover:text-primary transition-colors">
                    {chapter.video_title || chapter.title}
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6">
                    <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Video Phase</span>
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> AI Curated</span>
                  </div>
                </div>
                
                <button className="secondary-btn w-full flex items-center justify-center gap-3 py-3 text-xs group/btn">
                  Mark Milestone
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {courses.length === 0 && !loading && (
        <div className="py-24 text-center">
            <div className="w-20 h-20 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-12">
                <Layers className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight mb-2">Your Knowledge Library is Empty</h3>
            <p className="text-text-muted font-medium italic">Generate a course above to initialize your learning graph.</p>
        </div>
      )}
    </div>
  );
}
