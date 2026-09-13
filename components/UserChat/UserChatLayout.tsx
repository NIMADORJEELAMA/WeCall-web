"use client";

import { useState } from "react";
import { ChatList, ChatListConversation } from "./ChatList";
import { ChatScreen } from "./ChatScreen";
import { ChatMessage } from "./MessageBubble";

interface UserChatLayoutProps {
  conversations: ChatListConversation[];

  activeConversation: ChatListConversation | null;

  messages: ChatMessage[];

  currentUserId: string;

  searchQuery: string;
  onSearchChange: (value: string) => void;

  onSelectConversation: (conversation: ChatListConversation) => void;

  messageValue: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;

  loadingConversations?: boolean;
  loadingMessages?: boolean;
  sendingMessage?: boolean;
}

export function UserChatLayout({
  conversations,
  activeConversation,
  messages,
  currentUserId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  messageValue,
  onMessageChange,
  onSendMessage,
  loadingConversations = false,
  loadingMessages = false,
  sendingMessage = false,
}: UserChatLayoutProps) {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const handleSelect = (conversation: ChatListConversation) => {
    onSelectConversation(conversation);
    setMobileChatOpen(true);
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-white">
      {/* Chat list */}
      <div
        className={`h-full w-full shrink-0 md:flex md:w-[360px] ${
          mobileChatOpen ? "hidden" : "flex"
        }`}
      >
        <ChatList
          conversations={conversations}
          selectedConversationId={activeConversation?.id}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSelect={handleSelect}
          loading={loadingConversations}
        />
      </div>

      {/* Chat */}
      <div
        className={`h-full min-w-0 flex-1 ${
          mobileChatOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {activeConversation ? (
          <ChatScreen
            creator={activeConversation.creator}
            messages={messages}
            currentUserId={currentUserId}
            value={messageValue}
            onChange={onMessageChange}
            onSend={onSendMessage}
            loading={loadingMessages}
            sending={sendingMessage}
            onBack={() => setMobileChatOpen(false)}
          />
        ) : (
          <div className="hidden h-full flex-1 flex-col items-center justify-center bg-[#f8f9fc] text-center md:flex">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200/70">
              <ChatMessageIcon />
            </div>

            <h2 className="text-lg font-bold text-slate-900">Your messages</h2>

            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Select a conversation to continue chatting with your favorite
              creators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessageIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="text-indigo-500"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.2 9.2 0 0 1-3.8-.8L3 21l1.8-4.8A8.4 8.4 0 1 1 21 11.5Z" />
    </svg>
  );
}
