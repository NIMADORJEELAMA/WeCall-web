"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
import { z } from "zod";
import { differenceInDays, format, startOfDay } from "date-fns";
import { DatePicker } from "antd";
import dayjs from "dayjs";
// If you need to parse specific strings, ensure customParseFormat is extended
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
import {
  ShoppingBag,
  BedDouble,
  Save,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  CreditCard,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../../lib/axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SimpleDateTimePicker } from "@/components/DateTimePicker";
import { DialogDescription } from "@radix-ui/react-dialog";

import PaymentSettlementModal from "@/components/rooms/PaymentSettlementModal";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const DOCUMENT_OPTIONS = [
  { id: "aadhar", name: "Aadhar Card" },
  { id: "voter_id", name: "Voter Card" },
  { id: "driving_license", name: "Driver's License" },
  { id: "pan_card", name: "PAN Card" },
  { id: "passport", name: "Passport" },
  { id: "others", name: "Others" },
];
export default function BookingManagerModal({
  isOpen,
  onClose,
  bookingId,
}: any) {
  const queryClient = useQueryClient();
  console.log("booking", bookingId);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const manageBookingSchema = z.object({
    guestName: z.string().min(2, "Name required"),
    phone: z.string().min(10, "Valid phone required"),
    documentType: z.string().min(1, "Required"), // Add this
    documentId: z.string().min(1, "ID required"),
    address: z.string().min(2, "Address required"),
    checkInDate: z.string().min(1),
    checkOutDate: z.string().min(1),
    secondaryGuests: z
      .array(
        z.object({
          name: z.string().min(2, "Name required"),
          documentId: z.string().min(1, "ID required"),
        }),
      )
      .optional(),
    miscCharges: z.coerce.number().min(0).default(0),
    discount: z.coerce.number().min(0).default(0),
  });

  type ManageValues = z.input<typeof manageBookingSchema>;
  const form = useForm<ManageValues>({
    resolver: zodResolver(manageBookingSchema),
    defaultValues: {
      guestName: "",
      phone: "",
      documentType: "",
      documentId: "",
      address: "",
      checkInDate: "",
      checkOutDate: "",
      miscCharges: 0,
      discount: 0,
      secondaryGuests: [],
    },
  });
  const {
    data: booking,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: async () => {
      const res = await api.get(`/rooms/bookings/${bookingId}`);
      return res.data;
    },
    enabled: !!bookingId && isOpen, // Only fetch if we have an ID and modal is open
    staleTime: 0,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "secondaryGuests",
  });
  const watchedMisc = Number(form.watch("miscCharges") ?? 0);
  const watchedDiscount = Number(form.watch("discount") ?? 0);
  const watchedCheckIn = form.watch("checkInDate");
  const watchedCheckOut = form.watch("checkOutDate");
  const confirmCheckInMutation = useMutation({
    mutationFn: (id: string) => {
      const currentFormData = form.getValues();
      // Use a new endpoint that handles both: Update + CheckIn
      return api.patch(
        `/rooms/bookings/${id}/update-and-checkin`,
        currentFormData,
      );
    },
    onSuccess: () => {
      toast.success("Details saved and Guest checked in!");
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
      queryClient.invalidateQueries({ queryKey: ["room-timeline"] });

      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onClose();
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || "Failed to check in";
      toast.error(errorMessage);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, cancelReason }: { id: string; cancelReason: string }) =>
      api.patch(`/rooms/bookings/${id}/cancel`, { cancelReason }),

    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
      queryClient.invalidateQueries({ queryKey: ["room-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });

      setCancelReason("");
      onClose();
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || "Cancellation failed";
      toast.error(errorMessage);
    },
  });

  // Inside your Component
  const foodOrders = booking?.foodOrders || [];
  const servedUnpaidItems =
    booking?.foodOrders
      ?.filter((order: any) => order.status !== "PAID")
      .flatMap((order: any) =>
        order.items.filter((item: any) => item.status === "SERVED"),
      ) || [];
  // Calculate total for all pending orders
  const foodTotal = servedUnpaidItems.reduce((acc: number, item: any) => {
    return acc + Number(item.priceAtOrder) * item.quantity;
  }, 0);

  // Calculate Room Total (Simplified version of your logic)
  const nights =
    watchedCheckIn && watchedCheckOut
      ? Math.max(
          1,
          differenceInDays(
            startOfDay(new Date(watchedCheckOut)),
            startOfDay(new Date(watchedCheckIn)),
          ),
        )
      : 1;
  const roomTotal = nights * Number(booking?.room?.basePrice || 0);
  // const grandTotal = roomTotal + foodTotal;

  const subtotal = roomTotal + foodTotal + Number(watchedMisc);
  const totalReductions =
    Number(watchedDiscount) + Number(booking?.advanceAmount);
  const grandTotal = Math.max(0, subtotal - totalReductions);

  useEffect(() => {
    if (booking) {
      const now = dayjs();

      // Logic: If they are only RESERVED, they are checking in NOW.
      // If they are already CHECKED_IN, show the time they actually checked in.
      const initialCheckIn =
        booking.status === "RESERVED"
          ? now.toISOString()
          : dayjs(booking.checkIn).toISOString();

      // Typically, for a live check-in, we might also want to refresh the
      // check-out date to be tomorrow at 11:00 AM, or keep the reserved one.
      // Let's keep the reserved check-out but allow current time for check-in.

      form.reset({
        guestName: booking.guestName,
        phone: booking.guestPhone || "",
        documentType: booking.documentType || "",

        documentId: booking.documentId || "",
        address: booking.address || "",
        checkInDate: initialCheckIn,
        checkOutDate: dayjs(booking.checkOut).toISOString(),
        secondaryGuests: booking.secondaryGuests || [],
        miscCharges: booking.miscCharges || 0,
        discount: booking.discount || 0,
      });
    }
  }, [booking, form]);

  useEffect(() => {
    if (isOpen && bookingId) {
      refetch();
    }
  }, [isOpen, bookingId, refetch]);

  const updateMutation = useMutation({
    mutationFn: (data: ManageValues) =>
      api.patch(`/rooms/bookings/${booking.id}`, data),
    onSuccess: () => {
      // This forces the Gantt Chart to refetch from the server
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });

      // Also invalidate the specific details for this booking
      queryClient.invalidateQueries({
        queryKey: ["booking-details", booking.id],
      });
      toast.success("Stay details updated");

      onClose();
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || "Update failed";
      toast.error(errorMessage);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (payload: {
      paymentMode: string;
      cashAmount: number;
      onlineAmount: number;
    }) =>
      api.post(`/rooms/bookings/${booking.id}/checkout`, {
        ...payload,
        checkOutDate: watchedCheckOut,
        totalBill: grandTotal,
        discount: watchedDiscount,
        miscCharges: watchedMisc,
      }),
    onSuccess: () => {
      toast.success("Guest checked out successfully.");
      queryClient.invalidateQueries({ queryKey: ["room-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["booking-history"] });
      setIsPaymentModalOpen(false);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Checkout failed");
    },
  });

  if (!booking) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1100px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <DialogHeader className="bg-gray-100 p-6 text-slate-900 flex flex-row justify-between items-center space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              {/* Visual Indicator Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <BedDouble size={20} />
              </div>

              <div className="flex items-center gap-3">
                <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                  Booking Management
                </DialogTitle>

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-2xl text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                  {booking.room?.roomNumber || "N/A"}
                </span>
              </div>
            </div>
          </div>
          {/* <Badge className="bg-emerald-500 text-white border-none uppercase text-[10px] px-3">
            {booking.status}
          </Badge> */}
        </DialogHeader>

        <div className="grid grid-cols-12 h-[700px] bg-white">
          {/* LEFT COLUMN: STAY & GUEST FORM */}
          <div className="col-span-7 flex flex-col h-[700px] border-r border-slate-100 bg-white">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <Form {...form}>
                <form id="booking-form" className="space-y-8">
                  <section>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {" "}
                      {/* Increased gap for better spacing with labels */}
                      <FormField
                        control={form.control}
                        name="checkInDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-1.5">
                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                              Arrival Date & Time
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                className="h-12 w-full rounded-xl bg-slate-50 border-none hover:bg-slate-100 focus:bg-white transition-colors"
                                value={field.value ? dayjs(field.value) : null}
                                onChange={(date) =>
                                  field.onChange(date ? date.toISOString() : "")
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="checkOutDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col space-y-1.5">
                            <FormLabel className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                              Departure Date & Time
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                className="h-12 w-full rounded-xl bg-slate-50 border-none hover:bg-slate-100 focus:bg-white transition-colors"
                                value={field.value ? dayjs(field.value) : null}
                                onChange={(date) =>
                                  field.onChange(date ? date.toISOString() : "")
                                }
                              />
                            </FormControl>
                            <FormMessage className="text-[10px] font-bold" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  {/* <Separator className="opacity-50" /> */}

                  <section>
                    <div className="flex items-center gap-2 text-slate-900 mb-4">
                      <User size={18} />
                      <h3 className="text-xs font-black uppercase  ">
                        Guest Details
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="guestName"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormControl>
                              <div className="relative">
                                <User
                                  className="absolute left-4 top-3.5 text-slate-400"
                                  size={18}
                                />
                                <Input
                                  placeholder="Full Name"
                                  className="pl-12 h-12 bg-slate-50 border-none rounded-xl"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Phone
                                  className="absolute left-4 top-3.5 text-slate-400"
                                  size={18}
                                />
                                <Input
                                  placeholder="Phone Number"
                                  className="pl-12 h-12 bg-slate-50 border-none rounded-xl"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="">
                            <FormControl>
                              <div className="relative">
                                <MapPin
                                  className="absolute left-4 top-3.5 text-slate-400"
                                  size={18}
                                />
                                <Input
                                  placeholder="Full Address"
                                  className="pl-12 h-12 bg-slate-50 border-none rounded-xl"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                          <FormItem className="">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl focus:ring-0">
                                  <div className="flex items-center gap-3">
                                    <CreditCard
                                      className="text-slate-400"
                                      size={18}
                                    />
                                    <SelectValue placeholder="Document Type" />
                                  </div>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DOCUMENT_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.id} value={opt.id}>
                                    {opt.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="documentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <CreditCard
                                  className="absolute left-4 top-3.5 text-slate-400"
                                  size={18}
                                />
                                <Input
                                  placeholder="Document ID"
                                  className="pl-12 h-12 bg-slate-50 border-none rounded-xl"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>

                  <section className=" ">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {/* Additional Guests */}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ name: "", documentId: "" })}
                        className="h-7 text-[10px] font-bold"
                      >
                        <Plus size={14} className="mr-1" /> ADD GUEST
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex gap-3 items-center bg-slate-50 p-4 py-2 rounded-xl"
                        >
                          <Input
                            placeholder="Name"
                            className="h-10 bg-white"
                            {...form.register(
                              `secondaryGuests.${index}.name` as const,
                            )}
                          />
                          <Input
                            placeholder="ID No"
                            className="h-10 bg-white"
                            {...form.register(
                              `secondaryGuests.${index}.documentId` as const,
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                </form>
              </Form>
              <section>
                <Dialog
                  open={isCancelModalOpen}
                  onOpenChange={setIsCancelModalOpen}
                >
                  <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                    {/* Screen Reader Only Titles for Accessibility */}
                    <DialogHeader className="sr-only">
                      <DialogTitle>Cancel Booking</DialogTitle>
                      <DialogDescription>
                        Enter a reason to cancel this room reservation.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="p-4 bg-red-50 text-red-500 rounded-full">
                          <AlertCircle size={32} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">
                            Cancel Booking?
                          </h2>
                          <p className="text-sm text-slate-500">
                            This will release{" "}
                            <strong>Room {booking?.room?.roomNumber}</strong>{" "}
                            back to inventory.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                          Reason for Cancellation
                        </label>
                        <Input
                          placeholder="e.g. Guest No-Show, Duplicate Booking..."
                          className="h-12 bg-slate-50 border-none rounded-xl text-sm focus-visible:ring-red-500"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="terminalGhost"
                          className="flex-1 h-12 rounded-xl font-bold text-slate-400"
                          onClick={() => setIsCancelModalOpen(false)}
                        >
                          Close
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-[2] h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100"
                          disabled={cancelMutation.isPending}
                          onClick={() => {
                            if (!cancelReason)
                              return toast.error("Please provide a reason");
                            cancelMutation.mutate({
                              id: booking.id,
                              cancelReason,
                            });
                            setIsCancelModalOpen(false);
                          }}
                        >
                          {cancelMutation.isPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            "Confirm Cancellation"
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </section>
            </div>
            {booking?.id && (
              <div className="p-6 bg-slate-50 border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col gap-4">
                  {/* Top Row: Primary & Secondary Actions */}
                  <div className="flex gap-3 w-full">
                    {/* UPDATE ACTION - Secondary */}
                    <Button
                      variant="terminalGhost"
                      className="flex-1  "
                      onClick={() => updateMutation.mutate(form.getValues())}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Save size={18} className="mr-2" />
                      )}
                      Update Details
                    </Button>

                    {/* CHECK-IN ACTION - Primary */}
                    <div className="flex-[1.2]">
                      {booking.status === "RESERVED" ? (
                        <Button
                          type="button"
                          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 rounded-xl active:scale-[0.98]"
                          onClick={() =>
                            confirmCheckInMutation.mutate(booking.id)
                          }
                          disabled={confirmCheckInMutation.isPending}
                        >
                          {confirmCheckInMutation.isPending ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <div className="flex items-center justify-center">
                              <CheckCircle2 size={18} className="mr-2" />
                              Confirm Check-In
                            </div>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center h-12 w-full border border-slate-200 bg-slate-100/50 rounded-xl text-slate-400 font-bold text-[10px] uppercase tracking-widest cursor-not-allowed">
                          <CheckCircle2 size={16} className="mr-2" />
                          Already Checked In
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <PaymentSettlementModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            billData={{
              nights,
              roomTotal,
              foodTotal,
              servedItemsCount: servedUnpaidItems.length,
              foodItems: servedUnpaidItems,
              miscCharges: watchedMisc,
              discount: watchedDiscount,
              grandTotal,
              booking,
              advanceAmount: booking.advanceAmount,
            }}
            isPending={checkoutMutation.isPending}
            onConfirm={(payload: any) => checkoutMutation.mutate(payload)}
          />
          {/* RIGHT COLUMN: RESTAURANT & BILLING */}

          <div className="col-span-5 bg-slate-50/80 p-0 flex flex-col border-l border-slate-200 h-full overflow-hidden">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Room Charge Segment */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <BedDouble size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Accommodation
                  </span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Room Stay :{" "}
                        <span className="text-bold text-gray-900">
                          {nights}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Rate: ₹{booking?.room?.basePrice}/night
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      ₹{roomTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service/Food Segment */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShoppingBag size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Food Services
                  </span>
                </div>

                {/* 1. Filter orders: Only show orders that have at least one item with status "SERVED" */}
                {foodOrders.filter((order: any) =>
                  order.items.some((item: any) => item.status === "SERVED"),
                ).length > 0 ? (
                  <div className="space-y-2">
                    {foodOrders
                      .filter((order: any) =>
                        order.items.some(
                          (item: any) => item.status === "SERVED",
                        ),
                      )
                      .map((order: any) => (
                        <div
                          key={order.id}
                          className="group relative bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  ID #{order.orderNumber || order.id.slice(-4)}
                                </span>
                                {/* Optional: Add a timestamp or order date if available */}
                              </div>

                              <div className="mt-2 space-y-1">
                                {/* 2. Filter items: Only map through items that are "SERVED" */}
                                {order.items
                                  .filter(
                                    (item: any) => item.status === "SERVED",
                                  )
                                  .map((item: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-xs text-slate-600"
                                    >
                                      <span>
                                        {item.menuItem.name}{" "}
                                        <span className="text-slate-400">
                                          × {item.quantity}
                                        </span>
                                      </span>
                                      <span className="font-medium text-slate-900">
                                        ₹
                                        {(
                                          item.priceAtOrder * item.quantity
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-10 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                    <ShoppingBag size={24} className="opacity-20 mb-2" />
                    <p className="text-[11px] font-medium italic">
                      No served food charges to display
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Misc. Charges
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm">
                      ₹
                    </span>
                    <Input
                      type="text"
                      {...form.register("miscCharges")}
                      className="pl-7 h-10 bg-slate-50 border-none rounded-lg text-sm font-semibold focus-visible:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Discount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-orange-500 text-sm">
                      ₹
                    </span>
                    <Input
                      type="text"
                      {...form.register("discount")}
                      className="pl-7 h-10 bg-orange-50/50 border-none rounded-lg text-sm font-semibold text-orange-700 focus-visible:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Financial Footer */}
            <div className="p-6 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-700">
                    ₹{(roomTotal + foodTotal).toLocaleString()}
                  </span>
                </div>
                {booking?.advanceAmount > 0 && (
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Advance Payment</span>
                    <span className="text-slate-700">
                      - ₹{booking?.advanceAmount}
                    </span>
                  </div>
                )}
                {watchedMisc > 0 && (
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Miscellaneous</span>
                    <span className="text-slate-700">₹{watchedMisc}</span>
                  </div>
                )}
                {watchedDiscount > 0 && (
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Discount</span>
                    <span className="text-slate-700">
                      {" "}
                      - ₹{watchedDiscount}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-2">
                  <span className="text-xs font-black text-slate-900 uppercase">
                    Total Balance Due
                  </span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 tracking-tight">
                      ₹{grandTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="destructive"
                  // className="h-12 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  <Trash2 size={14} />
                  Cancel Reservation
                </Button>
                <Button
                  className={cn(
                    "h-12 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2",
                    booking.status === "RESERVED"
                      ? "bg-slate-300 shadow-none cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
                  )}
                  onClick={() => setIsPaymentModalOpen(true)}
                  // Disable if pending OR if the guest hasn't checked in yet
                  disabled={
                    checkoutMutation.isPending || booking.status === "RESERVED"
                  }
                >
                  <CreditCard size={18} />
                  {booking.status === "RESERVED"
                    ? "Checkout (Check-in first)"
                    : "Checkout"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
