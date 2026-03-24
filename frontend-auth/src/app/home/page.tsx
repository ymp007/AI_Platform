"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "../../context/auth-context";
import { Button, Card, Badge, ProfileDropdown } from "../../components/ui";
import {
  FileText,
  Bot,
  Package,
  FileUp,
  Plug,
  Users,
  Home,
  LogOut,
  Settings,
  Search,
  ChevronRight,
  Sparkles,
  Database,
  Cloud,
  Cpu,
  Activity
} from "lucide-react";

const tools = [
  {
    id: "rag",
    name: "Document RAG Tool",
    description: "AI-powered document question answering and knowledge retrieval",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "agents",
    name: "Agentic Tools",
    description: "Create and manage autonomous AI agents",
    icon: Bot,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    id: "inventory",
    name: "AI Inventory",
    description: "Track and manage AI models, APIs, and resources",
    icon: Package,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  {
    id: "files",
    name: "File Processing",
    description: "Upload, process, and transform documents",
    icon: FileUp,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    id: "api",
    name: "API Management",
    description: "Test, monitor, and manage API endpoints",
    icon: Plug,
    color: "from-red-500 to-rose-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    id: "employees",
    name: "Employee Management",
    description: "Manage workforce, roles, and permissions",
    icon: Users,
    color: "from-indigo-500 to-violet-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
];

const navItems = [
  { id: "home", label: "Dashboard", icon: Home, href: "/home" },
  { id: "rag", label: "Document RAG", icon: FileText, href: "/home/rag" },
  { id: "agents", label: "Agentic Tools", icon: Bot, href: "/home/agents" },
  { id: "inventory", label: "AI Inventory", icon: Package, href: "/home/inventory" },
  { id: "files", label: "File Processing", icon: FileUp, href: "/home/files" },
  { id: "api", label: "API Management", icon: Plug, href: "/home/api" },
  { id: "employees", label: "Employees", icon: Users, href: "/home/employees" },
];

export default function HomePage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTool, setActiveTool] = useState<string>("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const path = pathname.split("/").pop();
    if (path && path !== "home") {
      setActiveTool(path);
    }
  }, [pathname]);

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      {/* Animated Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="hidden md:flex flex-col border-r border-white/[0.05] bg-white/[0.02] relative z-20"
      >
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-6 z-30 w-6 h-6 bg-[#0066ff] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0055dd] transition-colors"
        >
          <ChevronRight className={`w-4 h-4 text-white transition-transform ${!sidebarOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-white/[0.05]">
          <Link href="/home" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0066ff] to-[#00d4ff] rounded-xl flex items-center justify-center shadow-lg shadow-[#0066ff]/30">
              <Sparkles className="text-white" size={20} />
            </div>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                <span className="text-lg font-bold tracking-tight">ITSP</span>
                <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">AI platform</span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTool === item.id || (item.id === "home" && pathname === "/home");
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveTool(item.id)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative group ${
                  isActive
                    ? "bg-[#0066ff]/10 text-[#0066ff]"
                    : "text-white/40 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-[#0066ff] rounded-r-full"
                  />
                )}
                {(() => {
                  const Icon = item.icon;
                  return <Icon size={18} className={isActive ? "text-[#0066ff]" : ""} />;
                })()}
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-bold uppercase tracking-wider"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/[0.05] space-y-2">
          <button className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.03] transition-all w-full ${!sidebarOpen ? "justify-center" : ""}`}>
            <Settings size={18} />
            {sidebarOpen && <span className="text-xs font-bold uppercase tracking-wider">Settings</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-10 px-6 py-4 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#0066ff] transition-colors" size={14} />
              <input
                type="text"
                placeholder="Search tools..."
                className="bg-white/[0.03] border border-white/[0.05] rounded-full pl-10 pr-4 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#0066ff]/50 focus:bg-white/[0.05] w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="h-8 w-[1px] bg-white/[0.1]" />
            <ProfileDropdown user={user} logout={logout} />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Badge className="mb-4">AI platform</Badge>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Welcome back, </span>
              <span className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] bg-clip-text text-transparent">{user.name || "Operator"}</span>
            </h1>
            <p className="text-white/40 text-sm max-w-xl">Select a tool from the sidebar or browse the available tools below to get started.</p>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
            <StatCard label="Active Tools" value="6" icon={<Cpu className="text-[#0066ff]" size={20} />} />
            <StatCard label="API Calls Today" value="1,234" icon={<Plug className="text-green-400" size={20} />} />
            <StatCard label="Documents" value="89" icon={<Database className="text-purple-400" size={20} />} />
            <StatCard label="System Status" value="Healthy" trend="Good" icon={<Activity className="text-green-400" size={20} />} />
          </div>

          {/* Tools Grid */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white/80 mb-4">Available Tools</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {tools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function ToolCard({ tool, index }: { tool: typeof tools[0]; index: number }) {
  const router = useRouter();
  const Icon = tool.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={`group relative p-6 rounded-3xl border ${tool.borderColor} ${tool.bgColor} backdrop-blur-xl cursor-pointer transition-all hover:shadow-2xl hover:shadow-[#0066ff]/10`}
      onClick={() => router.push(`/home/${tool.id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} shadow-lg`}>
          <Icon className="text-white" size={24} />
        </div>
        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
      </div>
      
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#0066ff] transition-colors">{tool.name}</h3>
      <p className="text-sm text-white/40 line-clamp-2">{tool.description}</p>
      
      <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-3xl bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </motion.div>
  );
}

function StatCard({ label, value, trend, icon }: { label: string; value: string; trend?: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-white/[0.03]">
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-green-400">{trend}</span>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <h3 className="text-xl font-bold tracking-tight">{value}</h3>
    </Card>
  );
}
