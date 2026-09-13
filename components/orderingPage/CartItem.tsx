// components/features/ordering/CartItem.tsx
import { Minus, Plus, Flame } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    isSpicy: boolean;
  };
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onToggleSpicy: (id: string) => void;
}

export const CartItem = ({
  item,
  onIncrement,
  onDecrement,
  onToggleSpicy,
}: CartItemProps) => {
  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl p-3 transition-all duration-200 hover:border-blue-300 hover:shadow-md">
      {/* Top Row: Title & Price */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-800 leading-tight">
            {item.name}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            ₹{item.price} per unit
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-slate-900 tabular-nums">
            ₹{(item.price * item.quantity).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Bottom Row: Controls */}
      <div className="flex justify-between items-center">
        {/* Quantity Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => onDecrement(item.id)}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-red-600 active:scale-90 transition-all border border-transparent hover:border-red-100"
          >
            <Minus size={14} strokeWidth={3} />
          </button>

          <span className="px-3 text-sm font-bold text-slate-800 min-w-[32px] text-center">
            {item.quantity}
          </span>

          <button
            onClick={() => onIncrement(item.id)}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-slate-600 hover:text-blue-600 active:scale-90 transition-all border border-transparent hover:border-blue-100"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Customization Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSpicy(item.id)}
            className={twMerge(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all border outline-none",
              item.isSpicy
                ? "bg-red-50 border-red-200 text-red-600 shadow-inner"
                : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600",
            )}
          >
            <Flame size={12} className={item.isSpicy ? "animate-pulse" : ""} />
            SPICY
          </button>
        </div>
      </div>

      {/* Decorative focus bar (Left Side) */}
      <div
        className={twMerge(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 rounded-r-full transition-all",
          item.isSpicy
            ? "bg-red-500 opacity-100"
            : "bg-blue-500 opacity-0 group-hover:opacity-40",
        )}
      />
    </div>
  );
};
