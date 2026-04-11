"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Sparkles, 
  Loader2,
  Clock,
  Zap,
  Globe,
  ExternalLink,
  Flag,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Layout,
  Layers
} from "lucide-react";
import axios from "axios";

export default function CoursesPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(5); // 1, 5, 20
  const [courses, setCourses] = useState<any[]>([]);
  const [webResources, setWebResources] = useState<any[]>([]);
  const [tavilyAnswer, setTavilyAnswer] = useState("");

  const generateDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setCourses([]);
    setWebResources([]);
    setTavilyAnswer("");

    try {
      const [aiRes, tavilyRes] = await Promise.all([
        axios.post("http://localhost:8001/api/generate-course", {
          topic: topic,
          duration: duration
        }),
        axios.post("http://localhost:8001/api/search-resources", {
          query: topic
        })
      ]);

      setCourses(aiRes.data.chapters);
      setWebResources(tavilyRes.data.results);
      setTavilyAnswer(tavilyRes.data.answer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (visualQuery: string, index: number) => {
    // Strictly enforcing a "Hand-drawn Whiteboard/Schematic" aesthetic
    const query = visualQuery || topic || "academic";
    return `https://loremflickr.com/800/600/whiteboard,explanation,diagram,handwriting,${encodeURIComponent(query)}/all?lock=${index}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-24 py-12 px-6">
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-12 pb-12"
      >
        <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-[0.2em] border border-primary/20">
          <Sparkles className="w-4 h-4" />
          System Synthesized
        </div>
        
        <h1 className="text-7xl md:text-8xl font-black text-text-main tracking-tighter leading-[0.85] flex flex-col items-center">
          <span className="text-gradient drop-shadow-sm">Learning</span>
          <span className="opacity-90 italic">Trajectory</span>
        </h1>
        
        <p className="text-xl text-text-muted max-w-2xl mx-auto font-medium leading-relaxed italic opacity-70">
          Synthesizing high-fidelity academic roadmaps for <span className="text-text-main font-bold border-b-2 border-primary/30">your success</span>.
        </p>

        <form onSubmit={generateDiscovery} className="max-w-3xl mx-auto space-y-12">
          {/* Zen Pill Search */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full rounded-2xl" />
            <div className="relative flex items-center bg-white/40 backdrop-blur-2xl border border-white/60 rounded-full shadow-2xl shadow-primary/5 overflow-hidden transition-all focus-within:bg-white/80 focus-within:shadow-primary/10">
              <div className="pl-10 text-text-muted/50">
                <Search className="w-7 h-7" />
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic architecture (e.g. Modern Physics)"
                className="flex-1 bg-transparent py-8 px-8 text-2xl outline-none placeholder:text-text-muted/30 font-bold text-text-main"
              />
              <button
                disabled={loading || !topic.trim()}
                className="primary-btn m-3 py-5 px-10 shadow-lg"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    Build Flow <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8">
             <span className="text-[12px] font-black uppercase tracking-widest text-text-muted opacity-40">Trajectory Scope:</span>
             <div className="flex p-2 bg-white/30 backdrop-blur-md border border-white/40 rounded-full shadow-inner">
                {[1, 5, 20].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`px-10 py-3.5 rounded-full text-xs font-black transition-all duration-500 relative group/btn ${
                      duration === d 
                        ? "bg-white text-primary shadow-xl shadow-primary/10" 
                        : "text-text-muted hover:text-text-main"
                    }`}
                  >
                    {d}h {d === 1 ? 'Sprint' : (d === 5 ? 'Standard' : 'Complete')}
                    {duration === d && (
                      <motion.div layoutId="scope-pill" className="absolute inset-0 bg-white rounded-full -z-10" />
                    )}
                  </button>
                ))}
             </div>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
        {courses.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-24"
          >
            {/* Logic Overview */}
            {tavilyAnswer && (
              <div className="max-w-4xl mx-auto">
                 <div className="bento-tile p-10 bg-primary/5 border border-primary/20 rounded-[2.5rem] relative overflow-hidden group hover:bg-primary/10 transition-colors shadow-2xl shadow-primary/5">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform">
                       <TrendingUp className="w-64 h-64 text-primary" />
                    </div>
                    <div className="relative z-10 space-y-6">
                       <h3 className="text-sm font-black text-primary uppercase tracking-[0.4em] flex items-center gap-3">
                          <Zap className="w-5 h-5 fill-current" /> Mastery Intelligence
                       </h3>
                       <p className="text-text-main text-2xl font-bold leading-relaxed italic pr-12">
                         "{tavilyAnswer}"
                       </p>
                    </div>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
              {/* Flowchart Visualization */}
              <div className="lg:col-span-3 relative pb-24 border-white/20 border-l ml-12 pl-20">
                 
                 {/* Connecting Line (Spine) */}
                 <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute left-[-2px] top-12 w-[4px] bg-gradient-to-b from-primary via-primary/30 to-transparent hidden md:block rounded-full shadow-[0_0_20px_rgba(147,51,234,0.3)]" 
                 />

                 <div className="space-y-24">
                    {courses.map((chapter, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.15 + 0.3 }}
                        className="relative flex gap-12 group"
                      >
                         {/* Flow Indicator Node */}
                         <div className="absolute left-[-20px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-md border border-primary/30 rounded-2xl flex items-center justify-center shadow-2xl z-20 group-hover:scale-110 group-hover:bg-primary group-hover:border-primary group-hover:shadow-primary/40 transition-all duration-500">
                             {idx === 0 ? <Flag className="w-5 h-5 text-primary group-hover:text-white transition-colors" /> : (
                               idx === courses.length - 1 ? <CheckCircle2 className="w-6 h-6 text-primary group-hover:text-white transition-colors" /> : 
                               <span className="text-primary group-hover:text-white font-black text-sm italic transition-colors">0{idx + 1}</span>
                             )}
                         </div>

                         {/* Chapter Node Card */}
                         <div className="flex-1 bento-tile p-10 flex flex-col md:flex-row gap-12 relative group/card">
                            {/* Static Thumbnail */}
                            <div className="w-full md:w-72 aspect-video rounded-[2rem] overflow-hidden bg-white/20 flex-shrink-0 shadow-inner group-hover/card:scale-[1.03] transition-transform duration-700">
                                 <img 
                                   src={getImageUrl(chapter.visual_query, idx)} 
                                   className="w-full h-full object-cover opacity-80 group-hover/card:opacity-100 transition-opacity grayscale-[60%] contrast-[110%]" 
                                   alt={chapter.title}
                                 />
                            </div>

                            {/* Node Metadata */}
                            <div className="flex-1 space-y-8 flex flex-col justify-center">
                               <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                     <div className="px-4 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full tracking-[0.2em]">Trajectory Part {idx + 1}</div>
                                     <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted/60 uppercase tracking-widest">
                                        <Clock className="w-4 h-4 opacity-50" /> {duration === 1 ? '15m' : (duration === 5 ? '45m' : '1.5h')}
                                     </div>
                                  </div>
                                  <h4 className="text-4xl font-black text-text-main tracking-tight leading-tight group-hover/card:text-primary transition-colors">{chapter.title}</h4>
                               </div>

                               {/* Internal Topic Breakdown (Pills) */}
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {chapter.subtopics && chapter.subtopics.map((sub: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-white/40 border border-white/60 rounded-full transition-all group-hover/card:bg-white/80 group-hover/card:shadow-lg group-hover/card:translate-y-[-2px]">
                                       <div className="w-2 h-2 rounded-full bg-primary/30 group-hover/card:bg-primary transition-colors" />
                                       <span className="text-[11px] font-bold text-text-main opacity-70 uppercase tracking-wide">{sub.title}</span>
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>

              {/* Sidebar Intel */}
              <div className="space-y-12">
                 <div className="space-y-8">
                    <h2 className="text-xl font-black uppercase tracking-[0.2em] border-b-2 border-primary/20 pb-6 text-text-main">Knowledge <span className="text-primary italic">Nodes</span></h2>
                    <div className="space-y-6">
                      {webResources.map((res, i) => (
                        <motion.a 
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="block p-6 bento-tile bg-white/30 border-white/40 hover:bg-white/80 transition-all group relative overflow-hidden"
                        >
                           <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                              <ExternalLink className="w-12 h-12 text-primary" />
                           </div>
                           <div className="flex items-center justify-between mb-4 relative z-10">
                              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                 <Globe className="w-5 h-5 text-primary" />
                              </div>
                              <ExternalLink className="w-4 h-4 text-text-muted/40 group-hover:text-primary transition-colors" />
                           </div>
                           <h5 className="font-bold text-base mb-2 group-hover:text-primary leading-snug line-clamp-2 transition-colors italic">{res.title}</h5>
                           <p className="text-[10px] text-text-muted/60 font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">{new URL(res.url).hostname}</p>
                        </motion.a>
                      ))}
                    </div>
                 </div>

                 <div className="p-10 bento-tile bg-primary/5 border-dashed border-2 border-primary/20 rounded-[2.5rem] space-y-4">
                    <h6 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3 text-primary">
                       <Layout className="w-5 h-5" /> Curricula Logic
                    </h6>
                    <p className="text-[12px] text-text-muted font-medium leading-relaxed italic opacity-80">
                       This trajectory is synthesized from {duration}h density requirements and JEE PCM prerequisites. All nodes are sequence-locked.
                    </p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Empty State */}
      {courses.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-32 text-center space-y-12"
        >
           <div className="w-32 h-32 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl group hover:rotate-12 transition-all duration-500">
              <Layers className="w-14 h-14 text-primary/40 group-hover:text-primary transition-colors" />
           </div>
           <div className="space-y-6">
              <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-text-main opacity-90">Architect your Flow</h3>
              <p className="text-text-muted text-xl font-medium italic opacity-50 max-w-lg mx-auto leading-relaxed">Visualize your mastery trajectory for any JEE topic with our high-fidelity synthesis engine.</p>
           </div>
        </motion.div>
      )}
    </div>
  );
}
