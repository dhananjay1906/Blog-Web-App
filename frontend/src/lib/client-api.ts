"use client";

const ACCESS = "blog.access";
const REFRESH = "blog.refresh";

export class ApiError extends Error {
  constructor(public status: number, public data: Record<string, unknown> | null) {
    super(firstMessage(data) ?? `Request failed (${status})`);
  }
}

function firstMessage(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  if (typeof data.detail === "string") return data.detail;
  for (const [field, value] of Object.entries(data)) {
    const msg = Array.isArray(value) ? value[0] : value;
    if (typeof msg === "string") return field === "non_field_errors" ? msg : `${field.replace("_", " ")}: ${msg}`;
  }
  return null;
}

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.removeItem(ACCESS);
      localStorage.removeItem(REFRESH);
    } catch {}
  },
};

export const tokens = {
  save(access: string, refresh?: string) {
    store.set(ACCESS, access);
    if (refresh) store.set(REFRESH, refresh);
  },
  clear: store.clear,
  hasSession: () => Boolean(store.get(REFRESH)),
};

async function refreshAccess(): Promise<boolean> {
  const refresh = store.get(REFRESH);
  if (!refresh) return false;
  const res = await fetch("/api/auth/token/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    store.clear();
    return false;
  }
  const data = await res.json();
  tokens.save(data.access, data.refresh);
  return true;
}

export async function api<T = unknown>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const access = store.get(ACCESS);
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const res = await fetch(`/api${path}`, { ...init, headers });

  // Access tokens are short-lived; try one silent refresh before giving up.
  if (res.status === 401 && retry && (await refreshAccess())) {
    return api<T>(path, init, false);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}
