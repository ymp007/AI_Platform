"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge } from "../../../components/ui";
import {
  FileText,
  Upload,
  File,
  Trash2,
  Copy,
  Check,
  Zap,
  X,
  Loader2,
  ArrowRight,
  Layers,
  CheckSquare,
  Square,
  GitBranch,
  GitFork,
  ListOrdered,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  getRAGDocuments,
  uploadRAGDocument,
  deleteRAGDocument,
  getAgenticPrompts,
  createExecutionPlan,
  executeOrchestration,
  RAGDocument,
  AgenticPrompt,
  OrchestrationResponse,
  ExecutionPlan,
} from "../../../lib/api";

export default function RAGPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadDocuments();
    }
  }, [authLoading, user]);

  const loadDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const docs = await getRAGDocuments();
      setDocuments(docs);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    try {
      setIsUploading(true);
      setError(null);
      await uploadRAGDocument(uploadedFile);
      setUploadedFile(null);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteRAGDocument(docId);
      setSelectedDocs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || "Failed to delete document");
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleOrchestrate = async () => {
    if (!query.trim()) return;
    setIsExecuting(true);
    setError(null);
    setOrchestrationResult(null);
    setShowPipeline(true);

    try {
      const docIds = selectedDocs.size > 0 ? Array.from(selectedDocs) : undefined;
      
      // First, get the execution plan
      const plan = await createExecutionPlan({
        query,
        document_ids: docIds,
      });
      setExecutionPlan(plan);
      
      // Then execute the orchestration
      const result = await executeOrchestration({
        query,
        document_ids: docIds,
      });
      setOrchestrationResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to orchestrate request");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFlowIcon = (flowType: string) => {
    switch (flowType) {
      case "sequential":
        return <ListOrdered className="w-4 h-4" />;
      case "parallel":
        return <GitFork className="w-4 h-4" />;
      case "hybrid":
        return <Cpu className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const getFlowLabel = (flowType: string) => {
    switch (flowType) {
      case "sequential":
        return "Sequential";
      case "parallel":
        return "Parallel (Fork-Join)";
      case "hybrid":
        return "Hybrid";
      default:
        return flowType;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">AI Powered</Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Agent Orchestrator</h1>
        <p className="text-white/40">
          AI automatically selects agents and decides execution flow (sequential, parallel, or hybrid)
        </p>
      </motion.div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Document Selection */}
      <Card className="p-4 mb-6 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Select Documents (for RAG context)</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {documents.length === 0 ? (
            <span className="text-xs text-white/30">No documents indexed</span>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => toggleDocSelection(doc.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                  selectedDocs.has(doc.id)
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-white/[0.03] text-white/60 border border-white/10 hover:border-white/20"
                }`}
              >
                {selectedDocs.has(doc.id) ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                {doc.name}
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Query Input */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOrchestrate()}
              placeholder="Enter your query - AI will auto-select agents and decide execution flow..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
            />
          </div>
          <Button 
            onClick={handleOrchestrate} 
            disabled={isExecuting || !query.trim()} 
            className="bg-purple-600 hover:bg-purple-700 px-8"
          >
            {isExecuting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Orchestrate
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* AI Decision Display */}
      <AnimatePresence>
        {showPipeline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">AI Execution Plan</span>
                </div>
                {(orchestrationResult?.execution_plan || executionPlan) && (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs ${
                    (orchestrationResult?.execution_plan || executionPlan)?.flow_type === 'parallel' ? 'bg-blue-500/20 text-blue-400' :
                    (orchestrationResult?.execution_plan || executionPlan)?.flow_type === 'hybrid' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {getFlowIcon((orchestrationResult?.execution_plan || executionPlan)?.flow_type || 'sequential')}
                    {getFlowLabel((orchestrationResult?.execution_plan || executionPlan)?.flow_type || 'sequential')}
                  </div>
                )}
              </div>

              {orchestrationResult || executionPlan ? (
                <>
                  <p className="text-xs text-white/60 mb-4">
                    {(orchestrationResult?.execution_plan || executionPlan)?.description}
                  </p>
                  
                  {/* Flow Visualization */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(orchestrationResult?.execution_plan || executionPlan)?.nodes.map((node: any, idx: number) => {
                      const nodes = (orchestrationResult?.execution_plan || executionPlan)?.nodes || [];
                      const isParallel = node.parallel_group && 
                        nodes.filter((n: any) => n.parallel_group === node.parallel_group).length > 1;
                      const isFirstInParallel = isParallel && 
                        nodes.findIndex((n: any) => n.parallel_group === node.parallel_group) === idx;
                      
                      return (
                        <div key={node.id} className="flex items-center gap-2">
                          {idx > 0 && !isFirstInParallel && (
                            <ArrowRight className="w-4 h-4 text-white/30" />
                          )}
                          {idx > 0 && isFirstInParallel && (
                            <GitBranch className="w-4 h-4 text-blue-400" />
                          )}
                          <div className={`px-3 py-2 rounded-lg text-xs border ${
                            node.agent_type === 'rag' 
                              ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                              : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                          }`}>
                            {node.agent_name}
                          </div>
                          {isParallel && idx === nodes.filter((n: any) => n.parallel_group === node.parallel_group).length - 1 && (
                            <GitBranch className="w-4 h-4 text-green-400 rotate-180" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : isExecuting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-xs text-white/40">AI is analyzing query and planning execution...</span>
                </div>
              ) : null}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {orchestrationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <Card className="p-6 border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Execution Complete</h3>
                  <p className="text-xs text-white/30">
                    {orchestrationResult.execution_plan.nodes.length} agents executed
                  </p>
                </div>
              </div>

              {/* Pipeline Status */}
              <div className="space-y-3 mb-6">
                {orchestrationResult.pipeline_status.map((status, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-purple-400 font-medium">{status.agent_name}</span>
                      {status.parallel_group && (
                        <span className="text-xs text-blue-400">(parallel: {status.parallel_group})</span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 whitespace-pre-line line-clamp-2">{status.output}</p>
                  </div>
                ))}
              </div>

              {/* Final Output */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-white">Final Output</h4>
                  <Button 
                    variant="outline" 
                    className="text-xs" 
                    onClick={() => handleCopy(orchestrationResult.final_output, "final")}
                  >
                    {copiedId === "final" ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copiedId === "final" ? "Copied" : "Copy"}
                  </Button>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                  <p className="text-white/80 whitespace-pre-line leading-relaxed">{orchestrationResult.final_output}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Upload Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white/80">Indexed Documents</h2>
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 cursor-pointer hover:bg-purple-500/20 transition-colors">
          <Upload size={16} />
          <span className="text-sm font-medium">Upload Document</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {uploadedFile && (
        <Card className="p-4 mb-4 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-purple-400" />
              <div>
                <p className="font-medium text-white">{uploadedFile.name}</p>
                <p className="text-xs text-white/30">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setUploadedFile(null)} className="p-2 text-white/40 hover:text-white">
                <X size={18} />
              </button>
              <Button onClick={handleUpload} disabled={isUploading} className="text-sm">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Index Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isLoadingDocs ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No documents indexed yet. Upload a document to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/[0.03]">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-purple-400 transition-colors">{doc.name}</p>
                  <div className="flex items-center gap-3 text-xs text-white/30">
                    <span>{doc.chunk_count || 0} chunks</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-500/10 text-green-400 border-green-500/20">
                  Indexed
                </span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
