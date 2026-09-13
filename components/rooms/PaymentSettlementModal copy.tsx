"use client";

import { useState } from "react";
import { Loader2, Smartphone, Banknote, ReceiptText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

export default function PaymentSettlementModal({
  isOpen,
  onClose,
  billData,
  onConfirm,
  isPending,
}: any) {
  const [paymentMode, setPaymentMode] = useState<"CASH" | "ONLINE" | "SPLIT">(
    "CASH",
  );
  const [splitOnline, setSplitOnline] = useState<number>(0);
  console.log("billData", billData);
  const splitCash = Math.max(0, billData.grandTotal - splitOnline);
  const billNo = `INV-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Final Bill Settlement</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {/* 1. RESORT HEADER */}
          <div className="text-center space-y-1 mb-8">
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              Gairigaon Hill Top Resort
            </h1>
            <p className="text-[11px] font-bold text-slate-500 tracking-widest">
              PH: +91 8328708365
            </p>
            <div className="flex justify-center pt-2">
              <div className="h-px w-12 bg-slate-200" />
            </div>
          </div>

          {/* 2. GUEST & BILL METADATA */}
          <div className="grid grid-cols-2 gap-y-3 text-[11px] mb-6 text-slate-600">
            <div>
              <p className="uppercase text-[9px] font-black text-slate-400">
                Guest Name
              </p>
              <p className="font-bold text-slate-900">
                {billData?.booking?.guestName || "Walk-in Guest"}
              </p>
            </div>
            <div className="text-right">
              <p className="uppercase text-[9px] font-black text-slate-400">
                Bill No
              </p>
              <p className="font-bold text-slate-900">#{billNo}</p>
            </div>
            <div>
              <p className="uppercase text-[9px] font-black text-slate-400">
                Date
              </p>
              <p className="font-bold text-slate-900">
                {format(new Date(), "dd MMM, yyyy")}
              </p>
            </div>
            <div className="text-right">
              <p className="uppercase text-[9px] font-black text-slate-400">
                Checkout
              </p>
              <p className="font-bold text-slate-900">
                {format(
                  new Date(billData.checkOutDate || new Date()),
                  "hh:mm a",
                )}
              </p>
            </div>
          </div>

          {/* 3. ITEM TABLE */}
          <div className="space-y-4">
            <div className="border-t border-b border-dashed border-slate-200 py-3">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amt</div>
              </div>

              {/* Room Charge Row */}
              <div className="grid grid-cols-12 gap-2 text-xs py-2 items-center">
                <div className="col-span-6 font-bold text-slate-800">
                  Room Stay Charges
                </div>
                <div className="col-span-2 text-center text-slate-500">
                  {billData.nights}
                </div>
                <div className="col-span-2 text-right text-slate-500">
                  ₹{billData.booking?.room?.basePrice}
                </div>
                <div className="col-span-2 text-right font-black text-slate-900">
                  ₹{billData.roomTotal}
                </div>
              </div>

              {/* Food Items Rows */}
              {billData.foodItems?.map((item: any) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 text-xs py-1.5 items-center"
                >
                  <div className="col-span-6 text-slate-700 truncate">
                    {item.menuItem?.name}
                  </div>
                  <div className="col-span-2 text-center text-slate-500">
                    {item.quantity}
                  </div>
                  <div className="col-span-2 text-right text-slate-500">
                    ₹{item.priceAtOrder}
                  </div>
                  <div className="col-span-2 text-right font-bold text-slate-900">
                    ₹{item.quantity * item.priceAtOrder}
                  </div>
                </div>
              ))}
            </div>

            {/* 4. ADJUSTMENTS & TAXES */}
            <div className="space-y-2 px-1">
              {billData.miscCharges > 0 && (
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Advance Payment</span>
                  <span className="text-slate-900">
                    ₹{billData?.booking?.advanceAmount}
                  </span>
                </div>
              )}
              {billData.miscCharges > 0 && (
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Miscellaneous Charges</span>
                  <span className="text-slate-900">
                    ₹{billData.miscCharges}
                  </span>
                </div>
              )}

              {billData.discount > 0 && (
                <div className="flex justify-between text-xs font-medium text-emerald-600">
                  <span className="">Discount Applied</span>
                  <span>- ₹{billData.discount}</span>
                </div>
              )}
            </div>

            {/* 5. GRAND TOTAL */}
            <div className="flex justify-between items-baseline py-4 px-0 border-t border-slate-200 mt-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Grand Total
              </span>
              <span className="text-3xl font-black tracking-tighter text-slate-900 text-right">
                ₹{billData.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 6. PAYMENT SLIDER & INPUTS */}
          <div className="mt-8 space-y-4">
            <div className="p-1 bg-slate-100 rounded-xl flex gap-1 h-11 relative items-center">
              {(["CASH", "ONLINE", "SPLIT"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={cn(
                    "flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all z-10",
                    paymentMode === mode
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {paymentMode === "SPLIT" ? (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    Online Part
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="0" // Set your placeholder here
                      value={splitOnline === 0 ? "" : splitOnline} // If 0, show empty so placeholder appears
                      onChange={(e) =>
                        setSplitOnline(Number(e.target.value) || 0)
                      } // If empty, set to 0
                      className="h-10 bg-slate-50 border-none rounded-xl pl-8 font-bold text-xs"
                    />
                    <Smartphone
                      className="absolute left-2.5 top-3 text-slate-400"
                      size={14}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
                    Cash Part
                  </label>
                  <div className="relative">
                    <Input
                      readOnly
                      value={splitCash}
                      className="h-10 bg-slate-100 border-none rounded-xl pl-8 font-bold text-xs text-slate-500 cursor-not-allowed"
                    />
                    <Banknote
                      className="absolute left-2.5 top-3 text-slate-400"
                      size={14}
                    />
                  </div>
                </div>
              </div>
            ) : (
              ""
            )}
          </div>

          {/* 7. ACTIONS */}
          <div className="mt-8 flex gap-3">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl text-slate-400 font-bold h-12"
              onClick={onClose}
            >
              Back
            </Button>
            <Button
              className="flex-[2.5] rounded-xl bg-slate-900 hover:bg-black text-white h-12 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
              disabled={
                isPending ||
                (paymentMode === "SPLIT" && splitOnline > billData.grandTotal)
              }
              onClick={() =>
                onConfirm({
                  paymentMode,
                  cashAmount:
                    paymentMode === "SPLIT"
                      ? splitCash
                      : paymentMode === "CASH"
                        ? billData.grandTotal
                        : 0,
                  onlineAmount:
                    paymentMode === "SPLIT"
                      ? splitOnline
                      : paymentMode === "ONLINE"
                        ? billData.grandTotal
                        : 0,
                })
              }
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Confirm Settlement"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
