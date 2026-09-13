"use client";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

interface StatusToggleProps {
  isActive: boolean;
  onChange: (value: boolean) => void;
}

export default function StatusToggle({
  isActive,
  onChange,
}: StatusToggleProps) {
  return (
    <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl w-fit">
      {[
        { label: "Active", val: true, icon: Eye, color: "text-emerald-500" },
        { label: "Disabled", val: false, icon: EyeOff, color: "text-red-500" },
      ].map((status) => {
        const isSelected = isActive === status.val;
        return (
          <button
            key={status.label}
            type="button"
            onClick={() => onChange(status.val)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer z-10 ${
              isSelected
                ? "text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <status.icon
              size={14}
              className={isSelected ? status.color : "text-slate-400"}
            />
            {status.label}
          </button>
        );
      })}
    </div>
  );
}
