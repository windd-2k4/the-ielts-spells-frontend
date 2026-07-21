import {supabase} from "./supabase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

async function send(path: string, options: RequestInit, accessToken?: string) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
      ...options.headers,
    },
  });
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const {data} = await supabase.auth.getSession();
  let response = await send(path, options, data.session?.access_token);

  // A token can become invalid after rotating the Supabase JWT signing key.
  // Refresh once and retry transparently before asking the user to sign in again.
  if (response.status === 401 && data.session) {
    const {data: refreshed, error} = await supabase.auth.refreshSession();
    if (!error && refreshed.session) {
      response = await send(path, options, refreshed.session.access_token);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.message || body?.detail || body?.error;
    const fallback = response.status === 401
      ? "Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất và đăng nhập lại."
      : `Yêu cầu thất bại (HTTP ${response.status})`;
    throw new Error(detail || fallback);
  }

  return response.status === 204 ? undefined as T : response.json();
}
