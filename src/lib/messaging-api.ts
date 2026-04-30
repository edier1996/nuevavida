const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_MESSAGING_API_BASE_URL ||
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

const resolveWsBaseUrl = () => {
  const raw =
    import.meta.env.VITE_MESSAGING_WS_URL ||
    import.meta.env.VITE_WS_URL ||
    "";

  if (raw.trim()) return raw.trim().replace(/\/+$/, "");

  // Derive WebSocket URL from HTTP base URL
  const http = resolveApiBaseUrl();
  if (!http) return "";
  return http.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://");
};

const API_BASE_URL = resolveApiBaseUrl();
const WS_BASE_URL = resolveWsBaseUrl();

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface ApiMessage {
  id: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  productId?: string;
  subject?: string;
  content: string;
  image?: string;
  timestamp: string;
  read: boolean;
}

export interface ApiConversation {
  id: string;
  participants: string[];
  lastMessage: ApiMessage;
  unreadCount: number;
}

export const fetchConversations = async (
  userId: string
): Promise<ApiConversation[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/messages/user/${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) {
    throw new Error("No se pudieron cargar las conversaciones");
  }
  return response.json() as Promise<ApiConversation[]>;
};

export const fetchMessages = async (
  conversationId: string
): Promise<ApiMessage[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/messages/conversation/${conversationId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) {
    throw new Error("No se pudieron cargar los mensajes");
  }
  return response.json() as Promise<ApiMessage[]>;
};

export const sendMessage = async (
  payload: Omit<ApiMessage, "id" | "timestamp" | "read">
): Promise<ApiMessage> => {
  const response = await fetch(`${API_BASE_URL}/api/messages/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let message = "No se pudo enviar el mensaje";
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
  return response.json() as Promise<ApiMessage>;
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/api/messages/${messageId}/read`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error("No se pudo marcar el mensaje como leído");
  }
};

export interface WebSocketCallbacks {
  onMessage: (message: ApiMessage) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export const setupWebSocket = (
  conversationId: string,
  callbacks: WebSocketCallbacks
): WebSocket | null => {
  if (!WS_BASE_URL) {
    console.warn(
      "WebSocket URL no configurada. Define VITE_MESSAGING_WS_URL o VITE_API_BASE_URL."
    );
    return null;
  }

  const token = localStorage.getItem("auth_token");
  const url = `${WS_BASE_URL}/api/messages/ws/${conversationId}${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  const ws = new WebSocket(url);

  ws.onopen = () => {
    callbacks.onOpen?.();
  };

  ws.onmessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data as string) as ApiMessage;
      callbacks.onMessage(message);
    } catch {
      console.error("Error al parsear mensaje WebSocket:", event.data);
    }
  };

  ws.onerror = (error: Event) => {
    console.error("Error en WebSocket:", error);
    callbacks.onError?.(error);
  };

  ws.onclose = () => {
    callbacks.onClose?.();
  };

  return ws;
};
