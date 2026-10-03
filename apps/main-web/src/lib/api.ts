"use client";

import { createApiClient } from "@ielts/api-client";
import { supabase } from "@/lib/supabase";

const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1").replace(/\/$/, "");

export const apiFetch = createApiClient(apiUrl, {
  getAccessToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },
  refreshAccessToken: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    return error ? undefined : data.session?.access_token;
  },
});

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
