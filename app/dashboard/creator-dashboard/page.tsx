// app/creator-dashboard/page.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { ConversationList } from "@/components/CreatorDashboard/ConversationList";
import { ChatWindow } from "@/components/CreatorDashboard/ChatWindow";
import { BottomNav } from "@/components/CreatorDashboard/BottomNav";
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
  conversationId: string | null; // ADD THIS
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
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [replyContent, setReplyContent] = useState("");
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<"messages" | "profile">(
    "messages",
  );

  const handleRealtimeRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["creator-messages"] });
  }, [queryClient]);

  useSocketEvent("newMessage", handleRealtimeRefresh);
  useSocketEvent("paymentSucceeded", handleRealtimeRefresh);
  useSocketEvent("messageReplied", handleRealtimeRefresh);
  useSocketEvent("conversationUpdated", handleRealtimeRefresh);

  const { data: messages = [], isLoading } = useQuery<ReceivedMessage[]>({
    queryKey: ["creator-messages"],
    queryFn: async () => {
      const res = await api.get("/messages/incoming");
      return res.data;
    },
  });

  const conversations = useMemo(() => {
    const map = new Map<string, ConversationThread>();

    messages.forEach((msg) => {
      const senderId = msg.sender?.id;

      if (!senderId) {
        console.warn("Message missing sender ID:", msg);
        return;
      }

      // Creator is already fixed by /messages/incoming.
      // Therefore senderId uniquely identifies this creator's conversation.
      // const conversationId = senderId;

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

    map.forEach((thread) => {
      thread.messages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestTimestamp).getTime() -
        new Date(a.latestTimestamp).getTime(),
    );
  }, [messages]);
  const activeThread = conversations.find(
    (c) => c.conversationId === selectedConversationId,
  );

  const activePendingMessage = activeThread?.messages
    .filter((m) => m.status === "AWAITING_REPLY")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

  const replyMutation = useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      const res = await api.post(`/messages/${messageId}/reply`, { content });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Reply sent! Payment captured.");
      setReplyContent("");
      queryClient.invalidateQueries({ queryKey: ["creator-messages"] });
    },
    onError: () => {
      toast.error("Failed to send reply. Please try again.");
    },
  });

  const handleSendReply = () => {
    if (!replyContent.trim()) return toast.error("Reply cannot be empty");
    if (!activePendingMessage)
      return toast.error("No pending message to reply to");

    replyMutation.mutate({
      messageId: activePendingMessage.id,
      content: replyContent,
    });
  };

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      socket?.emit(
        "joinConversation",
        { conversationId },
        (response: unknown) => {
          console.log("joinConversation:", response);
        },
      );
    },
    [socket],
  );

  const handleLeaveConversation = useCallback(() => {
    if (!selectedConversationId) return;

    socket?.emit("leaveConversation", {
      conversationId: selectedConversationId,
    });

    setSelectedConversationId(null);
  }, [socket, selectedConversationId]);

  const hasUnreadMessages = conversations.some((c) => c.hasPending);

  return (
    <div className="max-w-6xl mx-auto  md:p-8  font-sans text-slate-800">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden grid grid-cols-1 md:grid-cols-12  relative">
        {activeTab === "profile" ? (
          <ProfileView />
        ) : (
          <>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              isLoading={isLoading}
            />
            <ChatWindow
              activeThread={activeThread}
              activePendingMessage={activePendingMessage}
              selectedConversationId={selectedConversationId}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onSendReply={handleSendReply}
              isSendingReply={replyMutation.isPending}
              onBack={() => setSelectedConversationId(null)}
            />
          </>
        )}

        {/* Bottom Navigation Component for Mobile Views */}
        {/* <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "profile") {
              setSelectedSenderId(null);
            }
          }}
          hasUnread={hasUnreadMessages}
        /> */}
      </div>
    </div>
  );
}
