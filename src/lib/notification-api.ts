import { resolveUserApiBaseUrl } from "@/lib/user-api";

export interface NotificationItem {
  id: string;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}

const API_BASE_URL = resolveUserApiBaseUrl();

const requireApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error("Falta configurar VITE_USERS_API_BASE_URL en Railway.");
  }
};

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchNotifications = async (userId: string): Promise<NotificationItem[]> => {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/api/notifications/user/${encodeURIComponent(userId)}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error al cargar notificaciones: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const syncNotification = async (payload: {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  externalKey?: string;
  metadata?: Record<string, unknown>;
}): Promise<NotificationItem> => {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/api/notifications/sync`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Error al sincronizar notificación: ${response.status}`);
  }

  return response.json();
};

export const markNotificationAsRead = async (notificationId: string): Promise<NotificationItem> => {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error al marcar notificación como leída: ${response.status}`);
  }

  return response.json();
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/api/notifications/user/${encodeURIComponent(userId)}/read-all`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error al marcar todas las notificaciones: ${response.status}`);
  }
};

export const deleteNotificationById = async (notificationId: string): Promise<void> => {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error al eliminar notificación: ${response.status}`);
  }
};