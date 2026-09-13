"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  User as UserIcon,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";

import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    creatorProfile?: {
      username?: string;
      category?: string;
      replyPrice?: number;
      profileImage?: string | null;
    } | null;
  };
  latestMessage: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  } | null;
  updatedAt: string;
}

export default function UserDashboard() {
  const [activeView, setActiveView] = useState<"chats" | "profile">("chats");
  const [localUser, setLocalUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const handleLogout = () => {
    // localStorage.removeItem("token");
    localStorage.removeItem("access_token");

    localStorage.removeItem("user");
    router.push("/login");
  };
  function formatMessageTime(date: string) {
    const messageDate = new Date(date);
    const now = new Date();
    const sameDay = messageDate.toDateString() === now.toDateString();

    if (sameDay) {
      return messageDate.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setLocalUser(JSON.parse(stored));
  }, []);

  const { data: conversations = [], isLoading: loadingConversations } =
    useQuery<Conversation[]>({
      queryKey: ["my-conversations"],
      queryFn: async () => {
        const res = await api.get("/messages/my-conversations");
        return res.data;
      },
    });

  const filteredConversations = conversations.filter((c) =>
    c.creator.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 min-h-screen font-sans text-slate-800 pb-24">
      {/* Top Header */}
      <header className="mb-6 border-b border-slate-200/60 pb-4 mt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {activeView === "chats" && "Chats"}
          {activeView === "profile" && "Profile"}
        </h1>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* VIEW: CHATS (WhatsApp Style Active Conversations) */}
      {/* ------------------------------------------------------------- */}
      {activeView === "chats" && (
        <div className="animate-in fade-in duration-300">
          <div className="relative mb-4">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full bg-slate-100/70 border border-slate-200/80 rounded-2xl h-11 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>

          {loadingConversations ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-20">
              <MessageCircle className="mx-auto h-12 w-12 text-slate-300 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-slate-900">
                No chats yet
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Your active conversations will appear here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm divide-y divide-slate-100">
              {filteredConversations.map((conversation) => {
                const creator = conversation.creator;
                const latest = conversation.latestMessage;

                return (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/user/message/${creator.id}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-base">
                          {creator.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">
                          {creator.name}
                        </h3>
                        {latest && (
                          <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                            {formatMessageTime(latest.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {latest ? latest.content : "Tap to start chatting"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW: PROFILE & SETTINGS */}
      {/* ------------------------------------------------------------- */}
      {activeView === "profile" && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-3">
                {localUser?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {localUser?.name || "User"}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {localUser?.email}
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                <ShieldCheck size={14} /> Fan Account
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-3 rounded-xl text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIMPLIFIED BOTTOM NAVIGATION BAR (2 Tabs) */}
      {/* ------------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200/80 z-50 px-6 py-2.5 pb-safe">
        <div className="max-w-xs mx-auto flex justify-around items-center">
          <button
            onClick={() => setActiveView("chats")}
            className="flex flex-col items-center gap-1 w-20 transition-transform active:scale-95"
          >
            <MessageCircle
              size={24}
              className={`transition-all duration-200 ${activeView === "chats" ? "text-slate-900 stroke-[2.5px]" : "text-slate-400 stroke-[1.5px]"}`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${activeView === "chats" ? "text-slate-900 font-semibold" : "text-slate-400"}`}
            >
              Chats
            </span>
          </button>

          <button
            onClick={() => setActiveView("profile")}
            className="flex flex-col items-center gap-1 w-20 transition-transform active:scale-95"
          >
            <UserIcon
              size={24}
              className={`transition-all duration-200 ${activeView === "profile" ? "text-slate-900 stroke-[2.5px]" : "text-slate-400 stroke-[1.5px]"}`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${activeView === "profile" ? "text-slate-900 font-semibold" : "text-slate-400"}`}
            >
              Profile
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
