"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from "lucide-react";
import api from "@/lib/axios";

// TypeScript interfaces for Admin data
interface PlatformStats {
  totalUsers: number;
  activeCreators: number;
  messagesInEscrow: number;
  escrowVolume: number; // Funds currently held on cards
  platformRevenue: number; // Fees captured
}

interface RecentTransaction {
  id: string;
  amount: number;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REFUNDED";
  createdAt: string;
  user: { name: string };
  message: { creator: { name: string } };
}

export default function AdminDashboard() {
  // Fetch high-level platform stats
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Expecting a NestJS route: GET /admin/stats
      const res = await api.get("/admin/stats");
      return res.data;
    },
    // Fallback placeholder data for UI visualization while building
    initialData: {
      totalUsers: 1245,
      activeCreators: 87,
      messagesInEscrow: 342,
      escrowVolume: 8550.0,
      platformRevenue: 12450.5,
    },
  });

  // Fetch recent financial transactions
  const { data: transactions = [], isLoading: txLoading } = useQuery<
    RecentTransaction[]
  >({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      // Expecting a NestJS route: GET /admin/recent-transactions
      const res = await api.get("/admin/recent-transactions");
      return res.data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
            Escrow Hold
          </span>
        );
      case "SUCCEEDED":
        return (
          <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
            Captured
          </span>
        );
      case "REFUNDED":
        return (
          <span className="text-xs font-medium text-slate-600 bg-slate-200 px-2 py-1 rounded-md">
            Released
          </span>
        );
      default:
        return (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 min-h-screen font-sans text-slate-800">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Platform Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor marketplace liquidity, creator growth, and transaction health.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 transition-all hover:bg-white/80">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CreditCard size={24} strokeWidth={1.5} />
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <ArrowUpRight size={14} className="mr-1" /> +12%
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">
            Total Platform Revenue
          </p>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">
            $
            {stats.platformRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </h2>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 transition-all hover:bg-white/80">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Activity size={24} strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-500">Funds in Escrow</p>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">
            $
            {stats.escrowVolume.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Across {stats.messagesInEscrow} pending requests
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 transition-all hover:bg-white/80">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Users size={24} strokeWidth={1.5} />
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <ArrowUpRight size={14} className="mr-1" /> +4/wk
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Active Creators</p>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">
            {stats.activeCreators}
          </h2>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 transition-all hover:bg-white/80">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <ShieldAlert size={24} strokeWidth={1.5} />
            </div>
            <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
              Action Needed
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Disputes / Flags</p>
          <h2 className="text-3xl font-semibold tracking-tight mt-1">0</h2>
        </div>
      </div>

      {/* Transaction Data Table */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <h3 className="font-semibold text-slate-900">
            Recent Ledger Activity
          </h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            View All &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Fan</th>
                <th className="px-6 py-4 font-semibold">Creator</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {txLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No recent transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {tx.id.split("-")[0]}...
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {tx.user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      @{tx.message.creator.name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ${tx.amount}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
