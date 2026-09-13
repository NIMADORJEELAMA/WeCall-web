"use client";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/Redux/store"; // Your store type
import {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  toggleSpicy,
  setOrderNote,
  clearCart,
} from "@/app/Redux/store/cartSlice";
import { Card } from "@/components/ui/card";
import { Input } from "antd";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { useMenu } from "@/hooks/useMenu";
import TableSelectionModal from "./TableSelectionModal";
import { useTableLayout } from "@/hooks/useDashboard";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Menu } from "lucide-react";

export default function FoodOrderingPage() {
  // Removed tableId prop if it's strictly from selection
  const dispatch = useDispatch();

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const orderNote = useSelector((state: RootState) => state.cart.note);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const { data: tables = [] } = useTableLayout();
  const { data: menuData } = useMenu();

  const handleTableSelect = (table: any) => {
    setSelectedTable(table);
    // You could also dispatch an action here if you want to store tableId in Redux
  };

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handlePlaceOrder = async () => {
    // 1. Validation: Ensure a table is selected
    if (!selectedTable) {
      toast.error("Please select a table before placing an order!");
      setIsTableModalOpen(true); // Automatically open modal to help the user
      return;
    }

    // 2. Validation: Ensure cart isn't empty
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const payload = {
      tableId: selectedTable.id, // Use the ID from the state
      items: cartItems.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        isSpicy: item.isSpicy,
      })),
      note: orderNote,
    };

    try {
      await api.post("/orders", payload);
      toast.success(`KOT Generated for ${selectedTable.name}!`);
      dispatch(clearCart());
      // Optional: setSelectedTable(null); // Clear table after order if needed
    } catch (e) {
      toast.error("Order failed");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Table Selection Header - Made more prominent */}
      <div className="absolute top-4 left-6 z-10 w-72">
        <button
          onClick={() => setIsTableModalOpen(true)}
          className={twMerge(
            "w-full p-3 border-2 rounded-xl flex justify-between items-center transition-all shadow-sm",
            selectedTable
              ? "bg-white border-blue-500 ring-2 ring-blue-100"
              : "bg-orange-50 border-orange-200 animate-pulse",
          )}
        >
          <div className="text-left">
            <p className="text-[8px] text-gray-500 uppercase font-black">
              Current Table
            </p>
            <p
              className={twMerge(
                "text-[6px] font-bold",
                selectedTable ? "text-blue-700" : "text-orange-600",
              )}
            >
              {selectedTable
                ? `${selectedTable.name} (${selectedTable.room?.name || "General"})`
                : "TAP TO SELECT TABLE"}
            </p>
          </div>
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Menu size={6} />
          </div>
        </button>
      </div>

      {/* Main Menu Grid */}
      <main className="flex-1 overflow-y-auto p-6 pt-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuData?.map((item: any) => (
          <Card
            key={item.id}
            onClick={() => dispatch(addToCart(item))}
            className="group relative flex flex-col p-4 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all active:scale-95 bg-white"
          >
            <span className="font-bold text-gray-800">{item.name}</span>
            <span className="text-blue-600 font-mono mt-2">₹{item.price}</span>
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" className="h-7 w-7 rounded-full">
                +
              </Button>
            </div>
          </Card>
        ))}
      </main>

      {/* Cart Sidebar */}
      <aside className="w-[380px] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Current Order{" "}
            {selectedTable && (
              <span className="text-blue-600">#{selectedTable.name}</span>
            )}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <p>Your cart is empty</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border rounded-lg p-3 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <p className="font-bold text-gray-800">{item.name}</p>
                  <span className="font-mono font-bold">
                    ₹{item.price * item.quantity}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => dispatch(decrementQuantity(item.id))}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="font-bold min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => dispatch(incrementQuantity(item.id))}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => dispatch(toggleSpicy(item.id))}
                    className={twMerge(
                      "text-[10px] px-3 py-1 rounded-full font-bold transition-colors",
                      item.isSpicy
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    SPICY
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Area */}
        <div className="p-4 border-t space-y-3 bg-gray-50">
          <Input
            placeholder="Kitchen instructions (no onion, extra hot...)"
            value={orderNote}
            className="bg-white"
            onChange={(e) => dispatch(setOrderNote(e.target.value))}
          />
          <div className="flex justify-between text-sm px-1">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-bold">₹{totalAmount}</span>
          </div>
          <Button
            onClick={handlePlaceOrder}
            className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md"
            disabled={cartItems.length === 0}
          >
            Place Order
          </Button>
        </div>
      </aside>

      <TableSelectionModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tables={tables}
        onSelect={handleTableSelect}
      />
    </div>
  );
}
