"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import api from "@/lib/axios";

interface Creator {
  id: string;
  name: string;
  username: string;
  bio: string | null;
  aboutMe?: string | null;
  category: string | null;
  replyPrice: string | number;
  currency: string;
  profileImage: string | null;
  avatarUrl: string | null;
}

export default function WecallCreatorPage() {
  const params = useParams();
  const router = useRouter();

  const username = params.username as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;

    const fetchCreator = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/creators/username/${encodeURIComponent(username)}`,
        );

        setCreator(response.data);
      } catch (err: any) {
        console.error("Failed to fetch creator:", err);

        setError(err.response?.data?.message || "Creator could not be found.");
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [username]);

  const handleMessage = () => {
    if (!creator) return;

    router.push(`/dashboard/user/message/${creator.id}`);
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-[#cfe3ff] via-[#e8f1ff] to-[#f7f9fc] px-4 py-8">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-xl items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-11 w-11">
              <div className="absolute inset-0 rounded-full border-[3px] border-white/80" />
              <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-[#3978d8]" />
            </div>

            <p className="text-sm font-medium text-[#71809a]">
              Loading profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !creator) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#cfe3ff] via-[#e8f1ff] to-[#f7f9fc] px-5">
        <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_20px_60px_rgba(58,93,140,0.12)] backdrop-blur">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff]">
            <MessageCircle size={28} className="text-[#5687c9]" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-[#172238]">
            Creator not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#7c899d]">
            This creator link may be invalid or the creator may currently be
            unavailable.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-2xl bg-[#172238] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#26354d] active:scale-[0.98]"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  const price = Number(creator.replyPrice).toFixed(2);
  const image = creator.profileImage || creator.avatarUrl || null;

  const aboutMe = creator.aboutMe || creator.bio;

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#cfe3ff] via-[#e8f1ff] to-[#f7f9fc] px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-xl">
        {/* Top navigation */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/60 px-3.5 text-sm font-medium text-[#5c6d85] shadow-sm backdrop-blur transition hover:bg-white active:scale-95"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-[#71809a]">
            <Sparkles size={14} />
            WECALL
          </div>
        </div>

        {/* Main profile + about card */}
        <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_18px_50px_rgba(54,91,139,0.10)]">
          <div className="relative px-6 pb-6 pt-7 text-center sm:px-8">
            {/* Soft decorative background */}
            <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-[#dcecff] blur-3xl" />
            <div className="pointer-events-none absolute -left-20 top-20 h-32 w-32 rounded-full bg-[#eef6ff] blur-3xl" />

            <div className="relative">
              {/* Avatar */}
              <div className="relative mx-auto h-24 w-24">
                {image ? (
                  <img
                    src={image}
                    alt={creator.name}
                    className="h-24 w-24 rounded-full object-cover ring-6 ring-[#f2f7fd] shadow-[0_8px_24px_rgba(58,88,126,0.14)]"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#d8e9ff] to-[#9dbce5] text-3xl font-bold text-[#31537d] ring-6 ring-[#f2f7fd]">
                    {creator.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md">
                  <BadgeCheck
                    size={20}
                    className="text-[#3978d8]"
                    fill="currentColor"
                    stroke="white"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="mt-4 flex items-center justify-center gap-1.5">
                <h1 className="text-[23px] font-bold tracking-[-0.035em] text-[#172238]">
                  {creator.name}
                </h1>

                <BadgeCheck
                  size={17}
                  className="text-[#3978d8]"
                  fill="currentColor"
                  stroke="white"
                />
              </div>

              {/* Username */}
              {/* <p className="mt-0.5 text-[13px] font-medium text-[#8491a4]">
                @{creator.username}
              </p> */}

              {/* Category */}
              {creator.category && (
                <div className="mt-3 inline-flex rounded-full bg-[#f0f6ff] px-3 py-1 text-[10px] font-semibold text-[#5277a5]">
                  {creator.category}
                </div>
              )}

              {creator.bio && (
                <p className="mx-auto mt-4 max-w-[390px] font-serif text-[15px] italic leading-6 text-[#58687d]">
                  {creator.bio}
                </p>
              )}
            </div>
          </div>

          {/* Compact reply information */}
          <div className="mx-5 border-t border-[#edf1f5] px-1 py-4 sm:mx-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#99a4b3]">
                  Personal reply
                </p>

                <p className="mt-0.5 text-[12px] text-[#7b899b]">
                  Get a direct response from {creator.name}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-[19px] font-bold tracking-[-0.02em] text-[#172238]">
                  ${price}
                </span>

                <span className="ml-1 text-[11px] text-[#8995a6]">/ reply</span>
              </div>
            </div>
          </div>

          {/* Message button */}
          <div className="px-5 pb-6 pt-2 sm:px-7">
            <button
              onClick={handleMessage}
              className="group flex w-full items-center justify-center gap-2 rounded-[17px] bg-[#3978d8] px-5 py-3.5 text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(57,120,216,0.20)] transition hover:bg-[#2f6dc9] active:scale-[0.985]"
            >
              <MessageCircle size={18} />
              Message {creator.name}
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>

            <div className="mt-3 flex items-center justify-center gap-3 text-[10px] font-medium text-[#919cab]">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-[#6a9bd6]" />
                Secure
              </span>

              <span className="h-1 w-1 rounded-full bg-[#ccd2da]" />

              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[#6a9bd6]" />
                Personal reply
              </span>
            </div>
          </div>
        </section>

        {/* How Wecall works */}
        <section className="mt-4 rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_15px_45px_rgba(54,91,139,0.09)] backdrop-blur sm:p-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6f8fb9]">
              Simple & personal
            </p>

            <h2 className="mt-1 text-[21px] font-bold tracking-[-0.03em] text-[#172238]">
              How Wecall works
            </h2>

            <p className="mt-1.5 text-[13px] leading-5 text-[#7c899c]">
              Connect directly with creators you want to hear from.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#3978d8]">
                <MessageCircle size={18} />
              </div>

              <div className="pt-0.5">
                <h3 className="text-[14px] font-bold text-[#263447]">
                  1. Send a message
                </h3>

                <p className="mt-1 text-[12px] leading-5 text-[#7d8a9d]">
                  Ask your question or send a message to {creator.name}.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#3978d8]">
                <WalletCards size={18} />
              </div>

              <div className="pt-0.5">
                <h3 className="text-[14px] font-bold text-[#263447]">
                  2. Pay for the reply
                </h3>

                <p className="mt-1 text-[12px] leading-5 text-[#7d8a9d]">
                  Your payment is connected to the reply you are requesting.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ff] text-[#3978d8]">
                <Clock3 size={18} />
              </div>

              <div className="pt-0.5">
                <h3 className="text-[14px] font-bold text-[#263447]">
                  3. Get a personal response
                </h3>

                <p className="mt-1 text-[12px] leading-5 text-[#7d8a9d]">
                  Once {creator.name} replies, you can continue the
                  conversation.
                </p>
              </div>
            </div>
          </div>

          {/* Small reassurance */}
          <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-[#f5f9ff] px-4 py-3.5">
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#5790d6]" />

            <p className="text-[11px] leading-5 text-[#71819a]">
              Wecall keeps the experience simple, direct and focused on
              meaningful conversations.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-3 pb-4 pt-8 text-center">
          <p className="text-[11px] font-medium text-[#7f8da1]">
            © 2026 Wecall · All rights reserved.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-semibold">
            <a
              href="mailto:support@popcall.com"
              className="text-[#5f7695] transition hover:text-[#3978d8]"
            >
              Contact Us
            </a>

            <span className="text-[#c2cad5]">•</span>

            <a
              href="https://popcall.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5f7695] transition hover:text-[#3978d8]"
            >
              Privacy Policy
            </a>

            <span className="text-[#c2cad5]">•</span>

            <a
              href="https://popcall.com/legal/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5f7695] transition hover:text-[#3978d8]"
            >
              Terms of Service
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
