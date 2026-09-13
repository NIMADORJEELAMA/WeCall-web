"use client";

import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";

interface ChatHeaderProps {
  name: string;
  username?: string;
  avatarUrl?: string | null;
  online?: boolean;
  onBack?: () => void;
}

export function ChatHeader({
  name,
  username,
  avatarUrl,
  online = false,
  onBack,
}: ChatHeaderProps) {
  return (
    <header className="flex h-[72px] shrink-0 items-center border-b border-slate-200/70 bg-white/95 px-3 backdrop-blur-xl md:px-5">
      <button
        onClick={onBack}
        className="mr-2 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 md:hidden"
        aria-label="Back"
      >
        <ArrowLeft size={21} />
      </button>

      <ChatAvatar name={name} image={avatarUrl} online={online} size="md" />

      <div className="ml-3 min-w-0 flex-1">
        <h2 className="truncate text-sm font-bold text-slate-950">{name}</h2>

        <p className="mt-0.5 truncate text-[11px]">
          {online ? (
            <span className="font-medium text-emerald-500">Online</span>
          ) : username ? (
            <span className="text-slate-400">@{username}</span>
          ) : (
            <span className="text-slate-400">Creator</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          className="hidden rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
          aria-label="Call"
        >
          <Phone size={18} />
        </button>

        <button
          className="hidden rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
          aria-label="Video call"
        >
          <Video size={19} />
        </button>

        <button
          className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="More"
        >
          <MoreVertical size={19} />
        </button>
      </div>
    </header>
  );
}
