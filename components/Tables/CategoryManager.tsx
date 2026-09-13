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
  Layers,
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

export default function CategoryManager({
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
      const res = await api.post("/tables/categories", {
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
      await api.patch(`/tables/categories/${editingCategory.id}`, {
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
      await api.delete(`/tables/categories/${idToDelete}`);
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
    <div className="space-y-8 p-8">
      {/* ADD SECTION: "The System Panel" */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings2 size={16} className="text-slate-500" />
            <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">
              Table Category
            </h3>
          </div>
          <Layers size={14} className="text-slate-300" />
        </div>

        <div className="p-3 space-y-6">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
              Label Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. VIP Lounge"
                className="flex-1 px-4 py-3 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all font-semibold outline-none"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                onClick={handleAddCategory}
                disabled={loading || !newCategoryName.trim()}
                className="bg-slate-900 text-white px-5 rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-30 shadow-lg shadow-slate-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus size={20} />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 block ">
              Theme
            </label>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-5 h-5 rounded-full transition-all ring-offset-2 ${selectedColor === color ? "ring-2 ring-slate-950 scale-125 shadow-md" : "hover:scale-110 opacity-60 hover:opacity-100"}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
                {selectedColor.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIST SECTION: "Audit List" */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
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

      {/* MODALS: "Glass-Audit" style */}
      <AnimatePresence>
        {editingCategory && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
              className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                  Modify Properties
                </h2>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="text-slate-400 hover:text-slate-900"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Updated Designation
                  </label>
                  <input
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-950 rounded-xl outline-none font-bold text-sm transition-all"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Update Theme
                  </label>
                  <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedEditColor(color)}
                        className={`w-6 h-6 rounded-full transition-all ring-offset-2 ${selectedEditColor === color ? "ring-2 ring-slate-950 scale-110" : "opacity-40 hover:opacity-100"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="flex-1 py-3 text-[11px] font-black uppercase text-slate-500 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-[1.5] py-3 bg-slate-900 text-white text-[11px] font-black uppercase rounded-xl shadow-lg"
                  >
                    Commit Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {deletingCategory && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">
                Confirm Removal
              </h2>
              <p className="text-slate-500 text-[11px] leading-relaxed mb-8">
                This will unassign all related items from{" "}
                <span className="font-black text-slate-800 underline decoration-red-200">
                  {deletingCategory.name}
                </span>
                . This action is irreversible.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleDelete}
                  className="w-full py-3 bg-red-600 text-white text-[11px] font-black uppercase rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={() => setDeletingCategory(null)}
                  className="w-full py-3 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600"
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
      `}</style>
    </div>
  );
}
