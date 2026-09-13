import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";

// 1. Fetch all customers
export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await api.get("/customers");
      return data;
    },
  });
};

// 2. Fetch a single customer by ID
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// 3. Search customers (Used for the POS "Search as you type")
export const useSearchCustomers = (query: string) => {
  return useQuery({
    queryKey: ["customers", "search", query],
    queryFn: async () => {
      const { data } = await api.get(`/customers/search?q=${query}`);
      return data;
    },
    enabled: query.length >= 3, // Start searching after 3 characters
  });
};

// 4. Create a new customer
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newCustomer: any) => {
      const { data } = await api.post("/customers", newCustomer);
      return data;
    },
    onSuccess: () => {
      // Refresh the customer list automatically
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

// 5. Update an existing customer
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/customers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      // Also invalidate the specific customer query if it's being viewed
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
  });
};

// 6. Delete a customer
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });
};
