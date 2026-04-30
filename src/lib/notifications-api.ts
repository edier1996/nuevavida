const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_NOTIFICATIONS_API_BASE_URL ||
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

export interface ApiNotification {
  id: string;
  type: "message" | "favorite" | "sale" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export const fetchNotifications = async (
  userId: string
): Promise<ApiNotification[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/notifications/user/${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) {
    throw new Error("No se pudieron cargar las notificaciones");
  }
  return response.json() as Promise<ApiNotification[]>;
};

export const sendNotification = async (
  payload: Omit<ApiNotification, "id" | "createdAt" | "read">
): Promise<ApiNotification> => {
  const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let message = "No se pudo enviar la notificación";
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
  return response.json() as Promise<ApiNotification>;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error("No se pudo marcar la notificación como leída");
  }
};
