"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge } from "../../../components/ui";
import PromptWizardModal from "../../../components/prompt-wizard-modal";
import PromptCard from "../../../components/prompt-card";
import {
  Search,
  Plus,
  Play,
  Brain,
  Clock,
  RefreshCw,
  FileText,
  Sparkles,
} from "lucide-react";
import { getAgenticPrompts, AgenticPrompt, searchAgenticPrompts } from "../../../lib/api";

export default function AgentsPage() {
  const { user } = useAuth();

  const [prompts, setPrompts] = useState<AgenticPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true); // only for initial load
  const [isSearching, setIsSearching] = useState(false); // subtle indicator, no list unmount
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AgenticPrompt | null>(null);
  const initialLoadDone = useRef(false);

  const loadPrompts = useCallback(async (showFullSpinner = false) => {
    if (showFullSpinner) setIsLoading(true);
    setIsSearching(true);
    setError("");
    try {
      const data = await getAgenticPrompts();
      setPrompts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load prompts");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, []);

  // Initial load — runs once
  useEffect(() => {
    if (user && !initialLoadDone.current) {
      initialLoadDone.current = true;
      loadPrompts(true);
    }
  }, [user, loadPrompts]);

  // Search debounce — skip on mount
  useEffect(() => {
    if (!initialLoadDone.current) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (!searchQuery.trim()) {
          const data = await getAgenticPrompts();
          setPrompts(data);
        } else {
          const results = await searchAgenticPrompts(searchQuery);
          setPrompts(results);
        }
      } catch (err: any) {
        setError(err.message || "Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCreateSuccess = (newPrompt: AgenticPrompt) => {
    setPrompts((prev) => [newPrompt, ...prev]);
  };

  const handleDelete = (id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEdit = (prompt: AgenticPrompt) => {
    setEditingPrompt(prompt);
    setShowWizard(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">Autonomous AI</Badge>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Agentic Tools</h1>
        <p className="text-white/40">Create and manage autonomous AI agent prompts.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs text-white/40">Total Prompts</span>
          </div>
          <p className="text-2xl font-bold">{prompts.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Play className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs text-white/40">Active</span>
          </div>
          <p className="text-2xl font-bold">{prompts.filter(p => p.is_active).length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Brain className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-white/40">Categories</span>
          </div>
          <p className="text-2xl font-bold">{new Set(prompts.map(p => p.purpose)).size}</p>
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

      {/* Search and Create */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50"
          />
          {/* Subtle search indicator — no flicker */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadPrompts(false)}
            className="px-3"
          >
            <RefreshCw className={`w-4 h-4 ${isSearching ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => { setEditingPrompt(null); setShowWizard(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Prompt
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Prompts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchQuery.trim() ? "No results found" : "No prompts yet"}
            </h3>
            <p className="text-white/40 mb-6">
              {searchQuery.trim()
                ? "Try a different search term."
                : "Create your first agentic prompt to get started."}
            </p>
            {!searchQuery.trim() && (
              <Button onClick={() => setShowWizard(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Prompt
              </Button>
            )}
          </div>
        ) : (
          prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Info Section */}
      <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/20">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">How Agentic Prompts Work</h3>
            <p className="text-white/60 text-sm mb-4">
              Agentic prompts are specialized instructions for AI agents. Each prompt defines what input the agent receives,
              what output it should produce, and how it should process the task. These prompts are stored in the database
              and can be retrieved by your autonomous AI system.
            </p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-white/40">Input: What the agent receives</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="text-white/40">Output: What the agent produces</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-white/40">Purpose: Why it exists</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Wizard Modal */}
      <PromptWizardModal
        isOpen={showWizard}
        onClose={() => { setShowWizard(false); setEditingPrompt(null); }}
        onSuccess={(prompt) => {
          if (editingPrompt) {
            setPrompts((prev) => prev.map(p => p.id === prompt.id ? prompt : p));
          } else {
            handleCreateSuccess(prompt);
          }
        }}
      />
    </div>
  );
}
