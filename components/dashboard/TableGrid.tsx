import { useState } from "react";
import TableCard from "../TableCard";
import { toast } from "react-hot-toast"; // or your preferred toast lib
import { cn } from "@/lib/utils";

export default function TableGrid({
  tables,
  searchQuery,
  onTableClick,
  onSwapTables,
  onMergeTables,
}: any) {
  // Track if we are in the middle of a swap
  const [sourceTable, setSourceTable] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<{
    table: any;
    type: "SWAP" | "MERGE";
  } | null>(null);
  const handleTableSelection = (targetTable: any) => {
    // If no action is pending, just open the table normally
    if (!pendingAction) {
      onTableClick(targetTable);
      return;
    }

    const { table: sourceTable, type } = pendingAction;

    // Cancel if clicking the same table
    if (targetTable.id === sourceTable.id) {
      setPendingAction(null);
      return;
    }

    if (type === "SWAP") {
      if (targetTable.status !== "FREE") {
        toast.error("You can only swap to an empty table.");
      } else {
        onSwapTables(sourceTable.activeOrder.id, targetTable.id);
        setPendingAction(null); // Clear after success
      }
    } else if (type === "MERGE") {
      if (targetTable.status === "FREE") {
        toast.error("Cannot merge into an empty table.");
      } else {
        onMergeTables(sourceTable.activeOrder.id, targetTable.id);
        setPendingAction(null); // Clear after success
      }
    }
  };
  // const handleTableSelection = (table: any) => {
  //   // IF we are currently selecting a NEW destination
  //   if (sourceTable) {
  //     if (table.id === sourceTable.id) {
  //       setSourceTable(null); // Cancel swap if clicking same table
  //       return;
  //     }

  //     if (table.status === "FREE") {
  //       // TRIGGER SWAP
  //       onSwapTables(sourceTable.activeOrder.id, table.id);
  //       setSourceTable(null);
  //     } else {
  //       toast.error("Target table must be FREE");
  //       setSourceTable(null);
  //     }
  //     return;
  //   }

  //   // NORMAL CLICK LOGIC
  //   // If user clicks an occupied table, they might want to swap it
  //   // You could trigger this via a long-press or a specific "Swap" button
  //   // But for this example, we'll check if it's occupied
  //   onTableClick(table);
  // };

  const filteredTables = tables.filter((table: any) => {
    const tableMatch = table.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const waiterMatch = table.activeOrder?.waiterName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return tableMatch || waiterMatch;
  });

  return (
    <div className="relative">
      {pendingAction && (
        <div
          className={cn(
            "mb-6 p-2 rounded-2xl flex justify-between items-center shadow-lg ring-1 transition-colors",
            pendingAction.type === "SWAP"
              ? "bg-blue-600 ring-blue-700"
              : "bg-purple-600 ring-purple-700",
          )}
        >
          <div className="flex items-center gap-3 pl-3">
            <span className="text-xs font-medium text-white">
              {pendingAction.type === "SWAP" ? "SWAPPING" : "MERGING"}{" "}
              <b>{pendingAction.table.name}</b>
              <span className="opacity-80 ml-1 italic">
                — Select{" "}
                {pendingAction.type === "SWAP" ? "an empty" : "an occupied"}{" "}
                table...
              </span>
            </span>
          </div>
          <button
            onClick={() => setPendingAction(null)}
            className="px-4 py-1 bg-black/20 hover:bg-black/40 text-white text-[11px] font-bold rounded-xl"
          >
            Cancel
          </button>
        </div>
      )}
      {sourceTable && (
        <div className="mb-6 p-1.5 bg-indigo-600 rounded-2xl flex justify-between items-center shadow-lg shadow-indigo-200 ring-1 ring-indigo-700/50">
          {/* Left: Icon and Status Text */}
          <div className="flex items-center gap-3 pl-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </div>
            <span className="text-xs font-medium text-indigo-50 leading-none">
              Moving{" "}
              <b className="text-white font-black px-1.5 py-0.5 bg-indigo-700 rounded-md mx-1">
                {sourceTable.name}
              </b>
              <span className="opacity-80 ml-1">
                Select a destination table...
              </span>
            </span>
          </div>

          {/* Right: Cancel Button */}
          <button
            onClick={() => setSourceTable(null)}
            className="px-4 py-1 bg-red-500  hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 border border-white/10"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table: any) => (
          <div key={table.id} onClick={() => handleTableSelection(table)}>
            <TableCard
              {...table}
              // FIXED: Set pendingAction instead of sourceTable
              onActionClick={(type) => setPendingAction({ table, type })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
