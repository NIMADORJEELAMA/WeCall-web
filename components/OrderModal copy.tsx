"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { Beer, X, Utensils, Printer } from "lucide-react";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog";
import dayjs from "dayjs";
import { useTableSocket } from "@/hooks/use-table-socket";

interface OrderModalProps {
  table: any;
  onClose: () => void;
  onRefresh: () => void;
}

export default function OrderModal({
  table,
  onClose,
  onRefresh,
}: OrderModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Track if we are in "Receipt Mode"
  // Inside OrderModal component
  const [isSplitPay, setIsSplitPay] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [onlineAmount, setOnlineAmount] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"FULL_CASH" | "FULL_UPI">(
    "FULL_CASH",
  );
  // Update amounts whenever order total changes or split is toggled
  useEffect(() => {
    if (order) {
      const total = Number(order.totalAmount || calculateTotal());
      setOnlineAmount(total);
      setCashAmount(0);
    }
  }, [order, isSplitPay]);

  // Helper to auto-calculate the other field
  const handleCashChange = (val: number) => {
    const total = Number(order.totalAmount || calculateTotal());
    setCashAmount(val);
    setOnlineAmount(Math.max(0, total - val));
  };

  const [isBilled, setIsBilled] = useState(false);
  const fetchActiveOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/active/${table.id}`);
      setOrder(res.data);
      // If the order from DB is already BILLED, show receipt immediately
      if (res.data?.status === "BILLED") setIsBilled(true);
    } catch (err) {
      console.error("Error fetching order:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [table.id]);

  useTableSocket(
    table.id,
    useCallback(() => {
      fetchActiveOrder();
    }, [fetchActiveOrder]),
  );
  // useEffect(() => {
  //   const socket = io("http://localhost:3000");
  //   socket.on("tableUpdated", (data) => {
  //     if (data.tableId === table.id) {
  //       fetchActiveOrder();
  //     }
  //   });
  //   return () => {
  //     socket.disconnect();
  //   };
  // }, [table.id, fetchActiveOrder]);

  // Inside OrderModal.tsx
  useEffect(() => {
    // If we already have the order data (from the History table), don't fetch active
    if (table.activeOrder) {
      setOrder(table.activeOrder);
      setIsBilled(
        table.activeOrder.status === "BILLED" ||
          table.activeOrder.status === "PAID",
      );
      setLoading(false);
      return;
    }

    // Existing fetchActiveOrder logic for the Dashboard...
  }, [table]);

  useEffect(() => {
    if (table.status === "OCCUPIED") {
      fetchActiveOrder();
    } else {
      setLoading(false);
    }
  }, [table.status, fetchActiveOrder]);

  const calculateTotal = () => {
    if (!order?.items) return 0;
    // Only sum SERVED items for the total
    return order.items.reduce((acc: number, item: any) => {
      if (item.status !== "SERVED") return acc;
      return acc + item.priceAtOrder * item.quantity;
    }, 0);
  };

  const handleSettle = async () => {
    if (!order) return;

    if (hasPending && !isConfirmOpen) {
      setIsConfirmOpen(true);
      return;
    }

    try {
      const res = await api.patch(`/orders/${order.id}/generate-bill`);

      // FIX: Keep the existing items but update the order metadata
      setOrder({
        ...order, // Keep existing items/waiter info
        ...res.data, // Overwrite with new status and totalAmount from API
      });

      setIsBilled(true);
      toast.success("Bill Finalized");
    } catch (err) {
      toast.error("Failed to generate bill");
    }
  };

  // const handleSettle = async () => {
  //   if (!order) return;

  //   if (hasPending && !isConfirmOpen) {
  //     setIsConfirmOpen(true);
  //     return;
  //   }

  //   try {
  //     const res = await api.patch(`/orders/${order.id}/generate-bill`);

  //     setOrder(res.data);
  //     setIsBilled(true);
  //     toast.success("Bill Finalized (Pending items cancelled)");
  //     // onRefresh();
  //   } catch (err) {
  //     toast.error("Failed to generate bill");
  //   }
  // };

  const handleServeItem = async (itemId: string) => {
    try {
      await api.patch(`/orders/item/${itemId}/status`, { status: "SERVED" });
      toast.success("Item served");
      fetchActiveOrder();
      onRefresh();
    } catch (err) {
      toast.error("Failed to update item");
    }
  };

  const handleServeAll = async () => {
    const pending =
      order?.items?.filter((i: any) => i.status !== "SERVED") || [];
    if (pending.length === 0) return;
    try {
      await Promise.all(
        pending.map((item: any) =>
          api.patch(`/orders/item/${item.id}/status`, { status: "SERVED" }),
        ),
      );
      toast.success("All items marked as served");
      fetchActiveOrder();
      onRefresh();
    } catch (err) {
      toast.error("Failed to serve all items");
    }
  };

  const pendingItems =
    order?.items?.filter(
      (i: any) =>
        i.status === "PENDING" ||
        i.status === "PREPARING" ||
        i.status === "READY",
    ) || [];
  const servedItems =
    order?.items?.filter(
      (i: any) => i.status === "SERVED" || order.status === "BILLED",
    ) || [];
  const hasPending = pendingItems?.length > 0;

  const handlePayment = async (type: "FULL_CASH" | "FULL_UPI" | "SPLIT") => {
    if (!order) return;

    const total = Number(order.totalAmount || calculateTotal());
    let payload = { cash: 0, online: 0 };

    if (type === "FULL_CASH") payload = { cash: total, online: 0 };
    else if (type === "FULL_UPI") payload = { cash: 0, online: total };
    else payload = { cash: cashAmount, online: onlineAmount };

    // Validation: Ensure total matches
    if (payload.cash + payload.online !== total) {
      toast.error(`Total must equal ₹${total}`);
      return;
    }

    try {
      const loadingToast = toast.loading("Processing Payment...");
      await api.patch(`/orders/${order.id}/confirm-payment`, payload);

      toast.dismiss(loadingToast);
      toast.success("Payment successful!");
      onRefresh();
      onClose();
    } catch (err) {
      toast.error("Payment confirmation failed");
    }
  };
  // Inside OrderModal component
  const handleCancelItem = async (orderItemId: string) => {
    try {
      // You'll need to create this endpoint or use the one corresponding to your service
      await api.delete(`/orders/item/${orderItemId}`);
      toast.success("Item cancelled");

      // Refresh the local state
      fetchActiveOrder();
      onRefresh();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to cancel item";
      toast.error(errorMsg);
    }
  };
  const TypeBadge = ({ type }: { type: "FOOD" | "DRINKS" }) => {
    const isAlcohol = type === "DRINKS";

    return (
      <span
        className={`flex items-center gap-1 text-[7px] font-black uppercase px-2 py-[2px] rounded-full tracking-wider ${
          isAlcohol
            ? "bg-purple-100 text-purple-700"
            : "bg-orange-100 text-orange-700"
        }`}
      >
        {isAlcohol ? (
          <>
            <Beer size={10} />
            {/* <span>Drinks</span> */}
          </>
        ) : (
          <>
            <Utensils size={10} />
            {/* <span>Food</span> */}
          </>
        )}
      </span>
    );
  };
  /* ================= PRINT LOGIC (Thermal Monospace) ================= */

  const handlePrintReceipt = () => {
    if (!order) return;

    const win = window.open("", "", "width=1200,height=800");
    if (!win) return;

    const shortId = order.id.slice(-5).toUpperCase();
    const tableName = order.table?.number || "N/A";
    const categoryName = order?.table?.category?.name || "";
    const dineInfo = `${tableName} ${categoryName}`;

    // Helper functions for character-width alignment (STRICT 48 chars total)
    const padRight = (text: string | any[], len: number) =>
      text.length >= len
        ? text.slice(0, len)
        : text + " ".repeat(len - text.length);

    const padLeft = (text: string | any[], len: number) =>
      text.length >= len
        ? text.slice(0, len)
        : " ".repeat(len - text.length) + text;

    // 1. FILTER & MAP ITEMS
    const itemsText = (order.items || [])
      .filter((item: { status: string }) => item.status === "SERVED")
      .map(
        (item: {
          menuItem: { name: any };
          quantity: number;
          priceAtOrder: number;
        }) => {
          /** * COLUMN BUDGET (48 Total):
           * Name(26) + Qty(5) + Rate(8) + Amt(9) = 48
           */
          const name = padRight(String(item.menuItem.name).toUpperCase(), 26);
          const qty = padLeft(String(item.quantity), 5);
          const rate = padLeft(String(item.priceAtOrder), 8);
          const amt = padLeft(String(item.priceAtOrder * item.quantity), 9);
          return `${name}${qty}${rate}${amt}`;
        },
      )
      .join("\n");

    const receiptString = `
        GAIRIGAON HILL ECO TOURISM
             Jaigaon, West Bengal
                +91-7547957222
------------------------------------------------
BILL NO : #${shortId}
DINE IN : ${dineInfo}
WAITER  : ${order.waiter?.name || "N/A"}
DATE    : ${dayjs().format("DD/MM/YYYY hh:mm A")}
------------------------------------------------
ITEM                        QTY    RATE      AMT
------------------------------------------------
${itemsText}
------------------------------------------------
GRAND TOTAL                         ${padLeft("₹" + (order.totalAmount || calculateTotal()), 11)}
------------------------------------------------
            THANK YOU FOR VISITING!
              PLEASE VISIT AGAIN
`;

    win.document.write(`
    <html><head><style>
      @page { margin: 0; }
      body { 
        font-family: 'Courier New', Courier, monospace; 
        font-size: 15px; /* Slightly larger font for better readability */
        font-weight: 600;
        line-height: 1.4;
        white-space: pre; 
        margin: 0; 
        padding: 6mm; /* Adjusted padding */
        width: 48ch; /* Increased to 48 characters */
      }
    </style></head>
    <body onload="window.print(); window.close();">${receiptString}</body></html>
  `);
    win.document.close();
  };
  //   const handlePrintReceipt = () => {
  //     if (!order) return;

  //     const win = window.open("", "", "width=1200,height=800");
  //     if (!win) return;
  //     console.log("order==", order);
  //     const shortId = order.id.slice(-5).toUpperCase();
  //     const tableName = order.table?.number || "N/A";
  //     const categoryName = order.table?.category?.name;
  //     const isSplit = order.paymentMode === "SPLIT";
  //     const dineInfo = `${tableName} (${categoryName})`;
  //     // Helper functions for character-width alignment (STRICT 32 chars total)
  //     const padRight = (text: string, len: number) =>
  //       text.length >= len
  //         ? text.slice(0, len)
  //         : text + " ".repeat(len - text.length);

  //     const padLeft = (text: string, len: number) =>
  //       text.length >= len
  //         ? text.slice(0, len)
  //         : " ".repeat(len - text.length) + text;

  //     // 1. FILTER & MAP ITEMS (Only served items for the bill)
  //     const itemsText = (order.items || [])
  //       .filter((item: any) => item.status === "SERVED")
  //       .map((item: any) => {
  //         // COLUMN BUDGET: Name(12) + Qty(4) + Rate(7) + Amt(9) = 32
  //         const name = padRight(String(item.menuItem.name).toUpperCase(), 12);
  //         const qty = padLeft(String(item.quantity), 4);
  //         const rate = padLeft(String(item.priceAtOrder), 7);
  //         const amt = padLeft(String(item.priceAtOrder * item.quantity), 9);
  //         return `${name}${qty}${rate}${amt}`;
  //       })
  //       .join("\n");

  //     const receiptString = `
  //   GAIRIGAON HILL ECO TOURISM
  //       Jaigaon, West Bengal
  //           +91-7547957222
  // --------------------------------
  // BILL NO : #${shortId}
  // DINE IN :${dineInfo}
  // WAITER  : ${order.waiter?.name || "N/A"}
  // DATE    : ${dayjs().format("DD/MM/YYYY  hh:mm A")}
  // --------------------------------
  // ITEM         QTY   RATE      AMT
  // --------------------------------
  // ${itemsText}
  // --------------------------------
  // GRAND TOTAL            ${padLeft(String(order.totalAmount || calculateTotal()), 8)}
  // --------------------------------
  //           THANK YOU!
  //       PLEASE VISIT AGAIN

  // `;

  //     win.document.write(`
  //     <html><head><style>
  //       body {
  //         font-family: 'Courier New', Courier, monospace;
  //         font-size: 12px;
  //         white-space: pre;
  //         margin: 0;
  //         padding: 5mm;
  //         width: 32ch;
  //       }
  //     </style></head>
  //     <body onload="window.print(); window.close();">${receiptString}</body></html>
  //   `);
  //     win.document.close();
  //   };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-gray-100">
        {/* HEADER: Dynamic based on mode */}
        <div
          className={`${isBilled ? "bg-white text-gray-900 border-b-2 border-dashed" : "bg-gray-900 text-white"} p-6 flex justify-between items-center transition-colors duration-500`}
        >
          <div>
            <h3 className="text-xl font-black tracking-tight uppercase">
              {isBilled ? "Receipt Bill" : ` ${table.name}`}
            </h3>
            <p
              className={`text-[10px] font-bold uppercase tracking-widest ${isBilled ? "text-blue-600" : "text-gray-400"}`}
            >
              {/* {`Order #${order?.id?.slice(0, 8)}`} */}
              {isBilled ? `Order #${order?.id?.slice(0, 8)}` : "Guest Check"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors text-2xl cursor-pointer "
          >
            <X />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-400  ">
              Processing...
            </div>
          ) : isBilled ? (
            /* --- PROPER BILL VIEW --- */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                {/* Header Row - Optional but recommended for clarity */}
                <div className="flex justify-between items-center pb-0 border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/6 text-right">Rate</span>
                  <span className="w-1/6 text-right">Total</span>
                </div>

                <div className="divide-y divide-slate-50">
                  {servedItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-0 transition-colors hover:bg-slate-100/50"
                    >
                      {/* Item Name */}
                      <div className="w-1/2">
                        <p className="text-sm font-medium text-slate-800 leading-tight">
                          {item.menuItem.name}
                        </p>
                        {/* Subtext if you ever want to add categories or types */}
                        {/* <span className="text-[10px] text-slate-400 uppercase">
                          {item.menuItem.type || "Food"}
                        </span> */}
                      </div>

                      {/* Quantity */}
                      <div className="w-1/6 text-center">
                        <span className="inline-flex items-center justify-center    text-indigo-700 text-xs font-bold">
                          {item.quantity}
                        </span>
                      </div>

                      {/* Rate (Price per unit) */}
                      <div className="w-1/6 text-right">
                        <span className="text-xs text-slate-500">
                          ₹{item.priceAtOrder}
                        </span>
                      </div>

                      {/* Total Price */}
                      <div className="w-1/6 text-right">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          ₹{item.priceAtOrder * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-gray-900 uppercase">
                    Grand Total
                  </span>
                  <span className="text-4xl font-black text-blue-600 tracking-tighter">
                    ₹{order?.totalAmount || calculateTotal()}
                  </span>
                </div>
              </div>

              {/* /////split */}

              {/* --- PAYMENT SECTION --- */}
              <div className="space-y-4 mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase  ">
                    Settlement Method
                  </h4>
                  <button
                    onClick={() => setIsSplitPay(!isSplitPay)}
                    className="text-[10px] font-bold text-blue-600 hover:underline uppercase cursor-pointer tracking-wider"
                  >
                    {isSplitPay ? "← Back to Quick Pay" : "Split Payment"}
                  </button>
                </div>

                {!isSplitPay ? (
                  /* Quick Actions */
                  <div className="flex flex-col gap-4">
                    {/* SLIDER / TOGGLE SECTION */}
                    <div className="bg-gray-100 p-1 rounded-2xl flex relative h-12">
                      {/* Sliding Background Indicator */}
                      <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-in-out ${
                          paymentType === "FULL_UPI"
                            ? "translate-x-[100%]"
                            : "translate-x-0"
                        }`}
                      />

                      {/* Cash Option */}
                      <button
                        onClick={() => setPaymentType("FULL_CASH")}
                        className={`flex-1 z-10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                          paymentType === "FULL_CASH"
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      >
                        Cash
                      </button>

                      {/* UPI Option */}
                      <button
                        onClick={() => setPaymentType("FULL_UPI")}
                        className={`flex-1 z-10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                          paymentType === "FULL_UPI"
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      >
                        UPI
                      </button>
                    </div>

                    {/* CONFIRM SETTLEMENT BUTTON */}
                    <div className="flex gap-2 items-stretch mt-4">
                      {/* PRINT RECEIPT (20% Width) */}
                      <Button
                        variant="terminalGhost"
                        className="flex-[0.2] h-12 flex flex-col items-center justify-center p-0"
                        onClick={handlePrintReceipt}
                        title="Print Receipt"
                      >
                        <Printer size={18} />
                        <span className="text-[8px] uppercase font-bold ">
                          Print
                        </span>
                      </Button>

                      {/* CONFIRM (80% Width) */}
                      <Button
                        variant="default"
                        className="flex-[0.8] h-12 rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-lg"
                        onClick={() => handlePayment(paymentType)}
                      >
                        Confirm {paymentType === "FULL_CASH" ? "Cash" : "UPI"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Split Input View */
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">
                          Cash Amount
                        </label>
                        <input
                          type="text"
                          value={cashAmount}
                          onChange={(e) =>
                            handleCashChange(Number(e.target.value))
                          }
                          className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">
                          Online/UPI
                        </label>
                        <input
                          type="text"
                          value={onlineAmount}
                          onChange={(e) =>
                            setOnlineAmount(Number(e.target.value))
                          }
                          className="w-full bg-white border border-gray-200 rounded-xl p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handlePayment("SPLIT")}
                      className="w-full py-3 bg-gray-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-colors cursor-pointer tracking-wider"
                    >
                      Confirm Split Settlement
                    </button>
                  </div>
                )}
              </div>
              {/* Payment Quick Actions */}
              {/* <div className="grid grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => handlePayment("CASH")}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-green-600 hover:text-white transition-all group"
                >
                  <span className="text-xl mb-1 text-green-600 group-hover:text-white transition-colors">
                    💵
                  </span>
                  <span className="text-[10px] font-black uppercase group-hover:text-white">
                    Confirm Cash
                  </span>
                </button>

                <button
                  onClick={() => handlePayment("UPI")}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-blue-600 hover:text-white transition-all group"
                >
                  <span className="text-xl mb-1 text-blue-600 group-hover:text-white transition-colors">
                    📱
                  </span>
                  <span className="text-[10px] font-black uppercase group-hover:text-white">
                    Confirm UPI
                  </span>
                </button>
              </div> */}
            </div>
          ) : (
            /* --- ORIGINAL MANAGEMENT VIEW --- */
            <div className="space-y-8">
              {!order ? (
                <div className="py-20 text-center text-gray-400  ">
                  No active session.
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                        Pending Preparation
                      </h4>
                      {pendingItems.length > 0 && (
                        <button
                          onClick={handleServeAll}
                          className="text-[10px] font-bold text-blue-600 hover:underline uppercase cursor-pointer tracking-wider"
                        >
                          Serve All
                        </button>
                      )}
                    </div>
                    {pendingItems.length > 0 ? (
                      pendingItems.map((item: any) => (
                        <div
                          key={item.id}
                          className={`flex justify-between items-center p-2 px-4 rounded-2xl ${
                            item.status === "READY"
                              ? "bg-green-50 border-2 border-green-300"
                              : "bg-amber-50 border border-amber-100"
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-800 text-[14px]">
                              {item.quantity}x {item.menuItem.name}
                            </span>
                            {/* ... existing badge code ... */}
                          </div>

                          <div className="flex gap-2">
                            {/* CANCEL BUTTON */}
                            <button
                              onClick={() => handleCancelItem(item.id)}
                              className="p-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                              title="Cancel Item"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>

                            {/* SERVE BUTTON */}
                            <button
                              onClick={() => handleServeItem(item.id)}
                              className={`p-1 rounded-xl shadow-sm hover:text-white transition-all cursor-pointer ${
                                item.status === "READY"
                                  ? "bg-white text-green-600 border border-green-200 hover:bg-green-600"
                                  : "bg-white text-amber-600 border border-amber-200 hover:bg-amber-600"
                              }`}
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                viewBox="0 0 24 24"
                              >
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      //   pendingItems.map((item: any) => (
                      //     <div
                      //       key={item.id}
                      //       className={`flex justify-between items-center p-2 px-4 rounded-2xl ${
                      //         item.status === "READY"
                      //           ? "bg-green-50 border-2 border-green-300"
                      //           : "bg-amber-50 border border-amber-100"
                      //       }`}
                      //     >
                      //       <div className="flex flex-col gap-1">
                      //         <span className="font-bold text-gray-800 text-[14px]">
                      //           {item.quantity}x {item.menuItem.name}
                      //         </span>

                      //         <div className="flex items-center gap-2">
                      //           <span
                      //             className={`text-[10px] font-black uppercase tracking-tighter ${
                      //               item.status === "READY"
                      //                 ? "text-green-600"
                      //                 : "text-amber-600"
                      //             }`}
                      //           >
                      //             {item.status === "READY"
                      //               ? "Ready to Serve"
                      //               : "Kitchen"}
                      //           </span>

                      //           <TypeBadge type={item.menuItem.type} />
                      //         </div>
                      //       </div>

                      //       <button
                      //         onClick={() => handleServeItem(item.id)}
                      //         className={`p-1 rounded-xl shadow-sm hover:text-white transition-all cursor-pointer tracking-wider ${
                      //           item.status === "READY"
                      //             ? "bg-white text-green-600 border border-green-200 hover:bg-green-600"
                      //             : "bg-white text-amber-600 border border-amber-200 hover:bg-amber-600"
                      //         }`}
                      //       >
                      //         <svg
                      //           width="16"
                      //           height="16"
                      //           fill="none"
                      //           stroke="currentColor"
                      //           strokeWidth="3"
                      //           viewBox="0 0 24 24"
                      //         >
                      //           <path d="M20 6L9 17l-5-5" />
                      //         </svg>
                      //       </button>
                      //     </div>
                      //   )
                      // )
                      <p className="text-xs text-gray-400   px-1">
                        All items served.
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Header Row */}
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Served & On table
                      </p>
                    </div>
                    <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="col-span-6">Item</div>
                      <div className="col-span-1 text-center">Qty</div>
                      <div className="col-span-2 text-right">Rate</div>
                      <div className="col-span-3 text-right">Total</div>
                    </div>

                    <div className="space-y-1">
                      {servedItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-100 transition-all group"
                        >
                          {/* Item Name */}
                          <div className="col-span-6">
                            <span className="text-xs font-bold text-slate-700 truncate block">
                              {item.menuItem.name}
                            </span>
                          </div>

                          {/* Quantity */}
                          <div className="col-span-1 text-center">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.quantity}
                            </span>
                          </div>

                          {/* Rate */}
                          <div className="col-span-2 text-right">
                            <span className="text-[11px] font-medium text-slate-400">
                              ₹{item.priceAtOrder}
                            </span>
                          </div>

                          {/* Total */}
                          <div className="col-span-3 text-right">
                            <span className="font-mono text-xs font-black text-slate-800">
                              ₹
                              {(
                                item.priceAtOrder * item.quantity
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Taxable Subtotal
                      </p>
                      <h4 className="text-sm font-bold text-gray-800">
                        Net Payable
                      </h4>
                    </div>
                    <span className="text-3xl font-black text-blue-600 tracking-tighter">
                      ₹{calculateTotal()}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 border-t flex gap-3 items-center">
          {isBilled ? null : (
            <>
              {/* 20% Ratio Button */}
              <Button
                variant="terminalGhost"
                disabled={!order}
                onClick={() => {}}
                className="flex-[2]   whitespace-nowrap" // flex-[2] covers 20% of a 10-point scale
              >
                Print KOT
              </Button>

              {/* 80% Ratio Button */}
              <Button
                variant="default" // Using your custom terminal variant
                onClick={handleSettle}
                disabled={!order}
                className="flex-[8]   uppercase tracking-widest font-bold" // flex-[8] covers 80%
              >
                {hasPending ? "Bill Served Items Only" : "Generate Bill"}
              </Button>
            </>
          )}
        </div>
      </div>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogOverlay className="fixed inset-0 z-50 bg-white/30  " />
        <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl border-2 border-slate-900 bg-white p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tighter">
              Incomplete Order
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              There are{" "}
              <span className="text-red-600 font-bold">
                {pendingItems.length} items
              </span>{" "}
              that haven't been served. <br />
              Finalizing the bill will{" "}
              <span className="font-bold text-slate-900">
                permanently cancel
              </span>{" "}
              these items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 flex-1 rounded-xl border-2 border-slate-200 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors">
              Wait, Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSettle}
              className="h-12 flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
            >
              Discard & Settle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
