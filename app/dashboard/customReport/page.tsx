"use client";

import { useState, useMemo, useEffect } from "react";
import { usePerformanceReport } from "@/hooks/useReports";
import { Receipt, IndianRupee, TrendingUp, Clock, Crown } from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// UI Components
import { DatePicker, Card, Statistic, Spin } from "antd";
import { SearchBar } from "@/components/ui/SearchBar";
import { AgGridReact } from "ag-grid-react";
import "@/lib/agGrid";
import { cn } from "@/lib/utils";

import dayjs from "dayjs";
import { ColDef } from "ag-grid-community";

const { RangePicker } = DatePicker;

export default function EnterprisePerformanceReport() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs(),
  ]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const startDate = dateRange[0].format("YYYY-MM-DD");
  const endDate = dateRange[1].format("YYYY-MM-DD");

  const { data: report, isLoading } = usePerformanceReport(
    startDate,
    endDate,
    1,
    1000,
    debouncedSearch,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "#",
        valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
        width: 60,
        pinned: "left",
      },
      {
        field: "name",
        headerName: "Product Name",
        flex: 2,
        minWidth: 200,
        cellRenderer: (params: any) => (
          <span className="font-bold text-slate-700">{params.value}</span>
        ),
      },
      {
        field: "quantity",
        headerName: "Qty Sold",
        flex: 1,
        sort: "desc" as const,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-indigo-600">
              {params.value}
            </span>
            <div className="h-1.5 bg-indigo-100 rounded-full flex-1 max-w-[60px] hidden md:block">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{
                  width: `${Math.min((params.value / (report?.summary?.totalItemsSold || 100)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ),
      },
      {
        field: "revenue",
        headerName: "Revenue",
        flex: 1,
        valueFormatter: (params) => `₹${params.value?.toLocaleString()}`,
        cellClass: "font-mono font-bold text-emerald-600",
      },
    ],
    [report],
  );

  return (
    <div className="bg-[#f8fafc] p-6 min-h-screen">
      <div className="mx-auto space-y-6">
        {/* HEADER SECTION */}
        {/* HEADER SECTION */}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <SearchBar
            placeholder="Filter by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <RangePicker
            value={dateRange}
            format="DD/MM/YYYY"
            onChange={(values) =>
              values && setDateRange([values[0]!, values[1]!])
            }
            className="rounded-xl h-11 border-slate-200 shadow-sm"
          />
        </div>

        {/* TOP ANALYTICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KPI CARDS (4 cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            <KPICard
              title="Total Revenue"
              value={report?.summary?.totalRevenue || 0}
              prefix="₹"
              icon={<IndianRupee size={18} />}
              color="indigo"
            />
            <KPICard
              title="Total Orders"
              value={report?.summary?.orderCount || 0}
              icon={<Receipt size={18} />}
              color="emerald"
            />

            {/* Top Product Display */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                  Top Product
                </p>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Crown size={16} />
                </div>
              </div>
              <div className="mt-2">
                <p className="font-black text-slate-800 truncate text-sm">
                  {report?.topSellingItems?.[0]?.name || "N/A"}
                </p>
                <p className="text-[10px] text-slate-500 font-bold">
                  {report?.topSellingItems?.[0]?.quantity || 0} units sold
                </p>
              </div>
            </div>

            {/* Peak Hour Visualizer */}
            <div className="bg-indigo-600 rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg shadow-indigo-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] uppercase opacity-70 font-bold tracking-widest">
                    Peak Rush
                  </p>
                  <p className="text-xl font-black mt-1">
                    {report?.peakHours
                      ? `${report.peakHours.indexOf(Math.max(...report.peakHours))}:00`
                      : "00:00"}
                  </p>
                </div>
                <Clock size={16} className="opacity-50" />
              </div>
              <div className="flex items-end gap-0.5 h-10 mt-2">
                {report?.peakHours?.map((val: number, i: number) => (
                  <div
                    key={i}
                    className="bg-white/30 rounded-t-sm w-full"
                    style={{
                      height: `${(val / (Math.max(...report.peakHours) || 1)) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* MAIN CHART (8 cols) */}
          <Card
            title={
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                Top 5 Performance
              </span>
            }
            className="lg:col-span-8 shadow-sm rounded-2xl border-slate-200"
            styles={{ body: { padding: "20px" } }}
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={report?.topSellingItems?.slice(0, 5)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="quantity"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* DATA TABLE */}
        <Card
          styles={{ body: { padding: 0 } }}
          className="shadow-sm rounded-2xl border-slate-200 overflow-hidden"
        >
          <div
            className="ag-theme-quartz enterprise-grid"
            style={{ height: "500px", width: "100%" }}
          >
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-white/50 backdrop-blur-sm">
                <Spin size="large" />
              </div>
            ) : (
              <AgGridReact
                rowData={report?.topSellingItems || []}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={20}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                  filter: true,
                }}
                rowHeight={52}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  prefix = "",
  color,
  precision = 0,
}: any) {
  const colorMap: any = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <Card
      className="border-slate-200 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors"
      styles={{ body: { padding: "20px" } }}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
            {title}
          </p>
          <Statistic
            value={value}
            prefix={prefix}
            precision={precision}
            style={{
              fontWeight: 900,
              color: "#0f172a",
              fontSize: "1.4rem",
              letterSpacing: "-0.04em",
            }}
          />
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            colorMap[color],
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
