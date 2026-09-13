"use client";

import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimplePickerProps {
  value: string;
  onChange: (val: string) => void;
  label: string;
  required?: boolean;
}

export function SimpleDateTimePicker({
  value,
  onChange,
  label,
  required,
}: SimplePickerProps) {
  return (
    <div className="group flex flex-col gap-1.5 w-full">
      {/* Label with Optional Asterisk */}
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative flex items-center">
        {/* Visual Icons */}
        <div className="absolute left-4 flex items-center gap-2 pointer-events-none">
          <Calendar size={16} className="text-indigo-600" />
          <div className="h-4 w-[1px] bg-slate-400" />
        </div>

        {/* The Native Input - Styled to look Premium */}
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-12 pl-16 pr-4 bg-slate-100 border-2 border-transparent",
            "rounded-xl text-sm font-bold text-slate-700 outline-none",
            "transition-all duration-200",
            "hover:bg-white hover:border-slate-200",
            "focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50",
            "appearance-none", // Hides some default browser arrows
          )}
          style={{
            colorScheme: "light", // Ensures the picker popup is readable
          }}
        />
      </div>
    </div>
  );
}
