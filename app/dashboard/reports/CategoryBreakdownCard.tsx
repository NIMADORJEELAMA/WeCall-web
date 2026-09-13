"use client";

import { Card } from "antd";
import { Layers } from "lucide-react";

type Props = {
  data?: Record<string, number>;
  total?: number;
  title?: string;
};

const COLORS = [
  "bg-purple-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-pink-500",
];

export default function CategoryBreakdownCard({
  data = {},
  total = 1,
  title = "Sales by Category",
}: Props) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]); // ✅ sort desc

  return (
    <Card
      className="shadow-sm border-slate-200 rounded-2xl h-[420px] flex flex-col"
      styles={{
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // ✅ prevents overflow leak
          padding: "12px", // optional: tighter UI
        },
      }}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <Layers size={18} className="text-purple-500" />
          <span className="font-bold">{title}</span>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {entries.length > 0 ? (
          entries.map(([cat, val], index) => {
            const percentage = Math.min((val / total) * 100, 100);
            const color = COLORS[index % COLORS.length];

            return (
              <div key={cat} className="group">
                {/* HEADER */}
                <div className="flex justify-between items-end mb-1.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[160px]">
                      {cat}
                    </span>
                    <span className="text-sm font-black text-slate-800">
                      ₹{val.toLocaleString()}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                {/* PROGRESS BAR */}
                <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${color} h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-90`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No sales data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
