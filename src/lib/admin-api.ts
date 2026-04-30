const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_ADMIN_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.PUBLIC_API_URL ||
    "";

  const trimmed = raw.trim().replace(/\/+$/, "");
  const normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    normalized.startsWith("http://")
  ) {
    return normalized.replace("http://", "https://");
  }

  return normalized;
};

const API_BASE_URL = resolveApiBaseUrl();

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface ReportPayload {
  reportedUserId: string;
  reason: string;
  reporterId?: string;
  metadata?: Record<string, unknown>;
}

export interface ReportResponse {
  id: string;
  reportedUserId: string;
  reason: string;
  reporterId?: string;
  createdAt: string;
  status: string;
}

export const reportUser = async (
  reportedUserId: string,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<ReportResponse> => {
  const payload: ReportPayload = {
    reportedUserId,
    reason,
    metadata,
  };

  const response = await fetch(`${API_BASE_URL}/api/admin/report`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "No se pudo enviar el reporte";
    try {
      const data = await response.json();
      message =
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.message === "string" && data.message) ||
        message;
    } catch {
      // keep fallback
    }
    throw new Error(message);
  }

  return response.json() as Promise<ReportResponse>;
};
