"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  format,
  addDays,
  startOfDay,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  Calendar as CalendarIcon,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import CheckInModal from "@/components/rooms/CheckInModal";
import { BookingHoverCard } from "./BookingHoverCard";
import BookingManagerModal from "./BookingManagerModal";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "antd";
import dayjs from "dayjs";

export default function ReservationTimeline() {
  const [viewDate, setViewDate] = useState(startOfDay(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [selection, setSelection] = useState<any>(null);

  const daysToShow = 21; // Increased density for enterprise view

  const dateRange = useMemo(() => {
    return eachDayOfInterval({
      start: viewDate,
      end: addDays(viewDate, daysToShow - 1),
    });
  }, [viewDate]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["room-timeline", format(viewDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await api.get("/rooms/timeline", {
        params: {
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[daysToShow - 1].toISOString(),
        },
      });
      return res.data;
    },
  });

  // Enterprise filtering logic
  const filteredRooms = useMemo(() => {
    if (!data?.rooms) return [];
    return data.rooms.filter(
      (room: any) =>
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.category?.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data?.rooms, searchTerm]);
  const handleAddBookingClick = () => {
    // Option A: Pass null to let the user choose a room inside the modal
    setSelection(null);

    // Option B: Pre-select the first room if rooms are loaded
    if (filteredRooms.length > 0) {
      setSelection({
        roomId: filteredRooms[0].id,
        roomNumber: filteredRooms[0].roomNumber,
        date: viewDate, // Current view start date
      });
    }

    setIsCheckInOpen(true);
  };
  if (isLoading)
    return (
      <div className="flex h-[600px] items-center justify-center bg-slate-50/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
          <p className="text-sm font-medium text-slate-500">
            Loading floor map...
          </p>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
      {/* 1. TOP ENTERPRISE TOOLBAR */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white z-30 sticky top-0">
        {/* LEFT: Search Section */}
        <div className="flex flex-1 items-center justify-start gap-4">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <Input
              placeholder="Search room or type..."
              className="pl-9 h-9 text-xs border-slate-200 focus:ring-indigo-500 rounded-lg shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* MIDDLE: Date Navigation Section */}
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
            {/* <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[10px] font-black uppercase hover:bg-white transition-all rounded-lg"
              onClick={() => setViewDate(startOfDay(new Date()))}
            >
              Today
            </Button> */}

            {/* <div className="h-4 w-[1px] bg-slate-300 mx-1" /> */}

            <div className="flex items-center gap-0.5 ">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white rounded-lg"
                onClick={() => setViewDate(addDays(viewDate, -7))}
              >
                <ChevronLeft size={16} />
              </Button>

              <DatePicker
                value={dayjs(viewDate)}
                onChange={(date) => {
                  if (date) setViewDate(date.toDate());
                }}
                allowClear={false}
                format="DD MMM YYYY"
                picker="date"
                className="h-8 border-none bg-transparent hover:bg-white focus:bg-white font-bold text-[11px] uppercase w-[140px] text-center cursor-pointer shadow-none rounded-md"
                suffixIcon={
                  <CalendarIcon size={14} className="text-indigo-600" />
                }
                showToday={true}
              />

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white rounded-lg"
                onClick={() => setViewDate(addDays(viewDate, 7))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT: Action/Sync Section */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-2 text-xs font-medium border-slate-200 hover:bg-slate-50",
              isFetching && "text-indigo-600 border-indigo-200",
            )}
            onClick={() => refetch()}
          >
            <RefreshCcw
              size={14}
              className={cn(isFetching && "animate-spin")}
            />
            <span>Sync</span>
          </Button>
        </div>
      </div>
      {/* 2. TIMELINE GRID */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="inline-flex flex-col min-w-full">
          {/* HEADER ROW (Sticky) */}
          <div className="flex sticky top-0 z-40 bg-white shadow-sm">
            <div className="w-42 flex-shrink-0 bg-slate-50 border-r border-b border-slate-200 p-4 flex items-end">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Room Inventory
              </span>
            </div>
            <div className="flex flex-1">
              {dateRange.map((date) => (
                <div
                  key={date.toString()}
                  className={cn(
                    "flex-1 min-w-[60px] text-center py-2 border-r border-b border-slate-200 transition-colors",
                    isSameDay(date, new Date())
                      ? "bg-indigo-50/50"
                      : "bg-slate-50/30",
                    isWeekend(date) && "bg-slate-100/20",
                  )}
                >
                  <div
                    className={cn(
                      "text-[10px] uppercase font-bold mb-0.5",
                      isWeekend(date) ? "text-slate-400" : "text-slate-500",
                    )}
                  >
                    {format(date, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black",
                      isSameDay(date, new Date())
                        ? "bg-indigo-600 text-white"
                        : "text-slate-700",
                    )}
                  >
                    {format(date, "d")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROOM ROWS */}
          {filteredRooms.map((room: any) => (
            <div
              key={room.id}
              className="flex border-b border-slate-200 group transition-colors hover:bg-slate-50/80 relative  "
            >
              {/* Room Info Sidebar (Sticky left) */}
              <div className="w-42 flex-shrink-0 border-r h-16 border-slate-200 px-4 py-2 bg-white sticky left-0 z-50 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-center">
                {/* Top Row: Room Number and Category */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                      {room.roomNumber}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Status and Price */}
                <div className="mt-1 flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: room.category?.color || "#cbd5e1",
                      }}
                    />
                    {room.category?.name.split(" ")[0]}
                  </div>

                  <div className="text-[10px] text-slate-600 font-black tracking-tight">
                    ₹{room.basePrice}
                  </div>
                </div>
              </div>

              {/* Booking Cells */}
              <div className="flex flex-1 relative h-16">
                {dateRange.map((date) => (
                  <div
                    key={date.toString()}
                    onClick={() => {
                      setSelection({
                        roomId: room.id,
                        date,
                        roomNumber: room.roomNumber,
                      });
                      setIsCheckInOpen(true);
                    }}
                    className={cn(
                      "flex-1 min-w-[60px] border-r border-slate-100/50 cursor-pointer relative",
                      "hover:bg-indigo-100 transition-colors group/cell",
                      isSameDay(date, new Date()) && "bg-indigo-50/20",
                    )}
                  >
                    {/* Ghost "Plus" icon on hover for enterprise feel */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100">
                      <div className="w-6 h-6 rounded-full bg-indigo-300 text-indigo-900 flex items-center justify-center text-[12px] font-bold">
                        +
                      </div>
                    </div>
                  </div>
                ))}

                {data.bookings
                  .filter((b: any) => b.roomId === room.id)
                  .map((booking: any) => (
                    <BookingHoverCard
                      key={booking.id}
                      booking={booking}
                      dateRange={dateRange}
                      daysToShow={daysToShow}
                      onManage={(b: any) => {
                        setActiveBooking(b);
                        setIsManageOpen(true);
                      }}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FOOTER LEGEND */}
      <div className="p-2 px-4 bg-slate-50 border-t border-slate-200 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-indigo-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Checked In
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Reserved
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-rose-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Checked Out
          </span>
        </div>
      </div>

      {/* Modals remain the same */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        gridData={selection}
        rooms={filteredRooms}
      />
      <BookingManagerModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        bookingId={activeBooking?.id}
        booking={activeBooking}
      />
    </div>
  );
}
