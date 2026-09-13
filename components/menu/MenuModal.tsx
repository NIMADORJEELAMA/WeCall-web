"use client";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MenuItemForm from "./MenuItemForm"; // Your existing form
import { string } from "zod";

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  //   onDelete: (id: string) => void;
  formData: any;
  setFormData: (data: any) => void;
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  inventory: any[];
  isActive?: boolean;
  categories: string[];
}

export default function MenuModal({
  isOpen,
  onClose,
  //   onDelete,
  formData,
  setFormData,
  isPending,
  onSubmit,
  inventory,
  categories = [],
}: MenuModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* BACKDROP */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* MODAL CONTENT */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="overflow-y-auto">
            {/* REUSING YOUR FORM COMPONENT */}
            <MenuItemForm
              categories={categories}
              formData={formData}
              setFormData={setFormData}
              onSubmit={onSubmit}
              isPending={isPending}
              inventory={inventory}
              onCancel={onClose}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
