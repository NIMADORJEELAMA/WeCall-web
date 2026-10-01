"use client";
import { useMemo, useState } from "react";
import {
  MessageCircle,
  Search,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";

import type { ConversationThread } from "@/types/conversation";
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
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}
function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
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
  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return conversations;
    return conversations.filter((thread) => {
      const latest = thread.messages[thread.messages.length - 1]?.content || "";
      return (
        thread.senderName.toLowerCase().includes(value) ||
        latest.toLowerCase().includes(value)
      );
    });
  }, [conversations, search]);
  const pendingCount = conversations.filter(
    (conversation) => conversation.hasPending,
  ).length;
  return (
    <aside
      className={`h-full min-h-0 w-full min-w-0 flex flex-col bg-white ${
        selectedConversationId ? "hidden" : "flex"
      }`}
    >
      {" "}
      {/* Header */}{" "}
      <div className="shrink-0 border-b border-[#EEF4FF] px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] md:px-6">
        {" "}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#0B3B91] text-white shadow-[0_8px_24px_rgba(11,59,145,0.16)]">
                <MessageCircle size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7B89A4]">
                  Wecall
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#070D3B]">
                    Chats
                  </h1>
                  {conversations.length > 0 && (
                    <span className="rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-semibold text-[#0B3B91]">
                      {conversations.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {pendingCount > 0 && (
              <p className="mt-0.5 text-xs font-medium text-[#0B3B91]">
                {pendingCount} message{pendingCount !== 1 ? "s" : ""} waiting
                for reply
              </p>
            )}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#60708E] transition hover:bg-[#EEF4FF] hover:text-[#0B3B91]"
          >
            {" "}
            <SlidersHorizontal size={19} />{" "}
          </button>{" "}
        </div>{" "}
        {/* Search */}{" "}
        <div className="relative mt-4">
          {" "}
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8693AA]"
          />{" "}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="h-12 w-full rounded-2xl border border-[#D9E6FF] bg-[#F7FAFF] pl-10 pr-10 text-base text-[#17305F] outline-none transition placeholder:text-[#8693AA] focus:border-[#9DBEF5] focus:bg-white focus:ring-4 focus:ring-[#0B3B91]/10"
            style={{ fontSize: "16px" }}
          />{" "}
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8693AA] hover:bg-[#EEF4FF]"
            >
              {" "}
              <X size={15} />{" "}
            </button>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Conversations */}{" "}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-4 scrollbar-thin">
        {" "}
        {isLoading ? (
          <div className="space-y-1 px-2">
            {" "}
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-3 rounded-2xl px-3 py-3"
              >
                {" "}
                <div className="h-14 w-14 shrink-0 rounded-full bg-[#DCE8FB]" />{" "}
                <div className="flex-1 space-y-2">
                  {" "}
                  <div className="h-3.5 w-32 rounded bg-[#DCE8FB]" />{" "}
                  <div className="h-3 w-48 rounded bg-[#EEF4FF]" />{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-8 text-center">
            {" "}
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF4FF]">
              {" "}
              <MessageCircle
                size={28}
                strokeWidth={1.7}
                className="text-[#8693AA]"
              />{" "}
            </div>{" "}
            <h3 className="font-semibold text-[#17305F]">
              {" "}
              {search ? "No chats found" : "No conversations yet"}{" "}
            </h3>{" "}
            <p className="mt-1 max-w-[260px] text-xs leading-5 text-[#8693AA]">
              {" "}
              {search
                ? "Try searching for a different name or message."
                : "When someone sends you a paid message, it will appear here."}{" "}
            </p>{" "}
          </div>
        ) : (
          <div className="px-2">
            {" "}
            {filteredConversations.map((thread) => {
              const latestMsg = thread.messages[thread.messages.length - 1];
              const isSelected =
                selectedConversationId === thread.conversationId;
              return (
                <button
                  key={thread.conversationId}
                  type="button"
                  onClick={() => onSelectConversation(thread.conversationId)}
                  className={` group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.99] ${isSelected ? "bg-[#EEF4FF]" : "hover:bg-slate-50 active:bg-[#EEF4FF]"} `}
                >
                  {" "}
                  {/* Avatar */}{" "}
                  <div className="relative shrink-0">
                    {" "}
                    {thread.avatarUrl ? (
                      <img
                        src={thread.avatarUrl}
                        alt={thread.senderName}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCEAFF] text-sm font-bold text-[#0B3B91] shadow-sm ring-2 ring-[#EEF4FF]">
                        {" "}
                        {getInitials(thread.senderName)}{" "}
                      </div>
                    )}{" "}
                    {thread.hasPending && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#0B3B91]">
                        {" "}
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />{" "}
                      </span>
                    )}{" "}
                  </div>{" "}
                  {/* Content */}{" "}
                  <div className="min-w-0 flex-1">
                    {" "}
                    <div className="flex items-center justify-between gap-2">
                      {" "}
                      <h3
                        className={` truncate text-[15px] ${thread.hasPending ? "font-bold text-[#070D3B]" : "font-semibold text-[#17305F]"} `}
                      >
                        {" "}
                        {thread.senderName}{" "}
                      </h3>{" "}
                      <span
                        className={` shrink-0 text-[11px] ${thread.hasPending ? "font-semibold text-[#0B3B91]" : "text-[#8693AA]"} `}
                      >
                        {" "}
                        {formatTime(thread.latestTimestamp)}{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="mt-1 flex items-center gap-2">
                      {" "}
                      <p
                        className={` min-w-0 flex-1 truncate text-[13px] ${thread.hasPending ? "font-medium text-[#52627F]" : "text-[#7B89A4]"} `}
                      >
                        {" "}
                        {latestMsg?.content || "No messages"}{" "}
                      </p>{" "}
                      {thread.totalBounty > 0 && (
                        <span className="shrink-0 rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-bold text-[#0B3B91]">
                          {" "}
                          ${thread.totalBounty}{" "}
                        </span>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                  <ChevronRight
                    size={17}
                    className={` shrink-0 transition md:opacity-0 md:group-hover:opacity-100 ${isSelected ? "text-[#0B3B91]" : "text-[#B1BCD0]"} `}
                  />{" "}
                </button>
              );
            })}{" "}
          </div>
        )}{" "}
      </div>{" "}
    </aside>
  );
}
