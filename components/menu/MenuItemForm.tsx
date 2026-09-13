"use client";

import {
  Utensils,
  Beer,
  Link,
  Loader2,
  IndianRupee,
  Hash,
  Leaf,
  Flame,
  ClipboardList,
  ChevronDown,
  AlertCircle,
  Eye,
  EyeOff,
  Activity,
  Scale,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import CategoryCombobox from "../CategoryCombobox";

interface MenuItemFormProps {
  formData: {
    id: string;
    name: string;
    price: string;
    category: string;
    type: "FOOD" | "DRINKS";
    isVeg: boolean;
    inventoryItemId: string;
    portionSize: number;
    isActive: boolean;
    requiresPreparation: boolean;
  };
  setFormData: (data: any) => void;
  inventory: any[];
  categories: string[];
  isPending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function MenuItemForm({
  formData,
  setFormData,
  inventory = [],
  isPending,
  onSubmit,
  onCancel,
  categories = [],
}: MenuItemFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  console.log("formData", formData);
  console.log("inventory", inventory);
  // Helper to find selected inventory unit for the suffix
  const selectedUnit = useMemo(() => {
    if (!inventory.length) return "unit";

    const item = inventory.find((i) => i.id === formData.inventoryItemId);

    return item?.unit || "unit";
  }, [formData.inventoryItemId, inventory]);

  const updateField = (field: string, value: any) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const validateAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Item name is required";
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Enter a valid price > 0";
    }
    if (!formData.category.trim()) newErrors.category = "Category is required";

    // If linked to inventory, ensure portion size is valid
    if (formData.inventoryItemId) {
      if (!formData.portionSize || formData.portionSize <= 0) {
        newErrors.portionSize = "Required when linked to inventory";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(e);
  };

  return (
    <form
      onSubmit={validateAndSubmit}
      className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden max-w-6xl  "
    >
      {/* HEADER */}
      <div className="px-8 pt-8   border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {formData.id ? "Update Menu Item" : "Create Menu Item"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure how this item appears on the menu and deducts from stock.
        </p>
      </div>

      <div className="p-8 space-y-8">
        {/* ROW 1: BASIC INFO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 uppercase  ml-1">
              Item Name
            </label>
            <input
              placeholder="e.g. Chicken Biryani"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              className={`w-full px-4 h-11 rounded-2xl border transition-all text-sm outline-none ${
                errors.name
                  ? "border-red-500 bg-red-50/30"
                  : "border-slate-200 focus:border-indigo-500"
              }`}
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 uppercase  ml-1">
              Selling Price
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                className={`w-full pl-10 pr-4 h-11 rounded-2xl border transition-all text-sm font-bold outline-none ${
                  errors.price
                    ? "border-red-500 bg-red-50/30"
                    : "border-slate-200 focus:border-indigo-500"
                }`}
              />
            </div>
            {errors.price && (
              <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">
                {errors.price}
              </p>
            )}
          </div>

          {/* <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 uppercase  ml-1">
              Category
            </label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Main Course"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={`w-full pl-10 pr-4 h-11 rounded-2xl border transition-all text-sm outline-none ${
                  errors.category
                    ? "border-red-500 bg-red-50/30"
                    : "border-slate-200 focus:border-indigo-500"
                }`}
              />
            </div>
            {errors.category && (
              <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">
                {errors.category}
              </p>
            )}
          </div> */}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 uppercase ml-1">
              Category
            </label>
            <CategoryCombobox
              options={categories}
              value={formData.category}
              onChange={(val) => updateField("category", val)}
              error={errors.category}
            />
            {errors.category && (
              <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">
                {errors.category}
              </p>
            )}
          </div>
        </div>
        {/* ROW 2: TOGGLES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase  ml-1">
              Menu Type
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl h-11">
              {(["FOOD", "DRINKS"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateField("type", t)}
                  className={`flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.type === t
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-slate-500"
                  }`}
                >
                  {t === "FOOD" ? <Utensils size={14} /> : <Beer size={14} />}
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase ml-1">
              Dietary
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl h-11">
              {[
                { label: "Veg", val: true, icon: Leaf },
                { label: "Non-Veg", val: false, icon: Flame },
              ].map((d) => {
                // Determine if this specific button is active
                const isActive = formData.isVeg === d.val;

                return (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => updateField("isVeg", d.val)}
                    className={`flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isActive
                        ? d.val
                          ? "bg-white shadow-sm text-green-600" // Veg Active: Green text
                          : "bg-white shadow-sm text-red-600" // Non-Veg Active: Red text
                        : "text-slate-500 hover:text-slate-700" // Inactive state
                    }`}
                  >
                    {/* You can also color the icon specifically */}
                    <d.icon
                      size={14}
                      className={
                        isActive
                          ? d.val
                            ? "text-green-600"
                            : "text-red-600"
                          : ""
                      }
                    />
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 uppercase  ml-1">
              Visibility
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl h-11">
              {[
                { label: "Active", val: true, icon: Eye },
                { label: "Hidden", val: false, icon: EyeOff },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => updateField("isActive", s.val)}
                  className={`flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.isActive === s.val
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  <s.icon size={14} /> {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 py-2.5 px-3 bg-slate-100 rounded-xl w-fit">
          {/* Text */}
          <span className="text-[13px] font-semibold text-slate-600 tracking-tight">
            Requires Preparation
          </span>

          {/* Toggle */}
          <button
            type="button"
            onClick={() =>
              updateField("requiresPreparation", !formData.requiresPreparation)
            }
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
              formData.requiresPreparation ? "bg-indigo-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                formData.requiresPreparation
                  ? "translate-x-4.5"
                  : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {/* SECTION: INVENTORY LINKING */}
        <div className="pt-6 border-t border-slate-100 bg-indigo-50/30 -mx-8 px-8 pb-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-tight">
              Inventory Synchronization
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Link Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase  ml-1 flex items-center gap-2">
                <ClipboardList size={12} />
                Link Raw Ingredient
              </label>
              <div className="relative">
                <Link className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={formData.inventoryItemId}
                  onChange={(e) =>
                    updateField("inventoryItemId", e.target.value)
                  }
                  className={`w-full pl-11 pr-10 h-11 appearance-none rounded-2xl border bg-white text-sm outline-none transition-all ${
                    errors.portionSize && !formData.inventoryItemId
                      ? "border-slate-200"
                      : "border-slate-200 focus:border-indigo-500"
                  }`}
                >
                  <option value="">No Inventory Link (Manual Stock)</option>
                  {inventory?.map((inv: any) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name.toUpperCase()} — {inv.currentStock} {inv.unit}{" "}
                      Available
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Portion Size Input */}
            <AnimatePresence>
              {formData.inventoryItemId && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  <label className="text-[11px] font-bold text-slate-500 uppercase  ml-1 flex items-center gap-2">
                    <Scale size={12} />
                    Portion per Order
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="e.g. 0.250"
                      value={formData.portionSize}
                      onChange={(e) =>
                        updateField("portionSize", e.target.value)
                      }
                      className={`w-full px-4 h-11 rounded-2xl border bg-white text-sm font-bold outline-none transition-all ${
                        errors.portionSize
                          ? "border-red-500"
                          : "border-slate-200 focus:border-indigo-500"
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase">
                      {selectedUnit}
                    </div>
                  </div>
                  {errors.portionSize && (
                    <p className="text-[9px] text-red-500 font-bold ml-1 uppercase">
                      {errors.portionSize}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* <div className="bg-white/60 rounded-2xl p-4 border border-indigo-100/50">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <span className="font-bold text-indigo-600 mr-1">PRO TIP:</span>
              {formData.inventoryItemId
                ? `Selling 1 unit of "${formData.name || "this item"}" will automatically deduct ${formData.portionSize || "0"} ${selectedUnit} from your inventory.`
                : "This item is not linked to inventory. You will need to manage its stock levels manually."}
            </p>
          </div> */}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex px-8 py-6 border-t border-slate-100 bg-slate-50 gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
        >
          Cancel
        </button>
        <Button
          disabled={isPending}
          type="submit"
          variant={"default"}
          className="flex-[2]"
          // className="flex-[2] h-12 rounded-2xl bg-slate-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          {isPending ? (
            <Loader2 className="animate-spin w-4 h-4" />
          ) : (
            "Save Menu Item"
          )}
        </Button>
      </div>
    </form>
  );
}
