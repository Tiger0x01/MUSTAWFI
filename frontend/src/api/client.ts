import type { ApiError } from "./types";

const API_BASE_URL = (
  import.meta.env["VITE_API_BASE_URL"] as string | undefined
)?.replace(/\/$/, "");

export const hasApiBackend = Boolean(API_BASE_URL);

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  if (!API_BASE_URL) {
    throw {
      code: "NO_BACKEND",
      message: "Backend is not configured.",
    } satisfies ApiError;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      options,
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));

      throw {
        code: body.code ?? "API_ERROR",
        message:
          body.message ??
          body.detail ??
          "The request failed.",
        status: response.status,
      } satisfies ApiError;
    }

    // هــام جداً: هذا السطر هو الذي يمنع خطأ القراءة كـ JSON ويُرجع ملف الـ PDF كملف تحميلي
    if (path.includes("/report")) {
      return (await response.blob()) as unknown as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error
    ) {
      throw error;
    }

    throw {
      code: "BACKEND_UNAVAILABLE",
      message: "The service is temporarily unavailable.",
    } satisfies ApiError;
  }
}