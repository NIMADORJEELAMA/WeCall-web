"use client";
import { Calendar as CalendarIcon, X } from "lucide-react";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
}

export default function DatePicker({
  label,
  value,
  onChange,
}: DatePickerProps) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 ">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
        {label}
      </label>
      <div className="relative group cursor-pointer">
        {/* <CalendarIcon
          size={14}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none cursor-pointer"
        /> */}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold  text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
        />
      </div>
    </div>
  );
}
