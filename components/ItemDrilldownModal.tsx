// src/components/ItemDrilldownModal.tsx
import { useItemDrilldown } from "@/hooks/useReports";
import { X, TrendingUp, Calendar, Trophy, User } from "lucide-react";

export default function ItemDrilldownModal({
  itemId,
  itemName,
  startDate,
  endDate,
  onClose,
}: any) {
  const { data, isLoading } = useItemDrilldown(itemId, startDate, endDate);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">
              Sales Analysis
            </p>
            <h2 className="text-3xl font-black uppercase   tracking-tighter">
              {itemName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <X />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {isLoading ? (
            <div className="col-span-2 py-20 text-center font-black   text-gray-300 uppercase animate-pulse">
              Syncing Staff Performance...
            </div>
          ) : (
            <>
              {/* LEFT: Daily Trend */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-blue-500" />
                  <h4 className="text-[10px] font-black uppercase text-gray-400">
                    Daily Trend
                  </h4>
                </div>
                {data?.trend.map((day: any) => (
                  <div
                    key={day.date}
                    className="flex justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100"
                  >
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      {day.date}
                    </span>
                    <span className="font-black text-gray-900  ">
                      {day.qty}{" "}
                      <small className="text-[8px] opacity-40">PCS</small>
                    </span>
                  </div>
                ))}
              </div>

              {/* RIGHT: Top Waiters */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={14} className="text-amber-500" />
                  <h4 className="text-[10px] font-black uppercase text-gray-400">
                    Top Performers
                  </h4>
                </div>
                {data?.topWaiters.map((waiter: any, index: number) => (
                  <div
                    key={waiter.name}
                    className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${index === 0 ? "bg-amber-500 text-white" : "bg-white text-amber-500"}`}
                      >
                        #{index + 1}
                      </span>
                      <span className="text-[11px] font-black uppercase text-gray-700">
                        {waiter.name}
                      </span>
                    </div>
                    <span className="font-black text-amber-600   text-lg">
                      {waiter.qty}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
