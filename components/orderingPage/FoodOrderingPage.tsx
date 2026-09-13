"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/app/Redux/store";
import {
  addToCart,
  incrementQuantity,
  decrementQuantity,
  toggleSpicy,
  setOrderNote,
  clearCart,
} from "@/app/Redux/store/cartSlice";
import { useMenu } from "@/hooks/useMenu";
import { useTableLayout } from "@/hooks/useDashboard";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// Sub-components
import { MenuItemCard } from "./MenuItemCard";
import { CartItem } from "./CartItem";
import TableSelector from "./TableSelector"; // Extracted your header logic
import TableSelectionModal from "./TableSelectionModal";
import { Input } from "antd";
import { Button } from "@/components/ui/button";

export default function FoodOrderingPage() {
  const dispatch = useDispatch();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const orderNote = useSelector((state: RootState) => state.cart.note);
  const { data: tables = [] } = useTableLayout();
  const { data: menuData } = useMenu();

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      toast.error("Select a table!");
      setIsTableModalOpen(true);
      return;
    }
    if (cartItems.length === 0) return toast.error("Cart is empty");

    try {
      const payload = {
        tableId: selectedTable.id,
        items: cartItems.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
          isSpicy: i.isSpicy,
        })),
        note: orderNote,
      };
      await api.post("/orders", payload);
      toast.success(`KOT Generated!`);
      dispatch(clearCart());
    } catch (e) {
      toast.error("Order failed");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 1. TABLE SELECTION HEADER */}
      <TableSelector
        selectedTable={selectedTable}
        onOpenModal={() => setIsTableModalOpen(true)}
      />

      {/* 2. MENU GRID */}
      <main className="flex-1 overflow-y-auto p-6 pt-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {menuData?.map((item: any) => (
          <MenuItemCard
            key={item.id}
            item={item}
            onAdd={(i) => dispatch(addToCart(i))}
          />
        ))}
      </main>

      {/* 3. CART SIDEBAR */}
      <aside className="w-[380px] bg-white border-l shadow-xl flex flex-col">
        <div className="p-4 border-b bg-gray-50 font-bold">
          Current Order{" "}
          {selectedTable && (
            <span className="text-blue-600">#{selectedTable.name}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onIncrement={(id: string) => dispatch(incrementQuantity(id))}
              onDecrement={(id: string) => dispatch(decrementQuantity(id))}
              onToggleSpicy={(id: string) => dispatch(toggleSpicy(id))}
            />
          ))}
        </div>

        <div className="p-4 border-t space-y-3 bg-gray-50">
          <Input
            placeholder="Instructions..."
            value={orderNote}
            onChange={(e) => dispatch(setOrderNote(e.target.value))}
          />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₹{totalAmount}</span>
          </div>
          <Button
            onClick={handlePlaceOrder}
            className="w-full h-12 bg-blue-600"
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
        onSelect={(t) => setSelectedTable(t)}
      />
    </div>
  );
}
