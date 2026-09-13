"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import Papa from "papaparse";
import * as XLSX from "xlsx";
// UI Components
import { DatePicker, Card, Statistic, Tag, Spin, Space } from "antd";
import { Button } from "@/components/ui/button";
import {
  Package,
  Plus,
  RefreshCcw,
  Search,
  Beer,
  Utensils,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  Trash2,
  Edit3,
  Pencil,
  Download,
  Upload,
} from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";

// AG Grid & Recharts
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridReadyEvent } from "ag-grid-community";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import "@/lib/agGrid";

import StockInForm from "@/components/StockInForm";

import BulkStockModal from "./BulkStockModal";
import { useMenu } from "@/hooks/useMenu";

const { RangePicker } = DatePicker;

export default function StockManagementPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null,
  );
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, LOW, MID, HEALTHY
  // 1. Check if filter should be active
  const isExternalFilterPresent = useCallback(() => {
    return statusFilter !== "ALL";
  }, [statusFilter]);
  const { data: menuItems = [], isLoading } = useMenu();
  const uniqueCategories = useMemo(() => {
    // Add a type cast to ensure categories is treated as string[]
    const categories = menuItems.map((i: any) =>
      String(i.category),
    ) as string[];
    return Array.from(new Set(categories)).sort();
  }, [menuItems]);
  // 2. Logic for the filter
  const doesExternalFilterPass = useCallback(
    (node: any) => {
      if (statusFilter === "ALL") return true;

      const qty = node.data.currentStock;
      const status = qty < 10 ? "LOW" : qty < 30 ? "MID" : "HEALTHY";

      return status === statusFilter;
    },
    [statusFilter],
  );
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/stocks", {
        params: {
          type: typeFilter === "ALL" ? undefined : typeFilter,
          startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
          endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
        },
      });
      console.log("res", res);
      setItems(res.data?.items);
    } catch (err) {
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateRange]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const downloadExcelTemplate = () => {
    const data = [
      [
        "Name",
        "Quantity",
        "Unit (pcs|kg|ltr|ml)",
        "Type (FOOD|DRINKS)",
        "PurchasePrice per unit",
        "SellingPrice per unit",
        "Category",
        "IsVeg (TRUE|FALSE)",
        "SyncWithMenu (TRUE|FALSE)",
      ],
      [
        "PEPSI 500ML",
        "24",
        "pcs",
        "DRINKS",
        "35",
        "50",
        "BEVERAGES",
        "TRUE",
        "TRUE",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Column widths (wch = width in characters)
    worksheet["!cols"] = [
      { wch: 35 }, // Name
      { wch: 12 }, // Quantity
      { wch: 20 }, // Unit
      { wch: 20 }, // Type
      { wch: 16 }, // PurchasePrice
      { wch: 16 }, // SellingPrice
      { wch: 25 }, // Category
      { wch: 18 }, // IsVeg
      { wch: 25 }, // SyncWithMenu
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Template");

    XLSX.writeFile(workbook, "inventory_template.xlsx");
  };
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        // XLSX can read both .csv and .xlsx
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(ws);

        // Map headers to your internal state keys
        const mappedData = rawData.map((row: any) => ({
          name: row["Name"] || "",
          quantity: row["Quantity"] || 0,
          unit: row["Unit (pcs|kg|ltr|ml)"] || "pcs",
          type:
            row["Type (FOOD|DRINKS)"]?.toUpperCase() === "DRINKS"
              ? "DRINKS"
              : "FOOD",
          purchasePrice: row["PurchasePrice"] || 0,
          sellingPrice: row["SellingPrice"] || 0,
          category: row["Category"] || "GENERAL",
          isVeg: String(row["IsVeg (TRUE|FALSE)"]).toLowerCase() === "true",
          syncWithMenu:
            String(row["SyncWithMenu (TRUE|FALSE)"]).toLowerCase() === "true",
        }));

        setPreviewData(mappedData);
        setIsPreviewOpen(true);
        e.target.value = ""; // Reset input
      } catch (err) {
        toast.error(
          "Error reading file. Please ensure it is a valid Excel or CSV.",
        );
        console.error(err);
      }
    };

    reader.readAsBinaryString(file);
  };
  const handleConfirmUpload = async (finalData: any[]) => {
    try {
      setIsUploading(true);

      // This payload now contains everything needed for both tables
      const payload = finalData.map((item) => ({
        name: item.name,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        type: item.type,
        purchasePrice: parseFloat(item.purchasePrice),
        sellingPrice: parseFloat(item.sellingPrice),
        category: item.category,
        syncWithMenu: item.syncWithMenu,
        isVeg: item.isVeg,
        reason: "Bulk Retail Import",
      }));

      // Change the endpoint to your new linked import endpoint
      await api.post("/inventory/bulk-retail", { items: payload });

      toast.success(`Imported and Linked ${payload.length} items`);
      setIsPreviewOpen(false);
      fetchInventory();
    } catch (err) {
      toast.error("Failed to link items. Ensure CSV headers are correct.");
    } finally {
      setIsUploading(false);
    }
  };
  // const handleConfirmUpload = async (finalData: any[]) => {
  //   try {
  //     setIsUploading(true);
  //     // Transform data back to match your backend DTO
  //     const payload = finalData.map((item) => ({
  //       name: item.name,
  //       quantity: parseFloat(item.quantity),
  //       unit: item.unit || "PCS",
  //       type: item.type,
  //       purchasePrice: parseFloat(item.price),
  //       reason: "Bulk Import",
  //     }));

  //     await api.post("/inventory/bulk-stocks", { items: payload });
  //     toast.success(`Successfully imported ${payload.length} items`);
  //     setIsPreviewOpen(false);
  //     fetchInventory();
  //   } catch (err) {
  //     toast.error("Failed to upload data. Please check your inputs.");
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };
  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      // inside columnDefs
      {
        headerName: "Stock Detail",
        field: "name",
        flex: 1.5,
        minWidth: 220,
        cellRenderer: (params: any) => (
          <div className="flex flex-col justify-center h-full leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 uppercase">
                {params.value}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
              <span>SKU-{params.data.id.split("-")[0]}</span>
              {params.data.menuItemId && (
                <span className="text-green-600">• Linked </span>
              )}
            </div>
          </div>
        ),
      },
      {
        headerName: "Type",
        field: "type",
        width: 160,
        filter: false,
        // Using cellClass for vertical centering
        cellClass: "flex items-center mt-2",
        cellRenderer: (params: any) => {
          const isAlcohol = params.value === "DRINKS";
          return (
            <Tag
              color={isAlcohol ? "purple" : "orange"}
              // icon={isAlcohol ? <Beer size={10} /> : <Utensils size={10} />}
              className="m-0"
            >
              {params.value}
            </Tag>
          );
        },
      },
      {
        headerName: "Stock Level",
        field: "currentStock",
        flex: 1,
        filter: false,
        minWidth: 200,
        cellRenderer: (params: any) => {
          const qty = params.value;
          const status = qty < 10 ? "LOW" : qty < 30 ? "MID" : "HEALTHY";
          const color =
            status === "LOW"
              ? "#ef4444"
              : status === "MID"
                ? "#f59e0b"
                : "#10b981";
          return (
            <div className="flex flex-col justify-center h-full w-full pr-4">
              <div className="flex justify-between text-[10px] font-bold mb-1">
                <span>
                  {qty} {params.data.unit}
                </span>
                <span style={{ color }}>{status}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(qty, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Category",
        field: "category",
        width: 140,
        filter: false,
        cellClass: "flex items-center font-medium text-slate-600",
        cellRenderer: (p: any) => (
          <span>{p.value?.toLocaleString() || "GENERAL"}</span>
        ),
      },
      {
        headerName: "Last Purchase",
        field: "lastPurchasePrice",
        width: 140,
        filter: false,
        cellClass: "flex items-center font-medium text-slate-600",
        cellRenderer: (p: any) => (
          <span>₹{p.value?.toLocaleString() || "0"}</span>
        ),
      },
      {
        headerName: "Last Updated",
        field: "lastStockInDate",
        width: 160,
        filter: false,
        cellClass: "flex items-center text-slate-500 text-xs",
        cellRenderer: (p: any) => (
          <span>
            {p.value ? dayjs(p.value).format("DD/MM/YYYY, hh:mm A") : "---"}
          </span>
        ),
      },
      {
        headerName: "Value (Equity)",
        filter: false,
        // Note: valueGetter is better for sorting/filtering
        valueGetter: (p) => p.data.currentStock * p.data.lastPurchasePrice,
        width: 180,
        // FIX: Added cellClass for vertical and horizontal alignment
        cellClass: "flex items-center font-bold text-slate-700  ",
        cellRenderer: (p: any) => (
          <span className="mt-2">₹{p.value.toLocaleString()}</span>
        ),
      },
      {
        headerName: "Actions",
        width: 150,
        filter: false,
        pinned: "right",
        // FIX: Added cellClass to center the buttons
        cellClass: "flex items-center justify-center mt-1",
        cellRenderer: (params: any) => (
          <Space size="small">
            <button
              onClick={() => {
                setEditingItem(params.data);
                setIsModalOpen(true);
              }}
              className="p-2 mt-2 rounded hover:text-slate-400 cursor-pointer"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(params.data.id, params.data.name)}
              className="p-2 mt-2 rounded text-red-600  hover:text-red-400 cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
          </Space>
        ),
      },
    ],
    [],
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}?`)) return;
    try {
      await api.delete(`/inventory/stocks/${id}`);
      toast.success("Item deleted");
      fetchInventory();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const chartData = useMemo(() => items.slice(0, 8), [items]);

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={"default"}
              onClick={() => setIsModalOpen(true)}
              className="bg-slate-900 h-12 rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              <Plus size={18} className="mr-2" /> Add New Stock
            </Button>

            {/* Import CSV Button */}
          </div>
          {/* <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
              <Package size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Stock{" "}
              <span className="text-slate-400 font-medium">Logistics</span>
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time inventory valuation and asset tracking
          </p> */}
        </div>
        <BulkStockModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          data={previewData}
          onConfirm={handleConfirmUpload}
          isPending={isUploading}
        />
        <div>
          {/* Hidden File Input */}
          <input
            type="file"
            id="csv-upload"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            onChange={handleCSVUpload}
          />

          {/* Download Template Button */}
          <Button
            variant="terminalGhost"
            onClick={downloadExcelTemplate}
            className=" mr-4"
          >
            <div className="flex items-center gap-2">
              <Download size={14} />
              Download Template
            </div>
          </Button>
          <Button
            variant="terminalGhost"
            onClick={() => document.getElementById("csv-upload")?.click()}
            // className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-100"
          >
            <Upload className="mr-2" size={18} />
            Bulk Stock In
          </Button>
        </div>
      </div>

      {/* ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <Card className="rounded-2xl border-none shadow-sm">
            <Statistic
              title={
                <span className="text-[12px] font-extrabold uppercase text-slate-900">
                  Total Equity
                </span>
              }
              value={Number(
                items
                  .reduce(
                    (acc, curr: any) =>
                      acc + curr.currentStock * curr.lastPurchasePrice,
                    0,
                  )
                  .toFixed(2), // Fixes the trailing decimals to 2 places
              )}
              prefix={<IndianRupee size={14} />}
            />
          </Card>
          <Card className="rounded-2xl border-none shadow-sm">
            <Statistic
              title={
                <span className="text-[12px] font-extrabold uppercase text-slate-900">
                  Low Stock
                </span>
              }
              value={items.filter((i: any) => i.currentStock < 10).length}
              suffix={<AlertCircle size={14} className="text-red-500" />}
            />
          </Card>
          <div className="col-span-2 bg-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 uppercase font-bold">
                Health Score
              </p>
              <h3 className="text-2xl font-black">94.2%</h3>
            </div>
            <TrendingUp size={32} className="opacity-40" />
          </div>
        </div>

        <Card
          className="lg:col-span-8 rounded-2xl border-none shadow-sm"
          styles={{ body: { padding: "12px" } }}
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="currentStock"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* CONTROL CENTER */}
      <div className="  p-3   flex flex-col lg:flex-row items-center gap-4">
        <SearchBar
          placeholder="Filter by SKU or Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          containerClassName="flex-1"
        />
        {/* STOCK STATUS FILTER */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["ALL", "LOW", "MID", "HEALTHY"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-3 rounded-lg text-[10px] font-black transition-all ${
                statusFilter === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {/* Optional: Add colored dots for visual cue */}
              <span className="flex items-center gap-2">
                {s !== "ALL" && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      s === "LOW"
                        ? "bg-red-500"
                        : s === "MID"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  />
                )}
                {s}
              </span>
            </button>
          ))}
        </div>

        <RangePicker
          className="h-12 rounded-xl border-slate-200"
          value={dateRange}
          onChange={(vals) => setDateRange(vals as any)}
        />

        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["ALL", "FOOD", "DRINKS"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-6 py-3 rounded-lg text-[10px] font-black transition-all ${typeFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <Button
          variant={"terminalGhost"}
          onClick={fetchInventory}
          // className="h-12 w-12 flex items-center justify-center rounded-xl bg-slate-900 text-white border-none"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* AG GRID DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="ag-theme-quartz w-full h-[500px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <AgGridReact
              rowData={items}
              columnDefs={columnDefs}
              quickFilterText={search}
              pagination={true}
              paginationPageSize={20}
              rowHeight={60}
              headerHeight={50}
              // This ensures all columns inherit vertical centering
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true,
                cellClass: "flex items-center",
              }}
              isExternalFilterPresent={isExternalFilterPresent}
              doesExternalFilterPass={doesExternalFilterPass}
            />
          )}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <StockInForm
            categories={uniqueCategories}
            editData={editingItem}
            onClose={() => {
              setIsModalOpen(false);
              setEditingItem(null);
            }}
            onSuccess={() => {
              fetchInventory();
              setIsModalOpen(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
