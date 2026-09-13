"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useSocket } from "../../hooks/useSocket";
import { useTableLayout } from "../../hooks/useDashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import TableGrid from "../../components/dashboard/TableGrid";
import LiveOrderFeed from "../../components/dashboard/LiveOrderFeed";
import OrderModal from "../../components/OrderModal";
import { twMerge } from "tailwind-merge";
import { ClassValue, clsx } from "clsx";
import api from "@/lib/axios";
import { Menu } from "lucide-react";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [areaType, setAreaType] = useState<"all" | "rooms" | "tables">("all");

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // TanStack Query replaces fetchLayout, tables state, and loading states
  const { data: tables = [], refetch: refreshLayout } = useTableLayout();

  // Keep Live Orders in local state (or a separate Query if saved to DB)
  const [liveOrders, setLiveOrders] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("minizeo_live_orders");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["unified-categories"],
    queryFn: async () => {
      const res = await api.get("/tables/categories/unified"); // Adjust to your route
      return res.data;
    },
  });
  // 2. Extract Unique Rooms from data
  const rooms = useMemo(() => {
    const allRooms = tables.map((t: any) => t.room).filter(Boolean);
    // Unique by ID
    return Array.from(new Map(allRooms.map((r: any) => [r.id, r])).values());
  }, [tables]);

  const filteredTables = useMemo(() => {
    return tables.filter((table: any) => {
      // 1. Search filter
      const matchesSearch = table.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 2. Area filter
      let matchesArea = true;
      if (areaType === "rooms") {
        matchesArea = table.room !== null;
      } else if (areaType === "tables") {
        matchesArea = table.room === null;
      }

      // 3. Status filter
      const matchesStatus =
        statusFilter === "all" || table.status === statusFilter;

      // 4. Category Filter (Updated to match your JSON structure)
      const matchesCategory =
        categoryFilter === "ALL" || table.category?.id === categoryFilter;

      return matchesSearch && matchesArea && matchesStatus && matchesCategory;
    });
  }, [tables, searchQuery, areaType, statusFilter, categoryFilter]);
  // const filteredTables = useMemo(() => {
  //   return tables.filter((table: any) => {
  //     // Search filter
  //     const matchesSearch = table.name
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase());

  //     // Area filter
  //     let matchesArea = true;
  //     if (areaType === "rooms") {
  //       matchesArea = table.room !== null;
  //     } else if (areaType === "tables") {
  //       matchesArea = table.room === null;
  //     }

  //     // Status filter
  //     const matchesStatus =
  //       statusFilter === "all" || table.status === statusFilter;

  //     return matchesSearch && matchesArea && matchesStatus;
  //   });
  // }, [tables, searchQuery, areaType, statusFilter]);
  // Auto-cleanup: Remove orders older than 24 hours
  useEffect(() => {
    const cleanupOldOrders = () => {
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      setLiveOrders((prevOrders) => {
        const filtered = prevOrders.filter((order) => {
          const orderTime = new Date(order.receivedAt).getTime();
          return now - orderTime < TWENTY_FOUR_HOURS;
        });

        // Only update state if something was actually removed
        return filtered.length !== prevOrders.length ? filtered : prevOrders;
      });
    };

    // Run cleanup on mount
    cleanupOldOrders();

    // Run cleanup every 10 minutes to keep the feed lean
    const interval = setInterval(cleanupOldOrders, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    localStorage.setItem("minizeo_live_orders", JSON.stringify(liveOrders));
  }, [liveOrders]);

  // Handle Socket Events

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socket.on("tableUpdated", () => {
      queryClient.invalidateQueries({ queryKey: ["table-layout"] });
    });

    socket.on("tableSwapped", (data) => {
      // 1. Force a refresh of the table data
      queryClient.invalidateQueries({ queryKey: ["table-layout"] });
    });
    socket.on("itemStatusUpdated", (data) => {
      if (data.status === "READY") {
        const table = tables.find(
          (t: any) => t?.activeOrder?.id === data.orderId,
        );

        toast(`${table?.name || ""}: Food is READY!`, {
          icon: "🍴",
          style: { background: "#10b981", color: "#fff" },
        });

        queryClient.invalidateQueries({ queryKey: ["table-layout"] });
      }
    });

    return () => {
      socket.disconnect(); // important
    };
  }, [tables, queryClient]);

  useSocket(
    useCallback(
      (orderData: any) => {
        const orderWithTimestamp = {
          ...orderData,
          receivedAt: new Date().toISOString(),
        };

        setLiveOrders((prev) => {
          const newOrders = [...prev, orderWithTimestamp];
          // Keep only the most recent 100 orders
          return newOrders.slice(-100);
        });

        toast.success(`New Order: Table ${orderData.table?.number}`, {
          icon: "🔔",
        });

        queryClient.invalidateQueries({ queryKey: ["table-layout"] });
      },
      [queryClient],
    ),
  );
  const handleSwapRequest = async (orderId: string, newTableId: string) => {
    try {
      await api.patch(`/orders/${orderId}/swap-table`, { newTableId });
      toast.success("Table swapped successfully!");
      // Refresh your data here or let Socket.io handle it
      queryClient.invalidateQueries({ queryKey: ["table-layout"] });
    } catch (error) {
      toast.error("Failed to swap table");
    }
  };
  const handleMergeRequest = async (
    sourceOrderId: string,
    targetTableId: string,
  ) => {
    try {
      await api.patch(`/orders/${sourceOrderId}/merge-table`, {
        targetTableId,
      });
      toast.success("Tables merged successfully!");
      queryClient.invalidateQueries({ queryKey: ["table-layout"] });
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to merge tables";
      toast.error(message);
    }
  };

  const handleViewTableFromFeed = (tableId: string) => {
    const table = tables.find((t: any) => t.id === tableId);
    if (table) setSelectedTable(table);
    else toast.error("Table not found");
  };

  return (
    <div className="flex h-[92vh] bg-gray-50 overflow-hidden font-sans no-scrollbar">
      <Toaster position="top-right" />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified Header with all props */}
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          areaType={areaType}
          setAreaType={setAreaType}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categories={categories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
        />
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-30 bg-blue-600 text-white p-4 rounded-full shadow-xl"
        >
          <Menu size={24} />
        </button>
        <main className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {/* Subtle result counter */}
          <div className="mb-4 flex justify-end items-center">
            <h2 className="text-sm font-semibold text-gray-500">
              Tables Count :{" "}
              <span className="ml-2 px-2 py-2  text-[12px]">
                {filteredTables.length}
              </span>
            </h2>
          </div>

          <TableGrid
            tables={filteredTables}
            searchQuery={searchQuery}
            onSwapTables={handleSwapRequest}
            onTableClick={(table: any) => setSelectedTable(table)}
            onMergeTables={handleMergeRequest}
          />
        </main>
      </div>

      {selectedTable && (
        <OrderModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["table-layout"] })
          }
        />
      )}
    </div>
  );
}
