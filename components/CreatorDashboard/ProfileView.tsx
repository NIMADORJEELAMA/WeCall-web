// components/CreatorDashboard/ProfileView.tsx
import { User, Shield, CreditCard, LogOut, Settings } from "lucide-react";

interface ProfileViewProps {
  onLogout?: () => void;
}

export function ProfileView({ onLogout }: ProfileViewProps) {
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = storedUser
    ? JSON.parse(storedUser)
    : { name: "Creator", email: "creator@example.com" };

  return (
    <div className="md:col-span-12 flex flex-col bg-white p-6 md:p-10 h-full overflow-y-auto pb-20 md:pb-10">
      <div className="max-w-xl mx-auto w-full space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
            {user.name ? user.name.charAt(0).toUpperCase() : <User size={28} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {user.name || "Creator Profile"}
            </h1>
            <p className="text-xs text-slate-500">
              {user.email ||
                "Manage your creator settings and payout preferences."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Account Management
          </h2>
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl divide-y divide-slate-100 overflow-hidden">
            <button className="w-full p-4 text-left flex items-center justify-between text-sm text-slate-700 hover:bg-slate-100/60 transition-colors">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-slate-500" />
                <span>Preferences & Notifications</span>
              </div>
            </button>
            <button className="w-full p-4 text-left flex items-center justify-between text-sm text-slate-700 hover:bg-slate-100/60 transition-colors">
              <div className="flex items-center gap-3">
                <CreditCard size={18} className="text-slate-500" />
                <span>Payout & Banking Details</span>
              </div>
            </button>
            <button className="w-full p-4 text-left flex items-center justify-between text-sm text-slate-700 hover:bg-slate-100/60 transition-colors">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-slate-500" />
                <span>Security & Password</span>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={
              onLogout ||
              (() => {
                localStorage.removeItem("user");
                window.location.href = "/login";
              })
            }
            className="w-full py-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
