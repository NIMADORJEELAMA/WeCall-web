// components/features/ordering/MenuItemCard.tsx
import { Plus, Minus, Utensils, GlassWater } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface MenuItemCardProps {
  item: any;
  onAdd: (item: any) => void;
  onRemove?: (id: string) => void; // For decrementing
  quantity?: number; // Pass the current quantity from Redux
}

export const MenuItemCard = ({
  item,
  onAdd,
  onRemove,
  quantity = 0,
}: MenuItemCardProps) => {
  const isInCart = quantity > 0;

  return (
    <div
      className={twMerge(
        "group relative bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 cursor-pointer border transition-all duration-300 flex flex-col justify-between min-h-[130px] sm:min-h-[160px]",
        isInCart
          ? "border-blue-500 bg-blue-50/30 shadow-md"
          : "border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200",
      )}
    >
      {/* Category & Veg/Non-Veg Badge */}
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <span className="text-[7px] sm:text-[10px] font-black tracking-tighter sm:tracking-widest text-slate-400 uppercase bg-slate-50 px-1 sm:px-2 py-0.5 rounded-md truncate max-w-[70%]">
          {item.category}
        </span>
        <div
          className={twMerge(
            "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 mt-1",
            item.isVeg
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]",
          )}
        />
      </div>

      {/* Title & Type */}
      <div className="flex-1" onClick={() => !isInCart && onAdd(item)}>
        <h3 className="text-slate-800 font-bold text-[11px] sm:text-base leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
          {item.name}
        </h3>
        <p className="text-slate-400 text-[8px] sm:text-[11px] mt-0.5 sm:mt-1 font-medium flex items-center gap-1">
          {item.type === "FOOD" ? (
            <Utensils size={8} className="sm:w-[10px]" />
          ) : (
            <GlassWater size={8} className="sm:w-[10px]" />
          )}
          <span className="uppercase">{item.type}</span>
        </p>
      </div>

      {/* Price & Action Area */}
      {/* Price & Action Area */}
      <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
        <span className="text-sm sm:text-xl font-black text-slate-900">
          ₹{item.price}
        </span>

        {isInCart ? (
          /* Quantity Controls (Plus/Minus) */
          <div className="flex items-center justify-between w-full sm:w-auto bg-blue-600 rounded-[6px] sm:rounded-[8px] overflow-hidden shadow-lg shadow-blue-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(item.id);
              }}
              className="p-1 sm:p-2 hover:bg-blue-700 text-white transition-colors"
            >
              {/* Fixed: Use className for responsive sizing */}
              <Minus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
            </button>

            <span className="text-[10px] sm:text-sm font-black text-white px-1 sm:px-2">
              {quantity}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(item);
              }}
              className="p-1 sm:p-2 hover:bg-blue-700 text-white transition-colors"
            >
              {/* Fixed: Use className for responsive sizing */}
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />
            </button>
          </div>
        ) : (
          /* Initial Add Button */
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            className="w-7 h-7 sm:w-10 sm:h-10 self-end rounded-lg sm:rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300"
          >
            <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
};
