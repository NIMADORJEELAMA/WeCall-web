"use client";

import { X, Utensils, Beer, Link, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: "FOOD" | "DRINKS";
  inventoryItemId?: string | null;
  portionSize: number;
}

interface InventoryStock {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
}

interface Props {
  isOpen: boolean;
  item: MenuItem | null;
  drinksinventory: InventoryStock[];
  loading: boolean;

  name: string;
  price: string;
  category: string;
  type: "FOOD" | "DRINKS";
  inventoryItemId: string;

  setName: (v: string) => void;
  setPrice: (v: string) => void;
  setCategory: (v: string) => void;
  setType: (v: "FOOD" | "DRINKS") => void;
  setInventoryItemId: (v: string) => void;

  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function EditMenuItemModal({
  isOpen,
  item,
  drinksinventory,
  loading,
  name,
  price,
  category,
  type,
  inventoryItemId,
  setName,
  setPrice,
  setCategory,
  setType,
  setInventoryItemId,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-[36px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b">
          <h2 className="text-2xl font-black uppercase   tracking-tighter">
            Edit Menu Item
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Item Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-2 px-5 py-4 bg-gray-50 rounded-2xl font-bold uppercase focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Price
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full mt-2 px-5 py-4 bg-gray-50 rounded-2xl font-bold focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Category
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-2 px-5 py-4 bg-gray-50 rounded-2xl font-bold uppercase focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Type */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Item Type
              </label>
              <div className="mt-2 flex bg-gray-50 p-1 rounded-2xl">
                {["FOOD", "DRINKS"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition ${
                      type === t ? "bg-gray-900 text-white" : "text-gray-400"
                    }`}
                  >
                    {t === "FOOD" ? <Utensils size={12} /> : <Beer size={12} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Link */}
          {type === "DRINKS" && (
            <div className="p-5 bg-purple-50 rounded-3xl border border-purple-100 flex items-center gap-4">
              <Link className="text-purple-600" />
              <select
                value={inventoryItemId}
                onChange={(e) => setInventoryItemId(e.target.value)}
                className="flex-1 px-5 py-4 bg-white rounded-2xl font-bold shadow-sm"
              >
                <option value="">SELECT INVENTORY ITEM</option>
                {drinksinventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.currentStock} {inv.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ACTION */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-[0.2em] text-xs flex justify-center gap-3 hover:bg-blue-600 transition"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Update Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
