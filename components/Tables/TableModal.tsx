"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import CategoryDropdown from "./CategoryDropdown"; // Import your component

interface TableModalProps {
  isOpen: boolean;
  type: "add" | "edit" | "delete" | null;
  activeTable: any;
  categories: any[];
  onClose: () => void;
  onConfirm: (data: any) => Promise<void>;
  onCategoryCreated: (newCat: any) => void;
}
export default function TableModal({
  isOpen,
  type,
  activeTable,
  categories,
  onClose,
  onConfirm,
}: TableModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    categoryId: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  useEffect(() => {
    if (type === "edit" && activeTable) {
      setFormData({
        number: activeTable.number,
        categoryId: activeTable.categoryId || "ALL", // Default to ALL if empty
        isActive: activeTable.status !== "INACTIVE",
      });
    } else {
      setFormData({ number: "", categoryId: "ALL", isActive: true });
    }
  }, [type, activeTable, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.number.trim()) {
      setError("Table name is required");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      // Map "ALL" back to empty string if your backend expects that
      const submissionData = {
        ...formData,
        categoryId: formData.categoryId === "ALL" ? "" : formData.categoryId,
      };
      await onConfirm(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onClose();
              setError("");
            }}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-visible flex flex-col max-h-[90vh]"
          >
            {/* HEADER */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {type === "delete"
                      ? "Delete Table"
                      : type === "add"
                        ? "Create Table"
                        : "Edit Table"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {type === "delete"
                      ? "This action cannot be undone"
                      : "Manage your restaurant floor plan details"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setError("");
                  }}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="p-8 ">
              {type === "delete" ? (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} />
                  </div>
                  <p className="text-slate-600 font-medium">
                    Are you sure you want to remove{" "}
                    <span className="font-bold text-slate-900">
                      {activeTable?.number}
                    </span>
                    ?
                  </p>
                </div>
              ) : (
                <div className="space-y-6 h-auto">
                  {/* Table Number Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600 block">
                      Table Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      className="w-full h-10 px-4 rounded-xl border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none text-sm transition-all font-medium"
                      value={formData.number}
                      onChange={(e) =>
                        setFormData({ ...formData, number: e.target.value })
                      }
                      placeholder="e.g. T-01"
                    />
                    {error && (
                      <p className="text-xs text-red-500 font-medium mt-1">
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Integrated CategoryDropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600 block">
                      Location / Area
                    </label>
                    <CategoryDropdown
                      categories={categories}
                      selectedCategory={formData.categoryId}
                      setSelectedCategory={(id) =>
                        setFormData({ ...formData, categoryId: id })
                      }
                    />
                  </div>

                  {/* Item Status */}
                  {type === "edit" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-600 block">
                        Table Status
                      </label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {[
                          { label: "Active", value: true },
                          { label: "Disabled", value: false },
                        ].map((status) => (
                          <button
                            key={status.label}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                isActive: status.value,
                              })
                            }
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              formData.isActive === status.value
                                ? "bg-white shadow-sm text-slate-900"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${status.value ? "bg-emerald-500" : "bg-slate-400"}`}
                            />
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="flex gap-3 px-8 py-6  border-slate-100 bg-slate-50  rounded-2xl">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setError("");
                }}
                className="flex-[2] h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={
                  type === "delete" ? () => onConfirm(null) : handleSubmit
                }
                disabled={isSubmitting}
                className={`flex-[8] h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  type === "delete"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-black hover:bg-slate-800 text-white"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : type === "delete" ? (
                  "Confirm Delete"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
