"use client";

import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfDay } from "date-fns";
import { CalendarDays, Phone, Hash, Users, Clock } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

interface BookingHoverCardProps {
  booking: any;
  dateRange: Date[];
  daysToShow: number;
  onManage: any;
}

export function BookingHoverCard({
  booking,
  dateRange,
  daysToShow,
  onManage,
}: BookingHoverCardProps) {
  const start = new Date(booking.checkIn);
  const end = booking.checkOut ? new Date(booking.checkOut) : new Date();

  const startPos = differenceInDays(
    startOfDay(start),
    startOfDay(dateRange[0]),
  );
  const duration = Math.max(
    1,
    differenceInDays(startOfDay(end), startOfDay(start)),
  );

  const left = Math.max(0, (startPos / daysToShow) * 100);
  const width = (duration / daysToShow) * 100;

  const isCheckedIn = booking.status === "CHECKED_IN";

  return (
    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div
          onClick={(e) => {
            e.stopPropagation(); // Prevents triggering the cell's handleCellClick
            onManage(booking);
          }}
          style={{ left: `${left}%`, width: `${width}%` }}
          className={cn(
            "absolute top-2 h-14 z-20 rounded-xl border-l-4 p-2 shadow-sm cursor-pointer transition-all hover:brightness-95 select-none",
            isCheckedIn
              ? "bg-indigo-100 border-indigo-500 text-indigo-700"
              : "bg-amber-100 border-amber-500 text-amber-700",
          )}
        >
          <p className="text-[10px] font-black uppercase truncate leading-tight">
            {booking.guestName}
          </p>
          <div className="flex items-center gap-1 opacity-60">
            <Clock size={8} />
            <span className="text-[8px] font-bold">
              {duration} {duration === 1 ? "Night" : "Nights"}
            </span>
          </div>
        </div>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="start"
        className="w-80 p-0 overflow-hidden rounded-2xl border-none shadow-2xl"
      >
        {/* Header Section */}
        <div
          className={cn(
            "p-4 text-white",
            isCheckedIn ? "bg-indigo-600" : "bg-amber-600",
          )}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-base font-bold leading-none">
                {booking.guestName}
              </h3>
              <p className="text-[10px] opacity-80 font-medium">
                REF: {booking.id.split("-")[0].toUpperCase()}
              </p>
            </div>
            <Badge className="bg-white/20 hover:bg-white/20 border-none text-white text-[10px] backdrop-blur-md">
              {booking.status}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 bg-white space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Phone size={12} /> Contact
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {booking.guestPhone || "No Phone"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Hash size={12} /> Identity
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {booking.documentId || "Not Provided"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
              <CalendarDays size={12} /> Stay Period
            </p>
            <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {format(start, "MMM dd")} — {format(end, "MMM dd, yyyy")}
            </p>
          </div>

          {booking.secondaryGuests?.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-2">
                <Users size={12} /> Additional Guests (
                {booking.secondaryGuests.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {booking.secondaryGuests.map((g: any, i: number) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[9px] bg-slate-100 text-slate-600 border-none"
                  >
                    {g.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
