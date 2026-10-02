"use client";

import { useEffect, useRef } from "react";
import type {
  ConversationMessage,
  ConversationThread,
} from "@/types/conversation";
import {
  ArrowLeft,
  CheckCheck,
  ChevronLeft,
  Clock3,
  DollarSign,
  MessageCircle,
  MoreVertical,
  Reply,
  Send,
} from "lucide-react";

interface ChatWindowProps {
  activeThread: ConversationThread | undefined;

  selectedConversationId: string | null;

  replyContent: string;

  setReplyContent: (value: string) => void;

  /**
   * The paid USER message the creator explicitly selected.
   *
   * Optional because the creator is allowed to send a reply
   * without manually selecting a message.
   */
  selectedReplyMessage: ConversationMessage | undefined;

  onSelectReplyMessage: (message: ConversationMessage | undefined) => void;

  /**
   * If messageId is undefined, the parent automatically chooses
   * the latest available USER message.
   */
  onSendReply: (messageId?: string) => void;

  isSendingReply: boolean;

  onBack: () => void;

  /**
   * Pagination
   */
  isLoadingMessages?: boolean;

  isLoadingOlderMessages?: boolean;

  hasOlderMessages?: boolean;

  onLoadOlderMessages?: () => void;
}

// ============================================================
// HELPERS
// ============================================================

function formatMessageTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(dateString: string) {
  const date = new Date(dateString);

  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return "Today";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
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

// ============================================================
// COMPONENT
// ============================================================

export function ChatWindow({
  activeThread,
  selectedConversationId,

  replyContent,
  setReplyContent,

  selectedReplyMessage,
  onSelectReplyMessage,

  onSendReply,

  isSendingReply,

  onBack,

  isLoadingMessages = false,
  isLoadingOlderMessages = false,
  hasOlderMessages = false,
  onLoadOlderMessages,
}: ChatWindowProps) {
  // ============================================================
  // REFS
  // ============================================================

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const previousConversationIdRef = useRef<string | null>(null);

  const previousMessageCountRef = useRef<number>(0);

  const shouldRestoreScrollRef = useRef(false);

  // ============================================================
  // RESET SCROLL WHEN CHANGING CONVERSATION
  // ============================================================

  useEffect(() => {
    if (previousConversationIdRef.current !== selectedConversationId) {
      previousConversationIdRef.current = selectedConversationId;

      previousMessageCountRef.current = 0;

      shouldRestoreScrollRef.current = false;

      requestAnimationFrame(() => {
        const element = messagesContainerRef.current;

        if (!element) {
          return;
        }

        element.scrollTop = element.scrollHeight;
      });
    }
  }, [selectedConversationId]);

  // ============================================================
  // RESTORE SCROLL POSITION AFTER OLDER MESSAGES LOAD
  // ============================================================

  useEffect(() => {
    const element = messagesContainerRef.current;

    if (!element) {
      return;
    }

    const currentMessageCount = activeThread?.messages.length || 0;

    const previousMessageCount = previousMessageCountRef.current;

    if (
      shouldRestoreScrollRef.current &&
      currentMessageCount > previousMessageCount
    ) {
      requestAnimationFrame(() => {
        const currentElement = messagesContainerRef.current;

        if (!currentElement) {
          return;
        }

        // The newly inserted older messages increase
        // scrollHeight. Preserve the user's visual position.
        const previousScrollHeight = Number(
          currentElement.dataset.previousScrollHeight ?? 0,
        );
        const heightDifference =
          currentElement.scrollHeight - previousScrollHeight;

        if (heightDifference > 0) {
          currentElement.scrollTop += heightDifference;
        }

        shouldRestoreScrollRef.current = false;
      });
    }

    previousMessageCountRef.current = currentMessageCount;
  }, [activeThread?.messages.length]);

  // ============================================================
  // LOAD OLDER
  // ============================================================

  const handleLoadOlder = () => {
    const element = messagesContainerRef.current;

    if (!element) {
      return;
    }

    if (!hasOlderMessages) {
      return;
    }

    if (isLoadingOlderMessages) {
      return;
    }

    if (!onLoadOlderMessages) {
      return;
    }

    // Save current scroll height so we can preserve
    // the visible position after older messages are added.
    element.dataset.previousScrollHeight = String(element.scrollHeight);

    shouldRestoreScrollRef.current = true;

    onLoadOlderMessages();
  };

  // ============================================================
  // SCROLL HANDLER
  // ============================================================

  const handleMessagesScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;

    if (
      element.scrollTop <= 100 &&
      hasOlderMessages &&
      !isLoadingOlderMessages
    ) {
      handleLoadOlder();
    }
  };

  // ============================================================
  // KEYBOARD SEND
  // ============================================================

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (replyContent.trim() && !isSendingReply) {
        // If a message is selected, use it.
        //
        // If no message is selected, undefined is passed
        // and page.tsx automatically uses the latest message.
        onSendReply(selectedReplyMessage?.id);
      }
    }
  };

  // ============================================================
  // SELECT MESSAGE
  // ============================================================

  const handleSelectMessage = (message: ConversationMessage) => {
    onSelectReplyMessage(message);

    setReplyContent("");
  };

  // ============================================================
  // NO CONVERSATION SELECTED
  // ============================================================

  return (
    <section
      className={`h-full min-h-0 w-full min-w-0 flex flex-col bg-[#F7FAFF] ${
        !selectedConversationId ? "hidden" : "flex"
      }`}
      style={{
        height: "100%",
        minHeight: 0,
      }}
    >
      {!activeThread ? (
        <div className="flex h-full flex-1 flex-col items-center justify-center bg-[#F7FAFF] px-6 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <MessageCircle
              size={38}
              strokeWidth={1.4}
              className="text-[#BFD6FF]"
            />
          </div>

          <h3 className="font-semibold text-[#17305F]">Your messages</h3>

          <p className="mt-1 max-w-xs text-xs leading-5 text-[#7B89A4]">
            Select a conversation to view messages and respond to your audience.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================================
              HEADER
          ======================================================== */}

          <header className="z-20 flex h-[64px] shrink-0 items-center gap-3 border-b border-[#D9E6FF] bg-white/95 px-3 shadow-[0_1px_10px_rgba(11,59,145,0.06)] backdrop-blur-md md:px-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#60708E] transition hover:bg-[#EEF4FF] active:scale-95"
              aria-label="Back"
            >
              <ChevronLeft size={21} />
            </button>

            <div className="relative shrink-0">
              {activeThread.avatarUrl ? (
                <img
                  src={activeThread.avatarUrl}
                  alt={activeThread.senderName}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-[#BFD6FF]"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 bg-[#0B3B91] text-xs font-bold text-white">
                  {getInitials(activeThread.senderName)}
                </div>
              )}

              {activeThread.hasPending && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#0B3B91]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-bold text-slate-900">
                {activeThread.senderName}
              </h2>

              <p className="truncate text-[11px] text-[#7B89A4]">
                {activeThread.hasPending
                  ? "Messages waiting for reply"
                  : "You can reply anytime"}
              </p>
            </div>

            {activeThread.totalBounty > 0 && (
              <div className="hidden items-center gap-1 rounded-full bg-[#EEF4FF] px-2.5 py-1 sm:flex">
                <span className="text-[11px] font-bold text-[#0B3B91]">
                  ${activeThread.totalBounty}
                </span>
              </div>
            )}

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#7B89A4] transition hover:bg-[#EEF4FF] hover:text-[#0B3B91]"
            >
              <MoreVertical size={19} />
            </button>
          </header>

          {/* ========================================================
              MESSAGES
          ======================================================== */}

          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#F7FAFF] px-3 py-4 sm:px-5 md:px-6"
            onScroll={handleMessagesScroll}
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {/* ==================================================
                  OLDER MESSAGE LOADER
              ================================================== */}

              {isLoadingOlderMessages && (
                <div className="flex justify-center py-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
                </div>
              )}

              {/* ==================================================
                  INITIAL LOADER
              ================================================== */}

              {isLoadingMessages ? (
                <div className="flex flex-col gap-4 py-8">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className={`flex ${
                        item % 2 === 0 ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="h-14 w-48 animate-pulse rounded-2xl bg-white" />
                    </div>
                  ))}
                </div>
              ) : activeThread.messages.length === 0 ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                    <MessageCircle size={25} className="text-[#BFD6FF]" />
                  </div>

                  <p className="text-sm font-medium text-[#60708E]">
                    No messages yet
                  </p>
                </div>
              ) : (
                activeThread.messages.map((msg, index) => {
                  const previousMessage = activeThread.messages[index - 1];

                  const showDate =
                    !previousMessage ||
                    new Date(previousMessage.createdAt).toDateString() !==
                      new Date(msg.createdAt).toDateString();

                  const isSelected = selectedReplyMessage?.id === msg.id;

                  const messageKey = `${msg.id}-${msg.createdAt}-${index}`;

                  return (
                    <div key={messageKey}>
                      {/* ==================================================
                            DATE
                        ================================================== */}

                      {showDate && (
                        <div className="my-3 flex justify-center">
                          <span className="rounded-full border border-[#D9E6FF] bg-white px-3 py-1 text-[10px] font-semibold text-[#7B89A4] shadow-sm">
                            {formatDay(msg.createdAt)}
                          </span>
                        </div>
                      )}

                      {/* ==================================================
                            USER MESSAGE
                        ================================================== */}

                      <div className="flex justify-start">
                        <div className="w-full max-w-[80%] min-w-0 sm:max-w-[80%]">
                          <button
                            type="button"
                            onClick={() => handleSelectMessage(msg)}
                            className={`group relative  text-left transition-all ${
                              isSelected
                                ? "rounded-2xl ring-2 ring-blue-500 ring-offset-white"
                                : ""
                            }`}
                          >
                            <div
                              className={`min-w-30 max-w-full rounded-[12px] border px-3 py-2 shadow-[0_3px_12px_rgba(11,59,145,0.05)] transition ${
                                isSelected
                                  ? "border-[#7FAAF5] bg-[#EEF4FF]"
                                  : "border-[#D9E6FF] bg-white hover:border-[#BFD6FF] hover:bg-[#F7FAFF]"
                              }`}
                            >
                              <p className="min-w-0 max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] text-[14px] leading-[1.5] text-[#17305F]">
                                {msg.content}
                              </p>

                              {/* Bottom metadata */}
                              <div className="mt-1 flex items-center justify-between">
                                {/* Time - left */}
                                <span className="text-[10px] text-[#8693AA]">
                                  {formatMessageTime(msg.createdAt)}
                                </span>

                                {/* Status + price - right */}
                                <div className="flex items-center gap-1.5">
                                  {msg.status === "AWAITING_REPLY" && (
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0B3B91]">
                                      ${msg.payment?.amount}
                                      <Clock3 size={12} strokeWidth={2} />
                                    </span>
                                  )}

                                  {msg.status === "PENDING_PAYMENT" && (
                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[#B47B00]">
                                      ${msg.payment?.amount}
                                      <Clock3 size={12} strokeWidth={2} />
                                    </span>
                                  )}

                                  {msg.status === "REPLIED" && (
                                    <CheckCheck
                                      size={14}
                                      strokeWidth={2.5}
                                      className="text-[#0B3B91]"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reply hint */}

                            <div
                              className={`absolute -right-2 -top-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0B3B91] shadow-sm transition ${
                                isSelected
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              <Reply size={14} />
                            </div>
                          </button>

                          {/* ==================================================
                                MESSAGE METADATA
                            ================================================== */}

                          {/* <div className="mt-1.5 flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-[#8693AA]">
                              {formatMessageTime(msg.createdAt)}
                            </span>

                            {msg.status === "AWAITING_REPLY" && (
                              <span className="flex items-center gap-1 text-[9px] font-semibold text-[#0B3B91]">
                                <DollarSign size={10} />${msg.payment?.amount}
                              </span>
                            )}

                            {msg.status === "PENDING_PAYMENT" && (
                              <span className="flex items-center gap-1 text-[9px] font-semibold text-[#B47B00]">
                                <Clock3 size={10} />
                                Payment pending
                              </span>
                            )}

                            {msg.status === "REPLIED" && (
                              <span className="text-[9px] font-medium text-[#8693AA]">
                                Replied
                              </span>
                            )}
                          </div> */}

                          {/* ==================================================
                                WAITING FOR REPLY
                            ================================================== */}

                          {/* {msg.status === "AWAITING_REPLY" && (
                            <div className="mt-1.5 ml-1 flex items-center gap-1 text-[10px] font-medium text-[#0B3B91]">
                              <Clock3 size={11} />
                              Paid · waiting for your reply
                            </div>
                          )} */}

                          {/* ==================================================
                                SELECTED
                            ================================================== */}

                          {isSelected && (
                            <div className="mt-1.5 ml-1 flex items-center gap-1 text-[10px] font-semibold text-[#0B3B91]">
                              <Reply size={11} />
                              Replying to this message
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ==================================================
                            CREATOR REPLY
                        ================================================== */}

                      {msg.status === "REPLIED" && msg.replyContent && (
                        <div className="mt-3 flex justify-end">
                          <div className="  max-w-[80%] min-w-0 sm:max-w-[80%]">
                            <div className="min-w-30 max-w-full rounded-[14px] bg-[#0B3B91] px-3 py-2 shadow-[0_4px_14px_rgba(11,59,145,0.10)]">
                              <p className="min-w-0 max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] text-[14px] leading-[1.5] text-white">
                                {msg.replyContent}
                              </p>

                              {/* Bottom metadata */}
                              <div className="mt-1 flex items-center justify-between">
                                {/* Time - left */}
                                <span className="text-[10px] text-[#D7E5FF]">
                                  {formatMessageTime(msg.createdAt)}
                                </span>

                                {/* Replied tick - right */}
                                <CheckCheck
                                  size={14}
                                  strokeWidth={2.5}
                                  className="text-[#D7E5FF]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================
              COMPOSER
          ======================================================== */}

          <div className="shrink-0 border-t border-[#D9E6FF] bg-white p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:p-3">
            <div className="mx-auto max-w-3xl">
              {/* ==================================================
                  SELECTED MESSAGE PREVIEW
              ================================================== */}

              {selectedReplyMessage && (
                <div className="mb-2 flex items-center gap-2 rounded-2xl border border-[#D9E6FF] bg-[#EEF4FF] px-3 py-2">
                  <Reply size={14} className="shrink-0 text-[#0B3B91]" />

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-[#0B3B91]">
                      Replying to
                    </p>

                    <p className="truncate text-[11px] text-[#52627F]">
                      {selectedReplyMessage.content}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReplyContent("");

                      onSelectReplyMessage(undefined);
                    }}
                    className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold text-[#60708E] hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* ==================================================
                  COMPOSER
              ================================================== */}

              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1 rounded-[20px] border border-[#D9E6FF] bg-[#F7FAFF] transition focus-within:border-[#9DBEF5] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#0B3B91]/10">
                  <textarea
                    value={replyContent}
                    onChange={(event) => setReplyContent(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={
                      selectedReplyMessage
                        ? "Type a reply..."
                        : "Type a reply..."
                    }
                    className="max-h-28 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-base leading-5 text-[#17305F] outline-none placeholder:text-[#8693AA]"
                    style={{ fontSize: "16px" }}
                  />

                  <div className="hidden px-4 pb-2 sm:block">
                    <span className="text-[10px] text-[#8693AA]">
                      Press Enter to send · Shift + Enter for a new line
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSendReply(selectedReplyMessage?.id)}
                  disabled={isSendingReply || !replyContent.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B3B91] text-white shadow-[0_6px_16px_rgba(11,59,145,0.20)] transition-all hover:bg-[#082E70] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send reply"
                >
                  {isSendingReply ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Send size={18} className="-ml-0.5" />
                  )}
                </button>
              </div>

              {/* ==================================================
                  HELPER TEXT
              ================================================== */}

              {!selectedReplyMessage && (
                <p className="mt-1.5 text-center text-[10px] text-[#8693AA]">
                  Your reply will be attached to the latest user message.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
