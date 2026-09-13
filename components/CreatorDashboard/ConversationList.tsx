"use client";
import { useMemo, useState } from "react";
import {
  MessageCircle,
  Search,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react";
interface ReceivedMessage {
  id: string;
  content: string;
  status:
    | "PENDING_PAYMENT"
    | "AWAITING_REPLY"
    | "REPLIED"
    | "DECLINED"
    | "EXPIRED"
    | "REFUNDED";
  createdAt: string;
  payment: { amount: number };
}
interface ConversationThread {
  senderId: string;
  senderName: string;
  avatarUrl?: string | null;
  messages: ReceivedMessage[];
  hasPending: boolean;
  latestTimestamp: string;
  totalBounty: number;
}
interface ConversationListProps {
  conversations: ConversationThread[];
  selectedSenderId: string | null;
  onSelectSender: (senderId: string) => void;
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
  selectedSenderId,
  onSelectSender,
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
      className={` md:col-span-5 w-full md:border-r md:border-slate-200 flex flex-col bg-white ${selectedSenderId ? "hidden md:flex" : "flex"} `}
    >
      {" "}
      {/* Header */}{" "}
      <div className="shrink-0 px-4 pt-5 pb-3 md:px-5 md:pt-6">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div>
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <h1 className="text-[25px] font-bold tracking-tight text-slate-950">
                {" "}
                Chats{" "}
              </h1>{" "}
              {conversations.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {" "}
                  {conversations.length}{" "}
                </span>
              )}{" "}
            </div>{" "}
            {pendingCount > 0 && (
              <p className="mt-0.5 text-xs text-blue-600 font-medium">
                {" "}
                {pendingCount} message{pendingCount !== 1 ? "s" : ""} waiting
                for reply{" "}
              </p>
            )}{" "}
          </div>{" "}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
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
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />{" "}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className=" h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 "
          />{" "}
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200"
            >
              {" "}
              <X size={15} />{" "}
            </button>
          )}{" "}
        </div>{" "}
      </div>{" "}
      {/* Conversations */}{" "}
      <div className=" min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 md:pb-2 scrollbar-thin ">
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
                <div className="h-14 w-14 shrink-0 rounded-full bg-slate-200" />{" "}
                <div className="flex-1 space-y-2">
                  {" "}
                  <div className="h-3.5 w-32 rounded bg-slate-200" />{" "}
                  <div className="h-3 w-48 rounded bg-slate-100" />{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-8 text-center">
            {" "}
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              {" "}
              <MessageCircle
                size={28}
                strokeWidth={1.7}
                className="text-slate-400"
              />{" "}
            </div>{" "}
            <h3 className="font-semibold text-slate-800">
              {" "}
              {search ? "No chats found" : "No conversations yet"}{" "}
            </h3>{" "}
            <p className="mt-1 max-w-[260px] text-xs leading-5 text-slate-400">
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
              const isSelected = selectedSenderId === thread.senderId;
              return (
                <button
                  key={thread.senderId}
                  type="button"
                  onClick={() => onSelectSender(thread.senderId)}
                  className={` group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all active:scale-[0.99] ${isSelected ? "bg-blue-50" : "hover:bg-slate-50 active:bg-slate-100"} `}
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white shadow-sm">
                        {" "}
                        {getInitials(thread.senderName)}{" "}
                      </div>
                    )}{" "}
                    {thread.hasPending && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-500">
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
                        className={` truncate text-[15px] ${thread.hasPending ? "font-bold text-slate-950" : "font-semibold text-slate-800"} `}
                      >
                        {" "}
                        {thread.senderName}{" "}
                      </h3>{" "}
                      <span
                        className={` shrink-0 text-[11px] ${thread.hasPending ? "font-semibold text-blue-600" : "text-slate-400"} `}
                      >
                        {" "}
                        {formatTime(thread.latestTimestamp)}{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="mt-1 flex items-center gap-2">
                      {" "}
                      <p
                        className={` min-w-0 flex-1 truncate text-[13px] ${thread.hasPending ? "font-medium text-slate-700" : "text-slate-500"} `}
                      >
                        {" "}
                        {latestMsg?.content || "No messages"}{" "}
                      </p>{" "}
                      {thread.totalBounty > 0 && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                          {" "}
                          ${thread.totalBounty}{" "}
                        </span>
                      )}{" "}
                    </div>{" "}
                  </div>{" "}
                  <ChevronRight
                    size={17}
                    className={` shrink-0 transition md:opacity-0 md:group-hover:opacity-100 ${isSelected ? "text-blue-500" : "text-slate-300"} `}
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
