"use client";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) throw new Error(payload.message ?? "The request could not be completed");
  return payload as T;
}
