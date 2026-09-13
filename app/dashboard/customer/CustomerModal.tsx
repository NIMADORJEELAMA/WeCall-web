"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as z from "zod";
import {
  Loader2,
  UserPlus,
  Save,
  Mail,
  User,
  Phone,
  MapPin,
  Contact2,
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
// Assuming you will create these hooks based on the service we wrote earlier
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
});

export default function CustomerModal({
  isOpen,
  onClose,
  editingCustomer,
}: any) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  console.log("editingCustomer", editingCustomer);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (editingCustomer) {
      form.reset({
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        email: editingCustomer.email || "",
        address: editingCustomer.address || "",
      });
    } else {
      form.reset({
        name: "",
        phone: "",
        email: "",
        address: "",
      });
    }
  }, [editingCustomer, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const mutation = editingCustomer ? updateCustomer : createCustomer;
    const payload = editingCustomer
      ? { id: editingCustomer.id, data: values }
      : values;

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          editingCustomer ? "Customer updated" : "Customer registered",
        );
        onClose();
      },
      onError: (err: any) => {
        const message =
          err?.response?.data?.message || err?.message || "Action failed";
        toast.error(message);
      },
    });
  };

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-white max-w-lg rounded-[28px] overflow-hidden shadow-2xl">
        <VisuallyHidden.Root>
          <DialogTitle>
            {editingCustomer
              ? `Edit Customer: ${editingCustomer.name}`
              : "New Customer"}
          </DialogTitle>
          <DialogDescription>
            Form for managing customer details and contact info.
          </DialogDescription>
        </VisuallyHidden.Root>

        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              {editingCustomer ? <Save size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {editingCustomer ? "Edit Customer" : "Register Customer"}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                CRM & Loyalty Management
              </p>
            </div>
          </div>
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
                      placeholder="e.g. John Doe"
                      className="h-12 rounded-xl border-slate-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <Phone size={12} className="text-slate-400" /> Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="98XXXXXXXX"
                      className="h-12 rounded-xl border-slate-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Email Address */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <Mail size={12} className="text-slate-400" /> Email
                    (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="john@example.com"
                      className="h-12 rounded-xl border-slate-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="flex items-center gap-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <MapPin size={12} className="text-slate-400" /> Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="City, State"
                      className="h-12 rounded-xl border-slate-200"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Footer Actions */}
            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                variant={"outline"}
                className="flex-[3] h-12 rounded-2xl font-bold text-[11px] uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-[7] h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-100"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editingCustomer ? (
                  "Update Details"
                ) : (
                  "Save Customer"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
