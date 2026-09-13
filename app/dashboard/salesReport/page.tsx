"use client";

import { useState, useMemo, useEffect } from "react";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  Hotel,
  Wallet,
  CreditCard,
} from "lucide-react";

import {
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { DatePicker, Card, Statistic, Spin } from "antd";
import { SearchBar } from "@/components/ui/SearchBar";

import { AgGridReact } from "ag-grid-react";
import "@/lib/agGrid";

import dayjs from "dayjs";
import { ColDef } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

const { RangePicker } = DatePicker;

/* ---------------- API HOOK ---------------- */

const usePerformanceReport = (start: string, end: string) => {
  return useQuery({
    queryKey: ["sales-report", start, end],
    queryFn: async () => {
      const res = await api.get(
        `/orders/reports/admin?startDate=${start}&endDate=${end}`,
      );
      return res.data;
    },
    enabled: !!start && !!end,
  });
};

export default function SalesReport() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const startDate = dateRange[0].format("YYYY-MM-DD");
  const endDate = dateRange[1].format("YYYY-MM-DD");

  const { data: report, isLoading } = usePerformanceReport(startDate, endDate);

  /* ---------------- Debounce ---------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- Average Ticket ---------------- */

  const avgTicket = report?.operationalStats?.avgTicket || 0;
  /* ---------------- Chart Data ---------------- */

  const chartData = useMemo(() => {
    const items = report?.salesInsights?.topSellingItems;

    if (items?.length) {
      return items.slice(0, 5);
    }

    if (report?.operationalStats?.totalBookings) {
      return [
        {
          name: "Room Booking",
          quantity: report.operationalStats.totalBookings,
        },
      ];
    }

    return [];
  }, [report]);
  /* ---------------- Table Data ---------------- */
  const tableData = useMemo(() => {
    // Fix: Added .operationalStats
    return report?.salesInsights?.topSellingItems || [];
  }, [report]);

  const filteredItems = useMemo(() => {
    return tableData.filter((item: any) =>
      item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [tableData, debouncedSearch]);

  /* ---------------- AG GRID ---------------- */

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      {
        headerName: "No",
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        width: 70,
      },
      { field: "name", headerName: "Item", flex: 1 },
      { field: "quantity", headerName: "Qty Sold", width: 120 },
      {
        field: "revenue",
        headerName: "Revenue",
        width: 150,
        valueFormatter: (p) => `₹${p.value}`,
      },
    ];
  }, []);

  return (
    <div className="bg-[#f8fafc] p-4">
      <div className="mx-auto space-y-4">
        {/* Filters */}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <SearchBar
            placeholder="Search items..."
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />

          <RangePicker
            value={dateRange}
            onChange={(values) =>
              values && setDateRange([values[0]!, values[1]!])
            }
            className="rounded-xl h-12"
          />
        </div>

        {/* KPI GRID */}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <KPICard
            title="Total Revenue"
            value={report?.revenue?.totalRevenue || 0}
            prefix="₹"
            icon={<IndianRupee size={16} />}
          />
          <KPICard
            title="Occupancy"
            value={report?.operationalStats?.occupancyRate || "0%"}
            icon={<Hotel size={16} />}
          />

          <KPICard
            title="Room Revenue"
            value={report?.revenue?.roomRevenue || 0}
            prefix="₹"
            icon={<Hotel size={16} />}
          />

          <KPICard
            title="Table Revenue"
            value={report?.revenue?.tableRevenue || 0}
            prefix="₹"
            icon={<Receipt size={16} />}
          />

          <KPICard
            title="Net Profit"
            value={report?.profitability?.netProfit || 0}
            prefix="₹"
            icon={<TrendingUp size={16} />}
          />
          <KPICard
            title="Avg Ticket"
            value={report?.operationalStats?.avgTicket || 0}
            prefix="₹"
            icon={<Receipt size={16} />}
          />
          <KPICard
            title="Profit Margin"
            value={report?.profitability?.profitMargin || 0}
            suffix="%"
            icon={<TrendingUp size={16} />}
          />

          <KPICard
            title="Expenses"
            value={report?.expenses?.pettyCash || 0}
            prefix="₹"
            icon={<Wallet size={16} />}
          />

          <KPICard
            title="Cash"
            value={report?.payments?.cash || 0}
            prefix="₹"
            icon={<Wallet size={16} />}
          />

          <KPICard
            title="Online"
            value={report?.payments?.online || 0}
            prefix="₹"
            icon={<CreditCard size={16} />}
          />

          <KPICard
            title="Advance"
            value={report?.payments?.advance || 0}
            prefix="₹"
            icon={<IndianRupee size={16} />}
          />

          <KPICard
            title="GST"
            value={report?.tax?.totalGST || 0}
            prefix="₹"
            icon={<IndianRupee size={16} />}
          />
        </div>

        {/* Chart */}

        <Card
          title="Sales Volume"
          className="shadow-sm rounded-2xl"
          styles={{ body: { padding: "12px" } }}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="quantity" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Table */}

        <Card className="shadow-sm rounded-2xl overflow-hidden">
          <div
            className="ag-theme-quartz"
            style={{ height: "45vh", width: "100%" }}
          >
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Spin />
              </div>
            ) : (
              <AgGridReact
                rowData={filteredItems}
                columnDefs={columnDefs}
                pagination
                paginationPageSize={10}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- KPI CARD ---------------- */

function KPICard({ title, value, prefix = "", icon }: any) {
  return (
    <Card
      className="rounded-2xl shadow-sm border-slate-200"
      styles={{ body: { padding: "16px" } }}
    >
      <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-semibold">
        {icon}
        {title}
      </div>

      <Statistic value={value} prefix={prefix} />
    </Card>
  );
}
