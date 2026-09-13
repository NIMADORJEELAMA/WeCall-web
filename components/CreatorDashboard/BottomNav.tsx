"use client";
import { MessageCircle, UserRound } from "lucide-react";
interface BottomNavProps {
  activeTab: "messages" | "profile";
  onTabChange: (tab: "messages" | "profile") => void;
  hasUnread?: boolean;
}
export function BottomNav({
  activeTab,
  onTabChange,
  hasUnread = false,
}: BottomNavProps) {
  return (
    <nav
      className=" fixed bottom-0 left-0 right-0 z-[100] md:hidden border-t border-slate-200/80 bg-white/95 px-4 pt-2 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.06)] "
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      {" "}
      <div className="mx-auto flex max-w-md items-center justify-around">
        {" "}
        {/* Chats */}{" "}
        <button
          type="button"
          onClick={() => onTabChange("messages")}
          className="group relative flex min-w-[90px] flex-col items-center gap-1"
        >
          {" "}
          <div
            className={` relative flex h-8 min-w-[52px] items-center justify-center rounded-full transition-all ${activeTab === "messages" ? "bg-emerald-100 text-emerald-600" : "text-slate-400"} `}
          >
            {" "}
            <MessageCircle
              size={21}
              strokeWidth={activeTab === "messages" ? 2.4 : 1.9}
            />{" "}
            {hasUnread && (
              <span className="absolute right-2 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
            )}{" "}
          </div>{" "}
          <span
            className={` text-[10px] font-semibold ${activeTab === "messages" ? "text-emerald-600" : "text-slate-400"} `}
          >
            {" "}
            Chats{" "}
          </span>{" "}
        </button>{" "}
        {/* Profile */}{" "}
        <button
          type="button"
          onClick={() => onTabChange("profile")}
          className="group relative flex min-w-[90px] flex-col items-center gap-1"
        >
          {" "}
          <div
            className={` flex h-8 min-w-[52px] items-center justify-center rounded-full transition-all ${activeTab === "profile" ? "bg-emerald-100 text-emerald-600" : "text-slate-400"} `}
          >
            {" "}
            <UserRound
              size={21}
              strokeWidth={activeTab === "profile" ? 2.4 : 1.9}
            />{" "}
          </div>{" "}
          <span
            className={` text-[10px] font-semibold ${activeTab === "profile" ? "text-emerald-600" : "text-slate-400"} `}
          >
            {" "}
            Profile{" "}
          </span>{" "}
        </button>{" "}
      </div>{" "}
    </nav>
  );
}
