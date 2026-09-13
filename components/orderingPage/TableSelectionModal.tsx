"use client";
import React, { useState, useMemo } from "react";
import { Search, X, MapPin, Hash } from "lucide-react";

interface TableSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: any[];
  onSelect: (table: any) => void;
}

export default function TableSelectionModal({
  isOpen,
  onClose,
  tables,
  onSelect,
}: TableSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTables = useMemo(() => {
    return tables.filter((table) =>
      table.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [tables, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Select Table</h2>
            <p className="text-sm text-gray-500">
              Choose a location for the order
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search table or room name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Table Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredTables.length > 0 ? (
            filteredTables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  onSelect(table);
                  onClose();
                }}
                className={`flex flex-col p-4 rounded-xl border-2 transition-all text-left hover:border-blue-500 hover:bg-blue-50 group
                  ${table.status === "OCCUPIED" ? "opacity-60 grayscale-[0.5]" : "bg-white border-gray-100"}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600">
                    <Hash size={16} />
                  </span>
                  {table.category && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                      style={{
                        backgroundColor: table.category.color || "#3B82F6",
                      }}
                    >
                      {table.category.name}
                    </span>
                  )}
                </div>

                <span className="font-bold text-gray-900 group-hover:text-blue-700 truncate">
                  {table.name}
                </span>

                <div className="flex items-center mt-1 text-gray-500 text-xs">
                  <MapPin size={12} className="mr-1" />
                  <span className="truncate">
                    {table.room?.name || "Main Area"}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-gray-500">
              No tables found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
