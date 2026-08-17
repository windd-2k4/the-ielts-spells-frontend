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

async function sendMultipart(path: string, options: RequestInit, accessToken?: string) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
      ...options.headers,
    },
  });
}

function responseError(response: Response, body: unknown) {
  const detail = typeof body === "object" && body !== null
    ? (body as {message?: string; detail?: string; error?: string}).message
      || (body as {detail?: string}).detail
      || (body as {error?: string}).error
    : undefined;
  const fallback = response.status === 401
    ? "Phiên đăng nhập không hợp lệ. Vui lòng đăng xuất và đăng nhập lại."
    : `Yêu cầu thất bại (HTTP ${response.status})`;
  return new Error(detail || fallback);
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
    throw responseError(response, body);
  }

  return response.status === 204 ? undefined as T : response.json();
}

export async function apiUpload<T>(path: string, body: FormData, method = "POST"): Promise<T> {
  const {data} = await supabase.auth.getSession();
  let response = await sendMultipart(path, {method, body}, data.session?.access_token);
  if (response.status === 401 && data.session) {
    const {data: refreshed, error} = await supabase.auth.refreshSession();
    if (!error && refreshed.session) response = await sendMultipart(path, {method, body}, refreshed.session.access_token);
  }
  if (!response.ok) throw responseError(response, await response.json().catch(() => null));
  return response.status === 204 ? undefined as T : response.json();
}

export async function apiBlob(path: string): Promise<Blob> {
  const {data} = await supabase.auth.getSession();
  let response = await sendMultipart(path, {method: "GET"}, data.session?.access_token);
  if (response.status === 401 && data.session) {
    const {data: refreshed, error} = await supabase.auth.refreshSession();
    if (!error && refreshed.session) response = await sendMultipart(path, {method: "GET"}, refreshed.session.access_token);
  }
  if (!response.ok) throw responseError(response, await response.json().catch(() => null));
  return response.blob();
}
