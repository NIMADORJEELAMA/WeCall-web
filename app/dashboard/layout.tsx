// app/dashboard/layout.tsx

"use client";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Toaster } from "react-hot-toast"; // 1. Import the Toaster
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        {/* 2. Place Toaster here so it's globally accessible */}
        <Toaster
          position="top-right"
          toastOptions={{
            // Professional styling for minizeo
            duration: 4000,
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />

        {/* <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} /> */}
        {/* <Sidebar /> */}
        <div className="fixed inset-0 h-[100dvh]   overflow-hidden">
          <div className="flex h-full min-h-0   overflow-hidden">
            <main className="flex min-h-0 flex-1 overflow-hidden p-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
