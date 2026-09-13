"use client";
import { useState } from "react";
import {
  CalendarCheck,
  WalletCards,
  Banknote,
  Plus,
  Search,
  Filter,
} from "lucide-react";
// import AttendanceTab from "@/components/operations/AttendanceTab";
import PettyCashTab from "@/components/operations/PettyCashTab";
import AttendanceTab from "@/components/operations/AttendanceTab";
import PayrollTab from "@/components/operations/PayrollTab";
// import PayrollTab from "@/components/operations/PayrollTab";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<"attendance" | "cash" | "payroll">(
    "attendance",
  );

  return (
    <div className="space-y-6 p-6">
      {/* ENTERPRISE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Operations
          </h1>
          <p className="text-slate-500 text-sm">
            Monitor attendance, mid-day cash, and monthly payroll.
          </p> */}
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <TabButton
            active={activeTab === "attendance"}
            onClick={() => setActiveTab("attendance")}
            icon={<CalendarCheck size={14} />}
            label="Attendance"
          />
          <TabButton
            active={activeTab === "cash"}
            onClick={() => setActiveTab("cash")}
            icon={<WalletCards size={14} />}
            label="Petty Cash"
          />
          <TabButton
            active={activeTab === "payroll"}
            onClick={() => setActiveTab("payroll")}
            icon={<Banknote size={14} />}
            label="Payroll"
          />
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm min-h-[600px]">
        {activeTab === "attendance" && <AttendanceTab />}
        {activeTab === "cash" && <PettyCashTab />}
        {activeTab === "payroll" && <PayrollTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {icon} {label}
    </button>
  );
}
