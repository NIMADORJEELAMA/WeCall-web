"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"; // Ensure this is installed
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as z from "zod";
import {
  X,
  Loader2,
  UserPlus,
  Save,
  Mail,
  User,
  Lock,
  ShieldCheck,
  Activity,
  IndianRupee,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegisterUser, useUpdateUser } from "@/hooks/useUsers";
import { Button } from "../ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  role: z.string(),
  isActive: z.boolean().default(true),
  dailyRate: z.coerce.number().min(0),
});

export default function StaffModal({ isOpen, onClose, editingUser }: any) {
  const register = useRegisterUser();
  const update = useUpdateUser();

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "WAITER",
      isActive: true,
      dailyRate: 0,
    },
  });

  useEffect(() => {
    if (editingUser) {
      form.reset({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive ?? true,
        password: "",
        dailyRate: editingUser.dailyRate || 0,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        password: "",
        role: "WAITER",
        isActive: true,
        dailyRate: 0,
      });
    }
  }, [editingUser, isOpen, form]);

  const onSubmit = (values: z.input<typeof formSchema>) => {
    const data = { ...values };
    if (!data.password) delete data.password;

    const mutation = editingUser ? update : register;
    const payload = editingUser ? { id: editingUser.id, data } : data;

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(editingUser ? "Profile updated" : "Staff registered");
        onClose();
      },
      onError: (err: any) => {
        // Better error extraction
        const message =
          err?.response?.data?.message || err?.message || "Action failed";
        toast.error(message);
        console.error("Mutation Error:", err); // Debugging
      },
    });
  };

  const isPending = register.isPending || update.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-white max-w-lg rounded-[28px] overflow-hidden shadow-2xl">
        <VisuallyHidden.Root>
          <DialogTitle>
            {editingUser
              ? `Edit Staff: ${editingUser.name}`
              : "Staff Registration"}
          </DialogTitle>
          <DialogDescription>
            Form for managing restaurant staff roles and access.
          </DialogDescription>
        </VisuallyHidden.Root>
        {/* Header - Matching Stock Entry Style */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              {editingUser ? <Save size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {editingUser ? "Edit Profile" : "Staff Registration"}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                Personnel Management
              </p>
            </div>
          </div>
          {/* <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button> */}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-8 space-y-5"
          >
            {/* Full Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <User size={12} className="text-slate-400" /> Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500/20"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <Mail size={12} className="text-slate-400" /> Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      className="h-12 rounded-xl border-slate-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Password & Role Grid */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <Lock size={12} className="text-slate-400" /> Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={editingUser ? "••••••" : ""}
                        {...field}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <ShieldCheck size={12} className="text-slate-400" /> Role
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-bold text-xs uppercase">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="WAITER">WAITER</SelectItem>
                        <SelectItem value="KITCHEN">KITCHEN</SelectItem>
                        <SelectItem value="FRONT_OFFICE">
                          FRONT OFFICE
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {/* Daily Rate Field */}
              <FormField
                control={form.control}
                name="dailyRate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <IndianRupee size={12} className="text-slate-400" /> Daily
                      Rate (₹)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        // Explicitly cast value to handle the 'unknown' type error
                        value={field.value as number}
                        className="h-12 rounded-xl border-slate-200 font-bold"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Segmented Control (Using the "Classification" style) */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <Activity size={12} className="text-slate-400" /> Account
                    Status
                  </FormLabel>
                  <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    {[
                      { label: "Active", value: true },
                      { label: "Disabled", value: false },
                    ].map((status) => (
                      <button
                        key={status.label}
                        type="button"
                        onClick={() => field.onChange(status.value)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                          field.value === status.value
                            ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {status.label.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {/* Footer Actions */}
            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant={"terminalGhost"}
                className="flex-[2] "
                // className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                variant={"default"}
                className={`flex-[8] `}
                // className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editingUser ? (
                  "Update Employee"
                ) : (
                  "Finalize Registration"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
