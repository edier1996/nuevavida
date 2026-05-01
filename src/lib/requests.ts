export type NeedLevel = "alta" | "media" | "baja";

export type RequestStatus = "pending" | "in_review" | "selected" | "rejected" | "delivered";

export interface ProductRequest {
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
  needLevel: NeedLevel;
  reason: string;
  intendedUse?: string;
  pickupWindow: string;
  extraNotes?: string;
  evidence?: string;
  createdAt: string;
  status: RequestStatus;
  score: number;
  scoreBreakdown: {
    firstTime: number;
    need: number;
    repeatPenalty: number;
    proximity: number;
    household: number;
  };
}

const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_ORDERS_API_BASE_URL ||
    import.meta.env.VITE_ADMIN_API_BASE_URL ||
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

const API_BASE_URL = resolveApiBaseUrl();

type ApiRequest = Record<string, unknown>;

const toBackendStatus = (status: RequestStatus): string => {
  switch (status) {
    case "selected":
      return "accepted";
    case "delivered":
      return "completed";
    case "rejected":
      return "rejected";
    case "in_review":
    case "pending":
    default:
      return "pending";
  }
};

const fromBackendStatus = (status: unknown): RequestStatus => {
  if (status === "accepted") return "selected";
  if (status === "completed") return "delivered";
  if (status === "rejected") return "rejected";
  return "pending";
};

const toProductRequest = (item: ApiRequest): ProductRequest => ({
  id: String(item.id || ""),
  productId: String(item.productId || ""),
  productTitle: String(item.productTitle || `Producto ${item.productId || ""}`),
  productCity: typeof item.productCity === "string" ? item.productCity : undefined,
  requesterId: String(item.requesterId || ""),
  requesterName: String(item.requesterName || ""),
  requesterEmail: String(item.requesterEmail || ""),
  requesterPhone: typeof item.requesterPhone === "string" ? item.requesterPhone : undefined,
  requesterCity: typeof item.requesterCity === "string" ? item.requesterCity : undefined,
  householdSize: typeof item.householdSize === "string" ? item.householdSize : undefined,
  needLevel: (item.needLevel as NeedLevel) || "media",
  reason: String(item.reason || item.message || ""),
  intendedUse: typeof item.intendedUse === "string" ? item.intendedUse : undefined,
  pickupWindow: String(item.pickupWindow || ""),
  extraNotes: typeof item.extraNotes === "string" ? item.extraNotes : undefined,
  evidence: typeof item.evidence === "string" ? item.evidence : undefined,
  createdAt: String(item.createdAt || new Date().toISOString()),
  status: fromBackendStatus(item.status),
  score: typeof item.score === "number" ? item.score : 0,
  scoreBreakdown: item.scoreBreakdown ?? {
    firstTime: 0,
    need: 0,
    repeatPenalty: 0,
    proximity: 0,
    household: 0,
  },
});

export const getRequests = async (): Promise<ProductRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/orders`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar las solicitudes");
  }
  const data = (await response.json()) as ApiRequest[];
  return data.map(toProductRequest);
};

export const addRequest = async (
  payload: Omit<ProductRequest, "id" | "createdAt" | "status" | "score" | "scoreBreakdown">
): Promise<ProductRequest> => {
  const score =
    (payload.needLevel === "alta" ? 50 : payload.needLevel === "media" ? 30 : 10) +
    (payload.requesterCity && payload.productCity && payload.requesterCity === payload.productCity ? 20 : 0) +
    (payload.householdSize ? Math.min(Number(payload.householdSize) || 0, 6) : 0);

  const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: payload.productId,
      productTitle: payload.productTitle,
      productCity: payload.productCity,
      requesterId: payload.requesterId,
      requesterEmail: payload.requesterEmail,
      requesterName: payload.requesterName,
      requesterPhone: payload.requesterPhone,
      requesterCity: payload.requesterCity,
      householdSize: payload.householdSize,
      needLevel: payload.needLevel,
      reason: payload.reason,
      intendedUse: payload.intendedUse,
      pickupWindow: payload.pickupWindow,
      extraNotes: payload.extraNotes,
      evidence: payload.evidence,
      message: payload.reason,
      city: payload.requesterCity,
      donorId: null,
      score,
      scoreBreakdown: {
        firstTime: 0,
        need: payload.needLevel === "alta" ? 50 : payload.needLevel === "media" ? 30 : 10,
        repeatPenalty: 0,
        proximity: payload.requesterCity && payload.productCity && payload.requesterCity === payload.productCity ? 20 : 0,
        household: payload.householdSize ? Math.min(Number(payload.householdSize) || 0, 6) : 0,
      },
    }),
  });

  if (!response.ok) {
    const fallback = "No se pudo registrar la solicitud";
    let message = fallback;
    try {
      const data = await response.json();
      message =
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.message === "string" && data.message) ||
        fallback;
    } catch {
      // Keep fallback if body is not JSON.
    }
    throw new Error(message);
  }

  const created = (await response.json()) as ApiRequest;
  return toProductRequest(created);
};

export const updateRequestStatus = async (
  id: string,
  status: RequestStatus
): Promise<ProductRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: toBackendStatus(status) }),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el estado de la solicitud");
  }

  return getRequests();
};

export const getRequestsByProduct = async (productId: string): Promise<ProductRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/product/${encodeURIComponent(productId)}`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar las solicitudes del producto");
  }
  const data = (await response.json()) as ApiRequest[];
  return data.map(toProductRequest).sort(
    (a, b) =>
      b.score - a.score ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getRequestsByUser = async (userId: string): Promise<ProductRequest[]> => {
  const response = await fetch(`${API_BASE_URL}/api/orders/user/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar tus solicitudes");
  }
  const data = (await response.json()) as ApiRequest[];
  return data.map(toProductRequest).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};
