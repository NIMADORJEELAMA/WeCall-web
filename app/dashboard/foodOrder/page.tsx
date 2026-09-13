"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useCategories, useMenu } from "@/hooks/useMenu";
import { useTableLayout } from "@/hooks/useDashboard";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// Icons & UI
import {
  Search,
  ShoppingCart,
  X,
  ChevronRight,
  ListOrdered,
} from "lucide-react";
import { MenuItemCard } from "../../../components/orderingPage/MenuItemCard";
import { CartItem } from "../../../components/orderingPage/CartItem";
import TableSelector from "../../../components/orderingPage/TableSelector";
import TableSelectionModal from "./TableSelectionModal";
import { Input } from "antd";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/SearchBar";
import GenericDropdown from "@/components/ui/GenericDropdown";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility for tailwind classes
import { twMerge } from "tailwind-merge";
import { error } from "console";
import ActiveOrderModal from "./ActiveOrderModal";

export default function FoodOrderingPage() {
  const dispatch = useDispatch();
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); // Mobile Cart State
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const cartItems = useSelector((state: RootState) => state.cart.items);
  const orderNote = useSelector((state: RootState) => state.cart.note);
  const { data: tables = [] } = useTableLayout();
  const { data: categoriesTable = [], refetch } = useCategories();
  const { data: menuData = [] } = useMenu();
  const [isActiveOrderModalOpen, setIsActiveOrderModalOpen] = useState(false);
  const categories = useMemo(() => {
    const unique = Array.from(new Set(menuData.map((i: any) => i.category)));
    return ["ALL", ...unique];
  }, [menuData]);

  const filteredMenu = useMemo(() => {
    return menuData.filter((item: any) => {
      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuData, selectedCategory, searchQuery]);

  const handleCategoryChange = (categoryId: string) =>
    setSelectedCategory(categoryId);

  useEffect(() => {
    if (isTableModalOpen) refetch();
  }, [isTableModalOpen, refetch]);

  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      toast.error("Please select a table first!");
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
      toast.success(`KOT Generated: Table ${selectedTable.name}`);
      dispatch(clearCart());
      setIsCartOpen(false);
    } catch (e: any) {
      // FIX: Extract message from axios response data
      const errorMessage = e.response?.data?.message || "Order failed";
      toast.error(errorMessage);

      // Optional: If table is occupied, re-open modal to let them pick another
      if (e.response?.status === 400) {
        setIsTableModalOpen(true);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden relative">
      {/* --- 1. TOP HEADER --- */}
      <header className="shrink-0 z-[20] bg-white border-b border-gray-200 shadow-sm overflow-visible">
        <div className="h-16 sm:h-20 flex items-center px-4 sm:px-6 gap-4">
          {/* 1. Table Selector - Keep this static or in a small scroll area */}
          <div className="shrink-0">
            <TableSelector
              selectedTable={selectedTable}
              onOpenModal={() => setIsTableModalOpen(true)}
            />
          </div>

          {/* We remove overflow-x-auto from the MAIN header and put it here */}
          <div className="flex items-center gap-4 flex-1 overflow-visible">
            {/* Desktop Search Bar */}
            <div className="hidden lg:block shrink-0">
              <SearchBar
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 3. Category Dropdown */}
            {/* IMPORTANT: If this still hides, the GenericDropdown component 
          itself likely has 'relative' or 'overflow-hidden' inside it. 
      */}
            <div className="shrink-0 w-[140px] sm:w-[180px] relative">
              <GenericDropdown
                options={categories.map((cat) => ({
                  id: String(cat),
                  name: String(cat),
                }))}
                selectedValue={selectedCategory}
                onSelect={handleCategoryChange}
                allLabel="All Categories"
              />
            </div>
          </div>
          {/* Inside your TableSelector or Header */}

          <ActiveOrderModal
            isOpen={isActiveOrderModalOpen}
            onClose={() => setIsActiveOrderModalOpen(false)}
            table={selectedTable} // Passing the table you selected in TableSelector
          />
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-1   relative">
        {/* 2. MENU GRID */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide pb-24 lg:pb-6 h-screen">
          {/* Mobile Search - Only visible on small screens */}
          <div className="flex items-center gap-3 mb-4 sm:hidden">
            {/* SearchBar Container - flex-1 makes it take up all available space */}
            <div className="flex-1">
              <SearchBar
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {selectedTable && (
              <Button
                variant="outline"
                onClick={() => setIsActiveOrderModalOpen(true)}
                className="ml-2 border-orange-200 text-orange-600 bg-orange-50"
              >
                <ListOrdered size={20} />
              </Button>
            )}
            {/* Button Container - shrink-0 ensures it doesn't get squashed */}
            <div className="shrink-0">
              <Button
                variant="outline"
                className="relative   rounded-xl border-blue-100 bg-blue-50 text-blue-600 active:scale-90 transition-transform"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={20} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                    {cartItems.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {filteredMenu.length > 0 ? (
            <div
              className="grid 
        grid-cols-3           /* 3 columns on mobile (default) */
        md:grid-cols-2        /* 2 columns on tablets (where sidebar is usually visible) */
        lg:grid-cols-2        /* 2 columns on small laptops */
        xl:grid-cols-3        /* 3 columns on large screens */
        2xl:grid-cols-4       /* 4 columns on ultra-wide */
        gap-2 sm:gap-6"
            >
              {" "}
              {/* Tighten gap for mobile to fit 3 items */}
              {filteredMenu.map((item: any) => {
                const cartItem = cartItems.find((i) => i.id === item.id);
                return (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={cartItem?.quantity || 0}
                    onAdd={(i) => dispatch(addToCart(i))}
                    onRemove={(id) => dispatch(decrementQuantity(id))}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <p className="text-lg text-center font-medium">No items found</p>
            </div>
          )}
        </main>

        {/* 3. CART SIDEBAR (Responsive Overlay) */}
        {/* Overlay for mobile */}
        {isCartOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsCartOpen(false)}
          />
        )}

        <aside
          className={cn(
            // 1. Ensure the container itself fills the height but doesn't overflow
            "fixed inset-y-0 right-0 w-[90%] max-w-[400px] bg-white z-[50] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out transform",
            // 2. Desktop overrides: Use h-screen or calc to fit your layout
            "lg:relative lg:translate-x-0 lg:w-[380px] lg:z-10 lg:shadow-none lg:border-l lg:border-gray-200 lg:h-[calc(100vh-theme(spacing.16))] lg:max-h-screen",
            isCartOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Sidebar Header */}
          <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 ">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCartOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => dispatch(clearCart())}
            >
              Clear
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onIncrement={(id: string) => dispatch(incrementQuantity(id))}
                  onDecrement={(id: string) => dispatch(decrementQuantity(id))}
                  onToggleSpicy={(id: string) => dispatch(toggleSpicy(id))}
                />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  🛒
                </div>
                <p className="text-sm font-medium">Your cart is empty</p>
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 sm:p-6 border-t bg-white space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Kitchen Note
              </label>
              <Input
                placeholder="Special requests..."
                // Changed rounded-2xl to rounded-full
                className="border rounded-full h-11 px-6 bg-gray-50 border-gray-100 focus:bg-white transition-all shadow-sm"
                value={orderNote}
                onChange={(e) => dispatch(setOrderNote(e.target.value))}
              />
            </div>

            <div className="flex justify-between items-end py-1">
              <span className="text-sm font-bold text-gray-500">
                Total Amount
              </span>
              <span className="text-2xl font-black text-blue-600">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>

            <Button
              onClick={handlePlaceOrder}
              className="w-full h-14 sm:h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-black transition-all active:scale-95"
              disabled={cartItems.length === 0}
            >
              Confirm Order
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile Floating "Place Order" Bar - Shows when cart has items but sidebar is closed */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-30 lg:hidden animate-in slide-in-from-bottom-10">
          <Button
            className="w-full h-14 bg-slate-900 shadow-2xl rounded-2xl flex justify-between items-center px-6"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                {cartItems.length} ITEMS
              </span>
              <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 font-black text-sm uppercase">
              View Cart <ChevronRight size={16} />
            </div>
          </Button>
        </div>
      )}

      <TableSelectionModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tables={tables}
        categoriesTable={categoriesTable}
        onSelect={(t) => setSelectedTable(t)}
      />
    </div>
  );
}
