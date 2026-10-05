"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

import api from "@/lib/axios";
import BottomTabBar from "@/components/CreatorDashboard/BottomTabBar";

interface Conversation {
  id: string;
  conversationId: string;

  participant: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };

  latestMessage: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  } | null;

  updatedAt: string;
  role: "USER" | "CREATOR";
}

const FAQS = [
  "How does Wecall work?",
  "How are messages charged?",
  "How does the price change if I send long messages?",
  "What if a creator sends me back-to-back replies?",
  "How are video calls charged?",
  "What does the message status mean?",
];

export default function UserDashboard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: conversations = [], isLoading: loadingConversations } =
    useQuery<Conversation[]>({
      queryKey: ["my-conversations"],
      queryFn: async () => {
        const res = await api.get("/messages/my-conversations");
        return res.data;
      },
    });

  const filteredConversations = conversations.filter((conversation) =>
    conversation.participant.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-white font-sans text-[#070D3B]">
      <main className="h-full min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-5 pb-28 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 md:px-8">
        <div className="mx-auto w-full max-w-2xl">
          {/* ===================================================== */}
          {/* BRAND HEADER */}
          {/* ===================================================== */}

          <header className="flex items-center justify-between pb-7 pt-1 sm:pb-8">
            {/* Left - Chat */}
            <Link
              href="/dashboard/user"
              aria-label="Open chats"
              className="grid h-8 w-8 place-items-center rounded-2xl text-[#5D6B8A] transition active:scale-95 hover:bg-[#EEF4FF] hover:text-[#070D3B]"
            >
              <MessageCircle size={24} strokeWidth={2} />
            </Link>

            {/* Center - Logo */}
            <Link
              href="/dashboard/user"
              className="flex items-center gap-2 rounded-full px-2 py-1.5"
              aria-label="Wecall home"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0B3B91] text-white shadow-[0_8px_30px_rgba(11,59,145,0.18)]">
                <Sparkles size={18} strokeWidth={2.4} fill="currentColor" />
              </span>

              <span className="text-[22px] font-bold leading-none tracking-[-0.04em] text-[#070D3B]">
                Wecall
              </span>
            </Link>

            {/* Right - Settings */}
            <Link
              href="/settings"
              aria-label="Settings"
              className="grid h-8 w-8 place-items-center rounded-2xl text-[#5D6B8A] transition active:scale-95 hover:bg-[#EEF4FF] hover:text-[#070D3B]"
            >
              <Settings size={24} strokeWidth={2.1} />
            </Link>
          </header>

          <div className="space-y-9 pb-2">
            {/* ================================================= */}
            {/* WELCOME CARD */}
            {/* ================================================= */}

            <section className="rounded-[25px] border border-[#D9E6FF] bg-gradient-to-br from-[#EAF2FF] to-[#DCEAFF] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_45px_rgba(7,13,59,0.08)] sm:px-6 sm:py-5">
              <div className="flex items-center gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#0B3B91] text-white shadow-lg">
                  <Sparkles size={21} strokeWidth={2.4} fill="currentColor" />
                </span>

                <p className="max-w-xl text-[14px] leading-[1.45] text-[#52627F] sm:text-[17px]">
                  Welcome to your homepage, where you can see your{" "}
                  <span className="font-semibold text-[#0B3B91]">chats</span>,
                  find creators and see FAQs.
                </p>
              </div>
            </section>

            {/* ================================================= */}
            {/* INBOX */}
            {/* ================================================= */}

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-medium tracking-[-0.02em] text-[#60708E]">
                  Inbox
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen((value) => !value);

                    if (searchOpen) {
                      setSearchQuery("");
                    }
                  }}
                  aria-label={searchOpen ? "Close chat search" : "Search chats"}
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#F0F5FF] text-[#425271] transition active:scale-95 hover:bg-[#E7F0FF] hover:text-[#0B3B91]"
                >
                  {searchOpen ? <X size={18} /> : <Search size={18} />}
                </button>
              </div>

              {/* Search */}
              {searchOpen && (
                <div className="relative mb-4">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7B89A4]"
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="h-12 w-full rounded-2xl border border-[#D9E6FF] bg-[#F8FBFF] pl-11 pr-4 text-[16px] text-[#17305F] outline-none placeholder:text-[#9AA6BA] focus:border-[#AFC7F5] focus:bg-white"
                  />
                </div>
              )}

              {/* Loading */}
              {loadingConversations ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D9E6FF] border-t-[#0B3B91]" />
                </div>
              ) : filteredConversations.length === 0 ? (
                /* Empty */
                <div className="border-y border-[#DCE6F7] py-8">
                  <div className="flex items-center justify-between gap-4 px-1 sm:px-2">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-[#D9E6FF] bg-[#EDF4FF] text-[#6580A8]">
                        <MessageCircle size={25} strokeWidth={1.7} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[19px] font-semibold text-[#0B3B91]">
                          No chats yet
                        </p>

                        <p className="mt-1 text-[16px] italic text-[#7B89A4]">
                          No messages here.
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className="shrink-0 text-[#B1BCD0]"
                      size={30}
                    />
                  </div>
                </div>
              ) : (
                /* Conversations */
                <div className="border-y border-[#DCE6F7]">
                  {filteredConversations.map((conversation) => {
                    const participant = conversation.participant;

                    const latest = conversation.latestMessage;

                    return (
                      <Link
                        key={conversation.id}
                        href={`/dashboard/user/message/${participant.id}`}
                        className="group flex items-center gap-4 border-b border-[#DCE6F7] px-0 py-4 last:border-b-0 sm:px-2"
                      >
                        <div className="relative shrink-0">
                          {participant.avatarUrl ? (
                            <img
                              src={participant.avatarUrl}
                              alt={participant.name}
                              className="h-12 w-12 rounded-full object-cover ring-2 ring-[#BFD6FF]"
                            />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#DCE8FB] text-lg font-semibold text-[#0B3B91]">
                              {participant.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="truncate text-[18px] font-semibold text-[#0B3B91]">
                              {participant.name}
                            </h3>

                            {latest && (
                              <span className="shrink-0 text-[12px] font-medium text-[#8693AA]">
                                {formatMessageTime(latest.createdAt)}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-[15px] italic text-[#7B89A4]">
                            {latest ? latest.content : "No messages here."}
                          </p>
                        </div>

                        <ChevronRight
                          size={26}
                          strokeWidth={2}
                          className="shrink-0 text-[#7B89A4] transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ================================================= */}
            {/* FAQ */}
            {/* ================================================= */}

            <section className="pb-6">
              <h2 className="mb-5 text-[22px] font-medium tracking-[-0.02em] text-[#60708E]">
                FAQ
              </h2>

              <div className="space-y-3">
                {FAQS.map((question) => (
                  <div
                    key={question}
                    className="flex min-h-[40px] items-center justify-between gap-4 rounded-[22px] border border-[#DFE9F8] bg-gradient-to-b from-[#F1F6FF] to-[#E8F0FF] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-5"
                  >
                    <span className="text-[18px] leading-[1.28] text-[#17305F] sm:text-[19px]">
                      {question}
                    </span>

                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0B3B91] text-white">
                      <Plus size={16} strokeWidth={2.5} />
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ===================================================== */}
      {/* SHARED BOTTOM TAB BAR */}
      {/* ===================================================== */}

      {/* <BottomTabBar /> */}
    </div>
  );
}
