"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUsers";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Wallet,
  History,
  User as UserIcon,
  Clock,
  Edit3,
  Mail,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StaffModal from "@/components/staff/StaffModal";

export default function StaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: user, isLoading, refetch } = useUser(id as string);
  const [activeTab, setActiveTab] = useState<"attendance" | "advances">(
    "attendance",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading)
    return (
      <div className="p-10 text-center animate-pulse text-slate-500">
        Loading Employee Profile...
      </div>
    );
  if (!user) return <div className="p-10 text-center">Employee not found.</div>;

  return (
    <div className="min-h-screen bg-[#fcfcfd] p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-full w-10 h-10 p-0 hover:bg-white shadow-sm border border-slate-200"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
              {user.isActive ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <XCircle size={16} className="text-slate-400" />
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Shield size={14} /> {user.role} • <Mail size={14} /> {user.email}
            </p>
          </div>
        </div>

        <Button
          variant="terminal"
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Edit3 size={16} /> Edit Profile & Daily Rate
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Daily Rate"
          value={user.dailyRate}
          icon={<IndianRupee size={16} />}
          color="blue"
          isCurrency
        />
        <StatsCard
          title="Days Present"
          value={user.stats.totalDaysPresent}
          icon={<Calendar size={16} />}
          color="indigo"
        />
        <StatsCard
          title="Total Advances"
          value={user.stats.totalAdvances}
          icon={<Wallet size={16} />}
          color="red"
          isCurrency
        />
        <StatsCard
          title="Net Due Salary"
          value={user.stats.netDue}
          icon={<History size={16} />}
          color={user.stats.netDue >= 0 ? "emerald" : "red"}
          isCurrency
        />
      </div>

      {/* Content Section */}
      <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <TabButton
            active={activeTab === "attendance"}
            onClick={() => setActiveTab("attendance")}
            label={`Attendance (${user.attendances?.length || 0})`}
          />
          <TabButton
            active={activeTab === "advances"}
            onClick={() => setActiveTab("advances")}
            label={`Advances (${user.pettyCashLogs?.length || 0})`}
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

      {/* Edit Modal - Reusing your existing StaffModal */}
      <StaffModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          refetch(); // Refresh data after edit
        }}
        editingUser={user}
      />
    </div>
  );
}

// --- Sub-Components ---

function StatsCard({ title, value, icon, color, isCurrency }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    red: "text-red-600 bg-red-50 border-red-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
  };

  return (
    <div
      className={`bg-white p-5 rounded-2xl border ${colors[color]} shadow-sm`}
    >
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {title}
        </p>
        <div className={`p-2 rounded-lg border ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-2">
        {isCurrency ? `₹${Math.abs(value).toLocaleString()}` : value}
        {isCurrency && value < 0 && (
          <span className="text-xs text-red-500 ml-1">(Debt)</span>
        )}
      </p>
    </div>
  );
}

function AttendanceTable({ data }: { data: any[] }) {
  if (!data?.length)
    return (
      <div className="py-10 text-center text-slate-400 italic">
        No attendance records recorded.
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-100">
            <th className="pb-4 font-bold uppercase text-[10px]">Date</th>
            <th className="pb-4 font-bold uppercase text-[10px]">Check In</th>
            <th className="pb-4 font-bold uppercase text-[10px]">Check Out</th>
            <th className="pb-4 font-bold uppercase text-[10px]">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((record) => (
            <tr
              key={record.id}
              className="group hover:bg-slate-50/50 transition-colors"
            >
              <td className="py-4 font-medium text-slate-900">
                {new Date(record.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-4 text-emerald-600 font-mono text-xs">
                {new Date(record.checkIn).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-4 text-slate-500 font-mono text-xs">
                {record.checkOut
                  ? new Date(record.checkOut).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </td>
              <td className="py-4">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${record.checkOut ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700 animate-pulse"}`}
                >
                  {record.checkOut ? "COMPLETED" : "PRESENT"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdvanceLogs({ data }: { data: any[] }) {
  if (!data?.length)
    return (
      <div className="py-10 text-center text-slate-400 italic">
        No salary advances recorded.
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {data.map((log) => (
        <div
          key={log.id}
          className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 hover:border-red-200 transition-all shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full text-red-500">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                ₹{log.amount.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 uppercase font-medium">
                {new Date(log.createdAt).toDateString()}
              </p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">
                "{log.reason}"
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${
        active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 mx-8" />
      )}
    </button>
  );
}
