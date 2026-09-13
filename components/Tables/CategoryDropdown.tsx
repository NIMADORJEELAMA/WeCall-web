"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter, Check, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
}

export default function CategoryDropdown({
  categories,
  selectedCategory,
  setSelectedCategory,
}: CategoryDropdownProps) {
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

  const currentCategoryName =
    selectedCategory === "ALL"
      ? "All Areas"
      : categories.find((c) => c.id === selectedCategory)?.name ||
        "Select Area";

  return (
    <div className="flex items-center">
      <div className="relative w-full md:w-64" ref={dropdownRef}>
        {/* Main Trigger Button - Fixed h-10 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-12 flex items-center justify-between bg-white border px-4 rounded-xl transition-all duration-200 shadow-sm cursor-pointer ${
            isOpen
              ? "border-slate-400 ring-2 ring-slate-100"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span
              className={`text-sm font-semibold truncate ${selectedCategory === "ALL" ? "text-slate-500" : "text-slate-900"}`}
            >
              {currentCategoryName}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </button>

        {/* Custom Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              className="absolute z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-xl py-1 overflow-hidden"
            >
              {/* Scrollable Container with Max Height */}
              <div className="max-h-[240px] overflow-y-auto no-scrollbar scroll-smooth">
                {/* All Areas Option */}
                <button
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 h-10 text-sm font-semibold transition-colors cursor-pointer ${
                    selectedCategory === "ALL"
                      ? "bg-slate-900 text-white"
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  All Areas
                  {selectedCategory === "ALL" && <Check className="w-4 h-4" />}
                </button>

                {categories.length > 0 && (
                  <div className="h-px bg-slate-100 mx-2 my-1" />
                )}

                {/* Dynamic Categories */}
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 h-10 text-sm font-semibold transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {selectedCategory === cat.id && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}

                {categories.length === 0 && (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">
                    No categories found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clear Filter Button - Fixed h-10 to match */}
      <div className="flex items-center">
        <AnimatePresence>
          {selectedCategory !== "ALL" && (
            <motion.button
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              onClick={() => setSelectedCategory("ALL")}
              className="h-10 w-10 flex items-center justify-center ml-2 bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer group"
              title="Clear Filter"
            >
              <X size={16} strokeWidth={3} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
