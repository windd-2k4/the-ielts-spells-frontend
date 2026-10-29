"use client";

import { ApiClientError, createApiClient } from "@ielts/api-client";
import { supabase } from "@/lib/supabase";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1").replace(/\/$/, "");
let cachedAccessToken: string | undefined;

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  cachedAccessToken = data.session?.access_token;
  return cachedAccessToken;
}

async function refreshedAccessToken() {
  const { data, error } = await supabase.auth.refreshSession();
  cachedAccessToken = error ? undefined : data.session?.access_token;
  return cachedAccessToken;
}

export const apiFetch = createApiClient(apiUrl, {
  getAccessToken: accessToken,
  refreshAccessToken: refreshedAccessToken,
});

/**
 * Starts a small authenticated POST immediately so it can survive pagehide/unload.
 * A normal apiFetch first awaits Supabase, which lets the browser tear the page down
 * before the keepalive request has even been created.
 */
export function apiKeepalivePost(path: string): Promise<void> {
  if (!cachedAccessToken) {
    return apiFetch<void>(path, { method: "POST", keepalive: true });
  }

  const target = `${apiUrl}/${path.replace(/^\//, "")}`;
  return fetch(target, {
    method: "POST",
    keepalive: true,
    headers: { Authorization: `Bearer ${cachedAccessToken}` },
  }).then(async (response) => {
    if (response.ok) return;
    const payload = await response.json().catch(() => undefined) as { code?: string; message?: string } | undefined;
    throw new ApiClientError(response.status, payload?.message ?? `Yêu cầu không thể hoàn tất (HTTP ${response.status}).`, payload?.code);
  });
}

export async function apiUpload<T = void>(path: string, body: FormData): Promise<T> {
  const send = (token?: string) => fetch(`${apiUrl}/${path.replace(/^\//, "")}`, {
    method: "POST",
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  let response = await send(await accessToken());
  if (response.status === 401) response = await send(await refreshedAccessToken());
  if (response.ok) return response.status === 204 ? undefined as T : await response.json() as T;
  const payload = await response.json().catch(() => undefined) as { message?: string } | undefined;
  throw new ApiClientError(response.status, payload?.message ?? "Không thể tải ảnh minh chứng.");
}

export async function apiBlob(path: string): Promise<Blob> {
  const external = /^https?:\/\//i.test(path);
  if (external) {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Không thể tải ảnh minh họa.");
    return response.blob();
  }

  const send = async (token?: string) => fetch(`${apiUrl}${path.startsWith("/") ? path : `/${path}`}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const { data } = await supabase.auth.getSession();
  let response = await send(data.session?.access_token);
  if (response.status === 401 && data.session) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (!error && refreshed.session) response = await send(refreshed.session.access_token);
  }
  if (!response.ok) throw new Error("Không thể tải ảnh minh họa.");
  return response.blob();
}

export async function apiMediaUrl(path: string): Promise<string> {
  if (/^https?:\/\//i.test(path)) return path;
  const signedPath = path.replace(/\/content(?:\?.*)?$/, "/signed-url");
  if (signedPath !== path) {
    try {
      const result = await apiFetch<{ url: string }>(signedPath);
      if (result.url) return result.url;
    } catch {
      // Local storage and older backends still use the authenticated content endpoint.
    }
  }
  return URL.createObjectURL(await apiBlob(path));
}

export function revokeMediaUrl(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}
