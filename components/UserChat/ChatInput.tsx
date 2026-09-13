"use client";

import { Image as ImageIcon, Mic, Paperclip, Send, Smile } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-slate-200/70 bg-white px-3 py-3 sm:px-5">
      <div
        className={`flex items-end gap-2 rounded-2xl border bg-slate-50 px-2 py-2 transition ${
          focused
            ? "border-indigo-200 bg-white ring-4 ring-indigo-500/5"
            : "border-slate-200"
        }`}
      >
        <button
          className="mb-0.5 hidden rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:block"
          aria-label="Attachment"
        >
          <Paperclip size={19} />
        </button>

        <button
          className="mb-0.5 hidden rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:block"
          aria-label="Image"
        >
          <ImageIcon size={19} />
        </button>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className="max-h-28 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
        />

        <button
          className="mb-0.5 hidden rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:block"
          aria-label="Emoji"
        >
          <Smile size={19} />
        </button>

        {value.trim() ? (
          <button
            onClick={onSend}
            disabled={disabled}
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        ) : (
          <button
            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 sm:hidden"
            aria-label="Voice message"
          >
            <Mic size={18} />
          </button>
        )}
      </div>

      <p className="mt-1.5 hidden text-center text-[10px] text-slate-300 sm:block">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
