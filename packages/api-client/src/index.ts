export function createApiClient(baseUrl: string, getToken?: () => Promise<string | undefined>) {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken?.();
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
    return response.json() as Promise<T>;
  };
}
