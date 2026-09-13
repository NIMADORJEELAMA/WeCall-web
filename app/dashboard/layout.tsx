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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* <Navbar onMenuClick={() => setMobileOpen((prev) => !prev)} /> */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-0">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
