// ─── Data shapes matching the backend MySQL models ───────────────────────────

export interface Conversation {
  id: string;
  participantIds: string[];
  productId?: string | null;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// ─── Base URL resolution ──────────────────────────────────────────────────────

const resolveMessagingApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_MESSAGING_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "";

  const trimmed = raw.trim().replace(/\/+$/, "");
  let normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;

  if (normalized && !/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

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

const requireApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error("Falta configurar VITE_MESSAGING_API_BASE_URL en Railway.");
  }
};

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * GET /api/messages/user/:userId
 * Returns all conversations the user participates in, ordered by updatedAt DESC.
 */
export const fetchConversations = async (userId: string): Promise<Conversation[]> => {
  requireApiBaseUrl();
  const response = await fetch(
    `${API_BASE_URL}/api/messages/user/${encodeURIComponent(userId)}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Error al cargar conversaciones: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

/**
 * GET /api/messages/conversation/:conversationId
 * Returns { conversation, messages } — messages ordered by createdAt ASC.
 */
export const fetchConversationMessages = async (
  conversationId: string
): Promise<{ conversation: Conversation; messages: Message[] }> => {
  requireApiBaseUrl();
  const response = await fetch(
    `${API_BASE_URL}/api/messages/conversation/${encodeURIComponent(conversationId)}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(`Error al cargar mensajes: ${response.status}`);
  }

  return response.json();
};

/**
 * POST /api/messages/create
 * Sends a message to an existing conversation, or creates a new conversation
 * (when conversationId is omitted) and sends the first message.
 * Returns { conversation, message }.
 */
export const sendMessage = async (params: {
  conversationId?: string;
  senderId: string;
  senderName: string;
  content: string;
  // Required when creating a new conversation
  participantIds?: string[];
  productId?: string;
  orderId?: string;
}): Promise<{ conversation: Conversation; message: Message }> => {
  requireApiBaseUrl();
  const response = await fetch(`${API_BASE_URL}/api/messages/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Error al enviar mensaje: ${response.status}`);
  }

  return response.json();
};

/**
 * PUT /api/messages/:id/read
 * Marks a single message as read. Returns the updated Message object.
 */
export const markAsRead = async (messageId: string): Promise<Message> => {
  requireApiBaseUrl();
  const response = await fetch(
    `${API_BASE_URL}/api/messages/${encodeURIComponent(messageId)}/read`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Error al marcar mensaje como leído: ${response.status}`);
  }

  return response.json();
};

/**
 * DELETE /api/messages/:id
 * Deletes a message. Returns { msg: "Message deleted" }.
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  requireApiBaseUrl();
  const response = await fetch(
    `${API_BASE_URL}/api/messages/${encodeURIComponent(messageId)}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(`Error al eliminar mensaje: ${response.status}`);
  }
};
