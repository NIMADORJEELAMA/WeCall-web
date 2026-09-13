// components/ui/Combobox.tsx
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function CategoryCombobox({
  options,
  value,
  onChange,
  error,
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          placeholder="Select or type category..."
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value); // Allows typing new categories
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full px-4 h-11 rounded-2xl border transition-all text-sm outline-none ${
            error
              ? "border-red-500 bg-red-50/30"
              : "border-slate-200 focus:border-indigo-500"
          }`}
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto no-scrollbar animate-in fade-in zoom-in duration-200">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between first:rounded-t-2xl last:rounded-b-2xl"
                onClick={() => {
                  onChange(opt);
                  setSearchTerm("");
                  setIsOpen(false);
                }}
              >
                {opt}
                {value === opt && (
                  <Check size={14} className="text-indigo-600" />
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-slate-500 italic">
              Press enter to create "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
