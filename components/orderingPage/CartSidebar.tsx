// components/features/ordering/CartSidebar.tsx
export const CartSidebar = ({
  cartItems,
  totalAmount,
  onPlaceOrder,
  orderNote,
  onNoteChange,
}: any) => {
  return (
    <aside className="w-[400px] bg-slate-50/50 backdrop-blur-sm p-6 flex flex-col border-l border-slate-200/60">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Your Order
          </h2>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
            Table Summary
          </p>
        </div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold">
          {cartItems.length} ITEMS
        </span>
      </div>

      {/* Items List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {cartItems.map((item: any) => (
          <div
            key={item.id}
            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm group hover:border-blue-100 transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-bold text-slate-800">
                {item.name}
              </span>
              <span className="text-sm font-black text-slate-900">
                ₹{item.price * item.quantity}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-1 border border-slate-100">
                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-blue-600 active:scale-90 transition-all">
                  -
                </button>
                <span className="text-slate-900 font-bold text-xs">
                  {item.quantity}
                </span>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-white shadow-sm text-slate-400 hover:text-blue-600 active:scale-90 transition-all">
                  +
                </button>
              </div>

              {item.isSpicy && (
                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md">
                  SPICY
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Footer */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex justify-between items-center mb-6 px-1">
          <span className="text-slate-500 font-bold">Grand Total</span>
          <span className="text-3xl font-black text-slate-900">
            ₹{totalAmount}
          </span>
        </div>

        <button
          onClick={onPlaceOrder}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold text-base hover:bg-blue-600 active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
        >
          Confirm Order & Print KOT
        </button>
      </div>
    </aside>
  );
};
