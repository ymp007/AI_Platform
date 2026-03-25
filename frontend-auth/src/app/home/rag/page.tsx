"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge } from "../../../components/ui";
import {
  FileText,
  Search,
  Upload,
  File,
  Trash2,
  Copy,
  Check,
  Send,
  Bot,
  RefreshCw,
  CheckSquare,
  Square,
  Loader2,
  ArrowRight,
  Layers,
  Zap,
  X,
  Plus,
  Play,
  Settings,
  ChevronDown,
} from "lucide-react";
import {
  getRAGDocuments,
  uploadRAGDocument,
  deleteRAGDocument,
  queryRAG,
  getAgenticPrompts,
  orchestrateRequest,
  RAGDocument,
  RAGQueryResponse,
  AgenticPrompt,
  OrchestrationResponse,
} from "../../../lib/api";

export default function RAGPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [agenticPrompts, setAgenticPrompts] = useState<AgenticPrompt[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [orchestratorMode, setOrchestratorMode] = useState<"simple" | "orchestrate">("simple");

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<RAGQueryResponse | null>(null);
  const [orchestrationResult, setOrchestrationResult] = useState<OrchestrationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadDocuments();
      loadAgenticPrompts();
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

  const loadAgenticPrompts = async () => {
    try {
      const prompts = await getAgenticPrompts();
      setAgenticPrompts(prompts);
    } catch (err: any) {
      console.error("Failed to load agentic prompts:", err);
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

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const handleSimpleSearch = async () => {
    if (!query.trim()) return;
    setOrchestrationResult(null);
    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const docIds = selectedDocs.size > 0 ? Array.from(selectedDocs) : undefined;
      const result = await queryRAG(query, docIds);
      setSearchResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to process query");
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrchestrate = async () => {
    if (!query.trim()) return;
    setSearchResult(null);
    setIsSearching(true);
    setError(null);
    setOrchestrationResult(null);

    try {
      const docIds = selectedDocs.size > 0 ? Array.from(selectedDocs) : undefined;
      const agentIds = selectedAgents.size > 0 ? Array.from(selectedAgents) : undefined;
      const result = await orchestrateRequest({
        query,
        document_ids: docIds,
        agent_prompt_ids: agentIds,
        mode: selectedAgents.size > 0 ? "manual" : "auto",
      });
      setOrchestrationResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to orchestrate request");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearch = () => {
    if (orchestratorMode === "orchestrate") {
      handleOrchestrate();
    } else {
      handleSimpleSearch();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">AI Powered</Badge>
          <div className="flex gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => { setOrchestratorMode("simple"); setSearchResult(null); setOrchestrationResult(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                orchestratorMode === "simple"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white"
              }`}
            >
              Simple Search
            </button>
            <button
              onClick={() => setOrchestratorMode("orchestrate")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                orchestratorMode === "orchestrate"
                  ? "bg-purple-500/20 text-purple-400"
                  : "text-white/40 hover:text-white"
              }`}
            >
              <Zap size={14} />
              Orchestrator
            </button>
          </div>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Document RAG Tool</h1>
        <p className="text-white/40">
          {orchestratorMode === "simple"
            ? "Ask questions about your documents using AI-powered retrieval."
            : "Orchestrate multiple agents to process your documents with AI."}
        </p>
      </motion.div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Agent Selection Panel - Only in Orchestrator Mode */}
      <AnimatePresence>
        {orchestratorMode === "orchestrate" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Agent Pipeline</span>
                <span className="text-xs text-white/40">(Select agents to run in sequence)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Document Selection */}
                <div>
                  <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Documents (RAG)</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
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
                </div>

                {/* Agentic Prompts Selection */}
                <div>
                  <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Agentic Tools</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {agenticPrompts.length === 0 ? (
                      <span className="text-xs text-white/30">No agents available</span>
                    ) : (
                      agenticPrompts.map((prompt) => (
                        <button
                          key={prompt.id}
                          onClick={() => toggleAgentSelection(prompt.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                            selectedAgents.has(prompt.id)
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              : "bg-white/[0.03] text-white/60 border border-white/10 hover:border-white/20"
                          }`}
                        >
                          {selectedAgents.has(prompt.id) ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                          {prompt.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {selectedAgents.size > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2">Pipeline Order:</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedDocs.size > 0 && (
                      <>
                        <span className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs">RAG Search</span>
                        <ArrowRight className="w-4 h-4 text-white/20" />
                      </>
                    )}
                    {Array.from(selectedAgents).map((agentId, idx) => {
                      const agent = agenticPrompts.find(a => a.id === agentId);
                      return (
                        <span key={agentId} className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs">
                          {agent?.name || `Agent ${idx + 1}`}
                        </span>
                      );
                    })}
                    {selectedAgents.size > 1 && (
                      <span className="text-xs text-white/30 ml-2">(Sequential execution)</span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={orchestratorMode === "orchestrate" 
                ? "Ask and orchestrate agents to process..." 
                : "Ask a question about your documents..."}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || !query.trim()} 
            className={orchestratorMode === "orchestrate" ? "bg-purple-600 hover:bg-purple-700 px-8" : "px-8"}
          >
            {isSearching ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {orchestratorMode === "orchestrate" ? <Zap className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                {orchestratorMode === "orchestrate" ? "Orchestrate" : "Search"}
              </>
            )}
          </Button>
        </div>

        {documents.length > 0 && orchestratorMode === "simple" && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/40">Filter by document:</span>
              <div className="flex gap-2">
                <button onClick={() => setSelectedDocs(new Set(documents.map(d => d.id)))} className="text-xs text-blue-400 hover:text-blue-300">
                  Select All
                </button>
                <span className="text-white/20">|</span>
                <button onClick={() => setSelectedDocs(new Set())} className="text-xs text-blue-400 hover:text-blue-300">
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => toggleDocSelection(doc.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedDocs.has(doc.id)
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-white/[0.03] text-white/60 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {selectedDocs.has(doc.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {doc.name}
                </button>
              ))}
            </div>
            {selectedDocs.size > 0 && (
              <p className="mt-2 text-xs text-white/30">
                Searching in {selectedDocs.size} of {documents.length} documents
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Results Display */}
      <AnimatePresence>
        {/* Orchestration Results */}
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
                  <h3 className="font-bold text-white">Orchestration Results</h3>
                  <p className="text-xs text-white/30">
                    Executed: {orchestrationResult.selected_agents.join(" → ")}
                  </p>
                </div>
              </div>

              {/* Step by Step Results */}
              <div className="space-y-4 mb-6">
                {orchestrationResult.results.map((result, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-purple-400">{result.agent_name}</span>
                      <span className="text-xs text-white/30">({result.agent_type})</span>
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-line pl-8">{result.output}</p>
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

        {/* Simple Search Results */}
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <Card className="p-6 border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Response</h3>
                  <p className="text-xs text-white/30">Based on retrieved chunks</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-white/80 whitespace-pre-line leading-relaxed">{searchResult.answer}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="text-xs" onClick={() => handleCopy(searchResult.answer, "result")}>
                  {copiedId === "result" ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedId === "result" ? "Copied" : "Copy"}
                </Button>
              </div>

              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-medium text-white/60 mb-3">Source Chunks</h4>
                  <div className="space-y-2">
                    {searchResult.sources.map((source, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-blue-400">{source.document_name}</span>
                        </div>
                        <p className="text-xs text-white/60 line-clamp-2">{source.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Upload Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white/80">Indexed Documents</h2>
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 cursor-pointer hover:bg-blue-500/20 transition-colors">
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
        <Card className="p-4 mb-4 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-blue-400" />
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
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-blue-400 transition-colors">{doc.name}</p>
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
