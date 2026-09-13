"use client";
import {
  Pencil,
  Utensils,
  Beer,
  MoreHorizontal,
  Leaf,
  Flame,
  Calendar,
  Link as LinkIcon,
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: "FOOD" | "DRINKS";
  isVeg: boolean;
  isActive: boolean;
  createdAt: string;
  inventoryItemId: string | null;
  portionSize: number;
}

interface MenuTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;

  onDelete: (item: MenuItem) => void; // Add this prop for delete action
}

export default function MenuTable({ items, onEdit, onDelete }: MenuTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dietFilter, setDietFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesCategory =
        categoryFilter === "ALL" || item.category === categoryFilter;
      const matchesDiet =
        dietFilter === "ALL" ||
        (dietFilter === "VEG" && item.isVeg) ||
        (dietFilter === "NON-VEG" && !item.isVeg);

      return matchesSearch && matchesType && matchesCategory && matchesDiet;
    });
  }, [items, searchQuery, categoryFilter, typeFilter, dietFilter]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const categories = [
    "ALL",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];
  const Type = ["ALL", ...Array.from(new Set(items.map((i) => i.type)))];
  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search items or categories..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label
            htmlFor="type"
            className="text-xs font-medium text-slate-600 font-bold"
          >
            Type :
          </label>
          <select
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {Type.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <label
            htmlFor="category"
            className="text-xs font-medium text-slate-600 font-bold"
          >
            Category :
          </label>
          <select
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none cursor-pointer"
            value={dietFilter}
            onChange={(e) => {
              setDietFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Dietary</option>
            <option value="VEG">Veg Only</option>
            <option value="NON-VEG">Non-Veg</option>
          </select>

          <div>
            <button
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("ALL");
                setTypeFilter("ALL");
                setDietFilter("ALL");
                setCurrentPage(1);
              }}
            >
              <FilterX />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    // layout
                    // initial={{ opacity: 0, x: -20 }}
                    // animate={{ opacity: 1, x: 0 }}
                    // exit={{ opacity: 0, scale: 0.95 }}
                    // transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* ... [TD content remains the same as previous response] ... */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`relative p-2.5 rounded-xl shrink-0 ${item.type === "FOOD" ? "bg-orange-50 text-orange-600" : "bg-indigo-50 text-indigo-600"}`}
                        >
                          {item.type === "FOOD" ? (
                            <Utensils size={18} />
                          ) : (
                            <Beer size={18} />
                          )}
                          {item.type === "FOOD" && (
                            <div
                              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${item.isVeg ? "bg-green-500" : "bg-red-500"}`}
                            >
                              {item.isVeg ? (
                                <Leaf size={8} className="text-white" />
                              ) : (
                                <Flame size={8} className="text-white" />
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-blue-600 transition-colors uppercase">
                            {item.name}
                          </p>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
                            <Calendar size={10} />{" "}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          {item.inventoryItemId && (
                            <span className="flex items-center gap-1 text-[10px] text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded-md">
                              <LinkIcon size={10} /> Linked
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-tight">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                        />
                        <span
                          className={`text-xs font-semibold ${item.isActive ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          {item.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                      ₹{item.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* <button
                        onClick={() => onEdit(item)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Pencil size={16} />
                      </button> */}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(item)} // Add this prop to MenuTable
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {/* EMPTY STATE */}
          {filteredItems.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <FilterX size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">
                No menu items match your filters
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Page {currentPage} of {totalPages || 1} — {filteredItems.length}{" "}
            Total Items
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Simple Page Numbers */}
            <div className="flex items-center gap-1">
              {[...Array(totalPages)]
                .map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-100"}`}
                  >
                    {i + 1}
                  </button>
                ))
                .slice(
                  Math.max(0, currentPage - 3),
                  Math.min(totalPages, currentPage + 2),
                )}
            </div>

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
