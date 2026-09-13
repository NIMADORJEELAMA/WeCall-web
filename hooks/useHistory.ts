import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export const useBillHistory = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ["bill-history", startDate, endDate], // Key changes when dates change
    queryFn: async () => {
      const res = await api.get("/orders/history/bills", {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      return res.data;
    },
    // We keep historical data longer as it doesn't change as often as the live dashboard
    staleTime: 1000 * 60 * 5,
  });
};
