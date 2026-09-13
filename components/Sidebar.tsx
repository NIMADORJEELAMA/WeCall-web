"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
  Activity,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx, { ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const isOpen = !isCollapsed || isHovered;

  // Grouped Navigation for the Pay-Per-Reply Platform
  const menuGroups = [
    {
      label: "Platform",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Activity Feed", href: "/dashboard/activity", icon: Activity },
      ],
    },
    {
      label: "User Management",
      items: [
        { name: "All Users", href: "/dashboard/users", icon: Users },
        { name: "Creators", href: "/dashboard/creators", icon: Star },
        { name: "Admin Roles", href: "/dashboard/admins", icon: ShieldCheck },
      ],
    },
    {
      label: "Operations",
      items: [
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
      ],
    },
  ];

  return (
    <>
      {/* Overlay (mobile) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          // BASE STYLES:
          "bg-[#0f172a] text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 h-screen",

          // DESKTOP:
          "md:sticky md:top-0 md:flex",
          isOpen ? "md:w-64" : "md:w-20",

          // MOBILE DRAWER:
          "fixed top-0 left-0 z-50 w-64 transform md:relative md:translate-x-0",

          // THE KEY FIX:
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* BRANDING HEADER */}
        <div className="h-20 flex items-center justify-between px-4 overflow-hidden border-b border-slate-800/50 relative">
          {/* Logo/Title Container */}
          <div
            className={cn(
              "transition-all duration-300 flex flex-col min-w-[140px]",
              isOpen
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-10 pointer-events-none",
            )}
          >
            <span className="text-blue-500 font-bold text-lg leading-tight truncate">
              WeCall
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Admin Portal
            </span>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-1.5 rounded-md bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-all border border-slate-700 z-10 hidden md:block",
              !isOpen && "absolute left-1/2 -translate-x-1/2",
            )}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* NAVIGATION SECTION */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar no-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              {/* Group Label */}
              <p
                className={cn(
                  "px-6 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-opacity",
                  isOpen ? "opacity-100" : "opacity-0",
                )}
              >
                {group.label}
              </p>

              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center px-6 py-3 my-1 transition-all duration-200 group relative",
                      isActive
                        ? "text-white bg-blue-600/10"
                        : "hover:bg-slate-800/50 hover:text-white",
                    )}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                    )}

                    <Icon
                      size={20}
                      className={cn(
                        "min-w-[20px] transition-colors",
                        isActive
                          ? "text-blue-500"
                          : "text-slate-500 group-hover:text-blue-400",
                      )}
                    />

                    <span
                      className={cn(
                        "ml-4 text-sm font-medium transition-all duration-300 whitespace-nowrap",
                        isOpen
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-4 w-0",
                      )}
                    >
                      {item.name}
                    </span>

                    {/* Tooltip for collapsed mode */}
                    {!isOpen && (
                      <div className="absolute left-16 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-xl border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* FOOTER - USER PROFILE OR SETTINGS */}
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center w-full px-2 py-2 text-slate-400 hover:text-white transition-colors group">
            <Settings size={20} />
            {isOpen && (
              <span className="ml-4 text-sm font-medium">
                Platform Settings
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
