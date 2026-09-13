"use client";

import { Card } from "antd";
import { Calendar } from "lucide-react";

type Table = {
  tableNumber: string;
  count: number;
};

type Props = {
  data?: Table[];
  title?: string;
};

export default function TableTrafficCard({
  data = [],
  title = "Table Traffic",
}: Props) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count || 1;

  return (
    <Card
      className="shadow-sm border-slate-200 rounded-2xl h-[560px] flex flex-col"
      styles={{
        body: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "12px",
        },
      }}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <Calendar size={18} className="text-emerald-500" />
          <span className="font-bold">{title}</span>
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
        {sorted.length > 0 ? (
          sorted.map((t, i) => {
            const percentage = (t.count / max) * 100;

            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  i === 0
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                {/* TOP ROW */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    {/* Rank Circle */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${
                        i === 0
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {i + 1}
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Table
                      </p>
                      <p className="font-semibold text-slate-800">
                        {t.tableNumber}
                      </p>
                    </div>
                  </div>

                  {/* Count */}
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 leading-none">
                      {t.count}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Visits
                    </p>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      i === 0 ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-sm">No table data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
