// "use client";
// import { useEffect, useRef } from "react";
// import { Bell, Trash2, ChefHat, Clock } from "lucide-react";

// export default function LiveOrderFeed({ orders, onClear, onSelectOrder }: any) {
//   const scrollRef = useRef<HTMLDivElement>(null);

//   // Auto-scroll to bottom only when new orders arrive
//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTo({
//         top: scrollRef.current.scrollHeight,
//         behavior: "smooth",
//       });
//     }
//   }, [orders]);

//   return (
//     <aside className="w-80 mb-16 bg-white/70 backdrop-blur-xl border-l border-gray-200 flex flex-col shadow-2xl min-h-screen sticky top-0">
//       {/* Header */}
//       <div className="p-5 border-b border-gray-200 bg-white/80 backdrop-blur-md flex justify-between items-center z-10">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
//             <Bell className="text-blue-600 animate-tada" size={18} />
//           </div>
//           <div>
//             <h3 className="text-lg font-black text-gray-800 tracking-tight">
//               Live Activity
//             </h3>
//             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
//               Kitchen & Bar Feed
//             </p>
//           </div>
//         </div>

//         <button
//           onClick={onClear}
//           className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
//         >
//           <Trash2 size={18} />
//         </button>
//       </div>

//       {/* Feed Container */}
//       <div
//         ref={scrollRef}
//         className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 scroll-smooth mb-16"
//       >
//         {orders.length === 0 ? (
//           <EmptyState />
//         ) : (
//           orders.map((order: any, idx: number) => (
//             <OrderCard
//               key={`${order.id}-${idx}`}
//               order={order}
//               onSelect={onSelectOrder}
//             />
//           ))
//         )}
//       </div>
//     </aside>
//   );
// }

"use client";
import { useEffect, useRef } from "react";
import { Bell, Trash2, Clock, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { io } from "socket.io-client";
import { cn } from "@/lib/utils";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function LiveOrderFeed({
  onSelectOrder,
  onClose,
  isSidebarOpen,
}: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 1. Fetch orders directly from API
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["live-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/orders/live-feed");
        // Ensure we return the array specifically (adjust based on your API response shape)
        return res.data || [];
      } catch (error) {
        console.error("Failed to fetch live feed:", error);
        return [];
      }
    }, // Corrected the brace here
    refetchInterval: 60000,
    // Optional: Only refetch if the window is focused to save resources
    refetchOnWindowFocus: true,
  });

  // Auto-scroll to bottom only when new orders arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [orders]);
  // 2. Setup Socket listener inside the feed
  // Inside LiveOrderFeed.tsx
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("newOrder", () => {
      // 1. Refetch from the API to get the "Source of Truth"
      queryClient.invalidateQueries({ queryKey: ["live-orders"] });

      // 2. Optional: If you want to be extra safe against DB lag
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["live-orders"] });
      }, 500);
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Auto-scroll logic...
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [orders]);
  const clearFeed = async () => {
    await api.delete("/orders/live-feed/clear");
    queryClient.invalidateQueries({ queryKey: ["live-orders"] });
  };

  return (
    <aside
      className={cn(
        // Base styles: Fixed on mobile, relative on desktop
        "fixed inset-y-0 right-0 z-50 w-80 bg-white/70 backdrop-blur-xl border-l border-gray-200 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
        "lg:relative lg:translate-x-0 lg:z-auto lg:h-[92vh] lg:sticky lg:top-0",
        // Mobile toggle state
        isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
      )}
    >
      <div className="p-5 border-b border-gray-200 bg-white/80 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="lg:hidden -ml-2 p-2 text-gray-400"
          >
            <X size={20} />
          </button>
          <Bell className="text-blue-600" size={18} />
          <h3 className="text-lg font-black text-gray-800">Live Activity</h3>
        </div>
        <button
          onClick={clearFeed}
          className="text-xs font-bold text-red-500 hover:underline hover:bg-red-200 p-2 rounded-full cursor-pointer"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 pb-24"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10 space-y-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Updating Feed...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          /* Use the unique batch ID we created in the backend (orderId + timestamp) */
          orders.map((batch: any) => (
            <OrderCard key={batch.id} batch={batch} onSelect={onSelectOrder} />
          ))
        )}
      </div>
    </aside>
  );
}
// Sub-component for cleaner code
function OrderCard({ batch, onSelect }: any) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all shadow-sm ${
        batch?.isAddOn
          ? "bg-amber-50/40 border-amber-100" // Subtle amber for add-ons
          : "bg-white border-gray-200" // Clean white for new orders
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1">
          <span
            className={`text-[10px] text-white px-2 py-0.5 rounded-md font-black w-fit ${
              batch?.isAddOn ? "bg-amber-600" : "bg-blue-600"
            }`}
          >
            T-{batch?.tableNumber}
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${
              batch?.isAddOn ? "text-amber-700" : "text-blue-700"
            }`}
          >
            {batch?.isAddOn ? "• Add-on Request" : "• New Order"}
          </span>
        </div>

        <div className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
          {new Date(batch?.receivedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>

      <div className="space-y-1 mb-4">
        {batch?.items.map((item: any, i: number) => (
          <div
            key={i}
            className="flex justify-between items-center text-sm p-1.5 rounded-lg border border-transparent hover:bg-white/50"
          >
            <span className="font-bold text-gray-800">
              <span className="text-blue-600 mr-2">{item.quantity}×</span>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-[10px] text-gray-400">
          By <span className="font-bold">{batch?.waiterName}</span>
        </span>
        <button
          onClick={() => onSelect(batch?.tableId)}
          className="text-[10px] font-black text-blue-600 hover:underline"
        >
          VIEW BILL →
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center opacity-40 py-20">
      <Bell size={40} className="text-gray-300 mb-4" />
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
        Waiting for orders...
      </p>
    </div>
  );
}
