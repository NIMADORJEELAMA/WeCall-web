"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/axios";

interface Creator {
  id: string;
  name: string;
  username: string;
  bio: string | null;
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

    // We will implement authentication + conversation
    // creation in the next step.
    console.log("Message creator:", creator.id);

    router.push(`/dashboard/user/message/${creator.id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
          <p className="text-sm text-slate-500">Loading creator...</p>
        </div>
      </main>
    );
  }

  if (error || !creator) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-5">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <MessageCircle size={30} className="text-slate-400" />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Creator not found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This creator link may be invalid or the creator may currently be
            unavailable.
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Go Home
          </button>
        </div>
      </main>
    );
  }

  const price = Number(creator.replyPrice).toFixed(2);

  const image = creator.profileImage || creator.avatarUrl || null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:py-14">
      <div className="mx-auto w-full max-w-lg">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Profile Header */}
          <div className="px-6 pt-8 text-center">
            {/* Avatar */}
            <div className="relative mx-auto h-24 w-24">
              {image ? (
                <img
                  src={image}
                  alt={creator.name}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-50"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-3xl font-bold text-white ring-4 ring-slate-50">
                  {creator.name?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                <BadgeCheck
                  size={21}
                  className="text-slate-900"
                  fill="currentColor"
                  stroke="white"
                />
              </div>
            </div>

            {/* Name */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <h1 className="text-xl font-bold text-slate-900">
                {creator.name}
              </h1>

              <BadgeCheck size={17} className="text-slate-700" />
            </div>

            {/* Username */}
            <p className="mt-1 text-sm text-slate-500">@{creator.username}</p>

            {/* Category */}
            {creator.category && (
              <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {creator.category}
              </div>
            )}

            {/* Bio */}
            {creator.bio && (
              <p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-slate-600">
                {creator.bio}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 my-7 border-t border-slate-100" />

          {/* Pricing */}
          <div className="px-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Personal reply
            </p>

            <div className="mt-1">
              <span className="text-3xl font-bold text-slate-900">
                ${price}
              </span>

              <span className="ml-1 text-sm text-slate-500">/ reply</span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Send a question and get a personal response.
            </p>
          </div>

          {/* Message Button */}
          <div className="px-6 pb-7 pt-6">
            <button
              onClick={handleMessage}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
            >
              <MessageCircle size={19} />
              Message {creator.name}
            </button>

            {/* Trust */}
            <div className="mt-4 flex items-center justify-center gap-5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} />
                Secure
              </span>

              <span>•</span>

              <span>Personal reply</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Powered by Wecall
        </p>
      </div>
    </main>
  );
}
