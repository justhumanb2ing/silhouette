import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000 * 10,
            refetchOnMount: false,
            retry: false,
            refetchInterval: false,
            throwOnError: false,
          },
          mutations: {
            retry: 0,
            throwOnError: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
