import type { ProductRequest } from "./requests";

const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_ORDERS_API_BASE_URL ||
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

export interface ApiOrder {
  id: string;
  productId: string;
  productTitle: string;
  productCity?: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone?: string;
  requesterCity?: string;
  householdSize?: string;
  needLevel: string;
  reason: string;
  intendedUse?: string;
  pickupWindow: string;
  extraNotes?: string;
  evidence?: string;
  createdAt: string;
  status: string;
  score: number;
  scoreBreakdown: {
    firstTime: number;
    need: number;
    repeatPenalty: number;
    proximity: number;
    household: number;
  };
}

const toProductRequest = (order: ApiOrder): ProductRequest =>
  order as unknown as ProductRequest;

export const fetchOrders = async (): Promise<ProductRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("No se pudieron cargar las órdenes");
  }
  const data = (await response.json()) as ApiOrder[];
  return data.map(toProductRequest);
};

export const createOrder = async (
  payload: Omit<ProductRequest, "id" | "createdAt" | "status" | "score" | "scoreBreakdown">
): Promise<ProductRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let message = "No se pudo crear la orden";
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
  const created = (await response.json()) as ApiOrder;
  return toProductRequest(created);
};

export const updateOrder = async (
  orderId: string,
  updates: Partial<ProductRequest>
): Promise<ProductRequest> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error("No se pudo actualizar la orden");
  }
  const updated = (await response.json()) as ApiOrder;
  return toProductRequest(updated);
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("No se pudo eliminar la orden");
  }
};

export const getOrdersByProduct = async (
  productId: string
): Promise<ProductRequest[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/product/${productId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) {
    throw new Error("No se pudieron cargar las órdenes del producto");
  }
  const data = (await response.json()) as ApiOrder[];
  return data.map(toProductRequest);
};

export const getOrdersByUser = async (
  userId: string
): Promise<ProductRequest[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/orders/user/${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) {
    throw new Error("No se pudieron cargar las órdenes del usuario");
  }
  const data = (await response.json()) as ApiOrder[];
  return data.map(toProductRequest);
};
