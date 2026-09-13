// components/Bills/ConfirmPaymentModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Banknote, CreditCard, Split, Loader2 } from "lucide-react";

interface ConfirmPaymentModalProps {
  order: any;
  onClose: () => void;
  onConfirm: (id: string, payload: any) => Promise<void>;
  loading: boolean;
}

export default function ConfirmPaymentModal({
  order,
  onClose,
  onConfirm,
  loading,
}: ConfirmPaymentModalProps) {
  const [mode, setMode] = useState<"CASH" | "UPI" | "SPLIT">("CASH");
  const [cash, setCash] = useState<number>(order?.totalAmount || 0);
  const [online, setOnline] = useState<number>(0);
  const [customerName, setCustomerName] = useState(order?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(
    order?.customerPhone || "",
  );

  const handleConfirm = () => {
    let finalPayload = {
      cash: 0,
      online: 0,
      isDue: false,
      customerName: customerName,
      customerPhone: customerPhone,
    };

    if (mode === "CASH") {
      finalPayload.cash = order.totalAmount;
    } else if (mode === "UPI") {
      finalPayload.online = order.totalAmount;
    } else {
      finalPayload.cash = cash;
      finalPayload.online = online;
    }

    onConfirm(order.id, finalPayload);
  };
  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Confirm Payment: Table {order?.table?.number || "N/A"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Box */}
          <div className="bg-slate-100 p-4 rounded-xl flex justify-between items-center border border-slate-200">
            <span className="text-slate-500 font-medium">Total Amount Due</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{order?.totalAmount?.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                Customer Name
              </Label>
              <Input
                placeholder="Enter name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-9 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase">
                Phone Number
              </Label>
              <Input
                placeholder="98765..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-9 focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Mode Selection */}
          <RadioGroup
            value={mode}
            onValueChange={(val: any) => setMode(val)}
            className="grid grid-cols-1 gap-2"
          >
            <div>
              <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
              <Label
                htmlFor="cash"
                className="flex items-center justify-between p-4 bg-white border-2 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Banknote className="text-emerald-600" size={20} />
                  <span className="font-bold">Cash Payment</span>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem value="UPI" id="upi" className="peer sr-only" />
              <Label
                htmlFor="upi"
                className="flex items-center justify-between p-4 bg-white border-2 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="text-blue-600" size={20} />
                  <span className="font-bold">UPI / Online</span>
                </div>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="SPLIT"
                id="split"
                className="peer sr-only"
              />
              <Label
                htmlFor="split"
                className="flex items-center justify-between p-4 bg-white border-2 rounded-xl cursor-pointer hover:bg-slate-50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Split className="text-amber-600" size={20} />
                  <span className="font-bold">Split Bill</span>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Split Inputs */}
          {mode === "SPLIT" && (
            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400">
                  Cash Part
                </Label>
                <Input
                  type="number"
                  value={cash}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCash(val);
                    setOnline(order.totalAmount - val);
                  }}
                  className="font-mono font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400">
                  Online Part
                </Label>
                <Input
                  type="number"
                  value={online}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setOnline(val);
                    setCash(order.totalAmount - val);
                  }}
                  className="font-mono font-bold"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-emerald-100"
          >
            {loading ? <Loader2 className="mr-2 animate-spin" /> : null}
            Complete Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
