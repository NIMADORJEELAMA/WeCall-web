"use client";
import { useState } from "react";
import { Calendar } from "lucide-react";

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export default function DoubleDateRangePicker({
  startDate,
  endDate,
  onChange,
}: Props) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-300 rounded-lg px-4 py-2">
      <Calendar size={16} className="text-slate-400" />

      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="outline-none text-sm"
      />

      <span className="text-slate-400 text-sm">to</span>

      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="outline-none text-sm"
      />
    </div>
  );
}
