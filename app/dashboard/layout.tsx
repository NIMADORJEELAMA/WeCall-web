// app/dashboard/layout.tsx

"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div
        className="fixed inset-0 h-[100dvh] min-h-[100svh] w-full overflow-hidden bg-white"
        style={{
          height: "100dvh",
          minHeight: "100svh",
          maxHeight: "100dvh",
          overscrollBehavior: "none",
        }}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />

        <style jsx global>{`
          html,
          body {
            width: 100%;
            min-width: 100%;
            min-height: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff;
            overflow: hidden;
          }

          body {
            overscroll-behavior: none;
            -webkit-overflow-scrolling: auto;
          }

          #__next {
            width: 100%;
            min-height: 100%;
            height: 100%;
            background: #ffffff;
          }
        `}</style>

        <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-white">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
            <main
              className="flex min-h-0 flex-1 overflow-hidden p-0"
              style={{ overscrollBehavior: "none" }}
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
