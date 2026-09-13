"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { X, Loader2, Banknote, Info } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";

export default function PettyCashModal({ isOpen, onClose, users }: any) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    userId: "",
    amount: "",
    reason: "",
    isExpense: false, // Default to Staff Advance
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // We map the UI 'isExpense' toggle to a category string for the backend
      const payload = {
        ...data,
        category: data.isExpense ? "GENERAL_EXPENSE" : "STAFF_ADVANCE",
        amount: Number(data.amount),
      };
      return api.post("/operations/petty-cash", payload);
    },
    onSuccess: () => {
      toast.success("Transaction recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["petty-cash"] });
      setForm({ userId: "", amount: "", reason: "", isExpense: false }); // Reset form
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-auto max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Log Cash Outflow
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              Record expenses or advances
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
          className="p-6 space-y-5"
        >
          {/* TYPE SELECTOR TOGGLE */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Transaction Type
            </label>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setForm({ ...form, isExpense: false })}
                className={`flex-1 py-2.5 text-[11px] font-bold uppercase rounded-xl transition-all ${
                  !form.isExpense
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Staff Advance
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, isExpense: true })}
                className={`flex-1 py-2.5 text-[11px] font-bold uppercase rounded-xl transition-all ${
                  form.isExpense
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Business Expense
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-800 uppercase">
              {form.isExpense ? "Handed To / Authorized By" : "Staff Member"}
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
            >
              <option value="">Select person...</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-800 uppercase">
              Amount (₹)
            </label>
            <input
              type="number"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="Enter amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-800 uppercase">
              Description / Reason
            </label>
            <textarea
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              placeholder={
                form.isExpense
                  ? "e.g. Paid labor for table fixing, Kitchen repair..."
                  : "e.g. Monthly salary advance"
              }
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
            {form.isExpense && (
              <p className="text-[10px] text-slate-400 italic">
                This will be flagged as a business cost in reports.
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={mutation.isPending}
            className={`w-full h-12 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${
              form.isExpense
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <div className="flex items-center gap-2">
                <Banknote size={16} />
                {form.isExpense
                  ? "Record Business Expense"
                  : "Record Staff Advance"}
              </div>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
