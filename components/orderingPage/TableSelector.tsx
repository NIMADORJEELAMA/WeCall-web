// components/features/ordering/TableSelector.tsx

import { Menu } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface TableSelectorProps {
  selectedTable: {
    name: string;
    room?: {
      name: string;
    };
  } | null;
  onOpenModal: () => void;
}

export const TableSelector = ({
  selectedTable,
  onOpenModal,
}: TableSelectorProps) => {
  return (
    <div className=" top-10 left-6 z-10 w-50">
      <button
        onClick={onOpenModal}
        className={twMerge(
          "w-full p-3   rounded-xl flex justify-between items-center transition-all  group",
          selectedTable
            ? "bg-white  ring-2 ring-blue-100"
            : "bg-orange-50 border-orange-200  ",
        )}
      >
        <div className="text-left">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider">
            Current Table
          </p>
          <p
            className={twMerge(
              "text-[12px] font-bold truncate",
              selectedTable ? "text-blue-700" : "text-orange-600",
            )}
          >
            {selectedTable ? `${selectedTable.name}` : "TAP TO SELECT TABLE"}
          </p>
        </div>

        <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
          <Menu size={12} />
        </div>
      </button>
    </div>
  );
};

export default TableSelector;
