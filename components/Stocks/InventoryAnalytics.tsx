"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Target, AlertCircle, TrendingUp, ShieldCheck } from "lucide-react";

export default function InventoryAnalytics({ stats }: { stats: any }) {
  if (!stats) return null;

  const COLORS = { FOOD: "#6366F1", DRINKS: "#213448" };

  // Calculate the Gross Base for accurate hover percentages
  const grossAssetBase = stats.chartData.reduce(
    (acc: number, curr: any) => acc + Math.abs(curr.value),
    0,
  );

  const chartData = stats.chartData.map((d: any) => ({
    name: d.name.toUpperCase(),
    value: Math.abs(d.value),
    displayValue: d.value,
    count: d.count,
    fill: d.name.toUpperCase() === "FOOD" ? COLORS.FOOD : COLORS.DRINKS,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
      <div className="lg:col-span-8 bg-white p-12 rounded-[56px] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        {/* SIDE LABELS */}
        <div className="flex-1 space-y-10 z-10 w-full">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <Target size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                Asset Composition
              </span>
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase  ">
              Equity{" "}
              <span className="text-slate-300 font-medium not- ">
                Distribution
              </span>
            </h3>
          </div>

          <div className="space-y-6">
            {chartData.map((entry: any) => (
              <div
                key={entry.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-1.5 h-10 rounded-full"
                    style={{ backgroundColor: entry.fill }}
                  />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {entry.name}
                    </p>
                    <p
                      className={`text-2xl font-black ${entry.displayValue < 0 ? "text-red-600" : "text-slate-900"}`}
                    >
                      ₹{entry.displayValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PIE CHART WITH FIXED HOVER */}
        <div className="w-full h-[320px] md:w-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={90}
                outerRadius={125}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
                cornerRadius={12}
                startAngle={90}
                endAngle={450}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="hover:opacity-80 transition-opacity outline-none cursor-pointer"
                  />
                ))}
              </Pie>

              {/* FIXED TOOLTIP */}
              <Tooltip
                cursor={false}
                // Removes default wrapper styles to let our custom Tailwind styles shine
                wrapperStyle={{ outline: "none", zIndex: 1000 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isNegative = data.displayValue < 0;

                    // Calculate share percentage on the fly for the tooltip
                    const percentage =
                      grossAssetBase > 0
                        ? ((data.value / grossAssetBase) * 100).toFixed(1)
                        : "0";

                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-[24px] shadow-2xl border border-slate-800 min-w-[200px] backdrop-blur-md bg-opacity-95">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: data.fill }}
                            />
                            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                              {data.name}
                            </p>
                          </div>
                          <span className="text-[8px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                            {percentage}%
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p
                            className={`text-[14px] font-black tracking-tight ${isNegative ? "text-red-400" : "text-white"}`}
                          >
                            ₹{data.displayValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-1">
            <div className="w-32 h-32 rounded-full border border-slate-100 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Net Value
              </span>
              <span
                className={`text-xl font-black tracking-tighter ${stats.totalValue < 0 ? "text-red-600" : "text-slate-900"}`}
              >
                ₹{stats.totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE ALERTS */}
      {/* <div className="lg:col-span-4 bg-slate-900 p-12 rounded-[56px] text-white flex flex-col justify-between shadow-2xl">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Compliance
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight uppercase   leading-[0.9]">
            Inventory Integrity
          </h2>
          <div className="pt-6 border-t border-white/10">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">
              Health Warning
            </p>
            <p className="text-sm text-slate-300">
              Negative equity detected. Check sales logs for untracked inventory
              items.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}
