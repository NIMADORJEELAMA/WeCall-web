"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { store } from "./Redux/store";
import { Provider } from "react-redux";
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}

// "use client";

// import {
//   QueryClient,
//   QueryClientProvider,
//   MutationCache,
// } from "@tanstack/react-query";
// import { ReactNode, useState } from "react";
// import toast from "react-hot-toast";

// export default function Providers({ children }: { children: ReactNode }) {
//   const [queryClient] = useState(
//     () =>
//       new QueryClient({
//         // This handles errors for all useMutation hooks globally
//         mutationCache: new MutationCache({
//           onError: (error: any) => {
//             const message =
//               error?.response?.data?.message ||
//               error?.message ||
//               "An unexpected error occurred";

//             toast.error(message);
//           },
//         }),
//         defaultOptions: {
//           queries: {
//             staleTime: 1000 * 60, // 1 minute
//             refetchOnWindowFocus: false,
//             retry: 1,
//           },
//         },
//       }),
//   );

//   return (
//     <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
//   );
// }
