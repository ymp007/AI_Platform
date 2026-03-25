"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge } from "../../../components/ui";
import {
  FileUp,
  Trash2,
  RefreshCw,
  Check,
  File,
  Download,
  X,
  Image,
  FileText,
  Film,
  Archive,
  AlertCircle,
} from "lucide-react";

interface ProcessedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "processing" | "completed" | "failed";
  processedAt: string;
}

const sampleFiles: ProcessedFile[] = [
  { id: "1", name: "report_2024.pdf", size: "2.4 MB", type: "pdf", status: "completed", processedAt: "2024-01-15 10:30" },
  { id: "2", name: "data_analysis.xlsx", size: "1.1 MB", type: "excel", status: "completed", processedAt: "2024-01-15 09:15" },
  { id: "3", name: "presentation.pptx", size: "5.2 MB", type: "powerpoint", status: "processing", processedAt: "Processing..." },
  { id: "4", name: "backup.zip", size: "156 MB", type: "archive", status: "failed", processedAt: "2024-01-14 16:45" },
];

const getFileIcon = (type: string) => {
  const icons: Record<string, any> = {
    pdf: FileText,
    excel: FileText,
    powerpoint: Film,
    word: FileText,
    image: Image,
    archive: Archive,
    default: File
  };
  return icons[type] || File;
};

const getFileColor = (type: string) => {
  const colors: Record<string, string> = {
    pdf: "text-red-400 bg-red-500/10",
    excel: "text-green-400 bg-green-500/10",
    powerpoint: "text-orange-400 bg-orange-500/10",
    word: "text-blue-400 bg-blue-500/10",
    image: "text-purple-400 bg-purple-500/10",
    archive: "text-amber-400 bg-amber-500/10",
    default: "text-white/40 bg-white/5"
  };
  return colors[type] || colors.default;
};

export default function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState(sampleFiles);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  }, [uploadedFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const processFiles = () => {
    setProcessing(true);
    setTimeout(() => {
      const newProcessed: ProcessedFile[] = uploadedFiles.map((file, i) => ({
        id: Date.now().toString() + i,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.name.split('.').pop() || 'default',
        status: "processing" as const,
        processedAt: "Processing..."
      }));
      setFiles([...newProcessed, ...files]);
      setUploadedFiles([]);
      setProcessing(false);
    }, 2000);
  };

  const stats = {
    total: files.length,
    completed: files.filter(f => f.status === "completed").length,
    processing: files.filter(f => f.status === "processing").length,
    failed: files.filter(f => f.status === "failed").length
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">File Operations</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">File Processing</h1>
            <p className="text-white/40">Upload, process, and transform your documents.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FileUp className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-white/40">Total Files</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-white/40">Processing</span>
              </div>
              <p className="text-2xl font-bold">{stats.processing}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-white/40">Completed</span>
              </div>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-xs text-white/40">Failed</span>
              </div>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </Card>
          </div>

          {/* Upload Zone */}
          <div className="mb-8">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                dragActive 
                  ? "border-green-500 bg-green-500/5" 
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
                  <FileUp className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-lg font-bold text-white mb-2">
                  {dragActive ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-sm text-white/40">or click to browse</p>
                <p className="text-xs text-white/20 mt-4">Supports PDF, Excel, Word, Images, Archives</p>
              </div>
            </div>
          </div>

          {/* Uploaded Files Preview */}
          <AnimatePresence>
            {uploadedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white">Files to Process ({uploadedFiles.length})</h3>
                    <Button onClick={processFiles} disabled={processing} className="bg-green-600 hover:bg-green-700">
                      {processing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {processing ? "Processing..." : "Process Files"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => {
                      const FileIcon = getFileIcon(file.name.split('.').pop() || 'default');
                      const colorClass = getFileColor(file.name.split('.').pop() || 'default');
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{file.name}</p>
                              <p className="text-xs text-white/30">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeUploadedFile(index)}
                            className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processed Files */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white/80">Processed Files</h2>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {files.map((file, index) => {
                const FileIcon = getFileIcon(file.type);
                const colorClass = getFileColor(file.type);
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-green-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl ${colorClass}`}>
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{file.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                          <span>{file.size}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{file.type.toUpperCase()}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{file.processedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={file.status} />
                      <button className="p-2 rounded-lg text-white/20 hover:text-green-400 hover:bg-green-500/10 transition-colors">
                        <Download size={18} />
                      </button>
                      <button className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProcessedFile["status"] }) {
  const styles = {
    processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const labels = { processing: "Processing", completed: "Completed", failed: "Failed" };

  return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>{labels[status]}</span>;
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
