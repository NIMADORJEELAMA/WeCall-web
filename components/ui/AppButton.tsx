"use client";

import React from "react";
import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Standard Shadcn utility for merging classes

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export default function AppButton({
  label,
  icon: Icon,
  isLoading,
  variant = "primary",
  className,
  ...props
}: AppButtonProps) {
  // Define variant styles to match your "minizeo" branding
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
    secondary:
      "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} />
      )}
      <span>{label}</span>
    </button>
  );
}
