"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  Palette,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefresh: () => void;
}

export default function CategoryModal({
  isOpen,
  onClose,
  categories,
  onRefresh,
}: CategoryModalProps) {
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#64748B",
  ];

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await api.post("/tables/categories", {
        name: newName,
        color: selectedColor,
      });
      toast.success("Category added");
      setNewName("");
      onRefresh();
    } catch (err) {
      toast.error("Error adding category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/tables/categories/${id}`);
      toast.success("Category deleted");
      onRefresh();
    } catch (err) {
      toast.error("Category is in use by tables");
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.patch(`/tables/categories/${id}`, { name: editName });
      setEditingId(null);
      onRefresh();
      toast.success("Updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Categories
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                  Manage floor plan zones & themes
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-8 no-scrollbar">
              {/* ADD SECTION */}
              <section className="p-6 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                    Create New Area
                  </label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-5 py-3.5 rounded-2xl bg-white border-none shadow-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      placeholder="e.g., Rooftop"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <button
                      onClick={handleAdd}
                      disabled={loading || !newName.trim()}
                      className="bg-slate-900 text-white px-6 rounded-2xl font-bold hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-30"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Palette size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">
                      Theme Color
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-6 h-6 rounded-full transition-all ring-offset-2 ${selectedColor === c ? "ring-2 scale-110" : "hover:scale-110"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* LIST SECTION */}
              <section className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Existing Areas
                </label>
                <div className="grid gap-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-3 h-3 rounded-full shadow-inner"
                          style={{ backgroundColor: cat.color || "#cbd5e1" }}
                        />
                        {editingId === cat.id ? (
                          <input
                            autoFocus
                            className="font-bold text-slate-800 outline-none border-b-2 border-blue-500"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <span className="font-bold text-slate-700">
                            {cat.name}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {editingId === cat.id ? (
                          <button
                            onClick={() => handleUpdate(cat.id)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl"
                          >
                            <Check size={18} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(cat.id);
                                setEditName(cat.name);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
