"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Video, 
  UploadCloud, 
  Sparkles, 
  Loader2,
  PlayCircle,
  Clock,
  BookOpen,
  Brain,
  History
} from "lucide-react";
import axios from "axios";

interface Recommendation {
  chunk_id: string;
  video_title: string;
  course: string;
  tutor: string;
  timestamp: number;
  similarity: number;
  chunk_text: string;
  video_link: string;
}

export default function SmartLibraryPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeVideo, setActiveVideo] = useState<{url: string, title: string} | null>(null);

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const searchSmartLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8001/api/recommendations/search", {
        topic: topic
      });
      setRecommendations(res.data.recommendations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 py-8 px-4">
      {/* Search Header */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
           <Brain className="w-4 h-4" /> Vector-Indexed Knowledge
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight">
          The <span className="italic text-primary">Smart Library</span>
        </h1>
        <p className="text-text-muted text-lg font-medium max-w-2xl mx-auto">
          Traverse the exact moment in JEE high-quality lectures where your concept is explained.
        </p>

        <form onSubmit={searchSmartLibrary} className="max-w-3xl mx-auto relative group mt-10">
          <div className="flex items-center bg-white border border-border rounded-xl shadow-2xl shadow-primary/5 transition-all group-focus-within:border-primary overflow-hidden">
            <div className="pl-6">
              <Search className="w-6 h-6 text-text-muted" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Search concepts (e.g. SN1 mechanism, moment of inertia formulas)"
              className="flex-1 bg-transparent py-6 px-4 text-xl outline-none placeholder:text-text-muted/50 font-medium"
            />
            <button
              disabled={loading || !topic.trim()}
              className="primary-btn m-1 flex items-center gap-3 px-8 rounded-lg"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Find Moment <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-12 relative min-h-[400px]">
        
        {/* Floating Active Player Overlay */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[1000] bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center p-8 rounded-xl border border-border overflow-hidden"
            >
               <div className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video">
                  <button 
                     onClick={() => setActiveVideo(null)}
                     className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-error text-white rounded-full p-2.5 transition-all"
                  >
                     ✕ Close
                  </button>
                  <iframe 
                    src={activeVideo.url} 
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
               </div>
               <h2 className="mt-8 text-3xl font-black">{activeVideo.title}</h2>
               <p className="text-primary font-bold mt-2 uppercase tracking-widest text-sm flex items-center gap-2">
                 <Clock className="w-4 h-4" /> Playing from Semantic Match Point
               </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bento-tile flex flex-col group overflow-hidden bg-white hover:border-primary transition-all p-0"
                >
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                         <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors flex-1 pr-4 line-clamp-2">
                           {rec.video_title}
                         </h3>
                         <div className="bg-primary/10 text-primary text-[10px] uppercase font-black px-3 py-1.5 rounded-full whitespace-nowrap">
                            {Math.round(rec.similarity * 100)}% Semantic Match
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-muted mb-6">
                        <span className="flex items-center gap-1.5 text-primary"><BookOpen className="w-4 h-4" /> {rec.course}</span>
                      </div>

                      <div className="bg-surface/50 p-5 rounded-xl border border-border/50 mb-8 relative">
                         <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-bold text-text-muted uppercase">Relevant Context</div>
                         <p className="text-sm italic text-text-main line-clamp-4 leading-relaxed">
                           "...{rec.chunk_text}..."
                         </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        // Ensure it's a valid embed URL with start timestamp
                        let embedUrl = rec.video_link;
                        if (embedUrl.includes("youtube.com/watch?v=")) {
                          const videoId = embedUrl.split("v=")[1].split("&")[0];
                          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${rec.timestamp}`;
                        } else if (embedUrl.includes("youtu.be/")) {
                          const videoId = embedUrl.split("youtu.be/")[1].split("?")[0];
                          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${rec.timestamp}`;
                        } else if (!embedUrl.includes("embed") && embedUrl.includes("youtube.com")) {
                           // Generic catch
                           embedUrl = embedUrl.replace("watch?v=", "embed/") + `?autoplay=1&start=${rec.timestamp}`;
                        }
                        
                        setActiveVideo({url: embedUrl, title: rec.video_title});
                      }}
                      className="primary-btn w-full flex items-center justify-center gap-4 py-4 text-xs group/btn shadow-xl shadow-primary/10"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Play Moment at {formatTimestamp(rec.timestamp)}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State / Welcome */}
          {recommendations.length === 0 && !loading && (
            <div className="py-24 text-center">
                <div className="w-24 h-24 bg-surface border border-dashed border-border rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
                    <Video className="w-12 h-12 text-primary opacity-30" />
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-4">Library Index Ready</h3>
                <p className="text-text-muted font-medium italic max-w-lg mx-auto text-lg">
                  Ask a question above to scan through hours of seeded JEE lectures in milliseconds.
                </p>
                <div className="mt-12 flex flex-wrap justify-center gap-3">
                   {["SN1 Mechanics", "Moment of Inertia", "Definite Integration"].map((tag) => (
                      <button 
                        key={tag}
                        onClick={() => { setTopic(tag); }}
                        className="px-5 py-2.5 bg-white border border-border rounded-full text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                      >
                        {tag}
                      </button>
                   ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
