"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { ErrorPage, PageLoading } from "./bits";

type Results<T extends unknown[]> = { [K in keyof T]: UseQueryResult<T[K]> };

/** A page's data: a skeleton while it first loads, the error with "Try
 * again" if it can't, else the page. Refreshes keep the page on screen. */
export function Loaded<T extends unknown[]>({ queries, children }: { queries: [...Results<T>]; children: (...data: T) => ReactNode }) {
  const failed = queries.find((q) => q.isError && q.data === undefined);
  if (failed) {
    // A session that ended goes to the sign-in page by itself.
    if (failed.error instanceof ApiError && failed.error.status === 401) return <PageLoading />;
    return <ErrorPage error={failed.error} onRetry={() => queries.forEach((q) => void q.refetch())} />;
  }
  if (queries.some((q) => q.data === undefined)) return <PageLoading />;
  return <>{children(...(queries.map((q) => q.data) as T))}</>;
}

/** When the data on screen was fetched (the latest of the queries). */
export const updatedAt = (...qs: UseQueryResult<unknown>[]) => Math.max(...qs.map((q) => q.dataUpdatedAt));
