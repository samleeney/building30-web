import type { ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetToken = (options?: any) => Promise<string>;

async function request<T>(
  getToken: GetToken,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let token: string;
  try {
    token = await getToken({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      },
    });
  } catch (err) {
    console.error("[api-client] getAccessTokenSilently failed:", err);
    throw new ApiClientError("auth_error", `Auth token error: ${(err as Error).message}`, 401);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let apiErr: ApiError | undefined;
    try {
      apiErr = (await res.json()) as ApiError;
    } catch {
      // response wasn't JSON
    }

    if (apiErr?.error) {
      throw new ApiClientError(
        apiErr.error.code,
        apiErr.error.message,
        apiErr.error.status,
      );
    }

    throw new ApiClientError(
      "unknown",
      `HTTP ${res.status}: ${res.statusText}`,
      res.status,
    );
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function createApiClient(getToken: GetToken) {
  return {
    get: <T>(path: string) => request<T>(getToken, "GET", path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(getToken, "POST", path, body),
    put: <T>(path: string, body?: unknown) =>
      request<T>(getToken, "PUT", path, body),
    delete: <T>(path: string) => request<T>(getToken, "DELETE", path),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
