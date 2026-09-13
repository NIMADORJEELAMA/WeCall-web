"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter, Check, X, LucideIcon } from "lucide-react";

interface DropdownOption {
  id: string;
  name: string;
}

interface GenericDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  allLabel?: string; // e.g., "All Types", "All Categories"
  icon?: LucideIcon;
  className?: string;
  showClear?: boolean;
}

function GenericDropdown({
  options,
  selectedValue,
  onSelect,
  placeholder = "Select Option",
  allLabel = "All",
  icon: Icon = Filter,
  showClear = true,
  className = "w-full md:w-64",
}: GenericDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel =
    selectedValue === "ALL"
      ? allLabel
      : options.find((o) => o.id === selectedValue)?.name || placeholder;

  return (
    <div
      className={`flex items-center relative ${className}`}
      ref={dropdownRef}
    >
      <div className="relative flex-1">
        {/* Main Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-10 flex items-center justify-between bg-white border px-4 rounded-xl transition-all shadow-sm cursor-pointer ${
            isOpen
              ? "border-slate-400 ring-2 ring-slate-100"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span
              className={`text-sm font-semibold truncate ${selectedValue === "ALL" ? "text-slate-500" : "text-slate-900"}`}
            >
              {currentLabel}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </button>

        {/* Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl py-1 overflow-hidden"
            >
              <div className="max-h-[240px] overflow-y-auto no-scrollbar">
                {/* Reset/All Option */}
                <button
                  onClick={() => {
                    onSelect("ALL");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 h-10 text-sm font-semibold transition-colors cursor-pointer ${
                    selectedValue === "ALL"
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {allLabel}
                  {selectedValue === "ALL" && <Check className="w-4 h-4" />}
                </button>

                {options.length > 0 && (
                  <div className="h-px bg-slate-100 mx-2 my-1" />
                )}

                {/* Dynamic Options */}
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSelect(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 h-10 text-sm font-semibold transition-colors cursor-pointer ${
                      selectedValue === opt.id
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {selectedValue === opt.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Clear Button */}
      <AnimatePresence>
        {showClear && selectedValue !== "ALL" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onSelect("ALL")}
            className="absolute -top-2 -right-0 h-4 w-4 flex items-center justify-center ml-2 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <X size={16} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(GenericDropdown);
