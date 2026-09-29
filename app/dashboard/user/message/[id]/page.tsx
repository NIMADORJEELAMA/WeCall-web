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
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const replyPrice = creator.creatorProfile?.replyPrice ?? 0;

  return (
    <>
      <div className="h-[100dvh] overflow-hidden bg-slate-100 font-sans text-slate-900">
        <div className="mx-auto flex h-full w-full max-w-[1600px] overflow-hidden bg-white shadow-2xl lg:my-0 lg:h-full lg:border-x lg:border-slate-200">
          {/* ================================================== */}
          {/* DESKTOP SIDEBAR */}
          {/* ================================================== */}
          <aside className="hidden w-[340px] flex-shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
            <div className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-sm">
                  U
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Chats</p>
                  <p className="text-[11px] text-slate-500">
                    Your conversations
                  </p>
                </div>
              </div>
              <button
                className="rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                type="button"
              >
                <MessageCircle size={20} />
              </button>
            </div>

            <div className="border-b border-slate-100 bg-white p-3.5">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search or start new chat"
                  className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingSidebar ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : filteredSidebarConversations.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <MessageCircle
                    className="mx-auto mb-3 text-slate-300"
                    size={42}
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    No conversations
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Your chats will appear here.
                  </p>
                </div>
              ) : (
                filteredSidebarConversations.map((item) => {
                  const active = item.participant?.id === creatorId;
                  const participant = item.participant;
                  const latest = item.latestMessage;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        router.push(`/dashboard/user/message/${participant.id}`)
                      }
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${
                        active ? "bg-[#e9edef]" : "hover:bg-[#f5f6f6]"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        {participant.avatarUrl ? (
                          <img
                            src={participant.avatarUrl}
                            alt={participant.name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 font-bold text-blue-700 ring-1 ring-blue-100">
                            {participant.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {active && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[15px] font-semibold text-slate-900">
                            {participant.name}
                          </p>
                          {latest && (
                            <span className="flex-shrink-0 text-[10px] text-slate-400">
                              {formatSidebarTime(latest.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {latest?.content || "Tap to start chatting"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ================================================== */}
          {/* CHAT PANEL */}
          {/* ================================================== */}
          <section className="flex min-w-0 flex-1 flex-col bg-slate-50">
            {/* Header */}
            <header className="z-20 flex h-[72px] flex-shrink-0 items-center border-b border-slate-200 bg-white px-2 shadow-sm sm:px-5">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="mr-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 md:hidden"
              >
                <ChevronLeft size={23} />
              </button>

              <div className="relative flex-shrink-0">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-700 ring-1 ring-blue-100">
                    {creator.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>

              <div className="ml-3 min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold text-slate-900">
                  {creator.name}
                </h2>
                <p className="text-[11px] text-emerald-600">Online</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 md:flex"
                >
                  <Search size={19} />
                </button>
                <button
                  type="button"
                  aria-label="Conversation information"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Info size={20} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <main
              ref={scrollRef}
              onScroll={handleScroll}
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] px-3 py-5 sm:px-6 lg:px-8"
              style={{
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="mx-auto flex max-w-4xl flex-col gap-2.5">
                <div className="mx-auto mb-4 rounded-full border border-blue-100 bg-white px-4 py-2 text-center shadow-sm">
                  <p className="text-[11px] font-medium text-slate-500">
                    🔒 @{creator.name} charges <strong>${replyPrice}</strong>{" "}
                    per reply. Your payment is protected.
                  </p>
                </div>

                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2
                      className="animate-spin text-slate-400"
                      size={24}
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="my-auto py-20 text-center text-sm text-slate-500">
                    Send a message to start the conversation.
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === conversationData?.userId;
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[65%] lg:max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ring-1 ${isMe ? "rounded-br-md bg-blue-600 text-white ring-blue-600" : "rounded-bl-md bg-white text-slate-800 ring-slate-200"}`}
                          >
                            {msg.replyToMessage && (
                              <div className="mb-2 rounded-lg border-l-4 border-blue-400 bg-blue-50 px-2.5 py-1.5 text-xs text-slate-500">
                                <p className="line-clamp-2">
                                  {msg.replyToMessage.content}
                                </p>
                              </div>
                            )}
                            <p className="whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <div className="mt-1 flex items-center justify-end gap-1.5">
                              {/* <span className={`text-[10px] ${isMe ? "text-blue-100" : "text-slate-400"}`>
                                {format(new Date(msg.createdAt), "h:mm a")}
                              </span> */}
                              {isMe && msg.status === "PENDING_PAYMENT" && (
                                <Lock size={10} className="text-amber-500" />
                              )}
                              {isMe && msg.status === "AWAITING_REPLY" && (
                                <Lock size={10} className="text-amber-500" />
                              )}
                              {isMe && msg.status === "REPLIED" && (
                                <span className="text-[10px] font-bold text-emerald-500">
                                  ✓✓
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>

            {/* Composer */}
            <div
              className="flex-shrink-0 border-t border-slate-200 bg-white px-2 pt-2.5 sm:px-4 sm:pb-2"
              style={{
                paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom))`,
                marginBottom: keyboardHeight
                  ? `${keyboardHeight}px`
                  : undefined,
              }}
            >
              <div className="mx-auto max-w-4xl">
                {hasPendingRequest ? (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center">
                    <p className="text-sm font-semibold text-blue-700">
                      Waiting for reply
                    </p>
                    <p className="mt-0.5 text-xs text-blue-600">
                      You have an active authorization hold. You can send
                      another message once @{creator.name} replies.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSend}
                    className="flex items-end gap-2 rounded-2xl bg-slate-100 p-1.5 ring-1 ring-slate-200"
                  >
                    <button
                      type="button"
                      aria-label="Attach media"
                      className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-blue-600 sm:flex"
                    >
                      <Paperclip size={20} />
                    </button>
                    <div className="flex min-w-0 flex-1 items-end rounded-xl bg-white px-1 shadow-sm">
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Type a message"
                        aria-label="Message"
                        className="min-h-[42px] max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-slate-400"
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = "auto";
                          target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
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
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 size={19} className="animate-spin" />
                      ) : (
                        <Send size={18} />
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
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Complete payment"
        >
          <div className="flex min-h-[100dvh] items-end justify-center p-2 sm:items-center sm:p-4">
            <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
              <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Complete Payment
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Pay ${replyPrice} to send your message
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePayment}
                  aria-label="Close payment"
                  className="ml-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        borderRadius: "10px",
                        fontSizeBase: "14px",
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
        className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay & Send"}
      </button>
    </form>
  );
}
