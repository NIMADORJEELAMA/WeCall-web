"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, LogOut, User } from "lucide-react"; // Added icons for a cleaner look

interface NavbarProps {
  onMenuClick?: () => void; // Optional prop for mobile toggle
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routeTitles: { [key: string]: string } = {
    "/dashboard": "Dashboard Overview",
    "/dashboard/tables": "Table Management",
    "/dashboard/menu": "Menu Items",
    "/dashboard/bills": "Billing & Invoices",
    "/dashboard/reports": "Table Reports",
    "/dashboard/salesReport": "Sales Reports",
    "/dashboard/customReport": "Food Report",
    "/dashboard/Stock": "Inventory & Stock",
    "/dashboard/kitchen": "Kitchen Display",
    "/dashboard/staff": "User Management",
    "/dashboard/customer": "Customer Management",
    "/dashboard/operations": "Staff Operations",
    "/dashboard/rooms": "Room Management",
    "/dashboard/bookings": "Check-In Desk",
    "/dashboard/history": "Booking History",
  };

  const currentTitle = routeTitles[pathname] || "Admin Panel";

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : null;

  const handleLogout = () => {
    // localStorage.removeItem("token");
    localStorage.removeItem("access_token");

    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* MOBILE MENU TRIGGER */}
        <button
          onClick={onMenuClick}
          className="md:hidden mr-3 p-2 rounded-md hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Title - Adjusted text size for mobile */}
        <h1 className="text-gray-800 font-semibold text-sm md:text-lg truncate max-w-[150px] md:max-w-none">
          {currentTitle}
        </h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 focus:outline-none group p-1.5 hover:bg-gray-50 rounded-full transition-colors"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm group-hover:bg-blue-700 transition-colors">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          {/* Hide email on small screens to save space */}
          <span className="text-gray-700 text-sm hidden lg:block max-w-[150px] truncate">
            {user?.email}
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Transparent backdrop to close dropdown on click outside */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-100">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                  User Account
                </p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate lg:hidden">
                  {user?.email}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
