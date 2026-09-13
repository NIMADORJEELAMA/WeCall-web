"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUsers"; // You'll need to create this hook
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Wallet,
  History,
  User as UserIcon,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function StaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: user, isLoading } = useUser(id as string);
  const [activeTab, setActiveTab] = useState<"attendance" | "advances">(
    "attendance",
  );

  if (isLoading)
    return <div className="p-10 text-center">Loading Profile...</div>;
  if (!user)
    return <div className="p-10 text-center">Staff member not found.</div>;

  const { stats } = user;

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="rounded-full w-10 h-10 p-0"
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">
            {user.role} • {user.email}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Daily Rate"
          value={user.dailyRate}
          icon={<IndianRupee size={16} />}
          color="blue"
        />
        <StatsCard
          title="Days Present"
          value={stats.totalDaysPresent}
          icon={<Calendar size={16} />}
          color="indigo"
        />
        <StatsCard
          title="Total Advances"
          value={stats.totalAdvances}
          icon={<Wallet size={16} />}
          color="red"
        />
        <StatsCard
          title="Net Due Salary"
          value={stats.netDue}
          icon={<History size={16} />}
          color="emerald"
          isCurrency
        />
      </div>

      {/* Main Content Sections */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100">
          <TabButton
            active={activeTab === "attendance"}
            onClick={() => setActiveTab("attendance")}
            label="Attendance Log"
          />
          <TabButton
            active={activeTab === "advances"}
            onClick={() => setActiveTab("advances")}
            label="Salary Advances"
          />
        </div>

        <div className="p-6">
          {activeTab === "attendance" ? (
            <AttendanceTable data={user.attendances} />
          ) : (
            <AdvanceLogs data={user.pettyCashLogs} />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatsCard({ title, value, icon, color, isCurrency }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50",
    red: "text-red-600 bg-red-50",
    emerald: "text-emerald-600 bg-emerald-50",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {title}
        </p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-2">
        {isCurrency ? `₹${value.toLocaleString()}` : value}
      </p>
    </div>
  );
}

function AttendanceTable({ data }: { data: any[] }) {
  return (
    <div className="space-y-4">
      {data.length === 0 && (
        <p className="text-slate-400 text-sm italic">
          No attendance records found.
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-100">
            <th className="pb-3 font-semibold">Date</th>
            <th className="pb-3 font-semibold">Check In</th>
            <th className="pb-3 font-semibold">Check Out</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((record) => (
            <tr key={record.id} className="text-slate-700">
              <td className="py-3">
                {new Date(record.checkIn).toLocaleDateString()}
              </td>
              <td className="py-3 font-medium text-emerald-600">
                {new Date(record.checkIn).toLocaleTimeString()}
              </td>
              <td className="py-3 text-slate-500">
                {record.checkOut
                  ? new Date(record.checkOut).toLocaleTimeString()
                  : "Still On-site"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdvanceLogs({ data }: { data: any[] }) {
  return (
    <div className="space-y-3">
      {data.length === 0 && (
        <p className="text-slate-400 text-sm italic">No advance logs found.</p>
      )}
      {data.map((log) => (
        <div
          key={log.id}
          className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg text-red-500 border border-red-100">
              <IndianRupee size={14} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Salary Advance
              </p>
              <p className="text-[10px] text-slate-500 uppercase">
                {new Date(log.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-red-600">- ₹{log.amount}</p>
        </div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
        active
          ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
          : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
    </button>
  );
}
