"use client";

import { Check, CheckCheck, Clock } from "lucide-react";

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "delivered" | "read";
}

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`group max-w-[82%] sm:max-w-[70%] ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`relative rounded-2xl px-3.5 py-2.5 text-sm leading-5 shadow-sm ${
            isMine
              ? "rounded-br-md bg-indigo-600 text-white"
              : "rounded-bl-md border border-slate-200/70 bg-white text-slate-800"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
              isMine ? "text-indigo-100" : "text-slate-400"
            }`}
          >
            <span>{time}</span>

            {isMine && (
              <>
                {message.status === "sending" && <Clock size={11} />}

                {message.status === "sent" && <Check size={12} />}

                {(message.status === "delivered" ||
                  message.status === "read") && (
                  <CheckCheck
                    size={13}
                    className={message.status === "read" ? "text-cyan-200" : ""}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
