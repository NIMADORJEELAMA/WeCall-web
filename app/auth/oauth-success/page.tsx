"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function OAuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const completeLogin = async () => {
      try {
        const response = await api.get("/auth/me");

        const user = response.data.user;

        window.dispatchEvent(new Event("auth-changed"));

        switch (user.role) {
          case "ADMIN":
            router.replace("/dashboard/admin");
            break;

          case "CREATOR":
            router.replace("/dashboard/creator-dashboard");
            break;

          case "USER":
          default:
            router.replace("/dashboard/user");
            break;
        }
      } catch (error: any) {
        console.error("OAuth authentication failed:", error);

        alert(
          error?.response?.data?.message ||
            error?.message ||
            "OAuth authentication failed",
        );
      }
    };

    completeLogin();
  }, [router]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

        <h1 className="text-lg font-bold text-slate-900">Signing you in...</h1>

        <p className="mt-2 text-sm text-slate-500">
          Please wait while we complete your Google login.
        </p>
      </div>
    </main>
  );
}
