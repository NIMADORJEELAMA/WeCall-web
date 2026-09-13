"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useEffect, useState, useMemo, useRef } from "react";
import dayjs from "dayjs";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { DatePicker } from "antd";
import "@/lib/agGrid";
import {
  IndianRupee,
  Users,
  TrendingUp,
  Loader2,
  Eye,
  Printer,
  Wallet,
  Globe,
  Search,
} from "lucide-react";

// Components
import BookingDetailsModal from "@/components/history/BookingDetailsModal";
import BookingHistoryModal from "../bookings/BookingHistoryModal";
import GenericDropdown from "@/components/ui/GenericDropdown";
import { SearchBar } from "@/components/ui/SearchBar";

const { RangePicker } = DatePicker;

export default function BookingHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));

  const [status, setStatus] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [managerBookingId, setManagerBookingId] = useState<string | null>(null);
  const gridRef = useRef<any>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ["booking-history", debouncedSearch, startDate, endDate, status],
    queryFn: async () => {
      const response = await api.get("/rooms/history", {
        params: { search: debouncedSearch, startDate, endDate, status },
      });
      return response.data;
    },
  });

  const history = data?.history || [];

  // Logic Calculations (Memoized for performance)
  const stats = useMemo(() => {
    return history.reduce(
      (acc: any, b: any) => {
        const isCheckedOut = b.status === "CHECKED_OUT";
        acc.totalNet += b.grandTotal || 0;
        acc.totalDiscount += b.discount || 0;
        acc.cash += b.cashAmount || 0;
        acc.online += b.onlineAmount || 0;
        if (isCheckedOut) acc.checkedOutCount++;
        if (b.status === "CANCELLED") acc.cancelledCount++;
        return acc;
      },
      {
        totalNet: 0,
        totalDiscount: 0,
        cash: 0,
        online: 0,
        checkedOutCount: 0,
        cancelledCount: 0,
      },
    );
  }, [history]);

  // AG-Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Guest",
        field: "guestName",
        flex: 1.5,

        cellRenderer: (params: any) => {
          if (params.node.isRowPinned())
            return <span className="font-bold">{params.value}</span>;
          return (
            <div className="flex flex-col justify-center h-full py-1">
              <span className="font-semibold text-slate-800 leading-none">
                {params.data.guestName}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Room",
        field: "roomNumber",
        // flex: 1.5,
        filter: false,
        maxWidth: 180,
        minWidth: 140,

        cellRenderer: (params: any) => {
          if (params.node.isRowPinned())
            return <span className="font-bold">{params.value}</span>;
          return (
            <div className="flex flex-col justify-center h-full py-1">
              <span className="font-semibold text-slate-800 leading-none">
                {params.data.room?.roomNumber}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Check-In",
        field: "checkIn",
        filter: false,
        // Added hh:mm A for 12-hour format with AM/PM
        valueFormatter: (p) =>
          p.value ? dayjs(p.value).format("DD/MM/YY hh:mm A") : "",
      },
      {
        headerName: "Check-Out",
        field: "checkOut",
        filter: false,
        // Use HH:mm for 24-hour format if you prefer
        valueFormatter: (p) =>
          p.value ? dayjs(p.value).format("DD/MM/YY hh:mm A") : "",
      },
      {
        headerName: "Status",
        field: "status",
        filter: false,
        maxWidth: 160,
        minWidth: 160,
        cellRenderer: (p: any) => {
          if (p.node.isRowPinned()) return "";
          const color =
            p.value === "CANCELLED"
              ? "text-red-600 bg-red-50"
              : "text-emerald-600 bg-emerald-50";
          return (
            <span
              className={`px-2 py-1 rounded text-[10px] font-bold ${color}`}
            >
              {p.value}
            </span>
          );
        },
      },
      {
        headerName: "Advance",
        field: "advanceAmount",
        filter: false,
        maxWidth: 160,
        minWidth: 140,
        valueFormatter: (p) => `₹${(p.value || 0).toLocaleString()}`,
      },
      {
        headerName: "Cash",
        field: "cashAmount",
        filter: false,
        maxWidth: 160,
        minWidth: 140,
        valueFormatter: (p) => `₹${(p.value || 0).toLocaleString()}`,
      },
      {
        headerName: "Online",
        field: "onlineAmount",
        filter: false,
        maxWidth: 160,
        minWidth: 140,
        valueFormatter: (p) => `₹${(p.value || 0).toLocaleString()}`,
      },
      {
        headerName: "Net Payable",
        field: "netPayableAtCheckout",
        filter: false,
        cellClass: "font-bold text-indigo-600",
        valueFormatter: (p) => `₹${(p.value || 0).toLocaleString()}`,
      },
      {
        headerName: "Actions",
        field: "id",
        width: 160,
        filter: false,
        cellRenderer: (params: any) => {
          if (params.node.isRowPinned()) return null;
          return (
            <div className="flex gap-1 items-center h-full">
              {/* View Button */}
              <button
                onClick={() => setManagerBookingId(params.value)}
                className="group p-1.5 text-blue-600 hover:bg-blue-600 rounded-md cursor-pointer transition-colors"
              >
                <Eye
                  size={16}
                  className="group-hover:text-white transition-colors"
                />
              </button>

              {/* Print Button */}
              <button
                onClick={() => setSelectedBooking(params.data)}
                className="group p-1.5 text-slate-600 hover:bg-slate-800 rounded-md cursor-pointer transition-colors"
              >
                <Printer
                  size={16}
                  className="group-hover:text-white transition-colors"
                />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const pinnedBottomRowData = useMemo(
    () => [
      {
        guestName: "TOTALS",
        cashAmount: stats.cash,
        onlineAmount: stats.online,
        netPayableAtCheckout: history.reduce(
          (s: number, b: any) => s + (b.netPayableAtCheckout || 0),
          0,
        ),
      },
    ],
    [stats, history],
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      {/* 1. TOP BAR: Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ">
        <div className="relative w-full md:w-96">
          <SearchBar
            placeholder="Search guest, phone or room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <GenericDropdown
            options={[
              { id: "RESERVED", name: "Reserved" },
              { id: "CHECKED_IN", name: "Checked In" },
              { id: "CHECKED_OUT", name: "Checked Out" },
              { id: "CANCELLED", name: "Cancelled" },
            ]}
            selectedValue={status}
            onSelect={setStatus}
            allLabel="All Status"
            className="w-40"
          />
          <RangePicker
            className="rounded-xl border-slate-200"
            // 1. Set the display format to DD/MM/YYYY
            format="DD/MM/YYYY"
            // 2. Set default values (using dayjs objects)
            defaultValue={[dayjs(startDate), dayjs(endDate)]}
            onChange={(dates: any) => {
              if (dates) {
                // 3. Keep the state in YYYY-MM-DD for your API/backend consistency
                setStartDate(dates[0].format("YYYY-MM-DD"));
                setEndDate(dates[1].format("YYYY-MM-DD"));
              }
            }}
          />
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<IndianRupee />}
          title="Net Revenue"
          value={`₹${stats.totalNet.toLocaleString()}`}
          color="emerald"
          subtext={
            stats.totalDiscount > 0 ? `₹${stats.totalDiscount} Disc.` : ""
          }
        />
        <StatCard
          icon={<Wallet />}
          title="Cash Collected"
          value={`₹${stats.cash.toLocaleString()}`}
          color="blue"
        />
        <StatCard
          icon={<Globe />}
          title="Online Payments"
          value={`₹${stats.online.toLocaleString()}`}
          color="indigo"
        />
        <StatCard
          icon={<Users />}
          title="Bookings"
          value={history.length}
          color="slate"
        />
        <StatCard
          icon={<TrendingUp />}
          title="Checked Out"
          value={stats.checkedOutCount}
          color="purple"
        />
      </div>

      {/* 3. MAIN TABLE SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="h-[500px] flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-blue-500" size={40} />
            <span className="text-slate-400 font-medium">
              Loading history...
            </span>
          </div>
        ) : (
          <div
            className="ag-theme-quartz"
            style={{ height: 600, width: "100%" }}
          >
            <AgGridReact
              rowData={history}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, filter: true, resizable: true }}
              pagination={true}
              paginationPageSize={20}
              pinnedBottomRowData={pinnedBottomRowData}
            />
          </div>
        )}
      </div>

      {/* MODALS */}
      <BookingHistoryModal
        isOpen={!!managerBookingId}
        bookingId={managerBookingId}
        onClose={() => setManagerBookingId(null)}
      />
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}

// Reusable StatCard Component for better UI consistency
function StatCard({ icon, title, value, color, subtext }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    slate: "bg-slate-50 text-slate-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
          {title}
        </p>
        <p className="text-xl font-black text-slate-900 leading-none mt-1">
          {value}
        </p>
        {subtext && (
          <p className="text-[10px] text-red-500 font-medium mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}
