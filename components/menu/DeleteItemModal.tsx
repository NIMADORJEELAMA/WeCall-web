"use client";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isPending: boolean;
}

export default function DeleteItemModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isPending,
}: DeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 overflow-hidden text-center"
          >
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Delete Item?</h3>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-900">"{itemName}"</span>?
              This action will archive the item from your menu.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={onClose}
                className="py-3 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isPending}
                onClick={onConfirm}
                className="py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                Confirm Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
