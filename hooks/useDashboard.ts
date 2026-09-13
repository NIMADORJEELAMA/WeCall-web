import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const useTableLayout = () => {
  return useQuery({
    queryKey: ["table-layout"],
    queryFn: async () => {
      // Your 'api' instance already has the baseURL and token interceptor
      const res = await api.get("/orders/table-layout");
      return res.data;
    },
    // Background refresh every 30 seconds
    refetchInterval: 30000,
    // Prevents unnecessary loading states when refetching in the background
    refetchOnWindowFocus: true,
    // Consider data "stale" after 10 seconds to allow for manual refreshes
    staleTime: 10000,
  });
};
