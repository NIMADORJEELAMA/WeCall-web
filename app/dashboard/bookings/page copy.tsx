"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  UserPlus,
  Phone,
  Loader2,
  Search,
  CalendarDays,
  MoreHorizontal,
  Receipt,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import CheckInModal from "@/components/rooms/CheckInModal";
import CheckOutSummary from "@/components/rooms/CheckOutSummary";

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["active-bookings"],
    queryFn: async () => (await api.get("/rooms/bookings/active")).data,
  });

  const filteredBookings = bookings.filter(
    (b: any) =>
      b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.room.roomNumber.toString().includes(searchQuery),
  );

  return (
    <div className="p-8 space-y-8   mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-black rounded-md text-white">
              <UserCheck size={16} />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
              Front Office Operations
            </p>
          </div>
          <h1 className="text-3xl font-black  tracking-tighter text-slate-900 uppercase">
            Front Desk
          </h1>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
        >
          <UserPlus className="mr-2 h-4 w-4" /> New Check-In
        </Button>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            placeholder="Search guests or rooms..."
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl text-sm font-medium focus-visible:ring-indigo-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Live Guest Count:
          </span>
          <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
            {bookings.length}
          </span>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="px-8 h-14 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Guest Details
              </TableHead>
              <TableHead className="px-8 h-14 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Room
              </TableHead>
              <TableHead className="px-8 h-14 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Check-In
              </TableHead>
              <TableHead className="px-8 h-14 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4} className="px-8 py-6">
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-20 text-center text-slate-400 font-medium "
                >
                  No active bookings found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking: any) => (
                <TableRow
                  key={booking.id}
                  className="group border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 uppercase  tracking-tight">
                        {booking.guestName}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mt-0.5">
                        <Phone size={12} className="text-slate-300" />
                        {booking.guestPhone || "No Phone"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5  text-slate-900 rounded-xl">
                      <span className="text-[12px] font-black ">
                        {booking.room.roomNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <CalendarDays size={14} className="text-indigo-400" />
                      {new Date(booking.checkIn).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => setActiveBookingId(booking.id)}
                        className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Receipt className="mr-2 h-3.5 w-3.5" /> Billing &
                        Checkout
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-xl"
                          >
                            <MoreHorizontal
                              size={16}
                              className="text-slate-400"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl"
                        >
                          <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-black">
                            Management
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs font-bold">
                            Edit Guest Info
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold">
                            Add Service Charge
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold text-red-600">
                            Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <CheckInModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {activeBookingId && (
        <CheckOutSummary
          bookingId={activeBookingId}
          onClose={() => setActiveBookingId(null)}
        />
      )}
    </div>
  );
}
