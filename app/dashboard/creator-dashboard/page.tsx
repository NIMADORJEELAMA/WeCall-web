"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

import { ConversationList } from "@/components/CreatorDashboard/ConversationList";
import { ChatWindow } from "@/components/CreatorDashboard/ChatWindow";
import { ProfileView } from "@/components/CreatorDashboard/ProfileView";
import { useSocket } from "@/components/providers/SocketProvider";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import type {
  ConversationMessage,
  ConversationThread,
  MessageStatus,
  Participant,
} from "@/types/conversation";
// ============================================================
// TYPES
// ============================================================

interface ConversationSummary {
  id: string;
  conversationId: string;

  participant: Participant;

  latestMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;

  updatedAt: string;

  role: "USER" | "CREATOR";
}

type PaidMessage = ConversationMessage;

interface ChatMessage {
  id: string;

  conversationId: string;

  senderId: string;

  content: string;

  createdAt: string;

  paidMessageId?: string | null;

  replyToMessageId?: string | null;

  replyToMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;

  sender?: Participant;
}

interface ConversationMessagesResponse {
  conversationId: string;
  userId: string;
  creatorId: string;

  messages: ChatMessage[];

  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

// ============================================================
// HELPERS
// ============================================================

function mergeUniqueMessages(messages: ChatMessage[]) {
  const map = new Map<string, ChatMessage>();

  for (const message of messages) {
    map.set(message.id, message);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

// Convert ChatMessage records into the shape expected by the
// existing ChatWindow component.
//
// IMPORTANT:
// paidMessageId must be returned by the backend for the original
// paid user message. Otherwise /messages/:id/reply cannot know
// which paid Message should be replied to.
function buildDisplayMessages(
  chatMessages: ChatMessage[],
  paidMessages: PaidMessage[],
  participant: Participant,
): PaidMessage[] {
  const paidById = new Map<string, PaidMessage>();

  for (const message of paidMessages) {
    paidById.set(message.id, message);
  }

  const repliesByOriginalChatMessageId = new Map<string, ChatMessage>();

  for (const message of chatMessages) {
    if (message.replyToMessageId) {
      repliesByOriginalChatMessageId.set(message.replyToMessageId, message);
    }
  }

  return chatMessages
    .filter((message) => {
      // Creator replies are rendered underneath their original
      // user message by ChatWindow.
      return message.senderId !== message.conversationId;
    })
    .filter((message) => {
      // We only want the original USER messages here.
      //
      // The actual creator/user IDs are handled below using
      // paidMessageId. Messages without a paidMessageId may be
      // regular chat messages.
      return !!message.paidMessageId;
    })
    .map((message) => {
      const paidMessage = message.paidMessageId
        ? paidById.get(message.paidMessageId)
        : undefined;

      const reply = repliesByOriginalChatMessageId.get(message.id);

      return {
        id: message.paidMessageId || message.id,

        content: message.content,

        status: reply ? "REPLIED" : paidMessage?.status || "AWAITING_REPLY",

        createdAt: message.createdAt,

        expiresAt:
          paidMessage?.expiresAt ||
          new Date(
            new Date(message.createdAt).getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),

        conversationId: message.conversationId,

        sender: {
          id: message.senderId,
          name: message.sender?.name || participant.name,
          avatarUrl: message.sender?.avatarUrl || participant.avatarUrl,
        },

        payment: {
          amount: paidMessage?.payment?.amount || 0,
        },

        replyContent: reply?.content,
      };
    });
}

// ============================================================
// PAGE
// ============================================================

export default function CreatorDashboard() {
  const queryClient = useQueryClient();

  const { socket } = useSocket();

  // ============================================================
  // STATE
  // ============================================================

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const [selectedReplyMessage, setSelectedReplyMessage] = useState<
    PaidMessage | undefined
  >(undefined);

  const [replyContent, setReplyContent] = useState("");

  const [activeTab, setActiveTab] = useState<"messages" | "profile">(
    "messages",
  );

  // ============================================================
  // CONVERSATION LIST
  // ============================================================

  const { data: conversationData, isLoading: conversationsLoading } = useQuery<
    ConversationSummary[]
  >({
    queryKey: ["creator-conversations"],

    queryFn: async () => {
      const res = await api.get("/messages/conversations");

      return res.data;
    },
  });

  const conversationSummaries = conversationData || [];

  // ============================================================
  // PAID MESSAGE METADATA
  //
  // This is NOT the chat history.
  //
  // It is only used for:
  // - payment amount
  // - AWAITING_REPLY
  // - REPLIED status
  // - mapping ChatMessage -> paid Message
  // ============================================================

  const { data: incomingMessages = [] } = useQuery<PaidMessage[]>({
    queryKey: ["creator-messages"],

    queryFn: async () => {
      const res = await api.get("/messages/incoming");

      return res.data;
    },
  });

  // ============================================================
  // BUILD SIDEBAR THREADS
  // ============================================================

  const conversations = useMemo<ConversationThread[]>(() => {
    return conversationSummaries.map((conversation) => {
      const paidMessagesForConversation = incomingMessages.filter(
        (message) => message.conversationId === conversation.conversationId,
      );

      const latestTimestamp =
        conversation.latestMessage?.createdAt || conversation.updatedAt;

      const hasPending = paidMessagesForConversation.some(
        (message) => message.status === "AWAITING_REPLY",
      );

      const totalBounty = paidMessagesForConversation.reduce(
        (total, message) => total + Number(message.payment?.amount || 0),
        0,
      );

      return {
        conversationId: conversation.conversationId,

        senderId: conversation.participant.id,

        creatorId: "",

        senderName: conversation.participant.name,

        avatarUrl: conversation.participant.avatarUrl,

        messages: paidMessagesForConversation,

        hasPending,

        latestTimestamp,

        totalBounty,
      };
    });
  }, [conversationSummaries, incomingMessages]);

  // ============================================================
  // ACTIVE CONVERSATION
  // ============================================================

  const activeThread = conversations.find(
    (conversation) => conversation.conversationId === selectedConversationId,
  );

  const activeParticipant = activeThread
    ? {
        id: activeThread.senderId,
        name: activeThread.senderName,
        avatarUrl: activeThread.avatarUrl,
      }
    : undefined;

  // ============================================================
  // PAGINATED CHAT HISTORY
  // ============================================================

  const {
    data: chatPages,
    isLoading: chatLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<ConversationMessagesResponse>({
    queryKey: ["conversation-messages", selectedConversationId],

    enabled: !!selectedConversationId,

    initialPageParam: undefined as string | undefined,

    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();

      params.set("limit", "30");

      if (pageParam) {
        params.set("cursor", String(pageParam));
      }

      const res = await api.get(
        `/messages/${selectedConversationId}/messages?${params.toString()}`,
      );

      return res.data;
    },

    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }

      return lastPage.pagination.nextCursor || undefined;
    },
  });

  // ============================================================
  // FLATTEN PAGINATED CHAT
  // ============================================================

  const chatMessages = useMemo(() => {
    if (!chatPages?.pages) {
      return [];
    }

    const allMessages = chatPages.pages.flatMap((page) => page.messages || []);

    return mergeUniqueMessages(allMessages);
  }, [chatPages]);

  // ============================================================
  // DISPLAY MESSAGES
  // ============================================================

  const displayMessages = useMemo(() => {
    if (!activeParticipant) {
      return [];
    }

    return buildDisplayMessages(
      chatMessages,
      incomingMessages.filter(
        (message) => message.conversationId === selectedConversationId,
      ),
      activeParticipant,
    );
  }, [
    chatMessages,
    incomingMessages,
    selectedConversationId,
    activeParticipant,
  ]);

  // ============================================================
  // REALTIME
  // ============================================================

  const handleNewMessage = useCallback(
    (payload: ChatMessage) => {
      if (!payload?.conversationId) {
        return;
      }

      // Sidebar should refresh because latestMessage / updatedAt
      // may have changed.
      queryClient.invalidateQueries({
        queryKey: ["creator-conversations"],
      });

      // Refresh paid metadata because a payment may have changed
      // AWAITING_REPLY / REPLIED state.
      queryClient.invalidateQueries({
        queryKey: ["creator-messages"],
      });

      // If this message belongs to the currently open conversation,
      // add it directly to the infinite query instead of refetching
      // the entire conversation.
      if (payload.conversationId === selectedConversationId) {
        queryClient.setQueryData(
          ["conversation-messages", selectedConversationId],
          (old: any) => {
            if (!old?.pages) {
              return old;
            }

            const pages = [...old.pages];

            const firstPage = pages[0];

            if (!firstPage) {
              return old;
            }

            const alreadyExists = pages.some((page: any) =>
              page.messages?.some(
                (message: ChatMessage) => message.id === payload.id,
              ),
            );

            if (alreadyExists) {
              return old;
            }

            pages[0] = {
              ...firstPage,

              messages: [...(firstPage.messages || []), payload],
            };

            return {
              ...old,
              pages,
            };
          },
        );
      }
    },
    [queryClient, selectedConversationId],
  );

  useSocketEvent("newMessage", handleNewMessage);

  // When payment succeeds, refresh payment metadata.
  const handlePaymentSucceeded = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["creator-messages"],
    });

    queryClient.invalidateQueries({
      queryKey: ["creator-conversations"],
    });
  }, [queryClient]);

  useSocketEvent("paymentSucceeded", handlePaymentSucceeded);

  // Creator reply from another socket/device.
  const handleMessageReplied = useCallback(
    (payload: any) => {
      queryClient.invalidateQueries({
        queryKey: ["creator-messages"],
      });

      queryClient.invalidateQueries({
        queryKey: ["creator-conversations"],
      });

      if (payload?.conversationId === selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["conversation-messages", selectedConversationId],
        });
      }
    },
    [queryClient, selectedConversationId],
  );

  useSocketEvent("messageReplied", handleMessageReplied);

  useSocketEvent("conversationUpdated", handlePaymentSucceeded);

  // ============================================================
  // JOIN CONVERSATION
  // ============================================================

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      if (selectedConversationId && selectedConversationId !== conversationId) {
        socket?.emit("leaveConversation", {
          conversationId: selectedConversationId,
        });
      }

      setSelectedConversationId(conversationId);

      setSelectedReplyMessage(undefined);

      setReplyContent("");

      socket?.emit("joinConversation", {
        conversationId,
      });
    },
    [socket, selectedConversationId],
  );

  // ============================================================
  // LEAVE CONVERSATION
  // ============================================================

  const handleLeaveConversation = useCallback(() => {
    if (selectedConversationId) {
      socket?.emit("leaveConversation", {
        conversationId: selectedConversationId,
      });
    }

    setSelectedConversationId(null);

    setSelectedReplyMessage(undefined);

    setReplyContent("");
  }, [socket, selectedConversationId]);

  // ============================================================
  // CLEAN SOCKET ROOM ON UNMOUNT
  // ============================================================

  useEffect(() => {
    return () => {
      if (selectedConversationId) {
        socket?.emit("leaveConversation", {
          conversationId: selectedConversationId,
        });
      }
    };
  }, [socket, selectedConversationId]);

  // ============================================================
  // SELECT MESSAGE
  // ============================================================

  const handleSelectReplyMessage = useCallback(
    (message: PaidMessage | undefined) => {
      setSelectedReplyMessage(message);

      setReplyContent("");
    },
    [],
  );

  // ============================================================
  // SEND CREATOR REPLY
  // ============================================================

  const replyMutation = useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      const res = await api.post(`/messages/${messageId}/reply`, {
        content,
      });

      return res.data;
    },

    onSuccess: (result) => {
      toast.success("Reply sent!");

      setReplyContent("");

      setSelectedReplyMessage(undefined);

      // Update payment/message state.
      queryClient.invalidateQueries({
        queryKey: ["creator-messages"],
      });

      queryClient.invalidateQueries({
        queryKey: ["creator-conversations"],
      });

      // The backend emits messageReplied/newMessage as well.
      // We don't need to refetch the whole chat here.
      if (result?.chatMessage?.conversationId) {
        queryClient.setQueryData(
          ["conversation-messages", result.chatMessage.conversationId],
          (old: any) => {
            if (!old?.pages) {
              return old;
            }

            const alreadyExists = old.pages.some((page: any) =>
              page.messages?.some(
                (message: ChatMessage) => message.id === result.chatMessage.id,
              ),
            );

            if (alreadyExists) {
              return old;
            }

            const pages = [...old.pages];

            pages[0] = {
              ...pages[0],

              messages: [...(pages[0].messages || []), result.chatMessage],
            };

            return {
              ...old,
              pages,
            };
          },
        );
      }
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
  // SEND REPLY
  // ============================================================

  const handleSendReply = useCallback(
    (messageId?: string) => {
      const content = replyContent.trim();

      if (!content) {
        return;
      }

      if (replyMutation.isPending) {
        return;
      }

      // Explicitly selected message wins.
      //
      // Otherwise automatically reply to the latest USER message
      // that has a paidMessageId.
      const latestMessage = [...displayMessages]
        .reverse()
        .find((message) => !!message.id);

      const targetMessageId =
        messageId || selectedReplyMessage?.id || latestMessage?.id;

      if (!targetMessageId) {
        toast.error("No message available to reply to.");
        return;
      }

      replyMutation.mutate({
        messageId: targetMessageId,
        content,
      });
    },
    [replyContent, replyMutation, selectedReplyMessage, displayMessages],
  );

  // ============================================================
  // LOAD OLDER MESSAGES
  // ============================================================

  const handleLoadOlderMessages = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================
  // UNREAD
  // ============================================================

  const hasUnreadMessages = conversations.some(
    (conversation) => conversation.hasPending,
  );

  // ============================================================
  // ACTIVE TAB
  // ============================================================

  if (activeTab === "profile") {
    return (
      <div className="mx-auto max-w-6xl font-sans text-slate-800 md:p-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
          <ProfileView />
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="mx-auto max-w-6xl font-sans text-slate-800 md:p-8">
      <div className="relative grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl md:grid-cols-12">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          isLoading={conversationsLoading}
        />

        <ChatWindow
          activeThread={
            activeThread
              ? {
                  ...activeThread,
                  messages: displayMessages,
                }
              : undefined
          }
          selectedConversationId={selectedConversationId}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          selectedReplyMessage={selectedReplyMessage}
          onSelectReplyMessage={handleSelectReplyMessage}
          onSendReply={handleSendReply}
          isSendingReply={replyMutation.isPending}
          onBack={handleLeaveConversation}
          // New pagination props.
          isLoadingMessages={chatLoading}
          isLoadingOlderMessages={isFetchingNextPage}
          hasOlderMessages={!!hasNextPage}
          onLoadOlderMessages={handleLoadOlderMessages}
        />
      </div>
    </div>
  );
}
