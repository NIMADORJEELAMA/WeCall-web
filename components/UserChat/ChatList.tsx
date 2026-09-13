"use client";

import {
  Archive,
  CheckCheck,
  MessageCircle,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";

export interface ChatListConversation {
  id: string;

  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;

    creatorProfile?: {
      username?: string;
      category?: string | null;
      replyPrice?: number | string;
      profileImage?: string | null;
    } | null;
  };

  latestMessage?: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  } | null;

  updatedAt: string;
  unreadCount?: number;
  online?: boolean;
}

interface ChatListProps {
  conversations: ChatListConversation[];
  selectedConversationId?: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelect: (conversation: ChatListConversation) => void;
  loading?: boolean;
}

function formatChatTime(dateString?: string) {
  if (!dateString) return "";

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
    month: "short",
    day: "numeric",
  });
}

export function ChatList({
  conversations,
  selectedConversationId,
  searchQuery,
  onSearchChange,
  onSelect,
  loading = false,
}: ChatListProps) {
  const filtered = conversations.filter((conversation) => {
    const name = conversation.creator.name?.toLowerCase() || "";
    const username =
      conversation.creator.creatorProfile?.username?.toLowerCase() || "";

    const query = searchQuery.toLowerCase();

    return name.includes(query) || username.includes(query);
  });

  return (
    <aside className="flex h-full w-full flex-col bg-white md:w-[360px] md:border-r md:border-slate-200/70">
      {/* Header */}
      <div className="px-4 pb-3 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-950">
              Chats
            </h1>

            <p className="mt-0.5 text-xs text-slate-400">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Filter"
            >
              <SlidersHorizontal size={18} />
            </button>

            <button
              className="rounded-full p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="More"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations"
            className="h-11 w-full rounded-xl border border-transparent bg-slate-100/80 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="space-y-1 px-2 pt-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="flex animate-pulse items-center gap-3 rounded-2xl p-3"
              >
                <div className="h-12 w-12 rounded-full bg-slate-200" />

                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-28 rounded bg-slate-200" />
                  <div className="h-3 w-44 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <MessageCircle
                size={28}
                className="text-indigo-500"
                strokeWidth={1.7}
              />
            </div>

            <h3 className="font-semibold text-slate-900">
              {searchQuery ? "No chats found" : "No conversations yet"}
            </h3>

            <p className="mt-1.5 max-w-[240px] text-xs leading-5 text-slate-400">
              {searchQuery
                ? "Try searching for another creator."
                : "Start a conversation with a creator and your chats will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((conversation) => {
              const latest = conversation.latestMessage;

              const isSelected = selectedConversationId === conversation.id;

              const creatorImage =
                conversation.creator.avatarUrl ||
                conversation.creator.creatorProfile?.profileImage;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation)}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                    isSelected
                      ? "bg-indigo-50/80"
                      : "hover:bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  <ChatAvatar
                    name={conversation.creator.name}
                    image={creatorImage}
                    online={conversation.online}
                    size="lg"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`truncate text-sm ${
                          conversation.unreadCount
                            ? "font-bold text-slate-950"
                            : "font-semibold text-slate-800"
                        }`}
                      >
                        {conversation.creator.name}
                      </h3>

                      <span
                        className={`shrink-0 text-[11px] ${
                          conversation.unreadCount
                            ? "font-semibold text-indigo-600"
                            : "text-slate-400"
                        }`}
                      >
                        {formatChatTime(
                          latest?.createdAt || conversation.updatedAt,
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5">
                      {latest?.senderId && (
                        <CheckCheck
                          size={14}
                          className="shrink-0 text-indigo-500"
                        />
                      )}

                      <p
                        className={`min-w-0 flex-1 truncate text-xs ${
                          conversation.unreadCount
                            ? "font-medium text-slate-700"
                            : "text-slate-400"
                        }`}
                      >
                        {latest?.content || "Start chatting"}
                      </p>

                      {!!conversation.unreadCount && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
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
    </aside>
  );
}
