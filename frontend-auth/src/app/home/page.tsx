"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/auth-context";
import { Card, Badge } from "../../components/ui";
import {
  FileText,
  Bot,
  Package,
  FileUp,
  Plug,
  Users,
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

export default function HomePage() {
  const { user } = useAuth();

  return (
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
          <span className="bg-gradient-to-r from-[#0066ff] to-[#00d4ff] bg-clip-text text-transparent">{user?.name || "Operator"}</span>
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
  );
}

function ToolCard({ tool, index }: { tool: typeof tools[0]; index: number }) {
  const router = useRouter();
  const Icon = tool.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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
