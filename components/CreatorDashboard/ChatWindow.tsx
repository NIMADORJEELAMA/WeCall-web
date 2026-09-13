"use client";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock3,
  DollarSign,
  MessageCircle,
  MoreVertical,
  Send,
} from "lucide-react";
interface ReceivedMessage {
  id: string;
  content: string;
  replyContent?: string;
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
interface ChatWindowProps {
  activeThread: ConversationThread | undefined;
  activePendingMessage: ReceivedMessage | undefined;
  selectedSenderId: string | null;
  replyContent: string;
  setReplyContent: (value: string) => void;
  onSendReply: () => void;
  isSendingReply: boolean;
  onBack: () => void;
}
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
  if (isToday) return "Today";
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
export function ChatWindow({
  activeThread,
  activePendingMessage,
  selectedSenderId,
  replyContent,
  setReplyContent,
  onSendReply,
  isSendingReply,
  onBack,
}: ChatWindowProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (replyContent.trim() && !isSendingReply) {
        onSendReply();
      }
    }
  };
  return (
    <section
      className={` md:col-span-7 min-w-0 flex flex-col bg-[#efeae2] ${!selectedSenderId ? "hidden md:flex" : "flex"} `}
      style={{ height: "100dvh", maxHeight: "100%" }}
    >
      {" "}
      {!activeThread ? (
        <div className="hidden h-full flex-1 flex-col items-center justify-center bg-slate-50 text-center md:flex">
          {" "}
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            {" "}
            <MessageCircle
              size={38}
              strokeWidth={1.4}
              className="text-slate-300"
            />{" "}
          </div>{" "}
          <h3 className="font-semibold text-slate-700"> Your messages </h3>{" "}
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
            {" "}
            Select a conversation to view messages and respond to your
            audience.{" "}
          </p>{" "}
        </div>
      ) : (
        <>
          {" "}
          {/* Header */}{" "}
          <header className="z-20 flex h-[64px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur-md md:px-4">
            {" "}
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 active:scale-95 md:hidden"
              aria-label="Back"
            >
              {" "}
              <ArrowLeft size={21} />{" "}
            </button>{" "}
            <div className="relative shrink-0">
              {" "}
              {activeThread.avatarUrl ? (
                <img
                  src={activeThread.avatarUrl}
                  alt={activeThread.senderName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white">
                  {" "}
                  {getInitials(activeThread.senderName)}{" "}
                </div>
              )}{" "}
              {activeThread.hasPending && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500" />
              )}{" "}
            </div>{" "}
            <div className="min-w-0 flex-1">
              {" "}
              <h2 className="truncate text-[15px] font-bold text-slate-900">
                {" "}
                {activeThread.senderName}{" "}
              </h2>{" "}
              <p className="truncate text-[11px] text-slate-400">
                {" "}
                {activeThread.hasPending
                  ? "Waiting for your reply"
                  : "Conversation"}{" "}
              </p>{" "}
            </div>{" "}
            <div className="hidden items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 sm:flex">
              {" "}
              <DollarSign size={12} className="text-blue-600" />{" "}
              <span className="text-[11px] font-bold text-blue-600">
                {" "}
                ${activeThread.totalBounty}{" "}
              </span>{" "}
            </div>{" "}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              {" "}
              <MoreVertical size={19} />{" "}
            </button>{" "}
          </header>{" "}
          {/* Messages */}{" "}
          <div className=" min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 md:px-6 overscroll-contain ">
            {" "}
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {" "}
              {activeThread.messages.map((msg, index) => {
                const previousMessage = activeThread.messages[index - 1];
                const showDate =
                  !previousMessage ||
                  new Date(previousMessage.createdAt).toDateString() !==
                    new Date(msg.createdAt).toDateString();
                return (
                  <div key={msg.id}>
                    {" "}
                    {showDate && (
                      <div className="my-3 flex justify-center">
                        {" "}
                        <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                          {" "}
                          {formatDay(msg.createdAt)}{" "}
                        </span>{" "}
                      </div>
                    )}{" "}
                    {/* Incoming message */}{" "}
                    <div className="flex justify-start">
                      {" "}
                      <div className="max-w-[88%] sm:max-w-[75%]">
                        {" "}
                        <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                          {" "}
                          <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.45] text-slate-800">
                            {" "}
                            {msg.content}{" "}
                          </p>{" "}
                        </div>{" "}
                        <div className="mt-1.5 flex items-center justify-end gap-1.5">
                          {" "}
                          <span className="text-[10px] text-slate-400">
                            {" "}
                            {formatMessageTime(msg.createdAt)}{" "}
                          </span>{" "}
                          {msg.status === "AWAITING_REPLY" && (
                            <span className="flex items-center gap-1 text-[9px] font-semibold text-blue-600">
                              {" "}
                              <DollarSign size={10} /> $
                              {msg.payment?.amount}{" "}
                            </span>
                          )}{" "}
                          {msg.status === "PENDING_PAYMENT" && (
                            <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-600">
                              {" "}
                              <Clock3 size={10} /> Payment pending{" "}
                            </span>
                          )}{" "}
                        </div>{" "}
                        {/* Pending payment/reply indicator */}{" "}
                        {msg.status === "AWAITING_REPLY" && (
                          <div className="mt-1.5 ml-1 flex items-center gap-1 text-[10px] font-medium text-blue-600">
                            {" "}
                            <Clock3 size={11} /> Paid · waiting for your
                            reply{" "}
                          </div>
                        )}{" "}
                      </div>{" "}
                    </div>{" "}
                    {/* Creator reply */}{" "}
                    {msg.status === "REPLIED" && msg.replyContent && (
                      <div className="mt-3 flex justify-end">
                        {" "}
                        <div className="max-w-[88%] sm:max-w-[75%]">
                          {" "}
                          <div className="rounded-2xl rounded-tr-md bg-[#155DFC] px-3.5 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
                            {" "}
                            <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.45] text-white">
                              {" "}
                              {msg.replyContent}{" "}
                            </p>{" "}
                          </div>{" "}
                          <div className="mt-1.5 flex items-center justify-end gap-1">
                            {" "}
                            <span className="text-[10px] text-slate-80">
                              {" "}
                              {formatMessageTime(msg.createdAt)}{" "}
                            </span>{" "}
                            <CheckCheck
                              size={14}
                              className="text-blue-900"
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>
                    )}{" "}
                  </div>
                );
              })}{" "}
            </div>{" "}
          </div>{" "}
          {/* Composer */}{" "}
          <div className="shrink-0 border-t border-slate-200 bg-white p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:p-3">
            {" "}
            {activePendingMessage ? (
              <div className="mx-auto flex max-w-3xl items-end gap-2">
                {" "}
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                  {" "}
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Type a reply..."
                    className=" max-h-28 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-[14px] leading-5 text-slate-800 outline-none placeholder:text-slate-400 "
                  />{" "}
                  <div className="hidden px-4 pb-2 sm:block">
                    {" "}
                    <span className="text-[10px] text-slate-400">
                      {" "}
                      Press Enter to send · Shift + Enter for a new line{" "}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                <button
                  type="button"
                  onClick={onSendReply}
                  disabled={isSendingReply || !replyContent.trim()}
                  className=" flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 "
                  aria-label="Send reply"
                >
                  {" "}
                  {isSendingReply ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Send size={18} className="-ml-0.5" />
                  )}{" "}
                </button>{" "}
              </div>
            ) : activeThread.messages.some(
                (message) => message.status === "PENDING_PAYMENT",
              ) ? (
              <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-center">
                {" "}
                <Clock3 size={15} className="shrink-0 text-amber-600" />{" "}
                <p className="text-[11px] font-medium text-amber-700">
                  {" "}
                  Waiting for payment confirmation{" "}
                </p>{" "}
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
                {" "}
                <Check size={14} className="text-slate-400" />{" "}
                <p className="text-[11px] text-slate-400">
                  {" "}
                  All messages have been answered{" "}
                </p>{" "}
              </div>
            )}{" "}
          </div>{" "}
        </>
      )}{" "}
    </section>
  );
}
