"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  BrainCircuit, 
  Calendar, 
  ArrowUpRight,
  Info,
  Copy,
  Hash
} from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";

export default function TeacherDashboard() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const teacherId = (session?.user as any)?.id;
  const batchInfo = (session?.user as any)?.batch_info || { batch_code: "N/A", batch_name: "Unnamed Batch" };

  useEffect(() => {
    if (teacherId) {
      fetchStudents();
    }
  }, [teacherId]);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`http://localhost:8001/api/teacher/students?teacher_id=${teacherId}`);
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyBatchCode = () => {
    navigator.clipboard.writeText(batchInfo.batch_code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto p-10 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold mb-2 tracking-wide uppercase text-xs">
            <Users className="w-4 h-4" />
            Teacher Console
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Student Tracking Hub</h1>
          <p className="text-text-muted mt-2 font-medium">Monitoring batch performance and aspirant stability.</p>
        </div>

        {/* Batch Code Card */}
        <div className="bg-white p-5 rounded-sm border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{batchInfo.batch_name}</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tighter">{batchInfo.batch_code}</span>
              <button 
                onClick={copyBatchCode}
                className="p-1.5 hover:bg-surface rounded-full transition-colors text-text-muted hover:text-primary"
                title="Copy Code"
              >
                {copySuccess ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bento-tile p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <Users className="text-blue-500 w-6 h-6" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Total Aspirants</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black">{students.length}</h3>
            <p className="text-xs text-text-muted font-medium mt-1">Currently enrolled in batch</p>
          </div>
        </div>
        <div className="bento-tile p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <TrendingUp className="text-emerald-500 w-6 h-6" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Avg Percentile</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black">78.2</h3>
            <p className="text-xs text-text-muted font-medium mt-1">Batch performance average</p>
          </div>
        </div>
        <div className="bento-tile p-6 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <AlertTriangle className="text-amber-500 w-6 h-6" />
            <span className="text-[10px] font-bold uppercase text-text-muted">Stability Alert</span>
          </div>
          <div className="mt-4">
            <h3 className="text-4xl font-black">2</h3>
            <p className="text-xs text-text-muted font-medium mt-1">Students showing burnout signs</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search students by name or email..." 
            className="w-full bg-white border border-border rounded-full py-3 pl-12 pr-6 focus:border-primary transition-all outline-none font-medium text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 bg-surface border border-border rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors">
          Filter
        </button>
      </div>

      {/* Students Table/Grid */}
      <div className="bg-white border border-border rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Aspirant</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Latest Scores</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Wellbeing Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? filteredStudents.map((student) => (
              <tr key={student.id} className="border-b border-border hover:bg-surface/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center font-bold text-primary">
                      {student.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{student.name}</p>
                      <p className="text-xs text-text-muted">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex gap-2">
                    {student.quizzes.length > 0 ? student.quizzes.slice(0, 3).map((q: any, i: number) => (
                      <div key={i} className="px-2 py-1 bg-surface border border-border rounded text-[10px] font-bold">
                        {Math.round((q.score / q.total_questions) * 100)}%
                      </div>
                    )) : (
                      <span className="text-xs text-text-muted italic">No data</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  {student.wellbeing ? (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${student.wellbeing.mood_score < 4 ? "bg-error" : "bg-success"}`} />
                      <span className="text-xs font-bold uppercase tracking-tight">
                        {student.wellbeing.stress_level}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted italic tracking-tight">Not logged</span>
                  )}
                </td>
                <td className="px-8 py-6">
                  <button className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
                    Full Profile <ArrowUpRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center opacity-40">
                    <Users className="w-12 h-12 mb-4" />
                    <p className="font-medium">No students found in this batch yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
