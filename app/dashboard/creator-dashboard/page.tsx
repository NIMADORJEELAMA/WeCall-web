"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

import { ConversationList } from "@/components/CreatorDashboard/ConversationList";
import { ChatWindow } from "@/components/CreatorDashboard/ChatWindow";
import { ProfileView } from "@/components/CreatorDashboard/ProfileView";
import { useSocket } from "@/components/providers/SocketProvider";
import { useSocketEvent } from "@/hooks/useSocketEvent";

interface Sender {
  id?: string;
  name: string;
  avatarUrl?: string | null;
}

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
  expiresAt: string;
  conversationId: string | null;

  sender: Sender;

  payment: {
    amount: number;
  };
}

interface ConversationThread {
  conversationId: string;
  senderId: string;
  creatorId: string;

  senderName: string;
  avatarUrl?: string | null;

  messages: ReceivedMessage[];

  hasPending: boolean;
  latestTimestamp: string;
  totalBounty: number;
}

export default function CreatorDashboard() {
  const queryClient = useQueryClient();

  const { socket } = useSocket();

  // ============================================================
  // STATE
  // ============================================================

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  /**

* The exact USER message the creator selected.
*
* This is what allows the creator to reply to ANY message,
* not only the latest pending message.
  */
  const [selectedReplyMessage, setSelectedReplyMessage] = useState<
    ReceivedMessage | undefined
  >(undefined);

  const [replyContent, setReplyContent] = useState("");

  const [activeTab, setActiveTab] = useState<"messages" | "profile">(
    "messages",
  );

  // ============================================================
  // REAL-TIME REFRESH
  // ============================================================

  const handleRealtimeRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["creator-messages"],
    });
  }, [queryClient]);

  useSocketEvent("newMessage", handleRealtimeRefresh);
  useSocketEvent("paymentSucceeded", handleRealtimeRefresh);
  useSocketEvent("messageReplied", handleRealtimeRefresh);
  useSocketEvent("conversationUpdated", handleRealtimeRefresh);

  // ============================================================
  // FETCH CREATOR MESSAGES
  // ============================================================

  const { data: messages = [], isLoading } = useQuery<ReceivedMessage[]>({
    queryKey: ["creator-messages"],

    queryFn: async () => {
      const res = await api.get("/messages/incoming");
      return res.data;
    },
  });

  // ============================================================
  // BUILD CONVERSATIONS
  // ============================================================

  const conversations = useMemo(() => {
    const map = new Map<string, ConversationThread>();

    messages.forEach((msg) => {
      const senderId = msg.sender?.id;

      if (!senderId) {
        console.warn("Message missing sender ID:", msg);
        return;
      }

      /**
       * IMPORTANT:
       *
       * Conversation identity is conversationId.
       * Do NOT use senderId as conversationId.
       */
      const conversationId = msg.conversationId;

      if (!conversationId) {
        console.warn("Missing conversation ID:", msg.id);
        return;
      }

      if (!map.has(conversationId)) {
        map.set(conversationId, {
          conversationId,

          senderId,

          creatorId: "",

          senderName: msg.sender.name,

          avatarUrl: msg.sender.avatarUrl,

          messages: [],

          hasPending: false,

          latestTimestamp: msg.createdAt,

          totalBounty: 0,
        });
      }

      const thread = map.get(conversationId)!;

      thread.messages.push(msg);

      thread.totalBounty += Number(msg.payment?.amount || 0);

      /**
       * hasPending is only for showing the
       * waiting indicator in the conversation list.
       *
       * It does NOT control whether the creator
       * is allowed to reply.
       */
      if (msg.status === "AWAITING_REPLY") {
        thread.hasPending = true;
      }

      if (
        new Date(msg.createdAt).getTime() >
        new Date(thread.latestTimestamp).getTime()
      ) {
        thread.latestTimestamp = msg.createdAt;
      }
    });

    // Sort messages oldest -> newest
    map.forEach((thread) => {
      thread.messages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    // Sort conversations newest -> oldest
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestTimestamp).getTime() -
        new Date(a.latestTimestamp).getTime(),
    );
  }, [messages]);

  // ============================================================
  // ACTIVE CONVERSATION
  // ============================================================

  const activeThread = conversations.find(
    (conversation) => conversation.conversationId === selectedConversationId,
  );

  // ============================================================
  // SEND REPLY
  // ============================================================

  const replyMutation = useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      /**
       * IMPORTANT:
       *
       * The messageId determines EXACTLY which
       * user message the creator is replying to.
       */
      const res = await api.post(`/messages/${messageId}/reply`, {
        content,
      });

      return res.data;
    },

    onSuccess: () => {
      toast.success("Reply sent!");

      setReplyContent("");

      /**
       * Clear selected message after sending.
       *
       * Creator can now select ANY other message.
       */
      setSelectedReplyMessage(undefined);

      queryClient.invalidateQueries({
        queryKey: ["creator-messages"],
      });
    },

    onError: (error: any) => {
      console.error("Failed to send creator reply:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to send reply. Please try again.",
      );
    },
  });

  // ============================================================
  // HANDLE SEND REPLY
  // ============================================================

  const handleSendReply = useCallback(
    (messageId: string) => {
      const content = replyContent.trim();

      if (!content) return;

      if (replyMutation.isPending) return;

      replyMutation.mutate({
        messageId,
        content,
      });
    },
    [replyContent, replyMutation],
  );

  // ============================================================
  // SELECT CONVERSATION
  // ============================================================

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);

      /**
       * Very important:
       *
       * When switching users/conversations,
       * don't keep the previously selected
       * message.
       */
      setSelectedReplyMessage(undefined);

      setReplyContent("");

      socket?.emit("joinConversation", {
        conversationId,
      });
    },
    [socket],
  );

  // ============================================================
  // LEAVE CONVERSATION
  // ============================================================

  const handleLeaveConversation = useCallback(() => {
    if (!selectedConversationId) return;

    socket?.emit("leaveConversation", {
      conversationId: selectedConversationId,
    });

    setSelectedConversationId(null);

    setSelectedReplyMessage(undefined);

    setReplyContent("");
  }, [socket, selectedConversationId]);

  // ============================================================
  // SELECT MESSAGE TO REPLY TO
  // ============================================================

  const handleSelectReplyMessage = useCallback(
    (message: ReceivedMessage | undefined) => {
      setSelectedReplyMessage(message);

      /**
       * Clear old draft when selecting
       * another message.
       */
      setReplyContent("");
    },
    [],
  );

  // ============================================================
  // UNREAD
  // ============================================================

  const hasUnreadMessages = conversations.some(
    (conversation) => conversation.hasPending,
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-6xl font-sans text-slate-800 md:p-8">
      {" "}
      <div className="relative grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl md:grid-cols-12">
        {activeTab === "profile" ? (
          <ProfileView />
        ) : (
          <>
            {/* ========================================================
CONVERSATION LIST
======================================================== */}

            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              isLoading={isLoading}
            />

            {/* ========================================================
            CHAT WINDOW
        ======================================================== */}

            <ChatWindow
              activeThread={activeThread}
              selectedConversationId={selectedConversationId}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              selectedReplyMessage={selectedReplyMessage}
              onSelectReplyMessage={handleSelectReplyMessage}
              onSendReply={handleSendReply}
              isSendingReply={replyMutation.isPending}
              onBack={handleLeaveConversation}
            />
          </>
        )}

        {/* ============================================================
        BOTTOM NAV
    ============================================================ */}

        {/*
    <BottomNav
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);

        if (tab === "profile") {
          setSelectedConversationId(null);
          setSelectedReplyMessage(undefined);
          setReplyContent("");
        }
      }}
      hasUnread={hasUnreadMessages}
    />
    */}
      </div>
    </div>
  );
}
