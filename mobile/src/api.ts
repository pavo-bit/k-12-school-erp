import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3200";

export interface ApiResponse<T> {
  data?: T;
  error?: { code: string; message: string };
}

let sessionCookie: string | null = null;

export function setSessionCookie(cookie: string | null) {
  sessionCookie = cookie;
}

function authHeaders(): Record<string, string> {
  return sessionCookie ? { Cookie: sessionCookie } : {};
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; includeAuth?: boolean } = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.includeAuth === false ? {} : authHeaders()),
  };

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body) {
    return { error: { code: "NETWORK_ERROR", message: "Unable to reach the server." } };
  }
  return body;
}

export const api = {
  login: async (email: string, password: string): Promise<ApiResponse<{ userId: string }>> => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const cookie = res.headers.get("set-cookie");
    const token = cookie?.split(";").at(0) ?? null;
    if (token) {
      setSessionCookie(token);
      await SecureStore.setItemAsync("session_cookie", token);
    }
    const body = (await res.json().catch(() => null)) as ApiResponse<{ userId: string }> | null;
    return body ?? { error: { code: "NETWORK_ERROR", message: "Unable to reach the server." } };
  },
  me: () =>
    request<{
      user: { id: string; name: string; email: string };
      role: string;
      schoolId: string | null;
    }>("/api/v1/me?school=greenwood"),
  students: () =>
    request<Array<{ id: string; admissionNumber: string; firstName: string; lastName: string }>>(
      "/api/v1/students?school=greenwood",
    ),
  invoices: () =>
    request<
      Array<{
        id: string;
        invoiceNumber: string;
        totalPaise: number;
        paidPaise: number;
        status: string;
      }>
    >("/api/v1/fees/invoices?school=greenwood"),
  sections: () =>
    request<Array<{ id: string; name: string; classId: string }>>(
      "/api/v1/academics/sections?school=greenwood",
    ),
  sessions: (sectionId?: string, date?: string) =>
    request<
      Array<{
        id: string;
        sectionId: string;
        date: string;
        sessionType: string;
        status: string;
      }>
    >(
      `/api/v1/attendance/sessions?school=greenwood${sectionId ? `&sectionId=${sectionId}` : ""}${
        date ? `&date=${date}` : ""
      }`,
    ),
  createSession: (sectionId: string, date: string) =>
    request<{ id: string; sectionId: string; date: string; sessionType: string; status: string }>(
      "/api/v1/attendance/sessions",
      { method: "POST", body: { sectionId, date, sessionType: "daily" } },
    ),
  roster: (sectionId: string) =>
    request<
      Array<{
        id: string;
        admissionNumber: string;
        firstName: string;
        lastName: string;
        gender: string;
      }>
    >(`/api/v1/students?school=greenwood&sectionId=${sectionId}`),
  markRoster: (
    sessionId: string,
    records: Array<{ studentId: string; status: "present" | "absent" | "late" | "half_day" }>,
  ) =>
    request<{ sessionId: string; count: number }>("/api/v1/attendance/records", {
      method: "POST",
      body: { sessionId, records, submit: true, source: "mobile" },
    }),
  logout: () => request<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST" }),
};
