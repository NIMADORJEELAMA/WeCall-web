"use client";

import { LucideIcon } from "lucide-react";

export interface BottomTabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface BottomTabBarProps {
  items: BottomTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function BottomTabBar({
  items,
  activeKey,
  onChange,
  className = "",
}: BottomTabBarProps) {
  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md ${className}`}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex w-full max-w-md items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              aria-current={active ? "page" : undefined}
              className="flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-transform active:scale-95"
            >
              <Icon
                size={23}
                aria-hidden="true"
                className={
                  active
                    ? "text-slate-900 stroke-[2.5]"
                    : "text-slate-400 stroke-[1.7]"
                }
              />
              <span
                className={`text-[10px] leading-none transition-colors ${
                  active
                    ? "font-semibold text-slate-900"
                    : "font-medium text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
