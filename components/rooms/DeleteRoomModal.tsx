// components/rooms/DeleteRoomModal.tsx

"use client";
import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DeleteRoomModal({
  room,
  isOpen,
  onClose,
  onDelete,
}: any) {
  const [confirmText, setConfirmText] = useState("");
  const isValid = confirmText === room.roomNumber;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] p-8 border border-red-100 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-red-50 text-red-500 rounded-full">
            <AlertTriangle size={40} />
          </div>

          <h2 className="text-2xl font-black   uppercase text-slate-900">
            Critical Action
          </h2>

          <p className="text-sm text-slate-500 font-medium">
            You are about to permanently delete{" "}
            <span className="font-bold text-slate-900">
              Room {room.roomNumber}
            </span>
            . This cannot be undone. All linked data will be lost.
          </p>

          <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
              Type "{room.roomNumber}" to confirm
            </p>
            <input
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-center font-black text-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Room Number"
            />
          </div>

          <div className="flex w-full gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-900 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={!isValid}
              onClick={() => onDelete(room.id)}
              className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                isValid
                  ? "bg-red-600 text-white shadow-red-200"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
