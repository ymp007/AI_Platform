"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/auth-context";
import { ProfileDropdown } from "../../components/ui";
import {
  FileText,
  Bot,
  Package,
  FileUp,
  Plug,
  Users,
  Home,
  Settings,
  Sparkles,
} from "lucide-react";

const navItems = [
  { id: "home", label: "Dashboard", icon: Home, href: "/home" },
  { id: "rag", label: "Document RAG", icon: FileText, href: "/home/rag" },
  { id: "agents", label: "Agentic Tools", icon: Bot, href: "/home/agents" },
  { id: "inventory", label: "AI Inventory", icon: Package, href: "/home/inventory" },
  { id: "files", label: "File Processing", icon: FileUp, href: "/home/files" },
  { id: "api", label: "API Management", icon: Plug, href: "/home/api" },
  { id: "employees", label: "Employees", icon: Users, href: "/home/employees" },
];

const pageTitles: Record<string, string> = {
  home: "Dashboard",
  rag: "Document RAG",
  agents: "Agentic Tools",
  inventory: "AI Inventory",
  files: "File Processing",
  api: "API Management",
  employees: "Employee Management",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0066ff]/20 border-t-[#0066ff] rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Loading ITSP...</p>
        </div>
      </div>
    );
  }

  const activeSegment = pathname.split("/").pop() || "home";
  const activeTool = activeSegment === "home" && pathname === "/home" ? "home" : activeSegment;
  const pageTitle = pageTitles[activeTool] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      {/* Sidebar — persists across all /home/* navigations */}
      <aside className="hidden md:flex flex-col w-72 border-r border-white/[0.05] bg-white/[0.02]">
        <div className="p-6 border-b border-white/[0.05]">
          <Link href="/home" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0066ff] to-[#00d4ff] rounded-xl flex items-center justify-center shadow-lg shadow-[#0066ff]/30">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">ITSP</span>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">AI platform</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTool === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative ${
                  isActive
                    ? "bg-[#0066ff]/10 text-[#0066ff]"
                    : "text-white/40 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                {isActive && <div className="absolute left-0 w-1 h-8 bg-[#0066ff] rounded-r-full" />}
                {(() => {
                  const Icon = item.icon;
                  return <Icon size={18} />;
                })()}
                <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.05] space-y-2">
          <button className="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.03] transition-all w-full">
            <Settings size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        {/* Header — persists across all /home/* navigations */}
        <header className="sticky top-0 z-10 px-6 py-4 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between">
          <div className="text-sm text-white/40">
            <span className="text-white/60">{pageTitle}</span>
          </div>
          <ProfileDropdown user={user} logout={logout} />
        </header>

        {/* Page content — only this part re-renders on navigation */}
        {children}
      </main>
    </div>
  );
}
