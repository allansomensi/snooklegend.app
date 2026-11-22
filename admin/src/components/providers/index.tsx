"use client";

import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { Spinner } from "../ui/bits";
import { DialogProvider } from "./dialogs";
import { LocaleProvider } from "./locale";
import { ToastProvider } from "./toasts";
import { ViewerProvider } from "./viewer";

const subscribeNothing = () => () => {};

/** True once the page runs in the browser: the portal shows nothing before
 * (no server-side text in the wrong language, no dates in the wrong zone). */
export function useInBrowser() {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The pages refresh by themselves where it matters (Live, the chat…).
            staleTime: 5000,
            refetchOnWindowFocus: false,
            refetchIntervalInBackground: false,
            retry: (n, e) => !(e instanceof ApiError && e.status >= 400 && e.status < 500) && n < 1,
          },
        },
      }),
  );
  const inBrowser = useInBrowser();
  return (
    <QueryClientProvider client={client}>
      <LocaleProvider>
        {inBrowser ? (
          <ToastProvider>
            <DialogProvider>
              <ViewerProvider>{children}</ViewerProvider>
            </DialogProvider>
          </ToastProvider>
        ) : (
          <div className="boot">
            <Spinner lg />
          </div>
        )}
      </LocaleProvider>
    </QueryClientProvider>
  );
}

/** Reloads what the page shows (after an action): every query on screen
 * fetches again, the others when they are next shown. */
export function useRefresh() {
  const client = useQueryClient();
  return () => client.invalidateQueries();
}
