import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export const usePerformanceReport = (
  startDate: string,
  endDate: string,
  page: number,
  limit: number,
  search: string,
) => {
  return useQuery({
    queryKey: ["performance-report", startDate, endDate, page, limit, search],
    queryFn: async () => {
      const { data } = await api.get("/orders/reports/performance", {
        params: {
          startDate,
          endDate,
          page,
          limit,
          search,
        },
      });
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
};

// src/hooks/useReports.ts

export const useItemDrilldown = (id: string, start: string, end: string) => {
  return useQuery({
    queryKey: ["item-drilldown", id, start, end],
    queryFn: async () => {
      const { data } = await api.get(`/orders/reports/item-drilldown/${id}`, {
        params: { startDate: start, endDate: end },
      });
      return data;
    },
    enabled: !!id, // Only fetch if an ID is provided
  });
};

export function useDashboardReport(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["dashboard-report", startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get("/orders/report", {
        params: { startDate, endDate },
      });
      return data;
    },
  });
}
