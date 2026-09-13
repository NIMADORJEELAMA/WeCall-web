// "use client";

// import { useRef, useState } from "react";
// import { Loader2, Smartphone, Banknote, ReceiptText } from "lucide-react";
// import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { cn } from "@/lib/utils";
// import { format } from "date-fns";
// import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
// import { useReactToPrint } from "react-to-print";

// export default function PaymentSettlementModal({
//   isOpen,
//   onClose,
//   billData,
//   onConfirm,
//   isPending,
// }: any) {
//   const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "SPLIT">(
//     "CASH",
//   );
//   const receiptRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [splitOnline, setSplitOnline] = useState<number>(0);

//   console.log("billData", billData);

//   const splitCash = Math.max(0, billData.grandTotal - splitOnline);
//   const billNo = `INV-${billData.booking?.id.slice(-6).toUpperCase()}`;

//   const handlePrint = useReactToPrint({
//     contentRef: contentRef,
//     documentTitle: `Bill_${billNo}`,
//     pageStyle: `
//       @page {
//         size: 80mm auto;
//         margin: 0;
//         padding: 0;
//       }
//       body {
//         margin: 0;
//         padding: 0;
//         width: 80mm;
//       }
//     `,
//   });

//   return (
//     <>
//       <style jsx global>{`
//         @media print {
//           /* Hide everything except print content */
//           body * {
//             visibility: hidden;
//           }

//           .print-content,
//           .print-content * {
//             visibility: visible;
//           }

//           .print-content {
//             position: absolute;
//             left: 0;
//             top: 0;
//             width: 80mm;
//             background: white;
//           }

//           /* Hide non-printable elements during print */
//           .non-printable {
//             display: none !important;
//             visibility: hidden !important;
//           }

//           /* Optimize text rendering for thermal printers */
//           .print-content {
//             color: black;
//             background: white;
//             line-height: 1.4;
//           }
//         }
//       `}</style>

//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white">
//           <DialogHeader className="sr-only">
//             <DialogTitle>Final Bill Settlement</DialogTitle>
//             <DialogDescription></DialogDescription>
//           </DialogHeader>

//           <div
//             ref={contentRef}
//             className="print-content p-4 font-mono max-h-[90vh] overflow-y-auto custom-scrollbar"
//           >
//             {/* 1. RESORT HEADER */}
//             <div className="text-center space-y-1 mb-8">
//               <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
//                 Gairigaon Hill Top Resort
//               </h1>
//               <p className="text-[11px] font-bold text-slate-500 tracking-widest">
//                 PH: +91 8328708365
//               </p>
//               <div className="flex justify-center pt-2">
//                 <div className="h-px w-12 bg-slate-200" />
//               </div>
//             </div>

//             {/* 2. GUEST & BILL METADATA */}
//             <div className="grid grid-cols-2 gap-y-3 text-[11px] mb-6 text-slate-600">
//               <div>
//                 <p className="uppercase text-[9px] font-black text-slate-400">
//                   Guest Name
//                 </p>
//                 <p className="font-bold text-slate-900">
//                   {billData?.booking?.guestName || "Walk-in Guest"}
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="uppercase text-[9px] font-black text-slate-400">
//                   Bill No
//                 </p>
//                 <p className="font-bold text-slate-900">#{billNo}</p>
//               </div>
//               <div>
//                 <p className="uppercase text-[9px] font-black text-slate-400">
//                   Date
//                 </p>
//                 <p className="font-bold text-slate-900">
//                   {format(new Date(), "dd MMM, yyyy")}
//                 </p>
//               </div>
//               <div className="text-right">
//                 <p className="uppercase text-[9px] font-black text-slate-400">
//                   Checkout
//                 </p>
//                 <p className="font-bold text-slate-900">
//                   {format(
//                     new Date(billData.checkOutDate || new Date()),
//                     "hh:mm a",
//                   )}
//                 </p>
//               </div>
//             </div>

//             {/* 3. ITEM TABLE */}
//             <div className="space-y-4">
//               <div className="border-t border-b border-dashed border-slate-200 py-3">
//                 {/* Table Header */}
//                 <div className="grid grid-cols-12 gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
//                   <div className="col-span-6">Description</div>
//                   <div className="col-span-2 text-center">Qty</div>
//                   <div className="col-span-2 text-right">Rate</div>
//                   <div className="col-span-2 text-right">Amt</div>
//                 </div>

