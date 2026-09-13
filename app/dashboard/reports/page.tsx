"use client";

import { useState, useMemo } from "react";
import { useDashboardReport } from "@/hooks/useReports";
import {
  TrendingUp,
  Banknote,
  CreditCard,
  Utensils,
  ArrowLeft,
  Download,
  Calendar,
  AlertCircle,
  BarChart3,
  Clock,
  Layers,
  Wallet,
} from "lucide-react";
import "@/lib/agGrid";

import { DatePicker, Button, Card, Statistic, Space, Tooltip } from "antd";
import { AgGridReact } from "ag-grid-react";
import dayjs, { Dayjs } from "dayjs";
import Link from "next/link";
import CategoryBreakdownCard from "./CategoryBreakdownCard";
import TableTrafficCard from "./TableTrafficCard";

const { RangePicker } = DatePicker;

export default function AdminReportPage() {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const startDate = dateRange?.[0]?.format("YYYY-MM-DD");
  const endDate = dateRange?.[1]?.format("YYYY-MM-DD");

  const { data, isLoading } = useDashboardReport(startDate, endDate);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Item",
        field: "name",
        flex: 1,
        cellRenderer: (params: any) => (
          <span className="font-semibold text-slate-700">{params.value}</span>
        ),
      },
      {
        headerName: "Quantity Sold",
        field: "quantity",
        width: 140,
        sortable: true,
        cellRenderer: (params: any) => (
          <span className="font-mono text-blue-600 font-bold">
            {params.value}
          </span>
        ),
      },
      {
        headerName: "% Contribution",
        width: 140,
        valueGetter: (params: any) => {
          const total = data?.stats?.totalFoodItemsSold || 1;
          return ((params.data.quantity / total) * 100).toFixed(1);
        },
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2">
            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-400 h-full"
                style={{ width: `${params.value}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              {params.value}%
            </span>
          </div>
        ),
      },
    ],
    [data],
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-10 text-slate-900">
      <div className="  mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div></div>

          <RangePicker
            value={dateRange}
            onChange={(val: any) => setDateRange(val)}
          />
        </div>

        {/* TOP ROW: REVENUE BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPI
            title="Total Revenue"
            value={data?.revenue.totalCollected}
            prefix="₹"
            icon={<TrendingUp size={20} />}
            color="emerald"
          />
          <KPI
            title="Cash"
            value={data?.revenue.cash}
            prefix="₹"
            icon={<Banknote size={20} />}
            color="blue"
          />
          <KPI
            title="Online"
            value={data?.revenue.online}
            prefix="₹"
            icon={<CreditCard size={20} />}
            color="purple"
          />
          <KPI
            title="Other/Card"
            value={data?.revenue.other}
            prefix="₹"
            icon={<Wallet size={20} />}
            color="cyan"
          />
          <KPI
            title="Outstanding Due"
            value={data?.revenue.due}
            prefix="₹"
            icon={<AlertCircle size={20} />}
            color="red"
          />
          <KPI
            title="Avg. Order"
            value={data?.stats.avgOrderValue}
            prefix="₹"
            icon={<BarChart3 size={20} />}
            color="orange"
          />
        </div>

        {/* MIDDLE ROW: CHARTS & STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            className="lg:col-span-2  max-h-[450px]  shadow-sm border-slate-200 rounded-2xl"
            title={
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-blue-500" /> Peak Order Hours
              </div>
            }
          >
            {/* Reduced height from h-50 to h-32 and padding from pt-10 to pt-6 */}
            <div className="h-74 flex items-end gap-1 px-2 pt-3 border-b border-l border-slate-100">
              {(() => {
                const maxVal = Math.max(...(data?.peakHours || []), 1);

                return data?.peakHours.map((count: number, hour: number) => {
                  const barHeight = (count / maxVal) * 100;

                  return (
                    <Tooltip title={`${hour}:00 - ${count} Orders`} key={hour}>
                      <div className="flex-1 flex flex-col items-center group h-full justify-end">
                        <div
                          className="w-full bg-blue-500 rounded-t-sm group-hover:bg-blue-400 transition-all cursor-pointer relative"
                          style={{
                            height: `${barHeight}%`,
                            minHeight: count > 0 ? "4px" : "1px",
                          }}
                        >
                          {count > 0 && (
                            /* Moved label closer (-top-5 instead of -top-6) */
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-700">
                              {count}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 hidden md:block">
                          {hour}h
                        </span>
                      </div>
                    </Tooltip>
                  );
                });
              })()}
            </div>
            <div className="flex justify-between mt-2 px-2 text-[10px] text-slate-400 font-bold">
              <span>12 AM</span>
              <span>12 PM</span>
              <span>11 PM</span>
            </div>
          </Card>

          {/* CATEGORY BREAKDOWN */}
          <CategoryBreakdownCard
            data={data?.categoryBreakdown}
            total={data?.revenue?.totalCollected}
          />
        </div>

        {/* BOTTOM ROW: TABLES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            className="lg:col-span-2 shadow-sm border-slate-200 rounded-2xl"
            title={
              <div className="flex items-center gap-2">
                <Utensils size={18} className="text-orange-500" /> Best Selling
                Items
              </div>
            }
          >
            <div className="ag-theme-quartz" style={{ height: 450 }}>
              <AgGridReact
                rowData={data?.topItems || []}
                columnDefs={columnDefs}
                rowHeight={50}
                headerHeight={45}
              />
            </div>
          </Card>

          <TableTrafficCard data={data?.popularTables} />
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, prefix, icon, color }: any) {
  const colorMap: any = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    red: "text-red-600 bg-red-50 border-red-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    cyan: "text-cyan-600 bg-cyan-50 border-cyan-100",
  };

  return (
    <Card className="rounded-2xl shadow-sm border-slate-200 overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xs font-bold text-slate-400">{prefix}</span>
        <span className="text-2xl font-black tracking-tight text-slate-800">
          {typeof value === "number"
            ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
            : "0"}
        </span>
      </div>
    </Card>
  );
}
