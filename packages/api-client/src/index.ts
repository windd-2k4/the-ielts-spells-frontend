export type ApiErrorPayload = {
  code?: string;
  message?: string;
  path?: string;
  timestamp?: string;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export type ApiClientOptions = {
  getAccessToken?: () => Promise<string | undefined>;
  refreshAccessToken?: () => Promise<string | undefined>;
};

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function isFormData(body: BodyInit | null | undefined) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

async function parsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined);
  }

  const text = await response.text();
  return text || undefined;
}

function responseError(response: Response, payload: unknown) {
  const value = typeof payload === "object" && payload !== null ? payload as ApiErrorPayload : undefined;
  const message = value?.message
    || (response.status === 401
      ? "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại."
      : `Yêu cầu không thể hoàn tất (HTTP ${response.status}).`);
  return new ApiClientError(response.status, message, value?.code);
}

export function createApiClient(baseUrl: string, options: ApiClientOptions = {}) {
  async function send(path: string, init: RequestInit, token?: string) {
    const headers = new Headers(init.headers);
    if (init.body && !isFormData(init.body) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(joinUrl(baseUrl, path), { ...init, headers });
  }

  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response = await send(path, init, await options.getAccessToken?.());
    if (response.status === 401 && options.refreshAccessToken) {
      const refreshedToken = await options.refreshAccessToken();
      if (refreshedToken) {
        response = await send(path, init, refreshedToken);
      }
    }

    const payload = await parsePayload(response);
    if (!response.ok) {
      throw responseError(response, payload);
    }
    return payload as T;
  };
}