//                 {/* Room Charge Row */}
//                 <div className="grid grid-cols-12 gap-2 text-xs py-2 items-center">
//                   <div className="col-span-6 font-bold text-slate-800">
//                     Room Stay Charges
//                   </div>
//                   <div className="col-span-2 text-center text-slate-500">
//                     {billData.nights}
//                   </div>
//                   <div className="col-span-2 text-right text-slate-500">
//                     ₹{billData.booking?.room?.basePrice}
//                   </div>
//                   <div className="col-span-2 text-right font-black text-slate-900">
//                     ₹{billData.roomTotal}
//                   </div>
//                 </div>

//                 {/* Food Items Rows */}
//                 {billData.foodItems?.map((item: any) => (
//                   <div
//                     key={item.id}
//                     className="grid grid-cols-12 gap-2 text-xs py-1.5 items-center"
//                   >
//                     <div className="col-span-6 text-slate-700 truncate">
//                       {item.menuItem?.name}
//                     </div>
//                     <div className="col-span-2 text-center text-slate-500">
//                       {item.quantity}
//                     </div>
//                     <div className="col-span-2 text-right text-slate-500">
//                       ₹{item.priceAtOrder}
//                     </div>
//                     <div className="col-span-2 text-right font-bold text-slate-900">
//                       ₹{item.quantity * item.priceAtOrder}
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* 4. ADJUSTMENTS & TAXES */}
//               <div className="space-y-2 px-1">
//                 {billData.miscCharges > 0 && (
//                   <div className="flex justify-between text-xs font-medium text-slate-500">
//                     <span>Advance Payment</span>
//                     <span className="text-slate-900">
//                       - ₹{billData?.booking?.advanceAmount}
//                     </span>
//                   </div>
//                 )}
//                 {billData.miscCharges > 0 && (
//                   <div className="flex justify-between text-xs font-medium text-slate-500">
//                     <span>Miscellaneous Charges</span>
//                     <span className="text-slate-900">
//                       ₹{billData.miscCharges}
//                     </span>
//                   </div>
//                 )}

//                 {billData.discount > 0 && (
//                   <div className="flex justify-between text-xs font-medium text-emerald-600">
//                     <span className="">Discount Applied</span>
//                     <span>- ₹{billData.discount}</span>
//                   </div>
//                 )}
//               </div>

//               {/* 5. GRAND TOTAL */}
//               <div className="flex justify-between items-baseline py-4 px-0 border-t border-slate-200 mt-4">
//                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//                   Grand Total
//                 </span>
//                 <span className="text-3xl font-black tracking-tighter text-slate-900 text-right">
//                   ₹{billData.grandTotal.toLocaleString()}
//                 </span>
//               </div>
//             </div>

//             {/* 6. PAYMENT SLIDER & INPUTS - NOT PRINTED */}
//             <div className="mt-8 space-y-4 non-printable">
//               <div className="p-1 bg-slate-100 rounded-xl flex gap-1 h-11 relative items-center">
//                 {(["CASH", "UPI", "SPLIT"] as const).map((mode) => (
//                   <button
//                     key={mode}
//                     onClick={() => setPaymentMode(mode)}
//                     className={cn(
//                       "flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all z-10",
//                       paymentMode === mode
//                         ? "bg-white text-slate-900 shadow-sm"
//                         : "text-slate-400 hover:text-slate-600",
//                     )}
//                   >
//                     {mode}
//                   </button>
//                 ))}
//               </div>

//               {paymentMode === "SPLIT" ? (
//                 <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
//                       Online Part
//                     </label>
//                     <div className="relative">
//                       <Input
//                         type="text"
//                         placeholder="0"
//                         value={splitOnline === 0 ? "" : splitOnline}
//                         onChange={(e) =>
//                           setSplitOnline(Number(e.target.value) || 0)
//                         }
//                         className="h-10 bg-slate-50 border-none rounded-xl pl-8 font-bold text-xs"
//                       />
//                       <Smartphone
//                         className="absolute left-2.5 top-3 text-slate-400"
//                         size={14}
//                       />
//                     </div>
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">
//                       Cash Part
//                     </label>
//                     <div className="relative">
//                       <Input
//                         readOnly
//                         value={splitCash}
//                         className="h-10 bg-slate-100 border-none rounded-xl pl-8 font-bold text-xs text-slate-500 cursor-not-allowed"
//                       />
//                       <Banknote
//                         className="absolute left-2.5 top-3 text-slate-400"
//                         size={14}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 ""
//               )}
//             </div>

