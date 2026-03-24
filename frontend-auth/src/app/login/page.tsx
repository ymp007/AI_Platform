"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../../context/auth-context";
import { apiFetch } from "../../lib/api";
import { Button, Input, Card, Badge } from "../../components/ui";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      // Use setTimeout to ensure the login/redirect happens outside the current state update cycle
      setTimeout(() => {
        login(data.token);
      }, 0);
    } catch (err: any) {
      setError(err.message || "Identity verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#0a0a0b] relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.05)_0%,transparent_50%)]" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="text-center mb-8">
          <Badge className="mb-4">Secure Gateway</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Sign <span className="text-blue-500">In</span>
          </h1>
          <p className="text-zinc-500 text-sm">Welcome back to the ITSP control plane.</p>
        </div>

        <Card className="border-zinc-800/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@nexus.io"
                required
                className="pl-11"
              />
              <Mail className="absolute left-4 top-[38px] text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={16} />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-11"
              />
              <Lock className="absolute left-4 top-[38px] text-zinc-600 group-focus-within:text-blue-500 transition-colors" size={16} />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
              >
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full py-4 mt-2" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authorize Access
                  <ArrowRight className="ml-2" size={16} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
            <p className="text-xs text-zinc-500 font-medium">
              New Operator?{" "}
              <Link href="/register" className="text-white hover:text-blue-500 transition-colors font-bold underline decoration-zinc-800 underline-offset-4 decoration-2">
                Request Enrollment
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
