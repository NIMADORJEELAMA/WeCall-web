"use client";
import { useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  Plus,
  Tag,
  Loader2,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoryCreated: (newCat: Category) => void;
  onRefreshCategories: () => void;
}

export default function CategoryManagerRoom({
  categories,
  onCategoryCreated,
  onRefreshCategories,
}: CategoryManagerProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const [selectedEditColor, setSelectedEditColor] = useState("");

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/rooms/categories", {
        name: newCategoryName,
        color: selectedColor,
      });
      toast.success("Category added");
      onCategoryCreated(res.data);
      setNewCategoryName("");
    } catch (err: any) {
      toast.error("Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory || !editName.trim()) return;
    try {
      await api.patch(`/rooms/categories/${editingCategory.id}`, {
        name: editName,
        color: selectedEditColor,
      });
      toast.success("Updated successfully");
      setEditingCategory(null);
      onRefreshCategories();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    const idToDelete = deletingCategory.id;
    try {
      await api.delete(`/rooms/categories/${idToDelete}`);
      toast.success("Category removed successfully");
      setDeletingCategory(null);
      await onRefreshCategories();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Cannot delete category currently in use";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-8 p-2">
      {/* SECTION: ADD CATEGORY (The "Control Panel" look) */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings2 size={16} className="text-slate-500" />
            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
              Room Category
            </h3>
          </div>
          <Tag size={14} className="text-slate-300" />
        </div>

        <div className="p-3 space-y-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Label Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Premium Suite"
                className="flex-1 px-4 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-all font-semibold outline-none placeholder:text-slate-400"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                onClick={handleAddCategory}
                disabled={loading || !newCategoryName.trim()}
                className="bg-slate-950 text-white px-5 rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-30 disabled:grayscale cursor-pointer shadow-lg shadow-slate-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block  ">
              Theme
            </label>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex gap-2.5">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-5 h-5 rounded-full transition-all ring-offset-2 ${selectedColor === color ? "ring-2 ring-slate-950 scale-125 shadow-sm" : "hover:scale-110 opacity-70 hover:opacity-100"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="h-4 w-[1px] bg-slate-200 mx-2" />
              <div className="text-[10px] font-bold text-slate-500 font-mono">
                {selectedColor.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: LIST (The "Audit" look) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
            Registered Categories ({categories.length})
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {categories.map((cat) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={cat.id}
                className="group flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-1.5 h-6 rounded-full"
                    style={{ backgroundColor: cat.color || "#cbd5e1" }}
                  />
                  <div>
                    <span className="text-[13px] font-bold text-slate-700 block">
                      {cat.name}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setEditName(cat.name);
                      setSelectedEditColor(cat.color || "#3B82F6");
                    }}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingCategory(cat)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {categories.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-slate-300 text-[11px] font-black uppercase tracking-widest">
                Database Empty
              </p>
            </div>
          )}
        </div>
      </section>

      {/* MODALS */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCategory(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-white w-full max-w-sm rounded-2xl p-0 shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  Modify Properties
                </h2>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="text-slate-400 hover:text-slate-950"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Display Name
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-950 rounded-xl outline-none font-bold transition-all text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Identity Color
                  </label>
                  <div className="flex flex-wrap gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedEditColor(color)}
                        className={`w-6 h-6 rounded-full transition-all ring-offset-2 ${selectedEditColor === color ? "ring-2 ring-slate-950 scale-110" : "opacity-60 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-50 transition-all border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-[1.5] py-3 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-200"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {deletingCategory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingCategory(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative bg-white w-full max-w-xs rounded-2xl p-8 shadow-2xl text-center border border-slate-200"
            >
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Delete Category?
              </h2>
              <p className="text-slate-500 text-[12px] mt-2 mb-8 leading-relaxed px-2">
                Removing{" "}
                <span className="font-bold text-slate-800">
                  {deletingCategory.name}
                </span>{" "}
                will affect all linked assets. This action is irreversible.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDelete}
                  className="w-full py-3 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeletingCategory(null)}
                  className="w-full py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Keep Category
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
