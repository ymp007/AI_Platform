"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge, ProfileDropdown } from "../../../components/ui";
import {
  Package,
  Search,
  Plus,
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
  Bot,
  ArrowRight,
  MoreVertical,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Plug
} from "lucide-react";

interface AIAsset {
  id: string;
  name: string;
  provider: string;
  type: "model" | "api" | "service";
  status: "active" | "inactive" | "deprecated";
  usage: number;
  cost: number;
  lastUsed: string;
}

const sampleAssets: AIAsset[] = [
  { id: "1", name: "GPT-4", provider: "OpenAI", type: "model", status: "active", usage: 12500, cost: 245.50, lastUsed: "Just now" },
  { id: "2", name: "Claude 3.5", provider: "Anthropic", type: "model", status: "active", usage: 8200, cost: 180.00, lastUsed: "5 min ago" },
  { id: "3", name: "Gemini Pro", provider: "Google", type: "model", status: "active", usage: 5600, cost: 95.20, lastUsed: "1 hour ago" },
  { id: "4", name: "DALL-E 3", provider: "OpenAI", type: "model", status: "active", usage: 890, cost: 120.00, lastUsed: "2 hours ago" },
  { id: "5", name: "Whisper API", provider: "OpenAI", type: "api", status: "active", usage: 3400, cost: 45.00, lastUsed: "1 day ago" },
  { id: "6", name: "Embedding ADA", provider: "OpenAI", type: "model", status: "inactive", usage: 0, cost: 0, lastUsed: "2 weeks ago" },
];

const providers = [...new Set(sampleAssets.map(a => a.provider))];
const totalCost = sampleAssets.reduce((acc, a) => acc + a.cost, 0);
const totalUsage = sampleAssets.reduce((acc, a) => acc + a.usage, 0);

export default function InventoryPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState(sampleAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = !selectedProvider || asset.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteAsset = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id));
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
      <Sidebar activeTool="inventory" />

      <main className="flex-1 overflow-y-auto">
        <Header user={user} logout={logout} />

        <div className="p-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">Resource Tracking</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">AI Inventory</h1>
            <p className="text-white/40">Track and manage your AI models, APIs, and resources.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Package className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs text-white/40">Total Assets</span>
              </div>
              <p className="text-2xl font-bold">{assets.length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-white/40">Active Assets</span>
              </div>
              <p className="text-2xl font-bold">{assets.filter(a => a.status === "active").length}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Brain className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-white/40">Total Requests</span>
              </div>
              <p className="text-2xl font-bold">{totalUsage.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs text-white/40">Total Cost</span>
              </div>
              <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProvider(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !selectedProvider ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                }`}
              >
                All
              </button>
              {providers.map(provider => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedProvider === provider ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {provider}
                </button>
              ))}
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </div>

          {/* Assets List */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      {asset.type === "model" ? <Brain className="w-6 h-6 text-amber-400" /> : <Cpu className="w-6 h-6 text-amber-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-white">{asset.name}</h3>
                        <StatusBadge status={asset.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                        <span>{asset.provider}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="uppercase">{asset.type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>Last used: {asset.lastUsed}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-white/30 mb-1">Usage</p>
                      <p className="font-bold text-white">{asset.usage.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/30 mb-1">Cost</p>
                      <p className="font-bold text-white">${asset.cost.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-colors">
                        <ExternalLink size={18} />
                      </button>
                      <button className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-colors">
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No assets found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: AIAsset["status"] }) {
  const styles = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    inactive: "bg-white/5 text-white/40 border-white/10",
    deprecated: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const labels = { active: "Active", inactive: "Inactive", deprecated: "Deprecated" };

  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status]}`}>{labels[status]}</span>;
}

function Sidebar({ activeTool }: { activeTool: string }) {
  const router = useRouter();
  
  const navItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/home" },
    { id: "rag", label: "Document RAG", icon: Layers, href: "/home/rag" },
    { id: "agents", label: "Agentic Tools", icon: Bot, href: "/home/agents" },
    { id: "inventory", label: "AI Inventory", icon: Package, href: "/home/inventory" },
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
        <span className="text-white/60">AI Inventory</span>
      </div>
      <ProfileDropdown user={user} logout={logout} />
    </header>
  );
}