//             {/* 7. ACTIONS - NOT PRINTED */}
//             <div className="mt-8 flex gap-3 non-printable">
//               <Button
//                 variant="terminalGhost"
//                 className="flex-1 rounded-xl text-slate-400 font-bold h-12"
//                 onClick={handlePrint}
//               >
//                 Print Bill
//               </Button>
//               <Button
//                 className="flex-[2.5] rounded-xl bg-slate-900 hover:bg-black text-white h-12 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
//                 disabled={
//                   isPending ||
//                   (paymentMode === "SPLIT" && splitOnline > billData.grandTotal)
//                 }
//                 onClick={() =>
//                   onConfirm({
//                     paymentMode,
//                     cashAmount:
//                       paymentMode === "SPLIT"
//                         ? splitCash
//                         : paymentMode === "CASH"
//                           ? billData.grandTotal
//                           : 0,
//                     onlineAmount:
//                       paymentMode === "SPLIT"
//                         ? splitOnline
//                         : paymentMode === "UPI"
//                           ? billData.grandTotal
//                           : 0,
//                   })
//                 }
//               >
//                 {isPending ? (
//                   <Loader2 className="animate-spin" />
//                 ) : (
//                   "Confirm Settlement"
//                 )}
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }

"use client";

import { useState } from "react";
import { Loader2, Smartphone, Banknote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function PaymentSettlementModal({
  isOpen,
  onClose,
  billData,
  onConfirm,
  isPending,
}: any) {
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "SPLIT">(
    "CASH",
  );
  const [splitOnline, setSplitOnline] = useState<number>(0);

  const splitCash = Math.max(0, billData.grandTotal - splitOnline);
  const billNo = `INV-${billData.booking?.id.slice(-6).toUpperCase()}`;

  /* ================= QZ TRAY PRINT LOGIC ================= */
  const printThermalQZ = async () => {
    try {
      if (typeof window === "undefined" || !window.qz) {
        toast.error("QZ Tray is not running.");
        return;
      }

      if (!window.qz.websocket.isActive()) {
        await window.qz.websocket.connect();
      }

      // ESC/POS Commands
      const ESC = "\x1B";
      const CENTER = ESC + "a" + "\x01";
      const LEFT = ESC + "a" + "\x00";
      const BOLD_ON = ESC + "E" + "\x01";
      const BOLD_OFF = ESC + "E" + "\x00";
      const LINE_WIDTH = 42; // standard 80mm width roughly

      const padRight = (text: string, len: number) =>
        text.length >= len
          ? text.slice(0, len)
          : text + " ".repeat(len - text.length);

      const padLeft = (text: string, len: number) =>
        text.length >= len
          ? text.slice(0, len)
          : " ".repeat(len - text.length) + text;

      // Helper for 4-column row (Desc, Qty, Rate, Amt)
      const formatRow = (
        desc: string,
        qty: string,
        rate: string,
        amt: string,
      ) => {
        return (
          padRight(desc.slice(0, 16), 17) +
          padLeft(qty, 4) +
          padLeft(rate, 10) +
          padLeft(amt, 11)
        );
      };

      let itemsText =
        formatRow(
          "Room Stay",
          String(billData.nights),
          String(billData.booking?.room?.basePrice),
          String(billData.roomTotal),
        ) + "\n";

      billData.foodItems?.forEach((i: any) => {
        itemsText +=
          formatRow(
            i.menuItem?.name || "Food",
            String(i.quantity),
            String(i.priceAtOrder),
            String(i.quantity * i.priceAtOrder),
          ) + "\n";
      });

      const receipt = [
        CENTER,
        BOLD_ON,
        "GAIRIGAON HILL TOP RESORT\n",
        BOLD_OFF,
        "Jaigaon, West Bengal\n",
        "PH: +91 8328708365\n",
        "-".repeat(LINE_WIDTH) + "\n",
        LEFT,
        `BILL NO: #${billNo}\n`,
        `GUEST  : ${billData?.booking?.guestName || "Walk-in"}\n`,
        `DATE   : ${format(new Date(), "dd MMM, yyyy hh:mm a")}\n`,
        "-".repeat(LINE_WIDTH) + "\n",
        formatRow("ITEM", "QTY", "RATE", "AMT") + "\n",
        "-".repeat(LINE_WIDTH) + "\n",
        itemsText,

        "-".repeat(LINE_WIDTH) + "\n",

        // ADD THIS SECTION:
        billData.miscCharges > 0
          ? padRight("MISC CHARGES", 31) +
            padLeft(`Rs.${billData.miscCharges}`, 11) +
            "\n"
          : "",

        billData.discount > 0
          ? padRight("DISCOUNT", 31) +
            padLeft(`-Rs.${billData.discount}`, 11) +
            "\n"
          : "",
        billData.discount > 0
          ? padRight("DISCOUNT", 31) +
            padLeft(`-₹${billData.discount}`, 11) +
            "\n"
          : "",
        billData.booking?.advanceAmount > 0
          ? padRight("ADVANCE PAID", 31) +
            padLeft(`-₹${billData.booking.advanceAmount}`, 11) +
            "\n"
          : "",
        BOLD_ON,
        padRight("GRAND TOTAL", 31) +
          padLeft(`Rs.${billData.grandTotal}`, 11) +
          "\n",
        BOLD_OFF,
        "-".repeat(LINE_WIDTH) + "\n",
        CENTER,
        `PAYMENT MODE: ${paymentMode}\n`,
        paymentMode === "SPLIT"
          ? `CASH: ${splitCash} | UPI: ${splitOnline}\n`
          : "",
        "THANK YOU FOR VISITING!\n",
        "\n\n\n\x1Bm",
      ].join("");

      const printerName = localStorage.getItem("printer") || "Thermal";
      const config = window.qz.configs.create(printerName);
      await window.qz.print(config, [
        { type: "raw", format: "plain", data: receipt },
      ]);
      toast.success("Printing...");
    } catch (err: any) {
      toast.error("Print Error: " + (err.message || "Unknown error"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white">
        <DialogHeader className="sr-only">
          <DialogTitle>Final Bill Settlement</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="p-6 font-mono max-h-[90vh] overflow-y-auto">
          {/* 1. HEADER */}
          <div className="text-center space-y-1 mb-8">
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              Gairigaon Hill Top
            </h1>
            <p className="text-[11px] font-bold text-slate-500 tracking-widest">
              PH: +91 8328708365
            </p>
          </div>

          {/* 2. GUEST INFO */}
          <div className="grid grid-cols-2 gap-y-3 text-[11px] mb-6 text-slate-600">
            <div>
              <p className="uppercase text-[9px] font-black text-slate-400">
                Guest
              </p>
              <p className="font-bold text-slate-900">
                {billData?.booking?.guestName}
              </p>
            </div>
            <div className="text-right">
              <p className="uppercase text-[9px] font-black text-slate-400">
                Bill No
              </p>
              <p className="font-bold text-slate-900">#{billNo}</p>
            </div>
          </div>
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
          </div>
          {/* 4. ADJUSTMENTS & TAXES */}
          <div className="space-y-2 px-1">
            {billData?.booking?.advanceAmount > 0 && (
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Advance Payment</span>
                <span className="text-slate-900">
                  - ₹{billData?.booking?.advanceAmount}
                </span>
              </div>
            )}
            {billData.miscCharges > 0 && (
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Miscellaneous Charges</span>
                <span className="text-slate-900">₹{billData.miscCharges}</span>
              </div>
            )}

            {billData.discount > 0 && (
              <div className="flex justify-between text-xs font-medium text-emerald-600">
                <span className="">Discount Applied</span>
                <span>- ₹{billData.discount}</span>
              </div>
            )}
          </div>

          {/* 3. TOTAL DISPLAY */}
          <div className="flex justify-between items-baseline py-4 px-0 border-t border-b border-dashed border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400">
              Grand Total
            </span>
            <span className="text-3xl font-black tracking-tighter text-slate-900">
              ₹{billData.grandTotal.toLocaleString()}
            </span>
          </div>

          {/* 4. PAYMENT MODE SELECTOR */}
          <div className="mt-8 space-y-4">
            <div className="p-1 bg-slate-100 rounded-xl flex gap-1 h-11 relative items-center">
              {(["CASH", "UPI", "SPLIT"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={cn(
                    "flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                    paymentMode === mode
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {paymentMode === "SPLIT" && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Online
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={splitOnline || ""}
                      onChange={(e) =>
                        setSplitOnline(Number(e.target.value) || 0)
                      }
                      className="h-10 bg-slate-50 border-none rounded-xl pl-8 font-bold"
                    />
                    <Smartphone
                      className="absolute left-2.5 top-3 text-slate-400"
                      size={14}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    Cash
                  </label>
                  <div className="relative">
                    <Input
                      readOnly
                      value={splitCash}
                      className="h-10 bg-slate-100 border-none rounded-xl pl-8 font-bold text-slate-500"
                    />
                    <Banknote
                      className="absolute left-2.5 top-3 text-slate-400"
                      size={14}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. ACTIONS */}
          <div className="mt-8 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl text-slate-400 font-bold h-12"
              onClick={printThermalQZ}
            >
              Print Receipt
            </Button>
            <Button
              className="flex-[2.5] rounded-xl bg-slate-900 hover:bg-black text-white h-12 font-black text-[10px] uppercase tracking-[0.2em]"
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
                      : paymentMode === "UPI"
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
