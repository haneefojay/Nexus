"use client";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  organizationId?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  if (organizationId) headers.set("x-organization-id", organizationId);
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    code?: string;
    error?: { code?: string; message?: string };
  };
  if (!response.ok)
    throw new ApiClientError(
      payload.message ?? payload.error?.message ?? "The request could not be completed",
      response.status,
      payload.code ?? payload.error?.code,
    );
  return payload as T;
}
