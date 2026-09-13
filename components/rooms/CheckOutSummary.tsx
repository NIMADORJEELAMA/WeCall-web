"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  X,
  Printer,
  Loader2,
  CheckCircle,
  BedDouble,
  Utensils,
  Percent,
  Wallet,
  Globe,
  Receipt,
  History,
  Phone,
  ArrowRight,
  Info,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function CheckOutSummary({ bookingId, onClose }: any) {
  const queryClient = useQueryClient();
  const [discount, setDiscount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["checkout-preview", bookingId],
    queryFn: async () =>
      (await api.get(`/rooms/bookings/${bookingId}/summary`)).data,
  });

  const subtotal = data?.breakdown?.grandTotal || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const totalEntered = Number(cashAmount) + Number(onlineAmount);
  const isPaymentValid = Math.abs(totalEntered - grandTotal) < 0.01;

  useEffect(() => {
    if (data && cashAmount === 0 && onlineAmount === 0) {
      setCashAmount(subtotal - discount);
    }
  }, [data, subtotal, discount]);

  const checkoutMutation = useMutation({
    mutationFn: async () =>
      await api.post(`/rooms/check-out/${bookingId}`, {
        discount,
        cashAmount,
        onlineAmount,
      }),
    onSuccess: () => {
      toast.success("Transaction Finalized Successfully");
      queryClient.invalidateQueries({ queryKey: ["active-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onClose();
    },
  });

  if (isLoading)
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* --- HEADER: IDENTITY ZONE --- */}
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-2xl italic tracking-tighter border border-white/20 shadow-inner uppercase">
              {data.guestName.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                  {data.guestName}
                </h2>
                <Badge className="bg-emerald-500 text-white border-none text-[10px] uppercase font-black px-3">
                  Settlement Pending
                </Badge>
              </div>
              <div className="flex items-center gap-6 mt-3">
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <Phone size={12} className="text-indigo-400" />{" "}
                  {data.guestPhone || "No contact"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em]">
                  <Receipt size={12} className="text-indigo-400" /> Folio: #
                  {bookingId.split("-")[0].toUpperCase()}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-full h-12 w-12 text-white hover:bg-white/10"
          >
            <X size={24} />
          </Button>
        </div>

        {/* --- BODY: THE AUDIT GRID --- */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-x divide-slate-100">
          {/* LEFT: Room Audit (4 cols) */}
          <div className="lg:col-span-4 p-8 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-slate-900 text-white rounded-xl">
                <BedDouble size={20} />
              </div>
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                Accommodation
              </h3>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <BedDouble size={80} />
                </div>
                <p className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">
                  {data.room.type}
                </p>
                <h4 className="text-5xl font-black text-slate-900 tracking-tighter italic">
                  {data.room.roomNumber}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
                <div className="bg-white p-5">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    Base Rate
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    ₹{data.breakdown.roomPrice.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white p-5">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    Duration
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {data.breakdown.nights} Nights
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-end p-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    Sub-Total
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    ₹{data.breakdown.roomTotal.toLocaleString()}
                  </p>
                </div>
                <ArrowRight className="text-slate-200 mb-2" size={24} />
              </div>
            </div>
          </div>

          {/* MIDDLE: Services Audit (4 cols) W */}
          <div className="lg:col-span-5 p-8 bg-white">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Utensils size={20} />
              </div>
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                Dining & Add-ons
              </h3>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {data.breakdown.foodDetails.length > 0 ? (
                data.breakdown.foodDetails.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                        x{item.quantity}
                      </div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                        {item.name}
                      </p>
                    </div>
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50">
                  <Info className="text-slate-300 mb-2" size={24} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    No service charges recorded
                  </p>
                </div>
              )}
            </div>

            {data.breakdown.foodDetails.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                <p className="text-xs font-black text-slate-400 uppercase">
                  Service Total
                </p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">
                  ₹{data.breakdown.foodTotal.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Settlement Actions (3 cols) */}
          <div className="lg:col-span-3 p-8 bg-slate-50/80">
            <div className="flex items-center gap-2 mb-8">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">
                Settlement Terminal
              </h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  Adjustment (₹)
                </label>
                <div className="relative">
                  <Percent
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="h-12 pl-10 rounded-xl border-slate-200 font-black focus:ring-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                  Physical Cash (₹)
                </label>
                <div className="relative">
                  <Wallet
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"
                    size={14}
                  />
                  <Input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="h-12 pl-10 rounded-xl border-emerald-100 font-black text-emerald-700 bg-emerald-50/30 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                  Digital Transfer (₹)
                </label>
                <div className="relative">
                  <Globe
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"
                    size={14}
                  />
                  <Input
                    type="number"
                    value={onlineAmount}
                    onChange={(e) => setOnlineAmount(Number(e.target.value))}
                    className="h-12 pl-10 rounded-xl border-blue-100 font-black text-blue-700 bg-blue-50/30 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div
                className={`p-6 rounded-[24px] border-2 transition-all duration-500 ${isPaymentValid ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" : "bg-white border-rose-200 text-rose-500"}`}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-70 text-center">
                  Final Payable Amount
                </p>
                <p className="text-3xl font-black tracking-tighter text-center">
                  ₹{grandTotal.toLocaleString()}
                </p>
                {!isPaymentValid && (
                  <div className="mt-2 text-center animate-bounce">
                    <p className="text-[9px] font-black uppercase">
                      Unbalanced: ₹
                      {Math.abs(grandTotal - totalEntered).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER: FINAL EXECUTION --- */}
        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 shrink-0">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border-slate-200"
          >
            <Printer size={18} className="mr-2" /> Export Audit Draft
          </Button>
          <Button
            disabled={checkoutMutation.isPending || !isPaymentValid}
            onClick={() => checkoutMutation.mutate()}
            className={`flex-[2] h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all
              ${isPaymentValid ? "bg-slate-900 hover:bg-indigo-600 text-white" : "bg-slate-100 text-slate-300 cursor-not-allowed"}
            `}
          >
            {checkoutMutation.isPending ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <CheckCircle size={18} className="mr-2" /> Finalize Settlement &
                Check-out
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
