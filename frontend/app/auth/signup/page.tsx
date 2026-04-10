"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Calendar, Loader2, Sparkles, GraduationCap, School, Hash, BookOpen } from "lucide-react";
import axios from "axios";

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    age: "",
    role: "student",
    batch_code: "",
    batch_name: ""
  });
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
        className="bento-tile w-full max-w-lg p-10 bg-white shadow-2xl shadow-primary/5"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            LearnSphere AI
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Create Account</h1>
          <p className="text-text-muted text-sm font-medium">Select your role to get started.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-sm bg-error/5 border border-error text-error text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "student" })}
              className={`p-4 rounded-sm border-2 flex flex-col items-center gap-2 transition-all ${
                formData.role === "student" ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-text-muted"
              }`}
            >
              <GraduationCap className={`w-6 h-6 ${formData.role === "student" ? "text-primary" : "text-text-muted"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${formData.role === "student" ? "text-primary" : "text-text-muted"}`}>I'm a Student</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "teacher" })}
              className={`p-4 rounded-sm border-2 flex flex-col items-center gap-2 transition-all ${
                formData.role === "teacher" ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-text-muted"
              }`}
            >
              <School className={`w-6 h-6 ${formData.role === "teacher" ? "text-primary" : "text-text-muted"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${formData.role === "teacher" ? "text-primary" : "text-text-muted"}`}>I'm a Teacher</span>
            </button>
          </div>

          <div className="space-y-4">
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

            {/* Batch Logic */}
            <div className="space-y-4">
              {formData.role === "student" ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 italic flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Batch Code (Ask your teacher)
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. ALPHA-2026"
                      className="w-full bg-surface border border-border rounded-sm py-3 pl-11 pr-4 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium uppercase"
                      value={formData.batch_code}
                      onChange={(e) => setFormData({ ...formData, batch_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 italic flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Batch Name
                    </label>
                    <div className="relative">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        required
                        type="text"
                        placeholder="e.g. Physics Honors"
                        className="w-full bg-surface border border-border rounded-sm py-3 pl-11 pr-4 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium"
                        value={formData.batch_name}
                        onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1 italic flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Batch Code (Optional)
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="text"
                        placeholder="e.g. PHYS-101"
                        className="w-full bg-surface border border-border rounded-sm py-3 pl-11 pr-4 focus:border-primary focus:ring-0 transition-all outline-none text-sm font-medium uppercase"
                        value={formData.batch_code}
                        onChange={(e) => setFormData({ ...formData, batch_code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                </div>
              )}
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
          </div>

          <button
            disabled={loading}
            type="submit"
            className="primary-btn w-full flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/10 py-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
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
