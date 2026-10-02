"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Crown,
  FileText,
  LogOut,
  Pencil,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import BottomTabBar from "../../../components/CreatorDashboard/BottomTabBar";

interface ProfileScreenProps {
  name?: string;
  username?: string;
  avatarUrl?: string | null;
  isCreator?: boolean;
  onLogout?: () => void;
}

export default function ProfileScreen({
  name = "Nima Dorjee Lama",
  username = "@nima.lama",
  avatarUrl = null,
  isCreator = true,
  onLogout,
}: ProfileScreenProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto flex h-[100dvh] min-h-0 w-full max-w-4xl flex-col overflow-hidden bg-[#f7f9fc] md:shadow-[0_0_50px_rgba(35,57,84,0.08)]">
      {/* Header */}
      <header className="relative shrink-0 overflow-hidden bg-gradient-to-b from-[#cfe3ff] via-[#e6f0ff] to-[#f7f9fc] px-5  pt-[calc(0.5em+env(safe-area-inset-top))]">
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-white/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-10 h-36 w-36 rounded-full bg-white/25 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="mt-0.5 text-[26px] font-bold tracking-[-0.045em] text-[#172238]">
              Profile
            </h1>
          </div>

          <Link
            href="/settings"
            aria-label="Settings"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/55 text-[#33445f] shadow-[0_6px_18px_rgba(56,88,130,0.08)] backdrop-blur-sm transition hover:bg-white active:scale-95"
          >
            <Settings size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      {/* Scrollable profile content */}
      <div
        className="
    mt-2
    min-h-0
    flex-1
    overflow-y-auto
    overscroll-contain
    px-4
    pb-28
    scrollbar-thin
  "
      >
        {/* Profile card */}
        <section className="relative rounded-[28px] border border-white bg-white px-5 pb-6 pt-0 shadow-[0_8px_30px_rgba(35,57,84,0.06)]">
          <div className="  flex justify-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="h-[92px] w-[92px] rounded-full border-4 border-white object-cover shadow-[0_8px_24px_rgba(35,57,84,0.12)]"
                />
              ) : (
                <div className="grid h-[92px] w-[92px] place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#bcdcff] to-[#7faee4] text-xl font-bold text-[#315476] shadow-[0_8px_24px_rgba(35,57,84,0.12)]">
                  {initials}
                </div>
              )}
            </div>
          </div>

          <div className="mt-1 text-center">
            <h2 className="text-[22px] font-bold tracking-[-0.025em] text-[#172238]">
              {name}
            </h2>

            <p className="mt-0.5 text-sm text-[#8792a3]">{username}</p>

            {isCreator && (
              <>
                {/* <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#eaf3ff] px-4 py-2 text-[13px] font-semibold text-[#1769e0]">
                  <Crown size={15} strokeWidth={2.2} />
                  Creator
                </div> */}

                {/* Pricing pills */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="rounded-full bg-[#1877c9] px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm">
                    $15.15/Msg
                  </span>

                  <span className="rounded-full bg-[#1877c9] px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm">
                    $1.00/Min
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Account section */}
        <section className="mt-4 overflow-hidden rounded-[22px] border border-[#edf0f3] bg-white shadow-[0_4px_18px_rgba(35,57,84,0.035)]">
          <ProfileRow
            icon={<UserRound size={20} />}
            label="Edit Profile"
            href="/profile/edit"
          />

          <ProfileRow
            icon={<CreditCard size={20} />}
            label="Payment Methods"
            href="/settings/payment-methods"
          />
        </section>

        {/* Support section */}
        <section className="mt-4 overflow-hidden rounded-[22px] border border-[#edf0f3] bg-white shadow-[0_4px_18px_rgba(35,57,84,0.035)]">
          <ProfileRow
            icon={<CircleHelp size={20} />}
            label="Help & Support"
            href="/help"
          />
          <ProfileRow
            icon={<FileText size={20} />}
            label="Terms & Privacy"
            href="/terms"
          />
          <ProfileRow
            icon={<ShieldCheck size={20} />}
            label="Privacy & Security"
            href="/settings/privacy"
          />

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-4 border-t border-[#edf0f3] px-5 py-4 text-left transition hover:bg-[#fff7f7] active:bg-[#fff2f2]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff0f0] text-[#ef4444]">
              <LogOut size={19} strokeWidth={1.9} />
            </span>

            <span className="flex-1 text-[14px] font-semibold text-[#ef4444]">
              Logout
            </span>

            <ChevronRight size={18} className="text-[#f28a8a]" />
          </button>
        </section>
      </div>

      <BottomTabBar />
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 border-b border-[#edf0f3] px-5 py-4 transition last:border-b-0 hover:bg-[#fafbfc] active:bg-[#f4f6f8]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f0f5fb] text-[#526b8b]">
        {icon}
      </span>

      <span className="flex-1 text-[14px] font-semibold text-[#282d35]">
        {label}
      </span>

      <ChevronRight size={18} className="text-[#9aa5b4]" />
    </Link>
  );
}
