// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
// import { BedDouble, Utensils, User, IndianRupee } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  BedDouble,
  IndianRupee,
  Merge,
  User,
  Utensils,
} from "lucide-react";

// function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// interface ActiveOrder {
//   waiterName: string;
//   runningTotal: number;
//   itemCount?: number;
//   status?: string;
// }

// interface Room {
//   id: string;
//   name: string;
// }

// interface TableProps {
//   name: string;
//   status: "FREE" | "OCCUPIED" | "BILLED";
//   activeOrder?: ActiveOrder | null;
//   room?: Room | null;
//   onSwapClick?: any;
// }

// export default function TableCard({
//   name,
//   status,
//   activeOrder,
//   room,
//   onSwapClick,
// }: TableProps) {
//   const isRoom = !!room;

//   return (
//     <div
//       className={cn(
//         "group relative p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer",
//         "hover:scale-[1.02] hover:shadow-xl",
//         status === "FREE" &&
//           "bg-gradient-to-br from-green-100 to-white border-green-200 shadow-green-100",
//         status === "OCCUPIED" &&
//           "bg-gradient-to-br from-red-50 to-white border-red-200 shadow-red-100",
//         status === "BILLED" &&
//           "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-amber-100",
//       )}
//     >
//       {/* Glow Effect */}
//       <div
//         className={cn(
//           "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition",
//           status === "FREE" && "bg-green-200/40",
//           status === "OCCUPIED" && "bg-red-200/40",
//           status === "BILLED" && "bg-amber-200/40",
//         )}
//       />

//       {/* Header */}
//       <div className="relative flex justify-between items-start mb-3">
//         <div>
//           <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
//             {isRoom ? <BedDouble size={18} /> : <Utensils size={18} />}
//             {name}
//           </h3>

//           {/* {isRoom && <p className="text-xs text-gray-500 mt-1">Room Area</p>} */}
//         </div>

//         {/* Status Badge */}
//         <span
//           className={cn(
//             "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
//             status === "FREE" && "bg-green-100 text-green-700",
//             status === "OCCUPIED" && "bg-red-100 text-red-700",
//             status === "BILLED" && "bg-amber-100 text-amber-700",
//           )}
//         >
//           {status}
//         </span>
//         {status === "OCCUPIED" && (
//           <button
//             onClick={onSwapClick}
//             className="absolute -top-10 -right-7 p-2 bg-white shadow-md border rounded-full hover:bg-gray-200 text-gray-500 z-20"
//             title="Move Table"
//           >
//             <svg
//               width="14"
//               height="14"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2"
//             >
//               <path d="M7 10L12 5L17 10M7 14L12 19L17 14" />
//             </svg>
//           </button>
//         )}
//       </div>

//       {/* Body */}
//       <div className="relative mt-4">
//         {activeOrder ? (
//           <div className="space-y-2">
//             {/* Waiter */}
//             <div className="flex items-center gap-2 text-sm text-gray-600 justify-between">
//               <div className="flex items-center gap-2 text-sm text-gray-600">
//                 <User size={14} />
//                 <span>{activeOrder.waiterName}</span>
//               </div>
//               <div className="flex items-center gap-2 text-sm text-gray-600">
//                 <IndianRupee size={14} className="text-gray-700" />
//                 <span className="text-xl font-bold text-gray-900">
//                   {activeOrder.runningTotal}
//                 </span>
//               </div>
//             </div>

//             {/* Order Status */}
//             {activeOrder.status && (
//               <span className="inline-block  text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-semibold">
//                 {activeOrder.status}
//               </span>
//             )}
//           </div>
//         ) : (
//           <div className="flex flex-col items-center justify-center py-0">
//             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
//               {isRoom ? <BedDouble size={16} /> : <Utensils size={16} />}
//             </div>
//             <p className="text-sm text-gray-400  ">Ready for guests</p>
//           </div>
//         )}
//       </div>

//       {/* Footer Tag */}
//       <div className="absolute bottom-2 right-5 text-[10px] text-gray-400 uppercase tracking-wider">
//         {isRoom ? "Room" : "Table"}
//       </div>
//     </div>
//   );
// }
interface ActiveOrder {
  waiterName: string;
  runningTotal: number;
  itemCount?: number;
  status?: string;
}

interface Room {
  id: string;
  name: string;
}

interface TableProps {
  name: string;
  status: "FREE" | "OCCUPIED" | "BILLED";
  activeOrder?: ActiveOrder | null;
  room?: Room | null;
  // Use one consistent name for the action handler
  onActionClick: (type: "SWAP" | "MERGE") => void;
}

export default function TableCard({
  name,
  status,
  activeOrder,
  room,
  onActionClick, // Destructure the correct prop name
}: TableProps) {
  const isRoom = !!room;

  // Helper to handle the button clicks safely
  const handleButtonClick = (e: React.MouseEvent, type: "SWAP" | "MERGE") => {
    e.stopPropagation(); // Prevents the main Card's onClick from firing
    onActionClick(type);
  };

  return (
    <div
      className={cn(
        "group relative h-36 p-5 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-xl",
        status === "FREE" &&
          "bg-gradient-to-br from-green-100 to-white border-green-200 shadow-green-100",
        status === "OCCUPIED" &&
          "bg-gradient-to-br from-red-50 to-white border-red-200 shadow-red-100",
        status === "BILLED" &&
          "bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-amber-100",
      )}
    >
      {/* Glow Effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition",
          status === "FREE" && "bg-green-200/40",
          status === "OCCUPIED" && "bg-red-200/40",
          status === "BILLED" && "bg-amber-200/40",
        )}
      />

      {/* Header */}
      <div className="relative flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {isRoom ? <BedDouble size={18} /> : <Utensils size={18} />}
            {name}
          </h3>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
            status === "FREE" && "bg-green-100 text-green-700",
            status === "OCCUPIED" && "bg-red-100 text-red-700",
            status === "BILLED" && "bg-amber-100 text-amber-700",
          )}
        >
          {status}
        </span>

        {/* ACTION BUTTONS */}
        {status !== "FREE" && activeOrder && (
          <div className="absolute -top-10 -right-2 flex gap-2 z-30 ">
            {/* Moved inside the card bounds for better click reliability */}
            <button
              onClick={(e) => handleButtonClick(e, "SWAP")}
              className="p-2 bg-white/90 shadow-sm border rounded-full hover:bg-blue-50 text-blue-600 transition-all active:scale-90 cursor-pointer"
              title="Swap Table"
            >
              <ArrowLeftRight size={14} />
            </button>

            <button
              onClick={(e) => handleButtonClick(e, "MERGE")}
              className="p-2 bg-white/90 shadow-sm border rounded-full hover:bg-purple-50 text-purple-600 transition-all active:scale-90 cursor-pointer"
              title="Merge Table"
            >
              <Merge size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Body & Footer (Keep your existing code here) */}
      <div className="relative mt-4">
        {activeOrder ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 justify-between">
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>{activeOrder.waiterName}</span>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee size={14} className="text-gray-700" />
                <span className="text-xl font-bold text-gray-900">
                  {activeOrder.runningTotal}
                </span>
              </div>
            </div>
            {activeOrder.status && (
              <span className="inline-block text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-semibold">
                {activeOrder.status}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-0">
            <p className="text-sm text-gray-400">Ready for guests</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-5 text-[10px] text-gray-400 uppercase tracking-wider">
        {isRoom ? "Room" : "Table"}
      </div>
    </div>
  );
}
