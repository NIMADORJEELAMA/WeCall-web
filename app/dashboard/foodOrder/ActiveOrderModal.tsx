"use client";

import React, { useState, useEffect } from "react";
import { Modal, Spin, Empty, Button, Tooltip } from "antd";
import {
  X,
  CheckCircle2,
  Clock,
  UserCheck,
  Loader2,
  Trash2,
  ChefHat,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ActiveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: {
    id: string;
    name: string;
  } | null;
}

export default function ActiveOrderModal({
  isOpen,
  onClose,
  table,
}: ActiveOrderModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchActiveOrder = async () => {
    if (!table?.id) return;
    try {
      setLoading(true);
      // Matching your React Native orderService.getActiveOrders(table.id) logic
      const { data } = await api.get(`/orders/active/${table.id}`);
      setOrder(data);
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && table?.id) {
      fetchActiveOrder();
    }
  }, [isOpen, table?.id]);

  const handleCancelItem = async (itemId: string) => {
    try {
      setActionId(itemId);
      await api.delete(`/orders/items/${itemId}`);
      toast.success("Item cancelled");
      fetchActiveOrder(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    } finally {
      setActionId(null);
    }
  };

  const handleServeItem = async (itemId: string) => {
    try {
      await api.patch(`/orders/item/${itemId}/status`, { status: "SERVED" });
      toast.success("Item served");
      fetchActiveOrder();
    } catch (err) {
      toast.error("Failed to update item");
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "READY":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          icon: <CheckCircle2 size={14} />,
          label: "Ready",
        };
      case "PREPARING":
        return {
          bg: "bg-amber-50",
          text: "text-amber-600",
          icon: <ChefHat size={14} />,
          label: "Kitchen",
        };
      case "SERVED":
        return {
          bg: "bg-gray-50",
          text: "text-gray-400",
          icon: <UserCheck size={14} />,
          label: "Served",
        };
      default:
        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
          icon: <Clock size={14} />,
          label: "Pending",
        };
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={<X size={20} className="text-gray-400" />}
      title={
        <div className="flex flex-col">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            {table?.name}
          </span>
          <span className="text-xl font-black text-gray-800">
            Live Order Summary
          </span>
        </div>
      }
      width={500}
      className="active-order-modal"
    >
      <div className="min-h-[300px] py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-sm text-gray-500 animate-pulse">
              Syncing with Kitchen...
            </p>
          </div>
        ) : !order ? (
          <Empty description="No active orders found" className="py-10" />
        ) : (
          <>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
              {order.items?.map((item: any) => {
                const config = getStatusStyles(item.status);
                const isProcessing = actionId === item.id;

                const canCancel = ["PENDING", "PREPARING", "READY"].includes(
                  item.status,
                );
                const canServe =
                  item.status === "READY" ||
                  (item.status === "PENDING" &&
                    item.menuItem?.type === "DRINKS");

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-2xl border transition-all hover:shadow-md",
                      item.status === "READY"
                        ? "border-emerald-100 bg-emerald-50/30"
                        : "border-gray-100",
                    )}
                  >
                    {/* Quantity Badge */}
                    <div className="h-7 w-7 shrink-0 bg-slate-900 text-white rounded-lg flex items-center justify-center ring-4 ring-slate-900/10">
                      <span className="text-base font-bold leading-none">
                        {item.quantity}
                      </span>
                    </div>
                    {/* Item Info */}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">
                        {item.menuItem?.name}
                      </h4>
                      <div
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter mt-1",
                          config.bg,
                          config.text,
                        )}
                      >
                        {config.icon}
                        {config.label}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <Tooltip title="Cancel Item">
                          <Button
                            type="text"
                            danger
                            icon={
                              isProcessing ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )
                            }
                            onClick={() => handleCancelItem(item.id)}
                            disabled={!!actionId}
                            className="rounded-xl hover:bg-red-50 h-10 w-10 flex items-center justify-center"
                          />
                        </Tooltip>
                      )}

                      {canServe && (
                        <Button
                          onClick={() => handleServeItem(item.id)}
                          disabled={!!actionId}
                          className="bg-emerald-500 hover:bg-emerald-600 border-none text-white rounded-xl font-bold px-4 h-10"
                        >
                          {isProcessing ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            "Serve"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Totals */}
            <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    Grand Total
                  </p>
                  <p className="text-[10px] text-gray-400 italic">
                    Inclusive of all taxes
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    ₹{order.totalAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
