"use client";

import { useState } from "react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import api from "@/lib/axios";

interface PaymentFormProps {
  messageId: string;
  onSuccess?: () => void;
}

export default function PaymentForm({
  messageId,
  onSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/payments/create-intent", {
        messageId,
      });

      const { clientSecret } = response.data;

      if (!clientSecret) {
        throw new Error("Payment client secret not received");
      }

      // Confirm payment
      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
        return;
      }

      // IMPORTANT:
      // Do NOT update Message status here.
      // Stripe webhook does that on the backend.

      onSuccess?.();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Payment failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="mt-4 w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay & Send"}
      </button>
    </form>
  );
}
