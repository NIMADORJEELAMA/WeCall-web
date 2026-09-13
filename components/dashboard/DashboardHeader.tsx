// import clsx, { ClassValue } from "clsx";
// import { Search } from "lucide-react";
// import { twMerge } from "tailwind-merge";
// import { Input } from "../ui/input";
// import { SearchBar } from "../ui/SearchBar";
// import GenericDropdown from "../ui/GenericDropdown";

// function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// export default function DashboardHeader({
//   searchQuery,
//   setSearchQuery,
//   areaType,
//   setAreaType,
//   statusFilter,
//   setStatusFilter,
//   categories,
//   categoryFilter,
//   setCategoryFilter,
// }: any) {
//   return (
//     <header className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
//       {/* LEFT: Search Bar */}
//       <div className="relative w-full md:w-64">
//         <SearchBar
//           placeholder="Search tables..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//       </div>

//       {/* RIGHT: Filters Group */}
//       <div className="flex items-center gap-6">
//         <div className="flex items-center gap-2">
//           {/* <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
//             Category
//           </span> */}
//           <GenericDropdown
//             options={categories}
//             selectedValue={categoryFilter || "ALL"}
//             onSelect={setCategoryFilter}
//             placeholder="Select Category"
//             allLabel="All Categories"
//             // icon={LayoutGrid}
//             className="w-48"
//           />
//         </div>
//         {/* Area Type Filter */}
//         <div className="flex items-center gap-2">
//           <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
//             Type
//           </span>
//           <div className="flex bg-gray-100 p-1 rounded-lg">
//             {["all", "rooms", "tables"].map((type) => (
//               <button
//                 key={type}
//                 onClick={() => setAreaType(type)}
//                 className={cn(
//                   "px-3 py-2 text-xs rounded-md transition capitalize",
//                   areaType === type
//                     ? "bg-white shadow-sm text-blue-600 font-bold"
//                     : "text-gray-500 hover:text-gray-700",
//                 )}
//               >
//                 {type}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="h-6 w-[1px] bg-gray-200 hidden lg:block" />

//         {/* Status Filter */}
//         <div className="flex items-center gap-2">
//           <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
//             Status
//           </span>
//           <div className="flex bg-gray-100 p-1 rounded-lg">
//             {["all", "FREE", "OCCUPIED"].map((status) => (
//               <button
//                 key={status}
//                 onClick={() => setStatusFilter(status)}
//                 className={cn(
//                   "px-3 py-2 text-xs rounded-md transition capitalize",
//                   statusFilter === status
//                     ? "bg-white shadow-sm text-blue-600 font-bold"
//                     : "text-gray-500 hover:text-gray-700",
//                 )}
//               >
//                 {status.toLowerCase()}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }

import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SearchBar } from "../ui/SearchBar";
import GenericDropdown from "../ui/GenericDropdown";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardHeader({
  searchQuery,
  setSearchQuery,
  areaType,
  setAreaType,
  statusFilter,
  setStatusFilter,
  categories,
  categoryFilter,
  setCategoryFilter,
}: any) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex flex-col gap-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* TOP ROW: Search Bar (Full width on mobile) */}
      <div className="relative w-full lg:w-64">
        <SearchBar
          placeholder="Search tables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* BOTTOM ROW / RIGHT SIDE: Filters Group */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:gap-6">
        {/* Category Dropdown (Widened on mobile for easier tapping) */}
        <div className="w-full sm:w-auto">
          <GenericDropdown
            options={categories}
            selectedValue={categoryFilter || "ALL"}
            onSelect={setCategoryFilter}
            placeholder="Select Category"
            allLabel="All Categories"
            className="w-full sm:w-48"
          />
        </div>

        {/* Segmented Controls Wrapper (Scrollable on tiny screens) */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {/* Area Type Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] md:text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Type
            </span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {["all", "rooms", "tables"].map((type) => (
                <button
                  key={type}
                  onClick={() => setAreaType(type)}
                  className={cn(
                    "px-2 md:px-3 py-1.5 text-[11px] md:text-xs rounded-md transition capitalize whitespace-nowrap",
                    areaType === type
                      ? "bg-white shadow-sm text-blue-600 font-bold"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-[1px] bg-gray-200 hidden xl:block" />

          {/* Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] md:text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Status
            </span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {["all", "FREE", "OCCUPIED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-2 md:px-3 py-1.5 text-[11px] md:text-xs rounded-md transition capitalize whitespace-nowrap",
                    statusFilter === status
                      ? "bg-white shadow-sm text-blue-600 font-bold"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  {status.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
