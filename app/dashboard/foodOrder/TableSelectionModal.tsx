"use client";
import React, { useState, useMemo } from "react";
import { X, LayoutGrid, Info } from "lucide-react";
import { twMerge } from "tailwind-merge";
import GenericDropdown from "@/components/ui/GenericDropdown";
import { SearchBar } from "@/components/ui/SearchBar";
import MarchCalendarDemo from "@/components/MarchCalendarDemo";

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: any[];
  categoriesTable: any[];
  onSelect: (table: any) => void;
}

export default function TableSelectionModal({
  isOpen,
  onClose,
  tables,
  categoriesTable,
  onSelect,
}: TableSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("ALL");

  const roomOptions = categoriesTable.map((cat) => ({
    id: cat.name.split(" (")[0],
    name: cat.name,
  }));

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesSearch =
        table.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        table.room?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRoom =
        selectedRoom === "ALL" ||
        table.room?.name === selectedRoom ||
        table.category?.name === selectedRoom;

      return matchesSearch && matchesRoom;
    });
  }, [tables, searchQuery, selectedRoom]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col min-h-[95vh] sm:h-auto max-h-[90vh] overflow-hidden border border-white">
        {/* Header - Adjusted padding for mobile */}
        <div className="p-4 sm:p-8 border-b border-slate-100 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-600 rounded-xl sm:rounded-2xl text-white shadow-lg shadow-blue-200">
              <LayoutGrid size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">
                Select Table
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {tables.length} Total
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-3 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all"
          >
            <X size={20} className="text-slate-400 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Filter Bar - Stacked on mobile, row on desktop */}
        <div className="px-4 py-3 sm:px-8 sm:py-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:min-w-[200px]">
            <GenericDropdown
              options={roomOptions}
              selectedValue={selectedRoom}
              onSelect={(val) => setSelectedRoom(val)}
              allLabel="All Rooms"
            />
          </div>
        </div>

        {/* Table Grid - 2 columns on mobile, scaling up to 4 */}
        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto rounded-b-[2rem] p-4 sm:p-8 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 bg-white">
          {filteredTables.map((table) => {
            const isOccupied = table.status === "OCCUPIED";
            const waiter = table.activeOrder?.waiterName || "Staff";
            const total = table.activeOrder?.runningTotal || 0;
            const items = table.activeOrder?.itemCount || 0;

            return (
              <button
                key={table.id}
                onClick={() => {
                  onSelect(table);
                  onClose();
                }}
                className={twMerge(
                  "relative flex flex-col justify-between text-left overflow-hidden",
                  "p-4 sm:p-6 rounded-2xl border transition-all duration-300",
                  "min-h-[130px] sm:min-h-[170px] cursor-pointer",

                  // Base style
                  "bg-white/80 backdrop-blur-sm",

                  // Shadow + hover
                  "shadow-sm hover:shadow-xl active:scale-[0.97]",

                  isOccupied
                    ? "border-red-200 bg-gradient-to-br from-red-50 to-white hover:shadow-red-200/40"
                    : "border-slate-200 bg-gradient-to-br from-green-50 to-white  hover:border-blue-500 hover:shadow-blue-200/40 hover:-translate-y-1",
                )}
              >
                {/* Top Content */}
                <div>
                  <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 truncate">
                    {table.room?.name || "No Room"}
                  </span>

                  <h3 className="text-base sm:text-xl font-extrabold text-slate-800 leading-tight truncate">
                    {table.name}
                  </h3>
                </div>

                {/* Bottom Content */}
                {isOccupied ? (
                  <div className="mt-4 pt-3 border-t border-red-200/60 space-y-2">
                    {/* Waiter */}
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center text-[10px] font-bold text-red-800">
                        {waiter.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-slate-600 truncate">
                        {waiter}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                        {items} Items
                      </span>
                      <span className="text-sm sm:text-lg font-extrabold text-slate-900">
                        ₹{total}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Available
                    </div>
                  </div>
                )}

                {/* Status Indicator Dot (top-right) */}
                <div
                  className={twMerge(
                    "absolute top-3 right-3 w-2.5 h-2.5 rounded-full",
                    isOccupied ? "bg-red-500" : "bg-emerald-500",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Footer Info - Hidden/Simplified on tiny screens */}
        <div className="px-4 py-3 sm:px-8 sm:py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium">
            <Info size={14} className="shrink-0" />
            <span className="truncate">Select table to begin KOT</span>
          </div>
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest shrink-0">
            {filteredTables.length} Found
          </span>
        </div>
      </div>
    </div>
  );
}
