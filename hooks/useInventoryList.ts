// import { useQuery } from "@tanstack/react-query";
// import api from "@/lib/axios";
// // hooks/useInventory.ts (or wherever your hook is)
// export const useInventoryList = () =>
//   useQuery({
//     queryKey: ["all-inventory"],
//     queryFn: async () => {
//       const { data } = await api.get("/inventory/stocks");
//       // Since your backend returns { items: [], stats: {} }
//       return data.items || [];
//     },
//     initialData: [],
//   });

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export const useInventoryList = () =>
  useQuery({
    queryKey: ["all-inventory"],
    queryFn: async () => {
      const { data } = await api.get("/inventory/stocks");
      return data.items ?? [];
    },
    initialData: [],

    staleTime: 1000 * 60 * 5,
  });
