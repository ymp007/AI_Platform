"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge, ProfileDropdown } from "../../../components/ui";
import {
  Bot,
  Search,
  Plus,
  Play,
  Pause,
  Trash2,
  Settings,
  ChevronRight,
  Home,
  Sparkles,
  Cpu,
  Brain,
  Zap,
  Clock,
  User,
  Upload,
  Layers,
  ArrowRight,
  MoreVertical,
  RefreshCw
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "paused" | "draft";
  tasks: number;
  lastRun: string;
}

const sampleAgents: Agent[] = [
  { id: "1", name: "Data Processor", type: "Data Processing", status: "active", tasks: 124, lastRun: "2 min ago" },
  { id: "2", name: "Content Writer", type: "Content Generation", status: "active", tasks: 89, lastRun: "15 min ago" },
  { id: "3", name: "Research Assistant", type: "Research", status: "paused", tasks: 45, lastRun: "1 hour ago" },
  { id: "4", name: "Code Reviewer", type: "Development", status: "draft", tasks: 0, lastRun: "Never" },
];

const agentTypes = [
  { id: "data", name: "Data Processing", icon: Cpu, color: "from-blue-500 to-cyan-500" },
  { id: "content", name: "Content Generation", icon: Zap, color: "from-purple-500 to-pink-500" },
  { id: "research", name: "Research", icon: Brain, color: "from-amber-500 to-orange-500" },
  { id: "code", name: "Development", icon: Layers, color: "from-green-500 to-emerald-500" },
];

export default function AgentsPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState(sampleAgents);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const toggleStatus = (id: string) => {
    setAgents(agents.map(agent => {
      if (agent.id === id) {
        return { ...agent, status: agent.status === "active" ? "paused" : "active" };
      }
      return agent;
    }));
  };

  const deleteAgent = (id: string) => {
    setAgents(agents.filter(agent => agent.id !== id));
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0066ff]/20 border-t-[#0066ff] rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <Sidebar activeTool="agents" />

      <main className="flex-1 overflow-y-auto">
        <Header user={user} logout={logout} />

        <div className="p-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Autonomous AI</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Agentic Tools</h1>
            <p className="text-white/40">Create and manage autonomous AI agents for various tasks.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs text-white/40">Total Agents</span>
              </div>
              <p className="text-2xl font-bold">{agents.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Play className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-white/40">Active</span>
              </div>
              <p className="text-2xl font-bold">{agents.filter(a => a.status === "active").length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Brain className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-white/40">Tasks Completed</span>
              </div>
              <p className="text-2xl font-bold">{agents.reduce((acc, a) => acc + a.tasks, 0)}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs text-white/40">Avg. Runtime</span>
              </div>
              <p className="text-2xl font-bold">4.2s</p>
            </Card>
          </div>

          {/* Create Agent Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white/80">Your Agents</h2>
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </div>

          {/* Agents List */}
          <div className="space-y-4">
            <AnimatePresence>
              {agents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Bot className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-white">{agent.name}</h3>
                        <StatusBadge status={agent.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                        <span>{agent.type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>{agent.tasks} tasks</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>Last run: {agent.lastRun}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(agent.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        agent.status === "active"
                          ? "text-amber-400 hover:bg-amber-500/10"
                          : "text-green-400 hover:bg-green-500/10"
                      }`}
                    >
                      {agent.status === "active" ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-colors">
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Agent Types */}
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white/80 mb-4">Agent Types</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.id}
                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{type.name}</h3>
                    <p className="text-xs text-white/30">Create a new {type.name.toLowerCase()} agent</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 mx-4 rounded-3xl bg-[#0a0a0b] border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Create New Agent</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {agentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedType === type.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <Icon className={`w-8 h-8 mb-2 ${selectedType === type.id ? "text-purple-400" : "text-white/40"}`} />
                      <p className="text-sm font-medium text-white">{type.name}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={!selectedType}>
                  Create Agent
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Agent["status"] }) {
  const styles = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    draft: "bg-white/5 text-white/40 border-white/10",
  };

  const labels = { active: "Active", paused: "Paused", draft: "Draft" };

  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status]}`}>{labels[status]}</span>;
}

function Sidebar({ activeTool }: { activeTool: string }) {
  const router = useRouter();
  
  const navItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/home" },
    { id: "rag", label: "Document RAG", icon: Layers, href: "/home/rag" },
    { id: "agents", label: "Agentic Tools", icon: Bot, href: "/home/agents" },
    { id: "inventory", label: "AI Inventory", icon: Cpu, href: "/home/inventory" },
    { id: "files", label: "File Processing", icon: Upload, href: "/home/files" },
    { id: "api", label: "API Management", icon: Settings, href: "/home/api" },
    { id: "employees", label: "Employees", icon: User, href: "/home/employees" },
  ];

  return (
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
    </aside>
  );
}

function Header({ user, logout }: { user: any; logout: () => void }) {
  return (
    <header className="sticky top-0 z-10 px-6 py-4 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between">
      <div className="text-sm text-white/40">
        <span className="text-white/60">Agentic Tools</span>
      </div>
      <ProfileDropdown user={user} logout={logout} />
    </header>
  );
}
