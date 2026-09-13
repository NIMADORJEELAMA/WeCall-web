"use client";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const totalDays = 45;
const startDay = 0; // March 2026 starts on Sunday

export default function MarchCalendar() {
  // Always 42 cells (6 rows × 7 columns)
  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - startDay + 1;
    return dayNumber > 0 && dayNumber <= totalDays ? dayNumber : null;
  });

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* HEADER */}
      <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
        <h2 className="text-xl font-black">March 2026</h2>
        <div className="flex gap-1">
          <button className="p-2 hover:bg-white/10 rounded-lg">
            <ChevronLeft size={16} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* DAYS ROW */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {days.map((day) => (
          <div
            key={day}
            className="text-center py-2 text-[11px] font-bold text-slate-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 border border-slate-200">
        {cells.map((date, i) => {
          const isToday = date === 29;

          return (
            <div
              key={i}
              className="h-[70px] border border-slate-200 p-2 flex flex-col justify-between hover:bg-blue-50 transition cursor-pointer"
            >
              {date ? (
                <>
                  <span
                    className={`text-sm font-bold ${
                      isToday
                        ? "bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full"
                        : "text-slate-700"
                    }`}
                  >
                    {date}
                  </span>

                  {/* demo event dot */}
                  {date % 6 === 0 && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full self-end" />
                  )}
                </>
              ) : (
                <div className="opacity-0">.</div> // keeps grid alignment
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center px-5 py-3 bg-slate-50 border-t border-slate-200">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          March 29, 2026
        </span>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </div>
  );
}
