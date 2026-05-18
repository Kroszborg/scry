import Constants from "expo-constants";

const BASE = (
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:4200"
).replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    ...options,
  });
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: BASE,
  documents: {
    list: () => request<any>("/api/documents"),
    create: (body: Record<string, unknown>) =>
      request<any>("/api/documents", { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => request<any>(`/api/documents/${id}`),
    update: (id: string, body: Record<string, unknown>) =>
      request<any>(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      request<any>(`/api/documents/${id}`, { method: "DELETE" }),
    flashcards: (id: string) =>
      request<any>(`/api/documents/${id}/flashcards`),
  },
};
