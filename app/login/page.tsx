"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios"; // Using your configured axios instance
import { Loader2, Lock, Mail, ShieldCheck, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token, user } = response.data;

      // Save credentials
      // localStorage.setItem("token", access_token);
      // localStorage.setItem("user", JSON.stringify(user));

      localStorage.setItem("access_token", response.data.access_token);

      localStorage.setItem("user", JSON.stringify(response.data.user));

      // toast.success("Authentication successful. Welcome back!");

      // Role-Based Redirect
      switch (user.role) {
        case "ADMIN":
          router.push("/dashboard/admin");
          break;
        case "CREATOR":
          router.push("/dashboard/creator-dashboard");
          break;
        case "USER":
        default:
          router.push("/dashboard/user");
          break;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* LEFT SIDE: BRANDING VISUAL */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <MessageCircle size={20} />
          </div>
          <span className="text-xl font-black text-white uppercase tracking-tighter italic">
            WeCall
          </span>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase italic mb-6">
            Connect directly <br />
            <span className="text-blue-500">with top creators.</span>
          </h2>
          <p className="text-slate-400 max-w-md font-medium leading-relaxed">
            The premium pay-per-reply messaging platform. Escrow-backed payments
            guarantee you get a response or your money back.
          </p>
        </div>

        <div className="relative z-10 flex gap-4">
          <div className="h-1 w-12 bg-blue-600 rounded-full" />
          <div className="h-1 w-4 bg-slate-800 rounded-full" />
          <div className="h-1 w-4 bg-slate-800 rounded-full" />
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/30">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
              Platform Login
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="h-14 pl-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-blue-500/20 transition-all font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Security Password
                  </label>
                  <button
                    type="button"
                    className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="h-14 pl-12 rounded-2xl border-slate-200 bg-white focus-visible:ring-blue-500/20 transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <ShieldCheck className="mr-2" size={18} /> Authenticate
                  Session
                </>
              )}
            </Button>
          </form>

          <div className="pt-8 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Secure 256-bit Encryption • Escrow Protected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
