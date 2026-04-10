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
    { name: "AI Tutor", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Quizzes", href: "/dashboard/quizzes", icon: Target },
    { name: "Library", href: "/dashboard/video-library", icon: Video },
  ];

  const teacherNavItems = [
    { name: "Tracking", href: "/dashboard/teacher", icon: LayoutDashboard },
    { name: "AI Tutor", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Library", href: "/dashboard/video-library", icon: Video },
  ];

  const navItems = userRole === "teacher" ? teacherNavItems : studentNavItems;

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/10">
      {/* Unique Floating Profile Hub (Top Right) */}
      <div className="fixed top-8 right-8 z-50">
        <div className="floating-pill flex items-center gap-3 pr-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 hover:bg-error/10 hover:text-error rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="pb-32">
        {children}
      </main>

      {/* Unique Bottom Nav Pill */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <motion.nav 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="floating-pill flex items-center gap-1 p-1.5"
        >
          <div className="px-4 py-1.5 mr-2 border-r border-border hidden sm:flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold italic tracking-tighter">LearnSphere</span>
          </div>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-text-muted hover:text-text-main hover:bg-surface"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className={cn("text-xs font-bold whitespace-nowrap", !isActive && "hidden md:inline")}>{item.name}</span>
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
}
