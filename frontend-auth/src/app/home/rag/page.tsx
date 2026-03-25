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
} from "lucide-react";
import {
  getRAGDocuments,
  uploadRAGDocument,
  deleteRAGDocument,
  queryRAG,
  RAGDocument,
  RAGQueryResponse,
} from "../../../lib/api";

export default function RAGPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<RAGQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const selectAll = () => {
    setSelectedDocs(new Set(documents.map((d) => d.id)));
  };

  const selectNone = () => {
    setSelectedDocs(new Set());
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">AI Powered</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Document RAG Tool</h1>
            <p className="text-white/40">Ask questions about your documents using AI-powered retrieval.</p>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <Card className="p-6 mb-8 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Ask a question about your documents..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="px-8">
                {isSearching ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/40">Filter by document:</span>
                  <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300">
                      Select All
                    </button>
                    <span className="text-white/20">|</span>
                    <button onClick={selectNone} className="text-xs text-blue-400 hover:text-blue-300">
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
                      {selectedDocs.has(doc.id) ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
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

          <AnimatePresence>
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