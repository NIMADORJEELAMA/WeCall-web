"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  Mail,
  UserRound,
  AtSign,
  DollarSign,
  ChevronLeft,
} from "lucide-react";

import axiosInstance from "../../../../lib/axios";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: "USER" | "CREATOR";
  status: string;
  avatarUrl: string | null;
  createdAt: string;
  creatorProfile: {
    id: string;
    username: string;
    replyPrice: string | number;
  } | null;
}

export default function EditProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [replyPrice, setReplyPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ------------------------------------------
  // Fetch profile
  // ------------------------------------------

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosInstance.get("/users/profile");

        const data: ProfileData = response.data;

        setProfile(data);

        setName(data.name || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatarUrl || "");

        if (data.creatorProfile) {
          setUsername(data.creatorProfile.username || "");

          setReplyPrice(
            data.creatorProfile.replyPrice !== undefined &&
              data.creatorProfile.replyPrice !== null
              ? String(data.creatorProfile.replyPrice)
              : "",
          );
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);

        setError(
          err?.response?.data?.message || "Unable to load your profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ------------------------------------------
  // Save profile
  // ------------------------------------------

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (profile?.role === "CREATOR") {
      if (!username.trim()) {
        setError("Username is required.");
        return;
      }

      if (!replyPrice.trim()) {
        setError("Reply price is required.");
        return;
      }

      const price = Number(replyPrice);

      if (Number.isNaN(price) || price < 0) {
        setError("Please enter a valid reply price.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl.trim() || null,
      };

      if (profile?.role === "CREATOR") {
        payload.creatorProfile = {
          username: username.trim(),
          replyPrice: Number(replyPrice),
        };
      }

      const response = await axiosInstance.patch("/users/profile", payload);

      const updatedProfile: ProfileData = response.data;

      setProfile(updatedProfile);

      setName(updatedProfile.name || "");
      setEmail(updatedProfile.email || "");
      setAvatarUrl(updatedProfile.avatarUrl || "");

      if (updatedProfile.creatorProfile) {
        setUsername(updatedProfile.creatorProfile.username || "");

        setReplyPrice(String(updatedProfile.creatorProfile.replyPrice ?? ""));
      }

      setSuccess("Profile updated successfully.");
    } catch (err: any) {
      console.error("Failed to update profile:", err);

      const message =
        err?.response?.data?.message || "Unable to update your profile.";

      setError(Array.isArray(message) ? message.join(", ") : message);
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------
  // Loading
  // ------------------------------------------

  if (loading) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-4xl items-center justify-center bg-[#f7f9fc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#1877c9]" />

          <p className="text-sm font-medium text-[#8792a3]">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // Error without profile
  // ------------------------------------------

  if (!profile) {
    return (
      <div className="mx-auto flex h-[100dvh] w-full max-w-4xl items-center justify-center bg-[#f7f9fc] px-5">
        <div className="text-center">
          <p className="text-sm font-medium text-red-500">
            {error || "Unable to load profile."}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 rounded-full bg-[#1877c9] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // Initials
  // ------------------------------------------

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
      <header className="relative shrink-0 overflow-hidden bg-gradient-to-b from-[#cfe3ff] via-[#e6f0ff] to-[#f7f9fc] px-5 pt-[calc(0.5em+env(safe-area-inset-top))] pb-1">
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/70 bg-white/55 text-[#33445f] shadow-[0_6px_18px_rgba(56,88,130,0.08)] backdrop-blur-sm transition hover:bg-white active:scale-95"
          >
            <ChevronLeft size={22} strokeWidth={1.9} />
          </button>

          <div>
            <h1 className="text-[25px] font-bold tracking-[-0.04em] text-[#172238]">
              Edit Profile
            </h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-3">
        {/* Avatar */}
        <section className="rounded-[26px] border border-white bg-white px-5 py-6 shadow-[0_8px_30px_rgba(35,57,84,0.06)]">
          <div className="flex flex-col items-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "Profile"}
                  className="h-[96px] w-[96px] rounded-full border-4 border-white object-cover shadow-[0_8px_24px_rgba(35,57,84,0.12)]"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="grid h-[96px] w-[96px] place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#bcdcff] to-[#7faee4] text-xl font-bold text-[#315476] shadow-[0_8px_24px_rgba(35,57,84,0.12)]">
                  {initials || "U"}
                </div>
              )}

              <div className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-[#1877c9] text-white shadow-md">
                <Camera size={15} strokeWidth={2} />
              </div>
            </div>

            <p className="mt-3 text-xs text-[#8b96a6]">
              Add a profile image URL below
            </p>
          </div>

          <div className="mt-5">
            <InputField
              icon={<Camera size={18} />}
              label="Avatar URL"
              value={avatarUrl}
              onChange={setAvatarUrl}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
          </div>
        </section>

        {/* Personal information */}
        <section className="mt-4 rounded-[26px] border border-white bg-white px-5 py-5 shadow-[0_8px_30px_rgba(35,57,84,0.05)]">
          <div className="mb-4">
            <h2 className="text-[16px] font-bold text-[#172238]">
              Personal Information
            </h2>

            <p className="mt-0.5 text-xs text-[#8b96a6]">
              Your basic account information
            </p>
          </div>

          <div className="space-y-4">
            <InputField
              icon={<UserRound size={18} />}
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="Your name"
            />

            <InputField
              icon={<Mail size={18} />}
              label="Email Address"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              type="email"
            />
          </div>
        </section>

        {/* Creator information */}
        {profile.role === "CREATOR" && (
          <section className="mt-4 rounded-[26px] border border-white bg-white px-5 py-5 shadow-[0_8px_30px_rgba(35,57,84,0.05)]">
            <div className="mb-4">
              <h2 className="text-[16px] font-bold text-[#172238]">
                Creator Information
              </h2>

              <p className="mt-0.5 text-xs text-[#8b96a6]">
                Information shown on your creator profile
              </p>
            </div>

            <div className="space-y-4">
              <InputField
                icon={<AtSign size={18} />}
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="yourusername"
              />

              <InputField
                icon={<DollarSign size={18} />}
                label="Reply Price"
                value={replyPrice}
                onChange={setReplyPrice}
                placeholder="5.00"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
          </section>
        )}

        {/* Messages */}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
            <Check size={17} />
            {success}
          </div>
        )}

        {/* Save */}
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#1877c9] px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,201,0.2)] transition hover:bg-[#126bb7] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check size={18} strokeWidth={2.2} />
              Save Changes
            </>
          )}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => router.back()}
          className="mt-2 w-full rounded-[18px] px-5 py-3 text-sm font-semibold text-[#718099] transition hover:bg-white hover:text-[#33445f]"
        >
          Cancel
        </button>
      </main>
    </div>
  );
}

function InputField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-[#64748b]">
        {label}
      </label>

      <div className="flex items-center gap-3 rounded-[16px] border border-[#e8edf3] bg-[#f9fbfd] px-3.5 transition focus-within:border-[#8bbce8] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#1877c9]/5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf5fc] text-[#1877c9]">
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          min={min}
          step={step}
          className="h-12 min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#263447] outline-none placeholder:text-[#aab4c2]"
        />
      </div>
    </div>
  );
}
