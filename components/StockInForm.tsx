"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Loader2,
  Search,
  IndianRupee,
  PackagePlus,
  Tags,
  Scale,
  ClipboardList,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Button } from "./ui/button";
import CategoryCombobox from "./CategoryCombobox";

interface StockInFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
  categories?: string[];
}

export default function StockInForm({
  onClose,
  onSuccess,
  editData,
  categories = [],
}: StockInFormProps) {
  const [loading, setLoading] = useState(false);
  const [existingItems, setExistingItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState(editData?.name || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [syncWithMenu, setSyncWithMenu] = useState(false);
  const [sellingPrice, setSellingPrice] = useState("");
  const [portionSize, setPortionSize] = useState("1");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: editData?.name || "",
    quantity: editData?.currentStock || "", // Note: currentStock in edit mode
    unit: editData?.unit || "pcs",
    type: editData?.type || "FOOD",
    purchasePrice: editData?.lastPurchasePrice || "",
    category: editData?.category || "GENERAL", // ADDED
  });

  useEffect(() => {
    api
      .get("/inventory/stocks")
      .then((res) => {
        // res.data is now { items: [...], stats: {...} }
        // We only want the items array for the search dropdown
        const stockItems = Array.isArray(res.data)
          ? res.data
          : res.data.items || [];
        setExistingItems(stockItems);
      })
      .catch((err) => {
        console.error("Dropdown fetch error:", err);
        setExistingItems([]); // Fallback to empty array to prevent .filter crash
      });

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editData) {
      setSearchTerm(editData.name || "");

      // Determine if the item is already in the menu
      const isAlreadyInMenu = !!editData.menuItemId;
      setSyncWithMenu(isAlreadyInMenu);

      setFormData({
        name: editData.name || "",
        quantity: editData.currentStock || "",
        unit: editData.unit || "pcs",
        type: editData.type || "FOOD",
        purchasePrice: editData.lastPurchasePrice || "",
        category: editData.category || "GENERAL",
      });

      setPortionSize(editData?.portionSize || "");
      setSellingPrice(editData.sellingPrice || "");
    }
  }, [editData]);

  // Filter items for the search dropdown
  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    return existingItems.filter((i: any) =>
      i?.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, existingItems]);

  const handleSelect = (item: any) => {
    setFormData({
      ...formData,
      name: item.name,
      type: item.type,
      unit: item.unit,
      category: item.category || "GENERAL",
    });
    setSearchTerm(item.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        name: searchTerm,
        quantity: Number(formData.quantity),
        purchasePrice: Number(formData.purchasePrice),
        syncWithMenu,
        sellingPrice: syncWithMenu ? Number(sellingPrice) : "0",
        portionSize: syncWithMenu ? Number(portionSize) : 1,
      };

      if (editData) {
        // UPDATE MODE
        await api.patch(`/inventory/stocks/${editData.id}`, payload);
        toast.success("Stock details updated");
      } else {
        // CREATE MODE
        await api.post("/inventory/stock-in", payload);
        toast.success("Stock added successfully");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   try {
  //     await api.post("/inventory/stock-in", {
  //       ...formData,
  //       name: searchTerm || formData.name,
  //       quantity: Number(formData.quantity),
  //       purchasePrice: Number(formData.purchasePrice),
  //     });
  //     onSuccess();
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="bg-white w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white">
            <PackagePlus size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {editData ? "Edit Stock Item" : "Stock Inbound"}
            </h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              Inventory Management
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Item Selection */}
        <div className="space-y-2 relative" ref={dropdownRef}>
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-900   uppercase ">
            <Search size={12} className="text-slate-400" />
            Search or Create Item
          </label>
          <input
            required
            className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            placeholder="Search SKU or type new name..."
          />

          {showDropdown && filteredItems.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto overflow-x-hidden">
              {filteredItems.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full p-3 hover:bg-slate-50 flex justify-between items-center text-left transition-colors border-b border-slate-50 last:border-0"
                >
                  <span className="text-sm font-semibold text-slate-900  uppercase">
                    {item.name}
                  </span>
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tags size={16} className="text-indigo-600" />
              <span className="text-xs font-bold text-indigo-900 uppercase">
                Sync with Customer Menu?
              </span>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 accent-indigo-600 cursor-pointer"
              checked={syncWithMenu}
              onChange={(e) => setSyncWithMenu(e.target.checked)}
            />
          </div>

          {syncWithMenu && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
              {/* Selling Price */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-indigo-700 uppercase">
                  Selling Price (Menu)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    className="w-full pl-8 pr-4 py-2 bg-white rounded-lg border border-indigo-200 text-sm font-bold text-indigo-900 outline-none"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Portion Size */}
              {!editData && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-indigo-700 uppercase">
                    Portion Size (Deduction)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      step="0.001"
                      required
                      className="w-full px-4 py-2 bg-white rounded-lg border border-indigo-200 text-sm font-bold text-indigo-900 outline-none"
                      value={portionSize}
                      onChange={(e) => setPortionSize(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-400 uppercase">
                      {formData.unit}
                    </span>
                  </div>
                </div>
              )}

              <p className="col-span-2 text-[9px] text-indigo-500 italic">
                * 1 Order will deduct {portionSize} {formData.unit} from stock.
              </p>
            </div>
          )}
        </div>
        {/* Quantities Group */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-900   uppercase ">
              <Scale size={12} className="text-slate-400" />
              Quantity
            </label>
            <input
              required
              type="number"
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-medium text-sm focus:border-indigo-500 outline-none"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-900   uppercase ">
              Unit
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs uppercase outline-none cursor-pointer"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
            >
              <option value="pcs">Pieces (PCS)</option>
              <option value="kg">Kilograms (KG)</option>
              <option value="ml">Milliliters (ML)</option>
              <option value="ltr">Liters (LTR)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* //category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-900   uppercase ">
              <ClipboardList size={12} className="text-slate-400" />
              Category
            </label>
            <CategoryCombobox
              options={categories}
              value={formData.category}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  category: val.toUpperCase(), // Maintain consistency
                })
              }
            />
            {/* <input
              placeholder="e.g. BEVERAGES, VEGETABLES..."
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-medium text-sm focus:border-indigo-500 outline-none uppercase"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value.toUpperCase(),
                })
              }
            /> */}
          </div>
          {/* Pricing */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-bold text-slate-900   uppercase ">
              <IndianRupee size={12} className="text-slate-400" />
              Purchase Price per "{formData.unit}"
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 font-medium text-sm focus:border-indigo-500 outline-none"
              value={formData.purchasePrice}
              onChange={(e) =>
                setFormData({ ...formData, purchasePrice: e.target.value })
              }
            />
            <p className="text-[10px] text-slate-400 font-medium  ">
              * This value will be used for inventory valuation.
            </p>
          </div>
        </div>
        {/* food or drinks Selector */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-900   uppercase ">
            <Tags size={12} className="text-slate-400" />
            Classification
          </label>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            {["FOOD", "DRINKS"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ ...formData, type: t as any })}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                  formData.type === t
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-900  "
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant={"terminalGhost"}
            className="flex-[2] h-12"
            // className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant={"default"}
            className={`flex-[8] h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm`}
            // className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-200 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : editData ? (
              "Update Stock"
            ) : (
              "Finalize Entry"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
