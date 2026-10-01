"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  Info,
  Send,
  Paperclip,
  Phone,
  MessageCircle,
  Users,
  Settings,
  Loader2,
  Lock,
  ShieldCheck,
  X,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";

import api from "@/lib/axios";
import { format } from "date-fns";
import { useSocket } from "@/components/providers/SocketProvider";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface CreatorProfileData {
  replyPrice: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  creatorProfile: CreatorProfileData | null;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  createdAt: string;
  status?: "PENDING_PAYMENT" | "AWAITING_REPLY" | "REPLIED";
  replyToMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
}

interface SidebarConversation {
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

interface ConversationResponse {
  conversationId: string | null;
  userId?: string;
  creatorId?: string;
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

export default function RealTimeChatPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  const creatorId = params.id as string;

  const scrollRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const previousConversationIdRef = useRef<string | null>(null);
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keep the composer above the mobile keyboard when the browser exposes
  // the visual viewport (iOS Safari / modern mobile browsers).
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardHeight = () => {
      const height = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardHeight(height);
    };

    updateKeyboardHeight();
    viewport.addEventListener("resize", updateKeyboardHeight);
    viewport.addEventListener("scroll", updateKeyboardHeight);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardHeight);
      viewport.removeEventListener("scroll", updateKeyboardHeight);
    };
  }, []);

  const [conversationId, setConversationId] = useState<string | null>(null);

  // Stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [paymentMessageId, setPaymentMessageId] = useState<string | null>(null);

  // ============================================================
  // JOIN CONVERSATION
  // ============================================================
  // ============================================================
  // REAL-TIME SOCKET EVENTS
  // ============================================================

  const {
    data: chatPages,
    isLoading: loadingMessages,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<ConversationMessagesResponse>({
    queryKey: ["chat", conversationId],

    enabled: !!conversationId,

    initialPageParam: undefined as string | undefined,

    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();

      params.set("limit", "30");

      if (pageParam) {
        params.set("cursor", String(pageParam));
      }

      const res = await api.get(
        `/messages/${conversationId}/messages?${params.toString()}`,
      );

      return res.data;
    },

    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }

      return lastPage.pagination.nextCursor || undefined;
    },

    staleTime: 0,

    refetchOnWindowFocus: false,
  });

  // ============================================================
  // FLATTEN + DEDUPE PAGINATED MESSAGES
  // ============================================================

  const messages = useMemo(() => {
    if (!chatPages?.pages) {
      return [];
    }

    const allMessages = chatPages.pages.flatMap((page) => page.messages || []);

    const messageMap = new Map<string, ChatMessage>();

    for (const message of allMessages) {
      messageMap.set(message.id, message);
    }

    return Array.from(messageMap.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [chatPages]);
  const handleNewMessage = useCallback(
    (
      data: ChatMessage & {
        creatorId?: string;
        paidMessageId?: string;
        expiresAt?: string;
        payment?: unknown;
      },
    ) => {
      if (!data?.id || !data?.conversationId) {
        return;
      }

      // Ignore messages from another conversation.
      if (conversationId && data.conversationId !== conversationId) {
        return;
      }
      console.log("📩 NEW MESSAGE RECEIVED:", data);

      queryClient.setQueryData(["chat", data.conversationId], (old: any) => {
        if (!old?.pages) {
          return old;
        }

        const alreadyExists = old.pages.some(
          (page: ConversationMessagesResponse) =>
            page.messages?.some((message) => message.id === data.id),
        );

        if (alreadyExists) {
          return old;
        }

        const pages = [...old.pages];

        const firstPage = pages[0];

        if (!firstPage) {
          return old;
        }

        pages[0] = {
          ...firstPage,

          messages: [...(firstPage.messages || []), data],
        };

        return {
          ...old,
          pages,
        };
      });

      // Only scroll if the user is already near the bottom.
      requestAnimationFrame(() => {
        const container = scrollRef.current;

        if (!container) {
          return;
        }

        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;

        if (distanceFromBottom < 150) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });

      // Safety sync.
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["chat", conversationId],
        });
      }, 500);
    },
    [conversationId, queryClient],
  );

  const handleMessageReplied = useCallback(
    (data: any) => {
      if (!conversationId) {
        return;
      }

      if (data?.conversationId && data.conversationId !== conversationId) {
        return;
      }

      const reply =
        data?.chatMessage ??
        data?.message ??
        (data?.id && data?.content && data?.senderId && data?.createdAt
          ? {
              id: data.id,
              conversationId,
              content: data.content,
              senderId: data.senderId,
              createdAt: data.createdAt,
              replyToMessageId: data.replyToMessageId ?? null,
            }
          : null);

      if (!reply) {
        queryClient.invalidateQueries({
          queryKey: ["chat", conversationId],
        });

        return;
      }

      queryClient.setQueryData(["chat", conversationId], (old: any) => {
        if (!old?.pages) {
          return old;
        }

        const alreadyExists = old.pages.some(
          (page: ConversationMessagesResponse) =>
            page.messages?.some((message) => message.id === reply.id),
        );

        if (alreadyExists) {
          return old;
        }

        const pages = [...old.pages];

        const firstPage = pages[0];

        if (!firstPage) {
          return old;
        }

        pages[0] = {
          ...firstPage,

          messages: [...(firstPage.messages || []), reply],
        };

        return {
          ...old,
          pages,
        };
      });

      // Scroll only when already near the bottom.
      requestAnimationFrame(() => {
        const container = scrollRef.current;

        if (!container) {
          return;
        }

        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;

        if (distanceFromBottom < 150) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    },
    [conversationId, queryClient],
  );

  // ============================================================
  // LOAD OLDER MESSAGES
  // ============================================================

  const handleLoadOlderMessages = useCallback(async () => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) {
      return;
    }

    // Save current scroll position before older messages are added.
    previousScrollHeightRef.current = scrollRef.current.scrollHeight;

    shouldRestoreScrollRef.current = true;

    await fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  // ============================================================
  // INFINITE SCROLL
  // ============================================================

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    // User reached the top.
    if (container.scrollTop <= 100 && hasNextPage && !isFetchingNextPage) {
      handleLoadOlderMessages();
    }
  }, [hasNextPage, isFetchingNextPage, handleLoadOlderMessages]);
  const handlePaymentSucceeded = useCallback(
    (data: {
      messageId?: string;
      paymentId?: string;
      conversationId?: string;
      status?: string;
    }) => {
      if (!data?.conversationId) {
        return;
      }

      if (data.conversationId !== conversationId) {
        return;
      }

      console.log("💰 PAYMENT SUCCEEDED:", data);

      // Give the webhook transaction a moment to finish.
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["chat", conversationId],
        });

        queryClient.invalidateQueries({
          queryKey: ["sent-messages"],
        });
      }, 300);
    },
    [conversationId, creatorId, queryClient],
  );

  // ============================================================
  // REGISTER GLOBAL SOCKET LISTENERS
  // ============================================================

  useSocketEvent<ChatMessage>("newMessage", handleNewMessage);

  useSocketEvent("messageReplied", handleMessageReplied);

  useSocketEvent("paymentSucceeded", handlePaymentSucceeded);
  useEffect(() => {
    if (!socket || !connected || !conversationId) {
      return;
    }

    console.log("🔐 Joining conversation:", conversationId);

    socket.emit(
      "joinConversation",
      {
        conversationId,
      },
      (response: {
        success: boolean;
        conversationId?: string;
        message?: string;
      }) => {
        if (response.success) {
          console.log("✅ Joined conversation:", response.conversationId);
        } else {
          console.error("❌ Failed to join conversation:", response.message);
        }
      },
    );

    return () => {
      socket.emit("leaveConversation", {
        conversationId,
      });

      console.log("👋 Leaving conversation:", conversationId);
    };
  }, [socket, connected, conversationId]);
  // ============================================================
  // CREATOR
  // ============================================================

  const { data: creator, isLoading: loadingCreator } = useQuery<UserProfile>({
    queryKey: ["creator", creatorId],

    queryFn: async () => {
      const res = await api.get(`/users/${creatorId}`);

      return res.data;
    },

    enabled: !!creatorId,
  });

  // ============================================================
  // DESKTOP CONVERSATION SIDEBAR
  // ============================================================

  const { data: sidebarConversations = [], isLoading: loadingSidebar } =
    useQuery<SidebarConversation[]>({
      queryKey: ["my-conversations"],
      queryFn: async () => {
        const res = await api.get("/messages/my-conversations");
        return res.data;
      },
      staleTime: 0,
      refetchOnWindowFocus: false,
    });

  const filteredSidebarConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sidebarConversations;
    return sidebarConversations.filter((item) =>
      item.participant?.name?.toLowerCase().includes(query),
    );
  }, [sidebarConversations, searchQuery]);

  const formatSidebarTime = useCallback((date: string) => {
    const value = new Date(date);
    const now = new Date();
    if (value.toDateString() === now.toDateString()) {
      return value.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (value.toDateString() === yesterday.toDateString()) return "Yesterday";
    return value.toLocaleDateString([], { month: "short", day: "numeric" });
  }, []);

  // ============================================================
  // CONVERSATION
  // ============================================================
  // ============================================================
  // GET CONVERSATION ID
  // ============================================================

  const { data: conversationData, isLoading: loadingConversation } =
    useQuery<ConversationResponse>({
      queryKey: ["chat-conversation", creatorId],

      queryFn: async () => {
        const res = await api.get(`/messages/conversation/${creatorId}`);

        return res.data;
      },

      enabled: !!creatorId,

      staleTime: 0,

      refetchOnMount: "always",

      refetchOnWindowFocus: false,
    });

  // ============================================================
  // SET CONVERSATION ID
  // ============================================================

  useEffect(() => {
    const nextConversationId = conversationData?.conversationId ?? null;

    setConversationId(nextConversationId);

    if (previousConversationIdRef.current !== nextConversationId) {
      initialScrollDoneRef.current = false;
      previousConversationIdRef.current = nextConversationId;
    }
  }, [conversationData]);

  // ============================================================
  // PAGINATED CHAT HISTORY
  // ============================================================

  // const {
  //   data: conversationData,
  //   isLoading: loadingMessages,
  //   error: messagesError,
  // } = useQuery<ConversationResponse>({
  //   queryKey: ["chat", creatorId],

  //   queryFn: async () => {
  //     const res = await api.get(`/messages/conversation/${creatorId}`);

  //     return res.data;
  //   },

  //   enabled: !!creatorId,

  //   staleTime: 0,

  //   gcTime: 0,

  //   refetchOnMount: "always",

  //   refetchOnWindowFocus: false,
  // });

  // const messages = conversationData?.messages ?? [];

  // useEffect(() => {
  //   if (conversationData?.conversationId) {
  //     setConversationId(conversationData.conversationId);
  //   } else {
  //     setConversationId(null);
  //   }
  // }, [conversationData]);

  // ============================================================
  // SCROLL
  // ============================================================

  // ============================================================
  // SCROLL POSITION MANAGEMENT
  // ============================================================

  useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    // ----------------------------------------------------------
    // RESTORE POSITION AFTER LOADING OLDER MESSAGES
    // ----------------------------------------------------------

    if (shouldRestoreScrollRef.current) {
      const newScrollHeight = container.scrollHeight;

      const heightDifference =
        newScrollHeight - previousScrollHeightRef.current;

      container.scrollTop = container.scrollTop + heightDifference;

      shouldRestoreScrollRef.current = false;

      return;
    }

    // ----------------------------------------------------------
    // INITIAL LOAD -> BOTTOM
    // ----------------------------------------------------------

    if (messages.length > 0 && !initialScrollDoneRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }

        initialScrollDoneRef.current = true;
      });
    }
  }, [messages]); // ============================================================
  // CREATE PENDING MESSAGE
  // ============================================================

  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      if (!creator) {
        throw new Error("Creator not loaded");
      }

      const res = await api.post("/messages/send-paid-chat", {
        creatorId: creator.id,
        content: messageContent,
      });

      return res.data;
    },

    onSuccess: async (data) => {
      setContent("");

      if (data?.conversationId) {
        setConversationId(data.conversationId);

        queryClient.setQueryData(
          ["chat-conversation", creatorId],
          (old: ConversationResponse | undefined) => ({
            ...old,
            conversationId: data.conversationId,
            userId: old?.userId,
            creatorId: old?.creatorId ?? creatorId,
          }),
        );
      }

      const messageId = data?.id;

      if (!messageId) {
        toast.error("Message ID not received");
        return;
      }

      setPaymentMessageId(messageId);

      // ========================================================
      // CREATE STRIPE PAYMENT INTENT
      // ========================================================

      try {
        const paymentResponse = await api.post("/payments/create-intent", {
          messageId,
        });

        const secret = paymentResponse.data?.clientSecret;

        if (!secret) {
          throw new Error("Payment client secret not received");
        }

        setClientSecret(secret);
      } catch (error: any) {
        console.error("Payment Intent Error:", error);

        toast.error(
          error?.response?.data?.message || "Unable to start payment.",
        );
      }

      // queryClient.invalidateQueries({
      //   queryKey: ["chat", creatorId],
      // });
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Unable to create message.");
    },
  });

  // ============================================================
  // SEND
  // ============================================================

  const handleSend = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!content.trim()) {
      return;
    }

    if (sendMessageMutation.isPending) {
      return;
    }

    sendMessageMutation.mutate(content.trim());
  };

  // ============================================================
  // PAYMENT SUCCESS
  // ============================================================

  const handlePaymentSuccess = () => {
    console.log("💳 Stripe payment confirmed on frontend");

    setClientSecret(null);
    setPaymentMessageId(null);

    // DO NOT immediately refetch the chat.
    //
    // Stripe confirmation happens before the webhook necessarily
    // finishes creating the ChatMessage.
    //
    // The webhook will emit `newMessage`.
    //
    // We also perform a delayed sync as a safety net.

    setTimeout(() => {
      console.log("🔄 Syncing chat after payment...");

      queryClient.invalidateQueries({
        queryKey: ["chat", conversationId],
      });

      queryClient.invalidateQueries({
        queryKey: ["sent-messages"],
      });
    }, 1500);
  };

  // ============================================================
  // CLOSE PAYMENT
  // ============================================================

  const closePayment = () => {
    setClientSecret(null);
    setPaymentMessageId(null);
  };

  // ============================================================
  // PENDING REQUEST
  // ============================================================

  const hasPendingRequest = messages.some(
    (m) =>
      m.senderId === conversationData?.userId && m.status === "AWAITING_REPLY",
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingCreator || !creator) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#0B3B91]" size={32} />
      </div>
    );
  }

  const replyPrice = creator.creatorProfile?.replyPrice ?? 0;

  return (
    <>
      <div className="h-[100dvh] w-full max-w-full overflow-x-hidden overflow-y-hidden bg-white font-sans text-[#070D3B]">
        <div className="flex h-full w-full min-w-0 overflow-hidden bg-white">
          {/* ================================================== */}
          {/* CHAT */}
          {/* ================================================== */}
          <section className="relative mx-auto flex min-h-0 min-w-0 w-full max-w-4xl flex-1 flex-col overflow-hidden bg-[#F7FAFF]">
            {/* Header */}
            <header className="z-30 flex h-[62px] w-full min-w-0 flex-shrink-0 items-center overflow-hidden border-b border-[#D9E6FF] bg-white px-1.5 shadow-[0_1px_8px_rgba(11,59,145,0.06)] sm:h-[68px] sm:px-4">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="mr-1 flex h-10 w-10 items-center justify-center rounded-full text-[#60708E] transition hover:bg-[#EEF4FF] hover:text-[#0B3B91]  "
              >
                <ChevronLeft size={24} />
              </button>

              <div className="relative flex-shrink-0">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#BFD6FF] sm:h-11 sm:w-11"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCEAFF] font-bold text-[#0B3B91] sm:h-11 sm:w-11">
                    {creator.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#0B3B91]" />
              </div>

              <div className="ml-2 min-w-0 flex-1 overflow-hidden sm:ml-3">
                <h2 className="min-w-0 truncate text-[15px] font-bold text-[#070D3B] sm:text-base">
                  {creator.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-[#0B3B91]">
                    ${replyPrice}/reply
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-[#B1BCD0] sm:block" />
                  <span className="hidden text-[11px] text-[#8693AA] sm:inline">
                    Reply guaranteed within 2 days
                  </span>
                </div>
              </div>

              <div className="ml-1 flex flex-shrink-0 items-center gap-0.5 sm:ml-0 sm:gap-1">
                <button
                  type="button"
                  className="hidden h-9 w-9 items-center justify-center rounded-full text-[#8693AA] transition hover:bg-[#EEF4FF] hover:text-[#0B3B91] lg:flex"
                  aria-label="Search messages"
                >
                  <Search size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Conversation information"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#8693AA] transition hover:bg-[#EEF4FF] hover:text-[#0B3B91]"
                >
                  <Info size={19} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <main
              ref={scrollRef}
              onScroll={handleScroll}
              className="relative min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F7FAFF] px-2.5 py-4 sm:px-6 sm:py-6 lg:px-10"
              style={{
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {/* Soft blue decorative shapes */}
              <div className="pointer-events-none absolute left-[-80px] top-24 h-40 w-40 rounded-full bg-[#DCEAFF]/40 blur-3xl" />
              <div className="pointer-events-none absolute right-[-80px] top-1/2 h-48 w-48 rounded-full bg-[#DCEAFF]/40 blur-3xl" />

              <div className="relative mx-auto flex min-h-full w-full min-w-0 flex-col">
                {/* Intro card */}
                <div className="mb-5 w-full min-w-0 rounded-[24px] border border-[#D9E6FF] bg-white px-4 py-5 text-center shadow-[0_8px_30px_rgba(11,59,145,0.07)] sm:px-8 sm:py-8">
                  <div className="mb-4 flex justify-center">
                    <div className="relative flex items-center justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0B3B91] text-white shadow-lg shadow-[#BFD6FF] sm:h-20 sm:w-20">
                        <MessageCircle size={30} strokeWidth={2.2} />
                      </div>

                      <div className="absolute left-12 top-2 h-14 w-14 overflow-hidden rounded-full border-4 border-white bg-[#EEF4FF] shadow-md sm:left-14 sm:h-16 sm:w-16">
                        {creator.avatarUrl ? (
                          <img
                            src={creator.avatarUrl}
                            alt={creator.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#DCEAFF] font-bold text-[#0B3B91]">
                            {creator.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-xl font-bold tracking-tight text-[#52627F] sm:text-2xl">
                    Speak with{" "}
                    <span className="text-[#070D3B]">{creator.name}.</span>
                  </h1>

                  <p className="mx-auto mt-2 max-w-xl text-xs font-medium leading-5 text-[#7B89A4] sm:text-sm sm:leading-6">
                    Welcome to your conversation with {creator.name}! Start
                    chatting below. Your message is sent securely and the
                    creator&apos;s reply is protected by the payment process.
                  </p>

                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-5 py-2 text-xs font-bold text-[#0B3B91] ring-1 ring-[#BFD6FF] transition hover:bg-[#DCEAFF]"
                  >
                    <Info size={14} />
                    Learn More
                  </button>

                  <div className="mt-5 space-y-1 text-[11px] font-medium text-[#8693AA] sm:text-xs">
                    <p>Reply guaranteed within 2 days or your money back.</p>
                    <p className="font-semibold text-[#7B89A4]">
                      *Prices displayed in US dollars.
                    </p>
                  </div>
                </div>

                {/* Payment protection label */}
                <div className="mx-auto mb-4 max-w-full rounded-full border border-[#D9E6FF] bg-white px-3 py-2 shadow-sm">
                  <p className="text-[10px] font-semibold text-[#0B3B91] sm:text-[11px]">
                    <ShieldCheck className="mr-1 inline-block" size={13} />$
                    {replyPrice} per reply · Secure payment
                  </p>
                </div>

                {loadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader2
                      className="animate-spin text-[#2F66C0]"
                      size={24}
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center py-16 text-center">
                    <div>
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2F66C0]">
                        <MessageCircle size={22} />
                      </div>
                      <p className="text-sm font-semibold text-[#60708E]">
                        Start the conversation
                      </p>
                      <p className="mt-1 text-xs text-[#8693AA]">
                        Send your first message below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 pb-2">
                    {messages.map((msg, idx) => {
                      const isMe = msg.senderId === conversationData?.userId;

                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex w-full ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`flex max-w-[88%] flex-col ${
                              isMe ? "items-end" : "items-start"
                            } sm:max-w-[72%]`}
                          >
                            <div
                              className={`rounded-[20px] px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                                isMe
                                  ? "rounded-br-md bg-[#0B3B91] text-white shadow-[0_4px_14px_rgba(11,59,145,0.10)]"
                                  : "rounded-bl-md border border-[#D9E6FF] bg-white text-[#17305F] shadow-[0_4px_14px_rgba(11,59,145,0.05)]"
                              }`}
                            >
                              {msg.replyToMessage && (
                                <div
                                  className={`mb-2 rounded-xl border-l-4 px-3 py-2 text-xs ${
                                    isMe
                                      ? "border-[#BFD6FF] bg-[#0B3B91]/60 text-[#F3F7FF]"
                                      : "border-[#0B3B91] bg-[#EEF4FF] text-[#7B89A4]"
                                  }`}
                                >
                                  <p className="line-clamp-2">
                                    {msg.replyToMessage.content}
                                  </p>
                                </div>
                              )}

                              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                {msg.content}
                              </p>

                              <div className="mt-1 flex items-center justify-end gap-1.5">
                                {isMe && msg.status === "PENDING_PAYMENT" && (
                                  <Lock size={10} className="text-[#E7F0FF]" />
                                )}
                                {isMe && msg.status === "AWAITING_REPLY" && (
                                  <Lock size={10} className="text-[#E7F0FF]" />
                                )}
                                {isMe && msg.status === "REPLIED" && (
                                  <span className="text-[10px] font-bold text-[#E7F0FF]">
                                    ✓✓
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>

            {/* Composer */}
            <div
              className="z-20 w-full min-w-0 flex-shrink-0 overflow-x-hidden border-t border-[#D9E6FF] bg-white px-1.5 pt-2 sm:px-4 sm:pb-2"
              style={{
                paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom))`,
                marginBottom: keyboardHeight
                  ? `${keyboardHeight}px`
                  : undefined,
              }}
            >
              <div className="mx-auto w-full min-w-0">
                <div className="mb-1 flex items-center justify-between px-1.5">
                  <span className="text-[10px] font-semibold text-[#0B3B91] sm:text-[11px]">
                    ${replyPrice} per 900 characters
                  </span>
                  <span className="text-[10px] font-semibold text-[#8693AA] sm:text-[11px]">
                    {content.length}
                  </span>
                </div>

                {hasPendingRequest ? (
                  <div className="w-full min-w-0 rounded-2xl border border-[#D9E6FF] bg-[#EEF4FF] px-3 py-3 text-center sm:px-4">
                    <p className="text-sm font-bold text-[#0B3B91]">
                      Waiting for reply
                    </p>
                    <p className="mt-0.5 text-xs text-[#0B3B91]">
                      You have an active authorization hold. You can send
                      another message once @{creator.name} replies.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSend}
                    className="flex w-full min-w-0 items-end gap-1.5 rounded-[18px] border border-[#D9E6FF] bg-[#F3F7FF] p-1.5 shadow-[0_4px_18px_rgba(11,59,145,0.08)] sm:gap-2"
                  >
                    <button
                      type="button"
                      aria-label="Attach media"
                      className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[#8693AA] transition hover:bg-white hover:text-[#0B3B91] sm:flex"
                    >
                      <Paperclip size={19} />
                    </button>

                    <div className="flex min-w-0 flex-1 items-end overflow-hidden rounded-xl bg-white px-1 shadow-sm ring-1 ring-[#EEF4FF]">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your message..."
                        aria-label="Message"
                        className="min-h-[42px] max-h-32 min-w-0 w-full flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-[15px] text-[#17305F] outline-none placeholder:text-[#8693AA]"
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "auto";
                          target.style.height = `${Math.min(
                            target.scrollHeight,
                            128,
                          )}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        !content.trim() || sendMessageMutation.isPending
                      }
                      aria-label="Send message"
                      className="flex h-10 min-w-10 flex-shrink-0 items-center justify-center gap-1 rounded-xl bg-[#0B3B91] px-2.5 text-white shadow-sm transition hover:bg-[#08306F] active:scale-95 disabled:bg-[#BFD6FF] sm:min-w-[74px] sm:gap-1.5 sm:px-3"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span className="hidden text-xs font-bold sm:inline">
                            ${replyPrice}
                          </span>
                          <Send size={17} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ====================================================== */}
      {/* STRIPE PAYMENT MODAL */}
      {/* ====================================================== */}

      {clientSecret && paymentMessageId && (
        <div
          className="fixed inset-0 z-50 w-full max-w-full overflow-x-hidden overflow-y-auto bg-[#070D3B]/40 p-0 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Complete payment"
        >
          <div className="flex min-h-[100dvh] w-full max-w-full items-end justify-center sm:items-center sm:p-4">
            <div className="flex max-h-[100dvh] w-full min-w-0 max-w-md flex-col overflow-hidden rounded-t-[24px] border border-[#D9E6FF] bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[24px]">
              <div className="flex flex-shrink-0 items-center justify-between border-b border-[#D9E6FF] px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF4FF] text-[#0B3B91]">
                      <ShieldCheck size={17} />
                    </div>
                    <h2 className="text-base font-bold text-[#070D3B] sm:text-lg">
                      Complete Payment
                    </h2>
                  </div>
                  <p className="mt-1 text-xs text-[#7B89A4] sm:ml-10 sm:text-sm">
                    Pay ${replyPrice} securely to send your message
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePayment}
                  aria-label="Close payment"
                  className="ml-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[#7B89A4] transition hover:bg-[#DCEAFF] hover:text-[#0B3B91]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5">
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        borderRadius: "10px",
                        fontSizeBase: "14px",
                        colorPrimary: "#0B3B91",
                      },
                    },
                  }}
                >
                  <StripePaymentForm onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// STRIPE PAYMENT FORM
// ============================================================

function StripePaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,

      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },

      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed");

      setLoading(false);
      return;
    }

    // IMPORTANT:
    // Do NOT update the message status here.
    //
    // Stripe webhook does that:
    //
    // PENDING_PAYMENT
    //       ↓
    // AWAITING_REPLY

    onSuccess();

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="pb-1">
      <PaymentElement
        options={{
          layout: {
            type: "accordion",
            defaultCollapsed: false,
            radios: "auto",
          },
          paymentMethodOrder: ["card", "link"],
        }}
      />

      {error && (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
          <p className="text-xs text-red-600 sm:text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="mt-4 w-full rounded-xl bg-[#0B3B91] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#08306F] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay & Send"}
      </button>
    </form>
  );
}
