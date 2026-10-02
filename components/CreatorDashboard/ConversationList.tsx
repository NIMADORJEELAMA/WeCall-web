"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Bot,
  CheckCheck,
  Forward,
  Link2,
  MessageCircle,
  Pencil,
  Search,
  Share,
  Share2,
  Upload,
  Users,
  X,
} from "lucide-react";

import type { ConversationThread } from "@/types/conversation";
import BottomTabBar from "./BottomTabBar";

interface ConversationListProps {
  conversations: ConversationThread[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoading: boolean;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
}: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">(
    "all",
  );
  const [showSearch, setShowSearch] = useState(false);

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();

    let result = conversations;

    if (activeTab === "unread") {
      result = result.filter((conversation) => conversation.hasPending);
    }

    // The current ConversationThread model does not expose a group flag,
    // so Groups remains a visual tab without changing existing conversation data.
    if (activeTab === "groups") {
      result = [];
    }

    if (!value) return result;

    return result.filter((thread) => {
      const latest = thread.messages[thread.messages.length - 1]?.content || "";

      return (
        thread.senderName.toLowerCase().includes(value) ||
        latest.toLowerCase().includes(value)
      );
    });
  }, [conversations, search, activeTab]);

  const pendingCount = conversations.filter(
    (conversation) => conversation.hasPending,
  ).length;

  return (
    <aside
      className={`h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white ${
        selectedConversationId ? "hidden" : "flex"
      }`}
    >
      {/* Soft blue top area */}
      <header className="relative shrink-0 overflow-hidden bg-gradient-to-b from-[#cfe3ff] via-[#e8f1ff] to-[#f7f9fc] px-5 pb-5 pt-[calc(0.9rem+env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-white/35 blur-2xl" />
        <div className="pointer-events-none absolute -left-20 top-10 h-32 w-32 rounded-full bg-white/25 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <button
            type="button"
            aria-label="Share profile"
            className="flex h-11 items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 text-[#263447] shadow-[0_6px_18px_rgba(56,88,130,0.08)] backdrop-blur-sm transition hover:bg-white/75 active:scale-95"
          >
            <span className="whitespace-nowrap text-[13px] font-semibold">
              Share Profile
            </span>

            <Upload size={20} strokeWidth={1.8} />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-white/45 text-[#263447] shadow-[0_6px_18px_rgba(56,88,130,0.08)] backdrop-blur-sm transition hover:bg-white/75 active:scale-95"
            >
              <Bell size={20} strokeWidth={1.8} />

              {pendingCount > 0 && (
                <span className="absolute mr-[-30px] mt-[-27px] h-2.5 w-2.5 rounded-full border-2 border-[#d8e8ff] bg-[#3aa86b]" />
              )}
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-end justify-between">
            <div>
              {/* <p className="text-[12px] font-medium text-[#71809a]">
                {pendingCount > 0
                  ? `${pendingCount} waiting for your reply`
                  : "Stay connected"}
              </p> */}
              <h1 className="mt-0.5 text-[30px] font-bold tracking-[-0.045em] text-[#172238]">
                Messages
              </h1>
            </div>

            <button
              type="button"
              aria-label="Search messages"
              onClick={() => setShowSearch((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-full text-[#51627d] transition hover:bg-white/60 active:scale-95"
            >
              <Search size={21} strokeWidth={1.9} />
            </button>
          </div>

          {showSearch && (
            <div className="relative mt-4">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f8da4]"
              />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages"
                className="h-11 w-full rounded-2xl border border-white/80 bg-white/80 pl-10 pr-10 text-[15px] text-[#172238] outline-none backdrop-blur-sm transition placeholder:text-[#8995a9] focus:bg-white focus:ring-4 focus:ring-white/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#7f8da4] hover:bg-[#edf2f8]"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reference-style filter pills */}
        <div className="relative mt-5 flex gap-2">
          {[
            { id: "all" as const, label: "All", count: conversations.length },
            { id: "unread" as const, label: "Unread", count: pendingCount },
            // { id: "groups" as const, label: "Groups", count: 0 },
          ].map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-10 rounded-full px-5 text-[13px] font-semibold transition active:scale-[0.98] ${
                  active
                    ? "bg-[#17191d] text-white shadow-[0_5px_14px_rgba(0,0,0,0.12)]"
                    : "bg-white/70 text-[#69768a] hover:bg-white"
                }`}
              >
                {tab.label}
                {tab.id === "unread" && tab.count > 0 && (
                  <span className="ml-1.5 opacity-70">({tab.count})</span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Conversation list */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-white pb-4 scrollbar-thin">
        {isLoading ? (
          <div className="divide-y divide-[#edf0f3]">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-3.5 px-5 py-3.5"
              >
                <div className="h-14 w-14 shrink-0 rounded-full bg-[#e9edf2]" />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="h-3.5 w-32 rounded-full bg-[#e9edf2]" />
                  <div className="h-3 w-48 max-w-[75%] rounded-full bg-[#f0f2f5]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex min-h-[48vh] flex-col items-center justify-center px-8 text-center">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#f1f4f7] text-[#7b8798]">
              {activeTab === "groups" ? (
                <Users size={27} strokeWidth={1.7} />
              ) : (
                <MessageCircle size={28} strokeWidth={1.7} />
              )}
            </div>
            <h3 className="font-semibold text-[#263447]">
              {search
                ? "No chats found"
                : activeTab === "groups"
                  ? "No groups yet"
                  : activeTab === "unread"
                    ? "All caught up"
                    : "No conversations yet"}
            </h3>
            <p className="mt-1 max-w-[270px] text-xs leading-5 text-[#8a95a5]">
              {search
                ? "Try searching for a different name or message."
                : activeTab === "groups"
                  ? "Group conversations will appear here."
                  : activeTab === "unread"
                    ? "You have no messages waiting for a reply."
                    : "When someone sends you a paid message, it will appear here."}
            </p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((thread, index) => {
              const latestMsg = thread.messages[thread.messages.length - 1];
              const isSelected =
                selectedConversationId === thread.conversationId;

              return (
                <button
                  key={thread.conversationId}
                  type="button"
                  onClick={() => onSelectConversation(thread.conversationId)}
                  className={`group relative flex w-full items-center gap-3.5 border-b border-[#edf0f3] px-5 py-3.5 text-left transition-colors active:bg-[#f4f6f8] ${
                    isSelected ? "bg-[#f5f8fc]" : "hover:bg-[#fafbfc]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {thread.avatarUrl ? (
                      <img
                        src={thread.avatarUrl}
                        alt={thread.senderName}
                        className="h-[58px] w-[58px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-gradient-to-br from-[#d8e7f8] to-[#aebfd3] text-sm font-bold text-[#40566e]">
                        {getInitials(thread.senderName)}
                      </div>
                    )}

                    {/* Online / pending indicator */}
                    {thread.hasPending && (
                      <span className="absolute bottom-0 right-0 grid h-[18px] w-[18px] place-items-center rounded-full border-[2px] border-white bg-[#2fa66a]">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                    )}
                  </div>

                  {/* Message preview */}
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className={`min-w-0 truncate text-[15px] tracking-[-0.01em] ${
                          thread.hasPending
                            ? "font-bold text-[#1d2735]"
                            : "font-semibold text-[#273342]"
                        }`}
                      >
                        {thread.senderName}
                      </h3>

                      <span
                        className={`shrink-0 text-[11px] ${
                          thread.hasPending
                            ? "font-medium text-[#68758a]"
                            : "text-[#9aa3af]"
                        }`}
                      >
                        {formatTime(thread.latestTimestamp)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                      {latestMsg && !thread.hasPending && (
                        <CheckCheck
                          size={15}
                          strokeWidth={2}
                          className="shrink-0 text-[#42afd1]"
                        />
                      )}

                      <p
                        className={`min-w-0 flex-1 truncate text-[13px] leading-5 ${
                          thread.hasPending
                            ? "font-medium text-[#596779]"
                            : "text-[#8a95a3]"
                        }`}
                      >
                        {latestMsg?.content || "No messages"}
                      </p>

                      {thread.totalBounty > 0 && (
                        <span className="shrink-0 rounded-full bg-[#edf5ff] px-2 py-0.5 text-[10px] font-bold text-[#4673a8]">
                          ${thread.totalBounty}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomTabBar />
    </aside>
  );
}
