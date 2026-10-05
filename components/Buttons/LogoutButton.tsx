"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import { useSocket } from "@/components/providers/SocketProvider";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({
  className = "",
  children = "Sign Out",
}: LogoutButtonProps) {
  const router = useRouter();
  const { disconnect } = useSocket();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // Clear the HttpOnly authentication cookie on the backend.
      await api.post("/auth/logout");
    } catch (error) {
      // Even if the server request fails, disconnect locally
      // and send the user back to login.
      console.error("Logout request failed:", error);
    } finally {
      // Stop all realtime communication.
      disconnect();

      // Notify auth-aware components.
      window.dispatchEvent(new Event("auth-changed"));

      // Redirect to login.
      router.replace("/login");
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
    >
      {isLoggingOut ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut size={16} />
          {children}
        </>
      )}
    </button>
  );
}
