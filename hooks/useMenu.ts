import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast/headless";
import axios from "axios";

export const useMenu = () =>
  useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const { data } = await api.get("/menu");
      return data;
    },
  });

export const useCreateMenuItem = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => api.post("/menu", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
    onError: () => {
      toast.error("Failed to delete item");
    },
  });
};

export const useUpdateMenuItem = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: any) => api.patch(`/menu/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
    onError: () => {
      toast.error("Failed to delete item");
    },
  });
};

export const useDeleteMenuItem = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/menu/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Item deleted forever");
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  });
};
export const useUploadMenuCsv = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any[]) => {
      // If sending JSON, we don't need FormData
      const response = await api.post("/menu/bulk", payload);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["unified-categories"],
    queryFn: async () => {
      const res = await api.get("/tables/categories/unified");
      console.log("res", res);
      return res.data;
    },
    // Optional: add a default value in the component or use select
    initialData: [],
  });
};
