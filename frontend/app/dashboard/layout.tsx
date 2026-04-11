"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  GraduationCap, 
  User, 
  LogOut,
  BrainCircuit,
  Sparkles,
  Video,
  Target
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion } from "framer-motion";
import FloatingAssistant from "@/components/FloatingAssistant";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "student";

  const studentNavItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Quizzes", href: "/dashboard/quizzes", icon: Target },
    { name: "Smart Library", href: "/dashboard/video-library", icon: Video },
    { name: "Courses", href: "/dashboard/courses", icon: GraduationCap },
    { name: "Arena", href: "/dashboard/games", icon: Sparkles },
    { name: "Counseling", href: "/dashboard/counseling", icon: Sparkles },
  ];

  const teacherNavItems = [
    { name: "Tracking", href: "/dashboard/teacher", icon: LayoutDashboard },
    { name: "Smart Library", href: "/dashboard/video-library", icon: Video },
  ];

  const navItems = userRole === "teacher" ? teacherNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-transparent selection:bg-primary/30 selection:text-primary-foreground">
      {/* Unique Floating Profile Hub (Top Right) */}
      <div className="fixed top-8 right-8 z-50">
        <div className="floating-pill flex items-center gap-4 pr-2 hover:bg-white/80 transition-all duration-300 shadow-2xl shadow-primary/10">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <User className="w-5 h-5 text-primary" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2.5 hover:bg-error/10 hover:text-error rounded-full transition-all duration-300 hover:scale-110"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="pb-32 pt-12">
        {children}
      </main>

      {/* Unique Bottom Nav Pill */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <motion.nav 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="floating-pill flex items-center gap-1.5 p-2 bg-white/40 backdrop-blur-2xl border-white/60 shadow-[0_20px_60px_rgba(147,51,234,0.15)]"
        >
          <div className="px-6 py-2 mr-3 border-r border-black/5 hidden lg:flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary fill-current" />
            <span className="text-sm font-black italic tracking-tighter text-text-main">LearnSphere</span>
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-500 relative group",
                  isActive 
                    ? "bg-primary text-white shadow-xl shadow-primary/40" 
                    : "text-text-muted hover:text-text-main hover:bg-white/50"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive && "animate-pulse")} />
                <span className={cn("text-xs font-bold tracking-wide whitespace-nowrap", !isActive && "hidden md:inline")}>{item.name}</span>
                {!isActive && (
                  <motion.div 
                    layoutId="nav-hover"
                    className="absolute inset-0 bg-white/40 rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                )}
              </Link>
            );
          })}
        </motion.nav>
      </div>
      {/* Floating Assistant */}
      <FloatingAssistant />
    </div>
  );
}
