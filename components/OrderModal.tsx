"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { Beer, X, Utensils, Printer, Loader2, XCircle } from "lucide-react";
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
import { div } from "framer-motion/client";
declare global {
  interface Window {
    qz: any;
  }
}
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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSplitPay, setIsSplitPay] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [onlineAmount, setOnlineAmount] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [miscCharges, setMiscCharges] = useState<number>(0);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [paymentType, setPaymentType] = useState<
    "FULL_CASH" | "FULL_UPI" | "DUE"
  >("FULL_CASH");
  // Update amounts whenever order total changes or split is toggled
  // Inside OrderModal component, add these states:
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [availablePoints, setAvailablePoints] = useState<number>(0);
  const [tips, setTips] = useState<number>(0);
  // Add a search effect for the phone number
  useEffect(() => {
    // 1. Add this check: If the phone matches the selected customer, don't search
    if (selectedCustomerId) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (customerPhone.length >= 3) {
        setIsSearching(true);
        try {
          const { data } = await api.get(
            `/customers/search?q=${customerPhone}`,
          );
          setSearchResults(data);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);

    // 2. Add selectedCustomerId to dependencies so the effect re-runs
    // and hits the 'if' guard above when a customer is picked.
  }, [customerPhone, selectedCustomerId]);
  const handleSelectCustomer = (customer: any) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setSelectedCustomerId(customer.id);
    setAvailablePoints(customer.loyaltyPoints || 0);
    setSearchResults([]); // Close dropdown
  };
  const calculateFinalPayable = () => {
    // Ensure we are working with numbers to avoid "3700" + "0" = "37000"
    const baseTotal = Number(order?.totalAmount || calculateTotal());
    const misc = Number(miscCharges) || 0;
    const disc = Number(discount) || 0;
    const pointsDisc = Number(pointsToRedeem) || 0;

    return Math.max(0, baseTotal + misc - disc - pointsDisc);
  };
  useEffect(() => {
    if (order) {
      const finalTotal = calculateFinalPayable();
      setOnlineAmount(Number(finalTotal));
      setCashAmount(0);
    }
  }, [order, isSplitPay, discount, miscCharges]);
  // useEffect(() => {
  //   if (order) {
  //     const total = Number(order.totalAmount || calculateTotal());
  //     setOnlineAmount(total);
  //     setCashAmount(0);
  //   }
  // }, [order, isSplitPay]);

  const handleCashChange = (val: number) => {
    // Use the function that accounts for discount and misc charges
    const finalTotal = calculateFinalPayable();

    setCashAmount(val);

    // Calculate the remainder, but don't go below 0
    const remainder = Math.max(0, finalTotal - val);
    setOnlineAmount(remainder);
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

  // const handleSettle = async () => {
  //   if (!order) return;

  //   if (hasPending && !isConfirmOpen) {
  //     setIsConfirmOpen(true);
  //     return;
  //   }

  //   try {
  //     const res = await api.patch(`/orders/${order.id}/generate-bill`);

  //     // FIX: Keep the existing items but update the order metadata
  //     setOrder({
  //       ...order, // Keep existing items/waiter info
  //       ...res.data, // Overwrite with new status and totalAmount from API
  //     });

  //     setIsBilled(true);
  //     toast.success("Bill Finalized");
  //   } catch (err) {
  //     toast.error("Failed to generate bill");
  //   }
  // };

  const handleSettle = async () => {
    if (!order) return;

    if (hasPending && !isConfirmOpen) {
      setIsConfirmOpen(true);
      return;
    }

    try {
      const res = await api.patch(`/orders/${order.id}/generate-bill`);

      setOrder(res.data);
      setIsBilled(true);
      toast.success("Bill Finalized (Pending items cancelled)");
      // onRefresh();
    } catch (err) {
      toast.error("Failed to generate bill");
    }
  };

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
    order?.items?.filter((i: any) => i.status === "SERVED") || [];
  const hasPending = pendingItems?.length > 0;

  const handleCancelOrder = async () => {
    if (!order || !cancelReason.trim()) return;

    const loadingToast = toast.loading("Processing cancellation...");

    try {
      await api.patch(`/orders/${order.id}/cancel`, {
        reason: cancelReason, // Send the reason from state
      });

      toast.dismiss(loadingToast);
      toast.success("Order cancelled successfully");

      setIsCancelModalOpen(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };
  const handlePayment = async (
    type: "FULL_CASH" | "FULL_UPI" | "SPLIT" | "DUE",
  ) => {
    if (!order) return;

    // Force all inputs to Numbers to prevent "3700" + "0" = "37000"
    const finalPayableAmount = Number(calculateFinalPayable());

    let payload: any = {
      cash: 0,
      online: 0,
      tips: Number(tips),
      isDue: false,
      customerId: selectedCustomerId,
      customerName,
      customerPhone,
      discount: Number(discount) || 0,
      miscCharges: Number(miscCharges) || 0,
      finalAmount: finalPayableAmount,
      redeemedPoints: Number(pointsToRedeem),
    };
    console.log("payload", payload);

    if (type === "FULL_CASH") {
      payload.cash = finalPayableAmount;
      payload.online = 0;
    } else if (type === "FULL_UPI") {
      payload.cash = 0;
      payload.online = finalPayableAmount;
    } else if (type === "DUE") {
      if (!customerName && !customerPhone) {
        toast.error("Please provide a Name or Phone for Due orders");
        return;
      }
      payload.isDue = true;
      payload.cash = 0;
      payload.online = 0;
    } else {
      // SPLIT logic: Use the new finalPayableAmount variable here
      // 1. Re-calculate the absolute total fresh to avoid stale state issues
      const baseTotal = Number(order.totalAmount || calculateTotal());
      const currentFinalPayable = Math.max(
        0,
        baseTotal + Number(miscCharges) - Number(discount),
      );

      // 2. Sum the current split inputs
      const currentSplitTotal = Number(cashAmount) + Number(onlineAmount);

      // 3. Compare using Math.round to handle JS floating point math (e.g., 0.1 + 0.2)
      // if (Math.round(currentSplitTotal) !== Math.round(currentFinalPayable)) {
      //   toast.error(
      //     `Split total (₹${currentSplitTotal}) must equal Grand Total (₹${currentFinalPayable})`,
      //   );
      //   return;
      // }

      payload.cash = Number(cashAmount);
      payload.online = Number(onlineAmount);
    }

    try {
      const loadingMessage =
        type === "DUE" ? "Saving Due Record..." : "Processing Payment...";
      const loadingToast = toast.loading(loadingMessage);

      await api.patch(`/orders/${order.id}/confirm-payment`, payload);

      toast.dismiss(loadingToast);
      toast.success(
        type === "DUE" ? "Order marked as Due" : "Payment successful!",
      );

      onRefresh();
      onClose();
    } catch (err) {
      toast.error("Payment confirmation failed");
    }
  };

  // const handlePayment = async (
  //   type: "FULL_CASH" | "FULL_UPI" | "SPLIT" | "DUE",
  // ) => {
  //   if (!order) return;

  //   const total = Number(order.totalAmount || calculateTotal());
  //   let payload = { cash: 0, online: 0 };

  //   if (type === "FULL_CASH") payload = { cash: total, online: 0 };
  //   else if (type === "FULL_UPI") payload = { cash: 0, online: total };
  //   else payload = { cash: cashAmount, online: onlineAmount };

  //   // Validation: Ensure total matches
  //   if (payload.cash + payload.online !== total) {
  //     toast.error(`Total must equal ₹${total}`);
  //     return;
  //   }

  //   try {
  //     const loadingToast = toast.loading("Processing Payment...");
  //     await api.patch(`/orders/${order.id}/confirm-payment`, payload);

  //     toast.dismiss(loadingToast);
  //     toast.success("Payment successful!");
  //     onRefresh();
  //     onClose();
  //   } catch (err) {
  //     toast.error("Payment confirmation failed");
  //   }
  // };
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
  const handlePrintReceipt = async () => {
    if (!order) return;

    try {
      if (typeof window === "undefined" || !window.qz) {
        toast.error("QZ Tray is not running.");
        return;
      }

      // 1. Connection check
      if (!window.qz.websocket.isActive()) {
        await window.qz.websocket.connect();
      }

      // 2. Setup ESC/POS Commands
      const ESC = "\x1B";
      const CENTER = ESC + "a" + "\x01";
      const LEFT = ESC + "a" + "\x00";
      const BOLD_ON = ESC + "E" + "\x01";
      const BOLD_OFF = ESC + "E" + "\x00";
      const LINE_WIDTH = 48;

      const padRight = (text: string, len: number) =>
        text.length >= len
          ? text.slice(0, len)
          : text + " ".repeat(len - text.length);

      const padLeft = (text: string, len: number) =>
        text.length >= len
          ? text.slice(0, len)
          : " ".repeat(len - text.length) + text;

      // 3. Format Items
      const itemsText = (order.items || [])
        .filter((item: any) => item.status === "SERVED")
        .map((item: any) => {
          const name = padRight(
            (item.menuItem?.name || "Unknown").toUpperCase(),
            22,
          );
          const qty = padLeft(String(item.quantity), 6);
          const rate = padLeft(String(item.priceAtOrder), 10);
          const amt = padLeft(String(item.priceAtOrder * item.quantity), 10);
          return `${name}${qty}${rate}${amt}`;
        })
        .join("\n");

      const customerInfo = [
        customerName ? `CUSTOMER: ${customerName}\n` : "",
        customerPhone ? `PHONE   : ${customerPhone}\n` : "",
      ].join("");

      const shortId = order.id.slice(-8).toUpperCase();
      const finalPayable = calculateFinalPayable();
      // 4. Build the Plain Text Receipt String
      const receipt = [
        CENTER,
        BOLD_ON,
        "GAIRIGAON HILL ECO TOURISM\n",
        BOLD_OFF,
        "Jaigaon, West Bengal\n",
        "+91-7547957222\n",
        LEFT,
        "-".repeat(LINE_WIDTH) + "\n",
        `BILL NO : #${shortId}\n`,
        `TABLE   : ${order.table?.number || "N/A"}\n`,
        `WAITER  : ${order.waiter?.name || "N/A"}\n`,
        customerInfo,
        `DATE    : ${dayjs().format("DD/MM/YYYY hh:mm A")}\n`,
        "-".repeat(LINE_WIDTH) + "\n",
        padRight("ITEM", 22) +
          padLeft("QTY", 6) +
          padLeft("RATE", 10) +
          padLeft("AMT", 10) +
          "\n",
        "-".repeat(LINE_WIDTH) + "\n",
        itemsText + "\n",
        "-".repeat(LINE_WIDTH) + "\n",
        discount > 0
          ? padRight("DISCOUNT", 38) + padLeft("-Rs." + discount, 10) + "\n"
          : "",
        miscCharges > 0
          ? padRight("MISC CHARGES", 38) +
            padLeft("+Rs." + miscCharges, 10) +
            "\n"
          : "",
        padRight("GRAND TOTAL", 38) + padLeft("Rs." + finalPayable, 10) + "\n",
        "-".repeat(LINE_WIDTH) + "\n",
        CENTER,
        "THANK YOU!\n",
        "PLEASE VISIT AGAIN\n\n\n\x1Bm", // Cut command
      ].join("");

      // 5. Send to Printer (Using the saved printer name)
      const printerName = localStorage.getItem("printer") || "Thermal"; // Default to Thermal if not set
      const config = window.qz.configs.create(printerName);

      await window.qz.print(config, [
        { type: "raw", format: "plain", data: receipt },
      ]);

      toast.success("Printing Receipt...");
    } catch (err: any) {
      // ✅ CHECK FOR CANCELLATION
      // QZ Tray or browser dialogs often return these strings when cancelled
      const isUserCancelled =
        err.message?.includes("cancelled") ||
        err.message?.includes("User rejected") ||
        err.message?.includes("closed");

      if (isUserCancelled) {
        toast("Print cancelled", { icon: "ℹ️" });
      } else {
        toast.error("Printing failed: " + (err.message || "Check QZ Tray"));
      }
    }
  };
  {
    /* Cancellation Reason Modal */
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh]  flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-gray-100">
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
        <div className="p-3   overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-400  ">
              Processing...
            </div>
          ) : isBilled ? (
            /* --- PROPER BILL VIEW --- */

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1 relative">
                  <label className="text-[10px] uppercase font-bold text-gray-700 ml-1 flex justify-between">
                    <span>Phone Number</span>
                    {isSearching && (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      // Regex: Replace anything that is NOT a digit (0-9) with an empty string
                      const onlyNums = e.target.value.replace(/[^0-9]/g, "");

                      // Limit to 10 digits (optional, but standard for phone numbers)
                      const limitedNums = onlyNums.slice(0, 10);

                      setCustomerPhone(limitedNums);

                      if (selectedCustomerId) setSelectedCustomerId(null);
                    }}
                    placeholder="Search by phone..."
                    // Added inputMode for better mobile keyboard experience
                    inputMode="numeric"
                    className="w-full h-10 px-4 rounded-xl border border-gray-400 bg-gray-100 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  />

                  {/* Search Results Dropdown remains the same */}
                  {searchResults.length > 0 && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                      {searchResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {c.phone}
                            </p>
                          </div>
                          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                            Link
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-700 ml-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full h-10 px-4 rounded-xl border border-gray-400 bg-gray-100 text-sm focus:ring-2 focus:ring-blue-500 transition-all"

                    // className="w-full h-8 px-4 rounded-xl border border-gray-400 bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-red-600">
                    Discount (₹)
                  </label>
                  <input
                    type="text"
                    // Handle the display so it shows empty instead of 0 if desired
                    value={discount === 0 ? "" : discount}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow only numbers and handle empty string
                      if (val === "") {
                        setDiscount(0);
                      } else if (!isNaN(Number(val))) {
                        setDiscount(Number(val));
                      }
                    }}
                    className="w-full h-8 px-2 rounded-lg border border-gray-300 text-sm font-bold focus:ring-red-500"
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-700">
                    Misc Charges (₹)
                  </label>
                  <input
                    type="text"
                    value={miscCharges === 0 ? "" : miscCharges}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setMiscCharges(0);
                      } else if (!isNaN(Number(val))) {
                        setMiscCharges(Number(val));
                      }
                    }}
                    className="w-full h-8 px-2 rounded-lg border border-gray-300 text-sm font-bold focus:ring-blue-500"
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
              </div>
              {selectedCustomerId && availablePoints > 0 && (
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-700 uppercase">
                      Available Points
                    </p>
                    <p className="text-lg font-black text-indigo-900">
                      {availablePoints} PTS
                    </p>
                  </div>
                  <div className="w-24">
                    <label className="text-[9px] font-bold text-indigo-400 uppercase">
                      Redeem
                    </label>
                    <input
                      type="number"
                      max={availablePoints}
                      value={pointsToRedeem}
                      onChange={(e) => {
                        const val = Math.min(
                          availablePoints,
                          Number(e.target.value),
                        );
                        setPointsToRedeem(val);
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-indigo-200 text-sm font-bold focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
              {/* Update the Grand Total Display */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-gray-900 uppercase">
                    Grand Total
                  </span>
                  <span className="text-4xl font-black text-blue-600 tracking-tighter">
                    ₹{calculateFinalPayable()}
                  </span>
                </div>
              </div>

              {/* <div className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-gray-900 uppercase">
                    Grand Total
                  </span>
                  <span className="text-4xl font-black text-blue-600 tracking-tighter">
                    ₹{order?.totalAmount || calculateTotal()}
                  </span>
                </div>
              </div> */}

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
                      {/* Sliding Background Indicator - Now 1/3 width */}
                      <div
                        className={`absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-in-out ${
                          paymentType === "FULL_CASH"
                            ? "translate-x-0"
                            : paymentType === "FULL_UPI"
                              ? "translate-x-[100%]"
                              : "translate-x-[200%]" // This targets "DUE"
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

                      {/* Due Option */}
                      <button
                        onClick={() => setPaymentType("DUE")}
                        className={`flex-1 z-10 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                          paymentType === "DUE"
                            ? "text-orange-600"
                            : "text-gray-400"
                        }`}
                      >
                        Due
                      </button>
                    </div>

                    {/* CONFIRM SETTLEMENT BUTTON */}
                    <div className="flex gap-2 items-stretch mt-4">
                      <Button
                        variant="terminalGhost"
                        className="flex-[0.2] h-12 flex flex-col items-center justify-center p-0"
                        onClick={handlePrintReceipt}
                      >
                        <Printer size={18} />
                        <span className="text-[8px] uppercase font-bold">
                          Print
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-[0.2] h-12 flex flex-col items-center justify-center p-0 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-colors"
                        onClick={() => setIsCancelModalOpen(true)} // Just open the modal
                      >
                        <XCircle size={18} />
                        <span className="text-[8px] uppercase font-bold">
                          Cancel
                        </span>
                      </Button>

                      <Button
                        variant={
                          paymentType === "DUE" ? "successGhost" : "default"
                        }
                        className="flex-[0.8] h-12 rounded-xl text-xs font-black uppercase tracking-[0.15em] shadow-lg"
                        onClick={() => handlePayment(paymentType)}
                      >
                        {paymentType === "DUE"
                          ? "Mark as Unpaid (Due)"
                          : `Confirm ${paymentType === "FULL_CASH" ? "Cash" : "UPI"}`}
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
                      {cashAmount > calculateFinalPayable() && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-xl flex justify-between items-center animate-in slide-in-from-top-1">
                          <span className="text-[10px] font-bold text-green-700 uppercase">
                            Excess Cash (Tip)
                          </span>
                          <span className="text-sm font-black text-green-700">
                            ₹{cashAmount - calculateFinalPayable()}
                          </span>
                        </div>
                      )}
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

                  <div className="space-y-1">
                    {/* Header Row */}
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Served & On table
                      </p>
                    </div>
                    <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="col-span-5">Item</div>{" "}
                      {/* Reduced from 6 */}
                      <div className="col-span-1 text-center">Qty</div>
                      <div className="col-span-2 text-right">Rate</div>
                      <div className="col-span-3 text-right">Total</div>
                      <div className="col-span-1"></div>{" "}
                      {/* Placeholder for the button space */}
                    </div>

                    <div className="space-y-1">
                      {servedItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-100 transition-all group"
                        >
                          {/* Item Name (Span 5) */}
                          <div className="col-span-5">
                            <span className="text-xs font-bold text-slate-700 truncate block">
                              {item.menuItem.name}
                            </span>
                          </div>

                          {/* Quantity (Span 1) */}
                          <div className="col-span-1 text-center">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.quantity}
                            </span>
                          </div>

                          {/* Rate (Span 2) */}
                          <div className="col-span-2 text-right">
                            <span className="text-[11px] font-medium text-slate-400">
                              ₹{item.priceAtOrder}
                            </span>
                          </div>

                          {/* Total (Span 3) */}
                          <div className="col-span-3 text-right">
                            <span className="font-mono text-xs font-black text-slate-800">
                              ₹
                              {(
                                item.priceAtOrder * item.quantity
                              ).toLocaleString()}
                            </span>
                          </div>

                          {/* Action Button (Span 1) */}
                          <div className="col-span-1 flex justify-end">
                            <button
                              onClick={() => handleCancelItem(item.id)}
                              className="p-1.5 rounded-lg border border-red-100 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer"
                              title="Cancel Item"
                            >
                              <X size={12} strokeWidth={3} />
                            </button>
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
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <XCircle size={24} />
              <h3 className="text-lg font-black uppercase tracking-tight">
                Cancel Billed Order
              </h3>
            </div>

            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              This will mark the order as{" "}
              <span className="font-bold text-gray-800">CANCELLED</span> and
              immediately{" "}
              <span className="font-bold text-gray-800">
                FREE Table {order?.table?.number}
              </span>
              . This action cannot be undone.
            </p>

            <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-1">
              Reason for Cancellation
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Customer walked out, Entered wrong items..."
              className="w-full h-24 bg-gray-50 border border-gray-200 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
            />

            <div className="flex gap-3 mt-6">
              <Button
                variant="terminalGhost"
                className="flex-1 rounded-xl font-bold uppercase text-xs"
                onClick={() => {
                  setIsCancelModalOpen(false);
                  setCancelReason("");
                }}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                className="flex-[1.5] h-12 rounded-xl font-black uppercase text-xs tracking-[0.1em] shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
                disabled={!cancelReason.trim()}
                onClick={handleCancelOrder}
              >
                Confirm Void
              </Button>
            </div>
          </div>
        </div>
      )}

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
