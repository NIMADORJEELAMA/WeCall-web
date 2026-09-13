"use client";

import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import {
  CalendarIcon,
  LogIn,
  User,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  CreditCard,
  Banknote,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../lib/axios";

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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { DatePicker } from "antd";
import dayjs from "dayjs";
import GenericDropdown from "../ui/GenericDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const bookingSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  guestName: z.string().min(2, "Primary guest name is required"),
  guestPhone: z.string().min(10, "Valid phone number required"),
  documentId: z.string().min(1, "Document ID is required"),
  address: z.string().min(2, "City/address is required"),
  documentType: z.string().min(1, "Document type is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  // Use coerce to handle empty string inputs as 0
  cashAmount: z.coerce.number().default(0),
  onlineAmount: z.coerce.number().default(0),
  advanceAmount: z.coerce.number().default(0),

  secondaryGuests: z
    .array(
      z.object({
        name: z.string().min(2, "Name required"),
        documentId: z.string().min(1, "ID required"),
      }),
    )
    .optional(),
});

type BookingValues = z.input<typeof bookingSchema>;

export default function CheckInModal({ isOpen, onClose, gridData }: any) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"SELECTION" | "FORM">("SELECTION");
  const [actionType, setActionType] = useState<"BOOKING" | "CHECKIN">(
    "BOOKING",
  );

  const DOCUMENT_OPTIONS = [
    { id: "aadhar", name: "Aadhar Card" },
    { id: "voter_id", name: "Voter Card" },
    { id: "driving_license", name: "Driver's License" },
    { id: "pan_card", name: "PAN Card" },
    { id: "passport", name: "Passport" },
    { id: "others", name: "Others" },
  ];

  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roomId: "",
      guestName: "",
      guestPhone: "",
      documentId: "",
      address: "",
      checkInDate: "",
      checkOutDate: "",
      documentType: "aadhar",
      secondaryGuests: [],
      cashAmount: 0,
      onlineAmount: 0,
      advanceAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "secondaryGuests",
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);

  const guestPhone = form.watch("guestPhone");
  useEffect(() => {
    // Guard: If we just selected a customer, don't trigger search again
    if (selectedCustomerId) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (guestPhone?.length >= 3) {
        setIsSearching(true);
        try {
          const { data } = await api.get(`/customers/search?q=${guestPhone}`);
          setSearchResults(data);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [guestPhone, selectedCustomerId]);

  const handleSelectCustomer = (customer: any) => {
    form.setValue("guestName", customer.name);
    form.setValue("guestPhone", customer.phone);
    // Optional: if your customer model has address/IDs
    if (customer.address) form.setValue("address", customer.address);

    setSelectedCustomerId(customer.id);
    setSearchResults([]);
  };

  // Watch amounts to calculate total display
  const cashPortion = form.watch("cashAmount") || 0;
  const onlinePortion = form.watch("onlineAmount") || 0;
  const totalAdvance = Number(cashPortion) + Number(onlinePortion);

  const mutation = useMutation({
    mutationFn: (payload: any) => api.post("/rooms/check-in", payload),
    onSuccess: () => {
      toast.success("Transaction recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["room-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Operation failed"),
  });

  useEffect(() => {
    if (isOpen && gridData) {
      setMode(gridData.id ? "FORM" : "SELECTION");

      // 1. If it's a new check-in/booking, use current time for hour/min precision
      // 2. If it's an existing record (gridData.id), use the stored date
      let checkIn = dayjs();

      if (gridData.id) {
        // Use existing record's date if we are editing
        checkIn = dayjs(gridData.checkIn || gridData.date);
      } else if (gridData.date) {
        // If clicking a grid but it's a NEW entry,
        // combine grid date with CURRENT time to avoid the midnight bug
        const now = dayjs();
        checkIn = dayjs(gridData.date).hour(now.hour()).minute(now.minute());
      }

      const checkOut = checkIn.add(1, "day").hour(11).minute(0);

      form.reset({
        roomId: gridData.roomId || gridData.room?.id || "",
        guestName: gridData.guestName || "",
        guestPhone: gridData.guestPhone || "",
        documentId: gridData.documentId || "",
        address: gridData.address || "",
        documentType: gridData.documentType || "aadhar",
        cashAmount: gridData.cashAmount || 0,
        onlineAmount: gridData.onlineAmount || 0,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        secondaryGuests: gridData.secondaryGuests || [],
      });
    }
  }, [isOpen, gridData, form]);

  // useEffect(() => {
  //   if (isOpen && gridData) {
  //     // If editing existing record, skip selection
  //     setMode(gridData.id ? "FORM" : "SELECTION");
  //     const checkIn = gridData.date ? dayjs(gridData.date) : dayjs();
  //     // const checkIn = gridData.date
  //     //   ? dayjs(gridData.date).startOf("day")
  //     //   : dayjs().startOf("day");

  //     // Set checkout to 11 AM the next day
  //     const checkOut = checkIn.add(1, "day").hour(11).minute(0);

  //     // const checkIn = gridData.date ? dayjs(gridData.date) : dayjs();
  //     // const checkOut = checkIn.add(1, "day").hour(11).minute(0);

  //     form.reset({
  //       roomId: gridData.roomId || gridData.room?.id || "",
  //       guestName: gridData.guestName || "",
  //       guestPhone: gridData.guestPhone || "",
  //       documentId: gridData.documentId || "",
  //       address: gridData.address || "",
  //       documentType: gridData.documentType || "aadhar",
  //       cashAmount: gridData.cashAmount || 0,
  //       onlineAmount: gridData.onlineAmount || 0,
  //       checkInDate: checkIn.toISOString(),
  //       checkOutDate: checkOut.toISOString(),
  //       secondaryGuests: gridData.secondaryGuests || [],
  //     });
  //   }
  // }, [isOpen, gridData, form]);

  const onSubmit: SubmitHandler<BookingValues> = (data) => {
    const totalAdvance =
      Number(data.cashAmount || 0) + Number(data.onlineAmount || 0);

    const payload = {
      ...data,
      advanceAmount: totalAdvance,
      customerId: selectedCustomerId,
      type: actionType,
    };

    mutation.mutate(payload);
  };

  const handleSelectAction = (type: "BOOKING" | "CHECKIN") => {
    setActionType(type);
    setMode("FORM");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Stay Management Portal</DialogTitle>
        </DialogHeader>

        {/* HEADER */}
        <div className="p-6 bg-white flex justify-between items-center border-b">
          <div className="flex items-center gap-4">
            {mode === "FORM" && !gridData?.id && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-slate-100"
                onClick={() => setMode("SELECTION")}
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </Button>
            )}
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Room{" "}
                {gridData?.roomNumber || gridData?.room?.roomNumber || "N/A"}
              </h2>
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                {gridData?.id ? "Update Stay" : "New Registration"}
              </p>
            </div>
          </div>
          {mode === "FORM" && (
            <Badge
              className={cn(
                "px-4 py-1 border-none",
                actionType === "CHECKIN"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-indigo-500 hover:bg-indigo-600",
              )}
            >
              {actionType === "CHECKIN" ? "LIVE CHECK-IN" : "ADVANCE BOOKING"}
            </Badge>
          )}
        </div>

        {mode === "SELECTION" ? (
          <div className="p-10 grid grid-cols-2 gap-6 bg-slate-50">
            <button
              onClick={() => handleSelectAction("BOOKING")}
              className="group p-10 bg-white border border-slate-200 rounded-[2rem] hover:border-indigo-500 transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-4"
            >
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <CalendarIcon size={32} />
              </div>
              <span className="font-bold text-slate-700 uppercase tracking-widest text-xs">
                Reservation
              </span>
            </button>

            <button
              onClick={() => handleSelectAction("CHECKIN")}
              className="group p-10 bg-white border border-slate-200 rounded-[2rem] hover:border-emerald-500 transition-all shadow-sm hover:shadow-md flex flex-col items-center gap-4"
            >
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <LogIn size={32} />
              </div>
              <span className="font-bold text-slate-700 uppercase tracking-widest text-xs">
                Direct Check-In
              </span>
            </button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 space-y-8">
                {/* DATES SECTION */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                          Arrival
                        </FormLabel>
                        <DatePicker
                          showTime
                          format="DD/MM/YYYY HH:mm"
                          className="h-12 rounded-xl bg-slate-50 border-slate-200"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) =>
                            field.onChange(date ? date.toISOString() : "")
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checkOutDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[10px] font-bold text-slate-500 uppercase ml-1">
                          Departure
                        </FormLabel>
                        <DatePicker
                          showTime
                          format="DD/MM/YYYY HH:mm"
                          className="h-12 rounded-xl bg-slate-50 border-slate-200"
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) =>
                            field.onChange(date ? date.toISOString() : "")
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* PRIMARY GUEST SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 border-b pb-2">
                    <User size={16} className="text-indigo-500" />
                    <h3 className="text-xs font-black uppercase tracking-tight">
                      Primary Guest
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guestName"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-[10px] font-bold text-slate-800 uppercase">
                            Full Name
                          </FormLabel>
                          <Input
                            placeholder="Enter guest name"
                            className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                            {...field}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guestPhone"
                      render={({ field }) => (
                        <FormItem className="relative">
                          {" "}
                          {/* Add relative for dropdown positioning */}
                          <FormLabel className="text-[10px] font-bold text-slate-800 uppercase flex justify-between">
                            <span>Phone</span>
                            {isSearching && (
                              <Loader2 size={10} className="animate-spin" />
                            )}
                          </FormLabel>
                          <Input
                            placeholder="Enter phone number"
                            className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (selectedCustomerId)
                                setSelectedCustomerId(null); // Unlock search if they type
                            }}
                          />
                          {/* SEARCH RESULTS DROPDOWN */}
                          {searchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {searchResults.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectCustomer(c)}
                                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex justify-between items-center"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">
                                      {c.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {c.phone}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-[8px] border-indigo-200 text-indigo-600"
                                  >
                                    EXISTING
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* <FormField
                      control={form.control}
                      name="guestPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-800 uppercase">
                            Phone
                          </FormLabel>
                          <Input
                            placeholder="Enter phone number"
                            className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                            {...field}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    /> */}
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold text-slate-800 uppercase">
                            City / Address
                          </FormLabel>
                          <Input
                            placeholder="Enter address"
                            className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                            {...field}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="text-[10px] font-bold text-slate-800 uppercase">
                            Document Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 bg-slate-50 border-none rounded-xl focus:ring-0">
                                <div className="flex items-center gap-3">
                                  <CreditCard
                                    className="text-slate-800"
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
                          <FormLabel className="text-[10px] font-bold text-slate-800 uppercase">
                            ID Number
                          </FormLabel>
                          <Input
                            placeholder="Enter ID"
                            className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                            {...field}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* COMPANIONS SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-xs font-black uppercase tracking-tight text-slate-900">
                      Companions ({fields.length})
                    </h3>
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
                        className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 items-end"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Guest Name"
                            className="h-10 bg-white"
                            {...form.register(
                              `secondaryGuests.${index}.name` as const,
                            )}
                          />
                          <Input
                            placeholder="ID Number"
                            className="h-10 bg-white"
                            {...form.register(
                              `secondaryGuests.${index}.documentId` as const,
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PAYMENT SECTION */}
                <div className="space-y-4">
                  {/* Header with a cleaner, more professional look */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                      <Banknote size={16} className="text-emerald-600" />
                    </div>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                      Advance Payment
                    </h3>
                  </div>

                  {/* The Quartz Card */}
                  <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                      {/* Cash Section */}
                      <div className="p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1">
                          Cash Payment
                        </label>
                        <div className="relative group">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 font-light text-2xl group-focus-within:text-emerald-500 transition-colors">
                            ₹
                          </span>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-transparent pl-6 py-2 text-2xl font-semibold text-slate-800 focus:outline-none placeholder:text-slate-200"
                            {...form.register("cashAmount")}
                          />
                          <div className="absolute bottom-0 left-6 right-0 h-[1.5px] bg-slate-100 group-focus-within:bg-emerald-500 transition-all" />
                        </div>
                      </div>

                      {/* Online Section */}
                      <div className="p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1">
                          Online / UPI
                        </label>
                        <div className="relative group">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300 font-light text-2xl group-focus-within:text-blue-500 transition-colors">
                            ₹
                          </span>
                          <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-transparent pl-6 py-2 text-2xl font-semibold text-slate-800 focus:outline-none placeholder:text-slate-200"
                            {...form.register("onlineAmount")}
                          />
                          <div className="absolute bottom-0 left-6 right-0 h-[1.5px] bg-slate-100 group-focus-within:bg-blue-500 transition-all" />
                        </div>
                      </div>
                    </div>

                    {/* Total Summary Row - The "Quartz" Footer */}
                    <div className="bg-slate-50/80 backdrop-blur-md border-t border-slate-100 p-5 px-8 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          Summary
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          Total Advance Received
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-emerald-600/60">
                          ₹
                        </span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {totalAdvance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-6 bg-slate-50 border-t flex gap-4">
                <Button
                  type="button"
                  variant="terminalGhost"
                  onClick={onClose}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className={cn(
                    "flex-[2] h-12 font-bold uppercase tracking-widest",
                    actionType === "CHECKIN"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700",
                  )}
                >
                  {mutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    `Complete ${actionType}`
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
