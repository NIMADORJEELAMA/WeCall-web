// "use client";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// import { useState } from "react";

// export function Providers({ children }: { children: React.ReactNode }) {
//   // We use useState to ensure the client is stable across re-renders
//   const [queryClient] = useState(
//     () =>
//       new QueryClient({
//         defaultOptions: {
//           queries: {
//             staleTime: 1000 * 60 * 5, // Data stays "fresh" for 5 minutes
//             refetchOnWindowFocus: true, // Auto-update when waiter switches back to tab
//           },
//         },
//       }),
//   );

//   return (
//     <QueryClientProvider client={queryClient}>
//       {children}
//       <ReactQueryDevtools initialIsOpen={false} />
//     </QueryClientProvider>
//   );
// }
