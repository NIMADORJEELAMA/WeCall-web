"use client";

import { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { AgGridReact as AgGridReactType } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "@/lib/agGrid";

import { Pencil, Trash2, Search, Utensils } from "lucide-react";
import GenericDropdown from "../ui/GenericDropdown";
import StatusToggle from "../ui/StatusToggle";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: "FOOD" | "DRINKS";
  isVeg: boolean;
  isActive: boolean;
  createdAt: string;
  portionSize: number;
  requiresPreparation: boolean;
}

interface Props {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
}

export default function EnterpriseMenuTable({
  items,
  onEdit,
  onDelete,
}: Props) {
  const gridRef = useRef<AgGridReactType>(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<boolean | "ALL">(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const menuTypes = [
    { id: "FOOD", name: "Food Items" },
    { id: "DRINKS", name: "Drinks" },
  ];
  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((i) => i.category)));

    return unique.map((c) => ({
      id: c,
      name: c,
    }));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const typeMatch = selectedType === "ALL" || item.type === selectedType;
      const statusMatch =
        selectedStatus === "ALL" || item.isActive === selectedStatus;

      const categoryMatch =
        selectedCategory === "ALL" || item.category === selectedCategory;

      return typeMatch && statusMatch && categoryMatch;
    });
  }, [items, selectedType, selectedStatus, selectedCategory]);
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    const filterInstance =
      typeId === "ALL"
        ? null
        : {
            filterType: "text",
            type: "equals",
            filter: typeId,
          };
    gridRef.current?.api
      .setColumnFilterModel("type", filterInstance)
      .then(() => {
        gridRef.current?.api.onFilterChanged();
      });
  };
  const handleStatusChange = (status: boolean | "ALL") => {
    setSelectedStatus(status);

    if (status === "ALL") {
      gridRef.current?.api.setColumnFilterModel("isActive", null);
    } else {
      gridRef.current?.api.setColumnFilterModel("isActive", {
        filterType: "number",
        type: "equals",
        filter: status ? 1 : 0,
      });
    }

    gridRef.current?.api.onFilterChanged();
  };
  /* ================= COLUMN DEFINITIONS ================= */

  const columnDefs = useMemo<ColDef<MenuItem>[]>(
    () => [
      {
        headerName: "Item",
        field: "name",
        flex: 1.6,
        // 1. Align cell container to the start (left)
        cellClass: "flex items-center justify-start px-4",
        cellRenderer: (params: any) => {
          const row = params.node.data;
          if (!row) return params.value;

          return (
            // 2. Use items-center for vertical alignment, justify-start for horizontal
            <div className="flex items-center justify-start gap-3 py-1 w-full h-full">
              {/* Veg / Non Veg Dot */}
              <div
                className={`w-3 h-3 rounded-[2px] border flex-shrink-0 ${
                  row.isVeg
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-red-500 bg-red-500"
                }`}
              />

              {/* Item Info */}
              <div className="flex flex-col leading-tight items-start">
                <span className="font-semibold text-slate-800 text-sm">
                  {row.name}
                </span>
                {/* Optional: Add category here if you want it under the name */}
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Category",
        field: "name",
        flex: 1.6,
        // 1. Align cell container to the start (left)
        cellClass: "flex items-center justify-start px-4",
        cellRenderer: (params: any) => {
          const row = params.node.data;
          if (!row) return params.value;

          return (
            // 2. Use items-center for vertical alignment, justify-start for horizontal
            <div className="flex items-center justify-start gap-3 py-1 w-full h-full">
              <div className="flex flex-col leading-tight items-start">
                <span className="text-[10px] text-slate-800 uppercase font-bold">
                  {row.category}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Type",
        field: "type",
        width: 180,
        cellClass: "flex items-center justify-start px-4", // Vertical centering
        cellRenderer: (params: any) => {
          const isFood = params.value === "FOOD";

          return (
            <span
              className={`px-3 py-1 text-[10px] font-black   uppercase tracking-wider ${
                isFood
                  ? "  text-orange-600 border-orange-100"
                  : "  text-blue-600 border-blue-100"
              }`}
            >
              {params.value}
            </span>
          );
        },
      },
      {
        headerName: "Created On",
        field: "createdAt",
        filter: false,
        width: 150,
        // filter: "agDateColumnFilter",
        valueFormatter: (params) =>
          params.value
            ? new Date(params.value).toLocaleDateString("en-GB")
            : "",
      },
      {
        headerName: "Status",
        field: "isActive",
        width: 140,
        filter: true,
        valueFormatter: (params) => (params.value ? "Active" : "Disabled"),
        cellRenderer: (params: any) => {
          if (params.node.isRowPinned()) return null;

          return (
            <span
              className={`px-3 py-1 text-xs font-semibold rounded ${
                params.value
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {params.value ? "Active" : "Disabled"}
            </span>
          );
        },
      },
      {
        headerName: "Price",
        field: "price",
        width: 160,
        filter: false,
        cellClass: (params: any) =>
          params.node.isRowPinned()
            ? "text-right font-black text-emerald-800"
            : "text-right font-semibold text-slate-900",
        valueFormatter: (params) => {
          // 1. Check if the row is pinned
          if (params?.node?.isRowPinned()) {
            return " "; // Return empty string for the total row
          }

          // 2. Format normally for regular rows
          return params.value ? `₹${params.value.toLocaleString()}` : "";
        },
      },
      {
        headerName: "Actions",
        field: "id",
        width: 110,
        pinned: "right",
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          if (params.node.isRowPinned()) return null;

          return (
            <div className="flex justify-end gap-1">
              <button
                onClick={() => onEdit(params.data!)}
                className="p-2 mt-2 rounded hover:text-slate-400 cursor-pointer"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => onDelete(params.data!)}
                className="p-2 mt-2 rounded text-red-600  hover:text-red-400 cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete],
  );

  /* ================= DEFAULT COLUMN ================= */

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
    }),
    [],
  );

  /* ================= PINNED TOTAL ROW ================= */

  const pinnedBottomRowData = useMemo(() => {
    if (!items.length) return [];

    return [
      {
        name: "TOTALS",
        price: items.reduce((sum, item) => sum + (item.price || 0), 0),
        type: "",
        createdAt: "",
        isActive: "",
      },
    ];
  }, [items]);

  /* ================= RENDER ================= */

  return (
    <div className="space-y-4">
      <div className="justify-end w-full">
        <div className="flex items-center gap-3 justify-end">
          <GenericDropdown
            options={menuTypes}
            selectedValue={selectedType}
            onSelect={handleTypeChange}
            allLabel="All Types"
            icon={Utensils}
          />
          <GenericDropdown
            options={categories}
            selectedValue={selectedCategory}
            onSelect={handleCategoryChange}
            allLabel="All Categories"
          />
          <div className="flex items-center gap-2">
            <StatusToggle
              isActive={selectedStatus === true}
              onChange={handleStatusChange}
            />
          </div>
        </div>
      </div>

      <div
        className="ag-theme-quartz enterprise-grid"
        style={{ height: "80vh", width: "100%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={filteredItems}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={20}
          animateRows
          rowSelection="single"
          // pinnedBottomRowData={pinnedBottomRowData}
        />
      </div>
    </div>
  );
}
