"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/auth-context";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#0066ff]/20 border-t-[#0066ff] rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Synchronizing ITSP...</p>
      </div>
    </div>
  );
}
