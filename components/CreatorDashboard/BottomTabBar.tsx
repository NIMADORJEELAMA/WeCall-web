"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDollarSign,
  MessageCircle,
  Settings,
  UserRound,
} from "lucide-react";

const tabs = [
  {
    label: "Chat",
    href: "/dashboard/creator-dashboard",
    icon: MessageCircle,
  },
  {
    label: "Earnings",
    href: "/earnings",
    icon: CircleDollarSign,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard/creator-dashboard") {
      return pathname === href || pathname.startsWith(`${href}/`);
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        border-t
        border-[#edf0f3]
        bg-white/95
        px-4
        pt-2
        pb-[calc(.45rem+env(safe-area-inset-bottom))]
        backdrop-blur-xl
      "
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-0 flex-col items-center justify-center gap-1 py-1.5"
            >
              <span
                className={`flex h-8 min-w-[58px] items-center justify-center rounded-full px-3 transition-all ${
                  active ? "bg-[#e9f2ff] text-[#1769e0]" : "text-[#718096]"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              </span>

              <span
                className={`text-[11px] leading-none ${
                  active
                    ? "font-semibold text-[#1769e0]"
                    : "font-medium text-[#7b8797]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
