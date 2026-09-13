"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { MessageBubble, ChatMessage } from "./MessageBubble";

interface ChatScreenProps {
  creator: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    creatorProfile?: {
      username?: string;
      profileImage?: string | null;
    } | null;
  };

  messages: ChatMessage[];

  currentUserId: string;

  value: string;
  onChange: (value: string) => void;
  onSend: () => void;

  loading?: boolean;
  sending?: boolean;

  onBack?: () => void;
}

export function ChatScreen({
  creator,
  messages,
  currentUserId,
  value,
  onChange,
  onSend,
  loading = false,
  sending = false,
  onBack,
}: ChatScreenProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  const avatar =
    creator.avatarUrl || creator.creatorProfile?.profileImage || null;

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#f8f9fc]">
      <ChatHeader
        name={creator.name}
        username={creator.creatorProfile?.username}
        avatarUrl={avatar}
        onBack={onBack}
      />

      {/* Messages */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {/* subtle background */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(#64748b 0.7px, transparent 0.7px)",
              backgroundSize: "18px 18px",
            }}
          />
        </div>

        <div className="relative mx-auto flex max-w-4xl flex-col gap-2 px-3 py-5 sm:px-6">
          {/* Date divider */}
          {messages.length > 0 && (
            <div className="my-3 flex items-center justify-center">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 shadow-sm">
                Today
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <MessageCircle size={28} className="text-indigo-500" />
              </div>

              <h3 className="font-semibold text-slate-900">
                Start the conversation
              </h3>

              <p className="mt-1 max-w-[260px] text-xs leading-5 text-slate-400">
                Send a message to {creator.name} to start chatting.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={message.senderId === currentUserId}
              />
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput
        value={value}
        onChange={onChange}
        onSend={onSend}
        disabled={sending}
      />
    </section>
  );
}
