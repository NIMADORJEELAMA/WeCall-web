"use client";

import { useParams, useRouter } from "next/navigation";
import { useCustomer } from "@/hooks/useCustomers";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  History,
  User as UserIcon,
  ShoppingBag,
  Star,
  Bed,
  Phone,
  Mail,
  MapPin,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// Assuming you have a generic CustomerModal or similar for editing
import CustomerModal from "../CustomerModal";

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: user, isLoading, refetch } = useCustomer(id as string);
  const [activeTab, setActiveTab] = useState<"orders" | "bookings">("orders");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading)
    return (
      <div className="p-10 text-center animate-pulse text-slate-500">
        Loading Customer Profile...
      </div>
    );

  if (!user) return <div className="p-10 text-center">Customer not found.</div>;

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
              {user.isVip && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  VIP
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Phone size={14} /> {user.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail size={14} /> {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {user.address}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 bg-white"
        >
          Edit Customer Details
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Spent"
          value={user.totalSpent}
          icon={<IndianRupee size={16} />}
          color="emerald"
          isCurrency
        />
        <StatsCard
          title="Loyalty Points"
          value={user.loyaltyPoints}
          icon={<Star size={16} />}
          color="blue"
        />
        <StatsCard
          title="Total Visits"
          value={user.visitCount}
          icon={<History size={16} />}
          color="indigo"
        />
        <StatsCard
          title="Active Bookings"
          value={
            user.bookings?.filter((b: any) => b.status === "CHECKED_IN")
              .length || 0
          }
          icon={<Bed size={16} />}
          color="amber"
        />
      </div>

      {/* Content Section */}
      <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <TabButton
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            label={`Orders (${user.orders?.length || 0})`}
          />
          <TabButton
            active={activeTab === "bookings"}
            onClick={() => setActiveTab("bookings")}
            label={`Stay History (${user.bookings?.length || 0})`}
          />
        </div>

        <div className="p-6">
          {activeTab === "orders" ? (
            <OrdersTable data={user.orders} />
          ) : (
            <BookingsTable data={user.bookings} />
          )}
        </div>
      </div>

      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          refetch();
        }}
        editingCustomer={user}
      />
    </div>
  );
}

// --- Sub-Components ---

function StatsCard({ title, value, icon, color, isCurrency }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
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
        {isCurrency ? `₹${value.toLocaleString()}` : value}
      </p>
    </div>
  );
}

function OrdersTable({ data }: { data: any[] }) {
  if (!data?.length)
    return (
      <div className="py-10 text-center text-slate-400 italic">
        No orders found.
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-slate-400 border-b border-slate-100">
            <th className="pb-4 font-bold uppercase text-[10px]">Order #</th>
            <th className="pb-4 font-bold uppercase text-[10px]">Order ID</th>

            <th className="pb-4 font-bold uppercase text-[10px]">Date</th>
            <th className="pb-4 font-bold uppercase text-[10px]">Amount</th>
            <th className="pb-4 font-bold uppercase text-[10px]">Payment</th>
            <th className="pb-4 font-bold uppercase text-[10px]">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((order) => (
            <tr
              key={order.id}
              className="group hover:bg-slate-50/50 transition-colors"
            >
              <td className="py-4 font-mono text-xs text-slate-600">
                #{order.orderNumber}
              </td>
              <td className="py-4 font-medium text-slate-900">
                {order.id.slice(-5)}
              </td>
              <td className="py-4 font-medium text-slate-900">
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-4 font-bold text-slate-900">
                ₹{order.totalAmount}
              </td>
              <td className="py-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                  {order.paymentMode}
                </span>
              </td>
              <td className="py-4 text-xs text-slate-500 italic">
                {order.note || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingsTable({ data }: { data: any[] }) {
  if (!data?.length)
    return (
      <div className="py-10 text-center text-slate-400 italic">
        No booking history.
      </div>
    );

  return (
    <div className="space-y-3">
      {data.map((booking) => (
        <div
          key={booking.id}
          className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-100 transition-all shadow-sm gap-4"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-full text-blue-500 mt-1">
              <Bed size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">Room Booking</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${booking.status === "CHECKED_IN" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {booking.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Calendar size={12} />
                {new Date(booking.checkIn).toLocaleDateString()} →{" "}
                {new Date(booking.checkOut).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 px-4 border-l border-slate-50">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                ID Provided
              </p>
              <p className="text-xs font-medium text-slate-700 uppercase">
                {booking.documentType}: {booking.documentId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Advance
              </p>
              <p className="text-sm font-bold text-emerald-600">
                ₹{booking.advanceAmount}
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
