export interface Message {
  id: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  productId: string;
  subject: string;
  content: string;
  image?: string;
  timestamp: string;
  read: boolean;
}

const resolveMessagingApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_MESSAGING_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
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

const API_BASE_URL = resolveMessagingApiBaseUrl();

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchMessages = async (userId: string): Promise<Message[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/messages?userId=${encodeURIComponent(userId)}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Error al cargar mensajes: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.messages ?? [];
};

export const sendMessage = async (message: Omit<Message, "id">): Promise<Message> => {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Error al enviar mensaje: ${response.status}`);
  }

  return response.json();
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/messages/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error al eliminar mensaje: ${response.status}`);
  }
};

export const deleteConversation = async (conversationKey: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${encodeURIComponent(conversationKey)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Error al eliminar conversación: ${response.status}`);
  }
};

export const markAsRead = async (messageId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/messages/${encodeURIComponent(messageId)}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Error al marcar mensaje como leído: ${response.status}`);
  }
};
