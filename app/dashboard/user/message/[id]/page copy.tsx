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
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import api from "@/lib/axios";
import { format } from "date-fns";

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

  // Stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [paymentMessageId, setPaymentMessageId] = useState<string | null>(null);

  // ============================================================
  // LOAD USER + SOCKET
  // ============================================================

  useEffect(() => {
    const stored = localStorage.getItem("user");

    if (!stored) return;

    const user = JSON.parse(stored);

    setLocalUser(user);

    const token = localStorage.getItem("access_token");

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // ==========================================================
    // CREATOR REPLIED
    // ==========================================================

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

      queryClient.invalidateQueries({
        queryKey: ["sent-messages"],
      });
    });

    // ==========================================================
    // NEW MESSAGE
    // ==========================================================

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

    // ==========================================================
    // PAYMENT SUCCEEDED
    // ==========================================================

    newSocket.on("paymentSucceeded", (data) => {
      console.log("💰 PAYMENT SUCCEEDED:", data);

      toast.success("Payment successful! Your request has been sent.");

      queryClient.invalidateQueries({
        queryKey: ["chat", creatorId],
      });

      queryClient.invalidateQueries({
        queryKey: ["sent-messages"],
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [creatorId, queryClient]);

  // ============================================================
  // JOIN CONVERSATION
  // ============================================================

  useEffect(() => {
    if (!socket || !conversationId) {
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
  }, [socket, conversationId]);

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
  // CONVERSATION
  // ============================================================

  const {
    data: conversationData,
    isLoading: loadingMessages,
    error: messagesError,
  } = useQuery<ConversationResponse>({
    queryKey: ["chat", creatorId],

    queryFn: async () => {
      const res = await api.get(`/messages/conversation/${creatorId}`);

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

  // ============================================================
  // SCROLL
  // ============================================================

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ============================================================
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

      queryClient.invalidateQueries({
        queryKey: ["chat", creatorId],
      });
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
    setClientSecret(null);
    setPaymentMessageId(null);

    queryClient.invalidateQueries({
      queryKey: ["chat", creatorId],
    });

    queryClient.invalidateQueries({
      queryKey: ["sent-messages"],
    });
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
    (m) => m.senderId === localUser?.id && m.status === "AWAITING_REPLY",
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
      <div className="flex flex-col h-screen bg-slate-50 font-sans">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <header className="flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-4 z-20 shadow-sm">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex items-center gap-3 ml-2 flex-1">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200/50">
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

        {/* ================================================== */}
        {/* CHAT */}
        {/* ================================================== */}

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            scrollBehavior: "smooth",
          }}
        >
          <div className="flex flex-col items-center justify-center p-6 mb-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3 text-blue-600">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Escrow Protected
            </p>

            <p className="text-sm text-slate-500 text-center max-w-xs">
              @{creator.name} charges <strong>${replyPrice}</strong> per reply.
              If they don't respond within 7 days, your card is never charged.
            </p>
          </div>

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
                  className={`flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
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

                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </span>

                    {isMe && msg.status === "PENDING_PAYMENT" && (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                        <Lock size={10} />
                        Payment Required
                      </span>
                    )}

                    {isMe && msg.status === "AWAITING_REPLY" && (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                        <Lock size={10} />
                        Escrow Hold
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

        {/* ================================================== */}
        {/* INPUT */}
        {/* ================================================== */}

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

      {/* ====================================================== */}
      {/* STRIPE PAYMENT MODAL */}
      {/* ====================================================== */}

      {clientSecret && paymentMessageId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Complete Payment
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Pay ${replyPrice} to send your message
                </p>
              </div>

              <button
                onClick={closePayment}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                  },
                }}
              >
                <StripePaymentForm onSuccess={handlePaymentSuccess} />
              </Elements>
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
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing Payment..." : "Pay & Send"}
      </button>
    </form>
  );
}
