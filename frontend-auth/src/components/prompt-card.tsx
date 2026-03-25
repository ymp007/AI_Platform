"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Edit,
  Trash2,
  Copy,
  Check,
  X,
} from "lucide-react";
import { Button } from "./ui";
import { AgenticPrompt, deleteAgenticPrompt } from "../lib/api";

interface PromptCardProps {
  prompt: AgenticPrompt;
  onEdit: (prompt: AgenticPrompt) => void;
  onDelete: (id: string) => void;
}

export default function PromptCard({ prompt, onEdit, onDelete }: PromptCardProps) {
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.prompt_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this prompt?")) {
      setIsDeleting(true);
      try {
        await deleteAgenticPrompt(prompt.id);
        onDelete(prompt.id);
      } catch (err) {
        console.error("Failed to delete:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <div
        onClick={() => setShowContent(true)}
        className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <FileText className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-white">{prompt.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border-green-500/20">
                Active
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
              <span>{prompt.purpose || "No purpose specified"}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>{formatDate(prompt.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(prompt)}
            className="p-2 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg text-white/40 hover:text-green-400 hover:bg-green-500/10 transition-colors"
            title="Copy prompt"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Content Modal */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowContent(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl mx-4 max-h-[80vh] rounded-3xl bg-[#0a0a0b] border border-white/10 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div>
                  <h2 className="text-lg font-bold text-white">{prompt.name}</h2>
                  <p className="text-xs text-white/40">{prompt.purpose}</p>
                </div>
                <button
                  onClick={() => setShowContent(false)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1 uppercase tracking-wider">Input</label>
                    <p className="text-sm text-white/60">{prompt.input_description || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1 uppercase tracking-wider">Output</label>
                    <p className="text-sm text-white/60">{prompt.output_description || "Not specified"}</p>
                  </div>
                  {prompt.notes && (
                    <div className="col-span-2">
                      <label className="block text-xs text-white/40 mb-1 uppercase tracking-wider">Notes</label>
                      <p className="text-sm text-white/60">{prompt.notes}</p>
                    </div>
                  )}
                </div>
                
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Prompt Content</label>
                <pre className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 overflow-x-auto whitespace-pre-wrap font-mono">
                  {prompt.prompt_content}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
                <Button variant="outline" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={() => { setShowContent(false); onEdit(prompt); }} className="bg-purple-600 hover:bg-purple-700">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}