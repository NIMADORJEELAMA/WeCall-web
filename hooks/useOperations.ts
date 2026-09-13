import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast/headless";

export const useMonthlyAttendance = (year: number, month: number) => {
  return useQuery({
    queryKey: ["attendance-matrix", year, month],
    queryFn: async () => {
      const { data } = await api.get(`/operations/monthly-attendance`, {
        params: { year, month },
      });
      return data; // Expected: Array of attendance records for the month
    },
  });
};

// src/hooks/useOperations.tsa

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; date: string }) =>
      api.post("/operations/attendance/toggle", data), // Changed to toggle
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-matrix"] });
    },
  });
};

export const usePettyCash = (
  startDate: string,
  endDate: string,
  userId?: string,
  category?: string,
) => {
  return useQuery({
    // Keep the category in the queryKey so the cache refreshes when you toggle the filter
    queryKey: ["petty-cash", startDate, endDate, userId, category],
    queryFn: async () => {
      const { data } = await api.get("/operations/petty-cash", {
        params: {
          startDate,
          endDate,
          userId,
          category: category || undefined, // Corrected: key name must be explicit
        },
      });

      return data; // returns { logs, totalAmount }
    },
  });
};
export const useDeletePettyCash = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/operations/petty-cash/${id}`),
    onSuccess: () => {
      toast.success("Transaction removed");
      queryClient.invalidateQueries({ queryKey: ["petty-cash"] });
    },
    onError: () => toast.error("Failed to delete record"),
  });
};
