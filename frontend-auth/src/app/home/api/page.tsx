"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge } from "../../../components/ui";
import {
  Search,
  Plus,
  Clock,
  RefreshCw,
  Copy,
  Send,
  Globe,
  Activity,
  AlertCircle,
  Terminal
} from "lucide-react";

interface APIEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  name: string;
  status: "active" | "inactive" | "error";
  requests: number;
  latency: number;
  lastCalled: string;
}

const sampleEndpoints: APIEndpoint[] = [
  { id: "1", method: "GET", path: "/api/v1/users", name: "List Users", status: "active", requests: 15420, latency: 45, lastCalled: "Just now" },
  { id: "2", method: "POST", path: "/api/v1/auth/login", name: "Login", status: "active", requests: 8920, latency: 120, lastCalled: "1 min ago" },
  { id: "3", method: "GET", path: "/api/v1/documents", name: "Get Documents", status: "active", requests: 5670, latency: 85, lastCalled: "5 min ago" },
  { id: "4", method: "POST", path: "/api/v1/agents", name: "Create Agent", status: "active", requests: 2340, latency: 250, lastCalled: "15 min ago" },
  { id: "5", method: "PUT", path: "/api/v1/settings", name: "Update Settings", status: "inactive", requests: 890, latency: 60, lastCalled: "2 hours ago" },
  { id: "6", method: "DELETE", path: "/api/v1/cache", name: "Clear Cache", status: "error", requests: 45, latency: 1200, lastCalled: "1 day ago" },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-500/10 text-green-400 border-green-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function APIPage() {
  const { user } = useAuth();
  const [endpoints, setEndpoints] = useState(sampleEndpoints);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalRequests: endpoints.reduce((acc, e) => acc + e.requests, 0),
    avgLatency: Math.round(endpoints.filter(e => e.status === "active").reduce((acc, e) => acc + e.latency, 0) / endpoints.filter(e => e.status === "active").length),
    activeEndpoints: endpoints.filter(e => e.status === "active").length,
    errorEndpoints: endpoints.filter(e => e.status === "error").length
  };

  const testEndpoint = () => {
    if (!selectedEndpoint) return;
    setIsLoadingResponse(true);
    setResponse(null);
    
    setTimeout(() => {
      const mockResponse = {
        success: true,
        data: {
          id: "12345",
          message: "API request successful",
          timestamp: new Date().toISOString()
        },
        meta: {
          requests: Math.floor(Math.random() * 1000),
          latency: Math.floor(Math.random() * 200)
        }
      };
      setResponse(JSON.stringify(mockResponse, null, 2));
      setIsLoadingResponse(false);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/20">API Testing</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">API Management</h1>
            <p className="text-white/40">Test, monitor, and manage your API endpoints.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Activity className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-xs text-white/40">Total Requests</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-white/40">Avg. Latency</span>
              </div>
              <p className="text-2xl font-bold">{stats.avgLatency}ms</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Globe className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-white/40">Active Endpoints</span>
              </div>
              <p className="text-2xl font-bold">{stats.activeEndpoints}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-xs text-white/40">Errors</span>
              </div>
              <p className="text-2xl font-bold">{stats.errorEndpoints}</p>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search endpoints..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all"
              />
            </div>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Endpoint
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Endpoints List */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {filteredEndpoints.map((endpoint, index) => (
                  <motion.div
                    key={endpoint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedEndpoint(endpoint)}
                    className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all group ${
                      selectedEndpoint?.id === endpoint.id
                        ? "bg-red-500/5 border-red-500/30"
                        : "bg-white/[0.02] border-white/5 hover:border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${methodColors[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <div>
                        <h3 className="font-bold text-white">{endpoint.name}</h3>
                        <p className="text-sm text-white/30 font-mono">{endpoint.path}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-white/30">Requests</p>
                        <p className="font-bold text-white">{endpoint.requests.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/30">Latency</p>
                        <p className="font-bold text-white">{endpoint.latency}ms</p>
                      </div>
                      <StatusBadge status={endpoint.status} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* API Tester */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-white">API Tester</h3>
                </div>
                
                {selectedEndpoint ? (
                  <>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${methodColors[selectedEndpoint.method]}`}>
                          {selectedEndpoint.method}
                        </span>
                        <span className="text-sm text-white/60 font-mono">{selectedEndpoint.path}</span>
                      </div>
                      <p className="text-xs text-white/30">{selectedEndpoint.name}</p>
                    </div>

                    {(selectedEndpoint.method === "POST" || selectedEndpoint.method === "PUT" || selectedEndpoint.method === "PATCH") && (
                      <div className="mb-4">
                        <label className="block text-xs text-white/40 mb-2">Request Body</label>
                        <textarea
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          placeholder='{"key": "value"}'
                          className="w-full h-32 bg-white/[0.02] border border-white/10 rounded-xl p-3 text-sm text-white font-mono placeholder:text-white/20 outline-none focus:border-red-500/30 resize-none"
                        />
                      </div>
                    )}

                    <Button onClick={testEndpoint} disabled={isLoadingResponse} className="w-full bg-red-600 hover:bg-red-700">
                      {isLoadingResponse ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Request
                    </Button>

                    <AnimatePresence>
                      {response && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-white/40">Response</span>
                            <button
                              onClick={() => copyToClipboard(response)}
                              className="p-1 rounded text-white/20 hover:text-white"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <pre className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-green-400 font-mono overflow-x-auto max-h-48">
                            {response}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Terminal className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-white/40">Select an endpoint to test</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
    </div>
  );
}

function StatusBadge({ status }: { status: APIEndpoint["status"] }) {
  const styles = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    inactive: "bg-white/5 text-white/40 border-white/10",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const labels = { active: "Active", inactive: "Inactive", error: "Error" };

  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status]}`}>{labels[status]}</span>;
}
