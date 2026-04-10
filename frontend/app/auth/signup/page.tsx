"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Calendar, Loader2, Sparkles } from "lucide-react";
import axios from "axios";

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", age: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post("http://localhost:8001/auth/signup", {
        ...formData,
        age: parseInt(formData.age),
      });
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 py-12 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-tile w-full max-w-md p-10 bg-white"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            LearnSphere AI
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Create Account</h1>
          <p className="text-text-muted text-sm font-medium">Join 2,000+ scholars today.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-sm bg-error/5 border border-error text-error text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                required
                type="text"
                placeholder="John Doe"
                className="w-full bg-surface border border-border rounded-sm py-3 pl-11 pr-4 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                required
                type="email"
                placeholder="name@example.com"
                className="w-full bg-surface border border-border rounded-sm py-3 pl-11 pr-4 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Age</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  required
                  type="number"
                  placeholder="20"
                  className="w-full bg-surface border border-border rounded-sm py-3 pl-11 pr-4 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-sm py-3 pl-11 pr-4 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="primary-btn w-full flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/10"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-8 text-text-muted text-xs font-medium">
          Already a scholar?{" "}
          <Link href="/auth/login" className="text-primary hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
