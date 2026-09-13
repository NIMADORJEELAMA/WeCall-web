"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  Printer,
  CheckCircle,
  Clock,
  Loader2,
  Hotel,
  Utensils,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useKitchenSocket } from "@/hooks/use-kitchen-socket";

export default function KitchenPage() {
  const [rawItems, setRawItems] = useState([]);
  const socket = useMemo(() => io(process.env.NEXT_PUBLIC_SOCKET_URL), []);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const fetchKitchenQueue = async () => {
    try {
      const res = await api.get("/orders/kitchen/pending");
      setRawItems(res.data);
    } catch (err) {
      console.error("Error fetching kitchen queue:", err);
    }
  };

  // Group items by Order ID
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: any } = {};

    rawItems.forEach((item: any) => {
      const orderId = item.orderId;
      if (!groups[orderId]) {
        // Access the nested order object from the first item in the group
        const parentOrder = item.order;

        groups[orderId] = {
          id: orderId,
          // Check for table number, otherwise format room info
          tableNumber:
            parentOrder?.table?.number ||
            (parentOrder?.roomId
              ? `Room ${parentOrder.roomId.slice(0, 4)}`
              : "N/A"),
          createdAt: parentOrder?.createdAt, // THIS IS THE CRITICAL LINE
          roomId: parentOrder?.roomId, // To check for Room vs Table icon
          items: [],
        };
      }
      groups[orderId].items.push(item);
    });

    return Object.values(groups).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [rawItems]);

  useEffect(() => {
    fetchKitchenQueue();
    socket.on("kitchenUpdate", () => {
      new Audio("/Notification.mp3").play().catch(() => {});
      fetchKitchenQueue();
      toast.success("New KOT Received!");
    });
    return () => {
      socket.off("kitchenUpdate");
    };
  }, [socket]);

  const handleMarkItemReady = async (itemId: string) => {
    try {
      await api.patch(`/orders/item/${itemId}/status`, { status: "READY" });
      fetchKitchenQueue();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };
  const handlePrintKOT = async (order: any) => {
    try {
      setPrintingId(order.id);

      // 1. Identify ONLY the items that are waiting to be printed
      const itemsToPrint = order.items.filter(
        (item: any) => item.status === "PENDING",
      );

      if (itemsToPrint.length === 0) {
        toast.error("No new items to print");
        return;
      }

      // 2. Update status to PREPARING for these specific items
      const updatePromises = itemsToPrint.map((item: any) =>
        api.patch(`/orders/item/${item.id}/status`, { status: "PREPARING" }),
      );

      await Promise.all(updatePromises);

      // 3. Trigger the Physical Print (Simulated)
      // In a real setup, you would send 'itemsToPrint' to your thermal printer
      console.log("Printing New KOT for:", itemsToPrint);

      toast.success(`KOT Printed for ${itemsToPrint.length} new items.`);
      fetchKitchenQueue();
    } catch (err) {
      toast.error("Failed to update kitchen status");
    } finally {
      setPrintingId(null);
    }
  };
  // const handleMarkReady = async (itemId: string) => {
  //   try {
  //     await api.patch(`/orders/item/${itemId}/status`, { status: "READY" });

  //     // This triggers the 'itemStatusUpdated' socket event in your backend
  //     toast.success("Notified waiter: Food is ready!");
  //     fetchKitchenQueue();
  //   } catch (err) {
  //     toast.error("Failed to update status");
  //   }
  // };

  const handleMarkEntireOrderReady = async (order: any) => {
    try {
      // Create a list of promises for each item in this order that isn't already ready/served
      const updatePromises = order.items
        .filter(
          (item: any) => item.status !== "READY" && item.status !== "SERVED",
        )
        .map((item: any) =>
          api.patch(`/orders/item/${item.id}/status`, { status: "READY" }),
        );

      if (updatePromises.length === 0) {
        toast.error("Items are already ready or served");
        return;
      }

      await Promise.all(updatePromises);
      toast.success(`Table ${order.tableNumber} is ready for pick up!`, {
        icon: "🚀",
        style: { borderRadius: "10px", background: "#10b981", color: "#fff" },
      });
      fetchKitchenQueue();
    } catch (err) {
      toast.error("Failed to mark order as ready");
    }
  };

  return (
    <div className=" bg-muted/40 p-8">
      <div className="  mx-auto space-y-8">
        {/* HEADER */}
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kitchen Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">
              Live Production Queue
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              {groupedOrders.length} Active Tickets
            </Badge>
          </div>
        </div>

        {/* GRID */}
        {groupedOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6  p-4">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[60px] overflow-auto"> */}
            {groupedOrders.map((order: any) => {
              console.log("order", order);
              const tableNumber = order.tableNumber;
              const isRoomService = !!order.roomId;
              const hasPendingItems = order.items.some(
                (i: any) => i.status === "PENDING",
              );

              // Format the time safely
              const orderTime = order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--";
              // Logic to check if the ticket has already been printed/started
              const isNewlyCreated = order.items.some(
                (i: any) => i.status === "PENDING",
              );

              return (
                <Card
                  key={order.id}
                  className={`border-l-4 ${hasPendingItems ? "border-l-amber-500" : "border-l-blue-500 shadow-lg "}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3 ">
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                          hasPendingItems
                            ? "bg-amber-500 text-white"
                            : "bg-slate-900 text-white"
                        }`}
                      >
                        {isRoomService ? (
                          <Hotel size={18} />
                        ) : (
                          <Utensils size={18} />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-700 font-extrabold uppercase text-muted-foreground tracking-widest">
                          {tableNumber}
                        </p>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                          {hasPendingItems ? "New Ticket" : "Preparing"}
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          {orderTime}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={hasPendingItems ? "outline" : "default"}
                      className={
                        hasPendingItems ? "text-amber-600 border-amber-200" : ""
                      }
                    >
                      {hasPendingItems ? "WAITING" : "COOKING"}
                    </Badge>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3 max-h-[200px] overflow-auto">
                    {/* Inside the CardContent of groupedOrders.map */}
                    <div className="space-y-4 py-4">
                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            item.status === "PENDING"
                              ? "bg-amber-50 border border-amber-200 animate-pulse"
                              : "bg-slate-50 border border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-black text-slate-400">
                              {item.quantity}×
                            </span>

                            <div>
                              <p className="font-bold text-sm uppercase text-slate-900">
                                {item.menuItem?.name}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[9px] uppercase tracking-tighter h-4 px-1 ${
                                  item.status === "PENDING"
                                    ? "text-amber-600 border-amber-300"
                                    : "text-blue-600 border-blue-300"
                                }`}
                              >
                                {item.status === "PENDING"
                                  ? "New Batch"
                                  : "Preparing"}
                              </Badge>
                            </div>
                          </div>

                          {/* Item-level 'Ready' button only for items already being prepared */}
                          {item.status === "PREPARING" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full hover:bg-emerald-100 hover:text-emerald-600"
                              onClick={() => handleMarkItemReady(item.id)}
                            >
                              <CheckCircle size={20} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 flex gap-2">
                    {hasPendingItems ? (
                      <Button
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold text-[11px] uppercase tracking-widest"
                        onClick={() => handlePrintKOT(order)}
                      >
                        <Printer size={14} className="mr-2" /> Print KOT
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-widest cursor-pointer"
                        onClick={() => handleMarkEntireOrderReady(order)}
                      >
                        <CheckCircle size={14} className="mr-2" /> Mark Ready
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <CheckCircle size={40} className="text-green-500 mb-4" />
              <h2 className="text-xl font-semibold">Kitchen Clear</h2>
              <p className="text-muted-foreground mt-2">
                Waiting for new orders...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
