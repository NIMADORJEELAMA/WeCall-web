"use client";

import { useState, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import type { AgGridReact as AgGridReactType } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "@/lib/agGrid";

import { useBillHistory } from "@/hooks/useHistory";
import {
  Search,
  Loader2,
  RotateCcw,
  Eye,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs";
import BillReceiptModal from "@/components/Bills/BillReceiptModal";
import { Button } from "@/components/ui/button";
import GenericDropdown from "@/components/ui/GenericDropdown";
import ConfirmPaymentModal from "./ConfirmPaymentModal";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";

const { RangePicker } = DatePicker;
const status_options = [
  { id: "PAID", name: "PAID" },
  { id: "PENDING", name: "PENDING" },
  { id: "CANCELLED", name: "CANCELLED" },
  { id: "COMPLETED", name: "COMPLETED" },
  { id: "BILLED", name: "BILLED" },
  { id: "DUE", name: "DUE" },
];

export default function BillHistoryPage() {
  const queryClient = useQueryClient();
  const gridRef = useRef<AgGridReactType>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchBuffer, setSearchBuffer] = useState("");
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);

  const [queryDates, setQueryDates] = useState({
    start: dateRange[0].format("YYYY-MM-DD"),
    end: dateRange[1].format("YYYY-MM-DD"),
  });

  const { data, isFetching } = useBillHistory(queryDates.start, queryDates.end);

  const applyFilters = () => {
    setQueryDates({
      start: dateRange[0].format("YYYY-MM-DD"),
      end: dateRange[1].format("YYYY-MM-DD"),
    });
  };

  const resetToToday = () => {
    const today = dayjs();
    setDateRange([today, today]);
    setQueryDates({
      start: today.format("YYYY-MM-DD"),
      end: today.format("YYYY-MM-DD"),
    });
  };
  // Inside BillHistoryPage component
  const handlePaymentSubmit = async (orderId: string, payload: any) => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Processing Payment...");

    try {
      // Calling your specific API endpoint
      await api.patch(`/orders/${orderId}/confirm-payment`, payload);

      toast.dismiss(loadingToast);
      toast.success("Payment successful!");
      await queryClient.invalidateQueries({ queryKey: ["bill-history"] });
      setPaymentOrder(null); // Close the modal

      // REFRESH DATA:
      // If using TanStack Query, use: queryClient.invalidateQueries(['billHistory']);
      // Otherwise, call your manual refresh/fetch function here:
      applyFilters();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Payment confirmation failed");
      console.error("Payment Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "ALL") return data;
    return data.filter((bill: any) => bill.status === statusFilter);
  }, [data, statusFilter]);

  /* ================= PINNED TOTAL ROW ================= */
  const pinnedBottomRowData = useMemo(() => {
    if (!filteredData.length) return [];

    const totals = filteredData.reduce(
      (acc: any, item: any) => {
        acc.totalAmount += Number(item.totalAmount || 0);
        acc.amountCash += Number(item.amountCash || 0);
        acc.amountOnline += Number(item.amountOnline || 0);
        return acc;
      },
      { totalAmount: 0, amountCash: 0, amountOnline: 0 },
    );

    return [
      {
        isPinnedRow: true,
        table: { number: "TOTAL" },
        totalAmount: totals.totalAmount,
        amountCash: totals.amountCash, // Added
        amountOnline: totals.amountOnline, // Added
        status: "",
        paymentMode: "",
        updatedAt: null,
      },
    ];
  }, [filteredData]);

  /* ================= COLUMN DEFINITIONS ================= */
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Order Details",
        flex: 1,
        // valueGetter makes both Table # and ID searchable in the column filter
        valueGetter: (params) => {
          if (params.data?.isPinnedRow) return "TOTAL";
          return `${params.data?.table?.number} ${params.data?.id}`;
        },
        filter: "agTextColumnFilter",
        floatingFilter: true, // Adds search bar right under header
        cellRenderer: (params: any) => {
          const row = params.data;
          if (!row) return null;
          if (row.isPinnedRow)
            return (
              <span className="font-black text-slate-600 tracking-widest">
                GRAND TOTAL
              </span>
            );

          const tableDisplay = row.table?.number || "N/A";
          const shortId = row.id ? row.id.slice(-5).toUpperCase() : "N/A";

          return (
            <div className="flex flex-col leading-tight justify-center h-full">
              <span className="font-bold text-slate-800 text-sm">
                {tableDisplay}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  ID:
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  #{shortId}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Customer Name",
        field: "customerName", // 1. Add this so the filter knows which key to look at
        flex: 1,
        filter: "agTextColumnFilter",
        floatingFilter: true,
        // 2. Use valueGetter if your data is nested, e.g., params.data.customer?.name
        valueGetter: (params) => {
          return params.data?.customerName || "N/A";
        },
        cellRenderer: (params: any) => {
          const row = params.data;
          if (!row) return null;

          // We can use params.value here because valueGetter/field populated it
          const customerName = params.value;

          return (
            <div className="flex flex-col leading-tight justify-center h-full">
              <span className="font-bold text-slate-800 text-sm">
                {customerName}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Status",
        field: "status",
        width: 180,
        filter: false,
        cellRenderer: (params: any) => {
          if (params.data?.isPinnedRow) return null;
          const isPaid = params.value === "PAID";
          return (
            <div className="flex items-center h-full">
              <span
                className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded ${
                  isPaid ? " text-emerald-700" : "   text-amber-700"
                }`}
              >
                {params.value}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Method",
        field: "paymentMode",
        width: 130,
        filter: false,
        valueFormatter: (p) =>
          p.data?.isPinnedRow ? "" : p.value?.toUpperCase() || "PENDING",
      },
      {
        headerName: "Cash",
        field: "amountCash",
        filter: false,
        width: 160,
        // 1. Remove default padding and align text to right via AG Grid class
        cellClass: "p-0 text-right",
        cellRenderer: (params: any) => {
          const isPinned = params.data?.isPinnedRow;

          return (
            <div
              className={`flex items-center justify-end h-full w-full p-6  font-mono transition-colors ${
                isPinned
                  ? "font-black text-emerald-900  "
                  : "font-bold text-emerald-700  "
              }`}
            >
              ₹{Number(params.value).toLocaleString()}
            </div>
          );
        },
      },
      {
        headerName: "Online",
        field: "amountOnline",
        filter: false,
        width: 160,
        // 1. Remove default padding and align text to right via AG Grid class
        cellClass: "p-0 text-right",
        cellRenderer: (params: any) => {
          const isPinned = params.data?.isPinnedRow;

          return (
            <div
              className={`flex items-center justify-end h-full w-full p-6  font-mono transition-colors ${
                isPinned
                  ? "font-black text-emerald-900  "
                  : "font-bold text-emerald-700  "
              }`}
            >
              ₹{Number(params.value).toLocaleString()}
            </div>
          );
        },
      },

      {
        headerName: "Finalized At",
        field: "updatedAt",
        width: 250,
        filter: false,
        valueFormatter: (p) =>
          p.value ? dayjs(p.value).format("DD/MM/YYYY • hh:mm A") : "",
        cellStyle: {
          fontSize: "12px",
          color: "#64748b",
          fontFamily: "monospace", // Optional: keeps numbers aligned vertically
        },
      },
      {
        headerName: "Amount",
        field: "totalAmount",
        filter: false,
        width: 160,
        // 1. Remove default padding and align text to right via AG Grid class
        cellClass: "p-0 text-right",
        cellRenderer: (params: any) => {
          const isPinned = params.data?.isPinnedRow;

          return (
            <div
              className={`flex items-center justify-end h-full w-full p-6  font-mono transition-colors ${
                isPinned
                  ? "font-black text-emerald-900  "
                  : "font-bold text-emerald-700  "
              }`}
            >
              ₹{Number(params.value).toLocaleString()}
            </div>
          );
        },
      },
      {
        headerName: "Action",
        width: 120,
        pinned: "right",
        cellRenderer: (params: any) => {
          if (params.data?.isPinnedRow) return null;
          const isPending = ["BILLED", "DUE"].includes(params.data?.status);

          return (
            <div className="flex justify-center items-center h-full gap-1">
              <button
                onClick={() => setSelectedBill(params.data)}
                className="..."
              >
                <Eye size={18} />
              </button>
              {isPending && (
                <button
                  onClick={() => setPaymentOrder(params.data)}
                  className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <CheckCircle size={18} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
    }),
    [],
  );

  return (
    <div className="mx-auto p-4 space-y-6 bg-[#f8fafc]  text-slate-900">
      {/* HEADER SECTION */}
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6   py-6  ">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <GenericDropdown
            allLabel="All Status"
            options={status_options}
            selectedValue={statusFilter}
            onSelect={(val) => setStatusFilter(val)}
            showClear={true}
            // icon={Utensils}
          />
        </div>

        <div className="flex items-center gap-3">
          <RangePicker
            value={dateRange}
            onChange={(val: any) => setDateRange(val)}
            className="h-11 border-slate-200"
          />

          <Button
            variant={"default"}
            onClick={applyFilters}
            disabled={isFetching}
            // className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            {isFetching ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Search size={18} />
            )}
            Update Records
          </Button>
          <button
            onClick={resetToToday}
            className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 transition-all"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>

      {/* AG GRID TABLE */}
      <div
        className="ag-theme-quartz enterprise-grid overflow-hidden border border-slate-200 rounded-xl  "
        style={{ height: "75vh", width: "100%" }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={20}
          animateRows={true}
          rowHeight={65}
          pinnedBottomRowData={pinnedBottomRowData}
        />
      </div>

      {selectedBill && (
        <BillReceiptModal
          order={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
      {paymentOrder && (
        <ConfirmPaymentModal
          order={paymentOrder}
          loading={isSubmitting}
          onClose={() => setPaymentOrder(null)}
          onConfirm={handlePaymentSubmit}
        />
      )}
    </div>
  );
}
