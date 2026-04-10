"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    if (result?.error) {
      if (result.error.includes("EMAIL_NOT_CONFIRMED")) {
        setError("Email not confirmed. Please check your inbox or disable email verification in Supabase.");
      } else {
        setError("Invalid email or password");
      }
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6 font-sans">
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
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-text-muted text-sm font-medium">Continue your knowledge pulse.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-sm bg-error/5 border border-error text-error text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Password</label>
              <Link href="#" className="text-[10px] font-bold text-primary hover:underline">Forgot?</Link>
            </div>
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

          <button
            disabled={loading}
            type="submit"
            className="primary-btn w-full flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/10"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-text-muted text-xs font-medium">
          New to the platform?{" "}
          <Link href="/auth/signup" className="text-primary hover:underline font-bold">
            Join Now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
