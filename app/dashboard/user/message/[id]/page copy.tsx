"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Info,
  Send,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import { format } from "date-fns";

// --- Updated Types to match your backend JSON ---
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
  status?: "PENDING_PAYMENT" | "PAID" | "AWAITING_REPLY" | "REPLIED";
}
interface ConversationResponse {
  conversationId: string | null;
  messages: ChatMessage[];
}
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000";

export default function RealTimeChatPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const creatorId = params.id as string;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState("");
  const [localUser, setLocalUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !conversationId) {
      return;
    }

    console.log("🔐 Joining conversation:", conversationId);

    socket.emit(
      "joinConversation",
      { conversationId },
      (response: {
        success: boolean;
        conversationId?: string;
        message?: string;
      }) => {
        console.log("response", response);
        if (response.success) {
          console.log("✅ Joined conversation:", response.conversationId);
        } else {
          console.error("❌ Failed to join conversation:", response.message);
        }
      },
    );
  }, [socket, conversationId]);

  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (!stored) {
      return;
    }

    const user = JSON.parse(stored);

    setLocalUser(user);
    const token = localStorage.getItem("access_token");
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });
    // const newSocket = io(SOCKET_URL, {
    //   query: {
    //     userId: user.id,
    //   },
    //   transports: ["websocket"],
    // });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Creator sends reply
    // Creator reply
    newSocket.on("messageReplied", (data: ChatMessage) => {
      console.log("💬 REALTIME REPLY:", data);

      queryClient.setQueryData<ConversationResponse>(
        ["chat", creatorId],
        (oldData) => {
          if (!oldData) {
            return {
              conversationId: data.conversationId,
              messages: [data],
            };
          }

          // Prevent duplicate messages
          const exists = oldData.messages.some(
            (message) => message.id === data.id,
          );

          if (exists) {
            return oldData;
          }

          return {
            ...oldData,
            messages: [...oldData.messages, data],
          };
        },
      );

      // Keep dashboard data synchronized
      queryClient.invalidateQueries({
        queryKey: ["sent-messages"],
      });
    });

    // newSocket.on("messageReplied", (data) => {
    //   console.log("REALTIME REPLY RECEIVED:", data);

    //   queryClient.invalidateQueries({
    //     queryKey: ["chat", creatorId],
    //   });

    //   queryClient.invalidateQueries({
    //     queryKey: ["sent-messages"],
    //   });
    // });

    // Creator/user sends new message
    // New paid message
    newSocket.on("newMessage", (data: ChatMessage) => {
      console.log("📨 REALTIME NEW MESSAGE:", data);

      queryClient.setQueryData<ConversationResponse>(
        ["chat", creatorId],
        (oldData) => {
          if (!oldData) {
            return {
              conversationId: data.conversationId,
              messages: [data],
            };
          }

          // Prevent duplicate messages
          const exists = oldData.messages.some(
            (message) => message.id === data.id,
          );

          if (exists) {
            return oldData;
          }

          return {
            ...oldData,
            conversationId: oldData.conversationId ?? data.conversationId,
            messages: [...oldData.messages, data],
          };
        },
      );
    });
    // newSocket.on("newMessage", (data) => {
    //   console.log("REALTIME MESSAGE RECEIVED:", data);

    //   queryClient.invalidateQueries({
    //     queryKey: ["chat", creatorId],
    //   });
    // });

    setSocket(newSocket);

    return () => {
      console.log("Disconnecting socket:", newSocket.id);

      newSocket.disconnect();
    };
  }, [creatorId, queryClient]);

  // 1. Fetch Creator Details (Updated to UserProfile)
  const { data: creator, isLoading: loadingCreator } = useQuery<UserProfile>({
    queryKey: ["creator", creatorId],
    queryFn: async () => {
      const res = await api.get(`/users/${creatorId}`);
      return res.data;
    },
  });

  // const {
  //   data: messages = [],
  //   isLoading: loadingMessages,
  //   isFetching: fetchingMessages,
  //   error: messagesError,
  //   status: messagesStatus,
  //   fetchStatus: messagesFetchStatus,
  // } = useQuery<ChatMessage[]>({
  //   queryKey: ["chat", creatorId],

  //   queryFn: async () => {
  //     console.log("🔥🔥 QUERY FUNCTION RUNNING");
  //     console.log("🔥 creatorId:", creatorId);

  //     const res = await api.get(`/messages/conversation/${creatorId}`);

  //     console.log("🔥 conversation response:", res.data);

  //     return res.data;
  //   },

  //   enabled: true,

  //   staleTime: 0,

  //   gcTime: 0,

  //   refetchOnMount: "always",

  //   refetchOnWindowFocus: false,
  // });

  // Scroll to bottom when messages change

  const {
    data: conversationData,
    isLoading: loadingMessages,
    isFetching: fetchingMessages,
    error: messagesError,
  } = useQuery<ConversationResponse>({
    queryKey: ["chat", creatorId],

    queryFn: async () => {
      console.log("🔥 FETCHING CONVERSATION:", creatorId);

      const res = await api.get(`/messages/conversation/${creatorId}`);

      console.log("🔥 CONVERSATION RESPONSE:", res.data);

      return res.data;
    },

    enabled: !!creatorId,

    staleTime: 0,

    gcTime: 0,

    refetchOnMount: "always",

    refetchOnWindowFocus: false,
  });

  const messages = conversationData?.messages ?? [];

  useEffect(() => {
    if (conversationData?.conversationId) {
      setConversationId(conversationData.conversationId);
    } else {
      setConversationId(null);
    }
  }, [conversationData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. Send Message Mutation
  // const sendMessageMutation = useMutation({
  //   mutationFn: async (messageContent: string) => {
  //     if (!creator) throw new Error("Creator not loaded");

  //     const res = await api.post("/messages/send-paid-chat", {
  //       creatorId: creator.id,
  //       content: messageContent,
  //     });
  //     return res.data;
  //   },
  //   onSuccess: () => {
  //     setContent("");
  //     queryClient.invalidateQueries({ queryKey: ["chat", creatorId] });
  //     if (creator) {
  //       socket?.emit("sendMessage", { receiverId: creator.id });
  //     }
  //   },
  //   onError: (err: any) => {
  //     toast.error(
  //       err.response?.data?.message || "Payment authorization failed.",
  //     );
  //   },
  // });

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

    onSuccess: (data) => {
      setContent("");

      if (data?.conversationId) {
        setConversationId(data.conversationId);
      }

      queryClient.invalidateQueries({
        queryKey: ["chat", creatorId],
      });
    },

    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || "Payment authorization failed.",
      );
    },
  });

  const handleSend = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;
    sendMessageMutation.mutate(content);
  };

  const hasPendingRequest = messages.some(
    (m) => m.senderId === localUser?.id && m.status === "AWAITING_REPLY",
  );

  console.log("CHAT DEBUG", {
    creatorId,
    messages,
    loadingMessages,
    fetchingMessages,
    messagesError,
  });
  if (loadingCreator || !creator) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Fallback to 0 if creatorProfile is null in the database
  const replyPrice = creator.creatorProfile?.replyPrice ?? 0;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-4 z-20 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex items-center gap-3 ml-2 flex-1">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200/50">
            {/* Using creator.name instead of username */}
            {creator.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm leading-tight">
              {creator.name}
            </h2>
            <p className="text-slate-500 text-xs font-medium">
              @{creator.name?.toLowerCase().replace(/\s+/g, "")}
            </p>
          </div>
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Info size={20} />
        </button>
      </header>

      {/* CHAT HISTORY AREA */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Trust Banner */}
        <div className="flex flex-col items-center justify-center p-6 mb-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3 text-blue-600">
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Escrow Protected
          </p>
          <p className="text-sm text-slate-500 text-center max-w-xs">
            @{creator.name} charges <strong>${replyPrice}</strong> per reply. If
            they don't respond within 7 days, your card is never charged.
          </p>
        </div>

        {/* Message Bubbles */}
        {loadingMessages ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-slate-300" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            Send a message to start the conversation.
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === localUser?.id;

            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[15px] ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Message Meta */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {format(new Date(msg.createdAt), "h:mm a")}
                  </span>

                  {isMe && msg.status === "AWAITING_REPLY" && (
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                      <Lock size={10} /> Escrow Hold
                    </span>
                  )}
                  {isMe && msg.status === "REPLIED" && (
                    <span className="text-[10px] font-bold text-emerald-500">
                      Paid
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT AREA */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200/60 p-3 pb-safe">
        {hasPendingRequest ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <p className="text-sm font-medium text-amber-800">
              Waiting for reply
            </p>
            <p className="text-xs text-amber-600/80 mt-0.5">
              You have an active authorization hold. You can send another
              message once @{creator.name} replies.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all overflow-hidden flex flex-col">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Message..."
                className="w-full bg-transparent p-3 max-h-32 min-h-[44px] text-[15px] focus:outline-none resize-none no-scrollbar"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
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
              disabled={!content.trim() || sendMessageMutation.isPending}
              className="flex-shrink-0 w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:transform-none"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <div className="flex flex-col items-center">
                  <Send size={16} className="-ml-0.5 mt-0.5" />
                  <span className="text-[8px] font-black tracking-tighter leading-none mt-0.5">
                    ${replyPrice}
                  </span>
                </div>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
