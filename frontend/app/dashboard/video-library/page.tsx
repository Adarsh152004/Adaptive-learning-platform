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
  BookOpen
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

export default function VideoLibraryPage() {
  const [topic, setTopic] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{url: string, title: string} | null>(null);

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const processVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setUploading(true);
    setUploadSuccess(false);
    try {
      await axios.post("http://localhost:8001/api/process-video", {
        video_url: videoUrl,
        tutor_name: "LearnSphere Tutor",
        course_name: "AI Library Knowledge"
      });
      setUploadSuccess(true);
      setVideoUrl("");
    } catch (err) {
      console.error(err);
      alert("Failed to process video: Please verify it is a valid URL.");
    } finally {
      setUploading(false);
    }
  };

  const searchVideos = async (e: React.FormEvent) => {
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
    <div className="max-w-7xl mx-auto space-y-16 py-8">
      {/* Search Header */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-extrabold tracking-tight">
          Semantic <span className="italic text-primary">Video Search</span>
        </h1>
        <p className="text-text-muted text-lg font-medium max-w-2xl mx-auto">
          Not just finding titles—but finding the exact moment a concept was explained.
        </p>

        <form onSubmit={searchVideos} className="max-w-3xl mx-auto relative group mt-10">
          <div className="flex items-center bg-white border border-border rounded-sm shadow-xl shadow-primary/5 transition-all group-focus-within:border-primary">
            <div className="pl-6">
              <Search className="w-6 h-6 text-text-muted" />
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Search concepts (e.g. How does backpropagation work?)"
              className="flex-1 bg-transparent py-6 px-4 text-xl outline-none placeholder:text-text-muted/50 font-medium"
            />
            <button
              disabled={loading || !topic.trim()}
              className="primary-btn m-1 flex items-center gap-3 px-8"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Find <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
        
        {/* Floating Active Player Overlay */}
        <AnimatePresence>
          {activeVideo && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center p-8 rounded-xl border border-border overflow-hidden"
            >
               <div className="w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl relative aspect-video">
                  <button 
                     onClick={() => setActiveVideo(null)}
                     className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-error/80 text-white rounded-full p-2 transition-all"
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
               <h2 className="mt-4 text-2xl font-bold">{activeVideo.title}</h2>
               <p className="text-text-muted mt-2">Playing from semantic match point...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <div className="col-span-1 space-y-6">
          <div className="bento-tile p-6 bg-white border border-border">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" /> Inject Knowledge
            </h3>
            <p className="text-sm text-text-muted mb-6">
              Paste a video URL. The AI will transcribe, chunk, and embed it into the global vector space.
            </p>
            <form onSubmit={processVideo} className="space-y-4">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full text-sm bg-surface border border-border rounded p-3 outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
                required
              />
              <button
                disabled={uploading || !videoUrl.trim()}
                className="w-full secondary-btn flex items-center justify-center gap-2 py-3"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Process Video"}
              </button>
            </form>
            {uploadSuccess && (
              <p className="text-green-600 text-xs font-bold mt-4 text-center">Video successfully added to index!</p>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="col-span-1 lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {recommendations.map((rec, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bento-tile flex flex-col group overflow-hidden bg-white border-border"
                >
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                         <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors flex-1 pr-4 line-clamp-2">
                           {rec.video_title}
                         </h3>
                         <div className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-1 rounded truncate max-w-[100px]">
                            {Math.round(rec.similarity * 100)}% Match
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {rec.course}</span>
                      </div>

                      <div className="bg-surface p-4 rounded-md border border-border/50 mb-6">
                         <p className="text-sm italic text-text-muted line-clamp-3">
                           "...{rec.chunk_text}..."
                         </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        // Convert standard watch urls into embed URLs for iframes
                        let embedUrl = rec.video_link;
                        if (embedUrl.includes("youtube.com/watch?v=")) {
                          const videoId = embedUrl.split("v=")[1].split("&")[0];
                          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${rec.timestamp}`;
                        } else if (embedUrl.includes("youtu.be/")) {
                          const videoId = embedUrl.split("youtu.be/")[1].split("?")[0];
                          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${rec.timestamp}`;
                        }
                        setActiveVideo({url: embedUrl, title: rec.video_title});
                      }}
                      className="secondary-btn w-full flex items-center justify-center gap-3 py-3 text-xs group/btn hover:bg-primary hover:text-white transition-colors"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Play Match at {formatTimestamp(rec.timestamp)}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {recommendations.length === 0 && !loading && (
            <div className="py-24 text-center">
                <div className="w-20 h-20 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video className="w-10 h-10 text-text-[12px] opacity-20" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">Vector Library Ready</h3>
                <p className="text-text-muted font-medium italic max-w-sm mx-auto">Upload a video or search a concept to traverse the knowledge graph.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
