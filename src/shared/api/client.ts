import type { ProblemDetails } from "@/shared/types/domain";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
let accessToken: string | undefined;
export const setAccessToken = (value?: string) => {
  accessToken = value;
};

export class ApiError extends Error {
  constructor(public problem: ProblemDetails) {
    super(problem.detail || problem.title);
  }
}

type Options = RequestInit & {
  tenantId?: string;
  idempotencyKey?: string;
  noRefresh?: boolean;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const {
    tenantId: ignoredTenantId,
    idempotencyKey,
    noRefresh,
    ...request
  } = options;
  void ignoredTenantId;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (accessToken && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${accessToken}`);
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);
  let response = await fetch(`${API_URL}${path}`, {
    ...request,
    headers,
    cache: "no-store",
    credentials: "include",
  });
  if (
    response.status === 401 &&
    !noRefresh &&
    !path.startsWith("/api/v1/auth/")
  ) {
    const refreshed = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (refreshed.ok) {
      const session = (await refreshed.json()) as { accessToken?: string };
      setAccessToken(session.accessToken);
      if (session.accessToken)
        headers.set("Authorization", `Bearer ${session.accessToken}`);
      response = await fetch(`${API_URL}${path}`, {
        ...request,
        headers,
        cache: "no-store",
        credentials: "include",
      });
    }
  }
  if (!response.ok) {
    const correlationId = response.headers.get("X-Correlation-ID") ?? undefined;
    let problem: ProblemDetails;
    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      problem = {
        title: "Error de comunicación",
        status: response.status,
        detail: response.statusText,
      };
    }
    throw new ApiError({ ...problem, correlationId });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function download(path: string, filename: string): Promise<void> {
  const headers = new Headers();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, {
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`No se pudo exportar (${response.status})`);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const qs = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(
    ([key, value]) => value && params.set(key, value),
  );
  return params.toString();
};
