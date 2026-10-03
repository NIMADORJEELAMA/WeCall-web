// app/dashboard/layout.tsx

"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div
        className="fixed inset-0 w-full overflow-hidden bg-gradient-to-b from-[#cfe3ff] via-[#e8f1ff] to-[#f7f9fc]"
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
          html {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: #cfe3ff;
            overflow: hidden;
          }

          body {
            width: 100%;
            min-width: 100%;
            height: 100%;
            min-height: 100%;
            margin: 0;
            padding: 0;
            background: #cfe3ff;
            overflow: hidden;
            overscroll-behavior: none;
            -webkit-overflow-scrolling: auto;
          }

          #__next {
            width: 100%;
            height: 100%;
            min-height: 100%;
            background: #cfe3ff;
          }

          /* iOS safe areas */
          @supports (padding: env(safe-area-inset-top)) {
            body {
              background: #cfe3ff;
            }
          }
        `}</style>

        <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-transparent">
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
            <main
              className="flex min-h-0 flex-1 overflow-hidden bg-white p-0"
              style={{
                overscrollBehavior: "none",
              }}
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
