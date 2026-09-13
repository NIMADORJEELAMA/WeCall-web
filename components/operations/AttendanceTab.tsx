"use client";
import { useState, useMemo } from "react";
import { useUsers } from "@/hooks/useUsers";
import { useMonthlyAttendance, useMarkAttendance } from "@/hooks/useOperations";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Users,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWeekend,
  isSameDay,
} from "date-fns";

import { DatePicker, ConfigProvider } from "antd";
import dayjs from "dayjs"; // Ant Design 5 uses dayjs

export default function AttendanceTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  // Data Fetching
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: attendanceData, isLoading: logsLoading } = useMonthlyAttendance(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
  );
  const markAttendance = useMarkAttendance();

  // 1. Memoized Date Calculations
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // 2. High-Performance Lookup Map (The "Enterprise" way)
  const attendanceMap = useMemo(() => {
    const map = new Set<string>();
    attendanceData?.logs?.forEach((log: any) => {
      map.add(`${log.userId}-${log.date}`);
    });
    return map;
  }, [attendanceData]);

  const handleToggle = (userId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    markAttendance.mutate(
      { userId, date: dateStr },
      {
        onSuccess: () => toast.success(`Updated attendance for ${dateStr}`),
        onError: () => toast.error("Failed to update attendance"),
      },
    );
  };

  if (usersLoading || logsLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-sm font-medium animate-pulse">
          Synchronizing records...
        </p>
      </div>
    );
  }

  const handleDateChange = (date: any) => {
    if (date) {
      setCurrentDate(date.toDate());
    }
  };

  const nextMonth = () => {
    setCurrentDate(dayjs(currentDate).add(1, "month").toDate());
  };

  const prevMonth = () => {
    setCurrentDate(dayjs(currentDate).subtract(1, "month").toDate());
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  return (
    <div className="p-6   mx-auto space-y-6">
      {/* HEADER SECTION */}

      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 justify-center">
        {/* Quick Nav: Previous */}
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>

        <ConfigProvider
          theme={{
            token: {
              borderRadius: 12,
              colorPrimary: "#2563eb",
            },
          }}
        >
          <div className="flex flex-col items-center">
            <DatePicker
              picker="month"
              value={dayjs(currentDate)}
              onChange={handleDateChange}
              allowClear={false}
              suffixIcon={<CalendarIcon size={14} className="text-blue-600" />}
              className="h-9 font-bold text-slate-700 border-none shadow-none bg-transparent hover:bg-white transition-all cursor-pointer"
              format="MMMM YYYY"
              /* This adds the 'Today' button inside the dropdown */
              renderExtraFooter={() => (
                <div className="py-2 text-center border-t border-slate-100">
                  <button
                    onClick={() => {
                      goToToday();
                      // To close the dropdown, you might need to manage open state manually
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Current Month
                  </button>
                </div>
              )}
            />

            {/* MINIMAL TODAY INDICATOR BELOW */}
            {!dayjs(currentDate).isSame(dayjs(), "month") && (
              <button
                onClick={goToToday}
                className="text-[9px] font-black uppercase tracking-tighter text-blue-500 hover:text-blue-700 transition-all opacity-80 hover:opacity-100"
              >
                Today
              </button>
            )}
          </div>
        </ConfigProvider>

        {/* Quick Nav: Next */}
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* MATRIX TABLE */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky left-0 z-20 bg-slate-50 px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 w-64 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  Staff Member
                </th>
                {calendarDays.map((day) => (
                  <th
                    key={day.toString()}
                    className={`px-3 py-5 text-[10px] font-bold text-center border-r border-slate-200 min-w-[45px] ${
                      isWeekend(day)
                        ? "bg-slate-200/50 text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{format(day, "eee").toUpperCase()}</span>
                      <span className="text-sm mt-1">{format(day, "dd")}</span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-5 text-xs font-bold text-blue-600 uppercase text-center bg-blue-50/50 sticky right-0 z-10 backdrop-blur-sm shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user: any) => {
                const totalPresent = attendanceData?.summary?.[user.id] || 0;

                return (
                  <tr
                    key={user.id}
                    className="group hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/30 px-6 py-4 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-800">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {calendarDays.map((day) => {
                      const dateKey = `${user.id}-${format(day, "yyyy-MM-dd")}`;
                      const isPresent = attendanceMap.has(dateKey);
                      const weekend = isWeekend(day);

                      return (
                        <td
                          key={day.toString()}
                          onClick={() => handleToggle(user.id, day)}
                          className={`p-0 text-center border-r border-slate-100 cursor-pointer relative group/cell ${
                            weekend ? "bg-slate-200/30" : ""
                          }`}
                        >
                          <div
                            className={`h-full w-full py-4 flex items-center justify-center transition-all ${
                              isPresent
                                ? "bg-emerald-50/50"
                                : "hover:bg-slate-100"
                            }`}
                          >
                            {isPresent ? (
                              <CheckCircle2
                                size={18}
                                className="text-emerald-500 drop-shadow-sm"
                              />
                            ) : (
                              <Circle
                                size={18}
                                className="text-slate-200 group-hover/cell:text-slate-300 transition-colors"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 text-center font-bold text-blue-700 bg-blue-50/30 text-sm sticky right-0 z-10 backdrop-blur-sm shadow-[-2px_0_5px_rgba(0,0,0,0.05)] transition-colors">
                      {totalPresent}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER LEGEND */}
      <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500" />
          Present
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
          Absent / Pending
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-100" />
          Weekend
        </div>
      </div>
    </div>
  );
}
