"use client";
import { useState } from "react";
import { useRegisterUser } from "@/hooks/useUsers";
import { UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function StaffForm() {
  const register = useRegisterUser();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "WAITER",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(form, {
      onSuccess: () => {
        toast.success(`${form.name} registered successfully!`);
        setForm({ name: "", email: "", password: "", role: "WAITER" });
      },
      onError: (err: any) =>
        toast.error(err.response?.data?.message || "Registration failed"),
    });
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
            Full Name
          </label>
          <input
            className="px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm text-black"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
            Email Address
          </label>
          <input
            type="email"
            className="px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm text-black"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
            Password
          </label>
          <input
            type="password"
            className="px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm text-black"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-2">
            Role
          </label>
          <select
            className="px-4 py-3 bg-gray-50 rounded-xl border-none font-bold text-sm text-black cursor-pointer"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="WAITER">WAITER</option>
            <option value="KITCHEN">KITCHEN</option>
            <option value="FRONT_OFFICE">FRONT OFFICE</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={register.isPending}
          className="bg-gray-900 text-white font-black py-3 rounded-xl hover:bg-blue-600 transition disabled:opacity-50 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
        >
          {register.isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <UserPlus size={16} />
          )}
          Add Staff
        </button>
      </form>
    </div>
  );
}
