import React, { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "outline" | "ghost" }
>(({ className, variant = "primary", ...props }, ref) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 active:scale-95",
    outline: "bg-transparent text-zinc-100 border border-zinc-700 hover:bg-zinc-800/50 active:scale-95",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ className, label, error, ...props }, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          ref={ref}
          className={cn(
            "w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 group-hover:border-zinc-700",
            error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("bg-zinc-950/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl", className)}>
      {children}
    </div>
  );
};

export const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400 border border-blue-500/20", className)}>
      {children}
    </span>
  );
};

export function ProfileDropdown({ user, logout }: { user: any; logout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05] hover:bg-white/[0.05] transition-all"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0066ff] to-[#00d4ff] flex items-center justify-center text-[10px] font-bold shadow-lg shadow-[#0066ff]/20">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">{user.name || "Operator"}</span>
        <span className="text-white/40 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full min-w-[140px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
          <button
            onClick={logout}
            className="flex items-center space-x-2 w-full px-4 py-3 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
